"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine/dist/leaflet-routing-machine.css"
import "leaflet-routing-machine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BusStop, Depot, OptimizedRoute } from "@/lib/types"

// Fix Leaflet icon issues
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

interface RouteMapProps {
  route?: OptimizedRoute
  busStops: BusStop[]
  depots: Depot[]
}

export function RouteMap({ route, busStops, depots }: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.Routing.Control | null>(null)

  useEffect(() => {
    fixLeafletIcons()

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      // Center on the first depot or a default location
      const initialCenter = depots.length > 0 ? [depots[0].latitude, depots[0].longitude] : [19.076, 72.8777] // Default to Mumbai if no depots

      const map = L.map("route-map").setView(initialCenter as [number, number], 12)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      // Add all bus stops to the map
      busStops.forEach((stop) => {
        const marker = L.marker([stop.latitude, stop.longitude], {
          icon: new L.Icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [20, 32], // Reduced size
            iconAnchor: [10, 32],
            popupAnchor: [1, -28],
            shadowSize: [32, 32],
          }),
        }).addTo(map)

        marker.bindPopup(`
          <strong>${stop.name}</strong><br>
          Priority: ${stop.priority}<br>
          // ID: ${stop.id}<br>
          Coordinates: ${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}
        `)
      })

      // Add all depots to the map
      depots.forEach((depot) => {
        const marker = L.marker([depot.latitude, depot.longitude], {
          icon: new L.Icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        }).addTo(map)

        marker.bindPopup(`
          <strong>${depot.name}</strong><br>
          ID: ${depot.id}<br>
          Coordinates: ${depot.latitude.toFixed(6)}, ${depot.longitude.toFixed(6)}
        `)
      })
    }

    // Update the route when route changes
    if (mapRef.current && route) {
      // Remove previous route if it exists
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
      }

      try {
        // Process route stops in pairs for routing
        const stops = route.stops
        if (stops.length > 1) {
          // Initialize the router with OSRM
          const router = L.Routing.osrm({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "driving",
            timeout: 30 * 1000, // 30 seconds timeout
          })

          // Create waypoints from route stops
          const waypoints = stops.map((stop) => L.latLng(stop.latitude, stop.longitude))

          // Create routing control
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
          }).addTo(mapRef.current)

          // Hide the routing control sidebar
          const container = routingControl.getContainer()
          if (container) {
            container.style.display = "none"
          }

          routeLayerRef.current = routingControl

          // Add blue markers for all stops
          stops.forEach((stop) => {
            L.marker([stop.latitude, stop.longitude], {
              icon: new L.Icon({
                iconUrl:
                  "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                iconSize: [20, 32],
                iconAnchor: [10, 32],
                popupAnchor: [1, -28],
                shadowSize: [32, 32],
              }),
            })
              .addTo(mapRef.current!)
              .bindPopup(`<strong>${stop.name}</strong><br>Priority: ${stop.priority}`)
          })

          // Fit map to all stops
          const bounds = L.latLngBounds(stops.map((stop) => [stop.latitude, stop.longitude]))
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      } catch (error) {
        console.error("Error with routing machine:", error)

        // Fallback to simple polyline if routing fails
        const routeCoordinates = route.stops.map((stop) => [stop.latitude, stop.longitude] as [number, number])

        const routePolyline = L.polyline(routeCoordinates, {
          color: "#e53e3e",
          weight: 4,
          opacity: 0.8,
          lineJoin: "round",
        }).addTo(mapRef.current)

        // Add markers for each stop without numbers
        route.stops.forEach((stop) => {
          L.marker([stop.latitude, stop.longitude], {
            icon: new L.Icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
              iconSize: [20, 32],
              iconAnchor: [10, 32],
              popupAnchor: [1, -28],
              shadowSize: [32, 32],
            }),
          })
            .addTo(mapRef.current!)
            .bindPopup(`<strong>${stop.name}</strong><br>Priority: ${stop.priority}<br>ID: ${stop.id}`)
        })

        // Fit the map to the route bounds
        mapRef.current.fitBounds(routePolyline.getBounds(), {
          padding: [50, 50],
        })

        // Store for cleanup
        routeLayerRef.current = {
          remove: () => {
            routePolyline.remove()
            mapRef.current?.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                const icon = layer.getIcon()
                if (icon instanceof L.Icon && icon.options.iconUrl?.includes("blue.png")) {
                  layer.remove()
                }
              }
            })
          },
        } as any
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [route, busStops, depots])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div id="route-map" className="h-[600px] rounded-md overflow-hidden border" />
      </CardContent>
    </Card>
  )
}

