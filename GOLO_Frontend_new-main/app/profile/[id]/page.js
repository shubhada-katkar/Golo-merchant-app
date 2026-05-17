"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Recommended from "@/app/components/Recommended";
import { getUserById, getAdsByUser } from "@/app/lib/api";
import { Flag, MessageCircle } from "lucide-react";
import UserReportModal from "@/app/components/UserReportModal";

export default function UserProfile({ params }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const userRes = await getUserById(userId);
        const adsRes = await getAdsByUser(userId);
        if (userRes.success && userRes.data) setUser(userRes.data);
        if (adsRes.success && Array.isArray(adsRes.data)) setAds(adsRes.data);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EAF6F0] animate-pulse" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#F8F6F2] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#ecf8f1] text-[#157A4F] font-bold flex items-center justify-center text-4xl mb-4">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user?.name || "User"}</h1>
            <p className="text-gray-500 mb-2">{user?.email}</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push(`/chats?sellerId=${userId}`)}
                className="py-2 px-6 rounded-xl border-2 border-[#157A4F] text-[#157A4F] hover:bg-[#157A4F] hover:text-white hover:border-[#0f5c3a] font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-[1.02] text-sm"
              >
                <MessageCircle size={16} /> Chat
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="py-2 px-6 rounded-xl border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-[1.02] text-sm"
              >
                <Flag size={16} /> Report User
              </button>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="font-semibold text-lg mb-4">Ads Uploaded by {user?.name || "User"}</h2>
            {ads.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-gray-500 text-center">No ads uploaded yet.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {ads.map((ad) => (
                  <div key={ad._id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="font-semibold text-gray-800 truncate">{ad.title}</div>
                    <div className="text-xs text-gray-500 mb-2">{ad.category}</div>
                    <div className="text-sm text-gray-700 mb-2 truncate">{ad.description}</div>
                    <button
                      onClick={() => router.push(`/product/${ad._id}`)}
                      className="mt-2 py-1 px-4 rounded-lg bg-[#157A4F] text-white hover:bg-[#0f5c3a] text-xs font-semibold"
                    >
                      View Ad
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Recommended />
      <Footer />
      <UserReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={userId}
        userName={user?.name || user?.email || "User"}
      />
    </>
  );
}
