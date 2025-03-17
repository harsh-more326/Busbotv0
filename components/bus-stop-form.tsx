"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { MapPin, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { createClient } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

// BusStop interface
export interface BusStop {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  priority: number;
}

// Initialize Supabase client
const supabaseUrl = 'https://vouxrjvgsishauzfqlyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdXhyanZnc2lzaGF1emZxbHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2OTIyNzksImV4cCI6MjA1MzI2ODI3OX0.7FQ8Iifb4_8j39lpK9ckYjqnxjifGCCxAr73HhHJUfE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function BusStopManager() {
  // Form state
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [priority, setPriority] = useState<number>(5) // Default priority 5 (middle of 1-10 scale)
  
  // Bus stops list state
  const [stops, setStops] = useState<BusStop[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentStop, setCurrentStop] = useState<BusStop | null>(null)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editLatitude, setEditLatitude] = useState("")
  const [editLongitude, setEditLongitude] = useState("")
  const [editPriority, setEditPriority] = useState(5)

  // Fetch bus stops on component mount
  useEffect(() => {
    fetchBusStops()
  }, [])

  const fetchBusStops = async () => {
    setLoading(true)
    setFetchError(null)
    
    try {
      // Get bus stops from Supabase
      const { data, error } = await supabase
        .from('bus_stops')
        .select('*')
        .order('priority', { ascending: false })
        .order('name')
      
      if (error) {
        setFetchError(`Error: ${error.message}`)
        throw error
      }
      
      if (data) {
        // Convert database fields to match interface
        const formattedData: BusStop[] = data.map(stop => ({
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          priority: stop.priority
        }))
        
        setStops(formattedData)
      } else {
        console.log('No data found')
        setStops([])
      }
    } catch (error) {
      console.error('Error fetching bus stops:', error)
      toast({
        title: "Error",
        description: "Failed to load bus stops from database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Create new bus stop
    const newStop: BusStop = {
      id: crypto.randomUUID(), // Generate UUID for the new stop
      name,
      latitude: lat,
      longitude: lng,
      priority
    }

    try {
      // Insert into Supabase - using only the column names that exist in the database
      const { data, error } = await supabase
        .from('bus_stops')
        .insert([{
          id: newStop.id,
          name: newStop.name,
          latitude: newStop.latitude,
          longitude: newStop.longitude,
          priority: newStop.priority
        }])
        .select()

      if (error) {
        throw error
      }

      // Refresh stops list
      fetchBusStops()

      // Reset form
      setName("")
      setLatitude("")
      setLongitude("")
      setPriority(5)

      // Show success message
      toast({
        title: "Success", 
        description: "Bus stop added successfully",
      })
    } catch (error) {
      console.error('Error adding bus stop:', error)
      toast({
        title: "Error",
        description: "Failed to add bus stop to database. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (stop: BusStop) => {
    setCurrentStop(stop)
    setEditName(stop.name)
    setEditLatitude(stop.latitude.toString())
    setEditLongitude(stop.longitude.toString())
    setEditPriority(stop.priority)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentStop) return

    // Validate inputs
    if (!editName || !editLatitude || !editLongitude) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate coordinates
    const lat = Number.parseFloat(editLatitude)
    const lng = Number.parseFloat(editLongitude)

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

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('bus_stops')
        .update({
          name: editName,
          latitude: lat,
          longitude: lng,
          priority: editPriority
        })
        .eq('id', currentStop.id)

      if (error) {
        throw error
      }

      // Update local state
      setStops(stops.map(stop => 
        stop.id === currentStop.id 
          ? { ...stop, name: editName, latitude: lat, longitude: lng, priority: editPriority }
          : stop
      ))

      // Close dialog
      setIsEditDialogOpen(false)
      setCurrentStop(null)
      
      toast({
        title: "Success",
        description: "Bus stop updated successfully",
      })
    } catch (error) {
      console.error('Error updating bus stop:', error)
      toast({
        title: "Error",
        description: "Failed to update bus stop. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (stop: BusStop) => {
    setCurrentStop(stop)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!currentStop) return

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('bus_stops')
        .delete()
        .eq('id', currentStop.id)

      if (error) {
        throw error
      }

      // Remove the deleted stop from the state
      setStops(stops.filter(stop => stop.id !== currentStop.id))
      
      // Close dialog
      setIsDeleteDialogOpen(false)
      setCurrentStop(null)
      
      toast({
        title: "Success",
        description: "Bus stop deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting bus stop:', error)
      toast({
        title: "Error",
        description: "Failed to delete bus stop. Please try again.",
        variant: "destructive",
      })
    }
  }

  const viewOnMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const getPriorityLabel = (priority: number) => {
    if (priority <= 3) return "Low"
    if (priority <= 7) return "Medium"
    return "High"
  }

  const getPriorityClass = (priority: number) => {
    if (priority <= 3) return "text-blue-500"
    if (priority <= 7) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stop Name *</Label>
              <Input
                id="name"
                placeholder="Enter stop name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="e.g. 40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="e.g. -74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Priority slider with 1-10 scale */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="priority">Priority: {getPriorityLabel(priority)}</Label>
                <span className={`text-sm font-medium ${getPriorityClass(priority)}`}>
                  {priority}/10
                </span>
              </div>
              <Slider
                id="priority"
                min={1}
                max={10}
                step={1}
                value={[priority]}
                onValueChange={(value) => setPriority(value[0])}
                className="cursor-pointer"
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Bus Stop
            </Button>
          </form>
        </Card>

        <div>
          <h3 className="text-lg font-medium mb-4">Ensure These points while Adding Bus Stops</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <span>Ensure stops are placed on valid locations (not in water or on buildings)</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <span>Place stops at logical locations like intersections or near important facilities</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <span>Set appropriate priority level (1-10) based on stop importance</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <span>Add descriptive names to make stops easily identifiable</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bus Stops List Section */}
      <Card className="w-full mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Bus Stops
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBusStops}
            disabled={loading}
          >
            Refresh List
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : fetchError ? (
            <div className="text-center py-6 text-destructive">
              {fetchError}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={fetchBusStops}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : stops.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No bus stops found. Add your first bus stop above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stops.map((stop) => (
                    <TableRow key={stop.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {stop.id?.substring(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{stop.name}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getPriorityClass(stop.priority)}`}>
                            {stop.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({getPriorityLabel(stop.priority)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewOnMap(stop.latitude, stop.longitude)}
                            title="View on map"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(stop)}
                            title="Edit bus stop"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(stop)}
                            className="text-destructive hover:text-destructive"
                            title="Delete bus stop"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bus Stop</DialogTitle>
            <DialogDescription>
              Update the details for this bus stop.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Stop Name *</Label>
              <Input
                id="editName"
                placeholder="Enter stop name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLatitude">Latitude *</Label>
                <Input
                  id="editLatitude"
                  placeholder="e.g. 40.7128"
                  value={editLatitude}
                  onChange={(e) => setEditLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLongitude">Longitude *</Label>
                <Input
                  id="editLongitude"
                  placeholder="e.g. -74.0060"
                  value={editLongitude}
                  onChange={(e) => setEditLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Priority slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="editPriority">Priority: {getPriorityLabel(editPriority)}</Label>
                <span className={`text-sm font-medium ${getPriorityClass(editPriority)}`}>
                  {editPriority}/10
                </span>
              </div>
              <Slider
                id="editPriority"
                min={1}
                max={10}
                step={1}
                value={[editPriority]}
                onValueChange={(value) => setEditPriority(value[0])}
                className="cursor-pointer"
              />
            </div>

            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bus Stop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bus stop? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentStop && (
            <div className="py-4">
              <div className="mb-4 p-4 border rounded-md bg-muted/50">
                <p className="font-medium">{currentStop.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Coordinates: {currentStop.latitude.toFixed(6)}, {currentStop.longitude.toFixed(6)}
                </p>
                <p className="text-sm mt-1">
                  Priority: <span className={getPriorityClass(currentStop.priority)}>
                    {currentStop.priority} ({getPriorityLabel(currentStop.priority)})
                  </span>
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Bus Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}