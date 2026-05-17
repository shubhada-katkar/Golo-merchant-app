"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ProfileSidebar from "../../components/ProfileSidebar";
import { useAuth } from "../../context/AuthContext";
import { getProfile, getMyAds } from "../../lib/api";

export default function ChojaProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [profileRes, adsRes] = await Promise.all([
          getProfile(),
          getMyAds({ page: 1, limit: 1 }),
        ]);

        if (profileRes.success) {
          setProfile(profileRes.data);
        }
        if (adsRes.success) {
          setActiveAdsCount(adsRes.pagination?.total || 0);
        }
      } catch {
        setProfile(user);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, user]);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  const displayUser = profile || user;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#F8F6F2] py-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
          <ProfileSidebar />

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div
                  className="w-[120px] h-[120px] rounded-full border-4 border-[#F5B849] flex items-center justify-center bg-gray-100"
                  style={{ fontSize: "48px", fontWeight: "bold", color: "#157A4F" }}
                >
                  {displayUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-semibold text-black">{displayUser?.name || "User"}</h2>
                  <p className="text-gray-500">{displayUser?.email}</p>
                  <p className="text-gray-500 mt-1">
                    {displayUser?.profile?.city || displayUser?.profile?.state
                      ? `${displayUser.profile.city || ""}${displayUser.profile.city && displayUser.profile.state ? ", " : ""}${displayUser.profile.state || ""}`
                      : "India"}
                  </p>

                  <button
                    onClick={() => router.push("/profile/edit")}
                    className="mt-4 bg-[#157A4F] hover:bg-[#0f5c3a] transition px-6 py-2 rounded-lg text-white font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-6 text-black">Account Information</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Full Name</p>
                  <p className="font-medium text-black">{displayUser?.name || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="font-medium text-black">{displayUser?.email || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="font-medium text-black">
                    {displayUser?.profile?.phone || displayUser?.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Member Since</p>
                  <p className="font-medium text-black">
                    {displayUser?.createdAt
                      ? new Date(displayUser.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-xl font-semibold mb-6 text-black">My Activity</h3>

              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-[#FFF3D6] rounded-xl p-6">
                  <p className="text-2xl font-bold text-black">{activeAdsCount}</p>
                  <p className="text-gray-600">Active Ads</p>
                </div>

                <div className="bg-[#FFF3D6] rounded-xl p-6">
                  <p className="text-2xl font-bold text-black">{displayUser?.isEmailVerified ? "✓" : "✗"}</p>
                  <p className="text-gray-600">Email Verified</p>
                </div>

                <div className="bg-[#FFF3D6] rounded-xl p-6">
                  <p className="text-2xl font-bold text-black capitalize">
                    {displayUser?.accountType || displayUser?.role || "user"}
                  </p>
                  <p className="text-gray-600">Account Type</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}