"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Heart, Trophy, Bell, LogOut } from "lucide-react";

function itemClass(active) {
  return `w-full rounded-xl text-sm px-4 py-3 flex items-center gap-2 transition ${
    active
      ? "bg-[#157a4f] text-white font-semibold"
      : "text-[#4a4a4a] hover:bg-[#f4f4f4]"
  }`;
}

export default function GolocalProfileSidebar({ active = "profile" }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className="border-r border-[#ececec] bg-[#fbfbfb] p-5 flex flex-col justify-between">
      <div className="space-y-2">
        <Link href="/profile" className={itemClass(active === "profile")}>
          <User size={15} />
          Profile
        </Link>

        {/* Points & Rewards link removed */}

        <Link href="/profile/favorites" className={itemClass(active === "favorites")}>
          <Heart size={15} />
          Favourite
        </Link>

        <Link href="/profile/notifications" className={itemClass(active === "notifications")}>
          <Bell size={15} />
          Notifications
        </Link>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-xl text-[#4a4a4a] text-sm px-4 py-3 flex items-center gap-2 hover:bg-[#f4f4f4] transition"
      >
        <LogOut size={15} />
        Logout
      </button>
    </aside>
  );
}
