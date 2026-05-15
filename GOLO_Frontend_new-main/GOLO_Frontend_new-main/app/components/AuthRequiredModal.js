"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Mail, User, Phone, Eye, EyeOff, MapPin, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SocialButtons from "./SocialButtons";

export default function AuthRequiredModal({ isOpen, onClose, title = "Login Required", description = "Please log in or register to continue.", redirectTo = "/" }) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [storePassword, setStorePassword] = useState("");

  if (!isOpen) return null;

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetMessages();
    onClose?.();
  };

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const formatPhone = (value) => {
    if (!value) return undefined;
    const cleaned = String(value).replace(/\D/g, "");
    if (!cleaned) return undefined;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return String(value).startsWith("+") ? String(value) : `+${cleaned}`;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim() || !validateEmail(loginEmail)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!loginPassword.trim()) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(loginEmail.trim(), loginPassword, accountType);
      const loggedInUser = response?.data?.user;
      handleClose();
      if (accountType === "merchant" || loggedInUser?.accountType === "merchant") {
        router.push("/merchant/dashboard");
      } else if (loggedInUser?.role === "admin") {
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "/admin";
      } else {
        router.push(redirectTo || "/");
      }
    } catch (authError) {
      setError(authError?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (accountType === "merchant") {
      if (!storeName.trim()) {
        setError("Store name is required.");
        return;
      }
      if (!storeEmail.trim() || !validateEmail(storeEmail)) {
        setError("Please enter a valid store email.");
        return;
      }
      if (!storePassword.trim() || storePassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    } else {
      if (!registerName.trim()) {
        setError("Name is required.");
        return;
      }
      if (!registerEmail.trim() || !validateEmail(registerEmail)) {
        setError("Please enter a valid email.");
        return;
      }
      if (!registerPassword.trim() || registerPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await register(
        accountType === "merchant"
          ? {
            name: storeName.trim(),
            email: storeEmail.trim(),
            password: storePassword,
            phone: formatPhone(contactNumber),
            accountType: "merchant",
            storeName: storeName.trim(),
            storeEmail: storeEmail.trim(),
            gstNumber: gstNumber.trim() || undefined,
            contactNumber: formatPhone(contactNumber),
            storeLocation: storeLocation.trim() || undefined,
          }
          : {
            name: registerName.trim(),
            email: registerEmail.trim(),
            password: registerPassword,
            phone: formatPhone(registerPhone),
            accountType: "user",
          }
      );
      setSuccess("Registration successful. Please login.");
      setMode("login");
      setLoginEmail((accountType === "merchant" ? storeEmail : registerEmail).trim());
      setLoginPassword("");
    } catch (authError) {
      setError(authError?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          aria-label="Close auth prompt"
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#157A4F]/10 text-[#157A4F]">
          <Lock size={22} />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>

        <div className="mt-5 flex rounded-full bg-gray-50 p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => { setAccountType("user"); resetMessages(); }}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${accountType === "user" ? "bg-[#F5B849] text-white" : "text-gray-600"}`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => { setAccountType("merchant"); resetMessages(); }}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${accountType === "merchant" ? "bg-[#F5B849] text-white" : "text-gray-600"}`}
          >
            Merchant
          </button>
        </div>

        <div className="mt-5">
          <SocialButtons redirectPath={redirectTo || "/"} />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {error && <p className="mb-3 text-sm text-red-600 text-center">{error}</p>}
        {success && <p className="mb-3 text-sm text-[#157A4F] text-center">{success}</p>}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                <Mail size={16} className="text-gray-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={accountType === "merchant" ? "Enter store email" : "Enter your email"}
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                <Lock size={16} className="text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-sm outline-none"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#157A4F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f5c3a] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); resetMessages(); }}
                className="font-semibold text-[#157A4F] hover:underline"
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {accountType === "merchant" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Store Name</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <User size={16} className="text-gray-400" />
                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Enter store name" className="w-full text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Store Email</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Mail size={16} className="text-gray-400" />
                    <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder="Enter store email" className="w-full text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">GST Number</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <FileText size={16} className="text-gray-400" />
                    <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="Enter GST number" className="w-full text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Number</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Phone size={16} className="text-gray-400" />
                    <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter contact number" className="w-full text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Store Location</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <MapPin size={16} className="text-gray-400" />
                    <input type="text" value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="Enter store location" className="w-full text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Lock size={16} className="text-gray-400" />
                    <input type={showPassword ? "text" : "password"} value={storePassword} onChange={(e) => setStorePassword(e.target.value)} placeholder="Create password" className="w-full text-sm outline-none" />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-gray-400 hover:text-gray-600">
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <User size={16} className="text-gray-400" />
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Mail size={16} className="text-gray-400" />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone (optional)</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="Enter your phone"
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2">
                    <Lock size={16} className="text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full text-sm outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-gray-400 hover:text-gray-600">
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#157A4F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f5c3a] disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); resetMessages(); }}
                className="font-semibold text-[#157A4F] hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}