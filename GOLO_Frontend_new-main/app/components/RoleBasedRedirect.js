"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useRoleProtection(requiredRole) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user.accountType !== requiredRole) {
      if (requiredRole === "merchant") {
        router.replace("/login");
      } else if (requiredRole === "user") {
        router.replace("/merchant/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [loading, user, requiredRole, router]);

  return { isLoading: loading, isAuthorized: !loading && user && (!requiredRole || user.accountType === requiredRole) };
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2f9e58] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
