"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, CircleCheck, Search, X } from "lucide-react";
import { getMerchantProducts } from "../../../lib/api";

function normalizeProducts(products = []) {
  return Array.isArray(products)
    ? products
        .map((item) => ({
          productId: String(item?.productId || item?.id || ""),
          productName: String(item?.productName || item?.name || "Product"),
          imageUrl: String(item?.imageUrl || item?.image || item?.images?.[0] || ""),
          originalPrice: Number(item?.originalPrice || item?.price || 0),
          offerPrice: Number(item?.offerPrice || item?.price || 0),
          stockQuantity: Number(item?.stockQuantity || item?.stock || 0),
        }))
        .filter((item) => item.productId)
    : [];
}

export default function OfferProductEditor({ value = [], onChange }) {
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [modalSelectionIds, setModalSelectionIds] = useState([]);
  const [error, setError] = useState("");

  const selectedProducts = useMemo(() => normalizeProducts(value), [value]);

  useEffect(() => {
    let cancelled = false;

    async function loadMerchantProducts() {
      setLoadingProducts(true);
      setError("");

      try {
        const pageSize = 100;
        const firstRes = await getMerchantProducts({ page: 1, limit: pageSize });
        const firstRows = Array.isArray(firstRes?.data?.products) ? firstRes.data.products : [];
        const totalPages = Number(firstRes?.pagination?.pages || 1);

        if (cancelled) return;

        if (totalPages <= 1) {
          setInventoryProducts(firstRows);
          return;
        }

        const allRows = [...firstRows];
        for (let page = 2; page <= totalPages; page += 1) {
          const nextRes = await getMerchantProducts({ page, limit: pageSize });
          const nextRows = Array.isArray(nextRes?.data?.products) ? nextRes.data.products : [];
          allRows.push(...nextRows);
        }

        if (!cancelled) {
          setInventoryProducts(allRows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load inventory products.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    loadMerchantProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInventory = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    if (!needle) return inventoryProducts;

    return inventoryProducts.filter((row) =>
      String(row?.name || "").toLowerCase().includes(needle),
    );
  }, [inventoryProducts, productSearch]);

  const totalOfferValue = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + Number(item.offerPrice || 0), 0),
    [selectedProducts],
  );

  const openProductModal = () => {
    setModalSelectionIds(selectedProducts.map((item) => item.productId));
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductSearch("");
  };

  const toggleModalSelection = (productId) => {
    setModalSelectionIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const saveSelectedProductsFromModal = () => {
    const existingMap = new Map(selectedProducts.map((item) => [item.productId, item]));

    const nextProducts = inventoryProducts
      .filter((item) => modalSelectionIds.includes(item.id))
      .map((item) => {
        const existing = existingMap.get(item.id);
        const originalPrice = Number(item.price || 0);

        return {
          productId: item.id,
          productName: item.name,
          imageUrl: item.image || item.images?.[0] || "",
          originalPrice,
          offerPrice: existing ? Number(existing.offerPrice || 0) : originalPrice,
          stockQuantity: Number(item.stockQuantity || 0),
        };
      });

    onChange?.(nextProducts);
    closeProductModal();
  };

  const removeSelectedProduct = (productId) => {
    onChange?.(selectedProducts.filter((item) => item.productId !== productId));
  };

  const updateSelectedOfferPrice = (productId, nextValue) => {
    onChange?.(
      selectedProducts.map((item) =>
        item.productId === productId
          ? { ...item, offerPrice: nextValue }
          : item,
      ),
    );
  };

  return (
    <div className="rounded-[10px] border border-[#d7dbe2] bg-[#f7f9fc] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-[#555]">Offer Products</p>
          <p className="text-[12px] text-[#666]">Update the product list and the offer price for each item.</p>
        </div>

        <button
          type="button"
          onClick={openProductModal}
          className="h-9 rounded-[8px] border border-[#4eaa73] bg-[#eaf8ef] px-4 text-[12px] font-semibold text-[#2f9e58]"
        >
          {selectedProducts.length} item(s) selected
        </button>
      </div>

      {loadingProducts ? <p className="mt-3 text-[12px] text-[#666]">Loading products...</p> : null}
      {error ? <p className="mt-3 text-[12px] text-[#ef4d4d]">{error}</p> : null}

      <div className="mt-4 rounded-[10px] border border-[#d7dbe2] bg-white p-4 min-h-[140px]">
        {selectedProducts.length === 0 ? (
          <div className="h-[120px] flex items-center justify-center text-[#666] text-[18px]">
            Click to add products from your inventory
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedProducts.map((item) => (
              <div key={item.productId} className="rounded-[10px] border border-[#e6e6e6] bg-white p-3 flex items-start gap-3">
                <div className="h-16 w-16 rounded-[8px] overflow-hidden border border-[#ececec] bg-[#fafafa] flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[11px] text-[#999]">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[#222]">{item.productName}</p>
                      <p className="text-[11px] text-[#777]">Original: Rs {Number(item.originalPrice || 0).toLocaleString()}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectedProduct(item.productId)}
                      className="text-[#df4b4b]"
                      aria-label={`Remove ${item.productName}`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[#777]">Offer Price</span>
                    <input
                      type="number"
                      min="0"
                      value={item.offerPrice}
                      onChange={(e) => updateSelectedOfferPrice(item.productId, e.target.value)}
                      className="h-8 w-28 rounded-[7px] border border-[#dcdcdc] bg-white px-2 text-[12px] outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[8px] border border-[#e4e7eb] bg-white px-3 py-2">
        <p className="text-[12px] text-[#666]">Total offer value</p>
        <p className="text-[14px] font-semibold text-[#18824f]">Rs {Math.round(totalOfferValue).toLocaleString()}</p>
      </div>

      {isProductModalOpen ? (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-[900px] rounded-[12px] bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between">
              <h3 className="text-[28px] font-semibold text-[#222]">Choose Products</h3>
              <button type="button" onClick={closeProductModal} className="text-[#777]">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a4a4]" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white pl-9 pr-3 text-[13px] outline-none"
                  placeholder="Search by product name"
                />
              </div>

              <div className="max-h-[360px] overflow-auto rounded-[10px] border border-[#ededed]">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#f4f6f8] text-[#666] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Image</th>
                      <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Stock</th>
                      <th className="px-4 py-3 text-left font-semibold">Click to Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-[#666]" colSpan={5}>
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const checked = modalSelectionIds.includes(item.id);
                        return (
                          <tr key={item.id} className="border-t border-[#f1f1f1]">
                            <td className="px-4 py-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#ececec] bg-[#fafafa]">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#222]">{item.name}</td>
                            <td className="px-4 py-3">Rs {Number(item.price || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">{item.stock || "0 units"}</td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => toggleModalSelection(item.id)}>
                                {checked ? (
                                  <CircleCheck size={18} className="text-[#2f9e58]" />
                                ) : (
                                  <Circle size={18} className="text-[#3a3a3a]" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#ececec] flex items-center justify-end gap-2 bg-[#fafafa]">
              <button
                type="button"
                onClick={closeProductModal}
                className="h-9 rounded-[8px] border border-[#d9d9d9] bg-white px-4 text-[12px] font-semibold text-[#666]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSelectedProductsFromModal}
                className="h-9 rounded-[8px] border border-[#4eaa73] bg-[#eaf8ef] px-4 text-[12px] font-semibold text-[#2f9e58]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}