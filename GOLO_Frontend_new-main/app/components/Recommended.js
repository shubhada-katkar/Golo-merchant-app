"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getProfile, getNearbyOffers } from "../lib/api";

// Maps backend-stored category labels → offer category filter strings
// These must match what merchants set as their businessCategory/storeCategory
const CATEGORY_LABEL_TO_OFFER_FILTER = {
  "Food & Dining": "Food & Restaurants",
  "Home Services": "Home Services",
  "Beauty": "Beauty & Wellness",
  "Healthcare": "Healthcare & Medical",
  "Hotels & Accommodation": "Hotels & Accommodation",
  "Shopping & Retail": "Shopping & Retail",
  "Education & Training": "Education & Training",
  "Real Estate": "Real Estate",
  "Events & Entertainment": "Events & Entertainment",
  "Professional Services": "Professional Services",
  "Automotive Services": "Automotive Services",
  "Home Improvement": "Home Improvement",
  "Fitness & Sports": "Fitness & Sports",
  "Daily Needs & Utilities": "Daily Needs & Utilities",
  "Local Businesses & Vendors": "Local Businesses & Vendors",
};

const MIN_DEALS_PER_CATEGORY = 2;
const MAX_TOTAL_DEALS = 12;
const FETCH_PER_CATEGORY = 10;

function buildDealCard(offer) {
  const id = String(offer?.offerId || offer?._id || offer?.requestId || "");
  if (!id) return null;
  return {
    id,
    title: offer?.title || "Untitled Deal",
    img: offer?.imageUrl || offer?.images?.[0] || "/images/deal1.jpg",
    discount:
      offer?.discountPercent > 0
        ? `${offer.discountPercent}% OFF`
        : offer?.displayPrice > 0
        ? `Rs.${Number(offer.displayPrice).toLocaleString("en-IN")}`
        : "Special Offer",
    description:
      offer?.description ||
      (offer?.merchant?.name
        ? `${offer.merchant.name} • ${offer?.category || "General"}`
        : `Category: ${offer?.category || "General"}`),
    category: offer?.category || "",
  };
}

export default function Recommended() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [deals, setDeals] = useState([]);
  const [fetchState, setFetchState] = useState("idle"); // idle | loading | success | empty | error | unauthenticated | no-categories
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const fetchRecommended = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setFetchState("loading");
    } else {
      setIsRefreshing(true);
    }

    try {
      // Step 1: Get user's preferred categories from DB
      const profileRes = await getProfile();
      const preferredCategories = Array.isArray(profileRes?.data?.preferredCategories)
        ? profileRes.data.preferredCategories.filter(Boolean)
        : [];

      if (preferredCategories.length === 0) {
        setDeals([]);
        setFetchState("no-categories");
        setIsRefreshing(false);
        return;
      }

      // Step 2: Fetch deals for each category in parallel
      const seenIds = new Set();
      const allDeals = [];

      const categoryResults = await Promise.allSettled(
        preferredCategories.map(async (category) => {
          const filterCategory =
            CATEGORY_LABEL_TO_OFFER_FILTER[category] || category;
          try {
            const res = await getNearbyOffers({
              category: filterCategory,
              limit: FETCH_PER_CATEGORY,
              activeNowOnly: true,
              _t: Date.now(),
            });
            const rows = res?.success && Array.isArray(res?.data) ? res.data : [];
            return { category, rows };
          } catch {
            return { category, rows: [] };
          }
        })
      );

      // Step 3: Take at least MIN_DEALS_PER_CATEGORY from each category
      for (let catIdx = 0; catIdx < categoryResults.length; catIdx++) {
        const result = categoryResults[catIdx];
        if (result.status !== "fulfilled") continue;
        const { rows } = result.value;
        let takenFromCategory = 0;

        for (const offer of rows) {
          if (allDeals.length >= MAX_TOTAL_DEALS) break;
          if (takenFromCategory >= MIN_DEALS_PER_CATEGORY) break;
          const card = buildDealCard(offer);
          if (!card || seenIds.has(card.id)) continue;
          seenIds.add(card.id);
          allDeals.push(card);
          takenFromCategory++;
        }
      }

      // Step 4: Fill remaining slots if under MAX_TOTAL_DEALS
      if (allDeals.length < MAX_TOTAL_DEALS) {
        for (const result of categoryResults) {
          if (result.status !== "fulfilled") continue;
          const { rows } = result.value;

          for (const offer of rows) {
            if (allDeals.length >= MAX_TOTAL_DEALS) break;
            const card = buildDealCard(offer);
            if (!card || seenIds.has(card.id)) continue;
            seenIds.add(card.id);
            allDeals.push(card);
          }

          if (allDeals.length >= MAX_TOTAL_DEALS) break;
        }
      }

      if (allDeals.length === 0) {
        setDeals([]);
        setFetchState("empty");
      } else {
        setDeals(allDeals);
        setFetchState("success");
        setTimeout(updateScrollState, 100);
      }
    } catch {
      if (!isBackground) {
        setDeals([]);
        setFetchState("error");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setFetchState("unauthenticated");
      setDeals([]);
      return;
    }

    // Initial fetch
    fetchRecommended(false);

    // Re-fetch on tab focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchRecommended(true);
    };
    const handleFocus = () => fetchRecommended(true);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // Poll every 60s to stay fresh
    const interval = setInterval(() => fetchRecommended(true), 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [authLoading, user, fetchRecommended]);

  // Keep arrow visibility in sync with scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [deals, updateScrollState]);

  // ───── Skeleton Cards ─────
  const SkeletonCards = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-36 w-full animate-pulse bg-gray-200" />
        <div className="p-3 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    ));

  return (
    <section className="py-16 theme-section">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-semibold theme-heading">
            Recommended Deals
          </h2>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <span className="text-xs font-medium text-gray-400">Refreshing...</span>
            )}
            <button
              type="button"
              onClick={() => router.push("/nearby-deals")}
              className="theme-button-accent px-4 py-2 rounded-full text-sm transition"
              suppressHydrationWarning={true}
            >
              View More →
            </button>
          </div>
        </div>

        {/* Scroll Wrapper */}
        <div className="relative">

          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-[#157A4F] hover:text-white hover:border-[#157A4F] transition"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-[#157A4F] hover:text-white hover:border-[#157A4F] transition"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.recommended-scroll::-webkit-scrollbar { display: none; }`}</style>

          {/* Loading skeletons inline */}
          {fetchState === "loading" && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-36 w-full animate-pulse bg-gray-200" />
              <div className="p-3 space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          ))}

          {/* Not logged in */}
          {fetchState === "unauthenticated" && (
            <div className="w-full rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-700 font-semibold text-base mb-1">
                Personalized deals await you
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Log in to see deals matched to your interests.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login?redirect=/golocal/onboarding")}
                className="px-5 py-2 rounded-full bg-[#157A4F] text-white text-sm font-semibold hover:bg-[#12663f] transition"
              >
                Login
              </button>
            </div>
          )}

          {/* No categories set */}
          {fetchState === "no-categories" && (
            <div className="w-full rounded-xl border border-[#e7f3ed] bg-[#f7fcf9] p-8 text-center">
              <p className="text-[#157A4F] font-semibold text-base mb-1">
                Choose your interests
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Select 6 favourite categories to unlock deals personalised just for you.
              </p>
              <button
                type="button"
                onClick={() => router.push("/golocal/onboarding")}
                className="px-5 py-2 rounded-full bg-[#157A4F] text-white text-sm font-semibold hover:bg-[#12663f] transition"
              >
                Choose Categories →
              </button>
            </div>
          )}

          {/* Empty — categories set but no active deals */}
          {fetchState === "empty" && (
            <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No active deals found for your selected categories right now. Check back soon!
            </div>
          )}

          {/* Error */}
          {fetchState === "error" && (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              Could not load recommendations right now. Please try again later.
            </div>
          )}

          {/* Deal Cards */}
          {fetchState === "success" &&
            deals.map((deal, i) => (
              <article
                key={deal.id || i}
                onClick={() =>
                  deal.id &&
                  router.push(`/nearby-deals/deal?offerId=${encodeURIComponent(deal.id)}`)
                }
                className="group flex-shrink-0 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#157A4F] hover:shadow-lg cursor-pointer"
              >
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  <img
                    src={deal.img}
                    alt={deal.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/images/deal2.avif"; }}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#157A4F] to-[#28A745] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Recommended
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{deal.title}</h3>
                  <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
                    {deal.description || "Discover live deals near you."}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#157A4F]">{deal.discount}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deal.id) router.push(`/nearby-deals/deal?offerId=${encodeURIComponent(deal.id)}`);
                    }}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-[#F7F7F7] py-2 text-xs font-bold text-gray-800 transition-colors duration-200 hover:border-[#157A4F] hover:bg-[#157A4F] hover:text-white"
                  >
                    View Deal
                  </button>
                </div>
              </article>
            ))}

          </div>{/* end scroll row */}
        </div>{/* end relative wrapper */}
      </div>
    </section>
  );
}
