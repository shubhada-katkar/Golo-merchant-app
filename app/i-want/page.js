"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { saveIWantPreference } from "../lib/api";

export default function IWant() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [images, setImages] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Select a category");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Redirect merchants away from user pages
  useEffect(() => {
    if (!loading && user && user.accountType === "merchant") {
      router.replace("/merchant/dashboard");
    }
  }, [user, loading, router]);

  const categories = [
    "Education",
    "Matrimonial",
    "Vehicle - Rent",
    "Vehicle - Sell",
    "Business - Promotion",
    "Travel",
    "Astrology",
    "Property - Rent",
    "Property - Sell",
    "Public Notice",
    "Lost & Found",
    "Service",
    "Personal",
    "Employment",
    "Pets",
    "Mobiles",
    "Electronics & Home Appliances",
    "Furniture",
    "Greetings & Tributes",
    "Other",
  ];

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const imagePreviews = fileArray.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setImages((prev) => [...prev, ...imagePreviews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const normalizeCategory = (value) => {
    if (!value || value === "Select a category") return "";
    const normalized = String(value)
      .replace("Home Appliances", "Home appliances")
      .replace(" - ", "|");
    return normalized;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    const category = normalizeCategory(selectedCategory);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!category) {
      setSubmitError("Please select a category.");
      return;
    }

    if (!trimmedTitle && !trimmedDescription) {
      setSubmitError("Please add title or description.");
      return;
    }

    const payload = {
      category,
      title: trimmedTitle,
      description: trimmedDescription,
    };

    try {
      await saveIWantPreference(payload);
      setSubmitSuccess("Your requirement was saved. We will show related deals in Recommended section.");
      setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (error) {
      if (error?.status === 401) {
        setSubmitError("Please login first to save your preference.");
        router.push("/login?redirect=/i-want");
        return;
      }
      setSubmitError("Could not save your requirement. Please try again.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#F8F6F2] py-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-lg border border-gray-100">

            <h1 className="text-4xl font-bold text-[#157A4F] mb-3">
              Post Your Requirement
            </h1>

            <p className="text-gray-600 mb-10 text-lg">
              Reach thousands of potential buyers by providing clear details about your offering.
            </p>

            {/* CUSTOM CATEGORY DROPDOWN */}
            <div className="mb-6 relative" ref={dropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                LISTING CATEGORY
              </label>

              {/* Trigger */}
              <div
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="w-full p-4 rounded-xl border border-gray-300 bg-white cursor-pointer flex justify-between items-center hover:border-[#157A4F] transition"
              >
                <span className="text-gray-700">{selectedCategory}</span>
                <span className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>

              {/* Dropdown Menu */}
              {categoryOpen && (
                <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50 animate-fadeIn">
                  {categories.map((cat, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategoryOpen(false);
                      }}
                      className="px-4 py-3 hover:bg-[#F8F6F2] cursor-pointer text-sm"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                AD TITLE
              </label>
              <input
                type="text"
                placeholder="e.g., MacBook Pro M3 Max - Barely Used"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-300 focus:border-[#157A4F] focus:ring-2 focus:ring-[#157A4F]/20 outline-none transition"
              />
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                DETAILED DESCRIPTION
              </label>
              <textarea
                rows="6"
                placeholder="Describe what you're offering..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-300 focus:border-[#157A4F] focus:ring-2 focus:ring-[#157A4F]/20 outline-none transition"
              />
            </div>

            {submitError && <p className="text-sm text-red-600 mb-4">{submitError}</p>}
            {submitSuccess && <p className="text-sm text-[#157A4F] mb-4">{submitSuccess}</p>}

            {/* Drag & Drop Upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#157A4F] bg-[#F8F6F2] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#f3f1ea] transition"
              onClick={() => fileInputRef.current.click()}
            >
              <p className="text-[#157A4F] font-semibold text-lg">
                Drag & Drop Images Here
              </p>
              <p className="text-sm text-gray-500 mt-2">
                or click to upload (Multiple images allowed)
              </p>

              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden border"
                  >
                    <img
                      src={img.preview}
                      alt="preview"
                      className="h-32 w-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-10">
              <button className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition font-medium">
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 rounded-xl bg-[#157A4F] text-white font-semibold shadow-md hover:shadow-lg hover:bg-[#12663F] transition duration-300"
              >
                Save & Continue
              </button>
            </div>

          </div>

          {/* RIGHT SIDE */}
<div className="space-y-8">

  {/* Modern Pro Tips Card */}
  <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
    <h4 className="text-xl font-bold text-[#157A4F] mb-6 flex items-center gap-2">
      🚀 Pro Listing Tips
    </h4>

    <div className="space-y-4 text-sm text-gray-700">
      <div className="flex gap-3">
        <span className="text-[#157A4F] text-lg">✔</span>
        <p><strong>Be Specific:</strong> Clear details increase buyer trust.</p>
      </div>

      <div className="flex gap-3">
        <span className="text-[#157A4F] text-lg">✔</span>
        <p><strong>Add 3+ Images:</strong> Listings with photos get 5x more views.</p>
      </div>

      <div className="flex gap-3">
        <span className="text-[#157A4F] text-lg">✔</span>
        <p><strong>Use Keywords:</strong> Helps your listing appear in searches.</p>
      </div>

      <div className="flex gap-3">
        <span className="text-[#157A4F] text-lg">✔</span>
        <p><strong>Set Fair Price:</strong> Competitive pricing gets faster responses.</p>
      </div>

      <div className="flex gap-3">
        <span className="text-[#157A4F] text-lg">✔</span>
        <p><strong>Respond Quickly:</strong> Active listings rank higher.</p>
      </div>
    </div>
  </div>

  {/* Performance Stats Card */}
  <div className="bg-gradient-to-br from-[#157A4F] to-[#0f5c3b] text-white p-8 rounded-3xl shadow-lg">
    <h4 className="text-xl font-bold mb-6">
      📊 Why Listings Perform Better Here
    </h4>

    <div className="space-y-4 text-sm">
      <div>
        <p className="text-2xl font-bold">5X</p>
        <p className="opacity-90">More visibility with images</p>
      </div>

      <div>
        <p className="text-2xl font-bold">80%</p>
        <p className="opacity-90">Faster responses within 24 hours</p>
      </div>

      <div>
        <p className="text-2xl font-bold">Thousands</p>
        <p className="opacity-90">Active daily users browsing listings</p>
      </div>
    </div>
  </div>

  {/* Trust & Safety Card */}
  <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
    <h4 className="text-xl font-bold text-[#157A4F] mb-4">
      🔒 Safe & Trusted Platform
    </h4>

    <p className="text-sm text-gray-600 mb-4">
      We ensure verified listings and secure interactions so you can post with confidence.
    </p>

    <ul className="space-y-2 text-sm text-gray-700">
      <li>• Verified user accounts</li>
      <li>• Spam & fraud protection</li>
      <li>• Easy listing management</li>
      <li>• 24/7 platform monitoring</li>
    </ul>
  </div>

</div>

        </div>
      </div>

      <Footer />
    </>
  );
}
