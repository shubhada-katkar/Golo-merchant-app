"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { savePreferredCategories } from "../../lib/api";
import {
  Utensils,
  Home,
  Sparkles,
  HeartPulse,
  Building,
  Building2,
  ShoppingBag,
  GraduationCap,
  Ticket,
  Briefcase,
  Car,
  Hammer,
  Dumbbell,
  Zap,
  Store,
  ChevronRight,
} from "lucide-react";

const MAX_SELECTION = 6;

const CATEGORY_OPTIONS = [
  { id: "food-restaurants", label: "Food & Restaurants", Icon: Utensils },
  { id: "home-services", label: "Home Services", Icon: Home },
  { id: "beauty-wellness", label: "Beauty & Wellness", Icon: Sparkles },
  { id: "healthcare-medical", label: "Healthcare & Medical", Icon: HeartPulse },
  { id: "hotels-accommodation", label: "Hotels & Accommodation", Icon: Building2 },
  { id: "shopping-retail", label: "Shopping & Retail", Icon: ShoppingBag },
  { id: "education-training", label: "Education & Training", Icon: GraduationCap },
  { id: "real-estate", label: "Real Estate", Icon: Building },
  { id: "events-entertainment", label: "Events & Entertainment", Icon: Ticket },
  { id: "professional-services", label: "Professional Services", Icon: Briefcase },
  { id: "automotive-services", label: "Automotive Services", Icon: Car },
  { id: "home-improvement", label: "Home Improvement", Icon: Hammer },
  { id: "fitness-sports", label: "Fitness & Sports", Icon: Dumbbell },
  { id: "daily-needs", label: "Daily Needs & Utilities", Icon: Zap },
  { id: "local-businesses-vendors", label: "Local Businesses & Vendors", Icon: Store },
];

const BACKEND_CATEGORY_MAP = {
  "food-restaurants": "Food & Restaurants",
  "home-services": "Home Services",
  "beauty-wellness": "Beauty & Wellness",
  "healthcare-medical": "Healthcare & Medical",
  "hotels-accommodation": "Hotels & Accommodation",
  "shopping-retail": "Shopping & Retail",
  "education-training": "Education & Training",
  "real-estate": "Real Estate",
  "events-entertainment": "Events & Entertainment",
  "professional-services": "Professional Services",
  "automotive-services": "Automotive Services",
  "home-improvement": "Home Improvement",
  "fitness-sports": "Fitness & Sports",
  "daily-needs": "Daily Needs & Utilities",
  "local-businesses-vendors": "Local Businesses & Vendors",
};

export default function GolocalOnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState([
    "food-restaurants",
    "hotels-accommodation",
    "education-training",
    "events-entertainment",
  ]);

  const selectionCount = selected.length;
  const canContinue = selectionCount === MAX_SELECTION;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleCategory = (id) => {
    setSelected((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((value) => value !== id);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const idToLabelMap = useMemo(() => {
    const map = new Map();
    CATEGORY_OPTIONS.forEach((item) => {
      map.set(item.id, item.label);
    });
    return map;
  }, []);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleContinue = async () => {
    if (!canContinue) return;

    const preferredCategories = selected
      .map((id) => BACKEND_CATEGORY_MAP[id] || idToLabelMap.get(id))
      .filter(Boolean);

    setSaving(true);
    setSaveError("");
    try {
      await savePreferredCategories(preferredCategories);
      await refreshProfile();

      // Mark onboarding as done so it never shows again on login
      if (typeof window !== "undefined" && user?.email) {
        const normalizedEmail = user.email.trim().toLowerCase();
        localStorage.setItem(`golo_golocal_onboarding_done_email_${normalizedEmail}`, "1");
        localStorage.removeItem("golo_pending_first_login_email");
      }

      router.push("/");
    } catch {
      setSaveError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <div className="min-h-screen w-full overflow-hidden border border-gray-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#157A4F] text-white text-xs font-bold">
              G
            </div>
            <span className="text-xl font-bold tracking-tight text-[#157A4F]">GOLO</span>
          </div>
          <p className="text-xl font-bold text-[#157A4F] sm:text-3xl">
            {selectionCount} <span className="text-gray-400">/ {MAX_SELECTION}</span>
          </p>
        </div>

        <div className="px-4 pb-2 pt-4 sm:px-8 sm:pb-3 sm:pt-6">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">What are you interested in?</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">Pick your top {MAX_SELECTION} categories to personalize your experience.</p>
        </div>

        <div className="flex min-h-[calc(100vh-170px)] flex-col px-4 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="grid flex-1 grid-cols-2 content-start gap-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7 xl:gap-9">
            {CATEGORY_OPTIONS.map(({ id, label, Icon }) => {
              const active = selectedSet.has(id);
              const blocked = !active && selectionCount >= MAX_SELECTION;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCategory(id)}
                  disabled={blocked}
                  className={`mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border text-center shadow-sm transition sm:h-40 sm:w-40 ${
                    active
                      ? "border-[#E8AB2B] bg-[#EFB53D] text-[#171717] shadow-[0_10px_24px_rgba(239,181,61,0.28)]"
                      : "border-gray-200 bg-[#F7F7F7] text-gray-700 hover:bg-white hover:shadow-md"
                  } ${blocked ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
                >
                  <Icon size={22} className={active ? "text-[#1F1F1F]" : "text-gray-500"} />
                  <span className="mt-2.5 max-w-[105px] text-[13px] font-semibold leading-tight sm:text-[14px]">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || saving}
              className={`inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-base font-semibold shadow-sm transition ${
                canContinue && !saving
                  ? "border-[#157A4F] bg-[#157A4F] text-white hover:bg-[#12663f]"
                  : "border-gray-200 bg-[#F0F0F0] text-gray-400"
              }`}
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </button>
            {saveError && (
              <p className="text-sm text-red-600 font-medium">{saveError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
