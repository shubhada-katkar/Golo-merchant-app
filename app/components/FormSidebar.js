"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { createAd } from "../lib/api";

export default function FormSidebar({
  adTitleState,
  adDescriptionState,
  cities,
  uploadedImages,
  primaryContact,
  selectedCategory,
  mobilePrice,
  monthlyRent,
  propertyTypeRent,
  isReviewStarted,
  setIsReviewStarted,
  templateId,
  selectedDates,
  categoryDetails,
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if ((templateId === 1 || !templateId) && uploadedImages && uploadedImages.length > 1) {
      const id = setInterval(() => {
        setCarouselIndex((p) =>
          uploadedImages.length ? (p + 1) % uploadedImages.length : 0
        );
      }, 3000);
      return () => clearInterval(id);
    }
    setCarouselIndex(0);
  }, [templateId, uploadedImages]);

  // Dynamic price logic
  const getPrice = () => {
    const templatePrices = { 1: "₹5", 2: "₹3", 3: "₹2" };
    if (templateId && templatePrices[templateId]) return templatePrices[templateId];
    return "₹0";
  };

  const templateCostPerDay = parseInt(getPrice().replace(/[^0-9]/g, "")) || 0;
  const daysCount = selectedDates && selectedDates.length > 0 ? selectedDates.length : 0;
  const daysCharge = daysCount * templateCostPerDay;
  const featuredCharge = isFeatured ? 100 : 0;
  const subtotal = daysCharge + featuredCharge;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handlePostAd = async () => {
    setSubmitError("");

    // Check auth
    if (!isAuthenticated) {
      router.push("/login?redirect=/post-ad/form");
      return;
    }

    // Basic validation
    if (!adTitleState?.trim()) {
      setSubmitError("Please enter an ad title.");
      return;
    }
    if (!adDescriptionState?.trim()) {
      setSubmitError("Please enter a description.");
      return;
    }
    if (!selectedCategory) {
      setSubmitError("Please select a category.");
      return;
    }

    setIsSubmitting(true);
    setIsReviewStarted(true);

    try {
      const rawCategoryName = typeof selectedCategory === 'string'
        ? selectedCategory
        : (selectedCategory?.name || 'Other');

      const categoryNameMap = {
        Electronics: 'Electronics & Home appliances',
      };

      const normalizedCategory = categoryNameMap[rawCategoryName] || rawCategoryName;

      const normalizePhone = (value) => {
        const digits = String(value || '').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
        if (digits.length === 10) return `+91${digits}`;
        return value;
      };

      const normalizedPhone = normalizePhone(primaryContact);
      const resolvedPrice =
        Number(
          categoryDetails?.price ??
          categoryDetails?.rent ??
          categoryDetails?.askingPrice ??
          categoryDetails?.rentAmount ??
          mobilePrice ??
          monthlyRent ??
          0,
        ) || 0;

      // 1) First upload all files to Cloudinary
      const uploadedUrls = [];
      if (uploadedImages && uploadedImages.length > 0) {
        // Import Cloudinary utility for secure configuration
        const { uploadToCloudinary } = await import('../services/cloudinaryConfig');
        
        for (const img of uploadedImages) {
          if (img.file) {
            try {
              const uploadedData = await uploadToCloudinary(img.file);
              uploadedUrls.push(uploadedData.url);
            } catch (error) {
              console.error('Failed to upload image:', error);
              // Continue with other images even if one fails
            }
          } else if (typeof img === "string") {
            uploadedUrls.push(img);
          } else if (img.url && !img.url.startsWith("blob:")) {
            uploadedUrls.push(img.url);
          }
        }
      }

      // Build the ad data payload
      const adData = {
        title: adTitleState.trim(),
        description: adDescriptionState.trim(),
        category: normalizedCategory,
        subCategory:
          categoryDetails?.subCategory ||
          categoryDetails?.listingType ||
          categoryDetails?.type ||
          categoryDetails?.tributeType ||
          (typeof selectedCategory === 'string'
            ? "General"
            : (selectedCategory?.subCategory || rawCategoryName || "General")),
        // Swap out dummy logic with our permanently uploaded Cloudinary URLs
        images: uploadedUrls,
        price: resolvedPrice,
        location: cities?.[0] || "India",
        city: cities?.[0] || "",
        cities: cities || [],
        primaryContact: normalizedPhone || "",
        userType: "Customer",
        contactInfo: {
          name: user?.name || "User", // Required by backend ContactInfoDto
          phone: normalizedPhone || "",
          email: user?.email || "",
          preferredContactMethod: "phone"
        },
        templateId: templateId || 1,
        selectedDates: selectedDates || [],
        negotiable: Boolean(categoryDetails?.negotiable),
        tags: [typeof selectedCategory === 'string' ? selectedCategory : selectedCategory?.name].filter(Boolean),
      };

      // Add category-specific data
      if (rawCategoryName === "Property" && propertyTypeRent) {
        adData.propertyData = { propertyType: propertyTypeRent, rent: monthlyRent };
      }
      if (rawCategoryName === "Mobiles" && mobilePrice) {
        adData.mobileData = { price: mobilePrice };
      }

      // Add any additional category details
      if (categoryDetails) {
        adData.categorySpecificData = categoryDetails;

        const categoryName = rawCategoryName;
        const categoryKeyMap = {
          Education: "educationData",
          Matrimonial: "matrimonialData",
          Vehicle: "vehicleData",
          Business: "businessData",
          Travel: "travelData",
          Astrology: "astrologyData",
          Property: "propertyData",
          "Public Notice": "publicNoticeData",
          "Lost & Found": "lostFoundData",
          Service: "serviceData",
          Personal: "personalData",
          Employment: "employmentData",
          Pets: "petsData",
          Mobiles: "mobileData",
          Electronics: "electronicsData",
          "Electronics & Home appliances": "electronicsData",
          Furniture: "furnitureData",
          "Greetings & Tributes": "greetingsData",
          Other: "otherData",
        };

        const categoryKey = categoryKeyMap[categoryName] || (categoryName?.toLowerCase()?.replace(/\s*&\s*/g, "").replace(/\s+/g, "") + "Data");

        adData[categoryKey] = categoryDetails;
      }

      await createAd(adData);
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/my-ads');
      }, 1200);
    } catch (error) {
      const status = error.status || error.data?.statusCode;
      // Token expired — clear session and redirect to login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        router.push('/login?redirect=/post-ad/form&reason=session_expired');
        return;
      }
      const errorMsg = error.data?.message || error.message;
      if (Array.isArray(errorMsg)) {
        setSubmitError(errorMsg.join(", "));
      } else {
        setSubmitError(errorMsg || "Failed to post ad. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 sticky top-20">

      {/* Live Preview */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <p className="text-xs text-[#157A4F] font-semibold mb-4 tracking-wide">
          LIVE PREVIEW
        </p>

        {/* Image Preview */}
        {templateId !== 3 && (
          <div className="rounded-2xl overflow-hidden bg-gray-200 h-48 flex items-center justify-center">
            {uploadedImages && uploadedImages.length > 0 ? (
              <img
                src={
                  templateId === 1 || !templateId
                    ? uploadedImages[carouselIndex]?.url
                    : uploadedImages[0]?.url
                }
                alt="preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-gray-400 text-sm">
                No image uploaded
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h4 className="font-semibold mt-4 text-gray-800 line-clamp-2">
          {adTitleState || "Your ad title will appear here"}
        </h4>

        {/* Price */}
        <p className="font-bold text-xl mt-2 text-[#157A4F]">
          {getPrice()}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
          {adDescriptionState || "Description will appear here..."}
        </p>

        {/* Locations */}
        {cities && cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {cities.map((city) => (
              <span
                key={city}
                className="px-2 py-1 text-xs bg-[#FFF3D6] text-gray-700 rounded-full"
              >
                {city}
              </span>
            ))}
          </div>
        )}

        {/* Category Badge */}
        {selectedCategory && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <span className="text-xs text-[#157A4F] font-medium">
              {selectedCategory.name || selectedCategory}
            </span>
          </div>
        )}
      </div>

      {/* Promotion & Pricing */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
        <h4 className="font-semibold text-lg text-gray-800">
          Promotion & Pricing
        </h4>

        {/* Featured Ad Checkbox */}
        <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#157A4F] cursor-pointer"
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm">Featured Ad</p>
              <p className="text-xs text-gray-600">Boost visibility for ₹100 extra</p>
            </div>
          </label>
        </div>

        <div className="space-y-3 text-sm">

          {/* Days Count */}
          <div className="flex justify-between">
            <span>Days ({daysCount})</span>
            <span className="font-medium">₹{daysCharge}</span>
          </div>

          {/* Featured Charge */}
          {isFeatured && (
            <div className="flex justify-between">
              <span>Featured Ad Charge</span>
              <span className="font-medium">₹{featuredCharge}</span>
            </div>
          )}

          {/* GST */}
          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span className="font-medium">₹{gst}</span>
          </div>

        </div>

        {/* Subtotal */}
        <div className="border-t pt-4 flex justify-between font-semibold text-gray-800">
          <span>Subtotal (Before GST)</span>
          <span className="text-[#157A4F]">
            ₹{subtotal}
          </span>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
          <span className="font-bold text-gray-800">Total Amount</span>
          <span className="font-bold text-2xl text-[#157A4F]">₹{total}</span>
        </div>

        {/* Error Message */}
        {submitError && (
          <p className="text-red-500 text-sm text-center">{submitError}</p>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-green-700 font-semibold">🎉 Ad posted successfully!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to My Ads...</p>
          </div>
        )}

        <button
          onClick={handlePostAd}
          disabled={isSubmitting || submitSuccess}
          className="w-full bg-[#157A4F] text-white py-3 rounded-xl hover:bg-[#0f5c3a] transition shadow-md font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Preparing..." : submitSuccess ? "✓ Posted!" : "Review & Post Ad"}
        </button>

        <button className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-medium">
          Save Draft
        </button>
      </div>
    </div>
  );
}