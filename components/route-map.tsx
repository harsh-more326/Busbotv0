import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for missing default marker icons in Leaflet
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const RouteMap = () => {
  const [searchParams] = useSearchParams();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const routeData = searchParams.get("data");
    if (routeData) {
      try {
        const parsedRoute = JSON.parse(decodeURIComponent(routeData));
        setRoute(parsedRoute);
      } catch (error) {
        console.error("Failed to parse route data:", error);
      }
    }
  }, [searchParams]);

  if (!route || !route.waypoints || route.waypoints.length === 0) {
    return <p className="text-center text-gray-500 mt-6">No route data available.</p>;
  }

  const waypoints = route.waypoints;
  const center = waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : [19.076, 72.877]; // Default: Mumbai

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{route.name || "Route Map"}</h2>
      <MapContainer center={center} zoom={12} className="h-[500px] w-full rounded-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Draw Route Polyline */}
        <Polyline positions={waypoints.map((wp) => [wp.lat, wp.lng])} color="blue" />

        {/* Place Markers */}
        {waypoints.map((wp, index) => (
          <Marker key={index} position={[wp.lat, wp.lng]} icon={defaultIcon}>
            <Popup>Stop {index + 1}: {wp.lat}, {wp.lng}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
