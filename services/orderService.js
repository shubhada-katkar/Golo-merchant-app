import { BASE_URL as CONFIG_BASE_URL } from "../config";

const getBaseURL = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "";
  return url.replace(/\/+$/, "");
};

/**
 * Fetch voucher details by voucherId to get offer title and other details
 */
export const fetchVoucherDetails = async (voucherId, token) => {
  try {
    const BASE_URL = getBaseURL();
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
export const fetchCustomerProfile = async (userId, token) => {
  try {
    const BASE_URL = getBaseURL();
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
      console.log('[enrichOrderDetails] Enriched order with voucher:', enrichedOrder.voucherId);
    } else {
      console.warn('[enrichOrderDetails] Failed to fetch voucher details for:', enrichedOrder.voucherId);
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
