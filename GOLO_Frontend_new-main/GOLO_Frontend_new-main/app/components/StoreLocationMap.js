"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const StoreLocationMapContent = dynamic(
  () => import("./StoreLocationMapContentFixed"),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[200px] rounded-[8px] border border-[#d5d5d5] overflow-hidden bg-[#f5f5f5] animate-pulse" />
    ),
  }
);

/**
 * StoreLocationMap Component Wrapper
 * Small preview map showing current store location
 * Uses dynamic import to avoid SSR issues with Leaflet
 * 
 * Props:
 * - location: object - Current location {latitude, longitude, address}
 * - onMapClick: function - Callback when map is clicked to open picker
 * - isLoading: boolean - Loading state
 */
export default function StoreLocationMap(props) {
  return (
    <Suspense
      fallback={
        <div className="relative w-full h-[200px] rounded-[8px] border border-[#d5d5d5] overflow-hidden bg-[#f5f5f5] animate-pulse" />
      }
    >
      <StoreLocationMapContent {...props} />
    </Suspense>
  );
}

