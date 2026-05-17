"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import {
  getMerchantRealtimeAnalytics,
  getMerchantLikedProducts,
  getMerchantProfile,
} from "../../lib/api";

export default function MerchantAnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [deviceData, setDeviceData] = useState({ Mobile: 62.5, Desktop: 25, Tablet: 12.5 });
  const [regions, setRegions] = useState([
    { region: "Karveer", percent: 95 },
    { region: "Gandhinglaj", percent: 62 },
    { region: "Panhala", percent: 30 },
    { region: "Ichalkaranji", percent: 78 },
    { region: "Radhanagari", percent: 45 },
  ]);
  const [topProducts, setTopProducts] = useState([]);
  const [eventStats, setEventStats] = useState({ totalActive: 0, newSignups: 0, retention: 0 });
  const [trendLabels, setTrendLabels] = useState(["1 Jan", "5 Jan", "10 Jan", "15 Jan", "20 Jan", "25 Jan", "31 Jan"]);
  const [monthlyTrend, setMonthlyTrend] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loadError, setLoadError] = useState("");
  const [likedOffers, setLikedOffers] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [ageRows, setAgeRows] = useState([
    { label: "18-24", male: 40, female: 60, total: "3.3%" },
    { label: "25-34", male: 54, female: 46, total: "12.7%" },
    { label: "35-44", male: 48, female: 52, total: "15.2%" },
    { label: "45-64", male: 59, female: 41, total: "25.3%" },
    { label: "65+", male: 45, female: 55, total: "33.5%" },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/analytics");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let intervalId;

    const loadAnalytics = async () => {
      if (!user || user.accountType !== "merchant") return;
      try {
        setLoadError("");

        const realtime = await getMerchantRealtimeAnalytics();
        const payload = realtime?.data || {};

        if (payload.device) {
          setDeviceData({
            Mobile: Number(payload.device.Mobile || 0),
            Desktop: Number(payload.device.Desktop || 0),
            Tablet: Number(payload.device.Tablet || 0),
          });
        }

        if (Array.isArray(payload.regions) && payload.regions.length) {
          setRegions(payload.regions.map((r) => ({ region: r.region, percent: Number(r.percent || 0) })));
        }

        if (Array.isArray(payload.products)) {
          setTopProducts(payload.products);
        }

        if (payload.events) {
          setEventStats({
            totalActive: Number(payload.events.totalActive || 0),
            newSignups: Number(payload.events.newSignups || 0),
            retention: Number(payload.events.retention || 0),
          });
        }

        if (payload.trend?.values?.length) {
          setMonthlyTrend(payload.trend.values.map((v) => Number(v || 0)));
        }

        if (payload.trend?.labels?.length) {
          setTrendLabels(payload.trend.labels);
        }
      } catch (err) {
        setLoadError("Failed to load realtime analytics data.");
      }
    };

    loadAnalytics();
    intervalId = setInterval(loadAnalytics, 20000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  useEffect(() => {
    const loadMerchantProfile = async () => {
      if (!user || user.accountType !== "merchant") return;
      try {
        const response = await getMerchantProfile();
        setMerchantProfile(response?.data || null);
      } catch {
        setMerchantProfile(null);
      }
    };

    loadMerchantProfile();
  }, [user]);

  // Fetch liked products for merchant (keep fallback if none)
  useEffect(() => {
    let intervalId;

    const loadLikedProducts = async () => {
      if (!user || user.accountType !== "merchant") return;
      try {
        const response = await getMerchantLikedProducts?.(10);
        const data = response?.data || {};

        const mappedOffers = Array.isArray(data.offers)
          ? data.offers.map((item) => ({
              name: item.name || 'Untitled Offer',
              type: item.type || 'General',
              likes: Number(item.likes || 0),
              image: item.image || '/images/deal2.avif',
              customers: item.customers || 'No customers yet',
              customerCount: Number(item.customerCount || 0),
              offerId: item.offerId || '',
            }))
          : [];

        const mappedProducts = Array.isArray(data.products)
          ? data.products.map((item) => ({
              name: item.name || 'Untitled Product',
              type: item.type || 'General',
              likes: Number(item.likes || 0),
              image: item.image || '/images/deal2.avif',
              customers: item.customers || 'No customers yet',
              customerCount: Number(item.customerCount || 0),
              productId: item.productId || '',
              offerName: item.offerName || '',
            }))
          : [];

        setLikedOffers(mappedOffers);
        setLikedProducts(mappedProducts);
      } catch (err) {
        setLikedOffers([]);
        setLikedProducts([]);
        setLoadError((prev) => prev || "Failed to load liked offers/products data.");
      }
    };
    loadLikedProducts();
    intervalId = setInterval(loadLikedProducts, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#efefef]" />;
  }

  if (user.accountType !== "merchant") return null;

  const analyticsStoreName =
    merchantProfile?.storeName ||
    merchantProfile?.name ||
    user?.storeName ||
    user?.name ||
    "Your Store";
  const analyticsStoreAvatar =
    merchantProfile?.profilePhoto ||
    merchantProfile?.shopPhoto ||
    user?.profilePhoto ||
    "/images/place2.avif";

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="analytics" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
            {loadError ? (
              <div className="lg:col-span-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                {loadError}
              </div>
            ) : null}

            <div className="rounded-[12px] border border-[#dddddd] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-[#f0f7f2] px-2 py-0.5 text-[9px] font-semibold text-[#157a4f]">Live Data</span>
                  <h1 className="mt-3 text-[26px] font-semibold leading-none">Monthly customer</h1>
                  <p className="text-[12px] text-[#6f6f6f] mt-1">Growth analysis for the current month</p>
                </div>

                <div className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-[#ddd]">
                        {analyticsStoreAvatar.startsWith('file://') ? (
                          <img src={analyticsStoreAvatar} alt={analyticsStoreName} className="h-full w-full object-cover" />
                        ) : (
                          <Image src={analyticsStoreAvatar} alt={analyticsStoreName} width={32} height={32} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="text-[24px] font-semibold">{analyticsStoreName}</p>
                    </div>
                  <p className="mt-2 text-[11px] text-[#2f8f55] inline-flex rounded-full bg-[#edf8f0] px-2 py-0.5">↗ +1,208 more than usual</p>
                </div>
              </div>

              <div className="mt-3 rounded-[10px] border border-[#ececec] bg-[#fbfbfb] p-3">
                <svg viewBox="0 0 760 300" className="w-full h-[250px]">
                  {[30, 20, 10, 0].map((y) => (
                    <g key={y}>
                      <line x1="36" y1={40 + (30 - y) * 7.2} x2="740" y2={40 + (30 - y) * 7.2} stroke="#d8d8d8" strokeDasharray="4 4" />
                      <text x="2" y={44 + (30 - y) * 7.2} fontSize="10" fill="#888">{y}</text>
                    </g>
                  ))}

                  <polyline
                    fill="none"
                    stroke="#157a4f"
                    strokeWidth="2.2"
                    points={monthlyTrend
                      .map((value, index) => {
                        const x = 36 + index * 110;
                        const normalized = Math.max(0, Math.min(30, Number(value)));
                        const y = 256 - normalized * 7.2;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {trendLabels.map((d, idx) => (
                    <text key={d} x={36 + idx * 110} y="280" fontSize="10" fill="#8a8a8a">{d}</text>
                  ))}
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#ececec] pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#7b7b7b]">Total Active</p>
                  <p className="text-[34px] leading-none font-semibold mt-1">{eventStats.totalActive || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#7b7b7b]">New Signups</p>
                  <p className="text-[34px] leading-none font-semibold mt-1 text-[#2f8f55]">{eventStats.newSignups || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#7b7b7b]">Retention</p>
                  <p className="text-[34px] leading-none font-semibold mt-1">{eventStats.retention || 0}%</p>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-[12px] border border-[#d9d9d9] bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[26px] font-semibold leading-none">Offers liked</h2>
                    <p className="text-[11px] text-[#6f6f6f] mt-1">Offers saved by customers from nearby deal pages</p>
                  </div>
                  <button className="text-[#888]">⋮</button>
                </div>

                {likedOffers.length === 0 ? (
                  <p className="mt-4 text-[12px] text-[#999] italic">No liked offers yet. When customers like your offers, they will appear here.</p>
                ) : (
                  <div className="mt-3 max-h-[340px] overflow-y-auto space-y-2">
                    {likedOffers.map((offer, index) => (
                      <div key={`${offer.offerId || offer.name}_${index}`} className="rounded-[8px] border border-[#efefef] bg-[#fafafa] px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#ddd] shrink-0">
                            <Image src={offer.image} alt={offer.name} width={32} height={32} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">{offer.name}</p>
                            <p className="text-[10px] text-[#8a8a8a]">{offer.type}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] font-semibold">{offer.likes.toLocaleString()}</p>
                            <p className="text-[9px] text-[#8a8a8a]">LIKES</p>
                          </div>
                        </div>
                        {offer.customerCount > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
                            <p className="text-[10px] text-[#666]">
                              <span className="font-semibold">Customers:</span> {offer.customers}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Removed 'View All Liked Offers' per request; content scrolls */}
              </section>

              <section className="rounded-[12px] border border-[#d9d9d9] bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[26px] font-semibold leading-none">Products liked</h2>
                    <p className="text-[11px] text-[#6f6f6f] mt-1">Products inside the offers customers liked most</p>
                  </div>
                  <button className="text-[#888]">⋮</button>
                </div>

                {likedProducts.length === 0 ? (
                  <p className="mt-4 text-[12px] text-[#999] italic">No liked products yet. When customers like an offer with products, they will appear here.</p>
                ) : (
                  <div className="mt-3 max-h-[340px] overflow-y-auto space-y-2">
                    {likedProducts.map((product, index) => (
                      <div key={`${product.productId || product.name}_${index}`} className="rounded-[8px] border border-[#efefef] bg-[#fafafa] px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#ddd] shrink-0">
                            <Image src={product.image} alt={product.name} width={32} height={32} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">{product.name}</p>
                            <p className="text-[10px] text-[#8a8a8a]">{product.type}{product.offerName ? ` • ${product.offerName}` : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] font-semibold">{product.likes.toLocaleString()}</p>
                            <p className="text-[9px] text-[#8a8a8a]">LIKES</p>
                          </div>
                        </div>
                        {product.customerCount > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
                            <p className="text-[10px] text-[#666]">
                              <span className="font-semibold">Customers:</span> {product.customers}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Removed 'View All Liked Products' per request; content scrolls */}
              </section>
            </aside>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
            <div className="rounded-[12px] border border-[#d9d9d9] bg-white p-4">
              <h3 className="text-[24px] font-semibold leading-none">Device type</h3>
              <p className="text-[11px] text-[#6f6f6f] mt-1">Primary platforms used by customers</p>

              <div className="mt-5 flex justify-center">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="42" stroke="#e5e7eb" strokeWidth="9" fill="none" />
                    <circle cx="60" cy="60" r="42" stroke="#2f8f55" strokeWidth="9" strokeDasharray="165 264" fill="none" />
                    <circle cx="60" cy="60" r="42" stroke="#e3a11f" strokeWidth="9" strokeDasharray="66 264" strokeDashoffset="-170" fill="none" />
                    <circle cx="60" cy="60" r="42" stroke="#4b5563" strokeWidth="9" strokeDasharray="33 264" strokeDashoffset="-238" fill="none" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[36px] font-semibold leading-none">100%</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#7d7d7d]">Coverage</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-[8px] border border-[#efefef] bg-[#fafafa] p-2 text-center"><p className="text-[#2f8f55]">● Mobile</p><p className="font-semibold mt-1">{deviceData.Mobile}%</p></div>
                <div className="rounded-[8px] border border-[#efefef] bg-[#fafafa] p-2 text-center"><p className="text-[#e3a11f]">● Computer</p><p className="font-semibold mt-1">{deviceData.Desktop}%</p></div>
                <div className="rounded-[8px] border border-[#efefef] bg-[#fafafa] p-2 text-center"><p className="text-[#4b5563]">● Tablet</p><p className="font-semibold mt-1">{deviceData.Tablet}%</p></div>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#d9d9d9] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[24px] font-semibold leading-none">Age and gender</h3>
                  <p className="text-[11px] text-[#6f6f6f] mt-1">Demographic breakdown statistics</p>
                </div>
                <div className="text-[10px] text-[#777] inline-flex items-center gap-2"><span className="text-[#2f8f55]">● MALE</span><span className="text-[#e3a11f]">● FEMALE</span></div>
              </div>

              <div className="mt-4 space-y-4">
                {ageRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[42px_1fr_44px] items-center gap-3 text-[11px]">
                    <span className="text-[#5a5a5a]">{row.label}</span>
                    <div className="h-2 rounded-full bg-[#ececec] overflow-hidden flex">
                      <div className="bg-[#2f8f55]" style={{ width: `${row.male}%` }} />
                      <div className="bg-[#e3a11f]" style={{ width: `${row.female}%` }} />
                    </div>
                    <span className="text-right font-semibold">{row.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#d9d9d9] bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[24px] font-semibold leading-none">Location breakdown</h3>
                <p className="text-[11px] text-[#6f6f6f] mt-1">Customer density by regional clusters</p>
              </div>
              <div className="inline-flex rounded-[8px] border border-[#e2e2e2] overflow-hidden text-[10px]">
                <button className="h-7 px-3 bg-[#f8f8f8] font-semibold">City</button>
                <button className="h-7 px-3 bg-white text-[#666]">State</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-3">
                {(regions.slice(0, 3)).map((region) => <LocationRow key={region.region} name={region.region} value={region.percent} />)}
              </div>
              <div className="space-y-3">
                {(regions.slice(3, 5)).map((region) => <LocationRow key={region.region} name={region.region} value={region.percent} />)}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-6 bg-[#e8ad2f] border-t border-[#d49b22] text-[#2f2a1f]">
        <div className="mx-auto w-full max-w-[1400px] px-8 lg:px-10 py-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-[3px] bg-[#0f7d49] text-white text-[26px] font-bold flex items-center justify-center leading-none">G</div>
              <span className="text-[34px] leading-none font-semibold text-[#0f7d49]">GOLO</span>
            </div>
            <p className="mt-3 text-[12px] max-w-[250px]">The all-in-one management platform for modern businesses. Empowering growth through analytics and intuitive product management.</p>
          </div>
          <div>
            <p className="text-[20px] font-bold">Links</p>
            <div className="mt-3 space-y-2 text-[13px]"><p>Overview</p><p>Inventory</p><p>Posts</p><p>Profile</p></div>
          </div>
          <div className="pt-8 md:pt-9 space-y-2 text-[13px]"><p>Analytics</p><p>Contact</p></div>
          <div>
            <p className="text-[20px] font-bold">Support</p>
            <div className="mt-3 space-y-2 text-[13px]"><p>Help Center</p><p>Security</p><p>Terms of Service</p></div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] px-8 lg:px-10 py-3 border-t border-[#d49b22] flex items-center justify-between gap-3 text-[11px]"><p>© 2026 GOLO Dashboard. All rights reserved.</p></div>
      </footer>
    </div>
  );
}

function LocationRow({ name, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-[#505050]">
        <span>{name}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#ececec] overflow-hidden">
        <div className="h-2 bg-[#e3a11f]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
