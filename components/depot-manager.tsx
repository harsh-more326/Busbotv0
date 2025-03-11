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
import type { Depot } from "@/lib/types"

export function DepotManager() {
  const [depots, setDepots] = useState<Depot[]>([])
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepots()
  }, [])

  const fetchDepots = async () => {
    try {
      const { data, error } = await supabase.from("depots").select("*").order("name")

      if (error) throw error
      setDepots(data || [])
    } catch (error) {
      console.error("Error fetching depots:", error)
      toast({
        title: "Error",
        description: "Failed to load depots",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepot = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!name || !latitude || !longitude) {
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

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Error",
        description: "Latitude and longitude must be valid numbers",
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

    setLoading(true)

    try {
      // Create new depot
      const { data, error } = await supabase
        .from("depots")
        .insert({
          name,
          latitude: lat,
          longitude: lng,
        })
        .select()
        .single()

      if (error) throw error

      // Update state
      setDepots([...depots, data])

      // Reset form
      setName("")
      setLatitude("")
      setLongitude("")

      toast({
        title: "Success",
        description: "Depot added successfully",
      })
    } catch (error) {
      console.error("Error adding depot:", error)
      toast({
        title: "Error",
        description: "Failed to add depot",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this depot?")) return

    setLoading(true)

    try {
      const { error } = await supabase.from("depots").delete().eq("id", id)

      if (error) throw error

      // Update state
      setDepots(depots.filter((depot) => depot.id !== id))

      toast({
        title: "Success",
        description: "Depot deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting depot:", error)
      toast({
        title: "Error",
        description: "Failed to delete depot",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depot Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleAddDepot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Depot Name</Label>
              <Input
                id="name"
                placeholder="Enter depot name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Depot
            </Button>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Existing Depots</h3>
            {loading ? (
              <div className="text-center py-4">Loading depots...</div>
            ) : depots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No depots found. Add one using the form above.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Latitude</TableHead>
                      <TableHead>Longitude</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depots.map((depot) => (
                      <TableRow key={depot.id}>
                        <TableCell>{depot.name}</TableCell>
                        <TableCell>{depot.latitude}</TableCell>
                        <TableCell>{depot.longitude}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDepot(depot.id)}>
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

