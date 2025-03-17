"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, RotateCw } from "lucide-react"
import { getBusStops, getDepots, callLKHService, saveOptimizedRoute } from "@/lib/api"
import type { BusStop, Depot, RouteOptimizationParams, OptimizedRoute } from "@/lib/types"

interface RouteOptimizerProps {
  lkhServiceUrl: string
  onRouteOptimized: (route: OptimizedRoute) => void
}

export function RouteOptimizer({ lkhServiceUrl, onRouteOptimized }: RouteOptimizerProps) {
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(false)
  const [depotId, setDepotId] = useState("")
  const [minStops, setMinStops] = useState(5)
  const [maxStops, setMaxStops] = useState(15)
  const [maxDistance, setMaxDistance] = useState(30)
  const [maxDuration, setMaxDuration] = useState(120)
  const [priorityWeight, setPriorityWeight] = useState(5)
  const [buses, setBuses] = useState(3)
  const [frequency, setFrequency] = useState(15)
  const [routeName, setRouteName] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsData, depotsData] = await Promise.all([getBusStops(), getDepots()])
        setBusStops(stopsData)
        setDepots(depotsData)
        if (depotsData.length > 0) {
          setDepotId(depotsData[0].id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load bus stops and depots",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [])

  const handleOptimize = async () => {
    if (!depotId) {
      toast({
        title: "Error",
        description: "Please select a depot",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const depot = depots.find((d) => d.id === depotId)
      if (!depot) throw new Error("Selected depot not found")

      const params: RouteOptimizationParams = {
        depotId,
        minStops,
        maxStops,
        maxDistance,
        maxDuration,
        priorityWeight,
        buses,
        frequency,
      }

      const result = await callLKHService(lkhServiceUrl, busStops, depot, params)

      // Get the stops in the optimized order
      const routeStops = result.route.map((stopId : string) => {
        const stop = busStops.find((s) => s.id === stopId)
        if (!stop) throw new Error(`Stop with ID ${stopId} not found`)
        return {
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          priority: stop.priority,
        }
      })

      // Create the optimized route object
      const optimizedRoute: Omit<OptimizedRoute, "id"> = {
        stops: routeStops,
        distance: result.distance,
        duration: result.duration,
        buses,
        frequency,
        name: routeName || null,
        stops_number: routeStops.length,
      }

      // Save the optimized route to the database
      const savedRoute = await saveOptimizedRoute(optimizedRoute)

      // Notify the parent component
      onRouteOptimized(savedRoute)

      toast({
        title: "Success",
        description: `Route optimized with ${routeStops.length} stops and ${result.distance.toFixed(2)} km distance`,
      })
    } catch (error) {
      console.error("Error optimizing route:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to optimize route",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Optimizer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name (Optional)</Label>
            <Input
              id="route-name"
              placeholder="Enter a name for this route"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="depot">Starting Depot</Label>
            <Select value={depotId} onValueChange={setDepotId}>
              <SelectTrigger id="depot">
                <SelectValue placeholder="Select a depot" />
              </SelectTrigger>
              <SelectContent>
                {depots.map((depot) => (
                  <SelectItem key={depot.id} value={depot.id}>
                    {depot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Stops: {minStops}</Label>
              <Slider value={[minStops]} min={2} max={30} step={1} onValueChange={(value) => setMinStops(value[0])} />
            </div>
            <div className="space-y-2">
              <Label>Max Stops: {maxStops}</Label>
              <Slider value={[maxStops]} min={5} max={50} step={1} onValueChange={(value) => setMinStops(value[0])} />
            </div>
          </div> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Min Stops: {minStops}</Label>
        <Slider
          value={[minStops]}
          min={2}
          max={30}
          step={1}
          onValueChange={(value) => {
            setMinStops(value[0]);
            setMaxStops(value[0]); // BUG: Updating maxStops without actually changing the slider
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Max Stops: {maxStops}</Label>
        <Slider
          value={[0]} // BUG: Keeping the slider's actual value fixed at 0
          min={5}
          max={50}
          step={1}
          onValueChange={() => {}} // Ignoring changes
        />
      </div>
    </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Distance (km): {maxDistance}</Label>
              <Slider
                value={[maxDistance]}
                min={5}
                max={100}
                step={5}
                onValueChange={(value) => setMaxDistance(value[0])}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Duration (min): {maxDuration}</Label>
              <Slider
                value={[maxDuration]}
                min={30}
                max={240}
                step={10}
                onValueChange={(value) => setMaxDuration(value[0])}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority Weight: {priorityWeight}</Label>
            <Slider
              value={[priorityWeight]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setPriorityWeight(value[0])}
            />
            <p className="text-sm text-muted-foreground">Higher values give more importance to high-priority stops</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buses">Number of Buses</Label>
              <Input
                id="buses"
                type="number"
                min={1}
                max={20}
                value={buses}
                onChange={(e) => setBuses(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency (minutes)</Label>
              <Input
                id="frequency"
                type="number"
                min={5}
                max={60}
                step={5}
                value={frequency}
                onChange={(e) => setFrequency(Number.parseInt(e.target.value) || 15)}
              />
            </div>
          </div>

          <Button onClick={handleOptimize} className="w-full" disabled={loading || !depotId || busStops.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Optimize Route
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground">
            <p>Available stops: {busStops.length}</p>
            <p>Available depots: {depots.length}</p>
          </div>
        </div>
      </CardContent>
      <Toaster />
    </Card>
  )
}

