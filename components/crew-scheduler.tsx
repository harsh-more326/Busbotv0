"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import type { BusRoute } from "@/lib/types"

interface CrewSchedulerProps {
  routes: BusRoute[]
}

export function CrewScheduler({ routes }: CrewSchedulerProps) {
  // Mock crew members
  const crewMembers = [
    { id: "crew-1", name: "John Smith" },
    { id: "crew-2", name: "Maria Garcia" },
    { id: "crew-3", name: "David Johnson" },
    { id: "crew-4", name: "Sarah Williams" },
    { id: "crew-5", name: "Michael Brown" },
  ]

  const shifts = [
    { id: "morning", name: "Morning (6:00 AM - 2:00 PM)" },
    { id: "afternoon", name: "Afternoon (2:00 PM - 10:00 PM)" },
    { id: "night", name: "Night (10:00 PM - 6:00 AM)" },
  ]

  const [schedules, setSchedules] = useState<any[]>([
    { id: 1, date: "2025-03-01", crewId: "crew-1", routeId: "route-1", shiftId: "morning" },
    { id: 2, date: "2025-03-01", crewId: "crew-2", routeId: "route-2", shiftId: "afternoon" },
    { id: 3, date: "2025-03-02", crewId: "crew-3", routeId: "route-3", shiftId: "night" },
  ])

  const [date, setDate] = useState("")
  const [crewId, setCrewId] = useState("")
  const [routeId, setRouteId] = useState("")
  const [shiftId, setShiftId] = useState("")

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!date || !crewId || !routeId || !shiftId) {
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
        (schedule.crewId === crewId || schedule.routeId === routeId) &&
        schedule.shiftId === shiftId,
    )

    if (hasConflict) {
      toast({
        title: "Scheduling Conflict",
        description: "This crew member or route is already scheduled for this time",
        variant: "destructive",
      })
      return
    }

    // Create new schedule
    const newSchedule = {
      id: schedules.length + 1,
      date,
      crewId,
      routeId,
      shiftId,
    }

    // Add the schedule
    setSchedules([...schedules, newSchedule])

    // Reset form
    setDate("")
    setCrewId("")
    setRouteId("")
    setShiftId("")

    // Show success message
    toast({
      title: "Success",
      description: "Crew schedule added successfully",
    })
  }

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id))
    toast({
      title: "Success",
      description: "Schedule removed successfully",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <div className="flex">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="flex-1"
                />
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50 self-center" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crew">Crew Member *</Label>
              <Select value={crewId} onValueChange={setCrewId}>
                <SelectTrigger id="crew">
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {crewMembers.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      {crew.name}
                    </SelectItem>
                  ))}
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
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
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
              <Button type="submit" className="w-full">
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
                <TableHead>Crew Member</TableHead>
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
                  const crew = crewMembers.find((c) => c.id === schedule.crewId)
                  const route = routes.find((r) => r.id === schedule.routeId)
                  const shift = shifts.find((s) => s.id === schedule.shiftId)

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.date}</TableCell>
                      <TableCell>{crew?.name || schedule.crewId}</TableCell>
                      <TableCell>{route?.name || schedule.routeId}</TableCell>
                      <TableCell>{shift?.name || schedule.shiftId}</TableCell>
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

