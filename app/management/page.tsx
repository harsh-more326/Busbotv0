"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { BusStopManager } from "@/components/bus-stop-manager"
import { DepotManager } from "@/components/depot-manager"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function ManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Bus System Management</h1>
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
        <Tabs defaultValue="bus-stops">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="bus-stops">Bus Stops</TabsTrigger>
            <TabsTrigger value="depots">Depots</TabsTrigger>
          </TabsList>

          <TabsContent value="bus-stops">
            <BusStopManager />
          </TabsContent>

          <TabsContent value="depots">
            <DepotManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

