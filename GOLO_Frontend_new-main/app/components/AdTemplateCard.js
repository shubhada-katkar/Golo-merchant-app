"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdTemplateCard({ ad, isBento = false }) {
    const router = useRouter();
    const [imgIdx, setImgIdx] = useState(0);
    const [imgError, setImgError] = useState(false);

    // Swap images every 3 seconds for Template 1
    useEffect(() => {
        if (ad?.templateId === 1 && ad?.images?.length > 1) {
            const interval = setInterval(() => {
                setImgIdx((prev) => (prev + 1) % ad.images.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [ad?.templateId, ad?.images]);

    if (!ad) return null;

    const { adId, _id, title, price, description, images = [], templateId = 2 } = ad;
    const linkId = adId || _id;
    const sellerId = ad?.userId || "";

    const validImages = (images || []).filter(img => img && !img.includes("placehold.co"));
    const hasImages = validImages.length > 0 && !imgError;

    // We keep formatting simple to match screenshot (e.g. ₹2,499 or $899 in text card)
    let formattedPrice = price != null ? `₹${Number(price).toLocaleString("en-IN")}` : "Price on request";
    if (templateId === 3 && price != null) {
        // Screenshot shows $ for text template, let's just keep the formatting identical
        formattedPrice = `$${Number(price).toLocaleString("en-US")}`;
    }

    // Common Button Group
    const ButtonGroup = () => (
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/chats?adId=${linkId}&sellerId=${sellerId}`);
                }}
                style={{
                    background: "#157A4F", color: "#fff", border: "none", borderRadius: "8px",
                    padding: "8px 24px", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", zIndex: 10
                }}
            >
                Chat
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/chats?adId=${linkId}&sellerId=${sellerId}&autoCall=1`);
                }}
                style={{
                    background: "#FBBF24", color: "#fff", border: "none", borderRadius: "8px",
                    padding: "8px 24px", fontWeight: 600, fontSize: "14px", cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", zIndex: 10
                }}
            >
                Call
            </button>
        </div>
    );

    // ─── Template 1: Big Card with Carousel ───────────────────────────────────
    if (templateId === 1) {
        return (
            <Link href={`/product/${linkId}`} style={{ textDecoration: "none" }}>
                <div style={{
                    position: "relative",
                    borderRadius: "24px",
                    overflow: "hidden",
                    // Use 100% height to fill the grid cell (bento box)
                    height: isBento ? "100%" : "420px",
                    minHeight: "420px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                }}>
                    {hasImages ? (
                        <img
                            src={validImages[imgIdx]}
                            alt={title}
                            onError={() => setImgError(true)}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <div style={{ position: "absolute", inset: 0, background: "#333" }} />
                    )}

                    {/* Dark Gradient Overlay */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)",
                        pointerEvents: "none"
                    }} />

                    {/* Content Overlay */}
                    <div style={{ position: "relative", zIndex: 5, padding: "32px 32px 24px 32px" }}>
                        <h2 style={{ color: "#fff", fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0", lineHeight: 1.2 }}>
                            {title}
                        </h2>
                        {description && (
                            <p style={{ color: "#e5e7eb", fontSize: "15px", margin: "0 0 16px 0", maxWidth: "80%", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {description}
                            </p>
                        )}
                        <div style={{ color: "#FBBF24", fontSize: "24px", fontWeight: 800, margin: "0 0 16px 0" }}>
                            {formattedPrice}
                        </div>
                        <ButtonGroup />
                    </div>

                    {/* Dots indicator */}
                    {validImages.length > 1 && (
                        <div style={{ position: "absolute", bottom: "24px", right: "32px", display: "flex", gap: "6px", zIndex: 5 }}>
                            {validImages.map((_, i) => (
                                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)" }} />
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    // ─── Template 3: Text Only Card ──────────────────────────────────────────
    if (templateId === 3) {
        return (
            <Link href={`/product/${linkId}`} style={{ textDecoration: "none" }}>
                <div style={{
                    background: "#fff",
                    borderRadius: "20px",
                    padding: "24px",
                    height: isBento ? "100%" : "200px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    border: "1px solid #f3f4f6",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
                        Sponsored
                    </span>
                    <h3 style={{ color: "#111827", fontSize: "17px", fontWeight: 700, margin: "0 0 12px 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {title}
                    </h3>
                    <div style={{ color: "#157A4F", fontSize: "20px", fontWeight: 700, margin: "0 0 16px 0", marginTop: "auto" }}>
                        {formattedPrice}
                    </div>
                    <ButtonGroup />
                </div>
            </Link>
        );
    }


    // ─── Template 2: Small Image Card ────────────────────────────────────────
    return (
        <Link href={`/product/${linkId}`} style={{ textDecoration: "none" }}>
            <div style={{
                position: "relative",
                borderRadius: "20px",
                overflow: "hidden",
                height: isBento ? "100%" : "200px",
                minHeight: "200px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
            }}>
                {hasImages ? (
                    <img
                        src={validImages[0]}
                        alt={title}
                        onError={() => setImgError(true)}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{ position: "absolute", inset: 0, background: "#333" }} />
                )}

                {/* Dark Gradient Overlay */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
                    pointerEvents: "none"
                }} />

                {/* Content Overlay */}
                <div style={{ position: "relative", zIndex: 5, padding: "20px" }}>
                    <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 600, margin: "0 0 6px 0", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {title}
                    </h3>
                    <div style={{ color: "#FBBF24", fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0" }}>
                        {formattedPrice}
                    </div>
                    <ButtonGroup />
                </div>
            </div>
        </Link>
    );
}
