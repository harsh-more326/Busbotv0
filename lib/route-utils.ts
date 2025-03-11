import type { BusStop, BusRoute } from "./types"

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Calculate total route distance
export function calculateRouteDistance(stops: BusStop[]): number {
  let totalDistance = 0
  for (let i = 0; i < stops.length - 1; i++) {
    totalDistance += calculateDistance(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude,
    )
  }
  return Number.parseFloat(totalDistance.toFixed(2))
}

// Calculate estimated travel time (rough estimate: 20 km/h average speed in city)
export function calculateTravelTime(distance: number): number {
  // Assuming average speed of 20 km/h in city traffic
  const timeInHours = distance / 20
  const timeInMinutes = Math.ceil(timeInHours * 60)
  return timeInMinutes
}

// Generate optimized routes from a set of bus stops
export function generateOptimizedRoutes(stops: BusStop[], options = {}): BusRoute[] {
  const { maxDistance = 10, minStops = 12, maxStops = 20, maxDuration = 45 } = options

  const routes: BusRoute[] = []
  const usedStops = new Set<string>()

  // Start with a random stop and build routes
  for (let i = 0; i < stops.length; i++) {
    if (usedStops.has(stops[i].id)) continue

    const routeStops: BusStop[] = [stops[i]]
    usedStops.add(stops[i].id)

    // Find nearby stops to add to this route
    while (routeStops.length < maxStops) {
      const lastStop = routeStops[routeStops.length - 1]

      // Find the closest unused stop
      let closestStop: BusStop | null = null
      let minDistance = Number.POSITIVE_INFINITY

      for (const stop of stops) {
        if (usedStops.has(stop.id)) continue

        const distance = calculateDistance(lastStop.latitude, lastStop.longitude, stop.latitude, stop.longitude)

        // Check if adding this stop would exceed max route distance or duration
        const potentialRouteStops = [...routeStops, stop]
        const potentialRouteDistance = calculateRouteDistance(potentialRouteStops)
        const potentialRouteDuration = calculateTravelTime(potentialRouteDistance)

        if (distance < minDistance && potentialRouteDistance <= maxDistance && potentialRouteDuration <= maxDuration) {
          minDistance = distance
          closestStop = stop
        }
      }

      // If no suitable stop found or we've reached the limits, break
      if (!closestStop) break

      // Add the closest stop to the route
      routeStops.push(closestStop)
      usedStops.add(closestStop.id)
    }

    // Only create a route if we have at least minStops stops
    if (routeStops.length >= minStops) {
      const routeDistance = calculateRouteDistance(routeStops)
      const routeTravelTime = calculateTravelTime(routeDistance)

      routes.push({
        id: `route-${routes.length + 1}`,
        name: `Route ${routes.length + 1}`,
        description: `Route with ${routeStops.length} stops and ${routeDistance} km distance`,
        stopIds: routeStops.map((stop) => stop.id),
        length: routeDistance,
        travelTime: routeTravelTime,
      })
    }

    // If we've used all stops, break
    if (usedStops.size === stops.length) break
  }

  return routes
}

