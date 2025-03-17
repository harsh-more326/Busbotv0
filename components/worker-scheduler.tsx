"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Worker, OptimizedRoute, WorkerSchedule } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function WorkerScheduler() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [routes, setRoutes] = useState<OptimizedRoute[]>([])
  const [schedules, setSchedules] = useState<WorkerSchedule[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [workerId, setWorkerId] = useState("")
  const [routeId, setRouteId] = useState("")
  const [shiftId, setShiftId] = useState("")
  const [loading, setLoading] = useState(true)

  const shifts = [
    { id: "morning", name: "Morning (6:00 AM - 2:00 PM)" },
    { id: "afternoon", name: "Afternoon (2:00 PM - 10:00 PM)" },
    { id: "night", name: "Night (10:00 PM - 1:00 AM)" },
  ]

  useEffect(() => {
    Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("optimized_routes").select("*").order("name"),
      supabase.from("schedule").select("*, workers(*), optimized_routes(*)").order("date"),
    ])
      .then(([workersResponse, routesResponse, schedulesResponse]) => {
        if (workersResponse.error) throw workersResponse.error
        if (routesResponse.error) throw routesResponse.error
        if (schedulesResponse.error) throw schedulesResponse.error

        setWorkers(workersResponse.data || [])
        setRoutes(routesResponse.data || [])
        setSchedules(schedulesResponse.data || [])
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setDate(format(date, "yyyy-MM-dd"))
    }
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!date || !workerId || !routeId || !shiftId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check for conflicts
    const hasConflict = schedules.some(
      (schedule) =>
        schedule.date === date &&
        (schedule.worker_id === workerId || schedule.route_id === routeId) &&
        schedule.shift === shiftId,
    )

    if (hasConflict) {
      toast({
        title: "Scheduling Conflict",
        description: "This worker or route is already scheduled for this time",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create new schedule
      const { data, error } = await supabase
        .from("schedule")
        .insert({
          date,
          worker_id: workerId,
          route_id: routeId,
          shift: shiftId
        })
        .select("*, workers(*), optimized_routes(*)")

      if (error) {
        console.error("Error adding schedule:", error)
        throw error
      }

      // Add the new schedule to the existing list
      setSchedules((prevSchedules) => [...prevSchedules, ...data])

      // Reset form values except date
      setWorkerId("")
      setRouteId("")
      setShiftId("")

      // Show success message
      toast({
        title: "Success",
        description: "Worker schedule added successfully",
      })
    } catch (error) {
      console.error("Error adding schedule:", error)
      toast({
        title: "Error",
        description: "Failed to add schedule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return

    setLoading(true)

    try {
      const { error } = await supabase.from("schedule").delete().eq("id", id)

      if (error) throw error

      setSchedules(schedules.filter((schedule) => schedule.id !== id))

      toast({
        title: "Success",
        description: "Schedule removed successfully",
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !workers.length) {
    return <div className="text-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Workers</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker">Worker *</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger id="worker">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.length > 0 ? (
                    workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-workers" disabled>
                      No workers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route">Route *</Label>
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger id="route">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.length > 0 ? (
                    routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name || `Route ${route.id.substring(0, 8)}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-routes" disabled>
                      No routes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift *</Label>
              <Select value={shiftId} onValueChange={setShiftId}>
                <SelectTrigger id="shift">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || workers.length === 0 || routes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-medium mb-4">Current Schedules</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No schedules found. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const worker = schedule.workers
                  const route = schedule.optimized_routes
                  const shift = shifts.find((s) => s.id === schedule.shift)

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.date}</TableCell>
                      <TableCell>{worker?.name || schedule.worker_id}</TableCell>
                      <TableCell>{route?.name || `Route ${schedule.route_id.substring(0, 8)}`}</TableCell>
                      <TableCell>{shift?.name || schedule.shift}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Toaster />
    </div>
  )
}