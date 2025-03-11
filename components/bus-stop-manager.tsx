"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { BusStop } from "@/lib/types"

export function BusStopManager() {
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [priority, setPriority] = useState("5")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusStops()
  }, [])

  const fetchBusStops = async () => {
    try {
      const { data, error } = await supabase.from("bus_stops").select("*").order("name")

      if (error) throw error
      setBusStops(data || [])
    } catch (error) {
      console.error("Error fetching bus stops:", error)
      toast({
        title: "Error",
        description: "Failed to load bus stops",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBusStop = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!name || !latitude || !longitude || !priority) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate coordinates
    const lat = Number.parseFloat(latitude)
    const lng = Number.parseFloat(longitude)
    const pri = Number.parseInt(priority)

    if (isNaN(lat) || isNaN(lng) || isNaN(pri)) {
      toast({
        title: "Error",
        description: "Latitude, longitude, and priority must be valid numbers",
        variant: "destructive",
      })
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Error",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        variant: "destructive",
      })
      return
    }

    if (pri < 1 || pri > 10) {
      toast({
        title: "Error",
        description: "Priority must be between 1 and 10",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create new bus stop
      const { data, error } = await supabase
        .from("bus_stops")
        .insert({
          name,
          latitude: lat,
          longitude: lng,
          priority: pri,
        })
        .select()
        .single()

      if (error) throw error

      // Update state
      setBusStops([...busStops, data])

      // Reset form
      setName("")
      setLatitude("")
      setLongitude("")
      setPriority("5")

      toast({
        title: "Success",
        description: "Bus stop added successfully",
      })
    } catch (error) {
      console.error("Error adding bus stop:", error)
      toast({
        title: "Error",
        description: "Failed to add bus stop",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBusStop = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus stop?")) return

    setLoading(true)

    try {
      const { error } = await supabase.from("bus_stops").delete().eq("id", id)

      if (error) throw error

      // Update state
      setBusStops(busStops.filter((stop) => stop.id !== id))

      toast({
        title: "Success",
        description: "Bus stop deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting bus stop:", error)
      toast({
        title: "Error",
        description: "Failed to delete bus stop",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bus Stop Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleAddBusStop} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stop Name</Label>
              <Input
                id="name"
                placeholder="Enter stop name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="e.g. 19.0760"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="e.g. 72.8777"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bus Stop
            </Button>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Existing Bus Stops</h3>
            {loading ? (
              <div className="text-center py-4">Loading bus stops...</div>
            ) : busStops.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No bus stops found. Add one using the form above.
              </div>
            ) : (
              <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Latitude</TableHead>
                      <TableHead>Longitude</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busStops.map((stop) => (
                      <TableRow key={stop.id}>
                        <TableCell>{stop.name}</TableCell>
                        <TableCell>{stop.latitude}</TableCell>
                        <TableCell>{stop.longitude}</TableCell>
                        <TableCell>{stop.priority}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBusStop(stop.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <Toaster />
    </Card>
  )
}

