"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import dynamic from "next/dynamic"
import type { BusStop, BusRoute } from "@/lib/types"

const BusRouteMap = dynamic(() => import("@/components/bus-route-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

interface MapPageContentProps {
  busStopsPromise: Promise<BusStop[]>
  routesPromise: Promise<BusRoute[]>
}

export default function MapPageContent({ busStopsPromise, routesPromise }: MapPageContentProps) {
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [stops, setStops] = useState<BusStop[]>([])
  const [routes, setRoutes] = useState<BusRoute[]>([])

  // Use React.use when it becomes available in a stable release
  // For now, we'll use a useEffect hook to load the data
  React.useEffect(() => {
    Promise.all([busStopsPromise, routesPromise]).then(([busStops, routes]) => {
      setStops(busStops)
      setRoutes(routes)
    })
  }, [busStopsPromise, routesPromise])

  const handlePrevRoute = () => {
    setCurrentRouteIndex((prev) => (prev === 0 ? routes.length - 1 : prev - 1))
  }

  const handleNextRoute = () => {
    setCurrentRouteIndex((prev) => (prev === routes.length - 1 ? 0 : prev + 1))
  }

  const currentRoute = routes[currentRouteIndex]

  if (!currentRoute) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Bus Route Explorer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Interactive Map</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
                    <Info className="h-4 w-4 mr-2" />
                    Info
                  </Button>
                </div>
                {showInfo && (
                  <CardDescription className="mt-2 p-2 bg-slate-100 rounded-md">
                    This map shows all bus stops (blue markers) and the currently selected route (red line). Use the
                    arrows to navigate between different routes.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[600px] relative rounded-md overflow-hidden border">
                  <BusRouteMap busStops={stops} currentRoute={currentRoute} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Route Information</CardTitle>
                <CardDescription>View and switch between different bus routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={handlePrevRoute}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="font-medium">
                      Route {currentRouteIndex + 1} of {routes.length}
                    </span>
                    <Button variant="outline" onClick={handleNextRoute}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{currentRoute.name}</h3>
                      <p className="text-sm text-gray-500">{currentRoute.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Route Details</h4>
                      <div className="bg-slate-100 p-3 rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Total Stops:</div>
                          <div className="font-medium">{currentRoute.stop_ids.length}</div>
                          <div>Route Length:</div>
                          <div className="font-medium">{currentRoute.length} km</div>
                          <div>Travel Time:</div>
                          <div className="font-medium">{currentRoute.travel_time} min</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Stops on this Route</h4>
                      <div className="max-h-[250px] overflow-y-auto pr-2">
                        <ul className="space-y-2">
                          {currentRoute.stop_ids.map((stopId) => {
                            const stop = stops.find((s) => s.id === stopId)
                            return (
                              <li key={stopId} className="bg-white p-2 rounded border text-sm">
                                {stop?.name || stopId}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

