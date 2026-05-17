"use client";


import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GolocalProfileSidebar from "../../components/GolocalProfileSidebar";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from "../../lib/api";


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 50 });
      if (res?.success) {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unreadCount || 0);
        setLastUpdated(new Date());
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const filteredNotifications = activeTab === "All"
    ? notifications
    : notifications.filter((n) => !n.read);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f4f4f4] to-[#e9f1ed]">
        <div className="w-full px-0 py-0">
          <div className="grid lg:grid-cols-[250px_1fr] min-h-[760px]">
            <GolocalProfileSidebar active="notifications" />
            <main className="flex flex-row gap-8 min-h-[760px] w-full px-4 md:px-8 py-10">
              {/* Notifications List */}
              <section className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-[30px] md:text-[34px] leading-none font-bold text-[#1f1f1f]">Notifications</h1>
                    <span className="text-sm text-gray-400 font-medium">Stay up to date with your latest activity and alerts</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${activeTab === "All" ? "bg-[#157a4f] text-white border-[#157a4f]" : "bg-white text-[#157a4f] border-[#d2e7de] hover:bg-[#f4f4f4]"}`}
                      onClick={() => setActiveTab("All")}
                    >
                      All
                    </button>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${activeTab === "Unread" ? "bg-[#157a4f] text-white border-[#157a4f]" : "bg-white text-[#157a4f] border-[#d2e7de] hover:bg-[#f4f4f4]"}`}
                      onClick={() => setActiveTab("Unread")}
                    >
                      Unread {unreadCount > 0 && <span className="ml-1 inline-block bg-[#f4a632] text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadCount}</span>}
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold border border-[#d2e7de] text-[#157a4f] bg-white hover:bg-[#f4f4f4] disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} /> Mark all as read
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold border border-[#e5e5e5] text-[#b91c1c] bg-white hover:bg-[#fbeaea]"
                    >
                      <Trash2 size={15} /> Clear all
                    </button>
                  </div>
                </div>
                <div className="border-b border-[#e5e5e5] mb-6" />
                {loading ? (
                  <div className="text-center text-[#157a4f] py-16 text-lg font-semibold flex flex-col items-center gap-2">
                    <Bell size={40} className="mx-auto mb-2 animate-pulse" />
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-2">
                    <Bell size={48} className="mx-auto mb-2 opacity-60" />
                    <span className="text-lg font-semibold">No notifications</span>
                    <span className="text-sm text-gray-400">You're all caught up!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => !notif.read && handleMarkRead(notif._id)}
                        className={`flex items-start gap-4 px-5 py-4 border border-[#e5e5e5] rounded-xl shadow-sm transition cursor-pointer group ${notif.read ? "bg-white" : "bg-green-50 hover:bg-green-100"}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5 ${notif.read ? "bg-[#e5e5e5]" : "bg-[#157A4F]/10"}`}>
                          <Bell size={18} className={notif.read ? "text-[#bdbdbd]" : "text-[#157A4F]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-semibold ${notif.read ? "text-gray-700" : "text-[#157A4F]"}`}>{notif.message}</span>
                            {!notif.read && <span className="inline-block w-2 h-2 rounded-full bg-[#f4a632] mt-1" />}
                          </div>
                          <span className="text-xs text-gray-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={e => { e.stopPropagation(); handleMarkRead(notif._id); }}
                            className="ml-2 px-2 py-1 rounded bg-[#157A4F] text-white text-xs font-semibold hover:bg-[#10613a] transition"
                          >Mark as read</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {/* Right Side Panel */}
              <aside className="hidden lg:flex flex-col w-[340px] min-w-[280px] max-w-[380px] bg-gradient-to-br from-[#f4f8f6] to-[#e9f1ed] border border-[#e0ece6] rounded-2xl shadow-xl p-7 mt-2 gap-10 animate-fade-in">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-1">
                    <Bell size={22} className="text-[#157a4f]" />
                    <h2 className="text-xl font-extrabold text-[#157a4f] tracking-tight">Notification Stats</h2>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-3xl font-bold text-[#157a4f]">{notifications.length}</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">Total</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-3xl font-bold text-[#f4a632]">{unreadCount}</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">Unread</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-3xl font-bold text-[#1a6d49]">{notifications.length - unreadCount}</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">Read</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Read</span>
                      <span>Unread</span>
                    </div>
                    <div className="w-full h-3 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-[#1a6d49] to-[#f4a632] rounded-full transition-all duration-500"
                        style={{ width: `${notifications.length === 0 ? 0 : ((notifications.length - unreadCount) / (notifications.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-[#157a4f]" />
                    <h2 className="text-lg font-bold text-[#157a4f] tracking-tight">Tips</h2>
                  </div>
                  <ul className="text-[15px] text-gray-700 space-y-2">
                    <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-[#f4a632]" />Click a notification to mark it as read.</li>
                    <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-[#157a4f]" />Use the tabs to filter unread messages.</li>
                    <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-[#1a6d49]" />"Mark all as read" to clear your badge.</li>
                    <li className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-[#b91c1c]" />"Clear all" to remove all notifications.</li>
                  </ul>
                </div>
                <div className="mt-auto text-xs text-gray-400 pt-4 border-t border-[#e0ece6] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#157a4f] animate-pulse" />
                  Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Loading...'}
                </div>
              </aside>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
