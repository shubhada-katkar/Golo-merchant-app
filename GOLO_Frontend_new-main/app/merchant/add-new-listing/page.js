"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronLeft, Circle, ClipboardList, Clock3, Plus, Search, Star, Trash2, User, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MerchantNavbar from "../MerchantNavbar";

const inventoryProducts = [
  { id: 1, name: "Shirts", price: "₹240", stock: 45, image: "/images/deal2.avif" },
  { id: 2, name: "Pants", price: "₹299", stock: 8, image: "/images/place2.avif" },
  { id: 3, name: "Skirts", price: "₹550", stock: 0, image: "/images/banner3.avif" },
  { id: 4, name: "Dress", price: "₹1000", stock: 22, image: "/images/deal2.avif" },
  { id: 5, name: "T - Shirt", price: "₹320", stock: 124, image: "/images/place2.avif" },
  { id: 6, name: "Shirts", price: "₹240", stock: 45, image: "/images/deal2.avif" },
  { id: 7, name: "Skirts", price: "₹550", stock: 0, image: "/images/banner3.avif" },
];

export default function AddNewListingPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState(new Set([1, 2, 4, 6]));
  const [draftSelectedProductIds, setDraftSelectedProductIds] = useState(new Set([1, 2, 4, 6]));

  const filteredProducts = inventoryProducts.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedItemsCount = selectedProductIds.size;
  const selectedProducts = inventoryProducts.filter((product) => selectedProductIds.has(product.id));

  const getOfferPrice = (product) => {
    const offers = {
      1: "₹200",
      2: "₹250",
      3: "₹500",
      4: "₹860",
      5: "₹280",
      6: "₹200",
      7: "₹500",
    };
    return offers[product.id] || product.price;
  };

  const handleMerchantLogout = async () => {
    await logout();
    router.push("/login");
  };

  const openProductModal = () => {
    setDraftSelectedProductIds(new Set(selectedProductIds));
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductSearch("");
  };

  const toggleProductSelection = (productId, stock) => {
    if (stock <= 0) return;
    setDraftSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSaveProductSelection = () => {
    setSelectedProductIds(new Set(draftSelectedProductIds));
    closeProductModal();
  };

  const removeSelectedProduct = (productId) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/merchant/add-new-listing");
      return;
    }

    if (!loading && user && user.accountType !== "merchant") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  if (user.accountType !== "merchant") return null;

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <MerchantNavbar activeKey="products" />

      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-4">
          <div className="flex items-center gap-3 text-[#222]">
            <button
              type="button"
              onClick={() => router.push("/merchant/dashboard")}
              className="h-8 w-8 rounded-full border border-[#9ca3af] bg-white flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <h1 className="text-[36px] font-semibold leading-none">Create New Offer</h1>
          </div>

          <section className="rounded-[12px] border border-[#d9d9d9] bg-white p-7">
            <div className="inline-flex items-center gap-2 text-[30px] font-semibold text-[#1f1f1f]">
              <Clock3 size={20} className="text-[#f0aa19]" />
              Offer Details
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-[14px] font-semibold mb-1.5">Offer Title</label>
                <input
                  defaultValue=""
                  placeholder="e.g. Diwali Dhamaka"
                  className="h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold mb-1.5">Start Date</label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]" />
                    <input defaultValue="2024-05-20" className="h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] pl-9 pr-3 text-[13px] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold mb-1.5">End Date</label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]" />
                    <input defaultValue="2024-06-20" className="h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] pl-9 pr-3 text-[13px] outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-semibold mb-1.5">Promotion Expiry</label>
                <div className="relative">
                  <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]" />
                  <input defaultValue="Offer ends in 30 days" className="h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] pl-9 pr-3 text-[13px] outline-none" />
                </div>
                <p className="mt-1 text-[11px] italic text-[#8b8b8b]">Automatically calculated based on campaign end date.</p>
              </div>

              <div>
                <label className="block text-[14px] font-semibold mb-1.5">Type of Offer</label>
                <select className="h-10 w-full md:w-[48%] rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 text-[13px] outline-none">
                  <option>e.g. 5% Discount, ₹100 OFF</option>
                </select>
              </div>
            </div>

            <div className="my-7 h-[2px] bg-[#f0aa19]" />

            <div className="rounded-[10px] border border-[#ececec] bg-[#fffdf9] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-semibold">Loyalty Reward</p>
                <button
                  type="button"
                  onClick={() => setLoyaltyEnabled((v) => !v)}
                  className={`h-7 w-14 rounded-full p-1 transition ${loyaltyEnabled ? "bg-[#f0aa19]" : "bg-[#d1d5db]"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white transition ${loyaltyEnabled ? "translate-x-7" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-[12px] text-[#5f5f5f]">Reward customers for their repeat purchases.</p>
                  <p className="text-[12px] mt-4">Stars to be offered</p>
                  <div className="mt-2 flex items-center gap-4">
                    <input defaultValue="No. of stars" className="h-9 w-[180px] rounded-[8px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 text-[12px]" />
                    <div className="flex items-center gap-1 text-[#f0aa19]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#efe3c5] bg-[#fff7e5] p-3">
                  <p className="text-[11px] italic text-[#8b8b8b]">Number of stars awarded on purchase</p>
                  <div className="inline-flex mt-2 rounded-full bg-[#f0aa19] text-white text-[10px] font-semibold px-3 py-1">Active Strategy</div>
                  <p className="mt-2 text-[11px] text-[#4d4d4d]">Currently, 1 star is equivalent to ₹5.00 in store credit.</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="inline-flex items-center gap-2 text-[16px] font-semibold">
                <ClipboardList size={16} />
                Terms & Conditions
              </div>
              <textarea
                defaultValue={"• Valid only on specified products.\n• Limited to 1 use per customer."}
                className="mt-2 h-[86px] w-full rounded-[10px] border border-[#d9d9d9] bg-[#f7f7f7] px-3 py-2 text-[13px] outline-none"
              />
            </div>

            <div className="mt-4 rounded-[10px] bg-[#f7f7f7] px-4 py-3">
              <p className="text-[12px] font-semibold">Example Usage:</p>
              <p className="text-[11px] text-[#6a6a6a] mt-1">Shop for ₹3,000 and earn 1 star. Once you collect all the stars, enjoy a 50% discount on shopping above ₹2,000.</p>
            </div>

            <div className="mt-6 text-center">
              <button className="h-10 w-[320px] max-w-full rounded-[10px] bg-[#f0aa19] text-white text-[14px] font-semibold">Publish Offer</button>
              <div className="mt-3 text-[12px] text-[#6a6a6a]">
                <button className="hover:underline">Save as Template</button>
                <span className="mx-2">|</span>
                <button className="text-[#d04a4a] hover:underline">Discard Changes</button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={openProductModal}
              className="inline-flex items-center justify-between rounded-[8px] border border-[#c4ccd9] bg-white px-4 py-3 min-w-[310px] text-left"
            >
              <div>
                <p className="text-[16px] font-semibold text-[#2a2a2a]">Add Products</p>
                <p className="text-[11px] text-[#7a7a7a]">Choose products to include in this special promotional bundle</p>
              </div>
              <span className="h-8 px-3 rounded-full bg-[#21b152] text-white text-[11px] inline-flex items-center">{selectedItemsCount} items Total</span>
            </button>

            {selectedProducts.length === 0 ? (
              <button
                type="button"
                onClick={openProductModal}
                className="h-[230px] w-full rounded-[10px] border border-[#c2c9d5] bg-white text-[#252525]"
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="mb-3 h-9 w-9 rounded-full border border-[#6b7280] text-[#5d6470] flex items-center justify-center">
                    <Plus size={18} />
                  </span>
                  <p className="text-[31px] leading-none">Click to add products from your inventory</p>
                </div>
              </button>
            ) : (
              <div className="rounded-[10px] border border-[#c2c9d5] bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="rounded-[10px] border border-[#e5e7eb] bg-[#fafafa] p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Image src={product.image} alt={product.name} width={50} height={50} className="h-[50px] w-[50px] rounded-[8px] object-cover" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#202020]">{product.name}</p>
                          <p className="text-[11px] text-[#9b9b9b] line-through">Original: {product.price}</p>
                          <p className="text-[22px] leading-none font-semibold text-[#198f3f] mt-1">Offer Price: {getOfferPrice(product)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(product.id)}
                        className="text-[#6c6c6c] hover:text-[#2f2f2f]"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/35 backdrop-blur-[1px] flex items-center justify-center px-4" onClick={closeProductModal}>
          <div className="w-full max-w-[980px] rounded-[8px] bg-white shadow-2xl border border-[#d7d7d7] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#dfdfdf]">
              <h2 className="text-[40px] leading-none font-semibold text-[#1f1f1f]">Choose Products</h2>
              <div className="mt-4 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f7f7f]" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by product name"
                  className="h-10 w-full rounded-[8px] border border-[#d9d9d9] bg-[#fbfbfb] pl-9 pr-10 text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-0">
              <div className="grid grid-cols-[100px_1.3fr_0.8fr_0.8fr_0.8fr] bg-[#f6f6f6] text-[12px] text-[#2f2f2f] px-4 py-3 border-b border-[#dfdfdf]">
                <p>Image</p>
                <p>Product Name</p>
                <p>Price</p>
                <p>Stock</p>
                <p className="text-center">Click to Select</p>
              </div>

              <div className="max-h-[350px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isSelected = draftSelectedProductIds.has(product.id);
                  return (
                    <div key={product.id} className="grid grid-cols-[100px_1.3fr_0.8fr_0.8fr_0.8fr] px-4 py-3 border-b border-[#ececec] text-[13px] items-center">
                      <div className="flex items-center">
                        <Image src={product.image} alt={product.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                      </div>
                      <p className="font-medium text-[#2d2d2d]">{product.name}</p>
                      <p className="font-semibold text-[#1f1f1f]">{product.price}</p>
                      <p className={product.stock <= 0 ? "text-[#e14d4d]" : "text-[#2f2f2f]"}>{product.stock} units</p>
                      <button
                        type="button"
                        onClick={() => toggleProductSelection(product.id, product.stock)}
                        className="inline-flex justify-center"
                      >
                        {isSelected ? (
                          <CheckCircle2 size={18} className="text-[#22b15d]" />
                        ) : (
                          <Circle size={18} className={product.stock <= 0 ? "text-[#232323]" : "text-[#232323]"} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-[#eef0f3] flex items-center justify-end gap-3">
              <button type="button" onClick={closeProductModal} className="h-8 px-5 rounded-[10px] border border-[#a7acb3] bg-white text-[12px] text-[#555]">
                Cancel
              </button>
              <button type="button" onClick={handleSaveProductSelection} className="h-8 px-6 rounded-[10px] border border-[#6ac78b] bg-[#ecfff2] text-[12px] font-semibold text-[#1ca451]">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-[20px] font-bold">Links</p>
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
