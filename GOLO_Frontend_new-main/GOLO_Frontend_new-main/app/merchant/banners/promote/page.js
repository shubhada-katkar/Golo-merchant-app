"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, Upload } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { submitBannerPromotionRequest } from "../../../lib/api";
import MerchantNavbar from "../../MerchantNavbar";

const bannerCategories = [
  "Fashion",
  "Electronics",
  "Groceries",
  "Home Decor",
  "Beauty",
  "Healthcare",
  "Sports",
  "Books",
  "Toys",
  "Automotive",
  "Jewelry",
  "Food & Beverages",
  "Pet Supplies",
  "Stationery",
  "Services",
];

const DAILY_BANNER_RATE = 240;

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
}

function dateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeRangeDates(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(dateToString(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (days.length > 370) break;
  }
  return days;
}

export default function PromoteBannerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerCategory, setBannerCategory] = useState("Fashion");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const selectedDates = useMemo(() => computeRangeDates(startDate, endDate), [startDate, endDate]);
  const selectedDays = useMemo(() => selectedDates.length, [selectedDates]);
  const subtotal = selectedDays * DAILY_BANNER_RATE;
  const platformFee = selectedDays > 0 ? 49 : 0;
  const totalPrice = subtotal + platformFee;

  const handleSubmitForApproval = async () => {
    setSubmitMessage("");
    setSubmitError("");

    if (!bannerTitle.trim()) {
      setSubmitError("Banner title is required.");
      return;
    }

    if (!bannerPreview) {
      setSubmitError("Please upload a banner image before submitting.");
      return;
    }

    if (selectedDates.length === 0) {
      setSubmitError("Please select at least one visibility date.");
      return;
    }

    setSubmitting(true);
    try {
      await submitBannerPromotionRequest({
        bannerTitle: bannerTitle.trim(),
        bannerCategory,
        imageUrl: bannerPreview,
        selectedDates,
        totalPrice,
        dailyRate: DAILY_BANNER_RATE,
        platformFee,
        recommendedSize: "1920 x 520 px",
      });

      setSubmitMessage("Banner request submitted for admin review.");
      setBannerTitle("");
      setStartDate("");
      setEndDate("");
      setBannerPreview("");
    } catch (error) {
      setSubmitError(error?.data?.message || "Failed to submit banner request.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/banners/promote");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") return null;

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="banners" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <button onClick={() => router.push("/merchant/banners")} className="text-[13px] text-[#5a5a5a] inline-flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#a9a9a9] text-[10px]">
              <ChevronLeft size={11} />
            </span>
            Back to Banners
          </button>

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
            <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5">
              <h1 className="text-[38px] font-semibold leading-none text-[#1f1f1f]">Promote Your Banner</h1>
              <p className="mt-3 text-[13px] text-[#6f6f6f] max-w-[700px]">
                Upload your banner creative, pick category, choose visibility dates, and submit for admin approval.
              </p>
              <p className="mt-2 text-[12px] text-[#4c4c4c]">
                Homepage banner spec: <span className="font-semibold">1920 x 520 px</span>. Only <span className="font-semibold">5 banners</span> are active at a time.
              </p>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2a2a2a] mb-2">Banner Title</label>
                    <input
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Enter banner title"
                      className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] text-[#2f2f2f] outline-none focus:border-[#2f9e58]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#2a2a2a] mb-2">Banner Category</label>
                    <select
                      value={bannerCategory}
                      onChange={(e) => setBannerCategory(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] text-[#2f2f2f] outline-none focus:border-[#2f9e58]"
                    >
                      {bannerCategories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#2a2a2a] mb-2">Upload Banner</label>
                    <label className="h-[176px] rounded-[12px] border border-dashed border-[#cfcfcf] bg-[#fbfbfb] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2f9e58] transition">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setBannerPreview(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <div className="h-10 w-10 rounded-full bg-[#ecf8f0] text-[#2f9e58] flex items-center justify-center">
                        <Upload size={16} />
                      </div>
                      <p className="text-[13px] font-semibold text-[#2a2a2a]">Click to upload banner image</p>
                      <p className="text-[11px] text-[#757575]">Recommended 1920 x 520 px (ratio ~3.7:1), max 5MB</p>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                <div>
                    <label className="block text-[13px] font-semibold text-[#2a2a2a] mb-2">Promotion Calendar</label>
                    <div className="rounded-[10px] border border-[#e4e4e4] bg-[#fafafa] p-4 h-[420px] flex flex-col">
                      <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                        {/* Left Column: Calendar */}
                        <div className="bg-white rounded-[8px] border border-[#e4e4e4] p-4 overflow-y-auto">
                          {/* Month/Year Navigation */}
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => {
                                if (currentMonth === 0) {
                                  setCurrentMonth(11);
                                  setCurrentYear(currentYear - 1);
                                } else {
                                  setCurrentMonth(currentMonth - 1);
                                }
                              }}
                              className="h-7 w-7 rounded-[4px] border border-[#ddd] bg-white text-[12px] flex items-center justify-center hover:bg-[#f5f5f5]"
                            >
                              ‹
                            </button>
                            <p className="text-[13px] font-semibold text-[#1f1f1f]">
                              {new Date(currentYear, currentMonth).toLocaleDateString("en-GB", {
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <button
                              onClick={() => {
                                if (currentMonth === 11) {
                                  setCurrentMonth(0);
                                  setCurrentYear(currentYear + 1);
                                } else {
                                  setCurrentMonth(currentMonth + 1);
                                }
                              }}
                              className="h-7 w-7 rounded-[4px] border border-[#ddd] bg-white text-[12px] flex items-center justify-center hover:bg-[#f5f5f5]"
                            >
                              ›
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#666] mb-1">Start Date</label>
                              <input
                                type="date"
                                min={todayIso}
                                value={startDate}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setStartDate(next);
                                  if (endDate && next && endDate < next) {
                                    setEndDate("");
                                  }
                                  if (next) {
                                    const parsed = new Date(next);
                                    if (!Number.isNaN(parsed.getTime())) {
                                      setCurrentMonth(parsed.getMonth());
                                      setCurrentYear(parsed.getFullYear());
                                    }
                                  }
                                }}
                                className="h-9 w-full rounded-[8px] border border-[#e4e4e4] bg-white px-3 text-[11px] outline-none focus:border-[#2f9e58]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-[#666] mb-1">End Date</label>
                              <input
                                type="date"
                                min={startDate || todayIso}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 w-full rounded-[8px] border border-[#e4e4e4] bg-white px-3 text-[11px] outline-none focus:border-[#2f9e58]"
                              />
                            </div>
                          </div>

                          {/* Weekday Headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                              <div key={day} className="h-6 flex items-center justify-center text-[10px] font-semibold text-[#666]">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays(currentYear, currentMonth).map((day, idx) => {
                              const dateObj = day
                                ? new Date(currentYear, currentMonth, day)
                                : null;
                              const dateStr = dateObj ? dateToString(dateObj) : null;
                              const isSelected = dateStr && selectedDates.includes(dateStr);
                              const isStart = dateStr && startDate === dateStr;
                              const isEnd = dateStr && endDate === dateStr;
                              const isToday =
                                dateObj &&
                                dateObj.toDateString() === new Date().toDateString();
                              const isPast = dateObj && dateObj < new Date() && !isToday;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (!dateStr || isPast) return;
                                    if (!startDate || (startDate && endDate)) {
                                      setStartDate(dateStr);
                                      setEndDate("");
                                      return;
                                    }

                                    if (dateStr < startDate) {
                                      setStartDate(dateStr);
                                      setEndDate("");
                                      return;
                                    }

                                    setEndDate(dateStr);
                                  }}
                                  disabled={isPast}
                                  className={`h-7 rounded-[4px] text-[11px] font-medium transition ${
                                    !day
                                      ? "bg-transparent"
                                      : isPast
                                        ? "bg-[#f0f0f0] text-[#ccc] cursor-not-allowed"
                                        : isStart || isEnd
                                          ? "bg-[#1f8f4f] text-white font-semibold"
                                          : isSelected
                                            ? "bg-[#e8f5e9] text-[#2f9e58] border border-[#2f9e58]"
                                            : isToday
                                              ? "bg-[#eef2ff] text-[#4338ca] border border-[#4338ca]"
                                              : "bg-white border border-[#e4e4e4] text-[#2f2f2f] hover:bg-[#f9f9f9]"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right Column: Selected Dates */}
                        <div className="space-y-3 flex flex-col overflow-hidden">
                          <div className="flex-1 space-y-2 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-[#6c6c6c] font-medium">Selected Dates ({selectedDates.length})</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setStartDate("");
                                  setEndDate("");
                                }}
                                className="text-[10px] font-semibold text-[#2f9e58] hover:text-[#1a6b38]"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="bg-white rounded-[8px] border border-[#e4e4e4] p-3 space-y-2 flex-1 overflow-y-auto">
                              {selectedDates.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="rounded-[8px] border border-[#ececec] bg-[#fafafa] px-3 py-2 text-[11px] text-[#444]">
                                    <p>
                                      Range:{" "}
                                      <span className="font-semibold">{formatDate(startDate)}</span>{" "}
                                      -{" "}
                                      <span className="font-semibold">{formatDate(endDate)}</span>
                                    </p>
                                  </div>
                                  {selectedDates.map((dateStr) => (
                                    <div
                                      key={dateStr}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#e8f5e9] border border-[#2f9e58] w-full justify-between"
                                    >
                                      <span className="text-[11px] font-semibold text-[#2f9e58]">
                                        {new Date(dateStr).toLocaleDateString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "2-digit",
                                        })}
                                      </span>
                                      <button
                                        onClick={() =>
                                          (setStartDate(""), setEndDate(""))
                                        }
                                        className="text-[#2f9e58] hover:text-[#1a6b38] font-bold text-xs leading-none"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#999] italic py-4 text-center">No dates selected yet</p>
                              )}
                            </div>
                          </div>

                          <div className="rounded-[8px] border border-[#ebebeb] bg-white px-3 py-2 text-[12px] text-[#2f2f2f] flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[#666]">
                              <CalendarDays size={13} /> Total Days
                            </span>
                            <span className="font-semibold">{selectedDays > 0 ? `${selectedDays}` : "0"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#2a2a2a] mb-2">Banner Preview</label>
                    <div className="relative h-[176px] rounded-[12px] border border-[#e4e4e4] overflow-hidden bg-[#f4f4f4]">
                      {bannerPreview ? (
                        <Image src={bannerPreview} alt="Banner preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[12px] text-[#7a7a7a] px-4 text-center">
                          Banner preview appears here after upload.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-[#e4e4e4] bg-[#fff8e8] px-4 py-3 text-[12px] text-[#5e4a1a] space-y-1">
                    <p>Selected category: <span className="font-semibold">{bannerCategory}</span></p>
                    <p>Visibility dates: <span className="font-semibold">{selectedDates.length > 0 ? `${selectedDates.length} day(s)` : "No dates selected"}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 h-fit sticky top-24">
              <p className="text-[21px] font-semibold text-[#1f1f1f]">Pricing Summary</p>
              <p className="mt-2 text-[12px] text-[#6c6c6c]">Paid promotion charges are calculated based on selected visibility dates.</p>

              <div className="mt-5 space-y-3 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#676767]">Rate per day</span>
                  <span className="font-semibold">Rs. {DAILY_BANNER_RATE}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#676767]">Selected days</span>
                  <span className="font-semibold">{selectedDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#676767]">Subtotal</span>
                  <span className="font-semibold">Rs. {subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#676767]">Platform fee</span>
                  <span className="font-semibold">Rs. {platformFee}</span>
                </div>
                <div className="h-px bg-[#e8e8e8]" />
                <div className="flex items-center justify-between text-[16px]">
                  <span className="font-semibold text-[#1f1f1f]">Total Payable</span>
                  <span className="font-semibold text-[#2f9e58]">Rs. {totalPrice}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="mt-6 h-10 w-full rounded-[8px] bg-[#2f9e58] disabled:bg-[#9fcfad] text-white text-[13px] font-semibold inline-flex items-center justify-center"
              >
                {submitting ? "Submitting..." : "Submit For Approval"}
              </button>

              {submitError ? <p className="mt-3 text-[11px] text-[#dc2626]">{submitError}</p> : null}
              {submitMessage ? <p className="mt-3 text-[11px] text-[#157a4f]">{submitMessage}</p> : null}

              <p className="mt-3 text-[11px] text-[#7a7a7a] leading-[1.45]">
                Request status will be shown in Banner Promotions list as Under Review, Rejected, or Approved. Pay option appears after approval.
              </p>
            </aside>
          </section>
        </div>
      </main>

      <footer className="bg-[#f0b330] text-[#1b1b1b] px-4 lg:px-8 py-7 mt-6">
        <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-between">
          <div className="max-w-[240px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center font-bold text-[#157a4f]">G</div>
              <span className="text-[18px] font-semibold text-[#157a4f]">GOLO</span>
            </div>
            <p className="text-[10px] leading-[1.35] text-[#fff8de] max-w-[150px]">
              The all-in-one management platform for modern businesses. Empowering growth through analytics and intuitive product management.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-14 lg:gap-20 text-[10px] text-[#6b520f]">
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">Links</p>
              <ul className="space-y-2">
                <li>Overview</li>
                <li>Inventory</li>
                <li>Posts</li>
                <li>Profile</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">&nbsp;</p>
              <ul className="space-y-2">
                <li>Analytics</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">Support</p>
              <ul className="space-y-2">
                <li>Help Center</li>
                <li>Security</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mt-auto lg:pb-2 text-[#1877f2]">
            <span className="h-5 w-5 rounded-full bg-[#f3ba3b] flex items-center justify-center text-[#1877f2] text-[10px] font-bold">f</span>
            <span className="h-5 w-5 rounded-[2px] bg-[#f3ba3b] flex items-center justify-center text-[#0a66c2] text-[9px] font-bold">in</span>
            <span className="h-5 w-5 rounded-full bg-[#f3ba3b] flex items-center justify-center text-[#e1306c] text-[10px] font-bold">ig</span>
            <span className="h-5 w-5 rounded-[2px] bg-[#f3ba3b] flex items-center justify-center text-[#ff0000] text-[10px] font-bold">▶</span>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto mt-6 flex items-center justify-between text-[9px] text-[#5f4710]">
          <p>© 2026 GOLO Dashboard. All rights reserved.</p>
          <p>Made with ♥ by V</p>
        </div>
      </footer>
    </div>
  );
}
