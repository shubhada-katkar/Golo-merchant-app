"use client";

import AuthLayout from "./../../components/AuthLayout";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import SocialButtons from "../../components/SocialButtons";

export default function LoginPage() {
  const quotes = [
    "Maximize your ROI with our AI-driven ad placement strategy.",
    "Real-time analytics that give you the edge over competitors.",
    "The simplest way to manage global ad campaigns in one place."
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState("user");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);

  const shouldGoToGolocalOnboarding = (targetEmail, userAccountType) => {
    if (typeof window === "undefined") return false;
    if (userAccountType !== "user") return false;

    const normalizedEmail = String(targetEmail || "").trim().toLowerCase();
    if (!normalizedEmail) return false;

    const pendingEmail = localStorage.getItem("golo_pending_first_login_email");
    const doneKey = `golo_golocal_onboarding_done_email_${normalizedEmail}`;

    return pendingEmail === normalizedEmail && localStorage.getItem(doneKey) !== "1";
  };

  // Handle redirect param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get("reason");
      if (reason === "session_expired") setSessionExpired(true);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const effectiveEmail = user?.email || email;
      const effectiveType = user?.accountType || accountType;
      if (shouldGoToGolocalOnboarding(effectiveEmail, effectiveType)) {
        router.push("/golocal/onboarding");
        return;
      }

      if (effectiveType === "merchant") {
        router.push("/merchant/dashboard");
        return;
      }

      router.push("/");
    }
  }, [isAuthenticated, user, router, email, accountType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleForgotPassword = () => {
    if (validateEmail()) {
      router.push("/check-email");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!validateEmail()) return;
    if (!password.trim()) {
      setLoginError("Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email, password, accountType);
      const loggedInUser = response?.data?.user;

      if (shouldGoToGolocalOnboarding(loggedInUser?.email || email, loggedInUser?.accountType || accountType)) {
        router.push("/golocal/onboarding");
        return;
      }

      if ((loggedInUser?.accountType || accountType) === "merchant") {
        router.push("/merchant/dashboard");
        return;
      }

      router.push("/");
    } catch (error) {
      const errorMsg = error.data?.message || "Login failed. Please check your credentials.";
      setLoginError("");
      
      if (errorMsg.includes("merchant") || errorMsg.includes("Merchant")) {
        setPopupMessage(errorMsg);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      } else if (errorMsg.includes("user") || errorMsg.includes("User")) {
        setPopupMessage(errorMsg);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      } else {
        setLoginError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-bounce-in">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-gray-800">Account Type Mismatch</h3>
            <p className="mb-4 text-center text-sm text-gray-600">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full rounded-lg bg-[#157A4F] py-2 text-sm font-semibold text-white transition hover:bg-[#145a3f]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
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
                    className={`dot ${currentIndex === index ? "active" : ""}`}
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
                  ? "Welcome to GOLO Network Group"
                  : "Merchant Portal Login"}
              </h2>

              <p className="subtitle">
                {accountType === "user"
                  ? "Grow Smarter With Every Ad. Join Free"
                  : "Manage Your Store & Campaigns"}
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
                <span>or sign in with</span>
              </div>

              <form onSubmit={handleLogin}>
                {/* Session Expired Banner */}
                {sessionExpired && (
                  <p style={{
                    color: "#92400E", background: "#FEF3C7", border: "1px solid #F59E0B",
                    borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
                    marginBottom: "15px", textAlign: "center"
                  }}>
                    ⚠️ Your session expired. Please log in again to continue.
                  </p>
                )}
                {/* Login Error */}
                {loginError && (
                  <p style={{ color: "red", fontSize: "13px", marginBottom: "15px", textAlign: "center" }}>
                    {loginError}
                  </p>
                )}

                {/* Email */}
                <div className="input-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      placeholder={
                        accountType === "user"
                          ? "Enter your email"
                          : "Enter store email"
                      }
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                        setLoginError("");
                      }}
                    />
                  </div>

                  {emailError && (
                    <p style={{ color: "red", fontSize: "13px", marginTop: "5px" }}>
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError("");
                      }}
                    />
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    >
                      {showPassword ? (
                        <Eye className="input-icon-right" size={18} />
                      ) : (
                        <EyeOff className="input-icon-right" size={18} />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="forgot-link"
                  onClick={handleForgotPassword}
                  style={{ cursor: "pointer" }}
                >
                  Forgot Password ?
                </div>

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
                  {isLoading ? "Signing in..." : "Continue"}
                </button>
              </form>

              <div className="register-footer">
                New to Ad Network Group?{" "}
                <Link href="/register">
                  <span>Register Now</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="dot-pattern"></div>
      </div>
    </AuthLayout>
    </>
  );
}