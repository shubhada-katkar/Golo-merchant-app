"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Download, Plus, ShoppingBag, Star, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import {
  getMerchantOrders,
  getMerchantOrderStats,
  updateMerchantOrderStatus,
  verifyVoucherByCode,
  redeemVoucher,
} from "../../lib/api";

export default function MerchantOrdersPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleMerchantLogout = async () => {
    await logout();
    router.push("/login");
  };
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ todayOrders: 0, totalRevenue: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [manualCodes, setManualCodes] = useState({});
  const [manualStatus, setManualStatus] = useState({});
  const [manualLoading, setManualLoading] = useState({});

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "accepted") {
      return orders.filter((order) => order.fulfillmentStatus === "accepted");
    }
    if (activeTab === "completed") {
      return orders.filter((order) => order.fulfillmentStatus === "completed");
    }
    if (activeTab === "pending") {
      return orders.filter((order) => order.fulfillmentStatus === "pending");
    }
    if (activeTab === "rejected") {
      return orders.filter((order) => order.fulfillmentStatus === "rejected");
    }
    return orders;
  }, [activeTab, orders]);

  const formatOrderForUi = (order) => {
    const date = new Date(order.placedAt || Date.now());
    const raw = String(order.status || "pending").toLowerCase();
    const isPending = raw === "pending";

    const statusLabel = isPending ? "New" : (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Order");

    let action = "";
    let actionTone = "muted";
    if (raw === 'pending') {
      action = 'Accept Order';
      actionTone = 'primary';
    } else if (raw === 'accepted') {
      action = 'Accepted';
      actionTone = 'muted';
    } else if (raw === 'rejected') {
      action = 'Rejected';
      actionTone = 'muted';
    } else if (raw === 'completed') {
      action = 'Completed';
      actionTone = 'muted';
    } else {
      action = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Order';
      actionTone = 'muted';
    }

    return {
      _id: order._id,
      id: `#${order.orderNumber || String(order._id || "").slice(-6)}`,
      statusLabel,
      amount: `₹${order.amount || 0}`,
      items: `${order.itemsCount || 1} items`,
      time: `Purchased ${date.toLocaleTimeString()}`,
      date: date.toLocaleDateString(),
      customer: order.customerName || "Customer",
      customerType: "Customer",
      avatar: "/images/place2.avif",
      fulfillmentStatus: isPending ? "pending" : raw,
      voucherId: order.voucherId,
      action,
      actionTone,
    };
  };

  const loadOrders = async (statusValue = activeTab) => {
    const response = await getMerchantOrders({ status: statusValue === "all" ? "all" : statusValue, page: 1, limit: 30 });
    setOrders((response?.data || []).map(formatOrderForUi));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.accountType !== "merchant") return;
      try {
        setPageLoading(true);
        setLoadError("");
        const [ordersRes, statsRes] = await Promise.all([
          getMerchantOrders({ status: activeTab === "all" ? "all" : activeTab, page: 1, limit: 30 }),
          getMerchantOrderStats(),
        ]);
        setOrders((ordersRes?.data || []).map(formatOrderForUi));
        setStats(statsRes?.data || { todayOrders: 0, totalRevenue: 0 });
      } catch (err) {
        setOrders([]);
        setStats({ todayOrders: 0, totalRevenue: 0 });
        setLoadError(err?.status === 404 ? "Orders service is not available yet." : "Failed to load orders.");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [user, activeTab]);

  const handleOrderAction = async (orderId, status) => {
    try {
      await updateMerchantOrderStatus(orderId, status);
      // Reload the current tab; if we just rejected an order, ensure we reload 'rejected'
      const reloadStatus = status === 'rejected' ? 'rejected' : activeTab;
      await loadOrders(reloadStatus);
    } catch (err) {
      setLoadError(err?.status === 404 ? "Order update service is not available yet." : "Failed to update order status.");
    }
  };

  const handleManualVoucherRedeem = async (order) => {
    const code = String(manualCodes[order._id] || '').trim();
    if (!code) {
      setManualStatus((prev) => ({ ...prev, [order._id]: 'Please enter a voucher code.' }));
      return;
    }

    const normalizedCode = code.replace(/\s+/g, '').toUpperCase();

    setManualLoading((prev) => ({ ...prev, [order._id]: true }));
    setManualStatus((prev) => ({ ...prev, [order._id]: 'Verifying code...' }));

    try {
      const verifyResponse = await verifyVoucherByCode(normalizedCode);
      const verifiedVoucherId = verifyResponse?.data?.voucherId;
      if (verifyResponse?.valid !== true || !verifiedVoucherId) {
        throw new Error(verifyResponse?.message || 'Voucher not found or invalid code');
      }

      await redeemVoucher(verifiedVoucherId, { verificationCode: normalizedCode });
      setManualCodes((prev) => ({ ...prev, [order._id]: '' }));
      setManualStatus((prev) => ({ ...prev, [order._id]: 'Order marked completed successfully.' }));
      await loadOrders(activeTab);
    } catch (err) {
      const message = err?.data?.message || err?.message || 'Invalid code or redemption failed.';
      setManualStatus((prev) => ({ ...prev, [order._id]: message }));
    } finally {
      setManualLoading((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/orders");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user || pageLoading) {
    return <div className="min-h-screen bg-[#efefef]" />;
  }

  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="orders" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
            <div>
              <h1 className="text-[42px] font-semibold leading-none text-[#1e1e1e]">Orders</h1>
              <p className="mt-3 text-[13px] text-[#6f6f6f] max-w-[420px]">
                Manage your store's daily activity, process incoming requests, and track your revenue growth.
              </p>
            </div>

            <div className="rounded-[12px] bg-[#dff3e4] border border-[#cfe7d5] px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#2f6140]">Today's Orders</p>
                  <p className="text-[10px] text-[#6f8f79] mt-0.5">Performance summary</p>
                </div>
                <span className="rounded-full bg-[#2f8f55] px-2 py-0.5 text-[10px] font-semibold text-white">Live</span>
              </div>

              <div className="mt-5 flex items-end gap-6">
                <div>
                  <p className="text-[44px] leading-none font-semibold text-[#1d2b21]">{stats.todayOrders || 0}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#6f8f79] mt-1">Orders ↗</p>
                </div>
                <div className="h-10 w-px bg-[#c9e0cf]" />
                <div>
                  <p className="text-[32px] leading-none font-semibold text-[#1d2b21]">₹{stats.totalRevenue || 0}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#6f8f79] mt-1">Revenue ↗</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e5e5e5] bg-[#f9f9f9] px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            {loadError ? (
              <div className="mb-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                {loadError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex rounded-[10px] border border-[#e1e1e1] bg-white p-1 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`h-8 min-w-[72px] rounded-[8px] px-3 text-[11px] font-semibold ${activeTab === "all" ? "bg-[#f2faf4] text-[#157a4f]" : "text-[#6d6d6d]"}`}
                >
                  All Orders
                </button>
                <button
                  onClick={() => setActiveTab("accepted")}
                  className={`h-8 min-w-[88px] rounded-[8px] px-3 text-[11px] font-semibold ${activeTab === "accepted" ? "bg-[#f2faf4] text-[#157a4f]" : "text-[#6d6d6d]"}`}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`h-8 min-w-[88px] rounded-[8px] px-3 text-[11px] font-semibold ${activeTab === "completed" ? "bg-[#f2faf4] text-[#157a4f]" : "text-[#6d6d6d]"}`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`h-8 min-w-[72px] rounded-[8px] px-3 text-[11px] font-semibold ${activeTab === "pending" ? "bg-[#f2faf4] text-[#157a4f]" : "text-[#6d6d6d]"}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("rejected")}
                  className={`h-8 min-w-[72px] rounded-[8px] px-3 text-[11px] font-semibold ${activeTab === "rejected" ? "bg-[#fff0f0] text-[#ef4d4d]" : "text-[#6d6d6d]"}`}
                >
                  Rejected
                </button>
              </div>

              <button className="h-8 rounded-[8px] border border-[#e5e5e5] bg-white px-4 text-[11px] text-[#6f6f6f]">Recent Orders</button>
            </div>

            <div className="mt-4 space-y-3">
              {filteredOrders.map((order) => (
                <article key={order.id} className="rounded-[10px] border border-[#ececec] bg-white px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                  <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4 items-center">
                    <div>
                      <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-[#7d7d7d]">
                        <span>ORDER {order.id}</span>
                        <span className="rounded-full border border-[#cfe7d5] bg-[#eef8f1] px-2 py-0.5 text-[#2f8f55]">{order.statusLabel}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-5 text-[#1d1d1d]">
                        <div>
                          <p className="text-[18px] font-semibold leading-none text-[#157a4f]">{order.amount}</p>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#929292] mt-1">Amount</p>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#2d2d2d] inline-flex items-center gap-1"><ShoppingBag size={12} className="text-[#157a4f]" /> {order.items}</p>
                          <p className="text-[9px] uppercase tracking-[0.1em] text-[#929292] mt-1">Quantity</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-[#6f6f6f] inline-flex items-center gap-1">◔ {order.time}</p>
                      <p className="mt-1 text-[10px] text-[#8a8a8a]">Date: {order.date}</p>
                    </div>

                    <div className="rounded-[10px] border border-[#efefef] bg-[#fafafa] px-4 py-3 flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 overflow-hidden rounded-full border border-[#dedede] shrink-0">
                        <Image src={order.avatar} alt={order.customer} width={32} height={32} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#222]">{order.customer}</p>
                        <p className="text-[10px] text-[#8a8a8a]">{order.customerType}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      {order.actionTone === "primary" ? (
                        <>
                          <button
                            onClick={() => handleOrderAction(order._id, "rejected")}
                            className="h-8 rounded-[8px] border border-[#f0c7c7] bg-white px-5 text-[11px] font-semibold text-[#ef4d4d] inline-flex items-center gap-1.5"
                          >
                            × Reject
                          </button>
                          <button
                            onClick={() => handleOrderAction(order._id, "accepted")}
                            className="h-8 rounded-[8px] bg-[#2f8f55] px-5 text-[11px] font-semibold text-white inline-flex items-center gap-1.5"
                          >
                            ✓ Accept Order
                          </button>
                        </>
                      ) : (
                        <button className="h-8 min-w-[96px] rounded-[8px] bg-[#f5f5f5] px-5 text-[11px] text-[#9c9c9c]">
                          {order.action}
                        </button>
                      )}
                    </div>
                  </div>
                  {order.voucherId && order.fulfillmentStatus === 'accepted' && (
                    <div className="mt-4 rounded-[10px] border-t border-[#ececec] pt-4">
                      <p className="text-[11px] font-semibold text-[#2d6a4f] mb-2">Enter manual voucher code to complete this order</p>
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                        <input
                          value={manualCodes[order._id] || ''}
                          onChange={(event) =>
                            setManualCodes((prev) => ({ ...prev, [order._id]: event.target.value }))
                          }
                          placeholder="XXXX-XXXX-XXXX"
                          className="min-w-0 flex-1 rounded-[10px] border border-[#d9d9d9] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#2f8f55]"
                        />
                        <button
                          onClick={() => handleManualVoucherRedeem(order)}
                          disabled={manualLoading[order._id]}
                          className="h-10 rounded-[10px] bg-[#157a4f] px-4 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#a1c7aa]"
                        >
                          {manualLoading[order._id] ? 'Processing...' : 'Complete with Code'}
                        </button>
                      </div>
                      {manualStatus[order._id] ? (
                        <p className="mt-2 text-[11px] text-[#4a4a4a]">{manualStatus[order._id]}</p>
                      ) : null}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="mt-4 rounded-[10px] border border-[#ececec] bg-white px-4 py-6 text-center text-[12px] text-[#7a7a7a]">
                No orders in this tab yet.
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <button className="h-9 rounded-full border border-[#cfe7d5] bg-white px-6 text-[12px] font-semibold text-[#2f8f55]">
                View All Order History
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-6 bg-[#e8ad2f] border-t border-[#d49b22] text-[#2f2a1f]">
        <div className="mx-auto w-full max-w-[1400px] px-8 lg:px-10 py-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-[3px] bg-[#0f7d49] text-white text-[26px] font-bold flex items-center justify-center leading-none">G</div>
              <span className="text-[34px] leading-none font-semibold text-[#0f7d49]">GOLO</span>
            </div>
            <p className="mt-3 text-[12px] max-w-[250px]">The all-in-one management platform for modern businesses. Empowering growth through analytics and intuitive product management.</p>
          </div>
          <div>
            <div className="mt-3 space-y-2 text-[13px]"><p>Overview</p><p>Inventory</p><p>Posts</p><p>Profile</p></div>
          </div>
          <div className="pt-8 md:pt-9 space-y-2 text-[13px]"><p>Analytics</p><p>Contact</p></div>
          <div>
            <p className="text-[20px] font-bold">Support</p>
            <div className="mt-3 space-y-2 text-[13px]"><p>Help Center</p><p>Security</p><p>Terms of Service</p></div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1400px] px-8 lg:px-10 py-3 border-t border-[#d49b22] flex items-center justify-between gap-3 text-[11px]"><p>© 2026 GOLO Dashboard. All rights reserved.</p></div>
      </footer>
    </div>
  );
}
