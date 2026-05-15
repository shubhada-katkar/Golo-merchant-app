"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  UserCircle2,
  Globe,
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
  MessageSquare,
  Shield,
  AlertTriangle,
  CircleX,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMerchantReviewStats, getMerchantReviews, updateMerchantReviewStatus } from "../../lib/api";

const statCards = [
  { label: "Total Reviews", value: "24,892", trend: "+12.5%", tone: "text-[#157A4F]", spark: "#157A4F", icon: MessageSquare },
  { label: "Average Rating", value: "4.82", trend: "+0.3", tone: "text-[#157A4F]", spark: "#e59f25", icon: Star },
  { label: "Flagged Reviews", value: "128", trend: "-4.2%", tone: "text-[#ef4444]", spark: "#ef4444", icon: Flag },
  { label: "Pending Moderation", value: "56", trend: "+8.1%", tone: "text-[#ef4444]", spark: "#e59f25", icon: Shield },
];

const reviews = [
  {
    name: "NEETA JADHAV",
    date: "Oct 24, 2023",
    stars: 5,
    score: "Score: 5.0",
    content: "The product quality exceeded my expectations.",
    status: "Approved",
    tags: [],
  },
  {
    name: "SHAM RAUT",
    date: "Oct 23, 2023",
    stars: 4,
    score: "Score: 4.0",
    content: "Decent performance overall. I had some delay in response.",
    status: "Pending",
    tags: [],
  },
  {
    name: "YOGESH PARIT",
    date: "Oct 22, 2023",
    stars: 1,
    score: "Score: 1.0",
    content: "CLICK HERE FOR FREE BITCOIN!!! BEST EARNING APP.",
    status: "Flagged",
    tags: ["AI SPAM DETECTED", "SUSPICIOUS ACTIVITY"],
  },
  {
    name: "SAYALI PATEL",
    date: "Oct 21, 2023",
    stars: 5,
    score: "Score: 5.0",
    content: "An absolutely exquisite experience. I highly recommend this.",
    status: "Approved",
    tags: [],
  },
  {
    name: "RAM PUROHIT",
    date: "Oct 20, 2023",
    stars: 2,
    score: "Score: 2.0",
    content: "This product failed after only two days. I need replacement.",
    status: "Pending",
    tags: ["SUSPICIOUS ACTIVITY"],
  },
];

export default function MerchantReviewsRatingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const handleExportCsv = () => {
    const rows = (reviewsData.length ? reviewsData : reviews).map((row) => ({
      user: row.userName || row.name || "",
      rating: row.rating || row.stars || 0,
      status: row.status || "",
      content: row.content || "",
      createdAt: row.createdAt || row.date || "",
    }));

    const header = ["User", "Rating", "Status", "Content", "Created At"];
    const csvRows = [
      header.join(","),
      ...rows.map((item) =>
        [item.user, item.rating, item.status, item.content, item.createdAt]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "merchant-reviews.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkApprove = async () => {
    const pendingRows = (reviewsData || []).filter(
      (row) => row?._id && String(row.status).toLowerCase() === "pending",
    );
    if (!pendingRows.length) return;

    try {
      await Promise.all(pendingRows.map((row) => updateMerchantReviewStatus(row._id, "approved")));
      const refreshed = await getMerchantReviews({ status: statusFilter, search: searchTerm, page: 1, limit: 30 });
      setReviewsData(refreshed?.data || []);
    } catch (err) {
      console.error("Failed bulk approve:", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/reviews-ratings");
      return;
    }
    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!user || user.accountType !== "merchant") return;
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          getMerchantReviewStats(),
          getMerchantReviews({ status: statusFilter, search: searchTerm, page: 1, limit: 30 }),
        ]);
        setStats(statsRes?.data || null);
        setReviewsData(reviewsRes?.data || []);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    loadReviews();
  }, [user, statusFilter, searchTerm]);

  const dynamicStatCards = useMemo(() => {
    return [
      { ...statCards[0], value: String(stats?.totalReviews ?? statCards[0].value) },
      { ...statCards[1], value: String(stats?.averageRating ?? statCards[1].value) },
      { ...statCards[2], value: String(stats?.flaggedReviews ?? statCards[2].value) },
      { ...statCards[3], value: String(stats?.pendingModeration ?? statCards[3].value) },
    ];
  }, [stats]);

  const handleStatusUpdate = async (reviewId, newStatus) => {
    try {
      await updateMerchantReviewStatus(reviewId, newStatus);
      const refreshed = await getMerchantReviews({ status: statusFilter, search: searchTerm, page: 1, limit: 30 });
      setReviewsData(refreshed?.data || []);
    } catch (err) {
      console.error("Failed to update review status:", err);
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
        <SideItem icon={Star} label="Reviews & Ratings" active onClick={() => router.push("/merchant/reviews-ratings")} />
        <SideItem icon={Bell} label="Notifications" onClick={() => router.push("/merchant/notifications")} />
        <SideItem icon={Megaphone} label="Banner / Advertisement" onClick={() => router.push("/merchant/banner-advertisement")} />

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
            <input
              className="w-full h-8 rounded-[4px] border border-[#e5e7eb] bg-[#fafafa] pl-8 pr-3 text-[12px] outline-none"
              placeholder="Search listings, users, or merchants..."
            />
          </div>

          <div className="flex items-center gap-3 text-gray-500">
            <Bell size={14} />
            <MessageSquare size={14} />
            <div className="text-[11px] flex items-center gap-1">EN <Globe size={12} /></div>
            <button onClick={() => router.push("/merchant/add-new-listing")} className="h-8 px-3.5 rounded-[5px] bg-[#157A4F] text-white text-[12px] font-semibold inline-flex items-center gap-1.5">
              <Plus size={12} /> Create Listing
            </button>
            <UserCircle2 size={20} className="text-gray-400" />
          </div>
        </header>

        <main className="p-3 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3">
          <section className="space-y-3">
            <div>
              <h1 className="text-[30px] font-bold leading-none">Reviews & Ratings Management</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {dynamicStatCards.map(({ label, value, trend, tone, spark, icon: Icon }) => (
                <div key={label} className="bg-white border border-[#e6e8ec] rounded-[10px] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-6 rounded-md border border-[#e7ecef] text-gray-500 flex items-center justify-center">
                      <Icon size={12} />
                    </div>
                    <span className={`text-[10px] font-semibold ${tone}`}>{trend}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">{label}</p>
                  <p className="text-[36px] font-extrabold leading-none mt-1">{value}</p>
                  <svg viewBox="0 0 80 16" className="w-full h-4 mt-1">
                    <path d="M2 12 C16 10, 22 14, 32 11 C42 8, 51 9, 62 6 C70 4, 76 5, 78 4" stroke={spark} strokeWidth="1.6" fill="none" />
                  </svg>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#e6e8ec] rounded-[10px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#eceff2] flex items-center justify-between">
                <div>
                  <h2 className="text-[30px] leading-none font-bold">Recent Reviews</h2>
                  <p className="text-[11px] text-gray-500 mt-1">Monitor and moderate user-generated content in real-time.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-[6px] border border-[#e5e7eb] bg-white text-[11px]">Last 30 Days</button>
                  <button onClick={handleExportCsv} className="h-8 px-3 rounded-[6px] border border-[#e5e7eb] bg-white text-[11px]">Export CSV</button>
                  <button onClick={handleBulkApprove} className="h-8 px-3 rounded-[6px] bg-[#157A4F] text-white text-[11px] font-semibold">Bulk Action</button>
                </div>
              </div>

              <div className="px-4 py-3 border-b border-[#eceff2] flex items-center justify-between gap-2">
                <input
                  className="h-9 w-[280px] rounded-[8px] border border-[#e5e7eb] px-3 text-[11px]"
                  placeholder="Search keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <select className="h-9 rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[11px]">
                    <option>All Ratings</option>
                  </select>
                  <select
                    className="h-9 rounded-[8px] border border-[#e5e7eb] bg-white px-3 text-[11px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
                    className="h-9 px-3 rounded-[8px] border border-transparent text-gray-500 text-[11px]"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-[#fafbfc] text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2.5">USER PROFILE</th>
                      <th className="text-left px-4 py-2.5">RATING</th>
                      <th className="text-left px-4 py-2.5">REVIEW CONTENT</th>
                      <th className="text-left px-4 py-2.5">STATUS</th>
                      <th className="text-left px-4 py-2.5">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reviewsData.length ? reviewsData : reviews).map((row) => (
                      <tr key={row._id || row.name} className="border-t border-[#eef1f3] align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-[#d8dde3]" />
                            <div>
                              <p className="font-bold text-[12px] leading-none">{row.userName || row.name}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{row.date || new Date(row.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[#f59e0b] text-[12px] leading-none">{"★".repeat(row.rating || row.stars || 0)}<span className="text-gray-300">{"★".repeat(5 - (row.rating || row.stars || 0))}</span></p>
                          <p className="text-[9px] text-gray-400 mt-1">{row.score || `Score: ${(row.rating || 0).toFixed(1)}`}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] text-[#1f2937] max-w-[420px]">{row.content}</p>
                          {Array.isArray(row.tags) && row.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {row.tags.map((tag) => (
                                <span key={tag} className={`text-[9px] px-1.5 py-[2px] rounded-full ${tag.includes("SPAM") ? "bg-[#fee2e2] text-[#ef4444]" : "bg-[#f3f4f6] text-gray-600"}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded-full ${String(row.status).toLowerCase() === "approved" ? "bg-[#e7f5ec] text-[#157A4F]" : String(row.status).toLowerCase() === "pending" ? "bg-[#f3f4f6] text-gray-700" : "bg-[#fee2e2] text-[#ef4444]"}`}>
                            {String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px]">
                          <div className="flex items-center gap-2 text-gray-500">
                            <button onClick={() => handleStatusUpdate(row._id, "approved")} className="text-[10px] px-2 py-1 border rounded">Approve</button>
                            <button onClick={() => handleStatusUpdate(row._id, "flagged")} className="text-[10px] px-2 py-1 border rounded">Flag</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-[#eceff2] flex items-center justify-between text-[11px] text-gray-500">
                <span>Showing 1-5 of 1,240 reviews</span>
                <div className="flex items-center gap-1.5">
                  <button className="h-7 px-3 rounded-[18px] border border-[#e5e7eb]">Previous</button>
                  <button className="h-7 w-7 rounded-full bg-[#157A4F] text-white">1</button>
                  <button className="h-7 w-7 rounded-full">2</button>
                  <button className="h-7 w-7 rounded-full">3</button>
                  <span>...</span>
                  <button className="h-7 w-7 rounded-full">24</button>
                  <button className="h-7 px-3 rounded-[18px] border border-[#e5e7eb]">Next</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-white border border-[#e6e8ec] rounded-[10px] flex flex-col min-h-[760px]">
            <div className="px-4 py-4 border-b border-[#eceff2]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[27px] font-bold leading-none">Review Details</h3>
                  <p className="text-[10px] text-gray-400 mt-1">REV-003</p>
                </div>
                <CircleX size={14} className="text-gray-400" />
              </div>

              <div className="mt-4 flex items-start gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#d8dde3]" />
                <div>
                  <p className="text-[16px] font-bold leading-none">Jason Mendoza</p>
                  <p className="text-[10px] text-gray-400 mt-1">bortles_fan@yahoo.com</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px]">
                    <span className="px-2 py-[2px] rounded-full bg-[#e7f5ec] text-[#157A4F]">Verified Buyer</span>
                    <span className="text-gray-500">Trust Score: 12%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[8px] bg-[#fafafa] border border-[#eceff2] p-3">
                <p className="text-[12px] text-[#f59e0b]">★ ☆ ☆ ☆ ☆</p>
                <p className="text-[10px] text-gray-400 mt-1">Oct 22, 2023</p>
                <p className="text-[11px] italic text-[#374151] mt-2 leading-relaxed">
                  "CLICK HERE FOR FREE BITCOIN!! BEST EARNING APP 2023. NO SCAM. 100% WORKING... JOIN NOW AT BITCOIN-SCAM-LINK.NET"
                </p>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-[#eceff2]">
              <h4 className="text-[10px] tracking-[0.16em] text-gray-500 font-semibold">AI & SECURITY ANALYSIS</h4>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <div className="border border-[#f5cece] rounded-[8px] p-2.5 bg-[#fff8f8]">
                  <p className="text-[10px] font-semibold text-[#ef4444] flex items-center gap-1"><span>◉</span> SPAM CHECK</p>
                  <p className="text-[10px] text-gray-500 mt-1">Highly likely promotional content</p>
                </div>
                <div className="border border-[#eceff2] rounded-[8px] p-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 flex items-center gap-1"><AlertTriangle size={10} /> ACTIVITY CHECK</p>
                  <p className="text-[10px] text-gray-500 mt-1">Irregular account behavior</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-[#eceff2]">
              <h4 className="text-[10px] tracking-[0.16em] text-gray-500 font-semibold">ACTION HISTORY</h4>
              <div className="space-y-2 mt-2.5 text-[10px]">
                <div>
                  <p className="font-semibold text-[#1f2937]">System Analysis Completed</p>
                  <p className="text-gray-400">Oct 24, 2023 · 09:40 AM</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1f2937]">Review Submitted</p>
                  <p className="text-gray-400">Oct 24, 2023 · 09:41 AM</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 mt-auto">
              <div className="flex gap-2">
                <button className="flex-1 h-10 rounded-full bg-[#157A4F] text-white text-[12px] font-semibold">Approve</button>
                <button className="flex-1 h-10 rounded-full border border-[#f3d0d0] text-[#ef4444] text-[12px] font-semibold">Reject</button>
              </div>
              <button className="w-full h-9 mt-2 rounded-full border border-[#eceff2] text-[11px]">Mark as Spam</button>
              <button className="w-full h-8 mt-3 rounded-full bg-[#1f1f1f] text-white text-[10px] font-semibold">12 New Reviews Pending Approval</button>
            </div>
          </aside>
        </main>

        <footer className="h-8 px-4 text-[9px] text-gray-500 flex items-center">Made with 💜</footer>
      </div>
    </div>
  );
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
