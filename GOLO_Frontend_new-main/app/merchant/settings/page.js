"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MerchantSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/merchant/profile?tab=settings");
  }, [router]);

  return <div className="min-h-screen bg-[#ececec]" />;
}
