"use client";

import { use, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "./../../components/Navbar";
import Footer from "./../../components/Footer";
import Recommended from "@/app/components/Recommended";
import { getAdById, toggleWishlist, getWishlistIds, getAdWishlistCount } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
	Heart,
	Share2,
	MapPin,
	Star,
	Phone,
	MessageCircle,
	Loader2,
	Flag,
} from "lucide-react";
import ReportModal from "@/app/components/ReportModal";
import UserReportModal from "@/app/components/UserReportModal";
import AuthRequiredModal from "@/app/components/AuthRequiredModal";

export default function ProductDetails({ params }) {
	const resolvedParams = use(params);
	const adId = resolvedParams?.id;
	const router = useRouter();
	const refreshTimerRef = useRef(null);

	const [ad, setAd] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedImage, setSelectedImage] = useState(0);
	const [isWishlisted, setIsWishlisted] = useState(false);
	const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
	const [wishlistCount, setWishlistCount] = useState(null);
	const [showReportModal, setShowReportModal] = useState(false);
	const [showUserReportModal, setShowUserReportModal] = useState(false);
	const [showAuthPrompt, setShowAuthPrompt] = useState(false);
	const [authPromptDescription, setAuthPromptDescription] = useState("Please log in or create an account to continue.");
	const { isAuthenticated } = useAuth();

	const getSafeImageSrc = (value) => {
		if (!value || typeof value !== "string") return "/images/placeholder.webp";
		const src = value.trim();
		if (!src) return "/images/placeholder.webp";
		if (src.startsWith("/")) return src;
		if (src.startsWith("http://") || src.startsWith("https://")) return src;
		return "/images/placeholder.webp";
	};

	useEffect(() => {
		let cancelled = false;

		async function fetchAd(silent = false) {
			if (!adId) return;

			if (!silent) {
				setLoading(true);
				setError("");
			}

			try {
				const response = await getAdById(adId);

				if (cancelled) return;

				if (response.success && response.data) {
					setAd(response.data);
					setSelectedImage((current) => {
						const imageCount = Array.isArray(response.data?.images) ? response.data.images.length : 0;
						return imageCount > 0 ? Math.min(current, imageCount - 1) : 0;
					});
					setError("");
				} else if (!silent) {
					setError("Ad not found");
				}
			} catch (err) {
				if (!cancelled && !silent) {
					console.error('[Product Page] Error loading ad:', err);
					setError("Failed to load ad details");
				}
			} finally {
				if (!cancelled && !silent) {
					setLoading(false);
				}
			}
		}

		fetchAd(false);

		if (refreshTimerRef.current) {
			clearInterval(refreshTimerRef.current);
		}

		refreshTimerRef.current = setInterval(() => {
			fetchAd(true);
		}, 15000);

		return () => {
			cancelled = true;
			if (refreshTimerRef.current) {
				clearInterval(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
		};
	}, [adId]);

	useEffect(() => {
		async function fetchWishlistCount() {
			const wishlistAdId = ad?.adId || adId;
			if (!wishlistAdId) return;
			try {
				const res = await getAdWishlistCount(wishlistAdId);
				if (res.success) {
					setWishlistCount(res.data.wishlistCount ?? 0);
				}
			} catch {
				// silently ignore
			}
		}
		fetchWishlistCount();
	}, [ad?.adId, adId]);

	useEffect(() => {
		async function checkWishlist() {
			if (!adId || !isAuthenticated) return;
			try {
				const response = await getWishlistIds();
				if (response.success && Array.isArray(response.data)) {
					const ids = response.data;
					const wishlisted = ids.includes(adId) || (ad?.adId && ids.includes(ad.adId));
					setIsWishlisted(!!wishlisted);
				}
			} catch (err) {
				console.error("Failed to fetch wishlist status:", err);
			}
		}
		checkWishlist();
	}, [adId, ad, isAuthenticated]);

	const handleToggleWishlist = async () => {
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		const wishlistId = ad?.adId || adId;

		setIsTogglingWishlist(true);
		try {
			const response = await toggleWishlist(wishlistId);
			if (response.success) {
				setIsWishlisted(response.data.added);
				setWishlistCount((prev) =>
					prev === null ? null : response.data.added ? prev + 1 : Math.max(0, prev - 1)
				);
			}
		} catch (err) {
			console.error("Failed to toggle wishlist:", err);
		} finally {
			setIsTogglingWishlist(false);
		}
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: ad?.title || "Check out this ad",
					text: `Check out ${ad?.title} on GOLO`,
					url: window.location.href,
				});
			} catch (error) {
				console.error("Error sharing:", error);
			}
		} else {
			try {
				await navigator.clipboard.writeText(window.location.href);
				alert("Link copied to clipboard!");
			} catch (err) {
				console.error("Failed to copy link:", err);
			}
		}
	};

	const hasRealImages = Array.isArray(ad?.images) && ad.images.length > 0;
	const isTextOnlyAd = ad?.templateId === 3 || !hasRealImages;
	const images = hasRealImages ? ad.images.map(getSafeImageSrc) : [];
	const isExternalImage = hasRealImages;

	const formatFieldLabel = (key) =>
		key
			.replace(/([A-Z])/g, " $1")
			.replace(/_/g, " ")
			.replace(/^./, (char) => char.toUpperCase())
			.trim();

	const stringifyValue = (value) => {
		if (value === null || value === undefined || value === "") return "-";
		if (Array.isArray(value)) {
			if (value.length === 0) return "-";
			return value
				.map((item) => {
					if (item === null || item === undefined) return "";
					if (typeof item === "object") {
						return Object.entries(item)
							.map(([nestedKey, nestedValue]) => `${formatFieldLabel(nestedKey)}: ${stringifyValue(nestedValue)}`)
							.join(" | ");
					}
					return stringifyValue(item);
				})
				.filter(Boolean)
				.join(", ");
		}
		if (typeof value === "boolean") return value ? "Yes" : "No";
		if (value instanceof Date) {
			return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
		}
		if (typeof value === "string") {
			const isoDate = new Date(value);
			if (!Number.isNaN(isoDate.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
				return isoDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
			}
			return value;
		}
		if (typeof value === "object") {
			return Object.entries(value)
				.filter(([nestedKey]) => !["_id", "__v"].includes(nestedKey))
				.map(([nestedKey, nestedValue]) => `${formatFieldLabel(nestedKey)}: ${stringifyValue(nestedValue)}`)
				.join(" | ");
		}
		return String(value);
	};

	const parseNumericValue = (value) => {
		if (value === null || value === undefined || value === "") return null;
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const normalized = value.replace(/[^0-9.]/g, "");
			if (!normalized) return null;
			const parsed = Number(normalized);
			return Number.isFinite(parsed) ? parsed : null;
		}
		return null;
	};

	const hasDisplayValue = (value) => {
		if (value === null || value === undefined) return false;
		if (typeof value === "string") return value.trim().length > 0;
		if (Array.isArray(value)) return value.length > 0;
		if (typeof value === "object") return Object.keys(value).length > 0;
		return true;
	};

	const basicInformationEntries = [
		["Title", ad?.title],
		["Description", ad?.description],
		["Contact", ad?.primaryContact || ad?.contactInfo?.phone],
		["Category", ad?.category],
	].filter(([, value]) => hasDisplayValue(value));

	const categoryDataSource = [
		ad?.categorySpecificData,
		ad?.educationData,
		ad?.matrimonialData,
		ad?.vehicleData,
		ad?.businessData,
		ad?.travelData,
		ad?.astrologyData,
		ad?.propertyData,
		ad?.publicNoticeData,
		ad?.lostFoundData,
		ad?.serviceData,
		ad?.personalData,
		ad?.employmentData,
		ad?.petsData,
		ad?.mobileData,
		ad?.electronicsData,
		ad?.furnitureData,
		ad?.greetingsData,
		ad?.otherData,
	].reduce((acc, item) => {
		if (item && typeof item === "object" && !Array.isArray(item)) {
			return { ...acc, ...item };
		}
		return acc;
	}, {});

	const resolvedDisplayPrice = (() => {
		const candidates = [
			ad?.price,
			categoryDataSource?.price,
			categoryDataSource?.rent,
			categoryDataSource?.askingPrice,
			categoryDataSource?.rentAmount,
			categoryDataSource?.fees,
			categoryDataSource?.pricePerPerson,
			categoryDataSource?.consultationFee,
			categoryDataSource?.reward,
			categoryDataSource?.salary,
			categoryDataSource?.charges,
		];

		for (const candidate of candidates) {
			const parsed = parseNumericValue(candidate);
			if (parsed !== null && parsed > 0) return parsed;
		}

		return null;
	})();

	const categorySpecificEntries = Object.keys(categoryDataSource).length > 0
		? Object.entries(categoryDataSource).filter(
			([key, value]) => !["_id", "__v"].includes(key) && hasDisplayValue(value)
		)
		: [];

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center">
					<div className="flex flex-col items-center gap-3">
						<Loader2 size={32} className="animate-spin text-[#157A4F]" />
						<p className="text-gray-500">Loading ad details...</p>
					</div>
				</div>
				<Footer />
			</>
		);
	}

	if (error) {
		return (
			<>
				<Navbar />
				<div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center">
					<div className="text-center">
						<p className="text-xl font-semibold text-gray-700 mb-2">{error}</p>
						<p className="text-gray-500">The ad you&apos;re looking for might have been removed</p>
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
				<div className="max-w-7xl mx-auto px-6 py-10">
					<p className="text-sm text-gray-500 mb-6">
						Home &nbsp;›&nbsp; {ad?.category || "Category"} &nbsp;›&nbsp; {ad?.subCategory || "Sub Category"} &nbsp;›&nbsp;
						<span className="text-gray-800 font-medium">
							{ad?.title || "Product"}
						</span>
					</p>

					<div className="grid md:grid-cols-3 gap-10">
						<div className="md:col-span-2">
							{isTextOnlyAd ? (
								<div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
									<div className="flex flex-wrap items-center gap-3 mb-6">
										<span className="text-xs font-semibold bg-[#EAF6F0] text-[#157A4F] px-3 py-1 rounded-full">
											Text Only Ad
										</span>
										<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
											{ad?.category || "General"}
										</span>
										{ad?.subCategory && (
											<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
												{ad.subCategory}
											</span>
										)}
									</div>

									<div className="max-w-4xl">
										<h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
											{ad?.title || "Text Ad"}
										</h1>
										{ad?.description && (
											<div className="mt-6 rounded-2xl bg-[#F8F6F2] border border-gray-200 p-6">
												<p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-3">
													Posted Content
												</p>
												<p className="text-base md:text-lg text-gray-700 leading-8 whitespace-pre-wrap break-words">
													{ad.description}
												</p>
											</div>
										)}
									</div>
								</div>
							) : (
								<div className="flex gap-6">
									<div className="flex flex-col gap-4">
										{images.map((img, index) => (
											<div
												key={index}
												onClick={() => setSelectedImage(index)}
												className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition
													${selectedImage === index
														? "border-[#157A4F]"
														: "border-gray-200 hover:border-[#157A4F]"
													}`}
											>
												<Image
													src={img}
													width={100}
													height={100}
													alt={`thumbnail-${index}`}
													className="object-cover w-full h-full"
													unoptimized={isExternalImage}
												/>
											</div>
										))}
									</div>

									<div className="flex-1 bg-white p-6 rounded-2xl shadow-sm relative border border-gray-200">
										<Image
											src={images[selectedImage]}
											width={900}
											height={600}
											alt={ad?.title || "Product"}
											className="rounded-xl w-full object-cover transition-all duration-300"
											unoptimized={isExternalImage}
										/>
										<div className="absolute bottom-8 right-10 bg-[#157A4F] text-white text-xs px-3 py-1 rounded-full">
											{selectedImage + 1} / {images.length} Photos
										</div>
									</div>
								</div>
							)}

							{!isTextOnlyAd && (
								<div className="flex gap-3 mt-8">
									{ad?.isPromoted && (
										<span className="text-xs font-semibold bg-[#FFF3D6] text-[#157A4F] px-3 py-1 rounded-full">
											Featured Ad
										</span>
									)}
									<span className="text-xs font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
										{ad?.category || "General"}
									</span>
									{ad?.subCategory && (
										<span className="text-xs font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
											{ad.subCategory}
										</span>
									)}
								</div>
							)}

							<div className={`flex justify-between items-start ${isTextOnlyAd ? "mt-6" : "mt-4"}`}>
								{!isTextOnlyAd && (
									<h1 className="text-2xl font-bold text-gray-800 w-4/5">
										{ad?.title || "Product Title"}
									</h1>
								)}

								<div className="flex flex-col items-end gap-2">
									<div className="flex gap-3 text-gray-400">
										<button
											onClick={handleToggleWishlist}
											disabled={isTogglingWishlist}
											className="focus:outline-none"
											title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
										>
											<Heart
												className={`cursor-pointer transition ${isWishlisted ? "text-red-500 fill-red-500" : "hover:text-[#F5B849]"}`}
												size={20}
											/>
										</button>
										<button onClick={handleShare} className="focus:outline-none" title="Share">
											<Share2 className="cursor-pointer hover:text-[#F5B849] transition" size={20} />
										</button>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-6 text-sm text-gray-500 mt-3">
								<span>
									Posted{" "}
									{ad?.createdAt
										? new Date(ad.createdAt).toLocaleDateString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})
										: "recently"}
								</span>
								<span className="flex items-center gap-1">
									<MapPin size={14} />
									{ad?.location || "Location not specified"}
								</span>
								<span className="flex items-center gap-1">
									<Star size={14} className="text-[#F5B849] fill-[#F5B849]" />
									{(ad?.viewHistory?.length ?? ad?.views ?? 0)} views
								</span>
								{wishlistCount !== null && (
									<span className="flex items-center gap-1 text-rose-500">
										<Heart size={14} className="fill-rose-400 text-rose-400" />
										{wishlistCount.toLocaleString()}
									</span>
								)}
							</div>

							{basicInformationEntries.length > 0 && (
								<div className="bg-white p-6 rounded-2xl shadow-sm mt-6 border border-gray-200">
									<h2 className="font-semibold text-lg mb-4">Basic Information</h2>
									<div className="grid sm:grid-cols-2 gap-3">
										{basicInformationEntries.map(([label, value]) => (
											<div key={label} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
												<p className="text-xs text-gray-500 mb-1">{label}</p>
												<p className="text-sm font-medium text-gray-800 break-words">{stringifyValue(value)}</p>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="bg-white p-6 rounded-2xl shadow-sm mt-6 border border-gray-200">
								<h2 className="font-semibold text-lg mb-4">
									{ad?.category || "Category"} Details
								</h2>

								<div className="grid sm:grid-cols-2 gap-3">
									{categorySpecificEntries.length > 0 ? (
										categorySpecificEntries.map(([key, value]) => (
											<div key={key} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
												<p className="text-xs text-gray-500 mb-1">{formatFieldLabel(key)}</p>
												<p className="text-sm font-medium text-gray-800 break-words">{stringifyValue(value)}</p>
											</div>
										))
									) : (
										<div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 sm:col-span-2">
											<p className="text-sm text-gray-600">No category details available.</p>
										</div>
									)}
								</div>
							</div>
						</div>

						<div>
							<div className="sticky top-24 space-y-6">
								<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
									<div className="flex justify-between items-center">
										{resolvedDisplayPrice !== null ? (
											<p className="text-gray-500 font-medium">
												{ad?.negotiable ? "Negotiable Price" : "Final Price"}
											</p>
										) : <span />}
										<div className="flex items-center gap-1 text-sm text-gray-600">
											<Star size={14} className="text-[#F5B849] fill-[#F5B849]" />
											{ad?.viewHistory?.length ?? ad?.views ?? 0}
										</div>
									</div>

									{resolvedDisplayPrice !== null && (
										<h2 className="text-3xl font-bold mt-3 text-[#157A4F]">
											₹{resolvedDisplayPrice.toLocaleString("en-IN")}
										</h2>
									)}

									<button
										onClick={() => {
											if (!isAuthenticated) {
												setAuthPromptDescription("Please log in or register to chat with the seller.");
												setShowAuthPrompt(true);
												return;
											}
											router.push(`/chats?adId=${ad?.adId || ad?._id || adId}&sellerId=${ad?.userId || ''}`);
										}}
										className="w-full mt-6 py-3 rounded-xl bg-[#157A4F] hover:bg-[#0f5c3a] text-white font-semibold flex items-center justify-center gap-2 transition"
									>
										<MessageCircle size={18} />
										Chat with Seller
									</button>

									<button
										onClick={() => {
											if (!isAuthenticated) {
												setAuthPromptDescription("Please log in or register to call the seller.");
												setShowAuthPrompt(true);
												return;
											}
											router.push(`/chats?adId=${ad?.adId || ad?._id || adId}&sellerId=${ad?.userId || ''}&autoCall=1`);
										}}
										className="w-full mt-4 py-3 rounded-xl bg-[#F5B849] hover:bg-[#e0a837] text-white font-semibold flex items-center justify-center gap-2 transition"
									>
										<Phone size={18} />
										Call for Details
									</button>
								</div>

								<div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
									<p className="text-sm font-semibold text-gray-800 mb-3">Ad Uploader Details</p>
									<div className="flex items-start gap-3">
										<div className="w-11 h-11 rounded-full bg-[#ecf8f1] text-[#157A4F] font-bold flex items-center justify-center shrink-0">
											{(ad?.contactInfo?.name || ad?.contactInfo?.sellerName || ad?.sellerName || ad?.title || "U").charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-semibold text-gray-800 truncate">
												{ad?.contactInfo?.name || ad?.contactInfo?.sellerName || ad?.sellerName || "Seller"}
											</p>
											<p className="text-xs text-gray-500 mt-0.5 break-all">
												{ad?.contactInfo?.phone || ad?.primaryContact || "Phone not provided"}
											</p>
											{ad?.contactInfo?.email && (
												<p className="text-xs text-gray-500 mt-0.5 break-all">
													{ad.contactInfo.email}
												</p>
											)}
											{ad?.contactInfo?.city && (
												<p className="text-xs text-gray-400 mt-1">
													📍 {ad.contactInfo.city}
												</p>
											)}
										</div>
									</div>

									<button
										onClick={() => router.push(`/profile/${ad?.userId}`)}
										className="w-full mt-4 py-2 rounded-xl border-2 border-[#157A4F] text-[#157A4F] hover:bg-[#157A4F] hover:text-white hover:border-[#0f5c3a] font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] text-sm"
									>
										<span className="inline-flex items-center gap-1">
											<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>
											View Profile
										</span>
									</button>
								</div>

								<button
									onClick={() => setShowReportModal(true)}
									className="w-full mt-4 py-3 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-600 font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
								>
									<Flag size={18} />
									Report this Ad
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Recommended />
			<Footer />

			<ReportModal
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
				adId={ad?.adId || adId}
				adTitle={ad?.title}
			/>

			<UserReportModal
				isOpen={showUserReportModal}
				onClose={() => setShowUserReportModal(false)}
				userId={ad?.userId}
				userName={ad?.contactInfo?.name || ad?.contactInfo?.sellerName || ad?.sellerName || "Seller"}
			/>

			<AuthRequiredModal
				isOpen={showAuthPrompt}
				onClose={() => setShowAuthPrompt(false)}
				title="Login or Register"
				description={authPromptDescription}
				redirectTo={`/product/${adId}`}
			/>
		</>
	);
}
