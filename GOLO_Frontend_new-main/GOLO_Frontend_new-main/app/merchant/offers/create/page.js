"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Upload, X, Circle, CircleCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import MerchantNavbar from "../../MerchantNavbar";
 import {
   clearMyOfferTemplate,
   getMerchantStoreLocation,
   getMyOfferTemplate,
   getMerchantProducts,
   saveMyOfferTemplate,
   submitOfferPromotionRequest,
   getProfile,
 } from "../../../lib/api";

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

const DEFAULT_TERMS = "• Valid only on selected products.\n• Limited to 1 use per customer.";
const DEFAULT_EXAMPLE = "Shop for Rs 3,000 and earn 1 star. Collect all stars to unlock your final discount.";
const OFFER_TEMPLATE_LOCAL_KEY = "golo_offer_template";
const OFFER_TEMPLATE_API_DISABLED_KEY = "golo_offer_template_api_disabled";

function buildSelectedDates(startDate, endDate) {
  if (!startDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate || startDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [startDate];
  if (end < start) return [startDate];

  const dates = [];
  const cursor = new Date(start);
  let guard = 0;

  while (cursor <= end && guard < 366) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return dates;
}

function isValidImageUrl(value) {
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDateForInput(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function CreateMerchantOfferPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [storeLocationReady, setStoreLocationReady] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

   const [formData, setFormData] = useState({
     title: "",
     category: "Special",
     imageUrl: "",
     startDate: "",
     endDate: "",
     promotionExpiryText: "",
     loyaltyRewardEnabled: true,
     loyaltyPointsPerPurchase: "1",
     termsAndConditions: DEFAULT_TERMS,
     exampleUsage: DEFAULT_EXAMPLE,
   });

   const [merchantStoreCategory, setMerchantStoreCategory] = useState('');

  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [modalSelectionIds, setModalSelectionIds] = useState([]);
  const [templateApiAvailable, setTemplateApiAvailable] = useState(true);

  const applyTemplate = (template) => {
    if (!template) return;

    if (template?.formData) {
      // Legacy templates stored 'category' as promotion type
      const { category: oldCategory, ...rest } = template.formData;
      setFormData((prev) => ({
        ...prev,
        ...rest,
        category: oldCategory || prev.category,
        startDate: formatDateForInput(template.formData.startDate),
        endDate: formatDateForInput(template.formData.endDate),
      }));
    }

    if (Array.isArray(template?.selectedProducts)) {
      setSelectedProducts(template.selectedProducts);
    }
  };

  // No localStorage fallback: rely on backend template API for persistence

  const loadMerchantProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");

      const pageSize = 100;
      const firstRes = await getMerchantProducts({ page: 1, limit: pageSize });
      const firstRows = Array.isArray(firstRes?.data?.products)
        ? firstRes.data.products
        : [];

      const totalPages = Number(firstRes?.pagination?.pages || 1);

      if (totalPages <= 1) {
        setInventoryProducts(firstRows);
        return;
      }

      const allRows = [...firstRows];
      for (let page = 2; page <= totalPages; page += 1) {
        const nextRes = await getMerchantProducts({ page, limit: pageSize });
        const nextRows = Array.isArray(nextRes?.data?.products)
          ? nextRes.data.products
          : [];
        allRows.push(...nextRows);
      }

      setInventoryProducts(allRows);
    } catch (err) {
      setError(err?.message || "Failed to load inventory products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const verifyMerchantLocation = async () => {
      try {
        const response = await getMerchantStoreLocation();
        const latitude = Number(response?.data?.latitude);
        const longitude = Number(response?.data?.longitude);
        const hasCoordinates =
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180;
        setStoreLocationReady(hasCoordinates);
      } catch {
        setStoreLocationReady(false);
      }
    };

    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/offers/create");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
      return;
    }

     if (!loading && user?.accountType === "merchant") {
       loadMerchantProducts();
       verifyMerchantLocation();

       // Fetch merchant profile to get store category (for display)
       (async () => {
         try {
           const profileRes = await getProfile();
           setMerchantStoreCategory(profileRes.data?.storeCategory || '');
         } catch (err) {
           console.warn('Could not fetch merchant store category', err);
         }

         (async () => {
           let apiDisabled = false;
           try {
             apiDisabled = localStorage.getItem(OFFER_TEMPLATE_API_DISABLED_KEY) === "1";
           } catch {
           }

           try {
             const templateRes = await getMyOfferTemplate();
             const template = templateRes?.data;
             setTemplateApiAvailable(true);
             applyTemplate(template);
           } catch (err) {
             if (err?.status === 404) {
               setTemplateApiAvailable(false);
             }
           }
         })();
       })();
     }
  }, [loading, user, router]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setFormData((prev) => ({
          ...prev,
          promotionExpiryText: `Offer ends in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
        }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const selectedDatesPreview = useMemo(
    () => buildSelectedDates(formData.startDate, formData.endDate || formData.startDate),
    [formData.startDate, formData.endDate],
  );

  const filteredInventory = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    if (!needle) return inventoryProducts;

    return inventoryProducts.filter((row) =>
      String(row?.name || "").toLowerCase().includes(needle),
    );
  }, [inventoryProducts, productSearch]);

  const totalOfferValue = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + Number(item.offerPrice || 0), 0),
    [selectedProducts],
  );

  const openProductModal = () => {
    setModalSelectionIds(selectedProducts.map((item) => item.productId));
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductSearch("");
  };

  const toggleModalSelection = (productId) => {
    setModalSelectionIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const saveSelectedProductsFromModal = () => {
    const existingMap = new Map(selectedProducts.map((item) => [item.productId, item]));

    const nextProducts = inventoryProducts
      .filter((item) => modalSelectionIds.includes(item.id))
      .map((item) => {
        const existing = existingMap.get(item.id);
        const originalPrice = Number(item.price || 0);

        return {
          productId: item.id,
          productName: item.name,
          imageUrl: item.image || item.images?.[0] || "",
          originalPrice,
          offerPrice: existing ? Number(existing.offerPrice || 0) : originalPrice,
          stockQuantity: Number(item.stockQuantity || 0),
        };
      });

    setSelectedProducts(nextProducts);
    closeProductModal();
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateSelectedOfferPrice = (productId, nextValue) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, offerPrice: nextValue }
          : item,
      ),
    );
  };

  const uploadOfferImage = async (file) => {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 5MB.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const cloudinaryForm = new FormData();
      cloudinaryForm.append("file", file);
      cloudinaryForm.append("upload_preset", "choja_preset");
      cloudinaryForm.append("cloud_name", "dcm1plq42");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcm1plq42/image/upload", {
        method: "POST",
        body: cloudinaryForm,
      });

      const data = await res.json();
      if (!res.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Image upload failed.");
      }

      setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
    } catch (err) {
      setError(err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetAll = async () => {
    setFormData({
      title: "",
      category: "Special",
      imageUrl: "",
      startDate: "",
      endDate: "",
      promotionExpiryText: "",
      loyaltyRewardEnabled: true,
      loyaltyPointsPerPurchase: "1",
      termsAndConditions: DEFAULT_TERMS,
      exampleUsage: DEFAULT_EXAMPLE,
    });
    setSelectedProducts([]);
    setError("");
    setSuccessMessage("");

    try {
      localStorage.removeItem(OFFER_TEMPLATE_LOCAL_KEY);
    } catch {
    }

    if (!templateApiAvailable) {
      setSuccessMessage("Template cleared successfully.");
      return;
    }

    try {
      await clearMyOfferTemplate();
      try {
        localStorage.removeItem(OFFER_TEMPLATE_API_DISABLED_KEY);
      } catch {
      }
      setSuccessMessage("Template cleared successfully.");
    } catch (err) {
      if (err?.status === 404) {
        setTemplateApiAvailable(false);
        try {
          localStorage.setItem(OFFER_TEMPLATE_API_DISABLED_KEY, "1");
        } catch {
        }
        setSuccessMessage("Template cleared successfully.");
        return;
      }
      setError("Failed to clear saved template.");
    }
  };

  const saveTemplate = async () => {
    const templatePayload = {
      formData,
      selectedProducts,
    };

    if (!templateApiAvailable) {
      setError('Template API unavailable. Please try again later.');
      return;
    }

    try {
      await saveMyOfferTemplate(templatePayload);
      setSuccessMessage('Template saved successfully.');
      setError('');
    } catch (err) {
      setError('Failed to save template.');
    }
  };

  const validateBeforeSubmit = () => {
    if (!storeLocationReady) {
      setError("Please set your store location on map in Merchant Profile before publishing offers.");
      return false;
    }

    const title = formData.title.trim();
    if (!title) {
      setError("Offer title is required.");
      return false;
    }

    if (!formData.startDate) {
      setError("Start date is required.");
      return false;
    }

    const endDate = formData.endDate || formData.startDate;
    if (new Date(endDate) < new Date(formData.startDate)) {
      setError("End date cannot be before start date.");
      return false;
    }

    const imageUrl = formData.imageUrl.trim();
    if (!isValidImageUrl(imageUrl)) {
      setError("Please upload an offer banner image from your device.");
      return false;
    }

    if (selectedProducts.length === 0) {
      setError("Please add at least one product to this offer.");
      return false;
    }

    const hasInvalidPrice = selectedProducts.some((item) => {
      const offerPrice = Number(item.offerPrice);
      return Number.isNaN(offerPrice) || offerPrice < 0;
    });

    if (hasInvalidPrice) {
      setError("All offer prices must be valid values.");
      return false;
    }

    setError("");
    return true;
  };

  const onPreview = () => {
    if (!validateBeforeSubmit()) return;
    setPreviewOpen(true);
  };

   const onSubmit = async (e) => {
     e.preventDefault();

     if (!validateBeforeSubmit()) {
       return;
     }

     const selectedDates = buildSelectedDates(
       formData.startDate,
       formData.endDate || formData.startDate,
     );

     setFormSubmitting(true);
     setError("");
     setSuccessMessage("");

     try {
       await submitOfferPromotionRequest({
         title: formData.title.trim(),
         // Promotional type used for UI filtering
         category: formData.category,
         imageUrl: formData.imageUrl.trim(),
         selectedDates,
         totalPrice: totalOfferValue,
         promotionExpiryText: formData.promotionExpiryText,
         loyaltyRewardEnabled: formData.loyaltyRewardEnabled,
         loyaltyPointsPerPurchase: Number(formData.loyaltyPointsPerPurchase || 1),
         termsAndConditions: formData.termsAndConditions,
         exampleUsage: formData.exampleUsage,
         selectedProducts: selectedProducts.map((item) => ({
           productId: item.productId,
           productName: item.productName,
           imageUrl: item.imageUrl || "",
           originalPrice: Number(item.originalPrice || 0),
           offerPrice: Number(item.offerPrice || 0),
           stockQuantity: Number(item.stockQuantity || 0),
         })),
       });

      try {
        localStorage.removeItem(OFFER_TEMPLATE_LOCAL_KEY);
      } catch {
      }

      try {
        if (templateApiAvailable) {
          await clearMyOfferTemplate();
        }
      } catch {
      }

      router.push("/merchant/offers");
    } catch (err) {
      setError(err?.message || "Failed to create offer.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="offers" />

      <main className="w-full px-4 md:px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1180px] space-y-5">
          {!storeLocationReady ? (
            <div className="rounded-[10px] border border-[#f5d2c4] bg-[#fff7f3] px-4 py-3 text-[12px] text-[#a1431d]">
              Store coordinates are missing. Update your store location from map in Merchant Profile to enable nearby deals for customers.
            </div>
          ) : null}

          <button
            onClick={() => router.push("/merchant/offers")}
            className="text-[13px] text-[#5a5a5a] inline-flex items-center gap-2"
            type="button"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#a9a9a9] text-[10px]">
              <ChevronLeft size={11} />
            </span>
            Back to Offers
          </button>

          <section className="rounded-[12px] border border-[#e2e2e2] bg-white p-4 md:p-6">
            <h1 className="text-[30px] md:text-[38px] font-semibold leading-none text-[#1f1f1f]">Create New Offer</h1>

            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <div className="rounded-[12px] border border-[#ececec] bg-[#fbfbfb] p-4">
                <h2 className="text-[18px] font-semibold text-[#202020]">Offer Details</h2>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">Offer Title</label>
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none"
                      placeholder="e.g. Diwali Dhamaka"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">Promotion Expiry</label>
                    <input
                      value={formData.promotionExpiryText}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promotionExpiryText: e.target.value }))}
                      className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none"
                      placeholder="Offer ends in 30 days"
                    />
                    <p className="mt-1 text-[11px] text-[#9a9a9a]">Automatically calculated based on campaign end date.</p>
                  </div>

                   <div>
                     <label className="mb-1 block text-[12px] font-semibold text-[#555]">Promotion Type</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none"
                      >
                       {OFFER_CATEGORIES.map((item) => (
                         <option key={item} value={item}>
                           {item}
                         </option>
                       ))}
                     </select>
                     {merchantStoreCategory && (
                       <p className="mt-2 text-[11px] text-[#6b7280]">
                         This offer will be listed under <span className="font-semibold text-[#157A4F]">{merchantStoreCategory}</span> for customer recommendations.
                       </p>
                     )}
                   </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">Active Days</label>
                    <div className="h-10 w-full rounded-[8px] border border-[#ececec] bg-[#fafafa] px-3 text-[13px] text-[#444] flex items-center">
                      {selectedDatesPreview.length} day(s)
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#ececec] bg-[#fbfbfb] p-4">
                <h2 className="text-[18px] font-semibold text-[#202020]">Offer Banner</h2>

                <div className="mt-3 space-y-3">
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-[#d5d5d5] bg-[#f7f7f7] px-4 text-[12px] font-semibold text-[#333] hover:bg-[#efefef]">
                    <Upload size={14} />
                    {uploadingImage ? "Uploading..." : "Upload from device"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        uploadOfferImage(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <div className="rounded-[10px] border-2 border-dashed border-[#d8c4bb] bg-[#fff] min-h-[140px] p-4 flex items-center justify-center">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Offer banner preview" className="max-h-[180px] w-full object-contain rounded-[8px]" />
                    ) : (
                      <p className="text-[14px] text-[#666]">Click to add Offer Banner of your Offer</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#ececec] bg-[#fbfbfb] p-4">
                <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#202020]">Loyalty Reward</h2>
                    <p className="mt-1 text-[12px] text-[#666]">Reward repeat customers for purchases.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, loyaltyRewardEnabled: !prev.loyaltyRewardEnabled }))}
                    className={`h-7 w-14 rounded-full p-1 transition ${formData.loyaltyRewardEnabled ? "bg-[#efb02e]" : "bg-[#d0d0d0]"}`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition ${formData.loyaltyRewardEnabled ? "translate-x-7" : "translate-x-0"}`}
                    />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#555]">Points rewarded to user after redemption <span className="text-[#ef4d4d]">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.loyaltyPointsPerPurchase}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, "");
                        if (val === "") val = "1";
                        let num = Math.max(1, Math.min(50, Number(val)));
                        setFormData((prev) => ({ ...prev, loyaltyPointsPerPurchase: String(num) }));
                      }}
                      disabled={!formData.loyaltyRewardEnabled}
                      className="h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-[13px] outline-none disabled:bg-[#f1f1f1]"
                    />
                    <p className="mt-1 text-[11px] text-[#9a9a9a]">Allowed range: 1 to 50 points per redemption.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#ececec] bg-[#fbfbfb] p-4">
                <h2 className="text-[18px] font-semibold text-[#202020]">Terms and Conditions</h2>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                  className="mt-3 h-28 w-full rounded-[8px] border border-[#dedede] bg-white px-3 py-2 text-[13px] outline-none"
                />

                <div className="mt-3 rounded-[8px] border border-[#efe7c7] bg-[#fffbe8] px-3 py-2">
                  <p className="text-[12px] font-semibold text-[#6d5b1d]">Example Usage:</p>
                  <input
                    value={formData.exampleUsage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, exampleUsage: e.target.value }))}
                    className="mt-1 w-full bg-transparent text-[12px] text-[#665d3f] outline-none"
                  />
                </div>
              </div>

              <div className="rounded-[12px] border border-[#ececec] bg-[#fbfbfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#202020]">Add Products</h2>
                    <p className="text-[12px] text-[#666]">Choose products to include in this special promotion bundle.</p>
                  </div>

                  <button
                    type="button"
                    onClick={openProductModal}
                    className="h-9 rounded-[8px] border border-[#4eaa73] bg-[#eaf8ef] px-4 text-[12px] font-semibold text-[#2f9e58]"
                  >
                    {selectedProducts.length} item(s) selected
                  </button>
                </div>

                {loadingProducts ? <p className="mt-3 text-[12px] text-[#666]">Loading products...</p> : null}

                <div className="mt-4 rounded-[10px] border border-[#d7dbe2] bg-[#f7f9fc] p-4 min-h-[140px]">
                  {selectedProducts.length === 0 ? (
                    <div className="h-[120px] flex items-center justify-center text-[#666] text-[18px]">
                      Click to add products from your inventory
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProducts.map((item) => (
                        <div key={item.productId} className="rounded-[10px] border border-[#e6e6e6] bg-white p-3 flex items-start gap-3">
                          <div className="h-16 w-16 rounded-[8px] overflow-hidden border border-[#ececec] bg-[#fafafa] flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[11px] text-[#999]">No image</div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[14px] font-semibold text-[#222]">{item.productName}</p>
                                <p className="text-[11px] text-[#777]">Original: Rs {Number(item.originalPrice || 0).toLocaleString()}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSelectedProduct(item.productId)}
                                className="text-[#df4b4b]"
                                aria-label={`Remove ${item.productName}`}
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[11px] text-[#777]">Offer Price</span>
                              <input
                                type="number"
                                min="0"
                                value={item.offerPrice}
                                onChange={(e) => updateSelectedOfferPrice(item.productId, e.target.value)}
                                className="h-8 w-28 rounded-[7px] border border-[#dcdcdc] bg-white px-2 text-[12px] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[12px] border border-[#ececec] bg-white p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-[#303030]">Total Offer Value: Rs {Math.round(totalOfferValue).toLocaleString()}</p>
                    <p className="text-[12px] text-[#666]">Review details before publishing the offer.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onPreview}
                      className="h-10 rounded-[8px] bg-[#18824f] px-5 text-[12px] font-semibold text-white"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={saveTemplate}
                      className="h-10 rounded-[8px] border border-[#d7d7d7] bg-white px-5 text-[12px] font-semibold text-[#666]"
                    >
                      Save as Template
                    </button>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="h-10 rounded-[8px] border border-[#d7d7d7] bg-white px-5 text-[12px] font-semibold text-[#666]"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="h-10 rounded-[8px] bg-[#efb02e] px-5 text-[12px] font-semibold text-[#5a4514] disabled:opacity-60"
                    >
                      {formSubmitting ? "Publishing..." : "Publish Offer"}
                    </button>
                  </div>
                </div>

                {error ? <p className="mt-3 text-[12px] text-[#ef4d4d]">{error}</p> : null}
                {successMessage ? <p className="mt-3 text-[12px] text-[#2d8f53]">{successMessage}</p> : null}
              </div>
            </form>
          </section>
        </div>
      </main>

      {isProductModalOpen ? (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-[900px] rounded-[12px] bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between">
              <h3 className="text-[28px] font-semibold text-[#222]">Choose Products</h3>
              <button type="button" onClick={closeProductModal} className="text-[#777]">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a4a4]" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white pl-9 pr-3 text-[13px] outline-none"
                  placeholder="Search by product name"
                />
              </div>

              <div className="max-h-[360px] overflow-auto rounded-[10px] border border-[#ededed]">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#f4f6f8] text-[#666] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Image</th>
                      <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Stock</th>
                      <th className="px-4 py-3 text-left font-semibold">Click to Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-[#666]" colSpan={5}>
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const checked = modalSelectionIds.includes(item.id);
                        return (
                          <tr key={item.id} className="border-t border-[#f1f1f1]">
                            <td className="px-4 py-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#ececec] bg-[#fafafa]">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#222]">{item.name}</td>
                            <td className="px-4 py-3">Rs {Number(item.price || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">{item.stock || "0 units"}</td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => toggleModalSelection(item.id)}>
                                {checked ? (
                                  <CircleCheck size={18} className="text-[#2f9e58]" />
                                ) : (
                                  <Circle size={18} className="text-[#3a3a3a]" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#ececec] flex items-center justify-end gap-2 bg-[#fafafa]">
              <button
                type="button"
                onClick={closeProductModal}
                className="h-9 rounded-[8px] border border-[#d9d9d9] bg-white px-4 text-[12px] font-semibold text-[#666]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSelectedProductsFromModal}
                className="h-9 rounded-[8px] border border-[#4eaa73] bg-[#eaf8ef] px-4 text-[12px] font-semibold text-[#2f9e58]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-[980px] rounded-[16px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.24)] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between bg-[#f9fafb]">
              <h3 className="text-[22px] font-semibold text-[#222]">Offer Preview</h3>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-[#777]">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-[#f3f4f6]">
              <div className="rounded-[14px] border border-[#e5e7eb] bg-white overflow-hidden">
                <div className="relative h-[220px] bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d]">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Offer banner" className="h-full w-full object-cover opacity-85" />
                  ) : null}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                   <div className="absolute left-0 right-0 bottom-0 p-5 text-white">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                       <span className="rounded-full bg-[#f0b429] px-3 py-1 text-[11px] font-semibold text-[#4f3b00]">
                         {formData.category || "Special"}
                       </span>
                       <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                         {selectedProducts.length} Product{selectedProducts.length === 1 ? "" : "s"}
                       </span>
                     </div>
                    <h4 className="text-[28px] leading-tight font-semibold">
                      {formData.title || "Your Offer Title"}
                    </h4>
                    <p className="mt-1 text-[12px] text-white/90">
                      By {user?.name || "Merchant"}
                    </p>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-[#ececec] bg-[#fcfcfd]">
                  <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-[11px] text-[#6b7280]">Offer Value</p>
                    <p className="text-[18px] font-semibold text-[#111827]">Rs {Math.round(totalOfferValue).toLocaleString()}</p>
                  </div>
                  <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-[11px] text-[#6b7280]">Start Date</p>
                    <p className="text-[14px] font-semibold text-[#111827]">{formData.startDate || "-"}</p>
                  </div>
                  <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-[11px] text-[#6b7280]">End Date</p>
                    <p className="text-[14px] font-semibold text-[#111827]">{formData.endDate || formData.startDate || "-"}</p>
                  </div>
                  <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2">
                    <p className="text-[11px] text-[#6b7280]">Promotion Expiry</p>
                    <p className="text-[14px] font-semibold text-[#111827]">{formData.promotionExpiryText || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-[14px] border border-[#e5e7eb] bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[18px] font-semibold text-[#111827]">Selected Products</h5>
                    <span className="text-[12px] text-[#6b7280]">{selectedProducts.length} total</span>
                  </div>

                  {selectedProducts.length === 0 ? (
                    <div className="rounded-[10px] border border-dashed border-[#d1d5db] bg-[#f9fafb] h-[130px] flex items-center justify-center text-[13px] text-[#6b7280]">
                      No products selected yet
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {selectedProducts.map((item) => (
                        <div key={item.productId} className="rounded-[10px] border border-[#ececec] bg-[#fff] p-3 flex items-center gap-3">
                          <div className="h-14 w-14 rounded-[8px] overflow-hidden border border-[#ececec] bg-[#f8fafc] flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-[#9ca3af]">No image</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#111827] truncate">{item.productName}</p>
                            <p className="text-[11px] text-[#6b7280]">Stock: {item.stockQuantity || 0} units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-[#9ca3af] line-through">Rs {Number(item.originalPrice || 0).toLocaleString()}</p>
                            <p className="text-[14px] font-semibold text-[#047857]">Rs {Number(item.offerPrice || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
                    <h5 className="text-[16px] font-semibold text-[#111827] mb-2">Loyalty Reward</h5>
                    <p className="text-[12px] text-[#6b7280] mb-3">
                      {formData.loyaltyRewardEnabled
                        ? `Customers will earn ${formData.loyaltyPointsPerPurchase || 1} point(s) per redemption for this offer.`
                        : "Loyalty reward is disabled for this offer."}
                    </p>
                     <div className="space-y-2 text-[12px]">
                       <div className="flex justify-between"><span className="text-[#6b7280]">Business Category</span><span className="font-semibold text-[#111827]">{merchantStoreCategory || "General"}</span></div>
                       <div className="flex justify-between"><span className="text-[#6b7280]">Promotion Type</span><span className="font-semibold text-[#111827]">{formData.category}</span></div>
                       <div className="flex justify-between"><span className="text-[#6b7280]">Valid Days</span><span className="font-semibold text-[#111827]">{selectedDatesPreview.length}</span></div>
                       <div className="flex justify-between"><span className="text-[6b7280]">Loyalty Reward</span><span className="font-semibold text-[#111827]">{formData.loyaltyRewardEnabled ? "Yes" : "No"}</span></div>
                       <div className="flex justify-between"><span className="text-[#6b7280]">Points Per Redemption</span><span className="font-semibold text-[#111827]">{formData.loyaltyPointsPerPurchase || 1}</span></div>
                     </div>
                  </div>

                  <div className="rounded-[14px] border border-[#f0e7d4] bg-[#fffbe8] p-5">
                    <h5 className="text-[16px] font-semibold text-[#111827] mb-2">Loyalty Reward</h5>
                    <p className="text-[13px] text-[#4b5563] mb-2">
                      {formData.loyaltyRewardEnabled
                        ? `Customers will earn ${formData.loyaltyPointsPerPurchase || 1} point(s) per redemption for this offer.`
                        : "Loyalty rewards are not enabled for this offer."}
                    </p>
                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between"><span className="text-[#6b7280]">Enabled</span><span className="font-semibold text-[#111827]">{formData.loyaltyRewardEnabled ? "Yes" : "No"}</span></div>
                      <div className="flex justify-between"><span className="text-[#6b7280]">Points Per Redemption</span><span className="font-semibold text-[#111827]">{formData.loyaltyPointsPerPurchase || 1}</span></div>
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
                    <h5 className="text-[16px] font-semibold text-[#111827] mb-2">Terms and Conditions</h5>
                    <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#4b5563] bg-[#f9fafb] border border-[#ececec] rounded-[10px] p-3 min-h-[120px]">
                      {formData.termsAndConditions || "No terms provided"}
                    </pre>
                    <p className="mt-3 text-[11px] text-[#6b7280]"><span className="font-semibold">Example Usage:</span> {formData.exampleUsage || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#ececec] flex justify-end bg-[#f9fafb]">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="h-10 rounded-[10px] border border-[#d1d5db] bg-white px-5 text-[12px] font-semibold text-[#374151] hover:bg-[#f3f4f6]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
