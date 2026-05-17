"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GolocalProfileSidebar from "../../components/GolocalProfileSidebar";
import { ChevronDown, Heart, MapPin, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getWishlistAds, toggleWishlist } from "../../lib/api";

export default function GolocalFavoritesPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlistAds();
      if (res?.success && Array.isArray(res.data)) {
        const validAds = res.data.filter(Boolean);
        const uniqueAds = Array.from(
          new Map(validAds.map(ad => [ad.adId || ad._id, ad])).values()
        );
        setAds(uniqueAds);
      }
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = useMemo(() => {
    if (!ads) return [];
    if (activeTab === "all") return ads;
    if (activeTab === "deals") {
      // Deals = offers only (exclude any ad items if present)
      return ads.filter(ad => ad._type === 'offer');
    }
    return ads;
  }, [ads, activeTab]);

  const getSafeImageSrc = (ad) => {
    if (ad?.images?.length > 0) {
      const src = ad.images[0].trim();
      if (src.startsWith("/") || src.startsWith("http")) return src;
    }
    return "/images/placeholder.webp";
  };

  const formatPrice = (ad) => {
    const price = Number(ad.price || ad.totalPrice || 0);
    return price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Price on request";
  };

  const getItemTag = (ad) => {
    if (ad._type === 'offer') return 'Offer';
    if (ad.status === "active") return "Active";
    if (ad.status === "pending") return "Pending";
    if (ad.status === "rejected") return "Rejected";
    if (ad.isPromoted) return "Promoted";
    return "Saved";
  };

  const getItemLink = (ad) => {
    if (ad._type === 'offer') {
      return `/nearby-deals/deal?offerId=${ad.adId || ad._id}`;
    }
    return `/nearby-deals/deal?offerId=${ad.adId || ad._id}`;
  };
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#f4f4f4]">
        <div className="w-full px-0 py-0">
          <div className="grid lg:grid-cols-[250px_1fr] min-h-[760px]">
            <GolocalProfileSidebar active="favorites" />

            <main className="p-5 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[32px] leading-none font-semibold text-[#2a2a2a]">Your Favorites</h1>
                  <p className="text-[#8a8a8a] mt-2 text-sm">
                    {loading ? "Loading..." : `${filteredAds.length} item${filteredAds.length !== 1 ? 's' : ''} saved`}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-1">
                  {["all", "deals"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize ${
                        activeTab === tab
                          ? "bg-[#157a4f] text-white"
                          : "text-[#707070] hover:bg-gray-100"
                      }`}
                    >
                      {tab === "all" ? "All" : "Deals"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 border border-[#e8e8e8] rounded-xl px-4 py-3 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="h-10 px-4 rounded-xl border border-[#e5e5e5] text-sm text-[#5d5d5d] inline-flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#157a4f]" /> Category: All <ChevronDown size={14} />
                  </button>
                  <button className="h-10 px-4 rounded-xl border border-[#e5e5e5] text-sm text-[#5d5d5d] inline-flex items-center gap-2">
                    Distance: Any <ChevronDown size={14} />
                  </button>
                </div>
                <div className="text-sm text-[#8a8a8a] inline-flex items-center gap-4">
                  <span>Showing {filteredAds.length} result{filteredAds.length !== 1 ? 's' : ''}</span>
                  <span className="text-[#3f3f3f] font-semibold">Sort: Recently Saved</span>
                </div>
              </div>

              {loading ? (
                <div className="mt-10 flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#157a4f] border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-gray-500">Loading your favorites...</p>
                </div>
              ) : filteredAds.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Heart size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {activeTab === "all" ? "Your favorites list is empty" : "No deals saved yet"}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md">
                    {activeTab === "all"
                      ? "Start exploring and save your favorite deals!"
                      : "Save some deals to see them here."}
                  </p>
                  <a href="/choja">
                    <button className="bg-[#157a4f] text-white px-8 py-3 rounded-full font-medium hover:bg-[#0f5c3a] transition-colors">
                      Explore Deals
                    </button>
                  </a>
                </div>
               ) : (
                <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredAds.map((ad, idx) => {
                    const locationText = [ad.city, ad.state].filter(Boolean).join(", ") || ad.location || ad.merchant?.address || "Location not specified";
                    const tag = getItemTag(ad);
                    const itemLink = getItemLink(ad);
                    return (
                      <div key={`${ad.adId || ad._id}-${idx}`} className="rounded-xl border border-[#e8e8e8] bg-white overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="relative h-28">
                          <Image
                            src={getSafeImageSrc(ad)}
                            alt={ad.title || "Saved item"}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                          <span className="absolute top-2 left-2 text-[10px] rounded-full bg-white/95 px-2 py-0.5 text-[#4a4a4a]">
                            {tag}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between text-[10px] text-[#9a9a9a]">
                            <span className="truncate max-w-[120px]">{ad.category || (ad._type === 'offer' ? 'Deal' : 'Category')}</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} /> {locationText.split(",")[0] || "Loc"}
                            </span>
                          </div>
                          <h3 className="mt-1 text-[16px] font-semibold text-[#262626] leading-tight line-clamp-2">
                            {ad.title || "Untitled Listing"}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-[#157a4f]">{formatPrice(ad)}</p>

                          <div className="mt-3 flex items-center gap-2">
                            <Link
                              href={itemLink}
                              className="flex-1 h-9 rounded-lg bg-[#157a4f] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#0f5c3a]"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={async () => {
                                try {
                                  await toggleWishlist(ad.adId || ad._id);
                                  setAds(prev => prev.filter(a => (a.adId || a._id) !== (ad.adId || ad._id)));
                                } catch (err) {
                                  console.error("Remove failed", err);
                                }
                              }}
                              className="w-9 h-9 rounded-lg border border-[#cde6da] text-[#157a4f] flex items-center justify-center hover:bg-[#f0fdf4]"
                              title="Remove from favorites"
                            >
                              <Heart size={14} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trending Section - kept as placeholder */}
              {filteredAds.length > 0 && (
                <div className="mt-8 border-t border-[#ececec] pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[24px] font-semibold text-[#2b2b2b]">Trending Near You</h2>
                      <p className="text-[15px] text-[#8a8a8a] mt-1">Based on your recent saves and searches.</p>
                    </div>
                    <button className="text-[#157a4f] text-sm font-semibold">View All Recommended →</button>
                  </div>

                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    {["/images/deal2.avif", "/images/place2.avif", "/images/banner3.avif"].map((img, i) => (
                      <div key={img + i} className="relative rounded-xl overflow-hidden h-48">
                        <Image src={img} alt="Recommended" fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute left-3 bottom-3 text-white">
                          <p className="text-[12px] font-semibold tracking-wide">RECOMMENDED</p>
                          <p className="text-base font-semibold leading-none">Local Artisans Market</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
