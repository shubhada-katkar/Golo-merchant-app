"use client";

import { useState } from "react";
import {
  Utensils,
  Briefcase,
  ShoppingBag,
  Tag,
  Home,
  Wrench,
} from "lucide-react";

const items = [
  { name: "Restaurants", icon: Utensils },
  { name: "Jobs", icon: Briefcase },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Deals", icon: Tag },
  { name: "Real Estate", icon: Home },
  { name: "Services", icon: Wrench },
  { name: "Restaurants", icon: Utensils },
  { name: "Jobs", icon: Briefcase },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Deals", icon: Tag },
  { name: "Real Estate", icon: Home },
  { name: "Services", icon: Wrench },
];

export default function Discover() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section className="py-20 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-center justify-between mb-14">
          <h2 className="text-3xl font-bold theme-heading">
            Discover What's Nearby
          </h2>

          <button 
            className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
            suppressHydrationWarning={true}
          >
  View More →
</button>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {items.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeIndex === i;

            return (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`cursor-pointer rounded-2xl p-8 text-center ${
                  isActive ? "theme-card-active" : "theme-card"
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full theme-icon">
                  <Icon size={24} />
                </div>

                <h3 className="font-medium text-sm theme-heading">
                  {item.name}
                </h3>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
