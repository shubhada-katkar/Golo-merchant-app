"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import OfferProductEditor from "./components/OfferProductEditor";
import {
  deleteMyOfferPromotion,
  getMyOfferPromotions,
  updateMyOfferPromotion,
} from "../../lib/api";

const OFFER_CATEGORIES = [
  "Special",
  "Festival",
  "Limited Time",
  "Combo",
  "Clearance",
  "Flash Sale",
  "Buy One Get One (BOGO)",
  "Flat Discount",
  "Percentage Off",
  "Bundle Deal",
  "New Arrival Offer",
  "Seasonal Offer",
  "Weekend Offer",
  "Happy Hour Deal",
  "Member Exclusive",
  "First Purchase Offer",
  "Loyalty Reward",
  "Referral Offer",
  "Clear Stock Sale",
  "Free Gift Offer",
];

function buildSelectedDates(startDate, endDate) {
  if (!startDate) return [];

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate || startDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates = [];
  const cursor = new Date(start);
  let guard = 0;

  while (cursor <= end && guard < 366) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }

  return dates;
}

function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 10);
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateValue) {
  const normalized = toDateInputValue(dateValue);
  if (!normalized) return "-";

  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return normalized;

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return utcDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function normalizeSelectedProducts(selectedProducts = []) {
  return Array.isArray(selectedProducts)
    ? selectedProducts.map((item) => ({
        productId: String(item?.productId || item?.id || ""),
        productName: String(item?.productName || item?.name || "Product"),
        imageUrl: String(item?.imageUrl || item?.image || ""),
        originalPrice: Number(item?.originalPrice || item?.price || 0),
        offerPrice: Number(item?.offerPrice || item?.price || 0),
        stockQuantity: Number(item?.stockQuantity || item?.stock || 0),
      })).filter((item) => item.productId)
    : [];
}

export default function MerchantOffersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [offers, setOffers] = useState([]);
  const [query, setQuery] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    category: "Special",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  const getOfferTitle = (offer) =>
    String(offer?.title || offer?.bannerTitle || offer?.bannertitle || "").trim();

  const loadOffers = async () => {
    try {
      setPageLoading(true);
      setError("");
      const res = await getMyOfferPromotions();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setOffers(
        rows.map((offer) => ({
          ...offer,
          title: getOfferTitle(offer),
        })),
      );
    } catch (err) {
      setError(err?.message || "Failed to load offers");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/offers");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.accountType === "merchant") {
      loadOffers();
    }
  }, [loading, user]);

  const filteredOffers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return offers;
    return offers.filter((offer) =>
      getOfferTitle(offer).toLowerCase().includes(needle),
    );
  }, [offers, query]);

  const activeCount = filteredOffers.filter((offer) => offer.status === "active").length;
  const totalRevenue = filteredOffers.reduce((sum, offer) => sum + Number(offer.totalPrice || 0), 0);

  const resetForm = () => {
    setFormData({
      title: "",
      category: "Special",
      imageUrl: "",
      startDate: "",
      endDate: "",
    });
    setSelectedProducts([]);
    setEditingOfferId(null);
    setFormError("");
  };

  const openEditForm = (offer) => {
    setEditingOfferId(offer.requestId);
    setFormData({
      title: getOfferTitle(offer),
      category: offer.category || "Special",
      imageUrl: offer.imageUrl || "",
      startDate: toDateInputValue(offer.startDate),
      endDate: toDateInputValue(offer.endDate),
    });
    setSelectedProducts(normalizeSelectedProducts(offer.selectedProducts));
    setFormError("");
    setFormOpen(true);
  };

  const totalOfferValue = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + Number(item.offerPrice || 0), 0),
    [selectedProducts],
  );

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();

    const title = formData.title.trim();
    if (!title) {
      setFormError("Offer title is required.");
      return;
    }

    if (!formData.startDate) {
      setFormError("Start date is required.");
      return;
    }

    if (selectedProducts.length === 0) {
      setFormError("Please add at least one product to this offer.");
      return;
    }

    setFormSubmitting(true);
    try {
      setError("");
      if (editingOfferId) {
        const selectedDates = buildSelectedDates(
          formData.startDate,
          formData.endDate || formData.startDate,
        );

        const updatedTitle = title;
        const updatedCategory = formData.category;
        const updatedImageUrl = formData.imageUrl.trim();
        const updatedEndDate = formData.endDate || formData.startDate;
        const updatedSelectedProducts = selectedProducts.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl || "",
          originalPrice: Number(item.originalPrice || 0),
          offerPrice: Number(item.offerPrice || 0),
          stockQuantity: Number(item.stockQuantity || 0),
        }));

        await updateMyOfferPromotion(editingOfferId, {
          title: updatedTitle,
          category: updatedCategory,
          imageUrl: updatedImageUrl,
          selectedDates,
          totalPrice: Math.round(totalOfferValue),
          selectedProducts: updatedSelectedProducts,
        });

        setOffers((currentOffers) =>
          currentOffers.map((offer) =>
            offer.requestId === editingOfferId
              ? {
                  ...offer,
                  title: updatedTitle,
                  category: updatedCategory,
                  imageUrl: updatedImageUrl,
                  selectedDates,
                  selectedProducts: updatedSelectedProducts,
                  totalPrice: Math.round(totalOfferValue),
                  startDate: formData.startDate,
                  endDate: updatedEndDate,
                }
              : offer,
          ),
        );
      }

      await loadOffers();
      closeForm();
    } catch (err) {
      setFormError(err?.message || "Failed to update offer");
    } finally {
      setFormSubmitting(false);
    }
  };

  const onDeleteOffer = async (offer) => {
    if (!window.confirm(`Delete offer \"${getOfferTitle(offer)}\"?`)) return;
    try {
      await deleteMyOfferPromotion(offer.requestId);
      await loadOffers();
    } catch (err) {
      setError(err?.message || "Failed to delete offer");
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes shimmer-sweep {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer-offers {
          background: linear-gradient(90deg, #e8e8e8 25%, #f4f4f4 50%, #e8e8e8 75%);
          background-size: 800px 100%;
          animation: shimmer-sweep 1.4s ease-in-out infinite;
        }
      `}</style>
      <MerchantNavbar activeKey="offers" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <section>
            <h1 className="text-[42px] font-semibold leading-none text-[#1e1e1e]">Offer List</h1>
            <p className="mt-3 text-[13px] text-[#6f6f6f] max-w-[500px]">
              Manage your offer catalog, monitor active promotions, and update expiry dates.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Total Offers</p>
                <p className="text-[34px] font-semibold leading-none mt-1">{filteredOffers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#f8eff2] text-[#f67da7] flex items-center justify-center text-[18px]">✦</div>
            </div>

            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Active Offers</p>
                <p className="text-[34px] font-semibold leading-none mt-1">{activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#f4f4f1] text-[#2cb56e] flex items-center justify-center">⬡</div>
            </div>

            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Offer Value</p>
                <p className="text-[34px] font-semibold leading-none mt-1">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#f4f4f1] text-[#efb02e] flex items-center justify-center text-[20px]">₹</div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e5e5e5] bg-[#f9f9f9] p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-[620px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a4a4]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-[8px] border border-[#e2e2e2] bg-white pl-8 pr-3 text-[12px] outline-none"
                  placeholder="Search by offer name"
                />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => router.push("/merchant/offers/create")} className="h-9 rounded-[8px] bg-[#2f9e58] px-4 text-[11px] font-semibold text-white inline-flex items-center gap-1.5">
                  <Plus size={12} /> Add New Offer
                </button>
              </div>
            </div>

            {error ? <p className="mt-3 text-[12px] text-[#ef4d4d]">{error}</p> : null}

            {formOpen ? (
              <div className="mt-4 rounded-[10px] border border-[#e3e3e3] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-semibold text-[#2a2a2a]">Edit Offer</h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="h-8 rounded-[7px] border border-[#e0e0e0] bg-white px-3 text-[11px] font-semibold text-[#5e5e5e]"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={onSubmitForm} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">Offer Title</label>
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="h-9 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] outline-none"
                      placeholder="Enter offer title"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="h-9 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] outline-none"
                    >
                      {OFFER_CATEGORIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">Image URL</label>
                    <input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="h-9 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] outline-none"
                      placeholder="https://example.com/offer-image.jpg"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="h-9 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#555]">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="h-9 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <OfferProductEditor
                      value={selectedProducts}
                      onChange={setSelectedProducts}
                    />
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="h-9 rounded-[8px] bg-[#2f9e58] px-4 text-[11px] font-semibold text-white disabled:opacity-70"
                    >
                      {formSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>

                {formError ? <p className="mt-3 text-[12px] text-[#ef4d4d]">{formError}</p> : null}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-[10px] border border-[#ececec] bg-white">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f2f3f5] text-[#666]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Offer Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Posted Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Expiry Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLoading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="border-t border-[#f0f0f0]">
                          <td className="px-4 py-3"><div className="h-4 w-28 rounded shimmer-offers" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-20 rounded shimmer-offers" /></td>
                          <td className="px-4 py-3"><div className="h-5 w-14 rounded-full shimmer-offers" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-20 rounded shimmer-offers" /></td>
                          <td className="px-4 py-3"><div className="h-4 w-24 rounded shimmer-offers" /></td>
                        </tr>
                      ))}
                    </>
                  ) : filteredOffers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#666]" colSpan={5}>No offers found</td>
                    </tr>
                  ) : filteredOffers.map((row) => (
                    <tr key={row.requestId} className="border-t border-[#f0f0f0]">
                      <td className="px-4 py-3 font-semibold text-[#2a2a2a]">{row.title}</td>
                      <td className="px-4 py-3 text-[#2c2c2c]">{formatDateForDisplay(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        {row.status === "active" ? (
                          <span className="inline-flex rounded-full bg-[#e7f7ec] px-2 py-0.5 text-[10px] font-semibold text-[#2f9e58]">Active</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#eef0f3] px-2 py-0.5 text-[10px] font-semibold text-[#4a4f57]">{String(row.status || "unknown")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#2c2c2c]">{formatDateForDisplay(row.endDate)}</td>
                      <td className="px-4 py-3 text-[11px]">
                        <button onClick={() => openEditForm(row)} className="text-[#f0aa19] font-semibold">Edit</button>
                        <span className="mx-2 text-[#cfcfcf]">/</span>
                        <button onClick={() => onDeleteOffer(row)} className="text-[#ef4d4d] font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-[#d6d9df] px-6 py-4 text-[12px] text-[#565656]">Showing {filteredOffers.length} offers</div>
            </div>
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
