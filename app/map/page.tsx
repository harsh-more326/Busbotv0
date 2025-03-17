"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import L from "leaflet";
import "leaflet-routing-machine";

const MapPage = () => {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (!dataParam) return;

    try {
      const parsedData = JSON.parse(decodeURIComponent(dataParam));
      setRouteData(parsedData);
    } catch (error) {
      console.error("Error parsing route data:", error);
    }
  }, [dataParam]);

  useEffect(() => {
    if (!routeData) return;

    const map = L.map("map").setView([19.076, 72.8777], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    if (routeData.stops.length) {
      L.Routing.control({
        waypoints: routeData.stops.map((stop) => L.latLng(stop.lat, stop.lng)),
        createMarker: () => null,
        routeWhileDragging: true,
      }).addTo(map);
    }
  }, [routeData]);

  return <div id="map" className="w-full h-screen"></div>;
};

export default MapPage;
