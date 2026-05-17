"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileSidebar from "../components/ProfileSidebar";
import AdCard from "../components/AdCard";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import { getMyAds } from "../lib/api";

export default function MyAds() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { isLoading, isAuthorized } = useRoleProtection("user");
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchMyAds() {
      setLoading(true);
      try {
        const response = await getMyAds({ page, limit });
        if (response.success) {
          setAds(response.data || []);
          setTotalPages(response.pagination?.pages || 1);
        }
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMyAds();
  }, [isAuthenticated, page]);

  if (isLoading) return <LoadingScreen />;

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="bg-[#F8F6F2] min-h-screen py-14 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-10">

          {/* LEFT SIDEBAR */}
          <ProfileSidebar />

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-3">

            <div className="bg-white rounded-3xl shadow-sm p-10">

              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-semibold text-black">
                    My Ads
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage and track your posted ads
                  </p>
                </div>

                <Link
                  href="/i-want"
                  className="group relative inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#157A4F] text-white font-semibold shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
                >
                  <span className="relative z-10">I Want</span>
                  <span className="absolute inset-0 rounded-full bg-[#1c9460] opacity-0 group-hover:opacity-20 blur-md transition duration-300"></span>
                </Link>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-20">
                  <p className="text-gray-500">Loading your ads...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && ads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-gray-500 text-lg mb-4">You haven&apos;t posted any ads yet</p>
                  <Link
                    href="/post-ad"
                    className="px-6 py-3 rounded-full bg-[#157A4F] text-white font-semibold transition hover:bg-[#0f5c3a]"
                  >
                    Post Your First Ad
                  </Link>
                </div>
              )}

              {/* Ads Grid */}
              {!loading && ads.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {ads.map((ad) => (
                    <AdCard
                      key={ad._id}
                      ad={ad}
                      onDelete={(deletedId) => {
                        setAds(prev => prev.filter(a => (a.adId || a._id) !== deletedId));
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-16">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg ${p === page
                        ? "bg-[#157A4F] text-white font-semibold shadow-sm"
                        : "border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition"
                        }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:border-[#157A4F] hover:text-[#157A4F] transition disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
