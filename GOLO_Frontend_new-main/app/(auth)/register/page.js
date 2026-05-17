"use client";

import AuthLayout from "./../../components/AuthLayout";
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import SocialButtons from "../../components/SocialButtons";
import LocationPicker from "../../components/LocationPicker";
import StoreLocationMap from "../../components/StoreLocationMap";

const MERCHANT_CATEGORIES = [
  {
    name: "Food & Restaurants",
    subcategories: ["Restaurants", "Cafes", "Cloud Kitchens", "Food Delivery Menus"],
    description: "Restaurants, cafes, cloud kitchens, and delivery menus",
  },
  {
    name: "Home Services",
    subcategories: ["Cleaning", "Plumbing", "Electrical", "Appliance Repair", "Maintenance"],
    description: "Cleaning, plumbing, electrical, repair, and upkeep",
  },
  {
    name: "Beauty & Wellness",
    subcategories: ["Salon", "Spa", "Grooming", "Personal Care Services"],
    description: "Salon, spa, grooming, and personal care services",
  },
  {
    name: "Healthcare & Medical",
    subcategories: ["Hospitals", "Clinics", "Pharmacies", "Diagnostics"],
    description: "Hospitals, clinics, pharmacies, and diagnostics",
  },
  {
    name: "Hotels & Accommodation",
    subcategories: ["Hotels", "Lodges", "Stays", "Room Bookings"],
    description: "Hotels, lodges, stays, and room bookings",
  },
  {
    name: "Shopping & Retail",
    subcategories: ["Local Shops", "Groceries", "Fashion", "Electronics", "Products"],
    description: "Local shops, groceries, fashion, electronics, and products",
  },
  {
    name: "Education & Training",
    subcategories: ["Schools", "Coaching", "Institutes", "Skill Development"],
    description: "Schools, coaching, institutes, and skill development",
  },
  {
    name: "Real Estate",
    subcategories: ["Property Buying", "Property Selling", "Renting"],
    description: "Property buying, selling, and renting",
  },
  {
    name: "Events & Entertainment",
    subcategories: ["Event Planners", "Photographers", "DJs", "Venues"],
    description: "Event planners, photographers, DJs, and venues",
  },
  {
    name: "Professional Services",
    subcategories: ["Legal", "CA", "Consulting", "Freelance Services"],
    description: "Legal, CA, consulting, and freelance services",
  },
  {
    name: "Automotive Services",
    subcategories: ["Car Repair", "Bike Repair", "Servicing", "Rentals"],
    description: "Car and bike repair, servicing, and rentals",
  },
  {
    name: "Home Improvement",
    subcategories: ["Interior Design", "Painting", "Carpentry", "Renovation"],
    description: "Interior design, painting, carpentry, and renovation",
  },
  {
    name: "Fitness & Sports",
    subcategories: ["Gyms", "Yoga", "Personal Trainers", "Sports Facilities"],
    description: "Gyms, yoga, personal trainers, and sports facilities",
  },
  {
    name: "Daily Needs & Utilities",
    subcategories: ["Laundry", "Water Supply", "Gas", "Essential Services"],
    description: "Laundry, water supply, gas, and essential services",
  },
  {
    name: "Local Businesses & Vendors",
    subcategories: ["General Business Listings", "B2B", "B2C", "Marketplace/IndiaMART Style"],
    description: "General business listings and marketplace-style vendors",
  },
];

export default function RegisterPage() {
  const quotes = [
    "Maximize your ROI with our AI-driven ad placement strategy.",
    "Real-time analytics that give you the edge over competitors.",
    "The simplest way to manage global ad campaigns in one place."
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [accountType, setAccountType] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Merchant form fields
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [storeSubCategory, setStoreSubCategory] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [storeCoordinates, setStoreCoordinates] = useState({
    latitude: null,
    longitude: null,
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [storePassword, setStorePassword] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const subCategoryDropdownRef = useRef(null);

  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const selectedCategory = MERCHANT_CATEGORIES.find((category) => category.name === storeCategory);
  const availableSubcategories = selectedCategory?.subcategories || [];
  const categoryLabel = useMemo(() => {
    if (!storeCategory) return "Select category";
    return storeCategory;
  }, [storeCategory]);
  const subCategoryLabel = useMemo(() => {
    if (!storeCategory) return "Select category first";
    if (!storeSubCategory) return "Select sub category";
    return storeSubCategory;
  }, [storeCategory, storeSubCategory]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(target)) {
        setIsSubCategoryOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
        setIsSubCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate based on account type
    if (accountType === "user") {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Name, email, and password are required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    } else {
      const hasValidCoordinates =
        typeof storeCoordinates.latitude === "number" &&
        !Number.isNaN(storeCoordinates.latitude) &&
        typeof storeCoordinates.longitude === "number" &&
        !Number.isNaN(storeCoordinates.longitude);

      if (!storeName.trim() || !storeEmail.trim() || !storeCategory || !storeSubCategory || !storePassword.trim()) {
        setError("Store name, email, category, sub category, and password are required.");
        return;
      }
      if (!storeLocation.trim() || !hasValidCoordinates) {
        setError("Please select your store location from the map.");
        return;
      }
      if (storePassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Helper to format phone number to E.164 (satisfy backend IsPhoneNumber)
      const formatPhone = (p) => {
        if (!p) return undefined;
        let cleaned = p.replace(/\D/g, ''); // Remove non-digits
        if (cleaned.length === 10) return `+91${cleaned}`; // Default to India 
        return p.startsWith('+') ? p : `+${cleaned}`; // Ensure it starts with +
      };

      const registrationData = accountType === "user"
        ? {
          name,
          email,
          password,
          phone: formatPhone(phone),
          accountType: "user",
        }
        : {
          name: storeName,
          email: storeEmail,
          password: storePassword,
          phone: formatPhone(contactNumber),
          accountType: "merchant",
          storeName,
          storeEmail,
          storeCategory,
          storeSubCategory,
          contactNumber: formatPhone(contactNumber),
          storeLocation,
          storeLocationLatitude: storeCoordinates.latitude,
          storeLocationLongitude: storeCoordinates.longitude,
        };

      await register(registrationData);
      if (accountType === "user" && typeof window !== "undefined") {
        localStorage.setItem("golo_pending_first_login_email", email.trim().toLowerCase());
      }
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (err.data?.message?.includes("phone")) {
        setError("Invalid phone number format. Please include country code (e.g., +91).");
      } else {
        setError(
          err.data?.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerchantLocationSelect = (location) => {
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    if (!hasValidCoordinates) {
      setError("Could not capture valid coordinates. Please try again.");
      return;
    }

    setStoreLocation(location?.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setStoreCoordinates({ latitude, longitude });
    setError("");
  };

  return (
    <AuthLayout>
      <div className="login-page-wrapper">
        {/* Logo Section */}
        <div className="logo-container">
          <div className="logo-icon-wrapper">
            <div className="logo-dot green"></div>
            <div className="logo-dot red"></div>
            <div className="logo-dot yellow"></div>
          </div>
          <span className="logo-text">GOLO</span>
        </div>

        <div className="login-content-grid">
          {/* LEFT SIDE */}
          <div className="login-left">
            <div className="testimonial-section">
              <div className="quote-mark">&ldquo;</div>
              <div className="yellow-square-icon">G</div>

              <div className="quote-container">
                <p className="quote-text" key={currentIndex}>
                  {quotes[currentIndex]}
                </p>
              </div>

              <div className="pagination-dots">
                <span
                  className="chevron"
                  onClick={() =>
                    setCurrentIndex(
                      (currentIndex - 1 + quotes.length) % quotes.length
                    )
                  }
                >
                  ‹
                </span>
                {quotes.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${currentIndex === index ? "active" : ""
                      }`}
                    onClick={() => setCurrentIndex(index)}
                  ></span>
                ))}
                <span
                  className="chevron"
                  onClick={() =>
                    setCurrentIndex((currentIndex + 1) % quotes.length)
                  }
                >
                  ›
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="login-right">
            <div className="card-bg-decoration top"></div>
            <div className="card-bg-decoration bottom"></div>

            <div className="login-card">
              <h2>
                {accountType === "user"
                  ? "Join GOLO Network Group"
                  : "Register Your Store"}
              </h2>

              <p className="subtitle">
                {accountType === "user"
                  ? "Grow Smarter With Every Ad. Join Free"
                  : "Expand Your Business With GOLO"}
              </p>

              {/* TOGGLE */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "25px"
                }}
              >
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    background: "#F3F4F6",
                    borderRadius: "999px",
                    padding: "4px",
                    width: "100%",
                    maxWidth: "300px"
                  }}
                >
                  {/* Sliding Background */}
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: accountType === "user" ? "4px" : "50%",
                      width: "calc(50% - 4px)",
                      height: "calc(100% - 8px)",
                      background: "#F59E0B",
                      borderRadius: "999px",
                      transition: "all 0.3s ease"
                    }}
                  ></div>

                  <div
                    onClick={() => setAccountType("user")}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      zIndex: 1,
                      color:
                        accountType === "user" ? "#fff" : "#6B7280"
                    }}
                  >
                    User
                  </div>

                  <div
                    onClick={() => setAccountType("merchant")}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      zIndex: 1,
                      color:
                        accountType === "merchant" ? "#fff" : "#6B7280"
                    }}
                  >
                    Merchant
                  </div>
                </div>
              </div>

              {/* Social Buttons */}
              <SocialButtons redirectPath="/" />
              <div className="divider">
                <span>
                  {accountType === "user"
                    ? "or sign up with"
                    : "Store Information"}
                </span>
              </div>

              <form onSubmit={handleRegister}>
                {/* Error / Success Messages */}
                {error && (
                  <p style={{ color: "red", fontSize: "13px", marginBottom: "15px", textAlign: "center" }}>
                    {error}
                  </p>
                )}
                {success && (
                  <p style={{ color: "#157A4F", fontSize: "13px", marginBottom: "15px", textAlign: "center" }}>
                    {success}
                  </p>
                )}

                {/* FORM SWITCH */}
                {accountType === "user" ? (
                  <>
                    <div className="input-group">
                      <label>Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => { setName(e.target.value); setError(""); }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Email</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Number</label>
                      <div className="input-wrapper">
                        <Phone className="input-icon" size={18} />
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Create Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        />
                        <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                          {showPassword ? <Eye className="input-icon-right" size={18} /> : <EyeOff className="input-icon-right" size={18} />}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Store Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input
                          type="text"
                          placeholder="Enter store name"
                          value={storeName}
                          onChange={(e) => { setStoreName(e.target.value); setError(""); }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Email</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input
                          type="email"
                          placeholder="Enter store email"
                          value={storeEmail}
                          onChange={(e) => { setStoreEmail(e.target.value); setError(""); }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Category</label>
                      <div className="input-wrapper dropdown-shell" ref={categoryDropdownRef}>
                        <button
                          type="button"
                          className={`dropdown-trigger ${storeCategory ? "has-value" : "is-placeholder"}`}
                          onClick={() => {
                            setIsCategoryOpen((open) => !open);
                            setIsSubCategoryOpen(false);
                          }}
                          aria-expanded={isCategoryOpen}
                          aria-haspopup="listbox"
                        >
                          <User className="input-icon" size={18} />
                          <span className="dropdown-trigger-text">{categoryLabel}</span>
                          <ChevronDown size={16} className={`dropdown-trigger-icon ${isCategoryOpen ? "open" : ""}`} />
                        </button>
                        {isCategoryOpen && (
                          <div className="dropdown-panel dropdown-panel-category" role="listbox">
                            {MERCHANT_CATEGORIES.map((category) => {
                              const active = storeCategory === category.name;
                              return (
                                <button
                                  key={category.name}
                                  type="button"
                                  className={`dropdown-option dropdown-option-card ${active ? "active" : ""}`}
                                  onClick={() => {
                                    setStoreCategory(category.name);
                                    setStoreSubCategory("");
                                    setError("");
                                    setIsCategoryOpen(false);
                                    setIsSubCategoryOpen(false);
                                  }}
                                  role="option"
                                  aria-selected={active}
                                >
                                  <div className="dropdown-option-copy">
                                    <div className="dropdown-option-title-row">
                                      <span className="dropdown-option-title">{category.name}</span>
                                      {active && <Check size={14} className="dropdown-option-check" />}
                                    </div>
                                    <span className="dropdown-option-description">{category.description}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Sub Category</label>
                      <div className="input-wrapper dropdown-shell" ref={subCategoryDropdownRef}>
                        <button
                          type="button"
                          className={`dropdown-trigger ${storeSubCategory ? "has-value" : "is-placeholder"}`}
                          onClick={() => {
                            if (!storeCategory) return;
                            setIsSubCategoryOpen((open) => !open);
                            setIsCategoryOpen(false);
                          }}
                          aria-expanded={isSubCategoryOpen}
                          aria-haspopup="listbox"
                          disabled={!storeCategory}
                        >
                          <User className="input-icon" size={18} />
                          <span className="dropdown-trigger-text">{subCategoryLabel}</span>
                          <ChevronDown size={16} className={`dropdown-trigger-icon ${isSubCategoryOpen ? "open" : ""}`} />
                        </button>
                        {isSubCategoryOpen && storeCategory && (
                          <div className="dropdown-panel dropdown-panel-category" role="listbox">
                            {availableSubcategories.map((subCategory) => {
                              const active = storeSubCategory === subCategory;
                              return (
                                <button
                                  key={subCategory}
                                  type="button"
                                  className={`dropdown-option dropdown-option-card ${active ? "active" : ""}`}
                                  onClick={() => {
                                    setStoreSubCategory(subCategory);
                                    setError("");
                                    setIsSubCategoryOpen(false);
                                  }}
                                  role="option"
                                  aria-selected={active}
                                >
                                  <div className="dropdown-option-copy">
                                    <div className="dropdown-option-title-row">
                                      <span className="dropdown-option-title">{subCategory}</span>
                                      {active && <Check size={14} className="dropdown-option-check" />}
                                    </div>
                                    <span className="dropdown-option-description">
                                      Available under {storeCategory}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Number</label>
                      <div className="input-wrapper">
                        <Phone className="input-icon" size={18} />
                        <input
                          type="tel"
                          placeholder="Enter contact number"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Location</label>
                      <div className="input-wrapper">
                        <MapPin className="input-icon" size={18} />
                        <input
                          type="text"
                          placeholder="Select store location from map"
                          value={storeLocation}
                          readOnly
                        >
                        </input>
                      </div>
                      <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setShowLocationPicker(true)}
                          style={{
                            border: "1px solid #157A4F",
                            background: "#157A4F",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            padding: "7px 10px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Pick on Map
                        </button>
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <StoreLocationMap
                          location={
                            typeof storeCoordinates.latitude === "number" &&
                            typeof storeCoordinates.longitude === "number"
                              ? {
                                  latitude: storeCoordinates.latitude,
                                  longitude: storeCoordinates.longitude,
                                  address: storeLocation,
                                }
                              : null
                          }
                          onMapClick={() => setShowLocationPicker(true)}
                          isLoading={false}
                        />
                      </div>
                      <p style={{ marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                        This location will be used to show your offers in nearby deals.
                      </p>
                    </div>

                    <div className="input-group">
                      <label>Create Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={storePassword}
                          onChange={(e) => { setStorePassword(e.target.value); setError(""); }}
                        />
                        <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                          {showPassword ? <Eye className="input-icon-right" size={18} /> : <EyeOff className="input-icon-right" size={18} />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="terms-checkbox">
                  <input type="checkbox" id="terms" />
                  <label htmlFor="terms">
                    By clicking on &quot;Continue&quot;, I agree{" "}
                    <span className="link">Terms</span> and{" "}
                    <span className="link">Privacy Policy</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="continue-btn"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                >
                  {isLoading ? "Creating account..." : "Continue"}
                </button>
              </form>

              <div className="register-footer">
                Already have an account?{" "}
                <Link href="/login">
                  <span style={{ cursor: "pointer" }}>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="dot-pattern"></div>
      </div>
      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleMerchantLocationSelect}
        initialLocation={
          typeof storeCoordinates.latitude === "number" &&
          typeof storeCoordinates.longitude === "number"
            ? { lat: storeCoordinates.latitude, lng: storeCoordinates.longitude }
            : undefined
        }
      />
    </AuthLayout>
  );
}
