

import { NextResponse } from 'next/server';
import { getOptimizedRoutes } from '@/lib/api';

export async function GET() {
  try {
    // Use your existing function to fetch optimized routes
    const optimizedRoutes = await getOptimizedRoutes();
    
    // Transform the data to match the expected format in the frontend
    const formattedRoutes = optimizedRoutes.map(route => {
      // Ensure the stops has the waypoints structure expected by the frontend
      const waypoints = route.stops && Array.isArray(route.stops) 
        ? route.stops.map(stop => ({
            lat: stop.latitude || stop.lat,
            lng: stop.longitude || stop.lng,
            id: stop.id || stop.external_id || `stop-${Math.random().toString(36).substring(2, 10)}`
          }))
        : [];
      
      return {
        id: route.id,
        name: route.name || `Route ${route.id.substring(0, 8)}`,
        stops: {
          waypoints: waypoints
        },
        stopsNumber: route.stopsNumber || waypoints.length,
        avgPriority: route.avgPriority || 1,
        depotId: route.depotId || null,
        duration: route.duration || 0,
        distance: route.distance || 0,
        createdAt: route.createdAt || new Date().toISOString(),
        updatedAt: route.updatedAt || new Date().toISOString()
      };
    });

    return NextResponse.json(formattedRoutes);
  } catch (error) {
    console.error("Error fetching optimized routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch optimized routes" },
      { status: 500 }
    );
  }
}