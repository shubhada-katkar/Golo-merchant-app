"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { Clock3, MapPin, Shield, Star, Ticket, User } from "lucide-react";
=======
import { Clock3, MapPin, Shield, Star, Ticket, ChevronDown, Share2, Heart, Info, Gift, Smartphone, Smile, AlertCircle, Check } from "lucide-react";
>>>>>>> fa4855bf1eec82f2df0f9d60a609234614253745
import { useAuth } from "../../context/AuthContext";
import { useVoucher } from "../../context/VoucherContext";
import { getNearbyOfferDetails, getNearbyOffers, getOfferReviews, toggleWishlist, getAdWishlistCount, getWishlistIds } from "../../lib/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function getTimeRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { expired: false, days, hours, minutes };
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function computeBestDiscountPercent(products = []) {
  return Math.round(
    products.reduce((best, product) => {
      const original = toNumber(product?.originalPrice, 0);
      const offer = toNumber(product?.offerPrice, 0);
      if (original <= 0 || offer < 0 || offer >= original) {
        return best;
      }
      const discount = ((original - offer) / original) * 100;
      return Math.max(best, discount);
    }, 0),
  );
}

function computeStartingPrice(products = [], fallback = 0) {
  if (!Array.isArray(products) || products.length === 0) {
    return toNumber(fallback, 0);
  }

  const values = products
    .map((item) => toNumber(item?.offerPrice, 0))
    .filter((price) => price > 0);

  if (!values.length) {
    return toNumber(fallback, 0);
  }

  return Math.min(...values);
}

export default function NearbyDealDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F3F3]" />}>
      <NearbyDealDetailsContent />
    </Suspense>
  );
}

function NearbyDealDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { claimOfferHandler, loading: claimLoading } = useVoucher();

  const [offer, setOffer] = useState(null);
  const [relatedOffers, setRelatedOffers] = useState([]);
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [claimError, setClaimError] = useState("");
  const [isClaimed, setIsClaimed] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [offerReviews, setOfferReviews] = useState([]);
  const [offerReviewStats, setOfferReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Handle like/unlike
  const handleToggleLike = async () => {
    if (!user) {
      router.push(`/login?redirect=/nearby-deals/deal?offerId=${offerId}`);
      return;
    }

    setLikeLoading(true);
    try {
      console.log("Toggling wishlist for offerId:", offerId);
      const res = await toggleWishlist(offerId);
      console.log("Wishlist toggle response:", res);
      const newLikedState = res?.data?.isLiked ?? !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: offer?.title || "Check out this offer!",
      text: `Grab this deal: ${offer?.title || "Special Offer"}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  useEffect(() => {
    if (!offer?.endsAt) {
      setTimeRemaining(null);
      return;
    }
    setTimeRemaining(getTimeRemaining(offer.endsAt));
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(offer.endsAt));
    }, 60000);
    return () => clearInterval(timer);
  }, [offer?.endsAt]);

  const offerId = searchParams.get("offerId") || "";

  // Check if offer is in wishlist and get likes count
  useEffect(() => {
    if (!offerId || !user) return;

    const loadWishlistInfo = async () => {
      try {
        // Get wishlist IDs to check if this offer is liked
        const idsRes = await getWishlistIds();
        const ids = idsRes?.data || [];
        setIsLiked(ids.includes(offerId));

        // Get likes count for this offer
        const countRes = await getAdWishlistCount(offerId);
        setLikesCount(countRes?.data?.count || 0);
      } catch (err) {
        console.error("Failed to load wishlist info:", err);
      }
    };

    loadWishlistInfo();
  }, [offerId, user]);

  const readCachedOffer = (id) => {
    if (!id || typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(`golo_nearby_offer_${id}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.offerId !== id) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadOffer = async () => {
      if (!offerId) {
        setLoadError("Offer ID is missing.");
        setLoadingOffer(false);
        return;
      }

      const cachedOffer = readCachedOffer(offerId);
      if (cachedOffer) {
        setOffer(cachedOffer);
      }

      try {
        setLoadingOffer(true);
        setLoadError("");
        const response = await getNearbyOfferDetails(offerId);
        if (response?.data) {
          setOffer(response.data);
        }
      } catch (err) {
        if (!cachedOffer) {
          setLoadError(err?.data?.message || err?.message || "Failed to load offer details.");
          setOffer(null);
        }
      } finally {
        setLoadingOffer(false);
      }
    };

    loadOffer();
  }, [offerId]);

  useEffect(() => {
    const loadOfferReviews = async () => {
      if (!offerId) {
        setOfferReviews([]);
        setLoadingReviews(false);
        return;
      }

      try {
        setLoadingReviews(true);
        const response = await getOfferReviews(offerId, { page: 1, limit: 6 });
        setOfferReviews(response?.data?.reviews || []);
        setOfferReviewStats(
          response?.data?.stats || {
            averageRating: 0,
            totalReviews: 0,
            breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        );
      } catch {
        setOfferReviews([]);
        setOfferReviewStats({
          averageRating: 0,
          totalReviews: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      } finally {
        setLoadingReviews(false);
      }
    };

    loadOfferReviews();
  }, [offerId]);

  // Load related offers
  useEffect(() => {
    const loadRelatedOffers = async () => {
      if (!offer?.category) return;
      try {
        const response = await getNearbyOffers({ category: offer.category, limit: 4 });
        if (response?.data) {
          setRelatedOffers(response.data.filter((o) => o.offerId !== offerId));
        }
      } catch {
        // Silently fail - related offers are nice-to-have
      }
    };

    loadRelatedOffers();
  }, [offer?.category, offerId]);

  const selectedProducts = useMemo(
    () => (Array.isArray(offer?.selectedProducts) ? offer.selectedProducts : []),
    [offer],
  );

  const startingPrice = useMemo(
    () => computeStartingPrice(selectedProducts, offer?.totalPrice),
    [selectedProducts, offer],
  );

  const bestDiscountPercent = useMemo(
    () => computeBestDiscountPercent(selectedProducts),
    [selectedProducts],
  );

  const validityText = useMemo(() => {
    if (!offer?.startsAt && !offer?.endsAt) return "Validity not specified";
    return `Ends ${formatDate(offer?.endsAt)}`;
  }, [offer]);

  const handleClaimOffer = async () => {
    if (!offerId) return;

    if (!user) {
      router.push(`/login?redirect=/nearby-deals/deal?offerId=${offerId}`);
      return;
    }

    setClaimError("");
    try {
      const response = await claimOfferHandler(offerId);
      const voucherId = response?.data?._id;
      if (!voucherId) {
        throw new Error("Voucher was created but voucher id is missing.");
      }
      setIsClaimed(true);
      router.push(`/nearby-deals/deal/claimed-offer?voucherId=${voucherId}`);
    } catch (err) {
      setClaimError(err?.data?.message || err?.message || "Failed to claim offer.");
    }
  };

  if (loadingOffer) {
    return (
      <main className="min-h-screen bg-[#F3F3F3]">
        <Navbar />
        <div className="mx-auto max-w-[1260px] px-6 py-20">
          <div className="rounded-xl border border-[#d8dce3] bg-white p-6 text-center text-sm text-[#6b7280]">
            Loading offer details...
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (loadError || !offer) {
    return (
      <main className="min-h-screen bg-[#F3F3F3]">
        <Navbar />
        <div className="mx-auto max-w-[1260px] px-6 py-20">
          <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-6 text-sm text-[#b91c1c]">
            {loadError || "Offer not found."}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <div className="mx-auto max-w-[1260px] px-4 lg:px-6 py-4 lg:py-6">
        {/* Breadcrumb */}
        <p className="text-[11px] text-[#7b7b7b] mb-4">
          Deals <span className="mx-1">›</span> {offer?.category || "All Categories"} <span className="mx-1">›</span>
          <span className="font-semibold text-[#2d2d2d]"> {offer?.title || "Offer"}</span>
        </p>

        {/* Hero Section */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 p-4 lg:p-6">
            {/* Image */}
            <div className="relative overflow-hidden rounded-xl bg-[#f0f0f0]">
              <Image
                src={offer?.imageUrl || "/images/deal2.avif"}
                alt={offer?.title || "Offer"}
                width={600}
                height={400}
                className="w-full h-[300px] lg:h-[400px] object-cover"
              />
              {bestDiscountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-[#e7a91d] text-white px-3 py-1 rounded-full text-sm font-bold">
                  {bestDiscountPercent}% OFF
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#1b1f24] leading-tight">
                  {offer?.title || "Untitled Offer"}
                </h1>
                <div className="flex gap-2">
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-[#f0f0f0]" 
                    aria-label="Share this offer"
                  >
                    <Share2 size={20} className="text-[#666]" />
                  </button>
                  <button 
                    onClick={handleToggleLike}
                    disabled={likeLoading}
                    className={`p-2 rounded-full hover:bg-[#f0f0f0] ${isLiked ? "bg-red-50" : ""}`}
                    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart 
                      size={20} 
                      className={isLiked ? "text-red-500 fill-red-500" : "text-[#666]"} 
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </button>
                  {likesCount > 0 && (
                    <span className="self-center text-sm text-[#666]">{likesCount}</span>
                  )}
                </div>
              </div>

<<<<<<< HEAD
            <section className="mt-8 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
              <div className="space-y-8">
                <div>
                  <h2 className="text-[32px] font-bold text-[#1f2329]">Selected Products</h2>
                  {selectedProducts.length === 0 ? (
                    <p className="mt-3 text-[14px] text-[#66707b]">No product details were provided for this offer.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {selectedProducts.map((item, index) => {
                        const productId = item?.productId || item?.id || item?._id;
                        return (
                          <article
                            key={`${productId || index}`}
                            onClick={() => productId && router.push(`/product/${productId}/merchant-page`)}
                            className="rounded-[12px] border border-[#d8dce3] bg-white p-3 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:border-[#157a4f] transition"
                            title="View product details"
                          >
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f3f4f6]">
                              <Image
                                src={item?.imageUrl || "/images/deal2.avif"}
                                alt={item?.productName || "Product"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-[15px] font-semibold text-[#1f2329]">{item?.productName || "Product"}</p>
                              <p className="text-[12px] text-[#6b7280]">Stock: {toNumber(item?.stockQuantity, 0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[16px] font-bold text-[#157a4f]">Rs.{toNumber(item?.offerPrice, 0).toLocaleString("en-IN")}</p>
                              <p className="text-[12px] text-[#9ca3af] line-through">Rs.{toNumber(item?.originalPrice, 0).toLocaleString("en-IN")}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
=======
              <p className="text-sm text-[#666] mb-4">
                {offer?.description || offer?.promotionExpiryText || "Experience premium services with this exclusive offer from our merchant partners."}
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e8edf2] bg-[#fbfcfd] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={15}
                        className={index < Math.round(offerReviewStats.averageRating || 0) ? "text-[#f4ba34]" : "text-[#d6dbe2]"}
                        fill={index < Math.round(offerReviewStats.averageRating || 0) ? "#f4ba34" : "none"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#1f2329]">
                    {offerReviewStats.totalReviews ? `${offerReviewStats.averageRating}/5` : "No ratings yet"}
                  </span>
                </div>
                <span className="text-sm text-[#66707b]">
                  {offerReviewStats.totalReviews
                    ? `${offerReviewStats.totalReviews} review${offerReviewStats.totalReviews > 1 ? "s" : ""} for this offer`
                    : "Be the first customer to rate this offer"}
                </span>
              </div>

              {/* Price Section */}
              <div className="bg-[#fef5e7] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl lg:text-5xl font-bold text-[#e7a91d]">
                    Rs.{startingPrice.toLocaleString("en-IN")}
                  </span>
                  {bestDiscountPercent > 0 && (
                    <span className="bg-[#e7a91d] text-white px-2 py-1 rounded-full text-xs font-bold">
                      SPECIAL
                    </span>
>>>>>>> fa4855bf1eec82f2df0f9d60a609234614253745
                  )}
                </div>

                                {claimError && (
                  <p className="text-red-600 text-sm mb-3 flex items-center gap-1">
                    <AlertCircle size={16} /> {claimError}
                  </p>
                )}

                <button
                  onClick={handleClaimOffer}
                  disabled={claimLoading || isClaimed}
                  className="w-full h-12 bg-white border-2 border-[#157a4f] text-[#157a4f] rounded-lg font-bold text-lg transition-all hover:bg-[#157a4f] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {claimLoading ? "Claiming..." : isClaimed ? (
                    <>
                      <Check size={20} /> Claimed
                    </>
                  ) : "Claim Offer"}
                </button>

                <p className="text-xs text-[#666] text-center mt-2 flex items-center justify-center gap-1">
                  <Shield size={14} /> Secure claim • No upfront payment required
                </p>
              </div>

              {/* Validity & Redemption */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f0f4ff] rounded-lg p-3">
                  <p className="text-xs font-bold text-[#4a5fc1] uppercase tracking-wide">Offer Ends</p>
                  {timeRemaining?.expired ? (
                    <p className="font-bold text-[#ef4444] mt-1">Expired</p>
                  ) : timeRemaining?.days !== undefined ? (
                    <p className="font-bold text-[#1f2430] mt-1">
                      {timeRemaining.days > 0
                        ? `${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''} left`
                        : timeRemaining.hours > 0
                        ? `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''} left`
                        : `${timeRemaining.minutes} min${timeRemaining.minutes > 1 ? 's' : ''} left`}
                    </p>
                  ) : (
                    <p className="font-bold text-[#1f2430] mt-1">{formatDate(offer?.endsAt)}</p>
                  )}
                </div>
                <div className="bg-[#fef5e7] rounded-lg p-3">
                  <p className="text-xs font-bold text-[#e7a91d] uppercase tracking-wide">Valid Until</p>
                  <p className="font-bold text-[#1f2430] mt-1">{formatDate(offer?.endsAt)}</p>
                </div>
              </div>

<<<<<<< HEAD
              <aside className="lg:sticky lg:top-24 h-fit self-start">
                <div className="rounded-[12px] border border-[#d8dce3] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-[#d8dce3] bg-[#f3f4f6]">
                      {offer?.merchant?.profilePhoto && String(offer.merchant.profilePhoto).trim() ? (
                        <Image
                          src={offer.merchant.profilePhoto}
                          alt={offer?.merchant?.name || "Merchant"}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[#9ca3af]">
                          <User size={22} />
                        </div>
                      )}
=======
              <p className="text-xs text-[#666] mt-3 flex items-center gap-1">
                <Clock3 size={12} /> Digital redemption via QR code
              </p>
            </div>
          </div>
        </section>

{/* About & Merchant Section */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mb-8">
          {/* About Section */}
                    <section className="bg-white rounded-2xl p-6 border border-[#e5e7eb]">
            <h2 className="text-2xl font-bold text-[#1f2329] mb-4 flex items-center gap-2">
              <Info size={24} className="text-[#4a5fc1]" /> About this offer
            </h2>
            <p className="text-[#5d6670] text-sm leading-relaxed mb-6">
              {offer?.description || offer?.promotionExpiryText || "Experience premium services with this exclusive offer from our merchant partners."}
            </p>
            
            {/* Products Section - More Prominent */}
            {selectedProducts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <h3 className="font-bold text-[#1f2329] mb-4 text-lg flex items-center gap-2">
                  <Gift size={22} className="text-[#157a4f]" /> Products Included in This Offer
                </h3>
                <div className="space-y-4">
                  {selectedProducts.map((product, idx) => (
                    <div 
                      key={idx} 
                      className="flex gap-4 p-4 rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] hover:border-[#157a4f] hover:bg-[#f0f9f6] transition-all cursor-pointer"
                      onClick={() => {
                        const selectedProductId = String(product?.productId || product?.id || `product-${idx}`);
                        const merchantStoreId = String(
                          offer?.merchantId || offer?.merchant?.merchantId || offer?.merchant?._id || offer?.merchant?.id || ''
                        );

                        // Keep URL compact and store richer fallback data in session cache.
                        if (typeof window !== 'undefined') {
                          try {
                            const cacheKey = `golo_nearby_offer_product_${offerId || 'na'}_${selectedProductId}`;
                            sessionStorage.setItem(
                              cacheKey,
                              JSON.stringify({
                                productId: selectedProductId,
                                offerId,
                                merchantId: merchantStoreId,
                                productName: product?.productName || product?.name || 'Product',
                                description: product?.description || 'Premium quality product',
                                imageUrl: product?.imageUrl || '/images/deal2.avif',
                                offerPrice: product?.offerPrice || 0,
                                originalPrice: product?.originalPrice || 0,
                                stockQuantity: product?.stockQuantity || 0,
                                category: product?.category || offer?.category || 'Product',
                              }),
                            );
                          } catch {}
                        }

                        const productParams = new URLSearchParams({
                          productId: selectedProductId,
                          offerId: offerId || '',
                          merchantId: merchantStoreId,
                        });
                        router.push(`/nearby-deals/product?${productParams.toString()}`);
                      }}
                    >
                      {/* Product Image */}
                      <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden rounded-lg bg-[#f0f0f0] border border-[#d8dce3]">
                        <Image
                          src={product?.imageUrl || "/images/deal2.avif"}
                          alt={product?.productName || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-[#1f2329] text-base mb-1">
                            {product?.productName || "Product"}
                          </p>
                          <p className="text-sm text-[#666] mb-2">
                            {product?.description || "Premium quality product"}
                          </p>
                          <p className="text-xs text-[#4a5fc1] font-medium">
                            Click to view product details →
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-[#157a4f]">
                              Rs.{toNumber(product?.offerPrice, 0).toLocaleString("en-IN")}
                            </span>
                            {product?.originalPrice > 0 && (
                              <>
                                <span className="text-sm text-[#999] line-through">
                                  Rs.{toNumber(product?.originalPrice, 0).toLocaleString("en-IN")}
                                </span>
                                <span className="text-sm font-bold text-white bg-[#e7a91d] px-2 py-1 rounded-full">
                                  {Math.round(((product?.originalPrice - product?.offerPrice) / product?.originalPrice) * 100)}% OFF
                                </span>
                              </>
                            )}
                          </div>
                          {product?.stockQuantity !== undefined && product?.stockQuantity > 0 && (
                            <span className="text-xs font-semibold text-[#4a5fc1] bg-[#f0f4ff] px-3 py-1.5 rounded-full">
                              Stock: {product.stockQuantity}
                            </span>
                          )}
                        </div>
                      </div>
>>>>>>> fa4855bf1eec82f2df0f9d60a609234614253745
                    </div>
                  ))}
                </div>
              </div>
            )}

            {offer?.exampleUsage && (
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <h3 className="font-bold text-[#1f2329] mb-2">How to Use</h3>
                <p className="text-sm text-[#5d6670] leading-relaxed">{offer.exampleUsage}</p>
              </div>
            )}

            {offer?.merchant?.name && (
              <p className="text-xs text-[#666] mt-6 pt-6 border-t border-[#e5e7eb]">
                <span className="font-semibold text-[#1f2329]">{offer.merchant.name}</span> is dedicated to providing premium services and professional care.
              </p>
            )}
          </section>

          {/* Merchant Card */}
          <section className="bg-white rounded-2xl p-6 h-fit border border-[#e5e7eb]">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                <Image
                  src={offer?.merchant?.profilePhoto || "/images/place2.avif"}
                  alt={offer?.merchant?.name || "Store"}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
                <div>
                  <p className="font-bold text-[#1f2329]">{offer?.merchant?.name || "Store"}</p>
                  <p className="text-xs text-[#666] flex items-center gap-1">
                    <Star size={12} className="text-[#f4ba34]" fill="#f4ba34" />
                    {offerReviewStats.totalReviews
                      ? `${offerReviewStats.averageRating}/5 from ${offerReviewStats.totalReviews} offer review${offerReviewStats.totalReviews > 1 ? "s" : ""}`
                      : "Verified Store"}
                  </p>
                </div>
            </div>
            <div className="bg-[#f9fafb] rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-[#4a5fc1] uppercase tracking-wide mb-1">Response time</p>
              <p className="font-semibold text-[#1f2430]">Usually &lt;1 hour</p>
            </div>
            <div className="bg-[#f9fafb] rounded-lg p-3 mb-4">
              <p className="text-xs font-bold text-[#4a5fc1] uppercase tracking-wide mb-1">Under 1 hour</p>
              <p className="text-xs text-[#666] flex items-center gap-1">
                <MapPin size={12} /> {offer?.merchant?.address || "Location"}
              </p>
            </div>
<button
               onClick={() => {
                 const merchantStoreId =
                   offer?.merchant?.merchantId ||
                   offer?.merchantId ||
                   offer?.merchant?._id ||
                   offer?.merchant?.id;

                 if (!merchantStoreId) {
                   alert("Store details are unavailable for this offer.");
                   return;
                 }

                 router.push(`/nearby-deals/store?merchantId=${merchantStoreId}`);
               }}
               className="w-full h-10 bg-[#fef5e7] border border-[#e7a91d] text-[#8f6515] rounded-lg font-semibold text-sm hover:bg-[#fcecd8] transition"
             >
               View Store →
             </button>

             <button
               onClick={() => router.push('/nearby-deals')}
               className="w-full h-10 bg-[#fef5e7] border border-[#e7a91d] text-[#8f6515] rounded-lg font-semibold text-sm hover:bg-[#fcecd8] transition mt-2"
             >
               Back to Nearby Deals
             </button>
          </section>
        </div>

                {/* Terms & Restrictions */}
        <section className="bg-white rounded-2xl p-6 mb-8 border border-[#e5e7eb]">
          <h2 className="text-2xl font-bold text-[#1f2329] mb-4">Terms & Restrictions</h2>
          <div className="space-y-3">
            {offer?.termsAndConditions ? (
              <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedTerms(expandedTerms === 0 ? null : 0)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#f9fafb] transition"
                >
                  <p className="font-bold text-[#1f2329]">Terms & Conditions</p>
                  <ChevronDown
                    size={20}
                    className={`text-[#666] transition-transform ${expandedTerms === 0 ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedTerms === 0 && (
                  <div className="px-4 pb-4 bg-[#f9fafb]">
                    <p className="text-sm text-[#5d6670]">{offer.termsAndConditions}</p>
                  </div>
                )}
              </div>
            ) : [
              { title: "Fine Print", content: "Voucher is valid for one person only. Cannot be combined with other offers. Appointment required at least 24 hours in advance. Subject to availability." },
              { title: "Cancellation Policy", content: "Free cancellation up to 48 hours before appointment. 50% refund for cancellations between 24-48 hours. No refund for cancellations within 24 hours." },
              { title: "Eligibility", content: "Offer is for new and existing customers. Not applicable to gift cards. Subject to terms and conditions of the merchant." },
            ].map((item, idx) => (
              <div key={item.title} className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedTerms(expandedTerms === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#f9fafb] transition"
                >
                  <p className="font-bold text-[#1f2329]">{item.title}</p>
                  <ChevronDown
                    size={20}
                    className={`text-[#666] transition-transform ${expandedTerms === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedTerms === idx && (
                  <div className="px-4 pb-4 bg-[#f9fafb]">
                    <p className="text-sm text-[#5d6670]">{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* How to Redeem */}
        <section className="bg-white rounded-2xl p-6 mb-8 border border-[#e5e7eb]">
          <h2 className="text-2xl font-bold text-[#1f2329] mb-6">How to Redeem</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Ticket size={40} className="text-[#157a4f]" />, title: "Claim Offer", desc: "Click the claim button to secure your unique voucher code" },
              { icon: <Smartphone size={40} className="text-[#4a5fc1]" />, title: "Show Code", desc: "Present the digital QR code at the merchant location during visit" },
              { icon: <Smile size={40} className="text-[#e7a91d]" />, title: "Enjoy!", desc: "Redeem your discount and enjoy your premium wellness experience" },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-3">{step.icon}</div>
                <h3 className="font-bold text-[#1f2329] mb-2">{step.title}</h3>
                <p className="text-sm text-[#666]">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-white rounded-2xl p-6 mb-8 border border-[#e5e7eb]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1f2329]">What people are saying</h2>
              <p className="mt-1 text-sm text-[#66707b]">Ratings and feedback from customers who redeemed this offer.</p>
            </div>
            <div className="rounded-2xl border border-[#e8edf2] bg-[#fbfcfd] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7b8590]">Offer rating</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-3xl font-bold leading-none text-[#1f2329]">
                  {offerReviewStats.totalReviews ? offerReviewStats.averageRating : "0.0"}
                </span>
                <span className="pb-1 text-sm text-[#66707b]">
                  {offerReviewStats.totalReviews} review{offerReviewStats.totalReviews === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-5 text-sm text-[#66707b]">
                Loading reviews...
              </div>
            ) : offerReviews.length ? (
              offerReviews.map((review) => (
                <div key={review._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d1d5db] text-sm font-bold text-[#42505f]">
                        {(review.userName || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <p className="font-bold text-[#1f2329]">{review.userName || "Customer"}</p>
                    </div>
                    <p className="text-xs text-[#999]">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }) : "-"}
                    </p>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < (review.rating || 0) ? "text-[#fbbf24]" : "text-[#d6dbe2]"}
                        fill={i < (review.rating || 0) ? "#fbbf24" : "none"}
                      />
                  ))}
                </div>
                <p className="text-sm text-[#5d6670]">{review.content}</p>
              </div>
            ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#d7dde5] bg-[#fafcfd] px-4 py-6 text-sm text-[#66707b]">
                No customer reviews yet for this offer. Once someone redeems and shares feedback, it will appear here.
              </div>
            )}
            <p className="hidden">
              See all reviews →
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-2xl p-6 mb-12 border border-[#e5e7eb]">
          <h2 className="text-2xl font-bold text-[#1f2329] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: "Can I buy this as a gift?", a: "Yes! Once you claim the offer, you can share the redemption code with a friend." },
              { q: "What should I bring to the spa?", a: "Asure provides robes, slippers, and toiletries. Just bring yourself and a copy of the QR code." },
              { q: "Is gratuity included?", a: "Gratuity is not included in the deal price and is at the discretion of the customer." },
            ].map((faq, idx) => (
              <div key={idx} className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedTerms(expandedTerms === `faq-${idx}` ? null : `faq-${idx}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#f9fafb] transition"
                >
                  <p className="font-semibold text-[#1f2329] text-left">{faq.q}</p>
                  <ChevronDown
                    size={20}
                    className={`text-[#666] transition-transform flex-shrink-0 ml-3 ${expandedTerms === `faq-${idx}` ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedTerms === `faq-${idx}` && (
                  <div className="px-4 pb-4 bg-[#f9fafb]">
                    <p className="text-sm text-[#5d6670]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Section */}
        {relatedOffers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1f2329]">Recommended for you</h2>
              <p className="text-[#4a5fc1] text-sm font-semibold cursor-pointer hover:underline">
                Browse all deals →
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedOffers.slice(0, 4).map((item) => (
                <div
                  key={item.offerId}
                  onClick={() => router.push(`/nearby-deals/deal?offerId=${item.offerId}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition"
                >
                  <div className="relative h-40 bg-[#f0f0f0] overflow-hidden">
                    <Image
                      src={item?.imageUrl || "/images/deal2.avif"}
                      alt={item?.title || "Deal"}
                      fill
                      className="object-cover hover:scale-105 transition"
                    />
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      SOLD OUT
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-[#1f2329] text-sm mb-1">{item?.title}</p>
                    <p className="text-[#666] text-xs mb-2">{item?.merchant?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#e7a91d]">
                        Rs.{computeStartingPrice(item?.selectedProducts || [], item?.totalPrice)}
                      </span>
                      <span className="text-[#999] text-xs">
                        Rs.{item?.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
