/**
 * Leaflet Geocoding and Location Service
 * Handles location search, reverse geocoding using OpenStreetMap Nominatim
 */

const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";

/**
 * Search for locations by address/place name
 * @param {string} query - Search query (e.g., "Kolhapur, Maharashtra")
 * @param {options} options - Optional parameters (limit, country, etc)
 * @returns {Promise<Array>} - Array of matching locations
 */
export async function searchLocations(query, options = {}) {
  if (!query || query.trim().length === 0) {
    console.log("❌ Empty search query");
    return [];
  }

  const searchQuery = query.toLowerCase();
  console.log("🔍 [searchLocations] Starting search for:", searchQuery);

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: options.limit || 10,
      addressdetails: 1,
      countrycodes: options.country || "in",
      "accept-language": "en",
    });

    const url = `${NOMINATIM_API_BASE}/search?${params.toString()}`;
    console.log("🌐 [searchLocations] API URL:", url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("⏱️ [searchLocations] Request timeout triggered");
      controller.abort();
    }, 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "User-Agent": "GOLO-App/1.0",
      },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    console.log("📡 [searchLocations] Response status:", response.status);

    if (!response.ok) {
      console.error("❌ [searchLocations] API error - Status:", response.status, response.statusText);
      return getLocalSearchResults(query); // Fallback to local search
    }

    const data = await response.json();
    console.log("✅ [searchLocations] Got", data?.length || 0, "results from API");
    
    if (!data || data.length === 0) {
      console.log("⚠️  [searchLocations] No results from API, trying local search");
      return getLocalSearchResults(query);
    }
    
    const formatted = formatSearchResults(data || []);
    console.log("📊 [searchLocations] Formatted results:", formatted.length);
    return formatted;
  } catch (error) {
    console.error("❌ [searchLocations] Exception caught:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    });
    
    if (error.name === 'AbortError') {
      console.warn("⏱️ [searchLocations] Request was aborted (timeout)");
    }
    
    console.log("🔄 [searchLocations] Falling back to local search");
    return getLocalSearchResults(query);
  }
}

/**
 * Fallback local search with mock data for common Indian locations
 */
function getLocalSearchResults(query) {
  const q = query.toLowerCase().trim();
  console.log("🏠 [getLocalSearchResults] Using local fallback for:", q);
  
  const indianCities = [
    { name: 'Kolhapur', displayName: 'Kolhapur, Maharashtra, India', lat: 16.7050, lng: 73.7308 },
    { name: 'Pune', displayName: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
    { name: 'Mumbai', displayName: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
    { name: 'Bangalore', displayName: 'Bangalore, Karnataka, India', lat: 12.9716, lng: 77.5946 },
    { name: 'Delhi', displayName: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
    { name: 'Hyderabad', displayName: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', displayName: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
    { name: 'Ahmedabad', displayName: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', displayName: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', displayName: 'Lucknow, Uttar Pradesh, India', lat: 26.8467, lng: 80.9462 },
  ];
  
  // Filter cities that match the query
  const matches = indianCities.filter(city => 
    city.name.toLowerCase().includes(q) || 
    city.displayName.toLowerCase().includes(q)
  );
  
  console.log("📍 [getLocalSearchResults] Found", matches.length, "local matches");
  
  // Format results
  return matches.map((city, index) => ({
    id: `local_${index}`,
    name: city.name,
    displayName: city.displayName,
    coordinates: {
      lat: city.lat,
      lng: city.lng,
    },
    address: city.displayName,
    isLocal: true,
  }));
}

/**
 * Reverse geocoding - Get location details from coordinates
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<object>} - Location details
 */
export async function reverseGeocode(lng, lat) {
  if (lng === null || lat === null || isNaN(lng) || isNaN(lat)) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      format: "json",
      lat: lat,
      lon: lng,
      zoom: 18,
      addressdetails: 1,
      "accept-language": "en",
    });

    const url = `${NOMINATIM_API_BASE}/reverse?${params.toString()}`;
    
    console.log("📍 Reverse geocoding coordinates:", lat, lng);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "User-Agent": "GOLO-App/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("❌ Reverse geocoding error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    if (data && data.address) {
      console.log("✅ Reverse geocoding successful");
      return formatLocationDetails(data);
    }

    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn("⏱️ Reverse geocoding timeout");
    } else {
      console.error("❌ Error in reverse geocoding:", error?.message || error);
    }
    return null;
  }
}

/**
 * Format search results from Nominatim API
 * @param {Array} results - Raw results from Nominatim
 * @returns {Array} - Formatted location objects
 */
function formatSearchResults(results) {
  return results.map((result, index) => {
    const address = result.address || {};
    return {
      id: `${result.osm_id}_${index}`,
      name: result.name || result.display_name.split(",")[0],
      displayName: result.display_name,
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      address: result.display_name,
      context: {
        place: result.name || "",
        district: address.district || address.county || "",
        region: address.state || address.province || "",
        country: address.country || "",
      },
    };
  });
}

/**
 * Format detailed location from reverse geocoding
 * @param {object} data - Response from Nominatim
 * @returns {object} - Formatted location details
 */
function formatLocationDetails(data) {
  const address = data.address || {};
  return {
    id: data.osm_id,
    name: data.name || address.house_number || "",
    displayName: data.display_name,
    coordinates: {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
    },
    address: data.display_name,
    type: data.osm_type,
  };
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if valid
 */
export function validateCoordinates(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get center coordinates for India (default center)
 * @returns {object} - Default center coordinates
 */
export function getIndiaCenter() {
  return {
    lat: 20.5937,
    lng: 78.9629,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
