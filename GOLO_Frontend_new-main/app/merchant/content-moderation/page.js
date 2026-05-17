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
  AlertTriangle,
  Image as ImageIcon,
  MessageSquare,
  Clock3,
  Trash2,
  Ban,
  Filter,
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Eye,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getMerchantModerationReports,
  updateMerchantModerationReportStatus,
} from "../../lib/api";

export default function MerchantContentModerationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const handleExportCsv = () => {
    const header = ["Report ID", "Ad ID", "Title", "Reason", "Status", "Created At"];
    const csvRows = [
      header.join(","),
      ...reports.map((row) =>
        [
          row.reportId || "",
          row.adId || "",
          row.adTitle || "",
          row.reason || "",
          row.status || "",
          row.createdAt || "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "merchant-moderation-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkReview = async () => {
    const pending = reports.filter((row) => row?.reportId && row.status === "pending");
    if (!pending.length) return;

    try {
      await Promise.all(
        pending.map((row) =>
          updateMerchantModerationReportStatus(row.reportId, "reviewed", "Bulk reviewed by merchant"),
        ),
      );
      await loadReports(filterStatus);
    } catch (err) {
      setError(err?.message || "Failed to run bulk review");
    }
  };

  const loadReports = async (status = filterStatus) => {
    try {
      setPageLoading(true);
      setError("");
      const res = await getMerchantModerationReports({ status });
      setReports(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/content-moderation");
      return;
    }
    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.accountType === "merchant") {
      loadReports("all");
    }
  }, [loading, user]);

  const topCards = useMemo(() => {
    const pending = reports.filter((report) => report.status === "pending").length;
    const reviewed = reports.filter((report) => report.status === "reviewed").length;
    const actionTaken = reports.filter((report) => report.status === "action_taken").length;
    const fraud = reports.filter((report) => report.reason === "fraud").length;
    return [
      { label: "Flagged Listings", value: String(new Set(reports.map((r) => r.adId)).size), delta: "Live", icon: Flag, red: false },
      { label: "Reported Images", value: String(reports.length), delta: "Live", icon: ImageIcon, red: false },
      { label: "Messages Flagged", value: String(fraud), delta: "Fraud", icon: MessageSquare, red: false },
      { label: "Pending Reviews", value: String(pending), delta: "Needs action", icon: Clock3, red: true },
      { label: "Reviewed", value: String(reviewed), delta: "Processed", icon: Trash2, red: false },
      { label: "Action Taken", value: String(actionTaken), delta: "Resolved", icon: Ban, red: false },
    ];
  }, [reports]);

  const setReportStatus = async (reportId, status) => {
    try {
      await updateMerchantModerationReportStatus(reportId, status, "Updated by merchant moderation panel");
      await loadReports(filterStatus);
    } catch (err) {
      setError(err?.message || "Failed to update report status");
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#f3f4f6]" />;
  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#f1f2f4] text-[#111827] flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="w-[250px] bg-[#f8f9fb] border-r border-[#e4e6eb] px-3.5 py-4 hidden lg:flex lg:flex-col">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-2 mb-5 text-left"
        >
          <div className="h-7 w-7 rounded-md bg-[#157A4F] text-white text-[12px] font-bold flex items-center justify-center">G</div>
          <div>
            <p className="text-[14px] font-bold text-[#157A4F] leading-none">GOLO</p>
            <p className="text-[21px] font-semibold text-[#157A4F] leading-none mt-[2px]">Dashboard</p>
          </div>
        </button>

        <SideTitle text="GENERAL" />
        <SideItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push("/merchant/dashboard")} />

        <SideTitle text="MANAGEMENT" />
        <SideItem icon={UserCog} label="User Management" />
        <SideSub label="Customers" />
        <SideSub label="Merchants" />
        <SideSub label="Service Providers" />
        <SideItem icon={List} label="Listing Management" />
        <SideItem icon={Layers} label="Categories" />
        <SideItem icon={Flag} label="Reports & Complaints" />

        <SideTitle text="MODERATION" />
        <SideItem icon={LifeBuoy} label="Support Center" />
        <SideSub label="Support Tickets" />
        <SideItem icon={ShieldAlert} label="Content Moderation" active onClick={() => router.push("/merchant/content-moderation")} />
        <SideItem icon={Star} label="Reviews & Ratings" onClick={() => router.push("/merchant/reviews-ratings")} />
        <SideItem icon={Bell} label="Notifications" onClick={() => router.push("/merchant/notifications")} />
        <SideItem icon={Megaphone} label="Banner / Advertisement" onClick={() => router.push("/merchant/banner-advertisement")} />

        <SideTitle text="ANALYTICS" />
        <SideItem icon={BarChart3} label="Analytics" />
        <SideItem icon={ShieldCheck} label="Security & Fraud" />

        <SideTitle text="SYSTEM" />
        <SideItem icon={Settings} label="Settings" />
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
            <button onClick={() => router.push("/merchant/add-new-listing")} className="h-8 px-3.5 rounded-[5px] bg-[#157A4F] text-white text-[12px] font-semibold inline-flex items-center gap-1.5">
              <Plus size={12} /> Create Listing
            </button>
            <UserCircle2 size={20} className="text-gray-400" />
          </div>
        </header>

        <main className="px-4 py-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[24px] font-bold leading-none">CONTENT MODERATION CENTER</h1>
              <p className="text-[11px] text-gray-500 mt-1">Real time surveillance and enforcement for GOLO marketplace integrity.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportCsv} className="h-7 px-3 rounded-[5px] border border-[#e5e7eb] bg-white text-[10px]">Export Audit Logs</button>
              <button className="h-7 px-3 rounded-[5px] bg-[#157A4F] text-white text-[10px]">Create System Alert</button>
            </div>
          </div>

          <section className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
            {topCards.map(({ label, value, delta, icon: Icon, red }) => (
              <div key={label} className="bg-white border border-[#e6e8ec] rounded-[9px] p-2.5">
                <div className="flex items-start justify-between">
                  <div className="h-6 w-6 rounded-md bg-[#fcecc8] text-[#a9710f] flex items-center justify-center"><Icon size={12} /></div>
                  <span className={`text-[9px] font-semibold ${red ? "text-[#ef4444]" : "text-gray-500"}`}>{delta}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 uppercase">{label}</p>
                <p className="text-[33px] font-extrabold leading-none mt-1">{value}</p>
                <svg viewBox="0 0 80 16" className="w-full h-4 mt-1">
                  <path d="M2 12 C16 9, 22 14, 32 10 C42 7, 52 11, 63 7 C70 5, 76 3, 78 4" stroke={red ? "#ef4444" : "#059669"} strokeWidth="1.6" fill="none" />
                </svg>
              </div>
            ))}
          </section>

          <section className="mt-3 bg-white border border-[#e6e8ec] rounded-[10px] p-2.5 flex items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              <FilterPill icon={Filter} text="All" onClick={() => { setFilterStatus("all"); loadReports("all"); }} />
              <FilterPill icon={Layers} text="Pending" onClick={() => { setFilterStatus("pending"); loadReports("pending"); }} />
              <FilterPill icon={Flag} text="Reviewed" onClick={() => { setFilterStatus("reviewed"); loadReports("reviewed"); }} />
              <FilterPill icon={AlertTriangle} text="Action Taken" onClick={() => { setFilterStatus("action_taken"); loadReports("action_taken"); }} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterStatus("all");
                  loadReports("all");
                }}
                className="h-8 px-3 rounded-[6px] text-[10px] border border-[#e5e7eb]"
              >
                Clear Filters
              </button>
              <button className="h-8 px-3 rounded-[6px] text-[10px] bg-[#157A4F] text-white inline-flex items-center gap-1"><Sparkles size={10} /> Apply Smart Filters</button>
            </div>
          </section>

          <section className="mt-3 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
            <div className="space-y-3">
              <div className="bg-white border border-[#e6e8ec] rounded-[10px] overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#eceff2] flex items-center justify-between">
                  <div>
                    <h2 className="text-[22px] font-bold leading-none text-[#157A4F]">Live Moderation Queue</h2>
                    <p className="text-[11px] text-gray-500 mt-1">Recently flagged items requiring urgent manual intervention</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleBulkReview} className="h-7 px-2.5 rounded-[5px] border border-[#e5e7eb] text-[11px]">Bulk Action</button>
                    <MoreHorizontal size={14} className="text-gray-500" />
                  </div>
                </div>

                <table className="w-full text-[11px]">
                  <thead className="bg-[#fafbfc] text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2.5">Preview</th>
                      <th className="text-left px-3 py-2.5">Listing Detail</th>
                      <th className="text-left px-3 py-2.5">Reason</th>
                      <th className="text-left px-3 py-2.5">AI Score</th>
                      <th className="text-left px-3 py-2.5">Status</th>
                      <th className="text-left px-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageLoading ? (
                      <tr><td className="px-3 py-3" colSpan={6}>Loading moderation queue...</td></tr>
                    ) : reports.length === 0 ? (
                      <tr><td className="px-3 py-3" colSpan={6}>No reports for selected filter.</td></tr>
                    ) : reports.map((row) => (
                      <tr key={row.reportId} className="border-t border-[#eef1f3]">
                        <td className="px-3 py-2.5"><div className="h-8 w-8 rounded-md bg-gray-200" /></td>
                        <td className="px-3 py-2.5 font-semibold">{row.adTitle || row.adId}</td>
                        <td className="px-3 py-2.5 text-[#ef4444] font-semibold">{String(row.reason || "other").replace("_", " ")}</td>
                        <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-[#f4f5f6]">{Math.min(99, (Number(row.adReportCount || 1) * 12) + 35)}%</span></td>
                        <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full bg-[#f4f5f6]">{row.status}</span></td>
                        <td className="px-3 py-2.5 text-gray-500 flex gap-2">
                          <button onClick={() => setReportStatus(row.reportId, "reviewed")} className="text-[#157A4F]">Review</button>
                          <button onClick={() => setReportStatus(row.reportId, "action_taken")} className="text-[#ef4444]">Action</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="px-3 py-2.5 border-t border-[#eceff2] flex items-center justify-between text-[11px] text-gray-500">
                  <span>Showing {reports.length} reports</span>
                  <div className="flex gap-1">
                    <button className="h-6 px-2 rounded border border-[#e5e7eb] text-[10px]">Previous</button>
                    <button className="h-6 px-2 rounded border border-[#e5e7eb] text-[10px]">Next</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e6e8ec] rounded-[10px] p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-[18px] font-bold">Image Verification Gallery</h3>
                  <button className="text-[11px] text-[#157A4F] font-semibold">View All Assets</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {new Array(6).fill(0).map((_, i) => (
                    <div key={i} className="rounded-[8px] border border-[#e8ebef] overflow-hidden bg-white">
                      <div className="h-28 bg-gradient-to-r from-[#9fc8d8] to-[#b8d7df]" />
                      <div className="p-2.5">
                        <p className="text-[11px] font-semibold leading-tight">Sample Asset #{i + 1}</p>
                        <p className="text-[10px] text-gray-500 mt-1.5">Reason: Duplicate/AI Risk</p>
                        <div className="flex gap-3 mt-2.5 text-[10px]">
                          <button className="text-[#157A4F] inline-flex items-center gap-1"><CheckCircle2 size={10} /> Approve</button>
                          <button className="text-[#ef4444] inline-flex items-center gap-1"><XCircle size={10} /> Delete</button>
                          <button className="text-[#f59e0b] inline-flex items-center gap-1"><Eye size={10} /> Ban</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#e6e8ec] rounded-[10px] p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[20px] font-bold">Suspicious Message Stream</h3>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#f4f5f6]">Live Feed Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["TradeMaster99", "QuickBuyer_X"].map((name) => (
                    <div key={name} className="border border-[#e8ebef] rounded-[8px] p-3">
                      <p className="text-[11px] font-semibold flex items-center gap-1.5"><UserRound size={12} /> {name}</p>
                      <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">Suspicious external contact and payment redirection detected.</p>
                      <div className="flex gap-2 mt-2.5">
                        <button className="h-7 px-2.5 rounded border border-[#e5e7eb] text-[10px]">Ignore</button>
                        <button className="h-7 px-2.5 rounded border border-[#e5e7eb] text-[10px]">Warn User</button>
                        <button className="h-7 px-2.5 rounded bg-[#ef4444] text-white text-[10px]">Block Chat</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error ? <p className="text-[12px] text-[#ef4444]">{error}</p> : null}

            <div className="space-y-3">
              <div className="bg-[#eef4f0] border border-[#dae7de] rounded-[10px] p-3">
                <h3 className="text-[20px] font-bold">Quick Enforcement</h3>
                <p className="text-[10px] text-gray-500 mt-2">SELECT REASON CATEGORY</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
                  {[
                    "Counterfeit",
                    "Spam/Scam",
                    "Explicit Content",
                    "Duplicates",
                  ].map((item) => (
                    <button key={item} className="h-8 rounded border border-[#d6ddd8] bg-white">{item}</button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2.5">ENFORCEMENT SEVERITY</p>
                <input type="range" className="w-full mt-2" />
                <p className="text-[10px] text-gray-500 mt-2.5">INTERNAL ADMIN NOTE</p>
                <textarea className="w-full h-20 mt-1.5 rounded border border-[#d6ddd8] p-2.5 text-[10px]" placeholder="Explain enforcement logic for audit trail..." />
                <button onClick={handleBulkReview} className="w-full h-9 mt-2.5 rounded-[5px] bg-[#157A4F] text-white text-[11px]">Apply Enforcement</button>
              </div>

              <div className="bg-white border border-[#e6e8ec] rounded-[10px] p-3">
                <h4 className="text-[11px] font-semibold">VIOLATION TYPE DISTR.</h4>
                <div className="h-28 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-[8px] border-[#e5e7eb] border-t-[#157A4F] border-r-[#f0b534] border-b-[#ef4444]" />
                </div>
              </div>

              <div className="bg-[#fff1f1] border border-[#f6d3d3] rounded-[10px] p-3">
                <h3 className="text-[20px] font-bold text-[#ef4444]">Systemic Threat Alert</h3>
                <p className="text-[10px] text-[#ef4444] mt-1">Coordinated Bot Farm activity detected in Nairobi region.</p>
                <div className="mt-2 space-y-1.5 text-[10px]">
                  <div className="h-7 rounded border border-[#f1d3d3] bg-white px-2 flex items-center justify-between"><span>Affected IPs:</span><span className="font-bold text-[#ef4444]">05</span></div>
                  <div className="h-7 rounded border border-[#f1d3d3] bg-white px-2 flex items-center justify-between"><span>Risk Level:</span><span className="font-bold text-[#ef4444]">Critical</span></div>
                </div>
                <button className="w-full h-8 mt-2 rounded-[5px] bg-[#e24d4d] text-white text-[10px] font-semibold">Initiate Regional Lockdown</button>
              </div>

              <div className="bg-white border border-[#e6e8ec] rounded-[10px] p-3">
                <h4 className="text-[13px] font-semibold mb-2.5">MODERATOR LOG</h4>
                {[
                  "Sarah.M suspended seller",
                  "AI_Guard flagged image",
                  "Mark.R approved listing",
                  "Amina.Elite bulk deleted",
                ].map((line) => (
                  <div key={line} className="flex items-center justify-between text-[10px] py-1.5 border-b border-[#f1f2f4] last:border-b-0">
                    <span>{line}</span>
                    <span className="text-gray-400 text-[9px]">2m ago</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#e7f5ec] border border-[#d2e8db] rounded-[10px] p-3">
                <h4 className="text-[13px] font-semibold text-[#157A4F]">Priority Moderation SLA</h4>
                <p className="text-[10px] text-[#2f6d4f] mt-1">Target: 15min Current Avg: 12min.</p>
              </div>
            </div>
          </section>

          <section className="mt-3 bg-[#eeb640] border border-[#d9a12b] rounded-[10px] p-3 flex items-center justify-between text-[10px] text-[#5f4715]">
            <div className="flex items-center gap-4">
              <span>12 Items Selected</span>
              <button className="inline-flex items-center gap-1"><CheckCircle2 size={10} /> Approve All</button>
              <button className="inline-flex items-center gap-1"><Trash2 size={10} /> Delete All</button>
              <button className="inline-flex items-center gap-1"><Ban size={10} /> Suspend Sellers</button>
            </div>
            <button onClick={handleBulkReview} className="h-7 px-3 rounded-[5px] bg-white text-[10px]">Execute Batch</button>
          </section>
        </main>

        <footer className="h-10 bg-[#edb841] border-t border-[#daa22f] px-4 flex items-center justify-between text-[9px] text-[#5c4513]">
          <div className="flex items-center gap-1.5 font-semibold">
            <div className="h-4 w-4 rounded-sm bg-white/70 text-[#157A4F] flex items-center justify-center">G</div>
            Golo
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span>About Us</span><span>Contact Us</span><span>Support Center</span><span>Privacy Policy</span><span>Terms of Service</span><span>Cookie Policy</span>
          </div>
          <div>© 2026 Golo.</div>
        </footer>
      </div>
    </div>
  );
}

function SideTitle({ text }) {
  return <p className="text-[9px] tracking-wide font-semibold text-[#9ca3af] px-2 mt-3 mb-1">{text}</p>;
}

function SideItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-9 px-2.5 rounded-[7px] flex items-center gap-2.5 text-left text-[12px] mb-1 ${
        active ? "bg-[#157A4F] text-white" : "text-[#4b5563] hover:bg-[#f0f3f5]"
      }`}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
}

function SideSub({ label }) {
  return <p className="text-[11px] text-[#8b93a1] pl-9 mb-1">{label}</p>;
}

function FilterPill({ icon: Icon, text, onClick }) {
  return (
    <button onClick={onClick} className="h-8 px-3 rounded-[6px] border border-[#e5e7eb] bg-[#fafbfc] text-[10px] inline-flex items-center gap-1.5">
      <Icon size={11} className="text-gray-500" /> {text}
    </button>
  );
}
