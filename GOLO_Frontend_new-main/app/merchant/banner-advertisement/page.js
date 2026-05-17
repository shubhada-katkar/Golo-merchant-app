"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  UserCircle2,
  LayoutDashboard,
  UserCog,
  List,
  Layers,
  Flag,
  LifeBuoy,
  ShieldAlert,
  Star,
  Megaphone,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronDown,
  Globe,
  Image,
  Target,
  MousePointer2,
  TrendingUp,
  Pencil,
  Pause,
  Trash2,
  CalendarDays,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  deleteMyBannerPromotion,
  getMyBannerPromotions,
  submitBannerPromotionRequest,
  updateMyBannerPromotion,
} from "../../lib/api";

export default function MerchantBannerAdvertisementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [banners, setBanners] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const loadBanners = async () => {
    try {
      setPageLoading(true);
      setError("");
      const res = await getMyBannerPromotions();
      setBanners(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || "Failed to load banner promotions");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/banner-advertisement");
      return;
    }
    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.accountType === "merchant") {
      loadBanners();
    }
  }, [loading, user]);

  const filteredBanners = useMemo(() => {
    if (statusFilter === "all") return banners;
    return banners.filter((banner) => String(banner.status) === statusFilter);
  }, [banners, statusFilter]);

  const stats = useMemo(() => {
    const active = banners.filter((banner) => banner.status === "active").length;
    const total = banners.length;
    const scheduled = banners.filter((banner) => banner.status === "approved" || banner.status === "under_review").length;
    const gross = banners.reduce((sum, banner) => sum + Number(banner.totalPrice || 0), 0);
    return [
      { label: "ACTIVE BANNER", value: String(active), trend: `${active}/${total}`, icon: Image, line: "#157A4F" },
      { label: "TOTAL CAMPAIGNS", value: String(total), trend: `${scheduled} pending`, icon: Target, line: "#157A4F" },
      { label: "SCHEDULED", value: String(scheduled), trend: "Live moderation", icon: MousePointer2, line: "#ef4444" },
      { label: "GROSS REVENUE", value: `₹${gross.toLocaleString()}`, trend: "Campaign total", icon: TrendingUp, line: "#157A4F" },
    ];
  }, [banners]);

  const addBanner = async () => {
    const bannerTitle = window.prompt("Banner title");
    if (!bannerTitle) return;
    const bannerCategory = window.prompt("Banner category", "Promotion") || "Promotion";
    const imageUrl = window.prompt("Image URL", "https://images.unsplash.com/photo-1556740772-1a741367b93e") || "";
    const selectedDates = (window.prompt("Dates (YYYY-MM-DD, comma separated)", new Date().toISOString().slice(0, 10)) || "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    if (!selectedDates.length) return;
    try {
      await submitBannerPromotionRequest({ bannerTitle, bannerCategory, imageUrl, selectedDates, totalPrice: 0 });
      await loadBanners();
    } catch (err) {
      setError(err?.message || "Failed to create campaign");
    }
  };

  const setAction = async (banner, action) => {
    try {
      await updateMyBannerPromotion(banner.requestId, { action });
      await loadBanners();
    } catch (err) {
      setError(err?.message || `Failed to ${action} banner`);
    }
  };

  const removeBanner = async (banner) => {
    if (!window.confirm(`Delete banner \"${banner.bannerTitle}\"?`)) return;
    try {
      await deleteMyBannerPromotion(banner.requestId);
      await loadBanners();
    } catch (err) {
      setError(err?.message || "Failed to delete banner");
    }
  };

  const editBanner = async (banner) => {
    const bannerTitle = window.prompt("Banner title", banner.bannerTitle || "");
    if (!bannerTitle) return;
    const bannerCategory = window.prompt("Banner category", banner.bannerCategory || "Promotion") || "Promotion";
    try {
      await updateMyBannerPromotion(banner.requestId, { bannerTitle, bannerCategory });
      await loadBanners();
    } catch (err) {
      setError(err?.message || "Failed to update banner");
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#f3f4f6]" />;
  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#f1f2f4] text-[#111827] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="w-[250px] bg-[#f8f9fb] border-r border-[#e4e6eb] px-3.5 py-4 hidden lg:flex lg:flex-col">
        <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2 px-2 mb-5 text-left">
          <div className="h-7 w-7 rounded-md bg-[#157A4F] text-white text-[12px] font-bold flex items-center justify-center">G</div>
          <div>
            <p className="text-[14px] font-bold text-[#157A4F] leading-none">GOLO</p>
            <p className="text-[21px] font-semibold text-[#157A4F] leading-none mt-[2px]">Dashboard</p>
          </div>
        </button>

        <SideTitle text="GENERAL" />
        <SideItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push("/merchant/dashboard")} />

        <SideTitle text="MANAGEMENT" />
        <SideItem icon={UserCog} label="User Management" caret />
        <SideSub label="Customers" />
        <SideSub label="Merchants" />
        <SideSub label="Service Providers" />
        <SideItem icon={List} label="Listing Management" onClick={() => router.push("/merchant/listing-management")} />
        <SideItem icon={Layers} label="Categories" caret />
        <SideItem icon={Flag} label="Reports & Complaints" caret />

        <SideTitle text="MODERATION" />
        <SideItem icon={LifeBuoy} label="Support Centre" />
        <SideSub label="Support Tickets" />
        <SideItem icon={ShieldAlert} label="Content Moderation" onClick={() => router.push("/merchant/content-moderation")} />
        <SideItem icon={Star} label="Reviews & Ratings" onClick={() => router.push("/merchant/reviews-ratings")} />
        <SideItem icon={Bell} label="Notifications" onClick={() => router.push("/merchant/notifications")} />
        <SideItem icon={Megaphone} label="Banner / Advertisement" active onClick={() => router.push("/merchant/banner-advertisement")} />

        <SideTitle text="ANALYTICS" />
        <SideItem icon={BarChart3} label="Analytics" />
        <SideItem icon={ShieldCheck} label="Security & Fraud" />

        <SideTitle text="SYSTEM" />
        <SideItem icon={Settings} label="Settings" caret />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 bg-white border-b border-[#e4e6eb] px-4 flex items-center justify-between">
          <div className="w-[470px] max-w-full relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full h-8 rounded-[4px] border border-[#e5e7eb] bg-[#fafafa] pl-8 pr-3 text-[12px] outline-none" placeholder="Search listings, users, or merchants..." />
          </div>

          <div className="flex items-center gap-3 text-gray-500">
            <Bell size={14} />
            <MessageSquare size={14} />
            <div className="text-[11px] flex items-center gap-1">EN <Globe size={12} /></div>
            <button onClick={addBanner} className="h-8 px-3.5 rounded-[5px] bg-[#157A4F] text-white text-[12px] font-semibold inline-flex items-center gap-1.5">
              <Plus size={12} /> Create Campaign
            </button>
            <UserCircle2 size={20} className="text-gray-400" />
          </div>
        </header>

        <main className="px-4 py-3 flex-1">
          <h1 className="text-[31px] font-bold leading-none">Banner & Advertisement Management</h1>
          <p className="text-[11px] text-gray-500 mt-1">Manage your digital real estate and campaign performance</p>

          <section className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {stats.map(({ label, value, trend, icon: Icon, line }) => (
              <div key={label} className="bg-white border border-[#e6e8ec] rounded-[10px] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-6 rounded-md border border-[#e7ecef] text-gray-500 flex items-center justify-center"><Icon size={12} /></div>
                  <span className={`text-[10px] font-semibold ${trend.includes("-") ? "text-[#ef4444]" : "text-gray-600"}`}>{trend}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-semibold">{label}</p>
                <p className="text-[38px] font-extrabold leading-none mt-1">{value}</p>
                <svg viewBox="0 0 80 16" className="w-full h-4 mt-1">
                  <path d="M2 12 C16 9, 24 14, 32 9 C42 6, 51 8, 62 5 C70 3, 76 4, 78 3" stroke={line} strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            ))}
          </section>

          <section className="mt-3 bg-white border border-[#e6e8ec] rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff2] flex items-center justify-between">
              <div className="inline-flex rounded-[7px] border border-[#e5e7eb] overflow-hidden text-[10px] font-semibold">
                <button onClick={() => setStatusFilter("all")} className={`h-8 px-4 ${statusFilter === "all" ? "bg-[#157A4F] text-white" : "bg-white text-gray-600"}`}>All</button>
                <button onClick={() => setStatusFilter("active")} className={`h-8 px-4 ${statusFilter === "active" ? "bg-[#157A4F] text-white" : "bg-white text-gray-600"}`}>Active</button>
                <button onClick={() => setStatusFilter("under_review")} className={`h-8 px-4 ${statusFilter === "under_review" ? "bg-[#157A4F] text-white" : "bg-white text-gray-600"}`}>Under Review</button>
                <button onClick={() => setStatusFilter("expired")} className={`h-8 px-4 ${statusFilter === "expired" ? "bg-[#157A4F] text-white" : "bg-white text-gray-600"}`}>Expired</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 px-3 rounded-[7px] border border-[#e5e7eb] text-[10px]">Sort: Performance (High-Low)</button>
                <button className="h-8 px-3 rounded-[16px] bg-[#157A4F] text-white text-[10px] font-semibold">REGION: INDIA</button>
              </div>
            </div>

            {error ? <p className="px-4 py-2 text-[12px] text-[#ef4444]">{error}</p> : null}

            <div className="divide-y divide-[#eef1f3]">
              {pageLoading ? (
                <p className="px-4 py-8 text-[12px] text-gray-500">Loading campaigns...</p>
              ) : filteredBanners.map((banner) => (
                <article key={banner.requestId} className="grid grid-cols-[72px_1fr_92px_104px_86px] items-center gap-3 px-4 py-2.5">
                  <div>
                    <div className="h-12 w-12 rounded-full bg-[#d8dde3]" />
                    <p className="text-[8px] text-gray-400 mt-1">{banner.requestId}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[19px] font-bold leading-none">{banner.bannerTitle}</h3>
                      <span className={`text-[8px] px-2 py-[2px] rounded-full font-semibold ${statusChipClass(String(banner.status || '').toUpperCase())}`}>{String(banner.status || '').toUpperCase()}</span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-600">
                      <span>Advertiser: <span className="font-semibold text-[#1f2937]">{banner.merchantName}</span></span>
                      <span className="inline-flex items-center gap-1"><Monitor size={10} /> Homepage</span>
                    </div>

                    <p className="text-[9px] text-gray-500 mt-1 inline-flex items-center gap-1"><CalendarDays size={10} /> Period: {new Date(banner.startDate).toLocaleDateString()} to {new Date(banner.endDate).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <p className="text-[8px] text-gray-500 uppercase">Clicks</p>
                    <p className="text-[20px] font-bold leading-none mt-1">{banner.selectedDays || 0}</p>
                  </div>

                  <div>
                    <p className="text-[8px] text-gray-500 uppercase">Revenue</p>
                    <p className="text-[20px] font-bold leading-none mt-1">₹{Number(banner.totalPrice || 0).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-3 justify-end text-[#157A4F]">
                    <button onClick={() => editBanner(banner)} className="h-7 w-7 rounded-full hover:bg-[#f2f7f4] flex items-center justify-center"><Pencil size={12} /></button>
                    <button onClick={() => setAction(banner, banner.status === "active" ? "pause" : "resume")} className="h-7 w-7 rounded-full hover:bg-[#f2f7f4] flex items-center justify-center"><Pause size={12} /></button>
                    <button onClick={() => removeBanner(banner)} className="h-7 w-7 rounded-full hover:bg-[#fff2f2] text-[#374151] flex items-center justify-center"><Trash2 size={12} /></button>
                  </div>
                </article>
              ))}
            </div>

            <div className="h-14 border-t border-[#eceff2] flex items-center justify-center">
              <button className="text-[12px] font-semibold text-[#1f2937]">View Full Inventory</button>
            </div>
          </section>
        </main>

        <footer className="h-14 bg-[#edb841] border-t border-[#daa22f] px-4 flex items-center justify-between text-[10px] text-[#5c4513]">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-5 w-5 rounded-sm bg-white/70 text-[#157A4F] flex items-center justify-center">G</div>
            Golo
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span>About Us</span><span>Contact Us</span><span>Support Center</span><span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <span>© 2026 Golo. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function statusChipClass(status) {
  if (status === "ACTIVE") return "bg-[#e7f5ec] text-[#157A4F]";
  if (status === "SCHEDULED") return "bg-[#f3f4f6] text-gray-700";
  return "bg-[#fee2e2] text-[#ef4444]";
}

function SideTitle({ text }) {
  return <p className="text-[9px] tracking-wide font-semibold text-[#9ca3af] px-2 mt-3 mb-1">{text}</p>;
}

function SideItem({ icon: Icon, label, active = false, onClick, caret = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-9 px-2.5 rounded-[7px] flex items-center justify-between text-left text-[12px] mb-1 ${
        active ? "bg-[#157A4F] text-white" : "text-[#4b5563] hover:bg-[#f0f3f5]"
      }`}
    >
      <span className="inline-flex items-center gap-2.5">
        <Icon size={13} />
        <span>{label}</span>
      </span>
      {caret && <ChevronDown size={12} className={active ? "text-white" : "text-[#9ca3af]"} />}
    </button>
  );
}

function SideSub({ label }) {
  return <p className="text-[11px] text-[#8b93a1] pl-9 mb-1">{label}</p>;
}
