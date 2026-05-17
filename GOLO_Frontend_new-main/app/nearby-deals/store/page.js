"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MapPin, Phone, Star, ArrowRight, ExternalLink, ShieldCheck, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getNearbyOffers,
  getPublicMerchantProducts,
  getPublicMerchantProfile,
  getPublicMerchantStoreLocation,
  getUserById,
} from "../../lib/api";

// Dynamically import Leaflet map
const LeafletMap = dynamic(() => import("../../components/LeafletMap"), { ssr: false });

export default function NearbyStorePage() {
  return (
    <Suspense fallback={<StoreLoadingSkeleton />}>
      <NearbyStoreContent />
    </Suspense>
  );
}

function StoreLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <div className="mx-auto max-w-[1260px] px-4 lg:px-6 py-4 lg:py-6">
        <div className="mb-4 h-3 w-56 animate-pulse rounded bg-[#dfe4ea]" />
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="grid gap-6 p-4 lg:grid-cols-[1.5fr_1fr] lg:p-6">
            <div className="h-[300px] animate-pulse rounded-xl bg-[#e4e9ef] lg:h-[400px]" />
            <div className="space-y-4">
              <div className="flex justify-between gap-3">
                <div className="space-y-3 flex-1">
                  <div className="h-8 w-4/5 animate-pulse rounded bg-[#dfe4ea]" />
                  <div className="h-8 w-3/5 animate-pulse rounded bg-[#edf1f5]" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#edf1f5]" />
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#edf1f5]" />
                </div>
              </div>
              <div className="h-14 animate-pulse rounded-xl bg-[#f0f3f7]" />
              <div className="h-32 animate-pulse rounded-xl bg-[#fff0cf]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 animate-pulse rounded-lg bg-[#edf2ff]" />
                <div className="h-20 animate-pulse rounded-lg bg-[#fff0cf]" />
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.75fr_1fr]">
          <div className="space-y-3">
            <div className="h-8 w-64 animate-pulse rounded bg-[#dfe4ea]" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-[12px] border border-[#d8dce3] bg-white p-3">
                <div className="h-16 w-16 animate-pulse rounded-lg bg-[#e4e9ef]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/5 animate-pulse rounded bg-[#dfe4ea]" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-[#edf1f5]" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded bg-[#edf1f5]" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[12px] bg-white" />
        </section>
      </div>
      <Footer />
    </main>
  );
}

function NearbyStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [merchant, setMerchant] = useState(null);
  const [location, setLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [merchantId, setMerchantId] = useState(null);

  // Read merchantId from sessionStorage first, fallback to searchParams
  useEffect(() => {
    const stored = sessionStorage.getItem("merchantId");
    const fromUrl = searchParams.get("merchantId");
    const id = stored || fromUrl;
    
    if (id) {
      setMerchantId(id);
      // Clear sessionStorage after reading to avoid persistence
      if (stored) {
        sessionStorage.removeItem("merchantId");
      }
    } else {
      setMerchantId(null);
    }
  }, [searchParams]);

  const normalizeId = (value) => String(value || "").trim();

  const extractOffers = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.offers)) return response.data.offers;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.offers)) return response.offers;
    if (Array.isArray(response?.items)) return response.items;
    return [];
  };

  const extractProducts = (response) => {
    if (Array.isArray(response?.data?.products)) return response.data.products;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.products)) return response.products;
    return [];
  };

  const dedupeProducts = (items = []) => {
    const map = new Map();

    items.forEach((item) => {
      const key = String(item?.productId || item?.id || item?.name || "");
      if (!key || map.has(key)) return;
      map.set(key, item);
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    const loadMerchantData = async () => {
      if (!merchantId) {
        setError("Merchant ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [userRes, offersRes] = await Promise.all([
          getUserById(merchantId),
          getNearbyOffers({ limit: 100 }),
        ]);

        if (!userRes?.data) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        const targetMerchantId = normalizeId(merchantId);
        const allOffers = extractOffers(offersRes);
        const merchantOffers = allOffers.filter((offer) => {
          const offerMerchantId = normalizeId(
            offer?.merchant?.merchantId ||
              offer?.merchantId ||
              offer?.merchant?._id ||
              offer?.merchant?.id ||
              offer?.userId,
          );
          return offerMerchantId === targetMerchantId;
        });
        setOffers(merchantOffers);

        const firstOfferMerchant = merchantOffers[0]?.merchant || null;
        const mergedMerchant = {
          ...userRes.data,
          name: firstOfferMerchant?.name || userRes.data?.name,
          profilePhoto: firstOfferMerchant?.profilePhoto || userRes.data?.profilePhoto,
          merchantProfile: userRes.data?.merchantProfile || null,
          profile: {
            ...(userRes.data?.profile || {}),
            address:
              userRes.data?.profile?.address ||
              userRes.data?.merchantProfile?.storeLocation ||
              firstOfferMerchant?.address ||
              "",
            phone:
              userRes.data?.profile?.phone ||
              userRes.data?.merchantProfile?.contactNumber ||
              "",
          },
        };

        setMerchant(mergedMerchant);

        const fallbackProducts = dedupeProducts(
          merchantOffers.flatMap((offer) =>
            Array.isArray(offer?.selectedProducts)
              ? offer.selectedProducts.map((product) => ({
                  ...product,
                  id: product?.productId,
                  name: product?.productName,
                  price: Number(product?.offerPrice || 0),
                  originalPrice: Number(product?.originalPrice || 0),
                  image: product?.imageUrl || "",
                  category: offer?.category || "Product",
                }))
              : [],
          ),
        );

        setProducts(fallbackProducts);
        setLocation(null);

        try {
          const publicProfileRes = await getPublicMerchantProfile(merchantId);
          if (publicProfileRes?.data) {
            setMerchant((prev) => ({
              ...prev,
              ...publicProfileRes.data,
              merchantProfile: publicProfileRes.data?.merchantProfile || prev?.merchantProfile || null,
              profile: {
                ...(prev?.profile || {}),
                ...(publicProfileRes.data?.profile || {}),
              },
            }));
          }
        } catch {
        }

        try {
          const locationRes = await getPublicMerchantStoreLocation(merchantId);
          if (locationRes?.data) {
            setLocation(locationRes.data);
          }
        } catch {
        }

        try {
          const productsRes = await getPublicMerchantProducts(merchantId, { limit: 100 });
          const publicProducts = extractProducts(productsRes);
          if (publicProducts.length > 0) {
            setProducts(publicProducts);
          }
        } catch {
        }
      } catch (err) {
        console.error("Error loading merchant data:", err);
        setError(err?.data?.message || err?.message || "Failed to load merchant data");
      } finally {
        setLoading(false);
      }
    };

    loadMerchantData();
  }, [merchantId]);

  if (loading) {
    return <StoreLoadingSkeleton />;
  }

  if (error || !merchant) {
    return (
      <main className="min-h-screen bg-[#f3f3f3]">
        <Navbar />
        <div className="mx-auto max-w-[1260px] px-6 py-20">
          <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-6 text-sm text-[#b91c1c]">
            {error || "Store not found"}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const storeRating = Math.round(Math.random() * 50) / 10 + 4;
  const reviewCount = Math.floor(Math.random() * 2000) + 500;
  const offerLocation = offers[0]?.merchant || null;
  const resolvedLatitude = Number(
    location?.latitude ??
      merchant?.merchantProfile?.storeLocationLatitude ??
      offerLocation?.latitude,
  );
  const resolvedLongitude = Number(
    location?.longitude ??
      merchant?.merchantProfile?.storeLocationLongitude ??
      offerLocation?.longitude,
  );
  const hasMapLocation =
    !Number.isNaN(resolvedLatitude) &&
    !Number.isNaN(resolvedLongitude) &&
    resolvedLatitude !== 0 &&
    resolvedLongitude !== 0;
  const resolvedAddress =
    location?.address ||
    merchant?.profile?.address ||
    merchant?.merchantProfile?.storeLocation ||
    offerLocation?.address ||
    "";
  const resolvedPhone =
    merchant?.profile?.phone ||
    merchant?.merchantProfile?.contactNumber ||
    "";
  const resolvedBio =
    merchant?.profile?.bio ||
    merchant?.merchantProfile?.storeSubCategory ||
    "Premium services and products from our trusted merchant";

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <Navbar />

      <div className="mx-auto max-w-[1260px] px-4 lg:px-6 pb-14 pt-5">
        {/* Breadcrumb */}
        <p className="text-[11px] text-[#7a7a7a]">
          Deals <span className="mx-1">›</span> {merchant?.profile?.city || "Store"} <span className="mx-1">›</span> 
          <span className="font-medium"> {merchant?.name || "Store"}</span>
        </p>

        {/* Store Header */}
        <h1 className="mt-3 text-3xl lg:text-5xl font-bold leading-none text-[#1f2329]">
          {merchant?.name || "Store"}
        </h1>
        <p className="mt-2 text-sm lg:text-base text-[#67707b]">
          {resolvedBio}
        </p>

        {/* Store Info */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs lg:text-sm text-[#4e5965]">
          <span className="font-semibold text-[#1f2329]">{resolvedAddress || (merchant?.profile?.city ? `${merchant.profile.city}${merchant.profile.state ? `, ${merchant.profile.state}` : ""}` : "Location")}</span>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#f2b632]">★★★★★</span>
            <span>
              <span className="font-semibold text-[#1f2329]">{(merchant?.averageRating ?? storeRating).toFixed(1)}</span>
              {" "}({(merchant?.totalReviews ?? reviewCount).toLocaleString()} Reviews)
            </span>
          </div>

          <span className="text-[#9ca3ad]">|</span>

          <span>
            {/* Location {resolvedPhone && <span className="ml-2">• {resolvedPhone}</span>} */}
          </span>
        </div>

        {/* Main Section */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Store Image */}
          <div className="overflow-hidden rounded-2xl border border-[#d8dce3] bg-white shadow-sm">
            <div className="relative h-80 lg:h-96">
              <Image
                src={merchant?.profilePhoto || "/images/place2.avif"}
                alt={merchant?.name || "Store"}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Store Info Card */}
          <aside className="rounded-2xl border border-[#d8dce3] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1f2329] mb-4">Store Information</h2>
            
            <div className="space-y-3 text-sm text-[#5f6974] border-b border-[#e5e8ec] pb-4 mb-4">
              {resolvedPhone && (
                <p><Phone size={14} className="mr-2 inline text-[#157a4f]" /> {resolvedPhone}</p>
              )}
              {merchant?.profile?.city && (
                <p><MapPin size={14} className="mr-2 inline text-[#157a4f]" /> 
                  {merchant.profile.city}
                  {merchant.profile.state && `, ${merchant.profile.state}`}
                </p>
              )}
              {merchant?.profile?.address && (
                <p className="text-xs text-[#666]">{merchant.profile.address}</p>
              )}
              {merchant?.profile?.bio && (
                <p className="mt-3 pt-3 border-t text-[#5d6670] text-xs leading-relaxed">{merchant.profile.bio}</p>
              )}
            </div>

            {merchant?.profile?.interests && merchant.profile.interests.length > 0 && (
              <div className="border-b border-[#e5e8ec] pb-4 mb-4">
                <p className="text-xs font-bold text-[#4a5fc1] uppercase tracking-wide mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {merchant.profile.interests.slice(0, 3).map((cat, idx) => (
                    <span key={`${cat}-${idx}`} className="text-xs bg-[#f0f4ff] text-[#4a5fc1] px-2 py-1 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#157a4f] uppercase tracking-wide">Store Location</p>
                  <p className="text-sm font-semibold text-[#1f2329] mt-1">
                    {resolvedAddress || "Merchant address will appear here once available"}
                  </p>
                </div>
                {hasMapLocation ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecf8f1] px-3 py-1 text-[11px] font-semibold text-[#157a4f]">
                    <MapPin size={12} />
                    Live Pin
                  </span>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border border-[#d8dce3] bg-[#f7faf8]">
                {hasMapLocation ? (
                  <div className="h-[240px]">
                    <LeafletMap
                      latitude={resolvedLatitude}
                      longitude={resolvedLongitude}
                      markerTitle={merchant?.name || "Merchant Store"}
                      zoom={15}
                    />
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-[#1f2329]">Location pin unavailable</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#66707c]">
                        Store coordinates have not been added for this merchant yet, so the live map cannot be shown.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {hasMapLocation ? (
                <p className="text-[11px] text-[#66707c]">
                  Pinpoint map showing the merchant store for easier tracking and navigation.
                </p>
              ) : null}
            </div>
          </aside>
        </section>

                {/* Content Sections Container */}
                <div className="mt-12 space-y-10">
          
                  {/* Popular Services Section */}
                  {offers.length > 0 && (
                    <section className="bg-white rounded-[32px] border border-[#eef2f6] p-6 lg:p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#f0f9f6] rounded-lg flex items-center justify-center text-[#157a4f]">
                          <ShieldCheck size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1f2329]">Popular Services</h2>
                      </div>

                      <div className="-mx-4 px-4 overflow-x-auto">
                        <div className="flex gap-5 w-max">
                          {offers.slice(0, 8).map((offer, idx) => (
                            <div key={offer?.offerId || offer?._id || `popular-offer-${idx}`} className="flex-none min-w-[280px]">
                              <div
                                className="group bg-white rounded-2xl border border-[#f1f5f9] overflow-hidden hover:shadow-lg hover:border-[#157a4f] transition-all duration-300 flex flex-col cursor-pointer h-full"
                                onClick={() => router.push(`/nearby-deals/deal?offerId=${offer.offerId}`)}
                              >
                                <div className="relative h-40 overflow-hidden bg-[#f8fafc]">
                                  <Image
                                    src={offer?.imageUrl || "/images/deal2.avif"}
                                    alt={offer?.title || "Offer"}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-2 left-2 bg-[#157a4f] text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                    Popular
                                  </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                  <div className="mb-3">
                                    <p className="text-[9px] font-bold text-[#4a5fc1] uppercase tracking-wider mb-1">{offer?.category || "Service"}</p>
                                    <h3 className="font-bold text-[#1e293b] text-sm line-clamp-1 group-hover:text-[#157a4f] transition-colors">
                                      {offer?.title}
                                    </h3>
                                  </div>
                                  <div className="mt-auto">
                                    <div className="flex items-baseline justify-between mb-3">
                                      <span className="text-lg font-black text-[#157a4f]">Rs.{offer?.totalPrice?.toLocaleString("en-IN")}</span>
                                    </div>
                                    <button className="w-full h-9 bg-[#f0f9f6] text-[#157a4f] rounded-lg font-bold text-[11px] hover:bg-[#157a4f] hover:text-white border border-[#157a4f]/5 transition-all">
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Products Section */}
                  {products.length > 0 && (
                    <section className="bg-white rounded-[32px] border border-[#eef2f6] p-6 lg:p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#fef5e7] rounded-lg flex items-center justify-center text-[#e7a91d]">
                          <ShoppingBag size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1f2329]">Products</h2>
                      </div>

                      <div className="-mx-4 px-4 overflow-x-auto">
                        <div className="flex gap-5 w-max">
                          {products.map((product, idx) => (
                            <div key={product?._id || product?.productId || product?.id || `${product?.name || 'product'}-${idx}`} className="flex-none min-w-[260px]">
                              <div className="group bg-white rounded-2xl border border-[#f1f5f9] overflow-hidden hover:shadow-lg hover:border-[#157a4f] transition-all duration-300 flex flex-col h-full">
                                <div className="relative h-40 overflow-hidden bg-[#f8fafc]">
                                  <Image
                                    src={product?.image || product?.imageUrl || "/images/place2.avif"}
                                    alt={product?.name || "Product"}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  {product?.originalPrice > product?.price && (
                                    <div className="absolute top-2 right-2 bg-[#e7a91d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                  <div className="mb-3">
                                    <p className="text-[9px] font-bold text-[#4a5fc1] uppercase tracking-wider mb-1">{product?.category || "Item"}</p>
                                    <h3 className="font-bold text-[#1e293b] text-sm line-clamp-1 group-hover:text-[#157a4f] transition-colors">
                                      {product?.name}
                                    </h3>
                                  </div>

                                  <div className="mt-auto">
                                    <div className="flex items-baseline justify-between mb-3">
                                      <span className="text-lg font-black text-[#157a4f]">Rs.{product?.price?.toLocaleString("en-IN") || "0"}</span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const pid = product?.productId || product?._id || product?.id;
                                        if (pid) {
                                          router.push(`/nearby-deals/product?id=${encodeURIComponent(pid)}`);
                                        }
                                      }}
                                      className="w-full h-9 bg-[#f0f9f6] text-[#157a4f] rounded-lg font-bold text-[11px] hover:bg-[#157a4f] hover:text-white border border-[#157a4f]/5 transition-all"
                                    >
                                      View Product
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* All Offers Section */}
                  {offers.length > 1 && (
                    <section className="bg-white rounded-[32px] border border-[#eef2f6] p-6 lg:p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-[#4a5fc1]">
                          <Star size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-[#1f2329]">Exclusive Offers</h2>
                      </div>

                      <div className="-mx-4 px-4 overflow-x-auto">
                        <div className="flex gap-5 w-max">
                          {offers.slice(1).map((offer, idx) => (
                            <div key={offer?.offerId || offer?._id || `offer-${idx}`} className="flex-none min-w-[280px]">
                              <div
                                onClick={() => router.push(`/nearby-deals/deal?offerId=${offer.offerId}`)}
                                className="group bg-white rounded-2xl border border-[#f1f5f9] overflow-hidden hover:shadow-lg hover:border-[#4a5fc1] transition-all duration-300 flex flex-col cursor-pointer h-full"
                              >
                                <div className="relative h-40 overflow-hidden">
                                  <Image
                                    src={offer?.imageUrl || "/images/deal2.avif"}
                                    alt={offer?.title || "Offer"}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#1f2329] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm">
                                    Offer
                                  </div>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                  <div className="mb-3">
                                    <span className="text-[9px] font-bold text-[#4a5fc1] uppercase tracking-wider block mb-1">{offer?.category || "Special"}</span>
                                    <h3 className="font-bold text-[#1e293b] text-sm line-clamp-1 group-hover:text-[#4a5fc1] transition-colors">
                                      {offer?.title}
                                    </h3>
                                  </div>
                                  <div className="mt-auto">
                                    <div className="flex items-baseline justify-between mb-3">
                                      <span className="text-lg font-black text-[#157a4f]">Rs.{offer?.totalPrice?.toLocaleString("en-IN") || "0"}</span>
                                    </div>
                                    <button className="w-full h-9 bg-[#f0f4ff] text-[#4a5fc1] rounded-lg font-bold text-[11px] hover:bg-[#4a5fc1] hover:text-white transition-all">
                                      Claim Now
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </div>

        {/* No Products/Offers */}
        {products.length === 0 && offers.length === 0 && (
          <section className="mt-12 bg-white rounded-2xl border border-[#d8dce3] p-8 text-center">
            <p className="text-[#666] text-lg">No products or offers available at this store yet</p>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}
