"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { RefreshCw } from "lucide-react"
import { getBusStops, getRoutes, addRoute } from "@/lib/api"
import { generateOptimizedRoutes } from "@/lib/route-utils"
import type { BusStop, BusRoute } from "@/lib/types"

interface RouteGeneratorProps {
  onRoutesGenerated: (routes: BusRoute[]) => void
}

export function RouteGenerator({ onRoutesGenerated }: RouteGeneratorProps) {
  const [allStops, setAllStops] = useState<BusStop[]>([])
  const [allRoutes, setAllRoutes] = useState<BusRoute[]>([])
  const [maxDistance, setMaxDistance] = useState("10")
  const [maxStops, setMaxStops] = useState("20")
  const [minStops, setMinStops] = useState("12")
  const [maxDuration, setMaxDuration] = useState("45") // Max 45 minutes

  useEffect(() => {
    Promise.all([getBusStops(), getRoutes()])
      .then(([stops, routes]) => {
        setAllStops(stops)
        setAllRoutes(routes)
      })
      .catch(console.error)
  }, [])

  const handleGenerateRoutes = async () => {
    if (allStops.length < Number.parseInt(minStops)) {
      toast({
        title: "Error",
        description: `Not enough bus stops. You need at least ${minStops} stops.`,
        variant: "destructive",
      })
      return
    }

    // Generate optimized routes with new constraints
    const newRoutes = generateOptimizedRoutes(allStops, {
      maxDistance: Number.parseFloat(maxDistance),
      minStops: Number.parseInt(minStops),
      maxStops: Number.parseInt(maxStops),
      maxDuration: Number.parseInt(maxDuration),
    })

    if (newRoutes.length === 0) {
      toast({
        title: "Error",
        description: "Could not generate any valid routes with the current constraints.",
        variant: "destructive",
      })
      return
    }

    // Save the new routes to the database
    try {
      const savedRoutes = await Promise.all(newRoutes.map((route) => addRoute(route)))
      setAllRoutes([...allRoutes, ...savedRoutes])
      onRoutesGenerated(savedRoutes)

      toast({
        title: "Success",
        description: `Generated and saved ${savedRoutes.length} optimized routes.`,
      })
    } catch (error) {
      console.error("Error saving routes:", error)
      toast({
        title: "Error",
        description: "Failed to save generated routes. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-distance">Max Route Distance (km)</Label>
              <Input
                id="max-distance"
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                min="1"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-duration">Max Duration (min)</Label>
              <Input
                id="max-duration"
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                min="15"
                max="45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-stops">Min Stops per Route</Label>
              <Input
                id="min-stops"
                type="number"
                value={minStops}
                onChange={(e) => setMinStops(e.target.value)}
                min="12"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-stops">Max Stops per Route</Label>
              <Input
                id="max-stops"
                type="number"
                value={maxStops}
                onChange={(e) => setMaxStops(e.target.value)}
                min="12"
                max="20"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleGenerateRoutes} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Optimized Routes
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>This will generate optimized routes based on your bus stops.</p>
            <p>
              Each route will have between {minStops} and {maxStops} stops, be at most {maxDistance} km long, and take
              maximum {maxDuration} minutes.
            </p>
            <p>
              You currently have {allStops.length} bus stops and {allRoutes.length} routes.
            </p>
          </div>
        </div>
        <Toaster />
      </CardContent>
    </Card>
  )
}

