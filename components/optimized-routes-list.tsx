"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Eye, Map } from "lucide-react"
import { getOptimizedRoutes } from "@/lib/api"
import type { OptimizedRoute } from "@/lib/types"
import Link from "next/link"

interface OptimizedRoutesListProps {
  onViewRoute: (route: OptimizedRoute) => void
}

export function OptimizedRoutesList({ onViewRoute }: OptimizedRoutesListProps) {
  const [routes, setRoutes] = useState<OptimizedRoute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await getOptimizedRoutes()
        setRoutes(data)
      } catch (error) {
        console.error("Error fetching routes:", error)
        toast({
          title: "Error",
          description: "Failed to load optimized routes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const data = await getOptimizedRoutes()
      setRoutes(data)
      toast({
        title: "Success",
        description: "Routes refreshed successfully",
      })
    } catch (error) {
      console.error("Error refreshing routes:", error)
      toast({
        title: "Error",
        description: "Failed to refresh routes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Optimized Routes</CardTitle>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No optimized routes found. Create one using the optimizer.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Duration (min)</TableHead>
                  <TableHead>Buses</TableHead>
                  <TableHead>Frequency (min)</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>{route.name || `Route ${route.id.slice(0, 8)}`}</TableCell>
                    <TableCell>{route.stops_number}</TableCell>
                    <TableCell>{route.distance.toFixed(2)}</TableCell>
                    <TableCell>{route.duration}</TableCell>
                    <TableCell>{route.buses}</TableCell>
                    <TableCell>{route.frequency}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => onViewRoute(route)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link href={`/map?route=${route.id}`}>
                          <Button variant="ghost" size="icon">
                            <Map className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <Toaster />
    </Card>
  )
}

