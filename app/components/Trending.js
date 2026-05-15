"use client";

import { useState, useEffect } from "react";
import { getTrendingSearches } from "../lib/api";

const fallbackTags = [
  "Vegan Restaurants",
  "Book Shops",
  "Coffee Shops",
  "Shopping Malls",
  "Historical Places",
  "Live Music Venues",
  "Art Galleries",
  "Pet-Friendly Cafes",
];

export default function Trending({ setSearchQuery }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [tags, setTags] = useState(fallbackTags);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await getTrendingSearches(10);
        if (response.success && response.data?.length > 0) {
          setTags(response.data);
        }
      } catch {
        // Fallback to mock tags silently
      }
    }
    fetchTrending();
  }, []);

  return (
    <section className="py-20 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold theme-heading">
            Trending Searches Near You
          </h2>

          <button 
            className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
            suppressHydrationWarning={true}
          >
            View More →
          </button>
        </div>

        <div className="flex flex-wrap gap-5">
          {tags.map((tag, i) => {
            const isActive = activeIndex === i;
            const tagText = typeof tag === "string" ? tag : tag.name || tag.query || tag;

            return (
              <button
                key={i}
                onClick={() => {
                  setActiveIndex(i);
                  setSearchQuery(tagText);
                }}
                className={`px-6 py-3 rounded-full text-sm font-medium border transition-all duration-300 ${isActive ? "theme-button-primary" : "theme-card"
                  }`}
                suppressHydrationWarning={true}
              >
                {tagText}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
