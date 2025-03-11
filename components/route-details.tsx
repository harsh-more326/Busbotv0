"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X } from "lucide-react"
import type { OptimizedRoute } from "@/lib/types"

interface RouteDetailsProps {
  route: OptimizedRoute
  onClose: () => void
}

export function RouteDetails({ route, onClose }: RouteDetailsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{route.name || `Route ${route.id.slice(0, 8)}`}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Distance</p>
              <p className="text-lg">{route.distance.toFixed(2)} km</p>
            </div>
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-lg">{route.duration} minutes</p>
            </div>
            <div>
              <p className="text-sm font-medium">Buses</p>
              <p className="text-lg">{route.buses}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Frequency</p>
              <p className="text-lg">{route.frequency} minutes</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Stops ({route.stops.length})</h3>
            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Coordinates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {route.stops.map((stop, index) => (
                    <TableRow key={stop.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{stop.name}</TableCell>
                      <TableCell>{stop.priority}</TableCell>
                      <TableCell>
                        {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

