"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { createAd, openRazorpayCheckout } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function PostAdPaymentPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pendingRaw = localStorage.getItem("pendingAdPost");
    if (!pendingRaw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(pendingRaw);
      setPending(parsed);
    } catch {
      localStorage.removeItem("pendingAdPost");
    } finally {
      setLoading(false);
    }
  }, []);

  const total = useMemo(() => Number(pending?.payment?.amount || 0), [pending]);

  const handleBackToForm = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    const templateId = pending?.payment?.templateId || 1;
    router.push(`/post-ad/form?template=${templateId}`);
  };

  const handlePayAndPost = async () => {
    if (!pending?.adData) {
      setMessage({ type: "error", text: "Ad draft not found. Please fill the form again." });
      return;
    }

    if (!isAuthenticated) {
      router.push("/login?redirect=/post-ad/payment");
      return;
    }

    if (total <= 0) {
      setMessage({ type: "error", text: "Invalid payment amount. Please check your ad details." });
      return;
    }

    setProcessing(true);
    setMessage({ type: "", text: "" });

    try {
      await openRazorpayCheckout({
        amount: total,
        description: `Ad Payment - ${pending.adData.title || "GOLO"}`,
        notes: {
          flow: "post_ad",
          category: pending.adData.category || "General",
          templateId: String(pending?.payment?.templateId || 1),
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: pending.adData?.contactInfo?.phone || "",
        },
      });

      const response = await createAd(pending.adData);

      if (response?.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pendingAdPost");
        }
        setMessage({ type: "success", text: "Payment successful. Your ad has been posted." });
        setTimeout(() => {
          router.push("/my-ads");
        }, 1200);
        return;
      }

      setMessage({ type: "error", text: response?.message || "Ad posting failed after payment." });
    } catch (error) {
      setMessage({ type: "error", text: error?.data?.message || error.message || "Payment could not be completed." });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white py-12 px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <button
            type="button"
            onClick={handleBackToForm}
            className="text-sm font-semibold text-[#157A4F] hover:underline mb-4"
          >
            ← Back to Form
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600 mb-6">Pay first to publish your ad.</p>

          {message.text && (
            <div
              className={`mb-5 p-3 rounded-lg text-sm font-semibold ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {loading || authLoading ? (
            <p className="text-gray-600">Loading payment details...</p>
          ) : !pending?.adData ? (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
              <p className="text-amber-800 font-semibold">No pending ad found.</p>
              <p className="text-amber-700 text-sm mt-1">Please complete the ad form and click Review &amp; Post Ad again.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 text-sm border border-gray-100 rounded-xl p-5 mb-6 bg-gray-50">
                <div className="flex justify-between"><span className="text-gray-600">Ad Title</span><span className="font-medium text-gray-900">{pending.adData.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="font-medium text-gray-900">{pending.adData.category}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Days</span><span className="font-medium text-gray-900">{pending?.payment?.daysCount || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-900">₹{Number(pending?.payment?.subtotal || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span className="font-medium text-gray-900">₹{Number(pending?.payment?.gst || 0).toFixed(2)}</span></div>
                <div className="pt-3 border-t border-gray-200 flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-[#157A4F]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayAndPost}
                disabled={processing}
                className="w-full bg-[#157A4F] text-white py-3 rounded-xl font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? "Processing payment..." : `Pay ₹${total.toFixed(2)} & Post Ad`}
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
