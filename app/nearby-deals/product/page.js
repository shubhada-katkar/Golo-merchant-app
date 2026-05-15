"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Tag,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import {
  getMerchantProductById,
  getNearbyOfferDetails,
  getPublicMerchantProductById,
  getPublicMerchantProducts,
  getPublicMerchantProfile,
  toggleWishlist,
  getWishlistIds,
  getAdWishlistCount,
} from "../../lib/api";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f3f3]" />}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <div className="mx-auto max-w-[1260px] px-4 lg:px-6 py-4 lg:py-6">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-[#dfe4ea]" />
        <div className="mb-4 h-3 w-64 animate-pulse rounded bg-[#e8edf2]" />
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="grid gap-6 p-4 lg:grid-cols-[1.2fr_1fr] lg:p-6">
            <div className="h-[400px] animate-pulse rounded-xl bg-[#e4e9ef] lg:h-[500px]" />
            <div className="space-y-4">
              <div className="flex justify-between gap-3">
                <div className="space-y-3 flex-1">
                  <div className="h-8 w-4/5 animate-pulse rounded bg-[#dfe4ea]" />
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[#edf2ff]" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#edf1f5]" />
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#edf1f5]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-[#edf1f5]" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-[#edf1f5]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#edf1f5]" />
              </div>
              <div className="h-36 animate-pulse rounded-xl bg-[#fff0cf]" />
              <div className="h-20 animate-pulse rounded-lg bg-[#e8f6ef]" />
              <div className="space-y-2">
                <div className="h-3 w-3/5 animate-pulse rounded bg-[#edf1f5]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#edf1f5]" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-[#edf1f5]" />
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-white p-6">
          <div className="mb-6 h-7 w-56 animate-pulse rounded bg-[#dfe4ea]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="flex gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-[#e4e9ef]" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 animate-pulse rounded bg-[#dfe4ea]" />
                <div className="h-3 w-36 animate-pulse rounded bg-[#edf1f5]" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-[#edf1f5]" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 animate-pulse rounded-lg bg-[#fff0cf]" />
              <div className="h-10 animate-pulse rounded-lg bg-[#e8f6ef]" />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only accept productId from URL - everything else comes from backend
  const productId = searchParams.get("id") || "";

  const [product, setProduct] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(null);

  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProductData = async (isBackgroundRefresh = false) => {
      if (!isBackgroundRefresh) setLoading(true);
      try {
        setError("");
        let productData = null;

        let gotLiveData = false;

        try {
          const productRes = await getMerchantProductById(productId);
          if (productRes?.data) {
            productData = productRes.data;
            gotLiveData = true;
          }
        } catch {
          productData = null;
        }

        if (!productData) {
          try {
            const publicProductRes = await getPublicMerchantProductById(productId);
            if (publicProductRes?.data) {
              productData = publicProductRes.data;
              gotLiveData = true;
            }
          } catch {
            productData = null;
          }
        }

        if (!productData && merchantId) {
          try {
            const publicRes = await getPublicMerchantProducts(merchantId, {
              page: 1,
              limit: 200,
            });
            const rows = Array.isArray(publicRes?.data?.products)
              ? publicRes.data.products
              : Array.isArray(publicRes?.data)
              ? publicRes.data
              : Array.isArray(publicRes?.data?.rows)
              ? publicRes.data.rows
              : Array.isArray(publicRes?.rows)
              ? publicRes.rows
              : [];
            productData = rows.find((item) => {
              const id = String(item?._id || item?.id || item?.productId || "");
              return id === String(productId);
            }) || null;
            if (productData) gotLiveData = true;
          } catch {
            productData = null;
          }
        }

        // productData will be fetched from backend APIs only

        if (!productData) {
          throw new Error(
            "Live product data could not be fetched. Please check backend/public product endpoints."
          );
        }

        if (!cancelled) {
          setProduct(productData);
          setLastUpdatedAt(new Date());
          if (!gotLiveData) {
            setError("Live product data is unavailable for this product.");
          }
        }

        // Merchant data is fetched independently if product has merchant info
      } catch (err) {
        if (!cancelled) {
          setError(err?.data?.message || err?.message || "Failed to load product details");
        }
      } finally {
        if (!cancelled && !isBackgroundRefresh) {
          setLoading(false);
        }
      }
    };

    loadProductData(false);
    const timer = setInterval(() => {
      loadProductData(true);
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [productId]);

  // Wishlist: fetch wishlist ids and wishlist count when product loads or auth changes
  useEffect(() => {
    let cancelled = false;
    async function fetchWishlistState() {
      const wishlistTargetId = product?._id || product?.productId || productId;
      if (!wishlistTargetId) return;

      try {
        const countRes = await getAdWishlistCount(wishlistTargetId);
        if (!cancelled && countRes?.success) {
          setWishlistCount(countRes.data?.wishlistCount ?? 0);
        }
      } catch {
        // ignore
      }

      if (!isAuthenticated) {
        setIsWishlisted(false);
        return;
      }

      try {
        const idsRes = await getWishlistIds();
        if (!cancelled && idsRes?.success && Array.isArray(idsRes.data)) {
          const ids = idsRes.data.map(String);
          const found = ids.includes(String(wishlistTargetId));
          setIsWishlisted(!!found);
        }
      } catch (err) {
        console.error("Failed to fetch wishlist status:", err);
      }
    }

    fetchWishlistState();

    return () => {
      cancelled = true;
    };
  }, [product, productId, isAuthenticated]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const wishlistTargetId = product?._id || product?.productId || productId;
    if (!wishlistTargetId) return;

    setIsTogglingWishlist(true);
    try {
      const res = await toggleWishlist(wishlistTargetId);
      if (res?.success) {
        const added = !!res.data?.added;
        setIsWishlisted(added);
        setWishlistCount((prev) => (prev === null ? null : added ? (prev || 0) + 1 : Math.max(0, (prev || 0) - 1)));
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on GOLO`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const discount = useMemo(() => {
    const original = Number(product?.originalPrice || 0);
    const offer = Number(product?.offerPrice || product?.price || 0);
    if (original <= 0 || offer >= original) return 0;
    return Math.round(((original - offer) / original) * 100);
  }, [product]);

  const productName = product?.productName || product?.name || "Product";
  const productPrice = Number(product?.offerPrice || product?.price || 0);
  const originalPrice = Number(product?.originalPrice || 0);
  const productImage = product?.imageUrl || product?.image || "/images/deal2.avif";
  const productDescription = product?.description || "Description unavailable.";
  const safeStock = Number(product?.stockQuantity ?? 0);
  const refreshedAt = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const merchantRating = Number(
    merchant?.rating ?? merchant?.averageRating ?? merchant?.profile?.rating ?? 0
  );
  const merchantReviewCount = Number(
    merchant?.reviewCount ?? merchant?.totalReviews ?? merchant?.profile?.reviewCount ?? 0
  );

  const dynamicSpecs = [
    { label: "Sub-category", value: product?.subCategory || product?.subcategory || null },
    { label: "Brand", value: product?.brand || null },
    { label: "SKU", value: product?.sku || product?.productCode || null },
    { label: "Unit", value: product?.unit || null },
  ].filter((item) => item.value);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f3f3f3]">
        <Navbar />
        <div className="mx-auto max-w-[1260px] px-6 py-20">
          <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-6 text-sm text-[#b91c1c]">
            {error || "Product not found"}
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
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-[#666] hover:text-[#333] mb-4 transition">
          <ArrowLeft size={16} />
          Back to Previous Page
        </button>

        <p className="text-[11px] text-[#7b7b7b] mb-4">
          Products <span className="mx-1">›</span> {product?.category || "All Categories"} <span className="mx-1">›</span>
          <span className="font-semibold text-[#2d2d2d]"> {productName}</span>
        </p>

        <section className="bg-white rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 p-4 lg:p-6">
            <div className="relative overflow-hidden rounded-xl bg-[#f0f0f0]">
              <div className="relative h-[400px] lg:h-[500px]">
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-sm text-[#666]">Loading image...</div>
                  </div>
                )}
              </div>
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#e7a91d] text-white px-3 py-1 rounded-full text-sm font-bold">
                  {discount}% OFF
                </span>
              )}
              <span className="absolute top-4 right-4 bg-[#157a4f] text-white px-3 py-1 rounded-full text-sm font-bold">
                Stock: {safeStock}
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-[#1b1f24] leading-tight">{productName}</h1>
                <div className="flex gap-2">
                  <button onClick={handleShare} className="p-2 rounded-full hover:bg-[#f0f0f0]" title="Share">
                    <Share2 size={20} className="text-[#666]" />
                  </button>
                  <button onClick={handleToggleWishlist} className={`p-2 rounded-full hover:bg-[#f0f0f0] ${isWishlisted ? 'bg-[#ffeef0]' : ''}`} title={isWishlisted ? 'Remove from favorites' : 'Add to favorites'}>
                    <Heart size={20} className={`text-[#666] ${isWishlisted ? 'text-[#e11d48]' : ''}`} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {product?.category && (
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={14} className="text-[#666]" />
                  <span className="text-sm text-[#666] bg-[#f0f4ff] px-2 py-1 rounded-full">{product.category}</span>
                </div>
              )}

              <p className="text-sm text-[#666] mb-4 leading-relaxed">{productDescription}</p>
              {refreshedAt && <p className="text-xs text-[#6b7280] mb-5">Live data refreshed at {refreshedAt}</p>}

              <div className="bg-[#fef5e7] rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl lg:text-4xl font-bold text-[#e7a91d]">Rs.{productPrice.toLocaleString("en-IN")}</span>
                  {originalPrice > 0 && originalPrice > productPrice && (
                    <>
                      <span className="text-lg text-[#999] line-through">Rs.{originalPrice.toLocaleString("en-IN")}</span>
                      <span className="bg-[#e7a91d] text-white px-2 py-1 rounded-full text-xs font-bold">SAVE {discount}%</span>
                    </>
                  )}
                </div>

                <button
                  className="w-full h-12 bg-[#157a4f] text-white rounded-lg font-bold text-lg transition-all hover:bg-[#0f6a42] flex items-center justify-center gap-2"
                  onClick={() => {
                    const merchantStoreId = product?.merchantId || product?.merchant?.merchantId || product?.merchant?._id || product?.merchant?.id;
                    if (merchantStoreId) {
                      sessionStorage.setItem("merchantId", merchantStoreId);
                      router.push("/nearby-deals/store");
                    } else {
                      router.back();
                    }
                  }}
                >
                  <ShoppingCart size={20} />
                  Visit Store
                </button>

                <p className="text-xs text-[#666] text-center mt-2">Visit the store to explore more products</p>
              </div>

              <div className="bg-[#f0f9f6] rounded-lg p-3 mb-4">
                <p className="text-xs font-bold text-[#157a4f] uppercase tracking-wide">Availability</p>
                <p className="font-bold text-[#1f2430] mt-1">
                  {safeStock > 0 ? `${safeStock} units in stock` : "Out of stock"}
                </p>
              </div>

              <div className="text-xs text-[#666] space-y-1">
                <p>• Product ID: {product?._id || product?.productId || "-"}</p>
                <p>• Merchant: {merchant?.name || product?.merchantName || "Unavailable"}</p>
                {product?.offerPrice && <p>• Discounted pricing available</p>}
              </div>
            </div>
          </div>
        </section>

        {merchant && (
          <section className="bg-white rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#1f2329] mb-6">About the Merchant</h2>
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f0f0f0]">
                    <Image
                      src={merchant?.profilePhoto || "/images/place2.avif"}
                      alt={merchant?.name || "Merchant"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1f2329]">{merchant?.name || "Merchant"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.round(merchantRating) ? "text-[#f4ba34]" : "text-[#d6dbe2]"}
                            fill={i < Math.round(merchantRating) ? "#f4ba34" : "none"}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[#666]">
                        {merchantRating > 0
                          ? `${merchantRating.toFixed(1)} (${merchantReviewCount} review${merchantReviewCount === 1 ? "" : "s"})`
                          : "Rating unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {merchant?.profile?.bio && <p className="text-sm text-[#666] leading-relaxed mb-4">{merchant.profile.bio}</p>}

                <div className="space-y-2 text-sm">
                  {merchant?.profile?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#157a4f]" />
                      <span className="text-[#666]">{merchant.profile.address}</span>
                    </div>
                  )}
                  {merchant?.profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-[#157a4f]" />
                      <span className="text-[#666]">{merchant.profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => merchantId && router.push(`/nearby-deals/store?merchantId=${merchantId}`)}
                  className="w-full h-10 bg-[#fef5e7] border border-[#e7a91d] text-[#8f6515] rounded-lg font-semibold text-sm hover:bg-[#fcecd8] transition"
                >
                  View Store →
                </button>

                <button
                  onClick={() => router.push("/nearby-deals")}
                  className="w-full h-10 bg-[#f0f4ff] border border-[#4a5fc1] text-[#4a5fc1] rounded-lg font-semibold text-sm hover:bg-[#e6edff] transition"
                >
                  Back to Deals
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#1f2329] mb-6">Product Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-[#1f2329] mb-3">Product Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">Name:</span>
                  <span className="font-medium text-[#1f2329]">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Category:</span>
                  <span className="font-medium text-[#1f2329]">{product?.category || "General"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Price:</span>
                  <span className="font-medium text-[#157a4f]">Rs.{productPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Stock:</span>
                  <span className="font-medium text-[#1f2329]">{safeStock}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1f2329] mb-3">Additional Features</h3>
              <div className="space-y-2 text-sm text-[#666]">
                {dynamicSpecs.length > 0 ? (
                  dynamicSpecs.map((spec) => (
                    <p key={spec.label}>• {spec.label}: {String(spec.value)}</p>
                  ))
                ) : (
                  <p>• Additional specifications are not provided by merchant.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
