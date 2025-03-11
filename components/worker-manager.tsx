"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Plus, Trash2, Edit, AlertCircle, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Worker } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Custom Confirmation Dialog Component
const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-lg">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mt-1 -mr-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => {
            onConfirm();
            onClose();
          }}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export function WorkerManager() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<string>("") 
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      // console.log("Fetching workers from database...")
      const { data, error } = await supabase.from("workers").select("*").order("name")

      if (error) {
        console.error("Error fetching workers:", error)
        throw error
      }
      
      // console.log("Workers fetched successfully:", data)
      setWorkers(data || [])
    } catch (error) {
      console.error("Error fetching workers:", error)
      toast({
        title: "Error",
        description: "Failed to load workers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setRole("")
    setEditingId(null)
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!name || !email || !phone || !role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (editingId) {
        // Create updated worker object
        const updatedWorker = {
          id: editingId,
          name,
          email,
          phone,
          role
        }
        
        console.log(`Updating worker with ID ${editingId} in database...`, updatedWorker)
        
        const { error } = await supabase
          .from("workers")
          .update({
            name,
            email,
            phone,
            role,
          })
          .eq("id", editingId)

        if (error) {
          console.error("Database update error:", error)
          throw error
        }

        console.log("Update successfully sent to database")
        
        // Optimistically update the UI without waiting for verification
        setWorkers(workers.map(worker => 
          worker.id === editingId ? updatedWorker : worker
        ))

        toast({
          title: "Success",
          description: "Worker updated successfully",
        })
        
        // Reset form
        resetForm()
      } else {
        // Create new worker
        console.log("Adding new worker to database:", {
          name,
          email, 
          phone,
          role
        })
        
        const { data, error } = await supabase
          .from("workers")
          .insert({
            name,
            email,
            phone,
            role,
          })
          .select()

        if (error) {
          console.error("Database insert error:", error)
          throw error
        }

        console.log("Database insert response:", data)

        if (data && data.length > 0) {
          console.log("Worker added successfully to database:", data[0])
          // Update state - immediately reflect the change in UI
          setWorkers([...workers, data[0]])
        } else {
          console.log("No data returned from database insert, refreshing worker list...")
          // If no data is returned, fetch workers again to ensure we have the latest data
          await fetchWorkers()
        }

        toast({
          title: "Success",
          description: "Worker added successfully",
        })
        
        // Reset form
        resetForm()
      }
    } catch (error) {
      console.error("Error with worker operation:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingId ? "update" : "add"} worker`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditWorker = (worker: Worker) => {
    console.log("Editing worker:", worker)
    
    // Set form values with worker data
    setName(worker.name)
    setEmail(worker.email)
    setPhone(worker.phone || "")  // Handle null phone
    setRole(worker.role || "") // Set role, default to empty if not present
    setEditingId(worker.id)

    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteWorker = async (id: string) => {
    setLoading(true)

    try {
      console.log(`Deleting worker with ID ${id} from database...`)
      
      const { error } = await supabase.from("workers").delete().eq("id", id)

      if (error) {
        console.error("Database delete error:", error)
        throw error
      }

      console.log("Worker deleted successfully from database")
      
      // Update state - immediately reflect on UI
      setWorkers(workers.filter((worker) => worker.id !== id))

      // If we're deleting the worker we're currently editing, reset the form
      if (editingId === id) {
        resetForm()
      }

      toast({
        title: "Success",
        description: "Worker deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const showDeleteConfirmation = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Worker",
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      onConfirm: () => handleDeleteWorker(id),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingId ? "Edit Worker" : "Worker Manager"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleAddWorker} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter worker name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={setRole}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select worker role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conductor">Conductor</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
                variant={editingId ? "default" : "default"}
              >
                {editingId ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Worker
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Worker
                  </>
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Workers</h3>
            {loading && !workers.length ? (
              <div className="text-center py-4">Loading workers...</div>
            ) : workers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No workers found. Add one using the form above.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((worker) => (
                      <TableRow key={worker.id} className={editingId === worker.id ? "bg-muted/50" : ""}>
                        <TableCell>{worker.name}</TableCell>
                        <TableCell>{worker.email}</TableCell>
                        <TableCell>{worker.phone}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            worker.role === "Driver" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }`}>
                            {worker.role || "Not specified"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditWorker(worker)}
                              disabled={editingId === worker.id}
                            >
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => showDeleteConfirmation(worker.id, worker.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <Toaster />
      
      {/* Custom Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </Card>
  )
}