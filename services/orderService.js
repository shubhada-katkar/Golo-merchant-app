import { BASE_URL } from "../config";

/**
 * Fetch voucher details by voucherId to get offer title and other details
 */
export const fetchVoucherDetails = async (voucherId, token) => {
  try {
    if (!BASE_URL || !voucherId || !token) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/vouchers/${voucherId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log("Failed to fetch voucher details:", response.status);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error("Error fetching voucher details:", error);
    return null;
  }
};

/**
 * Fetch customer profile by userId to get phone and other details
 */
const normalizeText = (value) => String(value || "").trim().toLowerCase();

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameCustomerName = (orderName, voucherName) => {
  const normalizedOrderName = normalizeText(orderName);
  const normalizedVoucherName = normalizeText(voucherName);
  return normalizedOrderName && normalizedOrderName === normalizedVoucherName;
};

const findBestOrderVoucherMatch = (order, vouchers) => {
  const orderName =
    order?.customerName || order?.user?.name || order?.customer?.name || "";
  const orderTime =
    parseDate(order?.claimedAt || order?.createdAt || order?.placedAt || order?.timestamp);

  if (!orderName) {
    return null;
  }

  let bestMatch = null;
  let bestScore = -1;

  vouchers.forEach((voucher) => {
    const voucherName = voucher?.userName || voucher?.customerName || voucher?.user?.name || "";
    if (!isSameCustomerName(orderName, voucherName)) {
      return;
    }

    let score = 1;
    const voucherTime = parseDate(voucher?.claimedAt || voucher?.createdAt || voucher?.updatedAt);
    if (orderTime && voucherTime) {
      const delta = Math.abs(orderTime - voucherTime);
      if (delta <= 5 * 60 * 1000) {
        score += 2;
      } else if (delta <= 15 * 60 * 1000) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = voucher;
    }
  });

  return bestMatch;
};

const fetchMerchantVouchers = async (token, status = "pending", page = 1, limit = 100) => {
  if (!BASE_URL || !token) {
    return [];
  }

  const path = status === "history" ? "/vouchers/merchant/history" : "/vouchers/merchant/pending";
  const url = `${BASE_URL}${path}?page=${page}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch merchant vouchers (${status}):`, response.status);
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch (error) {
    console.error(`Error fetching merchant vouchers (${status}):`, error);
    return [];
  }
};

export const fetchCustomerProfile = async (userId, token) => {
  try {
    if (!BASE_URL || !userId || !token) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log("Failed to fetch customer profile:", response.status);
      return null;
    }

    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return null;
  }
};

/**
 * Enrich order with voucher and customer details
 */
export const enrichOrderDetails = async (order, token) => {
  if (!order || !token) {
    return order;
  }

  const enrichedOrder = { ...order };

  // Ensure voucherId is properly set (in case it's only stored under different field names)
  if (!enrichedOrder.voucherId) {
    // Try alternative field names that might contain the voucher ID
    enrichedOrder.voucherId = order?.voucher?.voucherId || 
                              order?.voucher?._id || 
                              order?.voucher?.id ||
                              order?.voucherId;
  }

  // Fetch voucher details if voucherId exists
  if (enrichedOrder.voucherId && !enrichedOrder.offerTitle) {
    const voucherDetails = await fetchVoucherDetails(enrichedOrder.voucherId, token);
    if (voucherDetails) {
      enrichedOrder.offerTitle = voucherDetails.offerTitle || voucherDetails.offer?.title;
      enrichedOrder.merchantName = voucherDetails.merchantName;
      enrichedOrder.discount = voucherDetails.discount;
      // Ensure voucherId is set from fetched details
      enrichedOrder.voucherId = voucherDetails.voucherId || enrichedOrder.voucherId;
      enrichedOrder.voucher = enrichedOrder.voucher || voucherDetails;
      // If voucher details include the claimant userId, copy it so we can fetch customer profile
      if (!enrichedOrder.userId && (voucherDetails.userId || voucherDetails.user?._id || voucherDetails.user?._id)) {
        enrichedOrder.userId = String(voucherDetails.userId || voucherDetails.user?._id || voucherDetails.user?._id);
      }
      console.log('[enrichOrderDetails] Enriched order with voucher:', enrichedOrder.voucherId);
    } else {
      console.warn('[enrichOrderDetails] Failed to fetch voucher details for:', enrichedOrder.voucherId);
    }
  }

  // If order details still lack offerTitle, attempt to match a merchant voucher by customer.
  if (!enrichedOrder.offerTitle) {
    const pendingVouchers = await fetchMerchantVouchers(token, 'pending');
    let matchedVoucher = findBestOrderVoucherMatch(enrichedOrder, pendingVouchers);

    if (!matchedVoucher) {
      const historyVouchers = await fetchMerchantVouchers(token, 'history');
      matchedVoucher = findBestOrderVoucherMatch(enrichedOrder, historyVouchers);
    }

    if (matchedVoucher) {
      enrichedOrder.offerTitle =
        matchedVoucher.offerTitle ||
        matchedVoucher.title ||
        matchedVoucher.bannerTitle ||
        matchedVoucher.offer?.title;
      enrichedOrder.voucherId = enrichedOrder.voucherId || matchedVoucher.voucherId || matchedVoucher._id;
      enrichedOrder.voucher = matchedVoucher;
      // If the matched merchant voucher contains the claimant user id, copy it for customer lookup
      if (!enrichedOrder.userId && (matchedVoucher.userId || matchedVoucher.user?._id || matchedVoucher.user?._id)) {
        enrichedOrder.userId = String(matchedVoucher.userId || matchedVoucher.user?._id || matchedVoucher.user?._id);
      }
      console.log('[enrichOrderDetails] Matched order to merchant voucher for offer title:', enrichedOrder.voucherId);
    }
  }

  // Fetch customer details if userId exists
  if (enrichedOrder.userId && !enrichedOrder.customerPhone) {
    const customerProfile = await fetchCustomerProfile(enrichedOrder.userId, token);
    if (customerProfile) {
      enrichedOrder.customerPhone = customerProfile.profile?.phone || customerProfile.phone;
      enrichedOrder.customerEmail = customerProfile.email;
      if (!enrichedOrder.customerName) {
        enrichedOrder.customerName = customerProfile.name;
      }
    }
  }

  return enrichedOrder;
};
