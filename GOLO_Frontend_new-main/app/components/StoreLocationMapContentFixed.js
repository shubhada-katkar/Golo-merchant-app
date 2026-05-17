"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { validateCoordinates, getIndiaCenter } from "../services/leafletService";

let L; // Declare L for lazy loading

/**
 * StoreLocationMapContent Component
 * Small preview map showing current store location
 * Clicking opens the full location picker modal
 * 
 * Props:
 * - location: object - Current location {latitude, longitude, address}
 * - onMapClick: function - Callback when map is clicked to open picker
 * - isLoading: boolean - Loading state
 */
function StoreLocationMapContent({ location, onMapClick, isLoading = false }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet on client side
  // CSS is now imported globally in globals.css
  useEffect(() => {
    if (typeof window !== 'undefined' && !L) {
      import('leaflet').then((leafletModule) => {
        L = leafletModule.default;
        setLeafletLoaded(true);
      }).catch(err => {
        console.error('Failed to load Leaflet:', err);
      });
    } else if (L) {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !leafletLoaded) return;

    // Only initialize once
    if (map.current) {
      // Invalidate size in case container changed
      setTimeout(() => {
        map.current?.invalidateSize();
        updateMarker();
      }, 50);
      return;
    }

    // Small delay to ensure CSS is fully applied
    const initTimeout = setTimeout(() => {
      try {
        const center = location && validateCoordinates(location.latitude, location.longitude)
          ? [location.latitude, location.longitude]
          : [getIndiaCenter().lat, getIndiaCenter().lng];

        // Initialize Leaflet map with proper options
        map.current = L.map(mapContainer.current, { 
          scrollWheelZoom: false,
          preferCanvas: true,
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView(center, location ? 13 : 5);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 2,
          crossOrigin: 'anonymous',
          tms: false,
        }).addTo(map.current);

        // Invalidate size to ensure proper rendering
        map.current.invalidateSize();
        
        setMapInitialized(true);
        updateMarker();
      } catch (error) {
        console.error("Store location map initialization error:", error);
      }
    }, 150);

    return () => clearTimeout(initTimeout);
  }, [leafletLoaded, location]);

  // Update marker when location changes
  function updateMarker() {
    if (!map.current || !L) return;

    // Remove old marker
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    // Add new marker if location exists
    if (location && validateCoordinates(location.latitude, location.longitude)) {
      const markerIcon = L.divIcon({
        className: "custom-marker-small",
        html: `<div class="w-6 h-6 bg-[#157a4f] border-2 border-white rounded-full shadow-md flex items-center justify-center">
          <div class="w-0.5 h-0.5 bg-white rounded-full"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      marker.current = L.marker([location.latitude, location.longitude], { icon: markerIcon }).addTo(map.current);

      // Center and zoom map
      map.current.setView([location.latitude, location.longitude], 13, { animate: true, duration: 0.5 });
    }
  }

  useEffect(() => {
    if (mapInitialized && location && leafletLoaded) {
      updateMarker();
    }
  }, [location, mapInitialized, leafletLoaded]);

  return (
    <div 
      className="relative w-full h-[200px] rounded-[8px] border border-[#d5d5d5] overflow-hidden bg-[#f5f5f5] cursor-pointer group hover:shadow-md transition"
      onClick={onMapClick}
    >
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Click overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-[6px] text-[12px] font-semibold text-[#1f1f1f] flex items-center gap-2">
          <MapPin size={14} className="text-[#157a4f]" />
          Click to change location
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <Loader2 size={20} className="text-[#157a4f] animate-spin" />
        </div>
      )}

      {/* No location state */}
      {!location && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f9f9f9] to-[#ececec]">
          <MapPin size={32} className="text-[#bbb] mb-2" />
          <p className="text-[12px] text-[#999] font-semibold">No location selected</p>
          <p className="text-[10px] text-[#ccc] mt-1">Click to select store location</p>
        </div>
      )}
    </div>
  );
}

export default StoreLocationMapContent;
