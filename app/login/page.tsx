"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bus, User, UserCog } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { GlowingBorder } from "@/components/ui/glowing-border"
import { FloatingAnimation } from "@/components/ui/floating-animation"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { ParticleBackground } from "@/components/ui/particle-background"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "worker"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (role: string) => {
    // In a real app, you would validate credentials here
    if (username && password) {
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/worker/dashboard")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <ParticleBackground />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="absolute top-4 left-4">
        <MagneticButton className="hover-glow">
          <Button variant="ghost" className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            <span>Home</span>
          </Button>
        </MagneticButton>
      </Link>

      <FloatingAnimation amplitude={5} speed={6}>
        <GlowingBorder>
          <Card className="w-full max-w-md border-0 bg-card/80 backdrop-blur-sm fade-in">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <FloatingAnimation amplitude={8} speed={4}>
                  <Bus className="h-12 w-12 text-primary" />
                </FloatingAnimation>
              </div>
              <CardTitle className="text-2xl gradient-text">Sign in to BusRoute Manager</CardTitle>
              <CardDescription>Choose your role and enter your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultRole} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="worker"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>Worker</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="admin"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <UserCog className="h-4 w-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="worker" className="slide-up">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleLogin("worker")
                    }}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="worker-username">Username</Label>
                        <Input
                          id="worker-username"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="worker-password">Password</Label>
                        <Input
                          id="worker-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-background"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/80 transition-all hover:scale-105"
                      >
                        Sign in as Worker
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="admin" className="slide-up">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleLogin("admin")
                    }}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-username">Admin Username</Label>
                        <Input
                          id="admin-username"
                          placeholder="Enter admin username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Admin Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="Enter admin password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-background"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/80 transition-all hover:scale-105"
                      >
                        Sign in as Admin
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-sm text-center text-muted-foreground mt-4">
                Demo credentials: admin/admin for Admin, worker/worker for Worker
              </p>
            </CardFooter>
          </Card>
        </GlowingBorder>
      </FloatingAnimation>
    </div>
  )
}

