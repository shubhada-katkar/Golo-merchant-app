"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getFeaturedDeals } from "../lib/api";

const fallbackDeals = [
  { img: "del1.webp", title: "Smart Watch Pro", discount: "30% OFF" },
  { img: "deal2.jpg", title: "Luxury Spa Package", discount: "30% OFF" },
  { img: "deal3.jpg", title: "Fashion Apparel Sale", discount: "25% OFF" },
  { img: "deal4.jpg", title: "Weekend Getaway", discount: "40% OFF" },
];

function getDisplayPrice(ad) {
  const candidates = [
    ad?.price,
    ad?.categorySpecificData?.price,
    ad?.categorySpecificData?.rent,
    ad?.categorySpecificData?.askingPrice,
    ad?.categorySpecificData?.rentAmount,
    ad?.categorySpecificData?.fees,
    ad?.categorySpecificData?.pricePerPerson,
    ad?.categorySpecificData?.consultationFee,
    ad?.categorySpecificData?.charges,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.]/g, '');
      const parsed = Number(normalized);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return 0;
}

export default function FeaturedDeals() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [deals, setDeals] = useState(fallbackDeals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const response = await getFeaturedDeals(4);
        if (response.success && response.data?.length > 0) {
          setDeals(
            response.data.map((ad) => ({
              id: ad._id,
              img: ad.images?.[0] || "deal1.jpg",
              title: ad.title,
              discount: ad.negotiable ? "Negotiable" : `₹${getDisplayPrice(ad)}`,
              isFromApi: true,
            }))
          );
        }
      } catch {
        // Fallback to mock data silently
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  return (
    <section className="py-20 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold theme-heading">
            Featured Deals
          </h2>

          <button 
            className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
            suppressHydrationWarning={true}
          >
            View More →
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {deals.map((deal, i) => {
            const isActive = activeIndex === i;

            return (
              <div
                key={deal.id || i}
                onClick={() => setActiveIndex(i)}
                className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? "theme-card-active" : "theme-card"
                  }`}
              >
                <div className="overflow-hidden">
                  <Image
                    src={deal.isFromApi ? deal.img : `/images/${deal.img}`}
                    width={400}
                    height={250}
                    alt={deal.title}
                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized={deal.isFromApi}
                  />
                </div>

                <div className="p-6">
                  <h3 className="font-semibold text-lg theme-heading">
                    {deal.title}
                  </h3>

                  <p
                    className="text-sm font-medium mt-1"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {deal.discount}
                  </p>

                  <button 
                    className="mt-5 w-full py-2.5 rounded-full theme-button-accent"
                    suppressHydrationWarning={true}
                  >
                    View Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
