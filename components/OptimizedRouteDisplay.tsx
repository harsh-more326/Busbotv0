import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { MapIcon, ChevronDown, ChevronUp } from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  "https://vouxrjvgsishauzfqlyz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdXhyanZnc2lzaGF1emZxbHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2OTIyNzksImV4cCI6MjA1MzI2ODI3OX0.7FQ8Iifb4_8j39lpK9ckYjqnxjifGCCxAr73HhHJUfE"
);

const OptimizedRouteDisplay = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRoute, setExpandedRoute] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("optimized_routes").select("id, name, stops");
        if (error) throw error;
        
        // Process data to ensure stops are properly handled
        const processedData = data.map(route => {
          // Add a processed stops array we can safely use
          return {
            ...route,
            processedStops: processStops(route.stops)
          };
        });
        
        setRoutes(processedData);
      } catch (err) {
        setError("Failed to load routes");
        console.error("Error fetching routes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Function to safely process stops data in any format
  const processStops = (stops) => {
    // First, handle null/undefined case
    if (!stops) return [];
    
    try {
      // Handle string input - try to parse JSON
      if (typeof stops === 'string') {
        try {
          const parsed = JSON.parse(stops);
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (parsed && typeof parsed === 'object') {
            // Handle object with waypoints property
            if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
              return parsed.waypoints;
            }
            // Handle single object with lat/lng
            if (parsed.lat && parsed.lng) {
              return [parsed];
            }
            // Handle object with numeric keys (like the example data)
            return Object.values(parsed);
          }
          return [];
        } catch (e) {
          console.error("Failed to parse stops JSON:", e);
          return [];
        }
      }
      
      // Handle object that might be a single waypoint
      if (!Array.isArray(stops) && stops && typeof stops === 'object') {
        // Check if it has lat/lng properties (single waypoint)
        if (stops.lat && stops.lng) {
          return [stops];
        }
        
        // Check if it has a waypoints array
        if (stops.waypoints && Array.isArray(stops.waypoints)) {
          return stops.waypoints;
        }
        
        // It might be an object with numeric keys
        return Object.values(stops);
      }
      
      // If it's already an array, return it
      if (Array.isArray(stops)) {
        return stops;
      }
      
      // Fallback for unknown formats
      console.warn("Unknown stops format:", stops);
      return [];
      
    } catch (err) {
      console.error("Error processing stops:", err);
      return [];
    }
  };

  const handleViewRoute = (route) => {
    try {
      // Create URL with route data
      const routeData = JSON.stringify({
        name: route.name,
        waypoints: route.processedStops
      });
      
      // Open in new window/tab
      const mapWindow = window.open(`/route-map?data=${encodeURIComponent(routeData)}`, '_blank');
      if (!mapWindow) {
        console.error("Popup was blocked. Please allow popups for this site.");
      }
    } catch (err) {
      console.error("Error opening route map:", err);
    }
  };

  return (
    <div className="p-4 bg-jaguar text-white min-h-screen">
      <h2 className="text-xl font-bold mb-4">Optimized Routes</h2>
      {loading && <p>Loading routes...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-6">
        {routes.map((route) => (
          <div key={route.id} className="border p-4 rounded-lg shadow bg-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{route.name || "Unnamed Route"}</h3>
              <button
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => handleViewRoute(route)}
              >
                <MapIcon size={16} />
                <span>Show Route</span>
              </button>
            </div>

            <div className="mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  {route.processedStops.length} stops
                </span>
                <button
                  onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                  className="flex items-center text-blue-400 hover:underline"
                >
                  {expandedRoute === route.id ? (
                    <>
                      Hide Stops <ChevronUp size={18} className="ml-2" />
                    </>
                  ) : (
                    <>
                      Show Stops <ChevronDown size={18} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {expandedRoute === route.id && (
              <div className="mt-4 overflow-y-auto max-h-64">
                {route.processedStops.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Latitude</th>
                        <th className="p-2 text-left">Longitude</th>
                        <th className="p-2 text-left">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {route.processedStops.map((stop, index) => (
                        <tr key={`stop-${index}`} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{stop.lat?.toFixed?.(6) || stop.lat || 'N/A'}</td>
                          <td className="p-2">{stop.lng?.toFixed?.(6) || stop.lng || 'N/A'}</td>
                          <td className="p-2 truncate max-w-xs">{stop.id || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 py-2">No stops available</p>
                )}
              </div>
            )}
          </div>
        ))}

        {routes.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-8">No routes available</p>
        )}
      </div>
    </div>
  );
};

export default OptimizedRouteDisplay;