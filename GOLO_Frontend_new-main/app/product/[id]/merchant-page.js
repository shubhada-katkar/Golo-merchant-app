"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Recommended from "@/app/components/Recommended";
import { getAdById, getMerchantProductById } from "../../lib/api";

function MerchantProductSkeleton() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8F6F2]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-6 h-4 w-72 animate-pulse rounded bg-[#dedbd3]" />
          <div className="grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex gap-6">
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 w-20 animate-pulse rounded-xl bg-[#dedbd3]" />
                  ))}
                </div>
                <div className="h-[430px] flex-1 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-7 w-3/5 animate-pulse rounded bg-[#dedbd3]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#e8e5dd]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#e8e5dd]" />
                <div className="flex gap-4 pt-2">
                  <div className="h-7 w-24 animate-pulse rounded-full bg-[#e8e5dd]" />
                  <div className="h-7 w-28 animate-pulse rounded-full bg-[#e8e5dd]" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              <div className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function MerchantProductDetails({ params }) {
  const { id: productId } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const normalizeProduct = (raw) => {
    if (!raw) return null;
    return {
      _id: raw?._id || raw?.id || "",
      name: raw?.name || raw?.title || raw?.productName || "Product",
      description: raw?.description || "No description provided.",
      category: raw?.category || "General",
      subCategory: raw?.subCategory || "",
      price: Number(raw?.price ?? raw?.offerPrice ?? 0),
      offerPrice: Number(raw?.offerPrice ?? raw?.price ?? 0),
      originalPrice: Number(raw?.originalPrice ?? 0),
      stockQuantity:
        raw?.stockQuantity !== undefined && raw?.stockQuantity !== null
          ? Number(raw.stockQuantity)
          : undefined,
      imageUrl: raw?.imageUrl || raw?.image || "",
      images: Array.isArray(raw?.images) ? raw.images : [],
      merchantId:
        raw?.merchantId || raw?.merchant?._id || raw?.merchant?.id || "",
      merchantName: raw?.merchantName || raw?.merchant?.name || "",
      merchantPhone: raw?.merchantPhone || raw?.merchant?.phone || "",
      merchant: raw?.merchant || null,
    };
  };

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        let normalized = null;

        try {
          const merchantRes = await getMerchantProductById(productId);
          normalized = normalizeProduct(merchantRes?.data);
        } catch {
          normalized = null;
        }

        if (!normalized?._id) {
          const adRes = await getAdById(productId);
          normalized = normalizeProduct(adRes?.data);
        }

        if (!normalized?._id) throw new Error("Product not found");
        setProduct(normalized);
        setError("");
      } catch (err) {
        setError(err?.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  if (loading) {
    return <MerchantProductSkeleton />;
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="bg-[#F8F6F2] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-700 mb-2">{error}</p>
            <p className="text-gray-500">The product you&apos;re looking for might have been removed</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : [product?.imageUrl || "/images/placeholder.webp"];

  return (
    <>
      <Navbar />
      <div className="bg-[#F8F6F2] min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <p className="text-sm text-gray-500 mb-6">
            Home &nbsp;›&nbsp; {product?.category || "Category"} &nbsp;›&nbsp;
            <span className="text-gray-800 font-medium">{product?.name || "Product"}</span>
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            {/* LEFT SECTION */}
            <div className="md:col-span-2">
              <div className="flex gap-6">
                {/* Thumbnails */}
                <div className="flex flex-col gap-4">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition ${selectedImage === index ? "border-[#157A4F]" : "border-gray-200 hover:border-[#157A4F]"}`}
                    >
                      <Image src={img} width={100} height={100} alt={`thumbnail-${index}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
                {/* Main Image */}
                <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm relative border border-gray-200">
                  <Image
                    src={images[selectedImage]}
                    width={900}
                    height={600}
                    alt={product?.name || "Product"}
                    className="rounded-xl w-full object-cover transition-all duration-300"
                  />
                  <div className="absolute bottom-8 right-10 bg-[#157A4F] text-white text-xs px-3 py-1 rounded-full">
                    {selectedImage + 1} / {images.length} Photos
                  </div>
                </div>
              </div>
              {/* Title & Description */}
              <div className="mt-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{product?.name || "Product Title"}</h1>
                <p className="text-gray-700 text-base whitespace-pre-line mb-4">{product?.description || "No description provided."}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-sm bg-[#FFF3D6] text-[#157A4F] px-3 py-1 rounded-full font-semibold">{product?.category || "General"}</span>
                  {product?.subCategory && (
                    <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-semibold">{product.subCategory}</span>
                  )}
                  {product?.stockQuantity !== undefined && (
                    <span className="text-sm bg-[#EAF6F0] text-[#157A4F] px-3 py-1 rounded-full font-semibold">Stock: {product.stockQuantity}</span>
                  )}
                </div>
              </div>
            </div>
            {/* RIGHT SIDEBAR */}
            <div>
              <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 font-medium">Price</p>
                  </div>
                  <h2 className="text-3xl font-bold mt-3 text-[#157A4F]">
                    ₹{Number(product?.offerPrice || product?.price || 0).toLocaleString("en-IN")}
                  </h2>
                  {product?.originalPrice && product?.originalPrice > product?.offerPrice && (
                    <p className="text-sm text-gray-400 line-through mt-1">
                      ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                    </p>
                  )}
                  <button
                    onClick={() => router.push(`/chats?productId=${product?._id || productId}&sellerId=${product?.merchantId || ""}`)}
                    className="w-full mt-6 py-3 rounded-xl bg-[#157A4F] hover:bg-[#0f5c3a] text-white font-semibold flex items-center justify-center gap-2 transition"
                  >
                    Chat with Seller
                  </button>
                </div>
                {/* Merchant Info */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <p className="text-sm font-semibold text-gray-800 mb-3">Merchant Details</p>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#ecf8f1] text-[#157A4F] font-bold flex items-center justify-center shrink-0">
                      {(product?.merchant?.name || product?.merchantName || "M").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{product?.merchant?.name || product?.merchantName || "Merchant"}</p>
                      <p className="text-xs text-gray-500 mt-0.5 break-all">{product?.merchant?.phone || product?.merchantPhone || "Phone not provided"}</p>
                      {product?.merchant?.email && (
                        <p className="text-xs text-gray-500 mt-0.5 break-all">{product.merchant.email}</p>
                      )}
                      {product?.merchant?.city && (
                        <p className="text-xs text-gray-400 mt-1">📍 {product.merchant.city}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Recommended />
      <Footer />
    </>
  );
}
