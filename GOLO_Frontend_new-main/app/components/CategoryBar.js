"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Grid } from "lucide-react";
import { createPortal } from "react-dom";

const mainCategories = [
  { name: "Education" },
  { name: "Vehicle", sub: ["Rent", "Buy"] },
  { name: "Property", sub: ["Rent", "Buy"] },
  { name: "Employment" },
  { name: "Mobiles" },
  { name: "Electronics & Home appliances" },
  { name: "Matrimonial" },
  { name: "Business" },
  { name: "Astrology" },
];

const extraCategories = [

  "Lost & Found",
  "Service",
  "Personal",
  "Pets",
  "Public Notice",
  "Travel",
  "Furniture",
  "Greetings & Tributes",
  "Other",
];

const allIconMap = {
  Education: "🎓", Vehicle: "🚗", Property: "🏠", Employment: "💼",
  Mobiles: "📱", "Electronics & Home appliances": "🖥️", Matrimonial: "💍",
  Business: "🏪", Astrology: "🔮", "Lost & Found": "🔍", Service: "🔧",
  Personal: "👤", Pets: "🐾", "Public Notice": "📢", Travel: "✈️",
  Furniture: "🛋️", "Greetings & Tributes": "🎁", Other: "📦",
};

const golocalIconMap = {
  "Food & Restaurants": "🍽️",
  "Home Services": "🧰",
  "Beauty & Wellness": "💆",
  "Healthcare & Medical": "🏥",
  "Hotels & Accommodation": "🏨",
  "Shopping & Retail": "🛍️",
  "Education & Training": "🎓",
  "Real Estate": "🏡",
  "Events & Entertainment": "🎉",
  "Professional Services": "💼",
  "Automotive Services": "🚗",
  "Home Improvement": "🔨",
  "Fitness & Sports": "🏋️",
  "Daily Needs & Utilities": "⚡",
  "Local Businesses & Vendors": "🏪",
};

export default function CategoryBar({ variant = "choja", preferredCategories = [] }) {
  return <CategoryBarContent variant={variant} preferredCategories={preferredCategories} />;
}

function CategoryBarContent({ variant = "choja", preferredCategories = [] }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [golocalActiveCategory, setGolocalActiveCategory] = useState(null);

  const buttonRefs = useRef({});
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  const pathname = usePathname();
  // Derive active category from URL like /category/Vehicle
  const activeCat = (() => {
    const match = pathname?.match(/^\/category\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  })();

  const activeGolocalCategoryFromUrl = (() => {
    if (pathname !== "/nearby-deals") return null;
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    return category ? decodeURIComponent(category) : null;
  })();

  const activeGolocalCategory = activeGolocalCategoryFromUrl || golocalActiveCategory;

  const golocalCategories = [
    { name: "Food & Restaurants" },
    { name: "Home Services" },
    { name: "Beauty & Wellness" },
    { name: "Healthcare & Medical" },
    { name: "Hotels & Accommodation" },
    { name: "Shopping & Retail" },
    { name: "Education & Training" },
    { name: "Real Estate" },
    { name: "Events & Entertainment" },
    { name: "Professional Services" },
    { name: "Automotive Services" },
    { name: "Home Improvement" },
    { name: "Fitness & Sports" },
    { name: "Daily Needs & Utilities" },
    { name: "Local Businesses & Vendors" },
  ];

   // Map backend category names to frontend display names for matching
   const BACKEND_TO_DISPLAY_MAP = {
     "Food & Dining": "Food & Restaurants",
     "Beauty": "Beauty & Wellness",
     "Healthcare": "Healthcare & Medical",
   };

   const preferredDisplaySet = useMemo(() => {
     const set = new Set();
     if (Array.isArray(preferredCategories) && preferredCategories.length > 0) {
       preferredCategories.forEach(cat => {
         const displayName = BACKEND_TO_DISPLAY_MAP[cat] || cat;
         if (golocalCategories.some(c => c.name === displayName)) {
           set.add(displayName);
         }
       });
     }
     return set;
   }, [preferredCategories]);

   const orderedGolocalCategories = useMemo(() => {
     const preferred = [];
     const others = [];
     golocalCategories.forEach(cat => {
       if (preferredDisplaySet.has(cat.name)) {
         preferred.push(cat);
       } else {
         others.push(cat);
       }
     });
     return [...preferred, ...others];
   }, [preferredDisplaySet]);

   const golocalVisibleCategories = orderedGolocalCategories.slice(0, 7);
   const categoriesToRender = variant === "golocal" ? golocalVisibleCategories : mainCategories;

  useEffect(() => {
    function handleClickOutside(e) {
      const clickedInsideWrapper = wrapperRef.current?.contains(e.target);
      const clickedInsideDropdown = dropdownRef.current?.contains(e.target);
      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToCategory = (categoryName, sub = null) => {
    if (variant === "golocal") {
      const nextParams = new URLSearchParams();
      nextParams.set("category", categoryName);

      const currentParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;

      const currentLocation = currentParams?.get("location");
      if (currentLocation) {
        nextParams.set("location", currentLocation);
      }

      const currentQuery = currentParams?.get("q");
      if (currentQuery) {
        nextParams.set("q", currentQuery);
      }

      const targetUrl = `/nearby-deals?${nextParams.toString()}`;

      if (typeof window !== "undefined") {
        window.location.assign(targetUrl);
      }

      setGolocalActiveCategory(categoryName);
      setActiveDropdown(null);
      setShowAllModal(false);
      return;
    }

    const encoded = encodeURIComponent(categoryName);
    const url = sub
      ? `/category/${encoded}?sub=${encodeURIComponent(sub)}`
      : `/category/${encoded}`;

    if (typeof window !== "undefined") {
      window.location.assign(url);
    }

    setActiveDropdown(null);
    setShowAllModal(false);
  };

  const handleCategoryClick = (cat) => {
    if (variant === "golocal") {
      navigateToCategory(cat.name);
      return;
    }

    if (!cat.sub) {
      navigateToCategory(cat.name);
      return;
    }

    if (activeDropdown === cat.name) {
      setActiveDropdown(null);
      return;
    }

    const rect = buttonRefs.current[cat.name]?.getBoundingClientRect();
    if (!rect) return;

    setDropdownPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });

    setActiveDropdown(cat.name);
  };

  return (
    <>
      {/* MAIN BAR */}
      <div ref={wrapperRef} style={{ width: "100%", background: variant === "golocal" ? "linear-gradient(180deg, #ffffff 0%, #fbfbfb 100%)" : "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", alignItems: "center", minHeight: variant === "golocal" ? "64px" : "56px", padding: variant === "golocal" ? "8px 24px" : "0 24px", gap: "10px" }}>

          <div
            style={{
              flex: 1,
              display: variant === "golocal" ? "grid" : "flex",
              gridTemplateColumns: variant === "golocal" ? "repeat(7, minmax(0, 1fr))" : undefined,
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: 0,
              gap: "6px",
              overflowX: variant === "golocal" ? "hidden" : "auto",
            }}
          >
            {categoriesToRender.map((cat) => (
              <div
                key={cat.name}
                style={{
                  flex: variant === "golocal" ? "unset" : 1,
                  minWidth: variant === "golocal" ? 0 : "max-content",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button
                  ref={(el) => (buttonRefs.current[cat.name] = el)}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    padding: variant === "golocal" ? "8px 10px" : "8px 12px", borderRadius: "999px", border: "none",
                    width: variant === "golocal" ? "100%" : "auto",
                    minHeight: variant === "golocal" ? "38px" : "auto",
                    overflow: variant === "golocal" ? "hidden" : "visible",
                    background: variant === "golocal"
                      ? activeGolocalCategory === cat.name
                        ? "#e6f4ee"
                        : "#f8faf9"
                      : activeCat === cat.name || activeDropdown === cat.name
                        ? "#e6f4ee"
                        : "transparent",
                    color: variant === "golocal"
                      ? activeGolocalCategory === cat.name
                        ? "#157A4F"
                        : "#374151"
                      : activeCat === cat.name || activeDropdown === cat.name
                        ? "#157A4F"
                        : "#374151",
                    fontWeight: variant === "golocal"
                      ? activeGolocalCategory === cat.name
                        ? 700
                        : 600
                      : activeCat === cat.name
                        ? 700
                        : 600,
                    fontSize: variant === "golocal" ? "14px" : "14px", cursor: variant === "golocal" ? "pointer" : "pointer", lineHeight: 1,
                    whiteSpace: "nowrap", transition: "all 0.15s",
                    borderBottom: variant === "golocal" ? "none" : activeCat === cat.name ? "2px solid #157A4F" : "2px solid transparent",
                    boxShadow: variant === "golocal" ? (activeGolocalCategory === cat.name ? "0 8px 20px rgba(21,122,79,0.12)" : "0 1px 3px rgba(0,0,0,0.04)") : "none",
                    borderRadius: variant === "golocal" ? "999px" : activeCat === cat.name ? "12px 12px 0 0" : "999px",
                  }}
                  onMouseEnter={e => { if (variant !== "golocal" && activeCat !== cat.name && activeDropdown !== cat.name) { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.color = "#157A4F"; } }}
                  onMouseLeave={e => { if (variant !== "golocal" && activeCat !== cat.name && activeDropdown !== cat.name) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#374151"; } }}
                >
                  <span
                    style={
                      variant === "golocal"
                        ? {
                            display: "block",
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }
                        : undefined
                    }
                    title={cat.name}
                  >
                    {cat.name}
                  </span>
                  {variant !== "golocal" && cat.sub && (
                    <ChevronDown size={12} style={{ transition: "transform 0.25s", transform: activeDropdown === cat.name ? "rotate(180deg)" : "none" }} />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => setShowAllModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: variant === "golocal" ? "8px 16px" : "6px 16px", borderRadius: "20px", border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#157A4F"; e.currentTarget.style.color = "#157A4F"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
            >
              <Grid size={14} />
              See All
            </button>
          </div>

        </div>
      </div>

      {/* DROPDOWN */}
      {activeDropdown && dropdownPosition && typeof window !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999,
              background: "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              borderRadius: "16px",
              padding: "8px",
              border: "1px solid #e5e7eb",
              minWidth: "180px",
              animation: "fadeDown 0.15s ease",
            }}
          >
            <style>{`@keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }`}</style>
            {/* Show parent category too */}
            <button
              onClick={() => navigateToCategory(activeDropdown)}
              style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "10px", border: "none", background: "transparent", fontWeight: 700, fontSize: "14px", color: "#157A4F", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              All {activeDropdown}
            </button>
            <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }} />
            {mainCategories
              .find((c) => c.name === activeDropdown)
              ?.sub?.map((subItem) => (
                <button
                  key={subItem}
                  onClick={() => navigateToCategory(activeDropdown, subItem)}
                  style={{ width: "100%", textAlign: "left", padding: "9px 14px", borderRadius: "10px", border: "none", background: "transparent", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {subItem}
                </button>
              ))}
          </div>,
          document.body
        )}

      {/* SEE ALL MODAL */}
      {showAllModal && typeof window !== "undefined" &&
        createPortal(
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAllModal(false); }}
          >
            <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "90%", maxWidth: "720px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>All Categories</h3>
                <button onClick={() => setShowAllModal(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: "10px", padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                  ✕ Close
                </button>
              </div>

              {/* Main categories */}
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: "12px", textTransform: "uppercase" }}>Categories</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px", marginBottom: "24px" }}>
               {(variant === "golocal" ? golocalCategories : mainCategories).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => navigateToCategory(cat.name)}
                    style={{ padding: "14px 10px", borderRadius: "14px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#374151", textAlign: "center", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#157A4F"; e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.color = "#157A4F"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.transform = "none"; }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                      {variant === "golocal"
                        ? golocalIconMap[cat.name] || "📂"
                        : allIconMap[cat.name] || "📂"}
                    </div>
                    {cat.name}
                  </button>
                ))}
              </div>

              {variant !== "golocal" && (
                <>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: "12px", textTransform: "uppercase" }}>More Categories</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                    {extraCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => navigateToCategory(cat)}
                        style={{ padding: "14px 10px", borderRadius: "14px", border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#374151", textAlign: "center", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#157A4F"; e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.color = "#157A4F"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.transform = "none"; }}
                      >
                        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{allIconMap[cat] || "📂"}</div>
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}