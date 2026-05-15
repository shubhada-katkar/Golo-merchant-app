"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileSidebar from "../components/ProfileSidebar";
import { getWishlistAds, toggleWishlist } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import { Loader2, Heart, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { isLoading, isAuthorized } = useRoleProtection("user");
  const router = useRouter();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return null;
  }

  useEffect(() => {
    if (isAuthenticated === true) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlistAds();
      if (res.success && Array.isArray(res.data)) {
        // Filter out nulls in case some ads were deleted
        const validAds = res.data.filter(Boolean);
        
        // Remove any duplicates by ad ID
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

  const handleRemove = async (wishlistId) => {
    try {
      const res = await toggleWishlist(wishlistId);
      if (res.success) {
        // Remove from UI — match by the UUID adId that's stored in wishlist
        setAds(prevAds => prevAds.filter(ad => ad.adId !== wishlistId));
      }
    } catch (err) {
      console.error("Failed to remove from wishlist", err);
    }
  };

  const getSafeImageSrc = (ad) => {
    if (ad?.images && ad.images.length > 0) {
      const src = ad.images[0].trim();
      if (src.startsWith("/") || src.startsWith("http")) return src;
    }
    return "/images/placeholder.webp";
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#F8F6F2] py-14 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-10">
          
          {/* SIDEBAR */}
          <ProfileSidebar />

          {/* CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm p-10 min-h-[500px]">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-semibold text-black">
                  My Wishlist
                </h2>
                <span className="text-gray-500 text-sm">
                  {ads.length} {ads.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={40} className="animate-spin text-[#157A4F] mb-4" />
                  <p className="text-gray-500">Loading your wishlist...</p>
                </div>
              ) : ads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Heart size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-500 mb-8 max-w-md">
                    You haven't added any items to your wishlist yet. Discover great deals and save them for later!
                  </p>
                  <Link href="/choja">
                    <button className="bg-[#157A4F] text-white px-8 py-3 rounded-full font-medium hover:bg-[#0f5c3a] transition-colors">
                      Browse Ads
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {ads.map((ad, index) => {
                    // wishlistId: the UUID stored in the wishlist array (for backend toggle & filter)
                    // linkId: used in the URL — prefer UUID, fallback to _id
                    const wishlistId = ad.adId;
                    const linkId = ad.adId || ad._id;
                    const price = ad?.price?.toLocaleString() || "0";
                    const isExternalImage = ad?.images?.length > 0;
                    
                    return (
                      <div key={`${linkId}-${index}`} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col pt-1">
                        
                        <div className="relative overflow-hidden pt-4 px-4 h-64">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleRemove(wishlistId);
                            }}
                            className="absolute z-10 top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 text-red-500 transition-colors"
                            title="Remove from wishlist"
                          >
                            <Trash2 size={18} />
                          </button>
                          <Link href={`/product/${linkId}`}>
                            <Image
                              src={getSafeImageSrc(ad)}
                              alt={ad.title || "Product Image"}
                              width={500}
                              height={300}
                              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500"
                              unoptimized={isExternalImage}
                            />
                          </Link>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                          <Link href={`/product/${linkId}`} className="block flex-1">
                            <h3 className="text-lg font-semibold text-black group-hover:text-[#F5B849] transition line-clamp-2">
                              {ad.title || "Product Name"}
                            </h3>
                            <p className="text-[#157A4F] text-xl font-bold mt-2">
                              ₹{price}
                            </p>
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                              <span className="truncate">{ad.location || ad.city || "Location not specified"}</span>
                              <span>•</span>
                              <span>{ad.category || "General"}</span>
                            </div>
                          </Link>

                          <Link href={`/product/${linkId}`} className="block mt-6">
                            <button className="w-full bg-[#F5B849] hover:bg-[#e0a631] transition-all duration-300 py-3 rounded-xl text-black font-medium shadow-sm hover:shadow-md">
                              View Details
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}