"use client";

import AuthLayout from "./../../components/AuthLayout";
import { MailCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CheckEmail() {
  return (
    <AuthLayout>
      <div className="auth-container centered">
        {/* Modern Decorative Backgrounds */}
        <div className="bg-glow-left"></div>
        <div className="bg-glow-right"></div>
        <div className="dot-pattern-fixed"></div>

        <div className="check-email-card">
          {/* Top Centered G Icon */}
          <div className="top-g-box">G</div>

          {/* Custom Animated Mail Icon */}
          <div className="mail-icon-wrapper">
            <div className="mail-envelope">
              <MailCheck size={64} strokeWidth={1.5} className="mail-svg" />
              <div className="mail-badge"></div>
            </div>
          </div>

          <h2>Check your email!</h2>
          <p className="description">
            Thanks! An email was sent that will ask you to click on a link to verify 
            that you own this account. If you don't get the email, please contact 
            <span className="support-link"> support@kinety.com</span>
          </p>

          <button className="primary-orange-btn">Open email inbox</button>

          <div className="resend-action">
            <ChevronLeft size={18} />
            <span>Resend email</span>
          </div>

          <div className="register-footer">
  New to Ad Network Group?{" "}
  <Link href="/register" className="font-bold cursor-pointer">
    Register Now
  </Link>
</div>
        </div>

        {/* Page Footer */}
        <div className="auth-footer-bottom">
          <span>Copyright©2026</span>
          <span className="separator">|</span>
          <span>Privacy Policy</span>
        </div>
      </div>
    </AuthLayout>
  );
}