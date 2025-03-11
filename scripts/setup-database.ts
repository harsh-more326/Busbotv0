import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function logError(prefix: string, error: unknown) {
  console.error(`${prefix} Error:`)
  console.error(JSON.stringify(error, null, 2))
  if (error instanceof Error) {
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
  }
  console.error("Error type:", typeof error)
  console.error("Is Error instance?", error instanceof Error)
  console.error("Error properties:", Object.getOwnPropertyNames(error))
}

async function main() {
  console.log("Starting main function")

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }

    console.log("Creating Supabase client")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("Starting database setup...")

    // Create bus_stops table
    console.log("Creating bus_stops table...")
    const { data: stopsData, error: stopsError } = await supabase.rpc("create_bus_stops_table")
    if (stopsError) throw stopsError
    console.log("Bus stops table created successfully")

    // Create routes table
    console.log("Creating routes table...")
    const { data: routesData, error: routesError } = await supabase.rpc("create_routes_table")
    if (routesError) throw routesError
    console.log("Routes table created successfully")

    // Generate and insert bus stops
    console.log("Generating bus stops...")
    const busStops = generateBusStops(750)
    console.log("Inserting bus stops...")
    const { data: insertData, error: insertError } = await supabase.from("bus_stops").insert(busStops)
    if (insertError) throw insertError

    console.log("Bus stops inserted successfully")
    console.log("Database setup complete")
  } catch (error) {
    logError("Main function", error)
    process.exit(1)
  }
}

function generateBusStops(count: number) {
  const stops = []
  const mumbaiCenter = { lat: 19.076, lng: 72.8777 }
  const radius = 0.2 // Approximately 20km radius

  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt(Math.random())
    const theta = Math.random() * 2 * Math.PI

    const lat = mumbaiCenter.lat + r * Math.cos(theta)
    const lng = mumbaiCenter.lng + r * Math.sin(theta)

    stops.push({
      id: uuidv4(),
      name: `Stop ${i + 1}`,
      lat,
      lng,
      description: `Automatically generated stop ${i + 1}`,
    })
  }

  return stops
}

console.log("Script started")
main().catch((error) => {
  logError("Unhandled error in main", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise)
  logError("Unhandled Rejection reason", reason)
  process.exit(1)
})

