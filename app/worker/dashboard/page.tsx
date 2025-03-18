"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function WorkerDashboard() {
  const searchParams = useSearchParams()
  const workerId = searchParams.get("worker_id") // 🔹 Get worker ID from URL
  const [worker, setWorker] = useState(null)
  const [workerSchedule, setWorkerSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!workerId) {
      setError("Worker ID is missing in the URL.")
      setLoading(false)
      return
    }

    const fetchWorkerDetails = async () => {
      setError(null)

      // 🔹 Fetch worker details
      const { data: workerData, error: workerError } = await supabase
        .from("workers")
        .select("id, name, phone_number, role")
        .eq("id", workerId)
        .single()

      if (workerError || !workerData) {
        setError("Worker details not found.")
        return
      }

      setWorker(workerData)
      fetchSchedule(workerData.id)
    }

    const fetchSchedule = async (workerId) => {
      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("schedule")
          .select("*, optimized_routes(*, depots:depot_id(name)), routes:route_id(*, stops)") // 🔹 Fetch route and depot name
          .eq("worker_id", workerId)
          .order("date")

        if (error) {
          setError("Failed to load schedule.")
          toast({ title: "Error", description: "Could not load your schedule", variant: "destructive" })
          return
        }

        setWorkerSchedule(data || [])
      } catch (error) {
        setError("Unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkerDetails()
  }, [workerId, toast])

  // 🔹 Handle View Route Function
  const handleViewRoute = (route) => {
    try {
      if (!route || !route.stops || route.stops.length === 0) {
        alert("No route data available.");
        return;
      }

      // Encode route data
      const routeData = JSON.stringify({
        name: route.name,
        waypoints: route.stops,
      });

      // Open route in a new tab
      const mapWindow = window.open(`/route-map?data=${encodeURIComponent(routeData)}`, "_blank");
      if (!mapWindow) {
        console.error("Popup was blocked. Please allow popups for this site.");
      }
    } catch (err) {
      console.error("Error opening route map:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 🔹 Navbar */}
      <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between">
        <h1 className="text-2xl font-bold text-primary">Worker Dashboard</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline"><Home className="h-4 w-4 mr-2" /> Home</Button>
          </Link>
        </div>
      </header>

      {/* 🔹 Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 🔹 Worker Details */}
        {worker && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Worker Information</CardTitle>
              <CardDescription>Details of the logged-in worker</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {worker.name}</p>
              <p><strong>Phone Number:</strong> {worker.phone_number}</p>
              <p><strong>Role:</strong> {worker.role}</p>
            </CardContent>
          </Card>
        )}

        {/* 🔹 Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Schedule</CardTitle>
            <CardDescription>View assigned routes and shifts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading schedule...</p>
            ) : workerSchedule.length === 0 ? (
              <p>No schedules assigned.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerSchedule.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.date}</TableCell>
                      <TableCell>{schedule.routes?.name || "No route"}</TableCell>
                      <TableCell>{schedule.optimized_routes?.depots?.name || "Unknown"}</TableCell>
                      <TableCell>{schedule.shift}</TableCell>
                      <TableCell>
                        {schedule.routes ? (
                          <Button variant="outline" onClick={() => handleViewRoute(schedule.routes)}>
                            View Route
                          </Button>
                        ) : (
                          <Button variant="outline" disabled>No Route</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
