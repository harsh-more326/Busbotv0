import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
    'https://vouxrjvgsishauzfqlyz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdXhyanZnc2lzaGF1emZxbHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2OTIyNzksImV4cCI6MjA1MzI2ODI3OX0.7FQ8Iifb4_8j39lpK9ckYjqnxjifGCCxAr73HhHJUfE'
)
export async function GET() {
  try {
    // Fetch stops from `optimized_routes`
    const { data, error } = await supabase
      .from("optimized_routes")
      .select("stops");

    if (error) throw error;

    // Extract waypoints from all rows
    const waypoints = data.flatMap((row) => {
      try {
        const parsed = JSON.parse(row.stops);
        return parsed.waypoints || [];
      } catch (err) {
        console.error("Error parsing stops:", err);
        return [];
      }
    });

    return NextResponse.json({ waypoints }, { status: 200 });
  } catch (error) {
    console.error("Error fetching optimized routes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
