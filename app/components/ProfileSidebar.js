"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, Heart, LogOut, BarChart2 } from "lucide-react";

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const linkStyle = (path) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      pathname === path
        ? "bg-[#FFF3D6] text-black font-semibold shadow-sm"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const isTransactionsPath = pathname.startsWith("/profile/transactions");

  const transactionLinkStyle =
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isTransactionsPath
        ? "bg-[#FFF3D6] text-black font-semibold shadow-sm"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 h-fit border border-gray-100">
      {/* Title */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-black">
          My Account
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile & ads
        </p>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        <Link href="/choja/profile" className={linkStyle("/choja/profile")}>
          <User size={18} />
          <span>Profile</span>
        </Link>

        <Link href="/my-ads" className={linkStyle("/my-ads")}>
          <Package size={18} />
          <span>My Ads</span>
        </Link>

        <Link href="/analytics" className={linkStyle("/analytics")}>
          <BarChart2 size={18} />
          <span>Analytics</span>
        </Link>

        <Link href="/wishlist" className={linkStyle("/wishlist")}>
          <Heart size={18} />
          <span>Wishlist</span>
        </Link>

        <Link href="/profile/transactions" className={transactionLinkStyle}>
          <span className="text-lg">•</span>
          <span>Transactions</span>
        </Link>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}