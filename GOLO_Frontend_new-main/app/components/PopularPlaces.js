"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getPopularPlaces } from "../lib/api";

const fallbackPlaces = [
  { img: "place1.jpg", name: "Mahalakshmi Temple" },
  { img: "place2.avif", name: "Rankala Lake" },
  { img: "place3.webp", name: "New Palace" },
  { img: "place4.jpg", name: "Panhala Fort" },
];

export default function PopularPlaces() {
  const [places, setPlaces] = useState(fallbackPlaces);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const response = await getPopularPlaces(4);
        if (response.success && response.data?.length > 0) {
          setPlaces(
            response.data.map((place, index) => {
              if (typeof place === "string") {
                return {
                  id: `popular-${index}`,
                  img: fallbackPlaces[index % fallbackPlaces.length].img,
                  name: place,
                  description: "Popular area based on recent listings.",
                  isFromApi: false,
                };
              }

              return {
                id: place?._id || `popular-${index}`,
                img: place?.image || place?.img || fallbackPlaces[index % fallbackPlaces.length].img,
                name: place?.name || place?.location || `Popular Place ${index + 1}`,
                description: place?.description || "A popular place based on recent listings.",
                isFromApi: Boolean(place?.image || place?.img),
              };
            })
          );
        }
      } catch {
        // Fallback to mock places
      }
    }
    fetchPlaces();
  }, []);

  return (
    <section className="py-16 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-semibold theme-heading">
            Explore Popular Places
          </h2>

          <button 
            className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
            suppressHydrationWarning={true}
          >
            View More →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {places.map((place, i) => (
            <div
              key={place.id || i}
              className="group rounded-xl shadow-md p-4 transition-all duration-300 theme-card"
            >
              <div className="overflow-hidden rounded-lg">
                <Image
                  src={place.isFromApi ? place.img : `/images/${place.img}`}
                  width={300}
                  height={200}
                  alt={place.name || "Popular place"}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized={place.isFromApi}
                />
              </div>

              <h3 className="mt-4 font-semibold theme-heading">
                {place.name}
              </h3>

              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {place.description || "A historic and beautiful place to visit."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
