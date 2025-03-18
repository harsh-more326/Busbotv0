"use client"

import { useState, useEffect } from "react"
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
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "worker"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = async (role: string) => {
    setError("")
    if (!username || !password) {
      setError("Please enter both username and password.")
      return
    }

    if (role === "admin") {
      const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" }
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const adminUser = { role: "admin", username: "admin" }
        setUser(adminUser)
        localStorage.setItem("user", JSON.stringify(adminUser))
        router.push("/admin/dashboard")
      } else {
        setError("Invalid admin credentials")
      }
    } else {
      const { data: worker, error } = await supabase
        .from("workers")
        .select("phone_number, id, name")
        .eq("phone_number", username)
        .eq("id", password.trim())
        .single()

      if (error) {
        console.error("Supabase Error:", error)
        setError("Invalid worker credentials")
        return
      }

      setUser(worker)
      localStorage.setItem("user", JSON.stringify(worker))
      router.push(`/worker/dashboard?worker_id=${worker.id}`)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/")
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

      {user ? (
        <div className="text-center bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold">
            Welcome, {user.role === "admin" ? "Admin" : user.name}!
          </h2>
          <p className="text-muted-foreground">You are logged in as {user.role || "Worker"}</p>
          <Button className="mt-4 bg-red-500 hover:bg-red-600" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
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
                    <TabsTrigger value="worker" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Worker</span>
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      <span>Admin</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="worker">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleLogin("worker")
                      }}
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="worker-username">Phone Number</Label>
                          <Input
                            id="worker-username"
                            placeholder="Enter your phone number"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
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
                          />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/80">
                          Sign in as Worker
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin">
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
                          />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/80">
                          Sign in as Admin
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </GlowingBorder>
        </FloatingAnimation>
      )}
    </div>
  )
}