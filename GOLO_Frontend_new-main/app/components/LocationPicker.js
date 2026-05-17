"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LocationPickerContent = dynamic(
  () => import("./LocationPickerContentFixed"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-black/50" />,
  }
);

/**
 * LocationPicker Component Wrapper
 * Full-screen map with search and pinpoint location selection
 * Uses dynamic import to avoid SSR issues with Leaflet
 * 
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Close callback
 * - onLocationSelect: function - Callback when location is selected
 * - initialLocation: object - Initial center location {lat, lng}
 */
export default function LocationPicker(props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black/50" />}>
      <LocationPickerContent {...props} />
    </Suspense>
  );
}
