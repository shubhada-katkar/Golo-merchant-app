"use client";
import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { Search, MapPin, User, X, LogOut, ChevronDown, Shield, ShieldCheck, FileText, Bell, Trophy, Heart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import AuthRequiredModal from "./AuthRequiredModal";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../lib/api";

function NavbarContent({
  searchQuery: externalSearchQuery = "",
  setSearchQuery: setExternalSearchQuery = () => { },
}) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  // Sync with external prop if it changes
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setExternalSearchQuery(val);
  };

  const handleLocationChange = (val) => {
    setLocation(val);
    setShowSuggestions(true);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const logoHref = isAuthenticated && user?.accountType === "merchant"
    ? "/"
    : "/";
  const isGolocalSurface =
    pathname === "/" ||
    pathname.startsWith("/nearby-deals") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/my-deals");
  const isChojaSurface = pathname.startsWith("/choja");
  const useGolocalHomeNav = isGolocalSurface;
  const homeNavHref = "/choja";
  const primaryNavLabel = useGolocalHomeNav ? "My Deals" : "Post Your Ad";
  const primaryNavHref = useGolocalHomeNav ? "/my-deals" : "/post-ad";
  const secondaryNavLabel = useGolocalHomeNav ? "Nearby Deals" : "Chats";
  const secondaryNavHref = useGolocalHomeNav ? "/nearby-deals" : "/chats";

  const locations = [
    { city: "Kolhapur", state: "Maharashtra" },
    { city: "Pune", state: "Maharashtra" },
    { city: "Mumbai", state: "Maharashtra" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications for authenticated users
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications({ limit: 15 });
      if (res?.success) {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleNotifBellClick = () => {
    // Instead of dropdown, navigate to notifications page
    setShowNotifications(false);
    setShowProfileMenu(false);
    router.push("/profile/notifications");
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  const runSearch = (nextSearch = searchQuery, nextLocation = location) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    const trimmedSearch = nextSearch.trim();
    const trimmedLocation = nextLocation.trim();

    const params = new URLSearchParams();
    if (trimmedSearch) params.set("q", trimmedSearch);
    if (trimmedLocation) params.set("location", trimmedLocation);

    // Always treat /profile and all Golocal pages as Golocal surface
    const isGolocalSurface =
      pathname === "/" ||
      pathname.startsWith("/nearby-deals") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/my-deals");
    const targetBase = isGolocalSurface ? "/nearby-deals" : "/choja";
    router.push(params.toString() ? `${targetBase}?${params.toString()}` : targetBase);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      runSearch();
      setShowSuggestions(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
    router.push("/login");
  };

  const handleProfileAvatarClick = () => {
    if (isChojaSurface) {
      setShowProfileMenu((prev) => !prev);
      return;
    }

    if (isGolocalSurface) {
      setShowProfileMenu((prev) => !prev);
      return;
    }

    setShowProfileMenu((prev) => !prev);
  };

  const requireAuth = (callback) => (event) => {
    if (!isAuthenticated) {
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();
      setShowAuthPrompt(true);
      return;
    }

    if (callback) callback(event);
  };

  return (
    <>
      <header className="sticky top-0 z-[9999] h-16 bg-[#efb02e] border-b border-[#d7a02a] px-8 shadow-sm">
        <div className="w-full h-full flex items-center justify-between">

        {/* LOGO */}
        <Link
          href={logoHref}
          className="flex items-center gap-3 cursor-pointer min-w-[180px]"
        >
          <div
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow font-bold"
            style={{ color: "#157A4F" }}
          >
            G
          </div>
          <span className="text-xl font-semibold tracking-wide text-white">
            GOLO
          </span>
        </Link>

        {/* CENTER */}
        <div className="hidden md:flex items-center gap-5 flex-1 mx-12 max-w-4xl" onClick={(e) => e.stopPropagation()}>

          {/* SEARCH */}
          <div className="flex-[2] flex items-center rounded-full px-5 h-11 shadow-sm nav-input" onClick={(e) => e.stopPropagation()}>
            <Search
              size={18}
              className="mr-2"
              style={{ color: "var(--color-text-muted)" }}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => {
                if (!isAuthenticated) setShowAuthPrompt(true);
              }}
              placeholder="Search listings..."
              className="flex-1 outline-none text-sm bg-transparent text-black placeholder-gray-500 focus:outline-none"
              readOnly={!isAuthenticated}
            />

            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="ml-2 transition opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* LOCATION */}
          <div className="relative flex-[1]" ref={dropdownRef}>
            <div className="flex items-center rounded-full px-5 h-11 shadow-sm nav-input">
              <MapPin
                size={18}
                className="mr-2"
                style={{ color: "var(--color-text-muted)" }}
              />

              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => {
                  if (!isAuthenticated) {
                    setShowAuthPrompt(true);
                    return;
                  }
                  setShowSuggestions(true);
                }}
                placeholder="Location"
                className="w-full outline-none text-sm bg-transparent text-black placeholder-gray-500 focus:outline-none"
                readOnly={!isAuthenticated}
              />

              {location && (
                <button
                  onClick={() => {
                    setLocation("");
                    setShowSuggestions(false);
                    runSearch(searchQuery, "");
                  }}
                  className="ml-2 transition opacity-70"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* LOCATION DROPDOWN */}
            {showSuggestions && (
              <div className="absolute top-14 left-0 w-full rounded-xl shadow-lg py-2 z-50 bg-white border border-gray-200">
                {locations
                  .filter((place) => !location.trim() || place.city.toLowerCase().includes(location.trim().toLowerCase()))
                  .map((place, index) => (
                  <div key={index}>
                    <div
                      onClick={() => {
                        setLocation(place.city);
                        setShowSuggestions(false);
                        runSearch(searchQuery, place.city);
                      }}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
                    >
                      <MapPin
                        size={16}
                        style={{ color: "var(--color-primary)" }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-black">
                          {place.city}
                        </span>
                        <span className="text-xs text-gray-500">
                          {place.state}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-8 min-w-[260px] justify-end">

          <nav className="hidden md:flex gap-6 text-sm font-semibold text-white">
            <Link href={homeNavHref} className="hover:opacity-80 transition">
              Home
            </Link>
            <Link href={primaryNavHref} onClick={requireAuth()} className="hover:opacity-80 transition">
              {primaryNavLabel}
            </Link>
            <Link
              href={secondaryNavHref}
              onClick={useGolocalHomeNav ? undefined : requireAuth()}
              className="hover:opacity-80 transition"
            >
              {secondaryNavLabel}
            </Link>
          </nav>

          {/* PROFILE / AUTH */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">

              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={handleNotifBellClick}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-md hover:scale-105 transition"
                  style={{ color: "#157A4F" }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown removed; bell now navigates to notifications page */}
              </div>

              {/* PROFILE AVATAR */}
            <div className="relative" ref={profileRef}>
              <div
                onClick={handleProfileAvatarClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition bg-white"
                  style={{ color: "#157A4F" }}
                >
                  {user?.name ? (
                    <span className="text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User size={18} />
                  )}
                </div>
                {(isChojaSurface || isGolocalSurface) && <ChevronDown size={14} className="text-gray-500" />}
              </div>

              {/* Profile Dropdown */}
              {isChojaSurface && showProfileMenu && (
                <div className="absolute top-12 right-0 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[9999]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/choja/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <Link
                    href={useGolocalHomeNav ? "/my-deals" : "/my-ads"}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <FileText size={16} /> {useGolocalHomeNav ? "My Deals" : "My Ads"}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <ShieldCheck size={16} className="text-red-500" /> Wishlist
                  </Link>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#157A4F] hover:bg-green-50 transition border-t border-gray-100 mt-1"
                    >
                      <Shield size={16} /> Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}

              {isGolocalSurface && showProfileMenu && (
                <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[9999]">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={16} /> Profile
                  </Link>
                  {/* Points & Rewards link removed */}
                  <Link
                    href="/profile/favorites"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Heart size={16} /> Favourite
                  </Link>
                  <Link
                    href="/profile/notifications"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Bell size={16} /> Notifications
                  </Link>
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`)}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer bg-white"
              style={{ color: "#157A4F" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer bg-white"
                style={{ color: "#157A4F" }}
              >
                <User size={18} />
              </div>
            </button>
          )}
        </div>
        </div>
      </header>

      <AuthRequiredModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Login or Register"
        description="Please log in or create an account to access GOLO listings, chats, posting, and search from the home page."
        redirectTo={pathname || "/"}
      />
    </>
  );
}

export default function Navbar(props) {
  return (
    <Suspense fallback={
      <header className="theme-footer shadow-sm sticky top-0 z-[9999] border-b border-gray-200 h-16">
        <div className="w-full px-8 h-16 bg-gray-50 animate-pulse" />
      </header>
    }>
      <NavbarContent {...props} />
    </Suspense>
  );
}