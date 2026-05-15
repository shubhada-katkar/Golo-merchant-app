"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CircleHelp, Download, MapPin, Share2, Star, Ticket, Copy, Check } from "lucide-react";
import { useVoucher } from "../../../context/VoucherContext";
import { useAuth } from "../../../context/AuthContext";
import { getNearbyOfferDetails, getPublicMerchantProfile, getPublicVoucherStatus, submitOfferReview } from "../../../lib/api";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

const steps = [
  { title: "Step 1", subtitle: "Offer claimed successfully", active: false },
  { title: "Step 2", subtitle: "Show this QR to merchant", active: true },
  { title: "Step 3", subtitle: "Pay at store & enjoy", active: false },
];

function QrPattern() {
  return (
    <svg viewBox="0 0 220 220" className="h-[164px] w-[164px]" role="img" aria-label="Offer QR Code">
      <rect width="220" height="220" fill="white" />
      <rect x="12" y="12" width="196" height="196" fill="none" stroke="#1ea05d" strokeWidth="3" strokeDasharray="30 30" />

      <rect x="28" y="28" width="50" height="50" rx="8" fill="#181d25" />
      <rect x="40" y="40" width="26" height="26" rx="5" fill="white" />

      <rect x="142" y="28" width="50" height="50" rx="8" fill="#181d25" />
      <rect x="154" y="40" width="26" height="26" rx="5" fill="white" />

      <rect x="28" y="142" width="50" height="50" rx="8" fill="#181d25" />
      <rect x="40" y="154" width="26" height="26" rx="5" fill="white" />

      <rect x="93" y="32" width="18" height="18" rx="9" fill="#181d25" />
      <rect x="112" y="32" width="18" height="74" rx="9" fill="#181d25" />
      <rect x="93" y="88" width="37" height="18" rx="9" fill="#181d25" />

      <rect x="85" y="116" width="18" height="18" rx="9" fill="#181d25" />
      <rect x="121" y="116" width="18" height="18" rx="9" fill="#181d25" />
      <rect x="149" y="116" width="18" height="18" rx="9" fill="#181d25" />
      <rect x="177" y="116" width="18" height="18" rx="9" fill="#181d25" />

      <rect x="89" y="146" width="14" height="14" rx="7" fill="#181d25" />
      <rect x="113" y="146" width="14" height="14" rx="7" fill="#181d25" />
      <rect x="146" y="146" width="14" height="14" rx="7" fill="#181d25" />
      <rect x="172" y="146" width="24" height="14" rx="7" fill="#181d25" />

      <rect x="89" y="172" width="14" height="14" rx="7" fill="#181d25" />
      <rect x="113" y="172" width="14" height="36" rx="7" fill="#181d25" />
      <rect x="146" y="172" width="14" height="14" rx="7" fill="#181d25" />
      <rect x="172" y="172" width="14" height="36" rx="7" fill="#181d25" />
      <rect x="188" y="194" width="8" height="14" rx="4" fill="#181d25" />
    </svg>
  );
}

export default function ClaimedOfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f3f3]" />}>
      <ClaimedOfferContent />
    </Suspense>
  );
}

function ClaimedOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { selectedVoucher, setSelectedVoucher, fetchVoucherDetails, downloadQR, shareVoucherHandler, loading } = useVoucher();
  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [voucherAccessRestricted, setVoucherAccessRestricted] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [merchantProfile, setMerchantProfile] = useState(null);
  const [offerDetails, setOfferDetails] = useState(null);

  const voucherId = searchParams.get("voucherId");

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/nearby-deals/deal/claimed-offer");
    }
  }, [user, router]);

  // Fetch voucher details on mount - always fetch on reload since context is cleared
  useEffect(() => {
    if (!voucherId || !user) {
      return;
    }

    const selectedVoucherMatches =
      selectedVoucher?._id === voucherId || selectedVoucher?.voucherId === voucherId;

    // If we already have the voucher in context, use it
    if (selectedVoucherMatches) {
      setVoucherAccessRestricted(false);
      return;
    }

    // Otherwise fetch from API (handles page reload)
    // Note: fetchVoucherDetails already handles loading state internally
    fetchVoucherDetails(voucherId)
      .then(() => setVoucherAccessRestricted(false))
      .catch((err) => {
        const message = err?.message || err?.data?.message || "";

        if (message.includes("You do not have access to this voucher")) {
          setVoucherAccessRestricted(true);
          return;
        }

        console.error("Failed to fetch voucher:", err);
      });
  }, [voucherId, user]);

  useEffect(() => {
    if (!voucherId || selectedVoucher?.status === "redeemed") {
      return;
    }

    const syncVoucherStatus = async () => {
      try {
        const response = await getPublicVoucherStatus(voucherId);
        const publicStatus = response?.data?.status;

        if (publicStatus === "redeemed") {
          const redeemedAt = response?.data?.redeemedAt || null;
          const resolvedVoucherId = response?.data?._id || voucherId;

          try {
            const detailResponse = await fetchVoucherDetails(resolvedVoucherId);
            if (detailResponse?.data?.status === "redeemed") {
              return;
            }
          } catch {
          }

          setSelectedVoucher((prev) => ({
            ...(prev || {}),
            _id: response?.data?._id || prev?._id || voucherId,
            voucherId: response?.data?.voucherId || prev?.voucherId,
            status: "redeemed",
            redeemedAt,
          }));
        }
      } catch {
      }
    };

    syncVoucherStatus();

    const intervalId = setInterval(syncVoucherStatus, 4000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncVoucherStatus();
      }
    };

    window.addEventListener("focus", syncVoucherStatus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", syncVoucherStatus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [voucherId, selectedVoucher?.status, fetchVoucherDetails, setSelectedVoucher]);

  useEffect(() => {
    const merchantId = selectedVoucher?.merchantId;
    const offerId = selectedVoucher?.offerId;

    if (!merchantId && !offerId) {
      setMerchantProfile(null);
      setOfferDetails(null);
      return;
    }

    let active = true;

    (async () => {
      try {
        const [profileRes, offerRes] = await Promise.allSettled([
          merchantId ? getPublicMerchantProfile(String(merchantId)) : Promise.resolve(null),
          offerId ? getNearbyOfferDetails(String(offerId)) : Promise.resolve(null),
        ]);

        if (!active) return;

        setMerchantProfile(profileRes.status === "fulfilled" ? profileRes.value?.data || null : null);
        setOfferDetails(offerRes.status === "fulfilled" ? offerRes.value?.data || null : null);
      } catch {
        if (!active) return;
        setMerchantProfile(null);
        setOfferDetails(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedVoucher?.merchantId, selectedVoucher?.offerId]);

  const handleDownloadQR = async () => {
    try {
      if (loading) {
        alert("Voucher is still loading, please wait...");
        return;
      }
      
      if (!selectedVoucher?._id) {
        console.error("Selected voucher:", selectedVoucher);
        alert("Voucher not loaded yet. Please refresh the page.");
        return;
      }
      
      const response = await downloadQR(selectedVoucher._id);
      
      // Get QR image from response (base64 data URL)
      const qrImage = response?.data?.qrImage;
      if (!qrImage) {
        console.error("No QR image in response:", response);
        alert("Failed to download QR code - missing image data");
        return;
      }
      
      // Create link from data URL and download directly
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = `voucher-${selectedVoucher.voucherId || selectedVoucher._id.substring(0, 8)}-qr.png`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Safely remove the link element
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 100);
      
      console.log("✓ QR code downloaded successfully as PNG");
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Failed to download QR code: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleShareOffer = async () => {
    if (!shareEmail.trim()) {
      setShareMessage("Please enter an email address");
      return;
    }

    setIsSharing(true);
    setShareMessage("");
    try {
      if (!selectedVoucher?._id) return;
      await shareVoucherHandler(selectedVoucher._id, shareEmail);
      setShareMessage(`✓ Shared with ${shareEmail}`);
      setShareEmail("");
      setTimeout(() => setShareMessage(""), 3000);
    } catch (err) {
      setShareMessage(`Error: ${err.data?.message || "Failed to share"}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!selectedVoucher?.verificationCode) return;

    try {
      await navigator.clipboard.writeText(selectedVoucher.verificationCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewSubmitting || reviewSubmitted) {
      return;
    }

    if (!reviewFeedback.trim()) {
      setReviewMessage("Please share a short feedback note before submitting.");
      return;
    }

    const resolvedVoucherId = selectedVoucher?._id || voucherId;
    if (!resolvedVoucherId) {
      setReviewMessage("Voucher information is missing. Please refresh and try again.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewMessage("");
      await submitOfferReview(resolvedVoucherId, {
        rating: reviewRating,
        content: reviewFeedback.trim(),
      });
      setReviewSubmitted(true);
      setReviewMessage("Your rating and feedback have been saved.");
      setRedirecting(true);
      router.push("/nearby-deals");
    } catch (err) {
      setReviewMessage(err?.data?.message || err?.message || "Failed to submit feedback.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (selectedVoucher?.status === "redeemed") {
    return (
      <main className="min-h-screen bg-[#f3f3f3]">
        <Navbar />

        <div className="mx-auto flex max-w-[820px] px-6 py-20">
          <section className="w-full rounded-[20px] border border-[#d8dce3] bg-white px-8 py-14 text-center shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e9f8ef]">
              <Check size={36} className="text-[#1e9a5c]" />
            </div>

            <h1 className="mt-6 text-[34px] font-bold leading-none text-[#1e2228]">
              Thank you for redeeming
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[#66707b]">
              Your voucher has been successfully redeemed by the merchant. Please share your feedback and rating to continue.
            </p>

            <div className="mx-auto mt-8 max-w-[540px] rounded-[18px] border border-[#e3e7ec] bg-[#f9fbfc] px-5 py-5 text-left">
              <p className="text-[18px] font-bold text-[#1e2228]">Rate this offer</p>
              <p className="mt-1 text-[13px] leading-6 text-[#66707b]">
                Your feedback will appear on this offer page to help other users choose better deals.
              </p>

              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!reviewSubmitted) {
                        setReviewRating(value);
                      }
                    }}
                    className="rounded-full p-1 transition hover:scale-105 disabled:cursor-not-allowed"
                    disabled={reviewSubmitted}
                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={24}
                      className={value <= reviewRating ? "text-[#f4ba34]" : "text-[#cfd6df]"}
                      fill={value <= reviewRating ? "#f4ba34" : "none"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[13px] font-semibold text-[#44505c]">
                  {reviewRating}/5
                </span>
              </div>

              <textarea
                value={reviewFeedback}
                onChange={(event) => setReviewFeedback(event.target.value)}
                disabled={reviewSubmitted}
                rows={4}
                placeholder="Tell others how your experience was with this offer."
                className="mt-4 w-full rounded-[14px] border border-[#d8dce3] bg-white px-4 py-3 text-[14px] text-[#1e2228] outline-none transition focus:border-[#1e9a5c] focus:ring-2 focus:ring-[#d7f2e4] disabled:bg-[#f3f5f7]"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-[#7b8590]">
                  You will be redirected to nearby deals after you submit your review.
                </p>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting || reviewSubmitted}
                  className="inline-flex items-center justify-center rounded-[12px] bg-[#1e9a5c] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#18824e] disabled:bg-[#a7afb8]"
                >
                  {reviewSubmitting ? "Submitting..." : reviewSubmitted ? "Review Submitted" : "Submit Review"}
                </button>
              </div>

              {reviewMessage ? (
                <p className={`mt-3 text-[12px] font-medium ${reviewSubmitted ? "text-[#1e9a5c]" : "text-[#b45309]"}`}>
                  {reviewMessage}
                </p>
              ) : null}
            </div>

            <div className="mx-auto mt-6 w-fit rounded-full bg-[#f4f7f9] px-4 py-2 text-[12px] font-semibold text-[#5b6672]">
              {redirecting ? "Redirecting to nearby deals..." : "Redemption completed - waiting for your feedback"}
            </div>
          </section>
        </div>

        <Footer />
      </main>
    );
  }

  if (voucherAccessRestricted && !selectedVoucher) {
    return (
      <main className="min-h-screen bg-[#f3f3f3]">
        <Navbar />

        <div className="mx-auto flex max-w-[820px] px-6 py-20">
          <section className="w-full rounded-[20px] border border-[#d8dce3] bg-white px-8 py-14 text-center shadow-[0_10px_30px_rgba(16,24,40,0.08)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4e8]">
              <Ticket size={36} className="text-[#d07a1d]" />
            </div>

            <h1 className="mt-6 text-[34px] font-bold leading-none text-[#1e2228]">
              Voucher not available in this account
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[#66707b]">
              This voucher belongs to a different logged-in account. If the merchant redeems it, this page will still update automatically when the public status changes.
            </p>

            <button
              type="button"
              onClick={() => router.push("/nearby-deals")}
              className="mt-8 inline-flex items-center justify-center rounded-[12px] bg-[#1e9a5c] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#18824e]"
            >
              Back to Nearby Deals
            </button>
          </section>
        </div>

        <Footer />
      </main>
    );
  }

  const resolvedOfferTitle =
    selectedVoucher?.offerTitle ||
    offerDetails?.title ||
    "Claimed Offer";
  const resolvedMerchantName =
    selectedVoucher?.merchantName ||
    merchantProfile?.name ||
    offerDetails?.merchant?.name ||
    "Merchant";
  const resolvedDescription =
    offerDetails?.description ||
    selectedVoucher?.discount ||
    offerDetails?.exampleUsage ||
    selectedVoucher?.description ||
    "";
  const resolvedOfferPrice = Number(
    offerDetails?.displayPrice ?? offerDetails?.totalPrice ?? selectedVoucher?.price ?? 0,
  );
  const resolvedOriginalPrice = Number(
    offerDetails?.totalPrice ?? selectedVoucher?.originalPrice ?? 0,
  );
  const resolvedMerchantRating = Number(merchantProfile?.averageRating ?? 0);
  const resolvedMerchantReviews = Number(merchantProfile?.totalReviews ?? 0);
  const resolvedMerchantLocation =
    merchantProfile?.profile?.address ||
    merchantProfile?.merchantProfile?.storeLocation ||
    offerDetails?.merchant?.address ||
    selectedVoucher?.merchantLocation ||
    "";
  const resolvedOfferImage =
    selectedVoucher?.offerImage ||
    offerDetails?.imageUrl ||
    merchantProfile?.profilePhoto ||
    "/images/place2.avif";

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <Navbar />

      <div className="mx-auto max-w-[1260px] px-6 pt-5">
        <p className="text-[11px] text-[#7a7a7a]">Deals <span className="mx-1">›</span> <span className="font-medium">Claimed Offer</span></p>
        <h1 className="mt-3 text-[44px] font-bold leading-none text-[#1e2228] tracking-[-0.02em]">{resolvedOfferTitle}</h1>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.82fr_0.86fr]">
          <div className="overflow-hidden rounded-[12px] border border-[#d8dce3] bg-white shadow-[0_6px_18px_rgba(16,24,40,0.06)]">
            <div className="flex items-center gap-3 border-b border-[#e6e9ed] px-4 py-3">
              <div className="h-14 w-14 overflow-hidden rounded-[8px] border border-[#d9dde2]">
                <Image src={resolvedOfferImage} alt={resolvedMerchantName} width={56} height={56} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-bold text-[#1d232c]">{resolvedMerchantName}</p>
                  <span className="rounded bg-[#f45c92] px-1.5 py-0.5 text-[9px] font-bold text-white">CLAIMED</span>
                </div>
                <p className="mt-1 text-[11px] text-[#6d7681]">{resolvedDescription || resolvedOfferTitle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[28px] font-bold leading-none text-[#e8a91e]">₹{resolvedOfferPrice.toLocaleString("en-IN")}</span>
                  {resolvedOriginalPrice > resolvedOfferPrice ? (
                    <span className="text-[11px] font-semibold text-[#ed6f6f] line-through">₹ {resolvedOriginalPrice.toLocaleString("en-IN")}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="px-6 pb-7 pt-6 text-center">
              <div className="mx-auto flex h-[232px] w-[232px] items-center justify-center rounded-[18px] border border-[#d8dce3] bg-white p-4 shadow-[0_6px_18px_rgba(16,24,40,0.05)]">
                {selectedVoucher?.qrImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedVoucher.qrImage}
                    alt={`QR code for ${resolvedOfferTitle}`}
                    className="h-[164px] w-[164px] object-contain"
                  />
                ) : (
                  <QrPattern />
                )}
              </div>

              <p className="mt-1 text-[16px] font-medium text-[#1e2228]">Scan this QR at the store to redeem the offer</p>

              <div className="mx-auto mt-4 w-fit min-w-[290px] rounded-[10px] bg-[#f0f2f5] px-4 py-3 border border-[#e2e6eb]">
                <p className="text-[11px] text-[#7a828d]">This QR is valid for {selectedVoucher?.validityHours || 6} hours from claim time</p>
                <p className="mt-1 text-[13px] font-bold text-[#1e232b]">Expires: {selectedVoucher?.expiresAt || "Today, 8:45 PM"}</p>
              </div>

              {/* MANUAL VERIFICATION CODE */}
              <div className="mx-auto mt-5 w-full max-w-[400px] rounded-[10px] bg-[#f3f8f5] px-4 py-4 border border-[#c8e6d7]">
                <p className="text-[11px] font-bold text-[#2d6a4f] mb-2">🔐 Manual Verification Code</p>
                <p className="text-[10px] text-[#5a8570] mb-3">If scanner is not working, provide this code to merchant for manual verification:</p>
                
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1 bg-white rounded-[8px] border border-[#dde9e3] px-3 py-2 font-mono text-[14px] font-bold text-[#1e2228] overflow-hidden text-center tracking-wider">
                    <span className="break-all">{selectedVoucher?.verificationCode || "Loading..."}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    disabled={!selectedVoucher?.verificationCode}
                    className="px-3 py-2 rounded-[8px] bg-[#2d6a4f] text-white hover:bg-[#1f4d35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {codeCopied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                
                {codeCopied && (
                  <p className="text-[10px] text-green-600 font-semibold mt-2">✓ Code copied to clipboard</p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleDownloadQR}
                  disabled={loading || !selectedVoucher?._id}
                  className="inline-flex h-10 min-w-[112px] items-center justify-center gap-2 rounded-[8px] bg-[#1e9a5c] px-4 text-[12px] font-semibold text-white shadow-[0_2px_6px_rgba(30,154,92,0.35)] transition-colors hover:bg-[#187f4c] disabled:bg-[#a5a5a5] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> {loading ? "Loading..." : "Download QR"}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Check this offer!",
                        text: `${resolvedOfferTitle} - Get ₹${resolvedOfferPrice}!`,
                        url: window.location.href,
                      });
                    } else {
                      alert("Share feature not supported on this device");
                    }
                  }}
                  className="inline-flex h-10 min-w-[112px] items-center justify-center gap-2 rounded-[8px] border border-[#d4d9df] bg-white px-6 text-[12px] font-semibold text-[#4b5563] transition-colors hover:bg-[#f8f9fb]"
                >
                  <Share2 size={14} /> Share
                </button>
              </div>

              <p className="mt-4 text-[10px] text-[#9098a3]">Secure claim • No upfront payment required at GOLO</p>
            </div>
          </div>

          <div className="space-y-3">
            <aside className="rounded-[12px] border border-[#d8dce3] bg-white p-4 shadow-[0_4px_14px_rgba(16,24,40,0.05)]">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 aspect-square overflow-hidden rounded-full border border-[#d8dce3]">
                  <Image src={resolvedOfferImage} alt={resolvedMerchantName} width={64} height={64} className="h-full w-full rounded-full object-cover" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1f2329]">{resolvedMerchantName}</p>
                  <p className="mt-1 text-[12px] text-[#66707b]"><Star size={11} className="mr-1 inline text-[#f4ba34]" />{resolvedMerchantRating.toFixed(1)} ({resolvedMerchantReviews.toLocaleString()} Reviews)</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#66707b]"><MapPin size={11} className="mr-1 inline" />{resolvedMerchantLocation || "Location unavailable"}</p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e4e7eb]">
                <Image src="/images/banner3.avif" alt="Merchant highlight" width={420} height={240} className="h-[110px] w-full object-cover" />
              </div>

              <button
                onClick={() => {
                  const merchantStoreId = selectedVoucher?.merchantId;
                  if (merchantStoreId) {
                    sessionStorage.setItem("merchantId", merchantStoreId);
                    router.push("/nearby-deals/store");
                  }
                }}
                className="mt-4 h-10 w-full rounded-[8px] border border-[#e8b038] bg-[#f7ebcf] text-[12px] font-semibold text-[#8f6515] transition-colors hover:bg-[#f3dfb2]"
              >
                View Store
              </button>

              <button
                onClick={() => {
                  const sellerId = selectedVoucher?.merchantId;
                  if (sellerId) {
                    router.push(`/chats?sellerId=${sellerId}`);
                    return;
                  }
                  alert("Merchant contact is unavailable for this voucher.");
                }}
                className="mt-2 h-10 w-full rounded-[8px] border border-[#d6dbe2] bg-white text-[12px] font-semibold text-[#5e6772] transition-colors hover:bg-[#f8f9fb]"
              >
                Contact Merchant
              </button>
            </aside>

            {/* SHARE SECTION */}
            <aside className="rounded-[12px] border border-[#d8dce3] bg-white p-4 shadow-[0_4px_14px_rgba(16,24,40,0.04)]">
              <p className="text-[13px] font-bold text-[#1f2329]">Share with Friend</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="friend@email.com"
                  className="flex-1 rounded-[8px] border border-[#d6dbe2] px-3 py-2 text-[12px] placeholder-gray-400 focus:border-[#1e9a5c] focus:outline-none"
                />
                <button
                  onClick={handleShareOffer}
                  disabled={isSharing}
                  className="rounded-[8px] bg-[#1e9a5c] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#187f4c] disabled:opacity-60"
                >
                  {isSharing ? "..." : "Send"}
                </button>
              </div>
              {shareMessage && (
                <p className={`mt-2 text-[11px] ${shareMessage.includes("✓") ? "text-green-600" : "text-red-600"}`}>
                  {shareMessage}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-5 text-[#66707b]">
                Your friend will receive the voucher link and can claim for themselves.
              </p>
            </aside>

            <aside className="rounded-[12px] border border-[#d8dce3] bg-[#f1f3f6] p-4 shadow-[0_4px_14px_rgba(16,24,40,0.04)]">
              <p className="text-[13px] font-bold text-[#1f2329]">Need help with redemption?</p>
              <p className="mt-2 text-[11px] leading-5 text-[#66707b]">
                If you encounter any issues at the store, please contact our 24/7 support team.
              </p>
              <button
                onClick={() => window.open("mailto:support@golo.local?subject=Need%20help%20with%20voucher%20redemption", "_self")}
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e9a5c]"
              >
                <CircleHelp size={13} /> Visit Help Center
              </button>
            </aside>
          </div>
        </section>

        <section className="mt-4 grid gap-3 pb-5 sm:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className={`rounded-[10px] border px-4 py-4 text-center shadow-[0_2px_8px_rgba(16,24,40,0.04)] ${step.active ? "border-[#efbe51] bg-[#fff9eb]" : "border-[#d8dce3] bg-[#f7f8fa]"}`}
            >
              <Ticket size={19} className={`mx-auto ${step.active ? "text-[#e4a923]" : "text-[#d7b976]"}`} />
              <p className="mt-2 text-[15px] font-bold text-[#1f2329] leading-none">{step.title}</p>
              <p className="mt-1.5 text-[13px] text-[#66707b] leading-5">{step.subtitle}</p>
            </article>
          ))}
        </section>
      </div>

      <Footer />
    </main>
  );
}
