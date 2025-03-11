"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Info, Home } from "lucide-react"
import { busStops, busRoutes } from "@/lib/data"
import dynamic from "next/dynamic"
import type { BusStop, BusRoute } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { GlowingBorder } from "@/components/ui/glowing-border"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { TextSpotlight } from "@/components/ui/text-spotlight"
import { ParticleBackground } from "@/components/ui/particle-background"

// Dynamically import the Map component to avoid SSR issues with Leaflet
const BusRouteMap = dynamic(() => import("@/components/bus-route-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-secondary/20 animate-pulse flex items-center justify-center rounded-md">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

export default function MapPage() {
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [stops, setStops] = useState<BusStop[]>(busStops)
  const [routes, setRoutes] = useState<BusRoute[]>(busRoutes)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load stops and routes from localStorage on client side
  useEffect(() => {
    try {
      const storedStops = localStorage.getItem("bus-stops")
      const storedRoutes = localStorage.getItem("bus-routes")

      if (storedStops) {
        setStops(JSON.parse(storedStops))
      }

      if (storedRoutes) {
        setRoutes(JSON.parse(storedRoutes))
      }

      setIsLoaded(true)
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      setIsLoaded(true)
    }
  }, [])

  const handlePrevRoute = () => {
    setCurrentRouteIndex((prev) => (prev === 0 ? routes.length - 1 : prev - 1))
  }

  const handleNextRoute = () => {
    setCurrentRouteIndex((prev) => (prev === routes.length - 1 ? 0 : prev + 1))
  }

  const currentRoute = routes[currentRouteIndex]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl font-bold pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <ParticleBackground />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          <TextSpotlight>
            <h1 className="text-3xl font-bold gradient-text fade-in">Bus Route Explorer</h1>
          </TextSpotlight>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <MagneticButton className="hover-glow">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </MagneticButton>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 slide-in">
            <GlowingBorder>
              <Card className="h-full border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="gradient-text">Interactive Map</CardTitle>
                    <MagneticButton>
                      <Button variant="outline" size="sm" onClick={() => setShowInfo(!showInfo)}>
                        <Info className="h-4 w-4 mr-2" />
                        Info
                      </Button>
                    </MagneticButton>
                  </div>
                  {showInfo && (
                    <CardDescription className="mt-2 p-2 bg-secondary/20 rounded-md fade-in">
                      This map shows all bus stops (blue markers) and the currently selected route (red line). Use the
                      arrows to navigate between different routes.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] relative rounded-md overflow-hidden border border-border">
                    <BusRouteMap busStops={stops} currentRoute={currentRoute} />
                  </div>
                </CardContent>
              </Card>
            </GlowingBorder>
          </div>

          <div className="slide-in" style={{ animationDelay: "0.2s" }}>
            <GlowingBorder>
              <Card className="h-full border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <TextSpotlight>
                    <CardTitle className="gradient-text">Route Information</CardTitle>
                    <CardDescription>View and switch between different bus routes</CardDescription>
                  </TextSpotlight>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <MagneticButton>
                        <Button variant="outline" onClick={handlePrevRoute}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                      </MagneticButton>
                      <span className="font-medium">
                        Route {currentRouteIndex + 1} of {routes.length}
                      </span>
                      <MagneticButton>
                        <Button variant="outline" onClick={handleNextRoute}>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </MagneticButton>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold gradient-text">{currentRoute.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentRoute.description}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Route Details</h4>
                        <div className="bg-secondary/20 p-3 rounded-md">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Stops:</div>
                            <div className="font-medium">{currentRoute.stopIds.length}</div>
                            <div>Route Length:</div>
                            <div className="font-medium">{currentRoute.length} km</div>
                            <div>Travel Time:</div>
                            <div className="font-medium">{currentRoute.travelTime} min</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Stops on this Route</h4>
                        <div className="max-h-[250px] overflow-y-auto pr-2">
                          <ul className="space-y-2">
                            {currentRoute.stopIds.map((stopId) => {
                              const stop = stops.find((s) => s.id === stopId)
                              return (
                                <li
                                  key={stopId}
                                  className="bg-secondary/10 p-2 rounded border border-border text-sm transition-all hover:bg-secondary/20 hover-lift"
                                >
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
            </GlowingBorder>
          </div>
        </div>
      </div>
    </div>
  )
}

