"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

// Custom marker icon
const defaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Routing component
const RoutingMachine = ({ waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    let routingControl = L.Routing.control({
      waypoints: waypoints.map((wp) => L.latLng(wp.lat, wp.lng)),
      createMarker: () => null,
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: { styles: [{ color: "#3388ff", weight: 4 }] },
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        routingControl.setWaypoints([]);
        map.removeControl(routingControl);
      }
    };
  }, [map, waypoints]);

  return null;
};

const RouteMap = () => {
  const searchParams = useSearchParams();
  const [route, setRoute] = useState(null);
  const [waypoints, setWaypoints] = useState([]);

  useEffect(() => {
    const routeData = searchParams.get("data");
    if (routeData) {
      try {
        const parsedRoute = JSON.parse(decodeURIComponent(routeData));
console.log("Parsed Route:", parsedRoute); // Debugging

// Fix: Parse waypoints if it's still a string
const waypointsArray =
  typeof parsedRoute.waypoints === "string"
    ? JSON.parse(parsedRoute.waypoints)
    : parsedRoute.waypoints;

if (Array.isArray(waypointsArray)) {
  setWaypoints(waypointsArray);
} else {
  console.warn("Waypoints are missing or invalid.");
}
setRoute(parsedRoute);

      } catch (err) {
        console.error("Error parsing route data:", err);
      }
    }
  }, [searchParams]);

  if (!route) {
    return <p className="text-center text-white">Loading route...</p>;
  }

  if (!waypoints.length) {
    return <p className="text-center text-red-500">No waypoints found</p>;
  }

  const center = [waypoints[0].lat, waypoints[0].lng];

  return (
    <div className="w-full h-screen">
      <MapContainer center={center} zoom={12} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}

        {waypoints.map((wp) => (
          <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={defaultIcon}>
            <Popup>
              Stop: {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
