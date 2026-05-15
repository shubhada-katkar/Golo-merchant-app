"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon, MapPin, X, Loader2 } from "lucide-react";
import { searchLocations, reverseGeocode, validateCoordinates, getIndiaCenter } from "../services/leafletService";

let L; // Declare L for lazy loading

/**
 * LocationPickerContent Component
 * Full-screen map with search and pinpoint location selection
 * 
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Close callback
 * - onLocationSelect: function - Callback when location is selected (receives {lat, lng, address})
 * - initialLocation: object - Initial center location {lat, lng}
 */
function LocationPickerContent({ isOpen, onClose, onLocationSelect, initialLocation }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Log state changes for debugging
  useEffect(() => {
    console.log("📊 [State Update] showResults:", showResults, "| searchResults count:", searchResults.length, "| loading:", loading);
  }, [showResults, searchResults, loading]);

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

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current || !leafletLoaded) return;

    if (map.current) {
      // Map already exists, just invalidate size in case it changed
      setTimeout(() => {
        map.current.invalidateSize();
      }, 100);
      setMapReady(true);
      return;
    }

    // Small delay to ensure CSS is fully applied
    const initTimeout = setTimeout(() => {
      try {
        const center = initialLocation && validateCoordinates(initialLocation.lat, initialLocation.lng)
          ? [initialLocation.lat, initialLocation.lng]
          : [getIndiaCenter().lat, getIndiaCenter().lng];

        // Initialize Leaflet map with proper options
        map.current = L.map(mapContainer.current, {
          preferCanvas: true,
          fadeAnimation: true,
          zoomAnimation: true,
        }).setView(center, initialLocation ? 15 : 5);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 2,
          crossOrigin: 'anonymous',
          tms: false,
        }).addTo(map.current);

        // Add marker at initial location
        if (initialLocation && validateCoordinates(initialLocation.lat, initialLocation.lng)) {
          addMarker(initialLocation.lng, initialLocation.lat);
          setSelectedLocation(initialLocation);
        }

        // Handle map clicks for pinpoint selection
        map.current.on("click", (e) => {
          const { lat, lng } = e.latlng;
          if (validateCoordinates(lat, lng)) {
            handleMapClick(lng, lat);
          }
        });

        // Invalidate size to ensure proper rendering
        map.current.invalidateSize();
        setMapReady(true);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    }, 150);

    return () => clearTimeout(initTimeout);
  }, [isOpen, initialLocation, leafletLoaded]);

  // Handle map click - pinpoint selection
  async function handleMapClick(lng, lat) {
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    addMarker(lng, lat);

    // Reverse geocode to get address
    const locationDetails = await reverseGeocode(lng, lat);
    const location = {
      lat,
      lng,
      address: locationDetails?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };

    setSelectedLocation(location);
    setShowResults(false);
  }

  // Add marker to map
  function addMarker(lng, lat) {
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    // Create custom marker icon
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div class="w-8 h-8 bg-[#157a4f] border-2 border-white rounded-full shadow-lg flex items-center justify-center">
        <div class="w-1 h-1 bg-white rounded-full"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    marker.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map.current);

    // Center map on marker
    map.current.setView([lat, lng], 15, { animate: true, duration: 1 });
  }

  // Handle search with debounce for real-time suggestions
  async function performSearch(query) {
    if (!query || !query.trim()) {
      console.log("❌ [performSearch] Empty query");
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    console.log("🔎 [performSearch] Starting search for:", query);
    setLoading(true);
    
    try {
      console.log("⏳ [performSearch] Calling searchLocations API");
      const results = await searchLocations(query, {
        proximity: selectedLocation || getIndiaCenter(),
      });
      
      console.log("📊 [performSearch] Got results:", results?.length || 0);
      
      if (results && results.length > 0) {
        console.log("✅ [performSearch] Found", results.length, "locations");
        console.log("🎯 [performSearch] Setting search results and showing dropdown");
        setSearchResults(results);
        setShowResults(true);
      } else {
        console.log("⚠️  [performSearch] No results found");
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error("❌ [performSearch] Exception:", error?.message || error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
      console.log("✔️  [performSearch] Complete");
    }
  }

  // Handle input change with debounce
  function handleSearchInputChange(e) {
    const query = e.target.value;
    console.log("✏️  [handleSearchInputChange] User typed:", query);
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      console.log("⏱️  [handleSearchInputChange] Clearing previous timeout");
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if query has at least 3 characters to reduce API calls
    if (query.trim().length >= 3) {
      console.log("📝 [handleSearchInputChange] Query length:", query.length, "- Setting debounce timer (400ms)");
      searchTimeoutRef.current = setTimeout(() => {
        console.log("⏰ [handleSearchInputChange] Debounce timer fired");
        performSearch(query);
      }, 400); // 400ms debounce
    } else {
      // Clear results if less than 3 characters
      console.log("❌ [handleSearchInputChange] Query too short, clearing results");
      setSearchResults([]);
      setShowResults(false);
    }
  }

  // Handle Enter key press
  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchQuery);
    }
  }

  // Handle location selection from search results
  function selectFromResults(location) {
    console.log("🎯 [selectFromResults] User selected location:", location.displayName);
    setSelectedLocation({
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      address: location.displayName,
    });

    addMarker(location.coordinates.lng, location.coordinates.lat);
    console.log("📍 [selectFromResults] Marker added, closing dropdown");
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  // Handle confirm selection
  function handleConfirm() {
    if (selectedLocation && validateCoordinates(selectedLocation.lat, selectedLocation.lng)) {
      onLocationSelect({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address,
      });
      onClose();
    }
  }

  if (!isOpen) return null;

  console.log("🎨 [render] Rendering dropdown - showResults:", showResults, "results count:", searchResults.length);

  return (
    <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center">
      <div className="w-full h-full max-w-[1200px] max-h-[90vh] rounded-[12px] bg-white flex flex-col relative">
        {/* Header */}
        <div className="h-16 bg-[#157a4f] px-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-white">Select Store Location</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-[#e5e5e5] px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]">
                <SearchIcon size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search location (address, city, area...)"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-10 pl-10 pr-4 border border-[#ddd] rounded-[8px] bg-white text-[13px] focus:outline-none focus:border-[#157a4f]"
              />
            </div>
            <button
              onClick={() => performSearch(searchQuery)}
              disabled={loading || !searchQuery.trim()}
              className="h-10 px-4 bg-[#157a4f] text-white text-[12px] font-semibold rounded-[8px] hover:bg-[#1a6e44] disabled:bg-[#9fcfad] transition flex items-center gap-2 flex-shrink-0"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
            </button>
          </div>
        </div>

        {/* Search Results Dropdown - Separate Layer Above Map */}
        {showResults && searchResults && searchResults.length > 0 && (
          <div className="absolute left-6 right-6 top-[108px] bg-white border border-[#ddd] rounded-[8px] shadow-2xl max-h-[300px] overflow-y-auto z-[9999]">
            {console.log("🎯 [render] Rendering", searchResults.length, "results in fixed layer")}
            {searchResults.map((location, idx) => (
              <button
                key={location.id}
                onClick={() => selectFromResults(location)}
                className="w-full text-left px-4 py-3 hover:bg-[#f5f5f5] border-b border-[#eee] last:border-b-0 transition active:bg-[#e8e8e8]"
              >
                <p className="text-[13px] font-semibold text-[#1f1f1f]">{location.name}</p>
                <p className="text-[11px] text-[#999] mt-1">{location.displayName}</p>
              </button>
            ))}
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative bg-[#f5f5f5] overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Center crosshair (pinpoint indicator) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-[#157a4f] opacity-20 rounded-full pointer-events-none" />
              <MapPin size={28} className="text-[#157a4f] drop-shadow-lg" />
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 bg-white rounded-[8px] shadow-lg p-4 max-w-[280px]">
            <p className="text-[12px] text-[#1f1f1f] font-semibold mb-2">📍 How to select location:</p>
            <ul className="text-[11px] text-[#666] space-y-1">
              <li>• Click anywhere on the map to set pin (pinpoint)</li>
              <li>• Use search above to find your location</li>
              <li>• Drag map to navigate</li>
              <li>• Scroll to zoom in/out</li>
            </ul>
          </div>
        </div>

        {/* Selected Location Info & Confirm Footer */}
        <div className="h-20 bg-white border-t border-[#e5e5e5] px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            {selectedLocation ? (
              <div>
                <p className="text-[12px] text-[#666] font-semibold">Selected Location:</p>
                <p className="text-[13px] font-semibold text-[#1f1f1f] mt-1">
                  {selectedLocation.address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                </p>
                <p className="text-[10px] text-[#999] mt-1">
                  Lat: {selectedLocation.lat.toFixed(6)} | Lng: {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-[#999]">Click on map or search to select location</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 bg-[#f0f0f0] text-[#2a2a2a] border border-[#ddd] rounded-[8px] text-[12px] font-semibold hover:bg-[#e8e8e8] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation || !validateCoordinates(selectedLocation.lat, selectedLocation.lng)}
              className="h-10 px-5 bg-[#157a4f] text-white rounded-[8px] text-[12px] font-semibold hover:bg-[#1a6e44] disabled:bg-[#9fcfad] disabled:cursor-not-allowed transition"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationPickerContent;
