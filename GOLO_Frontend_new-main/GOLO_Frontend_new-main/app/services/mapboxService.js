/**
 * Mapbox Geocoding and Location Service
 * Handles location search, reverse geocoding, and coordinate parsing
 */

const MAPBOX_API_BASE = "https://api.mapbox.com/geocoding/v5";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * Search for locations by address/place name
 * @param {string} query - Search query (e.g., "Kolhapur, Maharashtra")
 * @param {object} options - Optional parameters (proximity, limit, etc)
 * @returns {Promise<Array>} - Array of matching locations
 */
export async function searchLocations(query, options = {}) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: options.limit || 10,
      types: options.types || "place,address",
      country: options.country || "in", // Default to India
      language: "en",
    });

    if (options.proximity) {
      params.append("proximity", `${options.proximity.lng},${options.proximity.lat}`);
    }

    const url = `${MAPBOX_API_BASE}/${encodeURIComponent(query)}.json?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Mapbox search error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return formatSearchResults(data.features || []);
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
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
      access_token: MAPBOX_TOKEN,
      limit: 1,
      types: "place,address",
      language: "en",
    });

    const url = `${MAPBOX_API_BASE}/${lng},${lat}.json?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Reverse geocoding error:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return formatLocationDetails(data.features[0]);
    }

    return null;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
}

/**
 * Format search results from Mapbox API
 * @param {Array} features - Raw features from Mapbox
 * @returns {Array} - Formatted location objects
 */
function formatSearchResults(features) {
  return features.map((feature) => ({
    id: feature.id,
    name: feature.text || feature.place_name,
    displayName: feature.place_name,
    coordinates: {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    },
    address: feature.place_name,
    context: {
      place: feature.properties?.place || "",
      district: feature.properties?.district || "",
      region: feature.properties?.region || "",
      country: feature.properties?.country || "",
    },
  }));
}

/**
 * Format detailed location from reverse geocoding
 * @param {object} feature - Feature from Mapbox
 * @returns {object} - Formatted location details
 */
function formatLocationDetails(feature) {
  return {
    id: feature.id,
    name: feature.text || feature.place_name,
    displayName: feature.place_name,
    coordinates: {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    },
    address: feature.place_name,
    type: feature.properties?.type || feature.geometry.type,
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
 * @param {object} coord1 - {lat, lng}
 * @param {object} coord2 - {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
