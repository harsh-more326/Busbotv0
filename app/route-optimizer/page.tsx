"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Map, Route, Settings } from "lucide-react"
import { RouteOptimizer } from "@/components/route-optimizer"
import { OptimizedRoutesList } from "@/components/optimized-routes-list"
import { RouteDetails } from "@/components/route-details"
import { RouteMap } from "@/components/route-map"
import { getBusStops, getDepots } from "@/lib/api"
import type { BusStop, Depot, OptimizedRoute } from "@/lib/types"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function RouteOptimizerPage() {
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [depots, setDepots] = useState<Depot[]>([])
  const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null)
  const [activeTab, setActiveTab] = useState("optimizer")

  // LKH service URL - replace with your actual hosted LKH service URL
  const lkhServiceUrl = process.env.NEXT_PUBLIC_LKH_SERVICE_URL || "https://your-lkh-service-url.com/optimize"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsData, depotsData] = await Promise.all([getBusStops(), getDepots()])
        setBusStops(stopsData)
        setDepots(depotsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleRouteOptimized = (route: OptimizedRoute) => {
    setSelectedRoute(route)
    setActiveTab("map")
  }

  const handleViewRoute = (route: OptimizedRoute) => {
    setSelectedRoute(route)
    setActiveTab("details")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Route Optimizer</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
                <CardDescription>Manage and view optimized routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={activeTab === "optimizer" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("optimizer")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Optimizer
                  </Button>
                  <Button
                    variant={activeTab === "routes" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("routes")}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Routes
                  </Button>
                  <Button
                    variant={activeTab === "map" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("map")}
                    disabled={!selectedRoute}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Map View
                  </Button>
                  <Button
                    variant={activeTab === "details" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("details")}
                    disabled={!selectedRoute}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Route Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            {activeTab === "optimizer" && (
              <RouteOptimizer lkhServiceUrl={lkhServiceUrl} onRouteOptimized={handleRouteOptimized} />
            )}

            {activeTab === "routes" && <OptimizedRoutesList onViewRoute={handleViewRoute} />}

            {activeTab === "map" && selectedRoute && (
              <RouteMap route={selectedRoute} busStops={busStops} depots={depots} />
            )}

            {activeTab === "details" && selectedRoute && (
              <RouteDetails route={selectedRoute} onClose={() => setActiveTab("routes")} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

