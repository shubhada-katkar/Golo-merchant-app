"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import CategoryBar from "./components/CategoryBar";
import Hero from "./components/Hero";
import Discover from "./components/Discover";
import FeaturedDeals from "./components/FeaturedDeals";
import Trending from "./components/Trending";
import Recommended from "./components/Recommended";
import PopularPlaces from "./components/PopularPlaces";
import Footer from "./components/Footer";
import AdTemplateCard from "./components/AdTemplateCard";
import { getAllAds } from "./lib/api";

// ─── CSS FOR BENTO GRID Layout ──────────────────────────────────────────────
const bentoGridContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", // Fallback for small screens
  gap: "16px",
  // CSS Grid auto placement
  gridAutoFlow: "row dense",
};

// On large screens, we force 4 columns. 
// A big card takes 2 cols and 2 rows. Small takes 1 col and 1 row.
// We handle this via simple inline styles mapping.

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentAds, setRecentAds] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const router = useRouter();
  const { user, loading, getUserAccountType } = useAuth();

  // Redirect merchants to merchant dashboard
  useEffect(() => {
    if (!loading && user) {
      const accountType = user?.accountType || getUserAccountType();
      if (accountType === "merchant") {
        router.replace("/merchant/dashboard");
      }
    }
  }, [user, loading, router, getUserAccountType]);

  useEffect(() => {
    async function fetchRecent() {
      setLoadingRecent(true);
      try {
        const res = await getAllAds({ page: 1, limit: 12, sortBy: "createdAt", sortOrder: "desc" });
        const ads = res?.data?.ads || res?.data || [];
        setRecentAds(Array.isArray(ads) ? ads : []);
      } catch {
        setRecentAds([]);
      } finally {
        setLoadingRecent(false);
      }
    }
    fetchRecent();
  }, []);

  // Group ads by category
  const adsByCategory = recentAds.reduce((acc, ad) => {
    const cat = ad.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ad);
    return acc;
  }, {});

  const categories = Object.keys(adsByCategory);

  return (
    <>
      {/* Global styles for our specific bento grid structural overrides inside standard JSX */}
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
          grid-auto-rows: minmax(220px, auto);
          grid-auto-flow: dense;
        }
        @media (min-width: 640px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 220px; }
        }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 240px; }
        }
        .bento-item-big { grid-column: span 1; grid-row: span 1; }
        .bento-item-small { grid-column: span 1; grid-row: span 1; }
        
        @media (min-width: 640px) {
          .bento-item-big { grid-column: span 2; grid-row: span 2; }
          .bento-item-small { grid-column: span 1; grid-row: span 1; }
        }
      `}</style>

      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
       <CategoryBar variant="golocal" preferredCategories={user?.preferredCategories || []} />

      <Hero />
      <Discover />
      <FeaturedDeals />
      <Trending setSearchQuery={setSearchQuery} />

      {/* ── Live Ads by Category from DB ───────────────────────── */}
      {!loadingRecent && categories.length > 0 && categories.map((cat) => {
        const catAds = adsByCategory[cat];
        if (!catAds?.length) return null;

        return (
          <section key={cat} style={{ padding: "0 0 40px 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>

              {/* Bento Grid */}
              <div className="bento-grid">
                {catAds.map((ad) => {
                  // Determine grid span class based on template
                  // Template 1 = big (span 2x2), template 2/3 = small (span 1x1)
                  const spanClass = ad.templateId === 1 ? "bento-item-big" : "bento-item-small";
                  return (
                    <div key={ad._id || ad.adId} className={spanClass}>
                      <AdTemplateCard ad={ad} isBento={true} />
                    </div>
                  );
                })}
              </div>

            </div>
          </section>
        );
      })}

      {/* Skeleton Loading */}
      {loadingRecent && (
        <section style={{ padding: "0 24px 40px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="bento-grid">
              <div className="bento-item-big" style={{ background: "#f3f4f6", borderRadius: "24px", animation: "pulse 1.5s infinite" }} />
              <div className="bento-item-small" style={{ background: "#f3f4f6", borderRadius: "20px", animation: "pulse 1.5s infinite" }} />
              <div className="bento-item-small" style={{ background: "#f3f4f6", borderRadius: "20px", animation: "pulse 1.5s infinite" }} />
              <div className="bento-item-small" style={{ background: "#f3f4f6", borderRadius: "20px", animation: "pulse 1.5s infinite" }} />
              <div className="bento-item-small" style={{ background: "#f3f4f6", borderRadius: "20px", animation: "pulse 1.5s infinite" }} />
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        </section>
      )}

      <Recommended />
      <PopularPlaces />
      <Footer />
    </>
  );
}

const CAT_ICONS = {
  Education: "🎓", Vehicle: "🚗", Property: "🏠", Employment: "💼",
  Mobiles: "📱", "Electronics": "🖥️", "Electronics & Home appliances": "🖥️",
  Matrimonial: "💍", Business: "🏪", Astrology: "🔮", "Lost & Found": "🔍",
  Service: "🔧", Personal: "👤", Pets: "🐾", Travel: "✈️",
  Furniture: "🛋️", "Public Notice": "📢", Other: "📦",
};

function getCatIcon(cat) {
  return CAT_ICONS[cat] || "📂";
}
