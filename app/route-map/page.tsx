"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

// Custom marker icon using existing image
const defaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RoutingMachine = ({ waypoints }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!map || waypoints.length < 2) return;
      
      let routingControl = null;
      
      // Create the routing control with a slight delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        // Apply patch to prevent removeLayer error
        const originalRemoveLayer = map.removeLayer;
        map.removeLayer = function(layer) {
          if (layer) {
            return originalRemoveLayer.call(this, layer);
          }
          return this;
        };
        
        // Create the routing control
        routingControl = L.Routing.control({
          waypoints: waypoints.map((wp) => L.latLng(wp.lat, wp.lng)),
          createMarker: () => null,
          routeWhileDragging: false,
          showAlternatives: false,
          lineOptions: {
            styles: [{ color: '#3388ff', weight: 4 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0
          },
          show: false
        }).addTo(map);
        
        // Hide the container
        const containers = document.querySelectorAll('.leaflet-routing-container');
        containers.forEach(container => {
          if (container) container.style.display = 'none';
        });
      }, 100);
      
      // Cleanup
      return () => {
        clearTimeout(timer);
        if (map && routingControl) {
          try {
            // Store current state before removal
            const currentWaypoints = routingControl.getWaypoints();
            
            // If waypoints exist, set them to empty array first
            if (currentWaypoints && currentWaypoints.length) {
              routingControl.setWaypoints([]);
            }
            
            // Then remove the control
            map.removeControl(routingControl);
            
            // Restore original method
            map.removeLayer = originalRemoveLayer;
          } catch (e) {
            console.warn("Error during cleanup:", e);
          }
        }
      };
    }, [map, waypoints]);
    
    return null;
  };

const RouteMap = () => {
  const searchParams = useSearchParams();
  const [route, setRoute] = useState(null);
  
  useEffect(() => {
    const routeData = searchParams.get("data");
    if (routeData) {
      try {
        const parsedRoute = JSON.parse(decodeURIComponent(routeData));
        setRoute(parsedRoute);
      } catch (err) {
        console.error("Error parsing route data:", err);
      }
    }
  }, [searchParams]);
  
  if (!route) {
    return <p className="text-center text-white">Loading route...</p>;
  }
  
  const waypoints = route.waypoints || [];
  const center = waypoints.length ? [waypoints[0].lat, waypoints[0].lng] : [19.076, 72.8777];
  
  return (
    <div className="w-full h-screen">
      <MapContainer center={center} zoom={12} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {waypoints.length >= 2 && <RoutingMachine waypoints={waypoints} />}
        
        {waypoints.map((wp, index) => (
          <Marker key={index} position={[wp.lat, wp.lng]} icon={defaultIcon}>
            <Popup>Stop {index + 1}: {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMap;