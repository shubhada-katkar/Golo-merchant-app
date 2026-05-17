"use client";

import Link from "next/link";
import { deleteAd } from "../lib/api";
import { useState } from "react";

/**
 * Template-aware AdCard for My Ads page.
 * templateId: 1 = Multiple images (big), 2 = Single image, 3 = Text only
 */
function getExpiryLabel(expiryDate, status) {
  if (status === 'expired') return { label: 'Expired', color: '#ef4444', bg: '#fee2e2' };
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff <= 0) return { label: 'Expired', color: '#ef4444', bg: '#fee2e2' };
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const label = days === 0
    ? `Expires in ${hours}hr`
    : `Expires in ${days}d ${hours}hr`;
  const urgent = days < 2;
  return { label, color: urgent ? '#d97706' : '#6b7280', bg: urgent ? '#fef3c7' : '#f3f4f6' };
}

function getDisplayPrice(ad) {
  const candidates = [
    ad?.price,
    ad?.categorySpecificData?.price,
    ad?.categorySpecificData?.rent,
    ad?.categorySpecificData?.askingPrice,
    ad?.categorySpecificData?.rentAmount,
    ad?.categorySpecificData?.fees,
    ad?.categorySpecificData?.pricePerPerson,
    ad?.categorySpecificData?.consultationFee,
    ad?.categorySpecificData?.charges,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.]/g, '');
      const parsed = Number(normalized);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return null;
}

export default function AdCard({ ad, onDelete, onEdit }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!ad) return null;

  const { adId, _id, title, price, createdAt, images = [], description, templateId = 2, category, expiryDate, status } = ad;
  // Use custom adId for API calls, _id for URL if adId not present
  const apiId = adId || _id;
  const linkId = adId || _id;

  const primaryImage = !imgError && images?.[0] && !images[0].includes("placehold.co")
    ? images[0]
    : null;
  const displayPrice = getDisplayPrice(ad);
  const editUsed = Boolean(ad?.hasUsedEdit) || Number(ad?.editCount || 0) >= 1;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "";

  const handleDelete = async () => {
    if (!apiId) return;
    setIsDeleting(true);
    try {
      await deleteAd(apiId);
      if (onDelete) onDelete(apiId);
    } catch {
      alert("Failed to delete ad. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.13)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
    >
      {/* Image — only for template 1 or 2 */}
      {templateId !== 3 && (
        <Link href={`/product/${linkId}`} style={{ display: "block" }}>
          <div style={{ height: "180px", background: "#f3f4f6", overflow: "hidden" }}>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={title}
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: "8px"
              }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ fontSize: "12px" }}>No Image</span>
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Category badge */}
        {category && (
          <span style={{
            fontSize: "11px", fontWeight: 600, color: "#157A4F",
            background: "#e6f4ee", borderRadius: "20px", padding: "2px 10px",
            display: "inline-block", marginBottom: "6px", width: "fit-content"
          }}>
            {category}
          </span>
        )}

        <span style={{
          fontSize: "11px", fontWeight: 600,
          color: status === 'expired' ? '#ef4444' : '#22c55e',
          background: status === 'expired' ? '#fee2e2' : '#dcfce7',
          borderRadius: "20px", padding: "2px 8px",
          display: "inline-block", marginBottom: "4px", width: "fit-content"
        }}>
          ● {status === 'expired' ? 'Expired' : 'Active'}
        </span>
        {(() => {
          const exp = getExpiryLabel(expiryDate, status);
          return exp ? (
            <span style={{
              fontSize: "11px", fontWeight: 600, color: exp.color,
              background: exp.bg, borderRadius: "20px", padding: "2px 8px",
              display: "inline-block", marginBottom: "8px", width: "fit-content"
            }}>
              ⏱ {exp.label}
            </span>
          ) : null;
        })()}

        <Link href={`/product/${linkId}`} style={{ textDecoration: "none" }}>
          <h3 style={{
            fontSize: "15px", fontWeight: 700, color: "#111827",
            margin: "0 0 4px", lineHeight: "1.3",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {title}
          </h3>
        </Link>

        {/* For text-only template, show description snippet */}
        {templateId === 3 && description && (
          <p style={{
            fontSize: "13px", color: "#6b7280", margin: "4px 0 8px",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
          }}>
            {description}
          </p>
        )}

        {displayPrice !== null && (
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#157A4F", marginBottom: "4px" }}>
            ₹{displayPrice.toLocaleString("en-IN")}
          </div>
        )}
        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>
          Posted: {formattedDate}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
          <Link href={`/product/${linkId}`} style={{ flex: 1, textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "8px 0", borderRadius: "10px",
              border: "1.5px solid #157A4F", background: "transparent",
              color: "#157A4F", fontWeight: 600, fontSize: "13px", cursor: "pointer"
            }}>
              👁 View
            </button>
          </Link>

          <button
            onClick={() => onEdit && onEdit(ad)}
            disabled={editUsed || !onEdit}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "10px",
              border: `1.5px solid ${editUsed ? "#9ca3af" : "#2563eb"}`,
              background: "transparent",
              color: editUsed ? "#9ca3af" : "#2563eb",
              fontWeight: 600,
              fontSize: "13px",
              cursor: editUsed ? "not-allowed" : "pointer",
              opacity: editUsed ? 0.8 : 1,
            }}
            title={editUsed ? "Edit limit reached (1/1 used)" : "Edit ad (1 edit allowed)"}
          >
            {editUsed ? "✏️ Used" : "✏️ Edit"}
          </button>

          <button
            onClick={() => setDeleteConfirm(true)}
            disabled={isDeleting}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "10px",
              border: "1.5px solid #ef4444", background: "transparent",
              color: "#ef4444", fontWeight: 600, fontSize: "13px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.6 : 1
            }}
          >
            {isDeleting ? "⏳" : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setDeleteConfirm(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: "20px",
              padding: "36px 32px", maxWidth: "400px", width: "90%",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "44px", lineHeight: 1 }}>🗑️</div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0, textAlign: "center" }}>
              Delete Ad?
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
              Are you sure you want to delete this ad? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", width: "100%" }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: "12px",
                  border: "1.5px solid #d1d5db", background: "#f9fafb",
                  color: "#374151", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => { setDeleteConfirm(false); await handleDelete(); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: "12px",
                  border: "none", background: "#ef4444",
                  color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
