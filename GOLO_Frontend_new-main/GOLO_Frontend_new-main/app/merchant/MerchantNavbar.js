"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Bell, X, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../lib/api";

const navItems = [
  { key: "dashboard", label: "Overview", href: "/merchant/dashboard" },
  { key: "orders", label: "Orders", href: "/merchant/orders" },
  { key: "products", label: "Products", href: "/merchant/products" },
  { key: "offers", label: "Offers", href: "/merchant/offers" },
  { key: "redeem", label: "Redeem QR", href: "/merchant/redeem" },
  { key: "banners", label: "Banners", href: "/merchant/banners" },
  { key: "analytics", label: "Analytics", href: "/merchant/analytics" },
  { key: "settings", label: "Settings", href: "/merchant/settings" },
];

export default function MerchantNavbar({ activeKey = "dashboard" }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 10 });
      const payload = response?.data || {};
      const notifs = Array.isArray(payload.notifications) ? payload.notifications : [];
      setNotifications(notifs);
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch (err) {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch (err) { }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch (err) { }
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <header className="sticky top-0 z-[9999] h-16 bg-[#efb02e] border-b border-[#d7a02a] px-8 lg:px-10 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 min-w-[180px]">
        <button type="button" onClick={() => router.push("/merchant/dashboard")} className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow font-bold" style={{ color: "#157a4f" }}>
            G
          </div>
          <span className="text-xl font-semibold tracking-wide text-[#157a4f]">GOLO</span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-8 text-[12px] font-semibold text-[#5a4514]">
        <nav className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            const isRedeem = item.key === "redeem";

            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className={
                  isActive
                    ? "relative h-16 text-[#157a4f]"
                    : isRedeem
                      ? "relative h-16 hover:text-[#157a4f]"
                      : "hover:text-[#157a4f]"
                }
              >
                {item.label}
                {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#157a4f]" />}
              </button>
            );
          })}
        </nav>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative w-10 h-10 rounded-full bg-white shadow-md hover:scale-105 transition flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={18} style={{ color: "#157a4f" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showDropdown && (
            <div className="absolute right-0 top-14 w-80 max-h-[420px] bg-white rounded-[12px] shadow-2xl border border-[#e5e5e5] overflow-hidden z-[10000]">
              <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#1e1e1e]">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-[#157a4f] font-semibold flex items-center gap-1">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[340px]">
                {loadingNotif ? (
                  <div className="px-4 py-6 text-center text-[12px] text-[#999]">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-[#999]">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkRead(n._id)}
                      className={`px-4 py-3 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#f9f9f9] ${n.read ? "" : "bg-[#f0faf4]"}`}
                    >
                      <p className="text-[12px] text-[#1e1e1e] leading-snug">{n.message}</p>
                      <p className="text-[10px] text-[#999] mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button type="button" onClick={() => router.push("/merchant/profile")} className="w-10 h-10 rounded-full bg-white shadow-md hover:scale-105 transition flex items-center justify-center" aria-label="Profile">
          <User size={18} style={{ color: "#157a4f" }} />
        </button>
      </div>
    </header>
  );
}