'use client';

import { useEffect, useRef } from 'react';

export default function LeafletMap({ latitude, longitude, markerTitle = 'Location', zoom = 15 }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    // Only load Leaflet on the client side
    if (typeof window === 'undefined') return;

    // Dynamically load Leaflet CSS and JS
    const leafletCSS = document.createElement('link');
    leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    leafletCSS.rel = 'stylesheet';
    document.head.appendChild(leafletCSS);

    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    leafletScript.async = true;
    leafletScript.onload = () => {
      // Initialize map
      if (mapContainer.current && !map.current) {
        const L = window.L;
        map.current = L.map(mapContainer.current).setView([latitude || 0, longitude || 0], zoom);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current);

        // Add marker
        if (latitude && longitude) {
          L.marker([latitude, longitude])
            .bindPopup(markerTitle)
            .addTo(map.current)
            .openPopup();
        }
      }
    };
    document.head.appendChild(leafletScript);

    return () => {
      // Cleanup
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, markerTitle, zoom]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}
