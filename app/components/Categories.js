"use client";

import { useState } from "react";
import {
  BookOpen,
  Users,
  Truck,
  Megaphone,
  Airplay,
  Star,
  Home,
  FileText,
  Search,
  Toolbox,
  User,
  Briefcase,
  Smartphone,
  Archive,
} from "lucide-react";

const categories = [
  { name: "Education", icon: BookOpen },
  { name: "Matrimonial", icon: Users },
  { name: "Vehicle Rent", icon: Truck },
  { name: "Vehicle Sell", icon: Truck },
  { name: "Business Promotion", icon: Megaphone },
  { name: "Travel", icon: Airplay },
  { name: "Astrology", icon: Star },
  { name: "Property Rent", icon: Home },
  { name: "Property Sell", icon: Home },
  { name: "Public Notice", icon: FileText },
  { name: "Lost & Found", icon: Search },
  { name: "Service", icon: Toolbox },
  { name: "Personal", icon: User },
  { name: "Employment", icon: Briefcase },
  { name: "Pets", icon: Users },
  { name: "Mobiles", icon: Smartphone },
  { name: "Electronics & Home Appliances", icon: Archive },
  { name: "Furniture", icon: Archive },
  { name: "Other", icon: Archive },
];

export default function Categories() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const itemsPerRow = 6;
  const visibleCategories = showAll
    ? categories
    : categories.slice(0, itemsPerRow);

  return (
    <section className="py-12 theme-section">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 theme-heading">
        Explore Categories
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4 md:px-12">
        {visibleCategories.map((cat, i) => {
          const Icon = cat.icon;
          const isActive = activeIndex === i;

          return (
            <div
              key={cat.name}
              onClick={() => setActiveIndex(i)}
              className={`cursor-pointer rounded-2xl p-6 flex flex-col items-center justify-center ${
                isActive ? "theme-card-active" : "theme-card"
              }`}
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full mb-4 shadow-md theme-icon">
                <Icon size={28} />
              </div>

              <span className="text-center font-semibold text-sm md:text-base theme-heading">
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>

      {categories.length > itemsPerRow && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 rounded-full font-medium theme-button-accent"

          >
            {showAll ? "View Less" : "View More"}
          </button>
        </div>
      )}
    </section>
  );
}
