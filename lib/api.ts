import { supabase } from "./supabase"
import type { BusStop, Depot, OptimizedRoute, RouteOptimizationParams, LKHResponse, Worker, WorkerSchedule } from "./types"

// Fetch all bus stops from the database
export async function getBusStops(): Promise<BusStop[]> {
  const { data, error } = await supabase.from("bus_stops").select("*").order("name")
  if (error) throw error
  return data || []
}

// Fetch all depots from the database
export async function getDepots(): Promise<Depot[]> {
  const { data, error } = await supabase.from("depots").select("*").order("name")
  if (error) throw error
  return data || []
}

// Fetch optimized routes from the database
export async function getOptimizedRoutes(): Promise<OptimizedRoute[]> {
  // Remove the order by created_at since that column doesn't exist in the table
  const { data, error } = await supabase.from("optimized_routes").select("*")
  if (error) throw error
  return data || []
}

// Get routes (avoiding duplicate functionality with getOptimizedRoutes)
export async function getRoutes(): Promise<OptimizedRoute[]> {
  return await getOptimizedRoutes()
}

// Add a new bus stop to the database
export async function addBusStop(busStop: Omit<BusStop, "id">): Promise<BusStop> {
  const { data, error } = await supabase.from("bus_stops").insert(busStop).select().single()
  if (error) throw error
  return data
}

// Add a new depot to the database
export async function addDepot(depot: Omit<Depot, "id">): Promise<Depot> {
  const { data, error } = await supabase.from("depots").insert(depot).select().single()
  if (error) throw error
  return data
}

// Add a new route to the database (renamed from addRoute to avoid confusion with saveOptimizedRoute)
export async function addRoute(route: Omit<OptimizedRoute, "id">): Promise<OptimizedRoute> {
  return await saveOptimizedRoute(route)
}

// Save an optimized route to the database
export async function saveOptimizedRoute(route: Omit<OptimizedRoute, "id">): Promise<OptimizedRoute> {
  const { data, error } = await supabase.from("optimized_routes").insert(route).select().single()
  if (error) throw error
  return data
}

// Worker-related functions
export async function getWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase.from("workers").select("*").order("name")
  if (error) throw error
  return data || []
}

export async function addWorker(worker: Omit<Worker, "id">): Promise<Worker> {
  const { data, error } = await supabase.from("workers").insert(worker).select().single()
  if (error) throw error
  return data
}

export async function updateWorker(id: string, worker: Partial<Worker>): Promise<Worker> {
  const { data, error } = await supabase
    .from("workers")
    .update(worker)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorker(id: string): Promise<void> {
  const { error } = await supabase.from("workers").delete().eq("id", id)
  if (error) throw error
}

// Worker schedule functions
export async function getWorkerSchedules(): Promise<WorkerSchedule[]> {
  const { data, error } = await supabase
    .from("worker_schedules")
    .select(
      `
      id, 
      date, 
      shift, 
      worker_id, 
      route_id, 
      workers!worker_schedules_worker_id_fkey(*), 
      optimized_routes(*)
    `
    )
    .order("date");

  if (error) {
    console.error("❌ Error fetching worker schedules:", error.message, error.hint);
    throw error;
  }

  return data?.map((schedule) => ({
    ...schedule,
    workers: schedule.workers?.[0] ?? null, // Ensure workers is a single object
    optimized_routes: schedule.optimized_routes?.[0] ?? null, // Ensure optimized_routes is a single object
  })) ?? [];
}





export async function addWorkerSchedule(schedule: Omit<WorkerSchedule, "id">): Promise<WorkerSchedule> {
  const { data, error } = await supabase.from("worker_schedules").insert(schedule).select().single()
  if (error) throw error
  return data
}

// Call the LKH algorithm service
export async function callLKHService(
  lkhServiceUrl: string,
  stops: BusStop[],
  depot: Depot,
  params: RouteOptimizationParams,
): Promise<LKHResponse> {
  const requestData = {
    depot: {
      id: depot.id,
      latitude: depot.latitude,
      longitude: depot.longitude,
    },
    stops: stops.map((stop) => ({
      id: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
      priority: stop.priority,
    })),
    params: {
      minStops: params.minStops,
      maxStops: params.maxStops,
      maxDistance: params.maxDistance,
      maxDuration: params.maxDuration,
      priorityWeight: params.priorityWeight,
    },
  }

  const response = await fetch(lkhServiceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LKH service error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Estimate travel time between two points (simple estimation)
export function estimateTravelTime(distance: number): number {
  // Assuming average speed of 30 km/h in urban areas
  return Math.round((distance / 30) * 60) // Time in minutes
}


