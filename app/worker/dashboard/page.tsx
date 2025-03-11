"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, LogOut, Calendar, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { WorkerSchedule } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function WorkerDashboard() {
  // In a real app, this would come from authentication
  const workerId = "worker-1" // Placeholder worker ID
  const [workerSchedule, setWorkerSchedule] = useState<WorkerSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true)
      setError(null)
  
      try {
        // Using eq filter to only get schedules for this specific worker
        const { data, error } = await supabase
          .from("worker_schedules")
          .select("*, workers!worker_schedules_worker_id_fkey(*), optimized_routes(*)")
          .eq("worker_id", workerId) // Filter for this specific worker
          .order("date")
  
        if (error) {
          console.error("Error loading data:", error)
          setError("Failed to load your schedule. Please try again later.")
          toast({
            title: "Error",
            description: "Could not load your schedule",
            variant: "destructive",
          })
          return
        }
  
        setWorkerSchedule(data || [])
      } catch (error) {
        console.error("Error fetching worker schedule:", error)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
  
    fetchSchedule()
  }, [workerId, toast])
  
  const shifts = {
    morning: "Morning (6:00 AM - 2:00 PM)",
    afternoon: "Afternoon (2:00 PM - 10:00 PM)",
    night: "Night (10:00 PM - 6:00 AM)",
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Worker Dashboard</h1>
          <div className="flex gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 gap-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Schedule</CardTitle>
                <CardDescription>View your assigned routes and shifts</CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading your schedule...</div>
              ) : workerSchedule.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No schedules assigned to you yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workerSchedule.map((schedule) => {
                      const route = schedule.optimized_routes
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell>{formatDate(schedule.date)}</TableCell>
                          <TableCell>
                            {route?.name || (schedule.route_id ? `Route ${schedule.route_id.substring(0, 8)}` : 'No route assigned')}
                          </TableCell>
                          <TableCell>{shifts[schedule.shift as keyof typeof shifts] || schedule.shift}</TableCell>
                          <TableCell>
                            {schedule.route_id ? (
                              <Link href={`/map?route=${schedule.route_id}`}>
                                <Button variant="outline" size="sm">
                                  View Route
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                No Route
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}