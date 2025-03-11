"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine/dist/leaflet-routing-machine.css"
import "leaflet-routing-machine"
import type { BusStop, BusRoute } from "@/lib/types"
import { useTheme } from "@/components/theme-provider"

// Fix Leaflet icon issues
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Custom blue bus stop icon
const busStopIcon = () => new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32],
})

interface BusRouteMapProps {
  busStops: BusStop[]
  currentRoute: BusRoute
}

export default function BusRouteMap({ busStops, currentRoute }: BusRouteMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const routingControlRef = useRef<L.Routing.Control | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const routePolylineRef = useRef<L.Polyline | null>(null)
  const { theme } = useTheme()
  const [mapInitialized, setMapInitialized] = useState(false)
  const [allStops, setAllStops] = useState<BusStop[]>(busStops)

  // Clear all map layers for clean updates
  const clearMapLayers = () => {
    if (!mapRef.current) return
    
    // Clear previous route control
    if (routingControlRef.current) {
      routingControlRef.current.remove()
      routingControlRef.current = null
    }
    
    // Clear previous polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove()
      routePolylineRef.current = null
    }
    
    // Clear all markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove()
      } catch (error) {
        console.error("Error removing marker:", error)
      }
    })
    markersRef.current = []
  }

  // Initialize map only once on component mount
  useEffect(() => {
    // Initialize Leaflet icons
    try {
      fixLeafletIcons()
    } catch (error) {
      console.error("Error fixing Leaflet icons:", error)
    }

    // Get stops from localStorage if available
    try {
      const storedStops = localStorage.getItem("bus-stops")
      if (storedStops) {
        const parsed = JSON.parse(storedStops)
        if (Array.isArray(parsed)) {
          setAllStops(parsed)
        }
      }
    } catch (error) {
      console.error("Error loading stops from localStorage:", error)
    }

    // Wait for DOM to be ready
    const initMap = () => {
      // Ensure the map container exists
      const mapContainer = document.getElementById("map")
      if (!mapContainer) {
        console.error("Map container not found")
        return false
      }

      try {
        // Initialize map with Mumbai center
        const map = L.map("map").setView([19.076, 72.8777], 11)
        
        // Add initial tile layer
        const tileLayer = theme === "dark"
          ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              maxZoom: 19,
            })
          : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            })
        
        tileLayer.addTo(map)
        
        // Store map reference
        mapRef.current = map
        
        // Map is now initialized
        setMapInitialized(true)
        return true
      } catch (error) {
        console.error("Error initializing map:", error)
        return false
      }
    }

    // Try to initialize the map, with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!mapRef.current) {
        initMap()
      }
    }, 100)

    // Clean up on component unmount
    return () => {
      clearTimeout(timeoutId)
      
      if (mapRef.current) {
        try {
          clearMapLayers()
          mapRef.current.remove()
        } catch (error) {
          console.error("Error cleaning up map:", error)
        }
        
        mapRef.current = null
        setMapInitialized(false)
      }
    }
  }, []) // Empty deps array - only run on mount/unmount

  // Update map when theme changes
  useEffect(() => {
    if (!mapRef.current) return
    
    try {
      // Remove existing tile layers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current?.removeLayer(layer)
        }
      })

      // Add new tile layer based on theme
      const tileLayer = theme === "dark"
        ? L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          })
        : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })

      tileLayer.addTo(mapRef.current)
    } catch (error) {
      console.error("Error updating map tiles:", error)
    }
  }, [theme])

  // Update route when currentRoute, busStops, or map initialization changes
  useEffect(() => {
    // Check if map is ready
    if (!mapInitialized || !mapRef.current) return
    
    try {
      // Clear previous layers
      clearMapLayers()

      // Verify we have a current route with stop IDs
      if (!currentRoute || !Array.isArray(currentRoute.stopIds)) {
        console.warn("Invalid currentRoute or stopIds")
        return
      }

      // Get the stops for the current route
      const routeStops = currentRoute.stopIds
        .map((stopId) => allStops.find((s) => s.id === stopId))
        .filter((stop): stop is BusStop => !!stop)

      // Need at least 2 stops to draw a route
      if (routeStops.length < 2) {
        console.warn("Not enough stops to draw route")
        return
      }
      
      // Verify all stops have valid coordinates
      const validRouteStops = routeStops.filter(
        stop => typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
      )
      
      if (validRouteStops.length < 2) {
        console.warn("Not enough stops with valid coordinates")
        return
      }

      // Try routing API first
      try {
        // Create waypoints for all stops
        const waypoints = validRouteStops.map(stop => 
          L.latLng(stop.latitude, stop.longitude)
        )

        // Initialize the router with OSRM
        const router = L.Routing.osrm({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "driving",
          timeout: 30 * 1000, // 30 seconds timeout
        })

        // Create routing control with all waypoints
        const routingControl = L.Routing.control({
          waypoints: waypoints,
          router: router,
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          lineOptions: {
            styles: [{ color: "#e53e3e", opacity: 0.8, weight: 6 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0,
          },
          createMarker: () => null, // Don't create markers for waypoints
        })
        
        // Only add to map if it exists
        if (mapRef.current) {
          routingControl.addTo(mapRef.current)
          
          // Hide the routing control sidebar
          const container = routingControl.getContainer()
          if (container) {
            container.style.display = "none"
          }
          
          routingControlRef.current = routingControl
        }
      } catch (error) {
        console.error("Error with routing machine:", error)
        throw error // Propagate to fallback
      }

      // Add markers for all route stops
      const markers: L.Marker[] = []
      
      if (mapRef.current) {
        for (const stop of validRouteStops) {
          try {
            const marker = L.marker([stop.latitude, stop.longitude], {
              icon: busStopIcon()
            })
            
            marker.addTo(mapRef.current)
            marker.bindPopup(`<strong>${stop.name}</strong><br>ID: ${stop.id}`)
            markers.push(marker)
          } catch (markerError) {
            console.error("Error adding marker:", markerError)
          }
        }
        
        markersRef.current = markers

        // Fit map to all stops
        if (validRouteStops.length > 0) {
          const bounds = L.latLngBounds(validRouteStops.map(stop => [stop.latitude, stop.longitude]))
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      }
      
    } catch (routingError) {
      console.error("Routing failed, using fallback polyline:", routingError)

      // Fallback to simple polyline if routing fails
      if (!mapRef.current) return
      
      try {
        // Get valid route stops
        const validRouteStops = currentRoute.stopIds
          .map((stopId) => allStops.find((s) => s.id === stopId))
          .filter((stop): stop is BusStop => 
            !!stop && typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
          )
        
        if (validRouteStops.length < 2) return
        
        // Create route coordinates
        const routeCoordinates = validRouteStops.map(
          stop => [stop.latitude, stop.longitude] as [number, number]
        )

        // Create polyline
        const polyline = L.polyline(routeCoordinates, {
          color: "#e53e3e",
          weight: 6,
          opacity: 0.8,
          lineJoin: "round",
        })
        
        // Add to map
        if (mapRef.current) {
          polyline.addTo(mapRef.current)
          routePolylineRef.current = polyline
          
          // Add markers for each stop
          const markers: L.Marker[] = []
          
          for (const stop of validRouteStops) {
            try {
              const marker = L.marker([stop.latitude, stop.longitude], {
                icon: busStopIcon()
              })
              
              if (mapRef.current) {
                marker.addTo(mapRef.current)
                marker.bindPopup(`<strong>${stop.name}</strong><br>ID: ${stop.id}`)
                markers.push(marker)
              }
            } catch (markerError) {
              console.error("Error adding marker in fallback:", markerError)
            }
          }
          
          markersRef.current = markers

          // Fit map to polyline bounds
          const bounds = polyline.getBounds()
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] })
          }
        }
      } catch (fallbackError) {
        console.error("Fallback polyline also failed:", fallbackError)
      }
    }
  }, [busStops, currentRoute, allStops, mapInitialized])

  return <div id="map" className="w-full h-full" />
}