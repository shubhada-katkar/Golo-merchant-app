"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useVoucher } from "../context/VoucherContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CalendarDays, ChevronRight, Search, Tag, ShieldCheck, CircleHelp, ArrowUpDown, ExternalLink } from "lucide-react";

const tabs = ["All Deals", "Claimed", "Redeemed", "Expired"];

// Dynamic stats calculation
function useDealStats(myVouchers) {
  return useMemo(() => {
    if (!myVouchers || myVouchers.length === 0) {
      return [
        { label: "Active Savings", value: "0", icon: Tag },
        { label: "Claimed Codes", value: "0", icon: CalendarDays },
        { label: "Total Redeemed", value: "0", icon: ShieldCheck },
        { label: "Expired", value: "0", icon: ExternalLink },
      ];
    }

    const active = myVouchers.filter(v => v.status === "active" || v.status === "claimed").length;
    const claimed = myVouchers.filter(v => v.status === "active" || v.status === "claimed").length;
    const redeemed = myVouchers.filter(v => v.status === "redeemed").length;
    const expired = myVouchers.filter(v => v.status === "expired").length;

    return [
      { label: "Active Savings", value: String(active), icon: Tag },
      { label: "Claimed Codes", value: String(claimed), icon: CalendarDays },
      { label: "Total Redeemed", value: String(redeemed), icon: ShieldCheck },
      { label: "Expired", value: String(expired), icon: ExternalLink },
    ];
  }, [myVouchers]);
}

const quickTips = [
  "Always present your QR code to the merchant staff before ordering.",
  "Most deals are valid for 30 days. Check individual card expiry dates.",
  "You can use one deal per transaction unless specified otherwise.",
];

const helpLinks = ["Help Center", "Chat Support"];

export default function MyDeals() {
  const router = useRouter();
  const { user, loading: authLoading, getUserAccountType } = useAuth();
  const { myVouchers, fetchMyVouchers, loading: voucherLoading } = useVoucher();
  const [activeTab, setActiveTab] = useState("All Deals");
  const [filteredDeals, setFilteredDeals] = useState([]);
  const stats = useDealStats(myVouchers);

  // Fetch vouchers on mount
  useEffect(() => {
    if (user) {
      fetchMyVouchers({ page: 1, limit: 100 });
    }
  }, [user, fetchMyVouchers]);

  // Filter vouchers by tab
  useEffect(() => {
    if (!myVouchers || myVouchers.length === 0) {
      setFilteredDeals([]);
      return;
    }

    let filtered = myVouchers;
    if (activeTab === "Claimed") {
      filtered = myVouchers.filter(v => v.status === "active" || v.status === "claimed");
    } else if (activeTab === "Redeemed") {
      filtered = myVouchers.filter(v => v.status === "redeemed");
    } else if (activeTab === "Expired") {
      filtered = myVouchers.filter(v => v.status === "expired");
    }
    
    setFilteredDeals(filtered);
  }, [activeTab, myVouchers]);

  if (user && user.accountType === "merchant") {
    router.replace("/merchant/dashboard");
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="bg-[#f7f6f2] min-h-screen">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
            <main className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h1 className="text-[34px] leading-none font-semibold text-[#1f1f1f]">My Deals</h1>
                  <p className="mt-2 text-[13px] text-[#6f6f6f]">Track and manage your active savings and past redemptions.</p>
                </div>

                <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#efcdbf] text-[12px] font-medium text-[#7b583f] bg-white shadow-sm self-start md:self-auto">
                  <Tag size={14} />
                  Discovery View
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-3">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[10px] border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-3 min-h-[55px] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4b128] text-white shrink-0">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777]">{item.label}</p>
                          <p className="text-[20px] leading-none font-semibold text-[#1b1b1b] mt-1">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[12px] border border-[#ececec] bg-white px-3 md:px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`h-8 px-4 rounded-full text-[12px] font-medium border transition ${activeTab === tab ? "bg-[#1f8c55] border-[#1f8c55] text-white" : "bg-white border-[#e0e0e0] text-[#666] hover:border-[#cfcfcf] hover:text-[#333]"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center h-9 px-3 rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] text-[#959595] text-[12px] min-w-[230px]">
                      <Search size={13} className="mr-2 text-[#a6a6a6]" />
                      <span>Filter by merchant...</span>
                    </div>
                    <button className="h-9 px-3 rounded-lg border border-[#e5e5e5] bg-[#fbfbfb] text-[#666] text-[12px] inline-flex items-center gap-2">
                      <ArrowUpDown size={13} />
                      Newest First
                    </button>
                  </div>
                </div>
              </div>

                            <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDeals.map((deal) => (
                  <article key={deal._id} className="group rounded-[12px] border border-[#282828] bg-white overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                        <div className="relative h-[132px] bg-[#f3efe5] overflow-hidden">
                        <Image 
                          src={deal.offerImage || deal.image || "/images/deal2.avif"} 
                          alt={deal.offerTitle || "Deal Image"} 
                          fill 
                          className="object-cover" 
                        />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between px-2 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${deal.status === "active" || deal.status === "claimed" ? "bg-[#d3f3dd] text-[#15803d]" : deal.status === "redeemed" ? "bg-[#dce6ff] text-[#334155]" : "bg-[#f5e2d7] text-[#b45309]"}`}>
                            {deal.status === "active" ? "claimed" : deal.status}
                          </span>
                          {deal.badge && <span className="rounded-full bg-[#7a4af4] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">{deal.badge}</span>}
                        </div>
                      </div>

                      <div className="px-3 pt-2.5 pb-3">
                        <p className="text-[9px] font-semibold tracking-[0.18em] text-[#4ca5ef] uppercase">{deal.merchantName || "Merchant"}</p>
                        <h3 className="mt-1 text-[16px] leading-tight font-semibold text-[#222] min-h-[38px]">{deal.offerTitle || "Untitled Deal"}</h3>

                        <div className="mt-4 flex items-center gap-1 text-[11px] text-[#737373]">
                          <CalendarDays size={13} className="text-[#8f8f8f]" />
                          <span>Expires {deal.expiresAt ? new Date(deal.expiresAt).toLocaleDateString() : (deal.expiry || "N/A")}</span>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {(deal.status === "active" || deal.status === "claimed") && (
                            <button 
                              onClick={() => router.push(`/nearby-deals/deal/claimed-offer?voucherId=${deal._id}`)}
                              className="h-8 flex-1 rounded-md bg-[#d3f3dd] text-[#15803d] text-[12px] font-semibold cursor-not-allowed"
                              disabled
                            >
                              Claimed
                            </button>
                          )}
                          <button 
                            onClick={() => router.push(
                              deal.status === "active" || deal.status === "claimed"
                                ? `/nearby-deals/deal/claimed-offer?voucherId=${deal._id}`
                                : `/nearby-deals/deal?offerId=${deal.offerId}`
                            )}
                            className="h-8 w-8 rounded-md border border-[#e0e0e0] text-[#777] flex items-center justify-center hover:border-[#c9c9c9]"
                            aria-label={deal.status === "active" || deal.status === "claimed" ? "Open claimed voucher QR" : "View deal details"}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                  </article>
                ))}
              </div>

              <div className="mt-10 border-t border-[#ececec] pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px] text-[#6f6f6f]">
                <p>Showing {voucherLoading ? "loading..." : filteredDeals.length > 0 ? `1 to ${filteredDeals.length}` : "0"} of {myVouchers?.length || 0} deals</p>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-md border border-[#e4e4e4] bg-white text-[#888]">Previous</button>
                  <button className="h-8 w-8 rounded-md border border-[#9fd0eb] bg-[#eaf5fb] text-[#2c6d92] font-semibold">1</button>
                  <button className="h-8 w-8 rounded-md border border-[#e4e4e4] bg-white text-[#777]">2</button>
                  <button className="h-8 px-3 rounded-md border border-[#e4e4e4] bg-white text-[#333]">Next</button>
                </div>
              </div>
            </main>

            <aside className="w-full lg:w-[270px] lg:shrink-0 space-y-4">
              <section className="rounded-[12px] border border-[#ececec] bg-white px-4 py-4 shadow-sm">
                <h2 className="text-[14px] font-semibold text-[#222]">Quick Tips</h2>
                <ul className="mt-4 space-y-3 text-[12px] leading-[1.45] text-[#555]">
                  {quickTips.map((tip, index) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${index === 0 ? "bg-[#157a4f]" : index === 1 ? "bg-[#f4a632]" : "bg-[#6f8cff]"}`} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <Link href="#" className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[#2f84ff] hover:underline">
                  Full Redemption Policy
                  <ChevronRight size={13} />
                </Link>
              </section>

              <section className="rounded-[12px] border border-[#ececec] bg-white px-4 py-4 shadow-sm">
                <h2 className="text-[14px] font-semibold text-[#222]">Need help?</h2>
                <p className="mt-2 text-[12px] text-[#6f6f6f]">Having trouble redeeming a deal or finding your receipt?</p>
                <div className="mt-4 space-y-2">
                  {helpLinks.map((item) => (
                    <button key={item} className="w-full h-9 rounded-md border border-[#e6e6e6] bg-white text-[12px] text-[#3f3f3f] flex items-center gap-2 px-3 hover:border-[#cfcfcf]">
                      <CircleHelp size={14} className="text-[#666]" />
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[12px] border border-[#e8e8e8] bg-white shadow-sm overflow-hidden">
                <div className="relative h-[205px]">
                  <Image src="/images/place2.avif" alt="Signature Wellness Day" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/12 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[#ff6c91] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">Featured</span>
                  </div>
                  <div className="absolute left-3 right-3 bottom-3 text-white">
                    <h3 className="text-[16px] font-semibold leading-tight">Signature Wellness Day</h3>
                    <p className="mt-1 text-[12px] text-white/90">Special price Rs. 1,200</p>
                    <button className="mt-3 h-9 w-full rounded-md bg-[#f3b12a] text-white text-[12px] font-semibold">Claim Now</button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
