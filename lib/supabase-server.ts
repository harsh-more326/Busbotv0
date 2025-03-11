import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

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

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseServiceKey) {
  throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log("Successfully connected to Supabase")
  } catch (error) {
    logError("Supabase connection test", error)
    throw error
  }
}

console.log("Supabase server script started")
testSupabaseConnection().catch((error) => {
  logError("Unhandled error in testSupabaseConnection", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise)
  logError("Unhandled Rejection reason", reason)
  process.exit(1)
})

