"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, sendPasswordChangeOTP, verifyPasswordChangeOTP, changePasswordWithOTP } from "../../lib/api";

export default function EditProfilePage() {
  const { user, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const getMaskedEmail = (email) => {
    if (!email || !email.includes("@")) return "your registered email";
    const [localPart, domainPart] = email.split("@");
    const firstChar = localPart?.[0] || "*";
    return `${firstChar}***@${domainPart}`;
  };

  // Tabs
  const [activeTab, setActiveTab] = useState("profile"); // profile or password

  // Profile Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Password State
  const [passwordState, setPasswordState] = useState({
    step: "request", // request, verify, change
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.profile?.phone || "",
      });
    }
  }, [user]);

  // Timer for OTP
  useEffect(() => {
    let interval;
    if (timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 4000);
  };

  // PROFILE SECTION
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      showMessage("error", "All fields are required");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage("error", "Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Validate phone length
    if (formData.phone.trim().length < 10) {
      showMessage("error", "Phone number must be at least 10 digits");
      setLoading(false);
      return;
    }

    try {
      console.log('Updating profile with:', { 
        name: formData.name,
        email: formData.email,
        phone: formData.phone 
      });
      
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        profile: { phone: formData.phone },
      });

      console.log('Update response:', response);

      if (response.success) {
        showMessage("success", "Profile updated successfully!");
        await refreshProfile();
      } else {
        showMessage("error", response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMsg = error.data?.message || error.message || "Failed to update profile";
      showMessage("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD SECTION
  const handleRequestOTP = async (e) => {
    e.preventDefault();

    setLoading(true);
    setPasswordChanged(false);

    try {
      console.log('Requesting OTP...');
      const response = await sendPasswordChangeOTP();
      console.log('OTP Response:', response);
      
      if (response.success) {
        setOtpSent(true);
        setPasswordState((prev) => ({ ...prev, step: "verify" }));
        setTimerSeconds(300); // 5 minutes
        showMessage("success", `OTP sent to ${getMaskedEmail(formData.email || user?.email)}`);
      } else {
        showMessage("error", response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error('OTP Error Details:', error);
      const errorMsg = error.data?.message || error.message || "Failed to send OTP. Please check your registered email.";
      showMessage("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!passwordState.otp.trim() || passwordState.otp.length !== 6) {
      showMessage("error", "Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      const response = await verifyPasswordChangeOTP(passwordState.otp);
      if (response.success) {
        setPasswordState((prev) => ({ ...prev, step: "change" }));
        showMessage("success", "OTP verified!");
      } else {
        showMessage("error", response.message || "Invalid OTP");
      }
    } catch (error) {
      showMessage("error", error.data?.message || error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!passwordState.newPassword || passwordState.newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      showMessage("error", "Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await changePasswordWithOTP(
        passwordState.otp,
        passwordState.newPassword
      );
      if (response.success) {
        setPasswordChanged(true);
        showMessage("success", "Password changed successfully!");
        // Reset password form
        setPasswordState({
          step: "request",
          newPassword: "",
          confirmPassword: "",
          otp: "",
        });
        setOtpSent(false);
        setTimerSeconds(0);
      } else {
        showMessage("error", response.message || "Failed to change password");
      }
    } catch (error) {
      showMessage("error", error.data?.message || error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-[#157A4F] font-semibold text-sm hover:underline flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your profile and security</p>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl border font-semibold ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.type === "success" ? "✓ " : "✗ "}
              {message.text}
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                  activeTab === "profile"
                    ? "bg-white text-[#157A4F] border-b-2 border-[#157A4F]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                👤 Profile Information
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                  activeTab === "password"
                    ? "bg-white text-[#157A4F] border-b-2 border-[#157A4F]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🔒 Change Password
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <p className="text-gray-600 text-sm">
                    Update your personal information below. Changes are saved immediately.
                  </p>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent transition"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent transition"
                        placeholder="Enter your email"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent transition"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#157A4F] text-white py-3 rounded-xl font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              )}

              {/* PASSWORD TAB */}
              {activeTab === "password" && (
                <div className="space-y-6">
                  <p className="text-gray-600 text-sm">
                    To change your password, we'll verify your identity by sending an OTP to your registered email address.
                  </p>

                  {passwordChanged && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-semibold text-sm">
                      ✓ Password updated successfully.
                    </div>
                  )}

                  {/* STEP 1: Request OTP */}
                  {passwordState.step === "request" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#157A4F] text-white rounded-full flex items-center justify-center font-bold text-lg">
                            1
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Request OTP</h3>
                            <p className="text-gray-700 text-sm mb-4">
                              Click below to send a verification code to your email.
                            </p>
                            <button
                              type="button"
                              onClick={handleRequestOTP}
                              disabled={loading}
                              className="bg-[#157A4F] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {loading ? "Sending..." : "Send OTP"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Verify OTP */}
                  {passwordState.step === "verify" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#157A4F] text-white rounded-full flex items-center justify-center font-bold text-lg">
                            2
                          </div>
                          <div className="flex-1 w-full">
                            <h3 className="font-semibold text-gray-900 mb-2">Verify OTP</h3>
                            <p className="text-gray-700 text-sm mb-4">
                              Enter the 6-digit code sent to your email.
                              <br />
                              <span className="text-[#157A4F] font-semibold">
                                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}
                              </span>
                            </p>

                            {otpSent && (
                              <p className="text-xs text-gray-600 mb-3">
                                OTP sent to <span className="font-semibold text-[#157A4F]">{getMaskedEmail(formData.email || user?.email)}</span>
                              </p>
                            )}

                            <input
                              type="text"
                              maxLength="6"
                              value={passwordState.otp}
                              onChange={(e) =>
                                setPasswordState((prev) => ({
                                  ...prev,
                                  otp: e.target.value.replace(/[^0-9]/g, ""),
                                }))
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold text-2xl text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent mb-4"
                              placeholder="000000"
                            />

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleVerifyOTP}
                                disabled={loading || passwordState.otp.length !== 6}
                                className="flex-1 bg-[#157A4F] text-white py-2 rounded-lg font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {loading ? "Verifying..." : "Verify OTP"}
                              </button>
                              <button
                                type="button"
                                onClick={handleRequestOTP}
                                disabled={loading || timerSeconds > 0}
                                className="flex-1 border border-[#157A4F] text-[#157A4F] py-2 rounded-lg font-semibold hover:bg-green-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {timerSeconds > 0 ? `Resend (${timerSeconds}s)` : "Resend"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Set New Password */}
                  {passwordState.step === "change" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#157A4F] text-white rounded-full flex items-center justify-center font-bold text-lg">
                            3
                          </div>
                          <div className="flex-1 w-full">
                            <h3 className="font-semibold text-gray-900 mb-4">Set New Password</h3>

                            {/* New Password */}
                            <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={passwordState.newPassword}
                                  onChange={(e) =>
                                    setPasswordState((prev) => ({
                                      ...prev,
                                      newPassword: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent"
                                  placeholder="Min 8 characters"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700"
                                >
                                  {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={passwordState.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordState((prev) => ({
                                      ...prev,
                                      confirmPassword: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-transparent"
                                  placeholder="Confirm password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-4 top-3.5 text-gray-500 hover:text-gray-700"
                                >
                                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                              </div>
                            </div>

                            {/* Change Button */}
                            <button
                              type="button"
                              onClick={handleChangePassword}
                              disabled={loading}
                              className="w-full bg-[#157A4F] text-white py-3 rounded-lg font-semibold hover:bg-[#0f5c3a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {loading ? "Changing Password..." : "Change Password"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
