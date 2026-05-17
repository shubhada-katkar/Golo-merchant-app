"use client";
import { useRef, useState, useEffect } from "react";
import AuthLayout from "./../../components/AuthLayout";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [timer, setTimer] = useState(30);
  const inputsRef = useRef([]);

  /* Countdown Logic */
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = () => {
    const finalOtp = otp.join("");
    console.log("Submitted OTP:", finalOtp);
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      console.log("Resend triggered");
    }
  };

  return (
    <AuthLayout>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
        }}
      >
        <div
          className="login-card"
          style={{
            width: "100%",
            maxWidth: "480px",
            textAlign: "center",
            padding: "55px 45px",
            borderRadius: "22px",
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "10px",
            }}
          >
            Enter Verification Code
          </h2>

          <p
            style={{
              color: "#6B7280",
              fontSize: "14px",
              marginBottom: "35px",
              lineHeight: "1.6",
            }}
          >
            We’ve sent a 6-digit verification code to your email.
            Enter it below to verify your account.
          </p>

          {/* Premium Icon */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "35px",
            }}
          >
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(99,102,241,0.15)",
              }}
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366F1"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <polyline points="3 7 12 13 21 7" />
              </svg>
            </div>
          </div>

          {/* OTP Inputs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "28px",
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputsRef.current[index] = el)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  width: "55px",
                  height: "60px",
                  textAlign: "center",
                  fontSize: "22px",
                  fontWeight: "600",
                  borderRadius: "14px",
                  border:
                    activeIndex === index
                      ? "1.5px solid #6366F1"
                      : "1px solid #E5E7EB",
                  outline: "none",
                  transition: "all 0.25s ease",
                  boxShadow:
                    activeIndex === index
                      ? "0 0 0 4px rgba(99,102,241,0.15)"
                      : "none",
                }}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            className="continue-btn"
            style={{
              width: "100%",
              marginBottom: "18px",
            }}
            onClick={handleSubmit}
          >
            Verify Account
          </button>

          {/* Resend Section */}
          <div
            style={{
              fontSize: "13px",
              color: "#6B7280",
            }}
          >
            {timer > 0 ? (
              <>Resend code in <strong>{timer}s</strong></>
            ) : (
              <span
                onClick={handleResend}
                style={{
                  cursor: "pointer",
                  color: "#6366F1",
                  fontWeight: "500",
                }}
              >
                Resend Code
              </span>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}