"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Edit3, Megaphone, Plus, Search, User, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";
import { getMyBannerPromotions, payForBannerPromotion, updateMyBannerPromotion } from "../../lib/api";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeStatus(status) {
  const map = {
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    active: "Active",
    expired: "Expired",
  };
  return map[status] || status;
}

export default function MerchantBannersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    bannerTitle: "",
    bannerCategory: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadRequests = async () => {
    setListLoading(true);
    setActionError("");
    try {
      const res = await getMyBannerPromotions();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      setActionError(error?.data?.message || "Failed to load banner requests.");
      setRows([]);
    } finally {
      setListLoading(false);
    }
  };

  const handlePayNow = async (requestId) => {
    setActionMessage("");
    setActionError("");
    try {
      await payForBannerPromotion(requestId, `MOCK_PAY_${Date.now()}`);
      setRows((prev) => prev.map((row) => (row._id === requestId ? { ...row, paymentStatus: "paid" } : row)));
      setActionMessage("Payment completed successfully.");
    } catch (error) {
      setActionError(error?.data?.message || "Failed to process payment.");
    }
  };

  const escapeCsvField = (value) => {
    const str = String(value ?? "");
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadCsv = (filename, csvText) => {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportBannersToCsv = async () => {
    try {
      setIsExporting(true);

      const header = [
        "requestId",
        "bannerTitle",
        "bannerCategory",
        "status",
        "paymentStatus",
        "createdAt",
        "startDate",
        "endDate",
        "totalPrice",
        "dailyRate",
        "platformFee",
        "imageUrl",
      ];

      const exportRows = filteredRows;
      const lines = [
        header.join(","),
        ...exportRows.map((row) => {
          const values = [
            row?.requestId || row?._id || row?.id,
            row?.bannerTitle,
            row?.bannerCategory,
            row?.status,
            row?.paymentStatus,
            row?.createdAt,
            row?.startDate,
            row?.endDate,
            row?.totalPrice,
            row?.dailyRate,
            row?.platformFee,
            row?.imageUrl,
          ].map(escapeCsvField);
          return values.join(",");
        }),
      ];

      const today = new Date().toISOString().split("T")[0];
      const safeSearch = String(searchTerm || "").trim().replace(/[^\w-]+/g, "_").slice(0, 40);
      const filename = safeSearch ? `banners_${safeSearch}_${today}.csv` : `banners_${today}.csv`;
      downloadCsv(filename, lines.join("\r\n"));
    } catch (error) {
      window.alert(error?.message || "Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const normalizeInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const computeRangeDates = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    if (end < start) return [];

    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, "0");
      const day = String(cursor.getDate()).padStart(2, "0");
      days.push(`${year}-${month}-${day}`);
      cursor.setDate(cursor.getDate() + 1);
      if (days.length > 370) break;
    }
    return days;
  };

  const openEdit = (row) => {
    const start = normalizeInputDate(row?.startDate) || (Array.isArray(row?.selectedDates) ? row.selectedDates[0] : "");
    const end = normalizeInputDate(row?.endDate) || (Array.isArray(row?.selectedDates) ? row.selectedDates[row.selectedDates.length - 1] : "");

    setEditRow(row);
    setEditForm({
      bannerTitle: row?.bannerTitle || "",
      bannerCategory: row?.bannerCategory || "",
      imageUrl: row?.imageUrl || "",
      startDate: start,
      endDate: end,
    });
    setActionMessage("");
    setActionError("");
  };

  const closeEdit = () => {
    setEditRow(null);
    setEditForm({ bannerTitle: "", bannerCategory: "", imageUrl: "", startDate: "", endDate: "" });
    setIsSavingEdit(false);
  };

  const saveEdit = async () => {
    if (!editRow) return;

    setActionMessage("");
    setActionError("");

    const bannerTitle = String(editForm.bannerTitle || "").trim();
    const bannerCategory = String(editForm.bannerCategory || "").trim();
    if (!bannerTitle) {
      setActionError("Banner title is required.");
      return;
    }
    if (!bannerCategory) {
      setActionError("Banner category is required.");
      return;
    }

    const selectedDates = computeRangeDates(editForm.startDate, editForm.endDate);
    if (selectedDates.length === 0) {
      setActionError("Please select a valid start and end date.");
      return;
    }

    const promotionId = editRow?.requestId || editRow?._id || editRow?.id;
    if (!promotionId) {
      setActionError("Unable to edit this banner (missing id).");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updateData = {
        bannerTitle,
        bannerCategory,
        imageUrl: editForm.imageUrl,
        selectedDates,
      };

      const res = await updateMyBannerPromotion(promotionId, updateData);
      const updated = res?.data || updateData;

      setRows((prev) =>
        prev.map((item) => {
          const itemId = item?.requestId || item?._id || item?.id;
          if (String(itemId) !== String(promotionId)) return item;

          const nextDates = Array.isArray(updated?.selectedDates) ? updated.selectedDates : selectedDates;
          return {
            ...item,
            ...updated,
            bannerTitle: updated?.bannerTitle ?? bannerTitle,
            bannerCategory: updated?.bannerCategory ?? bannerCategory,
            imageUrl: updated?.imageUrl ?? editForm.imageUrl,
            selectedDates: nextDates,
            startDate: updated?.startDate ?? nextDates[0],
            endDate: updated?.endDate ?? nextDates[nextDates.length - 1],
          };
        }),
      );

      setActionMessage("Banner updated successfully.");
      closeEdit();
    } catch (error) {
      setActionError(error?.data?.message || "Failed to update banner.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const summary = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "active").length;
    const spend = rows.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0);
    return { total, active, spend };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      return [row.bannerTitle, row.bannerCategory, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [rows, searchTerm]);

  useEffect(() => {
    if (!loading && user && user.accountType === "merchant") {
      loadRequests();
    }
  }, [loading, user]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="banners" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-5">
          <section>
            <h1 className="text-[42px] font-semibold leading-none text-[#1e1e1e]">Banner Promotions</h1>
            <p className="mt-3 text-[13px] text-[#6f6f6f] max-w-[540px]">
              Track your paid homepage banners, visibility windows, and campaign performance in one place.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Total Banners</p>
                <p className="text-[34px] font-semibold leading-none mt-1">{summary.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#fef5e2] text-[#efb02e] flex items-center justify-center">
                <Megaphone size={17} />
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Active Promotions</p>
                <p className="text-[34px] font-semibold leading-none mt-1">{summary.active}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#ecf8f0] text-[#2cb56e] flex items-center justify-center text-[16px]">◎</div>
            </div>

            <div className="rounded-[12px] border border-[#e2e2e2] bg-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#666]">Promotion Spend</p>
                <p className="text-[34px] font-semibold leading-none mt-1">Rs. {summary.spend}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#f4f4f1] text-[#f0aa19] flex items-center justify-center text-[20px]">Rs</div>
            </div>
          </section>

          <section className="rounded-[12px] border border-[#e5e5e5] bg-[#f9f9f9] p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-[620px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a4a4]" />
                <input
                  className="h-9 w-full rounded-[8px] border border-[#e2e2e2] bg-white pl-8 pr-3 text-[12px] outline-none"
                  placeholder="Search by banner title"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isExporting}
                  className="h-9 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[11px] text-[#666] inline-flex items-center gap-1.5 disabled:opacity-60"
                  onClick={exportBannersToCsv}
                >
                  <Download size={12} /> Export CSV
                </button>
                <button onClick={() => router.push("/merchant/banners/promote")} className="h-9 rounded-[8px] bg-[#2f9e58] px-4 text-[11px] font-semibold text-white inline-flex items-center gap-1.5">
                  <Plus size={12} /> Promote Your Banner
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[10px] border border-[#ececec] bg-white">
              {actionError ? <p className="px-4 py-2 text-[11px] text-[#dc2626]">{actionError}</p> : null}
              {actionMessage ? <p className="px-4 py-2 text-[11px] text-[#157a4f]">{actionMessage}</p> : null}
              <table className="w-full text-[12px]">
                <thead className="bg-[#f2f3f5] text-[#666]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Image</th>
                    <th className="px-4 py-3 text-left font-semibold">Banner Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-left font-semibold">Posted Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Visibility Dates</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Budget</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-[#666]">Loading banners...</td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-[#666]">No banner requests found.</td>
                    </tr>
                  ) : filteredRows.map((row) => (
                    <tr key={row.requestId} className="border-t border-[#f0f0f0]">
                      <td className="px-4 py-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-[#ececec]">
                          <Image src={row.imageUrl || "/images/banner3.avif"} alt={row.bannerTitle} width={32} height={32} className="h-full w-full object-cover" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#2a2a2a]">{row.bannerTitle}</td>
                      <td className="px-4 py-3 text-[#2c2c2c]">{row.bannerCategory}</td>
                      <td className="px-4 py-3 text-[#2c2c2c]">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3 text-[#2c2c2c]">{formatDate(row.startDate)} - {formatDate(row.endDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          row.status === "active"
                            ? "bg-[#e7f7ec] text-[#2f9e58]"
                            : row.status === "rejected"
                              ? "bg-[#fee2e2] text-[#dc2626]"
                              : row.status === "approved"
                                ? "bg-[#e8f1ff] text-[#1d4ed8]"
                                : "bg-[#f3f4f6] text-[#4b5563]"
                        }`}
                        >
                          {normalizeStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#1f1f1f]">Rs. {row.totalPrice || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            disabled={row?.paymentStatus === "paid" || row?.status === "active" || row?.status === "expired"}
                            className="h-7 rounded-[6px] border border-[#e2e2e2] bg-white px-2.5 text-[10px] font-semibold text-[#444] inline-flex items-center gap-1 disabled:opacity-60"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          {row.status === "approved" && row.paymentStatus !== "paid" ? (
                            <button
                              onClick={() => handlePayNow(row.requestId)}
                              className="h-7 rounded-[6px] bg-[#157a4f] px-3 text-[10px] font-semibold text-white"
                            >
                              Pay Now
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-[#d6d9df] px-6 py-4 text-[12px] text-[#565656]">Showing {filteredRows.length} of {rows.length} banners</div>
            </div>

            {editRow ? (
              <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center px-4">
                <div className="w-full max-w-[640px] rounded-[14px] bg-white border border-[#e7e7e7] shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#efefef]">
                    <p className="text-[16px] font-semibold text-[#1f1f1f]">Edit Banner</p>
                    <button type="button" onClick={closeEdit} className="h-8 w-8 rounded-full border border-[#e5e5e5] bg-white inline-flex items-center justify-center">
                      <X size={16} className="text-[#666]" />
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-[#333] mb-2">Banner Title</label>
                        <input
                          value={editForm.bannerTitle}
                          onChange={(e) => setEditForm((p) => ({ ...p, bannerTitle: e.target.value }))}
                          className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] outline-none focus:border-[#2f9e58]"
                          placeholder="Banner title"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#333] mb-2">Category</label>
                        <input
                          value={editForm.bannerCategory}
                          onChange={(e) => setEditForm((p) => ({ ...p, bannerCategory: e.target.value }))}
                          className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] outline-none focus:border-[#2f9e58]"
                          placeholder="Category"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-semibold text-[#333] mb-2">Start Date</label>
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                          className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] outline-none focus:border-[#2f9e58]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#333] mb-2">End Date</label>
                        <input
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                          className="h-10 w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] outline-none focus:border-[#2f9e58]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-[#333] mb-2">Banner Image</label>
                      <div className="flex items-center gap-3">
                        <label className="h-10 px-4 rounded-[8px] border border-[#dddddd] bg-white text-[12px] font-semibold text-[#444] inline-flex items-center cursor-pointer hover:bg-[#fafafa]">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === "string") {
                                  setEditForm((p) => ({ ...p, imageUrl: reader.result }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          Upload
                        </label>
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-[#ececec] bg-[#f3f4f6] flex items-center justify-center">
                          {editForm.imageUrl && String(editForm.imageUrl).trim() ? (
                            <Image src={editForm.imageUrl} alt="Banner" width={40} height={40} className="h-full w-full object-cover" />
                          ) : (
                            <User size={18} className="text-[#9ca3af]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#777]">Range days: {computeRangeDates(editForm.startDate, editForm.endDate).length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-t border-[#efefef] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeEdit}
                      className="h-9 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[12px] font-semibold text-[#444]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingEdit}
                      onClick={saveEdit}
                      className="h-9 rounded-[8px] bg-[#2f9e58] disabled:bg-[#9fcfad] px-4 text-[12px] font-semibold text-white"
                    >
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <footer className="bg-[#f0b330] text-[#1b1b1b] px-4 lg:px-8 py-7 mt-6">
        <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-between">
          <div className="max-w-[240px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center font-bold text-[#157a4f]">G</div>
              <span className="text-[18px] font-semibold text-[#157a4f]">GOLO</span>
            </div>
            <p className="text-[10px] leading-[1.35] text-[#fff8de] max-w-[150px]">
              The all-in-one management platform for modern businesses. Empowering growth through analytics and intuitive product management.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-14 lg:gap-20 text-[10px] text-[#6b520f]">
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">Links</p>
              <ul className="space-y-2">
                <li>Overview</li>
                <li>Inventory</li>
                <li>Posts</li>
                <li>Profile</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">&nbsp;</p>
              <ul className="space-y-2">
                <li>Analytics</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1b1b1b] mb-3">Support</p>
              <ul className="space-y-2">
                <li>Help Center</li>
                <li>Security</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mt-auto lg:pb-2 text-[#1877f2]">
            <span className="h-5 w-5 rounded-full bg-[#f3ba3b] flex items-center justify-center text-[#1877f2] text-[10px] font-bold">f</span>
            <span className="h-5 w-5 rounded-[2px] bg-[#f3ba3b] flex items-center justify-center text-[#0a66c2] text-[9px] font-bold">in</span>
            <span className="h-5 w-5 rounded-full bg-[#f3ba3b] flex items-center justify-center text-[#e1306c] text-[10px] font-bold">ig</span>
            <span className="h-5 w-5 rounded-[2px] bg-[#f3ba3b] flex items-center justify-center text-[#ff0000] text-[10px] font-bold">▶</span>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto mt-6 flex items-center justify-between text-[9px] text-[#5f4710]">
          <p>© 2026 GOLO Dashboard. All rights reserved.</p>
          <p>Made with ♥ by V</p>
        </div>
      </footer>
    </div>
  );
}
