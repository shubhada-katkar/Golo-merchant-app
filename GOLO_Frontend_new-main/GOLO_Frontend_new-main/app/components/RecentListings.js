"use client";

import Image from "next/image";
import { useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getAllAds, getNearbyAds, searchAds } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "./AuthRequiredModal";

const SORT_OPTIONS = [
    { label: "Newest First", value: "createdAt_desc" },
    { label: "Oldest First", value: "createdAt_asc" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Nearby", value: "distance_asc" },
];

const BIG_CARD_LAYOUT = {
    col: "col-span-12 lg:col-span-6",
    row: "row-span-2",
};

const SMALL_CARD_LAYOUT = {
    col: "col-span-12 sm:col-span-6 lg:col-span-3",
    row: "row-span-1",
};

function getAdTemplateType(ad) {
    if (ad?.templateId === 1) return "big";
    if (ad?.templateId === 3) return "text";
    return "small";
}

function getSafeImageSrc(value) {
    if (!value || typeof value !== "string") return "/images/placeholder.webp";
    const src = value.trim();
    if (!src) return "/images/placeholder.webp";
    if (src.startsWith("/")) return src;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    return "/images/placeholder.webp";
}

function assignBentoLayout(adsList) {
    return adsList.map((ad) => {
        const type = getAdTemplateType(ad);
        const layout = type === "big" ? BIG_CARD_LAYOUT : SMALL_CARD_LAYOUT;
        return { ...ad, ...layout, type };
    });
}

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
            if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
            if (typeof value === "string") {
                const normalized = value.replace(/[^0-9.]/g, "");
                const parsed = Number(normalized);
                if (Number.isFinite(parsed) && parsed > 0) return parsed;
            }
        }

        return null;
    }

function RecentListingsContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortValue, setSortValue] = useState("createdAt_desc");
    const [userLocation, setUserLocation] = useState(null);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const { isAuthenticated } = useAuth();

    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";

    // Get user location for proximity sorting
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }
    }, []);

    useEffect(() => {
        async function fetchAds() {
            try {
                setLoading(true);
                const [sortBy, sortOrder] = sortValue.split("_");

                let response;
                // Choja should show the full public feed by default.
                // Use nearby ads only when the user explicitly selects Nearby.
                if (sortValue === "distance_asc" && userLocation?.lat && userLocation?.lng) {
                    response = await getNearbyAds({
                        lat: userLocation?.lat,
                        lng: userLocation?.lng,
                        category,
                        page: 1,
                        limit: 50
                    });
                } else if (q || location || category) {
                    response = await searchAds({
                        q,
                        category,
                        location,
                        sortBy,
                        sortOrder,
                        page: 1,
                        limit: 50,
                    });
                } else {
                    response = await getAllAds({
                        page: 1,
                        limit: 50,
                        sortBy,
                        sortOrder,
                    });
                }

                if (response.success) {
                    const adsList = response.data?.ads || response.data || [];
                    setAds(adsList);
                } else {
                    setError("Could not load listings.");
                    setAds([]);
                }
            } catch (err) {
                console.error("Error fetching ads:", err);
                setError("Failed to load listings.");
                setAds([]);
            } finally {
                setLoading(false);
            }
        }
        fetchAds();
    }, [q, category, location, sortValue, userLocation]);

    const layoutAds = assignBentoLayout(ads);

    return (
        <section className="w-full pt-4 pb-10">

            {/* Compact count + sort bar */}
            <div className="w-full px-6 lg:px-8 mb-6 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-400 font-medium">
                    {loading ? "Loading…" : ads.length > 0
                        ? `${ads.length} ad${ads.length !== 1 ? "s" : ""}`
                        : "No ads found"}
                    {q && <span> for &quot;{q}&quot;</span>}
                    {location && <span>{q ? " in " : " for "}&quot;{location}&quot;</span>}
                </p>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400 font-semibold">Sort:</label>
                    <select
                        value={sortValue}
                        onChange={e => setSortValue(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white cursor-pointer"
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="w-full px-6 lg:px-8">
                    <div className="grid grid-cols-12 auto-rows-[220px] gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className={`rounded-3xl bg-gray-100 animate-pulse ${i === 0
                                    ? "col-span-12 lg:col-span-6 row-span-2"
                                    : "col-span-12 sm:col-span-6 lg:col-span-3 row-span-1"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="text-center py-16 px-5 text-red-400">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && ads.length === 0 && (
                <div className="text-center py-16 px-5 text-gray-500">
                    <p>No listings available yet.</p>
                </div>
            )}

            {!loading && !error && ads.length > 0 && (
                <div className="w-full px-6 lg:px-8">
                    <div className="grid grid-cols-12 auto-rows-[220px] gap-6">
                        {layoutAds.map((ad, index) => {
                            const cls = `${ad.col} ${ad.row}`;
                            if (ad.type === "big") {
                                return <MultiImageAd key={ad._id || ad.adId || index} ad={ad} className={cls} isAuthenticated={isAuthenticated} onRequireAuth={() => setShowAuthPrompt(true)} />;
                            } else if (ad.type === "small") {
                                return <SingleImageAd key={ad._id || ad.adId || index} ad={ad} className={cls} isAuthenticated={isAuthenticated} onRequireAuth={() => setShowAuthPrompt(true)} />;
                            } else {
                                return <TextAd key={ad._id || ad.adId || index} ad={ad} className={cls} isAuthenticated={isAuthenticated} onRequireAuth={() => setShowAuthPrompt(true)} />;
                            }
                        })}
                    </div>
                </div>
            )}

            <AuthRequiredModal
                isOpen={showAuthPrompt}
                onClose={() => setShowAuthPrompt(false)}
                title="Login or Register"
                description="Please log in or register to chat, call, or post your ad."
                redirectTo={pathname || "/"}
            />
        </section>
    );
}

export default function RecentListings() {
    return (
        <Suspense fallback={
            <div className="w-full px-6 lg:px-8 py-10">
                <div className="grid grid-cols-12 auto-rows-[220px] gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-3xl bg-gray-100 animate-pulse ${i === 0
                                ? "col-span-12 lg:col-span-6 row-span-2"
                                : "col-span-12 sm:col-span-6 lg:col-span-3 row-span-1"
                                }`}
                        />
                    ))}
                </div>
            </div>
        }>
            <RecentListingsContent />
        </Suspense>
    );
}

function MultiImageAd({ ad, className, isAuthenticated, onRequireAuth }) {
    const router = useRouter();
    const images = ad.images && ad.images.length > 0
        ? ad.images.map(getSafeImageSrc)
        : ["/images/placeholder.webp", "/images/placeholder.webp", "/images/placeholder.webp"];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div
            onClick={() => {
                router.push(`/product/${ad._id || ad.adId}`);
            }}
            className={`relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl transition ${className}`}
        >
            {images.map((img, index) => (
                <Image
                    key={index}
                    src={img}
                    alt={ad.title || "Ad"}
                    fill
                    unoptimized
                    priority={index === current}
                    className={`object-cover transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                />
            ))}

            <div className="absolute inset-0 bg-black/50" />

            <div className="absolute bottom-0 p-8 text-white w-full">
                <h2 className="text-2xl font-bold leading-snug">{ad.title}</h2>
                <p className="mt-2 text-sm opacity-90">{ad.description}</p>
                {getDisplayPrice(ad) !== null && (
                    <p className="mt-4 text-2xl font-bold text-yellow-400">₹{getDisplayPrice(ad).toLocaleString("en-IN")}</p>
                )}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                                onRequireAuth();
                                return;
                            }
                            router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}`);
                        }}
                        className="px-4 py-2 text-sm rounded-xl theme-button-accent"
                    >
                        Chat
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                                onRequireAuth();
                                return;
                            }
                            router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}&autoCall=1`);
                        }}
                        className="px-4 py-2 text-sm rounded-xl theme-button-primary"
                    >
                        Call
                    </button>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-2">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${index === current ? "bg-white" : "bg-white/40"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

function SingleImageAd({ ad, className, isAuthenticated, onRequireAuth }) {
    const router = useRouter();
    const image = ad.images && ad.images[0] ? getSafeImageSrc(ad.images[0]) : "/images/placeholder.webp";

    return (
        <div
            onClick={() => {
                router.push(`/product/${ad._id || ad.adId}`);
            }}
            className={`relative rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition ${className}`}
        >
            <Image
                src={image}
                alt={ad.title || "Ad"}
                fill
                unoptimized
                priority
                className="object-cover group-hover:scale-105 transition duration-500"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 p-4 text-white w-full">
                <h3 className="text-sm font-semibold">{ad.title}</h3>
                {getDisplayPrice(ad) !== null && (
                    <p className="text-lg font-bold text-yellow-400 mt-1">₹{getDisplayPrice(ad).toLocaleString("en-IN")}</p>
                )}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                                onRequireAuth();
                                return;
                            }
                            router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}`);
                        }}
                        className="flex-1 py-2 text-xs rounded-lg theme-button-accent"
                    >
                        Chat
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                                onRequireAuth();
                                return;
                            }
                            router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}&autoCall=1`);
                        }}
                        className="flex-1 py-2 text-xs rounded-lg theme-button-primary"
                    >
                        Call
                    </button>
                </div>
            </div>
        </div>
    );
}

function TextAd({ ad, className, isAuthenticated, onRequireAuth }) {
    const router = useRouter();

    return (
        <div
            onClick={() => {
                router.push(`/product/${ad._id || ad.adId}`);
            }}
            className={`bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition cursor-pointer flex flex-col justify-between ${className}`}
        >
            <div>
                <span className="text-xs uppercase tracking-wide text-gray-400">{ad.category || "Category"}</span>
                <h3 className="mt-3 font-semibold text-gray-900 leading-snug">{ad.title}</h3>
                {getDisplayPrice(ad) !== null && (
                    <p className="mt-2 text-lg font-bold text-[var(--accent-500)]">₹{getDisplayPrice(ad).toLocaleString("en-IN")}</p>
                )}
            </div>
            <div className="flex gap-2 mt-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                            onRequireAuth();
                            return;
                        }
                        router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}`);
                    }}
                    className="flex-1 py-2 text-xs rounded-lg theme-button-accent"
                >
                    Chat
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                            onRequireAuth();
                            return;
                        }
                        router.push(`/chats?adId=${ad.adId || ad._id}&sellerId=${ad.userId || ''}&autoCall=1`);
                    }}
                    className="flex-1 py-2 text-xs rounded-lg theme-button-primary"
                >
                    Call
                </button>
            </div>
        </div>
    );
}