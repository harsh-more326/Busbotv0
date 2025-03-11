"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Edit, X, Save } from "lucide-react"
import type { BusStop } from "@/lib/types"
import { getBusStops, addBusStop, updateBusStop } from "@/lib/api"

// Fix Leaflet icon issues - moved to utility function to prevent re-creation
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Define marker icons centrally to avoid recreating them
const createMarkerIcons = () => {
  return {
    newStop: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }),
    existingStop: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [20, 32],
      iconAnchor: [10, 32],
      popupAnchor: [1, -28],
      shadowSize: [32, 32],
    }),
    editingStop: new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  }
}

interface AdminMapProps {
  onAddStop: (stop: BusStop) => void
  onUpdateStop?: (stop: BusStop) => void
}

export default function AdminMap({ onAddStop, onUpdateStop }: AdminMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [name, setName] = useState("")
  const [priority, setPriority] = useState(1)
  const [allStops, setAllStops] = useState<BusStop[]>([])
  const markerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const markerIcons = useRef(typeof window !== 'undefined' ? createMarkerIcons() : null)
  const mapInitializedRef = useRef(false)
  const stopIdsRef = useRef(new Set<string>())
  // Debounce timer ref
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStop, setEditingStop] = useState<BusStop | null>(null)

  // Reset form function to avoid duplication
  const resetForm = useCallback(() => {
    setName("")
    setPriority(1)
    setSelectedLocation(null)
    setIsEditMode(false)
    setEditingStop(null)

    // Remove marker
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [])

  // Handle map click with debouncing
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    // If we're in edit mode, ignore map clicks
    if (isEditMode) return
    
    // Clear any pending click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }
    
    // Set a timeout of 300ms to debounce rapid clicks
    clickTimeoutRef.current = setTimeout(() => {
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        toast({
          title: "Error",
          description: "Invalid coordinates selected",
          variant: "destructive",
        })
        return
      }
      
      setSelectedLocation({ latitude: lat, longitude: lng })

      // Remove previous marker if exists
      if (markerRef.current) {
        markerRef.current.remove()
      }

      // Add new marker
      if (mapRef.current && markerIcons.current) {
        markerRef.current = L.marker([lat, lng], {
          icon: markerIcons.current.newStop
        }).addTo(mapRef.current)

        markerRef.current.bindPopup("New Bus Stop Location").openPopup()
      }
    }, 300)
  }, [isEditMode])

  // Fetch stops once on mount
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const stops = await getBusStops()
        setAllStops(stops)
        
        // Initialize stopIdsRef with existing stop IDs
        stopIdsRef.current = new Set(stops.map(stop => stop.id))
      } catch (error) {
        console.error("Error fetching bus stops:", error)
        toast({
          title: "Error",
          description: "Failed to load existing bus stops",
          variant: "destructive",
        })
      }
    }
    
    fetchStops()
    
    // Cleanup timeout on unmount
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    // Make sure we only initialize the map once and only on the client side
    if (typeof window !== 'undefined' && !mapRef.current && !mapInitializedRef.current) {
      fixLeafletIcons()
      mapInitializedRef.current = true

      // Create a markers layer group to manage all markers
      const markersLayer = L.layerGroup()
      markersLayerRef.current = markersLayer
      
      // Center on Mumbai
      const map = L.map("admin-map").setView([19.076, 72.8777], 11)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)
      
      // Add markers layer to map
      markersLayer.addTo(map)

      // Add click event to map with the debounced handler
      map.on("click", handleMapClick)

      mapRef.current = map
    }

    // Clean up function
    return () => {
      if (mapRef.current) {
        // Remove click handler first
        mapRef.current.off("click", handleMapClick)
        // Then remove the map
        mapRef.current.remove()
        mapRef.current = null
        mapInitializedRef.current = false
      }
      
      // Clear marker reference
      if (markerRef.current) {
        markerRef.current = null
      }
      
      // Clear markers layer reference
      if (markersLayerRef.current) {
        markersLayerRef.current = null
      }
    }
  }, [handleMapClick]) // Include handleMapClick in dependencies

  // Handle bus stop click for editing
  const handleBusStopClick = useCallback((stop: BusStop) => {
    // If already in edit mode, finish that first
    if (isEditMode) {
      toast({
        title: "Warning",
        description: "Please finish editing the current bus stop first",
        variant: "destructive",
      })
      return
    }

    // Set edit mode
    setIsEditMode(true)
    setEditingStop(stop)
    
    // Fill form with stop data
    setName(stop.name)
    setPriority(stop.priority)
    setSelectedLocation({ latitude: stop.latitude, longitude: stop.longitude })

    // Remove previous marker if exists
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Add editing marker
    if (mapRef.current && markerIcons.current) {
      markerRef.current = L.marker([stop.latitude, stop.longitude], {
        icon: markerIcons.current.editingStop
      }).addTo(mapRef.current)

      markerRef.current.bindPopup(`Editing: ${stop.name}`).openPopup()
    }
  }, [isEditMode])

  // Update markers when allStops changes or when map is initialized
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !markerIcons.current) {
      return; // Exit if map or markers layer isn't initialized yet
    }
    
    // Clear existing markers
    markersLayerRef.current.clearLayers()
    
    // Add all existing bus stops to the map
    allStops.forEach((stop) => {
      // Check if latitude and longitude exist and are valid numbers
      if (
        stop && 
        typeof stop.latitude === 'number' && 
        typeof stop.longitude === 'number' && 
        !isNaN(stop.latitude) && 
        !isNaN(stop.longitude)
      ) {
        const marker = L.marker([stop.latitude, stop.longitude], {
          icon: markerIcons.current!.existingStop
        })

        // Create popup content
        const popupContent = document.createElement('div')
        popupContent.innerHTML = `
          <strong>${stop.name}</strong><br>
          Priority: ${stop.priority}<br>
        `
        
        // Add edit button to popup
        const editButton = document.createElement('button')
        editButton.innerText = 'Edit'
        editButton.className = 'mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs'
        editButton.onclick = () => handleBusStopClick(stop)
        popupContent.appendChild(editButton)
        
        marker.bindPopup(popupContent)
        markersLayerRef.current!.addLayer(marker)
      } else {
        console.warn("Skipping invalid bus stop:", stop)
      }
    })
  }, [allStops, handleBusStopClick])

  const handleAddStop = async () => {
    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "Please select a location on the map",
        variant: "destructive",
      })
      return
    }

    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a name for the bus stop",
        variant: "destructive",
      })
      return
    }

    try {
      const now = new Date().toISOString();
      
      // Only include fields that are definitely in your database schema
      // Remove address, city, zipCode that caused the 400 error
      const newStop = {
        name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        priority,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        notes: "",
        // Remove these fields as they don't exist in your schema
        // address: "", 
        // city: "",
        // zipCode: "",
      }

      const addedStop = await addBusStop(newStop)

      // Update local state
      setAllStops((prevStops) => [...prevStops, addedStop])
      
      // Track the new stop ID
      if (addedStop.id) {
        stopIdsRef.current.add(addedStop.id)
      }

      // Call the parent component's onAddStop
      onAddStop(addedStop)

      // Reset form using the consolidated function
      resetForm()

      toast({
        title: "Success",
        description: "Bus stop added successfully",
      })
    } catch (error) {
      console.error("Error adding bus stop:", error)
      toast({
        title: "Error",
        description: "Failed to add bus stop. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStop = async () => {
    if (!editingStop || !selectedLocation) {
      toast({
        title: "Error",
        description: "No stop selected for editing",
        variant: "destructive",
      })
      return
    }

    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a name for the bus stop",
        variant: "destructive",
      })
      return
    }

    try {
      const now = new Date().toISOString();
      
      // Create a new object with only the fields from the original stop
      // to avoid sending fields that don't exist in the database
      const updatedStop = {
        ...editingStop,
        name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        priority,
        updatedAt: now,
      }

      // Remove any fields that might not be in the database
      // If these fields don't exist in your schema, delete them
      // delete updatedStop.address;
      // delete updatedStop.city;
      // delete updatedStop.zipCode;

      // Call API to update bus stop
      const result = await updateBusStop(updatedStop)

      // Update local state
      setAllStops((prevStops) => 
        prevStops.map(stop => 
          stop.id === result.id ? result : stop
        )
      )
      
      // Call the parent component's onUpdateStop if provided
      if (onUpdateStop) {
        onUpdateStop(result)
      }

      // Reset form using the consolidated function
      resetForm()

      toast({
        title: "Success",
        description: "Bus stop updated successfully",
      })
    } catch (error) {
      console.error("Error updating bus stop:", error)
      toast({
        title: "Error",
        description: "Failed to update bus stop. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    resetForm()
    toast({
      title: "Edit Cancelled",
      description: "No changes were made to the bus stop",
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode 
              ? `Edit Bus Stop: ${editingStop?.name}` 
              : "Add Bus Stop by Clicking on Map"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] relative rounded-md overflow-hidden border mb-4">
            <div id="admin-map" className="w-full h-full" />
          </div>

          {selectedLocation && (
            <div className="space-y-4 p-4 border rounded-md bg-slate-50">
              <div className="text-sm text-muted-foreground mb-2">
                Selected Location: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {isEditMode ? (
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateStop} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAddStop} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bus Stop
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}