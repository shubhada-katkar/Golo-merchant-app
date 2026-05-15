"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useAuth } from "../../context/AuthContext";
import { getMyAnalytics } from "../../lib/api";
import {
  Eye,
  Users,
  MousePointerClick,
  Heart,
  Package,
  ArrowLeft,
  ExternalLink,
  Target,
  Zap,
  BarChart2,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  expired: "bg-orange-100 text-orange-700",
  deleted: "bg-red-100 text-red-600",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: accent + "18" }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-3xl font-bold text-black tracking-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, color, icon: Icon }) {
  const pct = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 3;
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "18" }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-semibold text-gray-800">{value.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function RingCard({ value, max, label, color, display }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const R = 40;
  const C = 2 * Math.PI * R;
  const dashOffset = C - (pct / 100) * C;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#E5E7EB" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={C}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x="50"
          y="47"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="15"
          fontWeight="700"
          fill="#111"
        >
          {display || `${pct.toFixed(1)}%`}
        </text>
        <text x="50" y="62" textAnchor="middle" fontSize="8" fill="#9CA3AF">
          rate
        </text>
      </svg>
      <p className="text-xs text-gray-500 text-center font-medium leading-tight">{label}</p>
    </div>
  );
}

// ─── Comparison Bar ───────────────────────────────────────────────────────────

function CompareBar({ label, thisVal, avgVal, color }) {
  const maxVal = Math.max(thisVal, avgVal, 1);
  const thisPct = Math.max(8, Math.round((thisVal / maxVal) * 100));
  const avgPct = Math.max(8, Math.round((avgVal / maxVal) * 100));

  const diff = thisVal - avgVal;
  const diffPct = avgVal > 0 ? ((Math.abs(diff) / avgVal) * 100).toFixed(0) : "—";
  const isAbove = diff > 0;
  const isEqual = diff === 0;

  return (
    <div className="bg-gray-50 rounded-2xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">{label}</p>
      <div className="flex items-end gap-6 mb-4">
        {/* This Ad bar */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>
            {thisVal.toLocaleString()}
          </span>
          <div className="w-14 rounded-t-xl relative" style={{ height: 72, backgroundColor: color + "15" }}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700"
              style={{ height: `${thisPct}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-gray-500">This Ad</span>
        </div>
        {/* Average bar */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400">{avgVal.toLocaleString()}</span>
          <div className="w-14 rounded-t-xl relative bg-gray-200" style={{ height: 72 }}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700 bg-gray-400"
              style={{ height: `${avgPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">Your Avg</span>
        </div>
      </div>

      {isEqual ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Minus size={13} />
          At average
        </div>
      ) : isAbove ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
          <TrendingUp size={13} />
          {diffPct}% above your average
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-orange-500 font-semibold">
          <TrendingDown size={13} />
          {diffPct}% below your average
        </div>
      )}
    </div>
  );
}

// ─── Insight Pill ─────────────────────────────────────────────────────────────

function InsightPill({ title, value, note, color }) {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: color + "12", border: `1px solid ${color}25` }}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1 leading-snug">{note}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdAnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adId = params.adId;

  const [ad, setAd] = useState(null);
  const [allAds, setAllAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyAnalytics();
        if (res.success) {
          const ads = res.data?.ads || [];
          setAllAds(ads);
          const found = ads.find(
            (a) =>
              String(a.adId) === String(adId) ||
              String(a._id) === String(adId)
          );
          if (found) {
            setAd(found);
          } else {
            setError("Ad analytics not found.");
          }
        } else {
          setError("Failed to load analytics.");
        }
      } catch {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated, adId]);

  if (authLoading) return null;

  // ─── Derived metrics ─────────────────────────────────────────────────────────
  const views = ad?.views || 0;
  const unique = ad?.uniqueVisitors || 0;
  const clicks = ad?.contactClicks || 0;
  const wishlist = ad?.wishlistCount || 0;

  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";
  const wishlistRate = views > 0 ? ((wishlist / views) * 100).toFixed(1) : "0.0";
  const uniqueRate = views > 0 ? ((unique / views) * 100).toFixed(0) : "0";
  const bounceRate = views > 0 ? (100 - (unique / views) * 100).toFixed(0) : "—";

  // Averages across all user's ads (excluding current)
  const otherAds = allAds.filter(
    (a) => String(a.adId || a._id) !== String(adId)
  );
  const avgViews =
    otherAds.length > 0
      ? Math.round(otherAds.reduce((s, a) => s + (a.views || 0), 0) / otherAds.length)
      : views;
  const avgClicks =
    otherAds.length > 0
      ? Math.round(otherAds.reduce((s, a) => s + (a.contactClicks || 0), 0) / otherAds.length)
      : clicks;
  const avgWishlist =
    otherAds.length > 0
      ? Math.round(otherAds.reduce((s, a) => s + (a.wishlistCount || 0), 0) / otherAds.length)
      : wishlist;

  // CTR insight copy
  const ctrCopy =
    parseFloat(ctr) >= 5
      ? "Excellent! High contact intent."
      : parseFloat(ctr) >= 2
      ? "Good engagement from viewers."
      : "Try a clearer call-to-action.";

  const wishlistCopy =
    parseFloat(wishlistRate) >= 3
      ? "High buyer interest detected!"
      : parseFloat(wishlistRate) >= 1
      ? "Decent saves — keep it up."
      : "Better photos can boost saves.";

  const uniqueCopy =
    parseInt(uniqueRate) >= 80
      ? "Strong unique reach — great spread!"
      : parseInt(uniqueRate) >= 50
      ? "Good reach across new users."
      : "Some users revisiting your ad.";

  return (
    <>
      <Navbar />

      <div className="bg-[#F8F6F2] min-h-screen py-14 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <ProfileSidebar />

          {/* Main */}
          <div className="lg:col-span-3 space-y-8">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/analytics"
                  className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition shrink-0"
                >
                  <ArrowLeft size={17} className="text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-black">Ad Analytics</h1>
                  <p className="text-gray-400 text-sm">Detailed performance breakdown</p>
                </div>
              </div>
              {ad && (
                <Link
                  href={`/product/${ad.adId || ad._id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-100 transition shrink-0"
                >
                  <ExternalLink size={14} />
                  View Ad
                </Link>
              )}
            </div>

            {/* ── Loading ── */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-sm p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-9 h-9 border-[3px] border-[#157A4F] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading analytics…</p>
              </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
              <div className="bg-white rounded-2xl shadow-sm p-16 flex flex-col items-center gap-4">
                <Package size={40} className="text-gray-200" />
                <p className="text-red-400 text-sm">{error}</p>
                <Link
                  href="/analytics"
                  className="text-[#157A4F] text-sm hover:underline font-medium"
                >
                  ← Back to Analytics
                </Link>
              </div>
            )}

            {/* ── Content ── */}
            {!loading && !error && ad && (
              <>
                {/* ── Ad Hero ── */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Color stripe */}
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: "linear-gradient(90deg, #157A4F 0%, #22C55E 50%, #F5B849 100%)",
                    }}
                  />
                  <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      {ad.image ? (
                        <Image
                          src={ad.image}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={ad.status} />
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
                          {ad.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-black leading-snug">{ad.title}</h2>
                      <p className="text-sm text-gray-400 mt-2">
                        Posted{" "}
                        {ad.createdAt
                          ? new Date(ad.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>

                    {/* Quick stat chips */}
                    <div className="hidden md:flex flex-col gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-medium">
                        <Eye size={14} />
                        {views.toLocaleString()} clicks
                      </div>
                      <div className="flex items-center gap-2 text-sm bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-xl font-medium">
                        <MousePointerClick size={14} />
                        {clicks.toLocaleString()} contacts
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Metric Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    icon={Eye}
                    label="Ad Card Clicks"
                    value={views.toLocaleString()}
                    accent="#3B82F6"
                    sub="Total views"
                  />
                  <MetricCard
                    icon={Users}
                    label="Unique Visitors"
                    value={unique.toLocaleString()}
                    accent="#8B5CF6"
                    sub={`${uniqueRate}% unique rate`}
                  />
                  <MetricCard
                    icon={MousePointerClick}
                    label="Contact Clicks"
                    value={clicks.toLocaleString()}
                    accent="#F5B849"
                    sub={`CTR ${ctr}%`}
                  />
                  <MetricCard
                    icon={Heart}
                    label="Wishlist Saves"
                    value={wishlist.toLocaleString()}
                    accent="#EF4444"
                    sub={`${wishlistRate}% of viewers`}
                  />
                </div>

                {/* ── Funnel + Rings ── */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Engagement Funnel */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#157A4F]/10 flex items-center justify-center">
                        <Activity size={16} className="text-[#157A4F]" />
                      </div>
                      <h3 className="text-base font-semibold text-black">Engagement Funnel</h3>
                    </div>
                    <div className="flex flex-col gap-5">
                      <FunnelBar label="Ad Card Clicks" value={views} max={views} color="#3B82F6" icon={Eye} />
                      <FunnelBar label="Unique Visitors" value={unique} max={views} color="#8B5CF6" icon={Users} />
                      <FunnelBar label="Contact Clicks" value={clicks} max={views} color="#F5B849" icon={MousePointerClick} />
                      <FunnelBar label="Wishlist Saves" value={wishlist} max={views} color="#EF4444" icon={Heart} />
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Estimated bounce rate</span>
                      <span className="text-xs font-bold text-gray-600">{bounceRate}%</span>
                    </div>
                  </div>

                  {/* Performance Rings */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#157A4F]/10 flex items-center justify-center">
                        <Target size={16} className="text-[#157A4F]" />
                      </div>
                      <h3 className="text-base font-semibold text-black">Performance Rates</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <RingCard
                        value={clicks}
                        max={views}
                        label="Click-Through Rate"
                        color="#F5B849"
                        display={`${ctr}%`}
                      />
                      <RingCard
                        value={unique}
                        max={views}
                        label="Unique Visitor Rate"
                        color="#8B5CF6"
                        display={`${uniqueRate}%`}
                      />
                      <RingCard
                        value={wishlist}
                        max={views}
                        label="Wishlist Rate"
                        color="#EF4444"
                        display={`${wishlistRate}%`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Rates calculated relative to total ad card clicks
                    </p>
                  </div>
                </div>

                {/* ── Comparison vs. Your Average (only if multiple ads) ── */}
                {allAds.length > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#157A4F]/10 flex items-center justify-center">
                        <BarChart2 size={16} className="text-[#157A4F]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-black">vs Your Other Ads</h3>
                        <p className="text-xs text-gray-400">Compared to your average across {otherAds.length} other ad{otherAds.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <CompareBar
                        label="Ad Card Clicks"
                        thisVal={views}
                        avgVal={avgViews}
                        color="#3B82F6"
                      />
                      <CompareBar
                        label="Contact Clicks"
                        thisVal={clicks}
                        avgVal={avgClicks}
                        color="#F5B849"
                      />
                      <CompareBar
                        label="Wishlist Saves"
                        thisVal={wishlist}
                        avgVal={avgWishlist}
                        color="#EF4444"
                      />
                    </div>
                  </div>
                )}

                {/* ── Insights Banner ── */}
                <div className="rounded-2xl overflow-hidden shadow-sm">
                  {/* Gradient header */}
                  <div
                    className="p-5 flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #157A4F 0%, #0f5c3a 100%)" }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Zap size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Performance Insights</h3>
                      <p className="text-xs text-white/60">AI-powered tips based on this ad</p>
                    </div>
                  </div>

                  {/* Pills */}
                  <div className="bg-white p-5 grid sm:grid-cols-3 gap-4">
                    <InsightPill
                      title="Click-Through Rate"
                      value={`${ctr}%`}
                      note={ctrCopy}
                      color="#F5B849"
                    />
                    <InsightPill
                      title="Wishlist Rate"
                      value={`${wishlistRate}%`}
                      note={wishlistCopy}
                      color="#EF4444"
                    />
                    <InsightPill
                      title="Unique Reach"
                      value={`${uniqueRate}%`}
                      note={uniqueCopy}
                      color="#8B5CF6"
                    />
                  </div>
                </div>

                {/* ── Back Link ── */}
                <div className="flex justify-center pb-4">
                  <Link
                    href="/analytics"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#157A4F] transition font-medium"
                  >
                    <ArrowLeft size={14} />
                    Back to all analytics
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
