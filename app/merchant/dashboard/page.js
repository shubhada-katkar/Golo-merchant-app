"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, ChevronRight, ShoppingBag, Box, Star, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import { getMerchantDashboardSummary, getMerchantProfile, getMerchantLoyaltyLeaderboard, getMerchantRealtimeAnalytics } from "../../lib/api";


export default function MerchantDashboardPage() {
  const router = useRouter();
  const { user, loading, logout, getUserAccountType } = useAuth();
  const [summary, setSummary] = useState(null);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState(null);
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [loyaltyLeaderboard, setLoyaltyLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleMerchantLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/dashboard");
      return;
    }

    if (!loading && user) {
      const accountType = user?.accountType || getUserAccountType();
      if (accountType !== "merchant") {
        router.replace("/");
      }
    }
  }, [loading, user, router, getUserAccountType]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!user || (user?.accountType || getUserAccountType()) !== "merchant") return;
      try {
        const [summaryRes, realtimeRes] = await Promise.allSettled([
          getMerchantDashboardSummary(),
          getMerchantRealtimeAnalytics(),
        ]);

        if (summaryRes.status === "fulfilled") {
          setSummary(summaryRes.value?.data || null);
        }

        if (realtimeRes.status === "fulfilled") {
          setRealtimeAnalytics(realtimeRes.value?.data || null);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
      }
    };

    loadSummary();

    // Poll for real-time updates every 10 seconds
    const interval = setInterval(loadSummary, 10000);

    return () => clearInterval(interval);
  }, [user, getUserAccountType]);

  useEffect(() => {
    if (!user || (user?.accountType || getUserAccountType()) !== "merchant") return;

    let active = true;
    (async () => {
      try {
        const res = await getMerchantProfile();
        if (!active) return;
        setMerchantProfile(res?.data || null);
      } catch (err) {
        if (!active) return;
        setMerchantProfile(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, getUserAccountType]);

  useEffect(() => {
    if (!user || (user?.accountType || getUserAccountType()) !== "merchant") return;

    let active = true;
    (async () => {
      try {
        const res = await getMerchantLoyaltyLeaderboard();
        if (!active) return;
        setLoyaltyLeaderboard(res?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setLoyaltyLeaderboard([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, getUserAccountType]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#efefef]" />;
  }

  const accountType = user?.accountType || getUserAccountType();
  if (accountType !== "merchant") return null;

  const storeAvatar =
    merchantProfile?.profilePhoto ||
    merchantProfile?.shopPhoto ||
    user?.profilePhoto ||
    user?.shopPhoto ||
    "";

  const redemptionTrend = realtimeAnalytics?.redemptions || {};
  const redemptionLabels = redemptionTrend.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const redemptionValues = (redemptionTrend.values && redemptionTrend.values.length > 0)
    ? redemptionTrend.values
    : [0, 0, 0, 0, 0, 0, 0];
  const maxRedemptionValue = Math.max(1, ...redemptionValues);
  const chartWidth = 702;
  const chartHeight = 240;
  const chartPadding = 18;
  const redemptionPoints = redemptionValues
    .map((value, index) => {
      const x = chartPadding + ((chartWidth - chartPadding * 2) / Math.max(redemptionValues.length - 1, 1)) * index;
      const y = chartHeight - chartPadding - ((chartHeight - chartPadding * 2) * value) / maxRedemptionValue;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="dashboard" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <section className="rounded-[12px] border border-[#d5d5d5] bg-white px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden border border-[#dadada]">
                  {storeAvatar && String(storeAvatar).trim() ? (
                    <Image src={storeAvatar} alt="Store" width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#f3f4f6] text-[#9ca3af]">
                      <User size={22} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] text-[#737373]">Open Now • Last updated {Math.floor((new Date() - lastUpdated) / 60000)} mins ago</p>
                  <h1 className="text-[44px] leading-none font-bold text-[#1f1f1f] mt-1">{merchantProfile?.shopName || merchantProfile?.storeName || "My Store"}</h1>
                  <div className="mt-2 flex items-center gap-6 text-[14px] text-[#424242]">
                    <span className="inline-flex items-center gap-1"><ShoppingBag size={14} className="text-[#157a4f]" /> <span className="font-bold text-[30px] leading-none">{summary?.stats?.totalOrders || 0}</span> Total Orders</span>
                    <span className="inline-flex items-center gap-1"><Star size={14} className="text-[#e9aa1d]" /> <span className="font-bold text-[30px] leading-none">{summary?.stats?.averageRating || 0}</span> Store Rating</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button className="h-10 px-4 rounded-[8px] border border-[#d5d5d5] bg-white text-[12px] font-semibold text-[#343434] inline-flex items-center gap-2">
                  <Download size={13} /> Export Reports
                </button>
                <button onClick={() => router.push("/merchant/add-new-listing")} className="h-10 px-4 rounded-[8px] bg-[#1f8f4f] text-white text-[12px] font-semibold inline-flex items-center gap-2">
                  <Plus size={13} /> Add New Listing
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
            <div className="rounded-[12px] border border-[#d8d8d8] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[28px] font-bold leading-none">Shop Redemptions ↗</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-2.5 py-1 text-[10px] font-semibold text-[#1f8f4f]">
                      <span className="h-2 w-2 rounded-full bg-[#1f8f4f]" /> Live
                    </span>
                  </div>
                  <p className="text-[12px] text-[#666] mt-1">
                    {(redemptionTrend.total ?? 0)} redemptions this week • updated every 10s
                  </p>
                </div>
                <div className="inline-flex rounded-[7px] border border-[#dddddd] overflow-hidden text-[10px]">
                  <button className="h-7 px-3 bg-[#f8f8f8] font-semibold">Weekly</button>
                  <button className="h-7 px-3 bg-white text-[#666]">Monthly</button>
                </div>
              </div>

              <div className="mt-4 rounded-[10px] bg-[#fbfbfb] border border-[#ececec] p-3">
                <div className="mb-3 flex items-center justify-between text-[11px] text-[#6b6b6b]">
                  <p>Live merchant-side redemption activity</p>
                  <p>Today: <span className="font-semibold text-[#1f8f4f]">{redemptionTrend.today ?? redemptionValues[redemptionValues.length - 1] ?? 0}</span></p>
                </div>
                <svg viewBox="0 0 760 320" className="w-full h-[300px]">
                  {[280, 220, 160, 100, 40].map((y) => (
                    <g key={y}>
                      <line x1="38" y1={320 - y} x2="740" y2={320 - y} stroke="#d8d8d8" strokeDasharray="4 4" />
                      <text x="2" y={324 - y} fontSize="10" fill="#888">{Math.round((maxRedemptionValue * y) / 280)}</text>
                    </g>
                  ))}

                  <polyline
                    fill="none"
                    stroke="#219653"
                    strokeWidth="2.5"
                    points={redemptionPoints}
                  />

                  {redemptionValues.map((value, index) => {
                    const x = chartPadding + ((chartWidth - chartPadding * 2) / Math.max(redemptionValues.length - 1, 1)) * index;
                    const y = chartHeight - chartPadding - ((chartHeight - chartPadding * 2) * value) / maxRedemptionValue;
                    return (
                      <g key={`${redemptionLabels[index] || index}-${index}`}>
                        <circle cx={x} cy={y} r="3.5" fill="#219653" />
                        <text x={x} y="314" textAnchor="middle" fontSize="10" fill="#8a8a8a">{redemptionLabels[index] || ""}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[10px] border border-[#dce8dd] bg-[#eef6ef] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#79927c]">Order Placed</p>
                <p className="mt-1 text-[46px] font-extrabold leading-none text-[#223322]">{summary?.stats?.totalOrders || 0}</p>
                <p className="text-[12px] text-[#4a5a4b] mt-1">Last 7 Days <span className="text-[#2e9f5a]">+12%</span></p>
              </div>

              <div className="rounded-[10px] border border-[#ebe3cf] bg-[#f8f4e8] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#98835a]">Revenue Earned</p>
                <p className="mt-1 text-[46px] font-extrabold leading-none text-[#4b3913]">₹{summary?.stats?.revenue || 0}</p>
                <p className="text-[12px] text-[#7f6a42] mt-1">Last 7 Days <span className="text-[#9d6a1d]">+8.5%</span></p>
              </div>

              <div className="rounded-[10px] bg-[#f0ab19] p-5 text-white shadow-sm">
                <p className="text-[34px] font-extrabold leading-none">See your shop as a customer</p>
                <p className="mt-2 text-[12px] text-[#fff4da]">Open the customer app to see your shop exactly how customers see it. Experience your brand firsthand.</p>
                <button className="mt-4 h-10 w-full rounded-[8px] bg-white text-[#d18c00] text-[12px] font-semibold">Tap to explore ↗</button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
            <div className="rounded-[12px] border border-[#d8d8d8] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[#ececec] flex items-center justify-between">
                <h3 className="text-[31px] font-bold leading-none">Recent Orders</h3>
                <button className="text-[12px] font-semibold text-[#1e8b4f]">View All Orders</button>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {(summary?.recentOrders || []).map((order) => (
                  <div key={order._id || order.orderNumber} className="px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#ebf8ef] border border-[#cce9d4] text-[#1f8f4f] flex items-center justify-center">
                      <Box size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[#252525]">Order {order.orderNumber ? `#${order.orderNumber}` : String(order._id || '').slice(-6)}</p>
                      <p className="text-[11px] text-[#858585]">{order.placedAt ? `Placed ${new Date(order.placedAt).toLocaleString()}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-[#202020]">₹{order.amount || 0}</p>
                      <p className="text-[9px] uppercase text-[#8a8a8a]">Amount</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-[#202020]">{order.itemsCount || 1} items</p>
                      <p className="text-[9px] uppercase text-[#8a8a8a]">Quantity</p>
                    </div>
                    <button className="text-[#9a9a9a] hover:text-[#333]"><ChevronRight size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#d8d8d8] bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[31px] font-bold leading-none">Latest Reviews</h3>
                <button className="text-[#888]">⋮</button>
              </div>

              <div className="mt-3 max-h-[360px] overflow-y-auto space-y-3">
                {(summary?.latestReviews || []).map((review) => (
                  <article key={review._id || review.userName} className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-[#ddd]">
                          <Image src={review.avatar || "/images/place2.avif"} alt={review.userName || "Customer"} width={28} height={28} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold">{review.userName || "Customer"}</p>
                          <p className="text-[10px] text-[#f0aa19]">{review.rating ? "★".repeat(review.rating) : "★★★★★"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#888]">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[#5a5a5a]">"{review.content}"</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Loyalty Leaderboard Section */}
            <div className="rounded-[12px] border border-[#d8d8d8] bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[31px] font-bold leading-none">Loyalty Leaderboard</h3>
                <button className="text-[#888]">⋮</button>
              </div>

              <div className="mt-3 space-y-2">
                {loyaltyLeaderboard.length > 0 ? (
                  loyaltyLeaderboard.map((customer, idx) => (
                    <div key={customer.email || idx} className="flex items-center gap-3 p-2 rounded-[8px] bg-[#fbfbfb] border border-[#ececec]">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#f0f0f0] text-[14px] font-bold text-[#666]">
                        {idx + 1}
                      </div>
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-[#ddd]">
                        {customer.profilePhoto ? (
                          <Image src={customer.profilePhoto} alt={customer.name || "Customer"} width={32} height={32} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#e0e0e0] text-[#999]">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{customer.name || "Customer"}</p>
                        <p className="text-[10px] text-[#888] truncate">{customer.email || ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-[#1f8f4f]">{customer.points || 0}</p>
                        <p className="text-[9px] text-[#888]">points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-[#888] text-center py-4">No loyalty data yet. Customers will appear here after making purchases.</p>
                )}
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
