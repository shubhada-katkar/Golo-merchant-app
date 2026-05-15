// Fetch a user by ID (public profile)
export async function getUserById(userId) {
    return apiClient(`/users/${userId}`);
}
// ==================== ADMIN REPORT STATS (REAL-TIME) ====================

/**
 * Get real-time user report stats (admin only)
 */
export async function getUserReportStats() {
    return apiClient('/users/admin/reports/stats');
}

/**
 * Get real-time listing report stats (admin only)
 */
export async function getListingReportStats() {
    return apiClient('/ads/reports/stats');
}
/**
 * Submit a report for a user
 */
export async function submitUserReport(userId, reason, description) {
    return apiClient(`/users/${userId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, description }),
    });
}
// ============================================================
// Centralized API Layer — Choja Frontend → ads-microservice
// ============================================================

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const NORMALIZED_REMOTE_API_URL = RAW_API_URL ? RAW_API_URL.replace(/\/$/, '') : '';
// Prefer the real backend URL when it is configured so browser requests do not
// depend on the Next.js rewrite proxy in development.
const BASE_URL = NORMALIZED_REMOTE_API_URL || '/api';
const PUBLIC_AUTH_ENDPOINTS = new Set([
    '/users/login',
    '/users/register',
    '/users/social-auth',
    '/users/refresh',
]);

// --------------- Core Fetch Wrapper ---------------

export async function apiClient(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const isPublicAuthEndpoint = [...PUBLIC_AUTH_ENDPOINTS].some((path) => endpoint.startsWith(path));

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Attach JWT token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = {
        ...options,
        headers,
    };

    let response;
    try {
        response = await fetch(url, config);
    } catch (error) {
        const networkError = new Error(
            `Unable to connect to API at ${BASE_URL || '(same-origin)'}. ` +
            `Please ensure the backend is running and NEXT_PUBLIC_API_URL is correct.`
        );
        networkError.status = 0;
        networkError.data = {
            message: networkError.message,
            endpoint,
            url,
        };
        networkError.cause = error;
        throw networkError;
    }

    // Handle 401 — try to refresh token
    if (response.status === 401 && typeof window !== 'undefined' && !isPublicAuthEndpoint) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
            const retryResponse = await fetch(url, { ...config, headers });
            return handleResponse(retryResponse);
        }
    }

    return handleResponse(response);
}

async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    let rawText = '';

    try {
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            rawText = await response.text();
        }
    } catch {
        data = null;
    }

    if (!response.ok) {
        const fallbackMessage = rawText
            ? rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
            : '';
        const error = new Error(
            data?.message ||
            fallbackMessage ||
            `API request failed (${response.status})`
        );
        error.status = response.status;
        error.data = data || (rawText ? { message: fallbackMessage || rawText } : null);
        throw error;
    }

    return data;
}

async function tryRefreshToken() {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;

        const response = await fetch(`${BASE_URL}/users/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            // Refresh failed — clear tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            return false;
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        return true;
    } catch {
        return false;
    }
}

// ============================================================
// AUTH APIs
// ============================================================

export async function loginUser(email, password, accountType = 'user') {
    return apiClient('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, accountType }),
    });
}

export async function socialAuthUser(payload) {
    return apiClient('/users/social-auth', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function registerUser({
    name,
    email,
    password,
    phone,
    accountType = 'user',
    storeName,
    storeEmail,
    gstNumber,
    storeCategory,
    storeSubCategory,
    contactNumber,
    storeLocation,
    storeLocationLatitude,
    storeLocationLongitude,
}) {
    const payload = {
        name,
        email,
        password,
        phone,
        accountType,
        storeName,
        storeEmail,
        gstNumber,
        storeCategory,
        storeSubCategory,
        contactNumber,
        storeLocation,
        storeLocationLatitude,
        storeLocationLongitude,
    };

    try {
        return await apiClient('/users/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        const messageText = Array.isArray(error?.data?.message)
            ? error.data.message.join(" ")
            : String(error?.data?.message || error?.message || "");
        const unsupportedCoordinateFields =
            messageText.includes("storeLocationLatitude should not exist") ||
            messageText.includes("storeLocationLongitude should not exist");

        if (!unsupportedCoordinateFields) {
            throw error;
        }

        if (
            typeof window !== "undefined" &&
            accountType === "merchant" &&
            typeof storeLocationLatitude === "number" &&
            !Number.isNaN(storeLocationLatitude) &&
            typeof storeLocationLongitude === "number" &&
            !Number.isNaN(storeLocationLongitude)
        ) {
            try {
                // Persist pending merchant location on server for sync after login
                await apiClient('/users/pending-location', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: String(storeEmail || email || "").trim().toLowerCase(),
                        address: String(storeLocation || "").trim(),
                        latitude: storeLocationLatitude,
                        longitude: storeLocationLongitude,
                    }),
                });
            } catch {
            }
        }

        const fallbackPayload = {
            name,
            email,
            password,
            phone,
            accountType,
            storeName,
            storeEmail,
            gstNumber,
            storeCategory,
            storeSubCategory,
            contactNumber,
            storeLocation,
        };

        return apiClient('/users/register', {
            method: 'POST',
            body: JSON.stringify(fallbackPayload),
        });
    }
}

export async function refreshTokenApi(refreshToken) {
    return apiClient('/users/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    });
}

export async function logoutUser(refreshToken) {
    return apiClient('/users/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    });
}

// ============================================================
// USER / PROFILE APIs
// ============================================================

export async function getProfile() {
    return apiClient('/users/profile');
}

export async function getMerchantProfile() {
    return apiClient('/users/merchant/profile');
}

export async function updateProfile(data) {
    return apiClient('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function sendPasswordChangeOTP() {
    return apiClient('/users/send-password-otp', {
        method: 'POST',
    });
}

export async function verifyPasswordChangeOTP(otp) {
    return apiClient('/users/verify-password-otp', {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

export async function changePasswordWithOTP(otp, newPassword) {
    return apiClient('/users/change-password-otp', {
        method: 'POST',
        body: JSON.stringify({ otp, newPassword }),
    });
}

export async function changePassword(currentPassword, newPassword) {
    return apiClient('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

// ============================================================
// WISHLIST APIs
// ============================================================

export async function toggleWishlist(adId) {
    return apiClient(`/users/wishlist/${adId}`, {
        method: 'POST',
    });
}

export async function getWishlistIds() {
    return apiClient('/users/wishlist/ids');
}

export async function getWishlistAds() {
    return apiClient('/users/wishlist');
}

// ============================================================
// NOTIFICATION APIs
// ============================================================

export async function getNotifications({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/users/notifications?${params}`);
}

export async function markNotificationRead(notificationId) {
    return apiClient(`/users/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
    return apiClient('/users/notifications/read-all', { method: 'POST' });
}

export async function clearAllNotifications() {
    return apiClient('/users/notifications', { method: 'DELETE' });
}

// ============================================================
// I WANT PREFERENCE APIs
// ============================================================

export async function getIWantPreference() {
    return apiClient('/users/preferences/i-want');
}

export async function saveIWantPreference(payload) {
    return apiClient('/users/preferences/i-want', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

// ============================================================
// ADS — PUBLIC APIs (no auth required)
// ============================================================

export async function getAllAds({ page = 1, limit = 10, category, sortBy, sortOrder } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (category) params.append('category', category);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    return apiClient(`/ads?${params}`);
}

export async function searchAds({ q = '', category, location, minPrice, maxPrice, sortBy, sortOrder, lat, lng, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ q, page, limit });
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    return apiClient(`/ads/search?${params}`);
}

export async function getAdById(adId) {
    // Backend automatically tracks views for authenticated users via JWT
    // No visitorId needed - anonymous views are not tracked
    return apiClient(`/ads/${adId}`);
}

export async function getAdsByCategory(category, { page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/ads/category/${encodeURIComponent(category)}?${params}`);
}

export async function getFeaturedDeals(limit = 10) {
    return apiClient(`/ads/home/featured?limit=${limit}`);
}

export async function getTrendingSearches(limit = 10) {
    return apiClient(`/ads/home/trending?limit=${limit}`);
}

export async function getRecommendedDeals(limit = 10) {
    // New backend recommendations endpoint (requires auth)
    return apiClient(`/recommendations/deals?limit=${limit}`);
}

// Persist user's preferred categories (array of strings)
export async function savePreferredCategories(categories = []) {
    return updateProfile({ preferredCategories: categories });
}

export async function getPopularPlaces(limit = 10) {
    return apiClient(`/ads/home/popular-places?limit=${limit}`);
}

export async function getNearbyAds({ lat, lng, distance = 10000, category, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ lat, lng, distance, page, limit });
    if (category) params.append('category', category);
    return apiClient(`/ads/nearby?${params}`);
}

// ============================================================
// ADS — AUTHENTICATED APIs
// ============================================================

export async function createAd(adData) {
    return apiClient('/ads', {
        method: 'POST',
        body: JSON.stringify(adData),
    });
}

export async function updateAd(adId, updateData) {
    return apiClient(`/ads/${adId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
}

export async function deleteAd(adId) {
    return apiClient(`/ads/${adId}`, {
        method: 'DELETE',
    });
}

export async function getMyAds({ page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/ads/user/me?${params}`);
}

export async function getAdsByUser(userId, { page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/ads/user/${userId}?${params}`);
}

export async function getAdWishlistCount(adId) {
    return apiClient(`/ads/wishlist-count/${adId}`);
}

export async function getMyAnalytics() {
    return apiClient('/ads/analytics/my');
}

export async function promoteAd(adId, { promotionPackage, duration }) {
    return apiClient(`/ads/${adId}/promote`, {
        method: 'POST',
        body: JSON.stringify({ package: promotionPackage, duration }),
    });
}

function buildLegacyPromotionPayload(payload = {}) {
    const {
        loyaltyRewardEnabled,
        loyaltyStarsToOffer,
        loyaltyStarsPerPurchase,
        loyaltyScorePerStar,
        promotionExpiryText,
        termsAndConditions,
        exampleUsage,
        selectedProducts,
        promotionType,
        ...legacyPayload
    } = payload;

    // Map new field names to legacy banner API names
    const mapped = { ...legacyPayload };
    if (mapped.title !== undefined) {
        mapped.bannerTitle = mapped.title;
        delete mapped.title;
    }
    if (mapped.category !== undefined) {
        mapped.bannerCategory = mapped.category;
        delete mapped.category;
    }

    return mapped;
}

function isNonWhitelistedPayloadError(error) {
    const message = String(error?.data?.message || error?.message || '').toLowerCase();
    return message.includes('should not exist');
}

const OFFER_PROMOTION_IDS_KEY = 'golo_offer_promotion_ids';

function getPromotionRowId(row) {
    return String(row?.requestId || row?._id || '');
}

function readTrackedOfferPromotionIds() {
    if (typeof window === 'undefined') return new Set();

    try {
        const raw = localStorage.getItem(OFFER_PROMOTION_IDS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.map((id) => String(id)));
    } catch {
        return new Set();
    }
}

function writeTrackedOfferPromotionIds(idsSet) {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(OFFER_PROMOTION_IDS_KEY, JSON.stringify(Array.from(idsSet)));
    } catch {
    }
}

function rememberOfferPromotionId(id) {
    if (!id) return;
    const ids = readTrackedOfferPromotionIds();
    ids.add(String(id));
    writeTrackedOfferPromotionIds(ids);
}

function forgetOfferPromotionId(id) {
    if (!id) return;
    const ids = readTrackedOfferPromotionIds();
    ids.delete(String(id));
    writeTrackedOfferPromotionIds(ids);
}

function isOfferRow(row, trackedOfferIds) {
    if (row?.promotionType) {
        return String(row.promotionType).toLowerCase() === 'offer';
    }
    return trackedOfferIds.has(getPromotionRowId(row));
}

export async function submitBannerPromotionRequest(payload) {
    try {
        return await apiClient('/banners/promotions/request', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        if (!isNonWhitelistedPayloadError(error)) {
            throw error;
        }

        return apiClient('/banners/promotions/request', {
            method: 'POST',
            body: JSON.stringify(buildLegacyPromotionPayload(payload)),
        });
    }
}

export async function submitOfferPromotionRequest(payload) {
    const enrichedPayload = { ...payload, promotionType: 'offer' };

    try {
        const response = await apiClient('/offers/request', {
            method: 'POST',
            body: JSON.stringify(enrichedPayload),
        });
        rememberOfferPromotionId(getPromotionRowId(response?.data));
        return response;
    } catch (error) {
        if (!isNonWhitelistedPayloadError(error)) {
            throw error;
        }

        const response = await apiClient('/offers/request', {
            method: 'POST',
            body: JSON.stringify(buildLegacyPromotionPayload(enrichedPayload)),
        });
        rememberOfferPromotionId(getPromotionRowId(response?.data));
        return response;
    }
}

export async function getMyBannerPromotions() {
    const response = await apiClient('/banners/promotions/my?type=banner');
    const rows = Array.isArray(response?.data) ? response.data : [];
    const trackedOfferIds = readTrackedOfferPromotionIds();

    return {
        ...response,
        data: rows.filter((row) => !isOfferRow(row, trackedOfferIds)),
    };
}

export async function getMyOfferPromotions() {
    const response = await apiClient('/offers/my', {
        cache: 'no-store',
    });
    const rows = Array.isArray(response?.data) ? response.data : [];

    // Return server-provided offer rows directly. Client-side localStorage
    // filtering hid offers on other devices (tracked IDs are device-local).
    return {
        ...response,
        data: rows,
    };
}

export async function payForBannerPromotion(requestId, paymentReference) {
    return apiClient(`/banners/promotions/${requestId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ paymentReference }),
    });
}

export async function getActiveHomepageBanners(limit = 5) {
    return apiClient(`/banners/promotions/active?limit=${limit}`);
}

const LOCAL_BACKEND_URL = '/api';
let nearbyOffersRouteMissingOnPrimary = false;
const NEARBY_OFFERS_PRIMARY_UNSUPPORTED_KEY = 'golo_nearby_offers_primary_unsupported';

function markNearbyOffersPrimaryUnsupported() {
    nearbyOffersRouteMissingOnPrimary = true;
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(NEARBY_OFFERS_PRIMARY_UNSUPPORTED_KEY, '1');
    } catch {
    }
}

function isNearbyOffersPrimaryUnsupported() {
    if (nearbyOffersRouteMissingOnPrimary) return true;
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(NEARBY_OFFERS_PRIMARY_UNSUPPORTED_KEY) === '1';
    } catch {
        return false;
    }
}

function emptyNearbyOffersResponse(page = 1, limit = 20) {
    return {
        success: true,
        data: [],
        pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
        },
    };
}

async function fetchAbsoluteJson(url) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers,
        });
    } catch (error) {
        const networkError = new Error(`Unable to connect to ${url}`);
        networkError.status = 0;
        networkError.data = { message: networkError.message, url };
        networkError.cause = error;
        throw networkError;
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const requestError = new Error(data?.message || `Request failed (${response.status})`);
        requestError.status = response.status;
        requestError.data = data;
        throw requestError;
    }

    return data;
}

export async function getNearbyOffers({
    lat,
    lng,
    radiusKm = 5,
    location,
    q,
    category,
    sort,
    maxPrice,
    applyPriceFilter = false,
    offerTypes,
    topDiscountOnly = false,
    activeNowOnly = true,
    page = 1,
    limit = 20,
    _t,  // cache buster (ignored by backend, just varies cache key)
  } = {}) {
    const params = new URLSearchParams();
    if (typeof lat === 'number' && !Number.isNaN(lat)) params.set('lat', String(lat));
    if (typeof lng === 'number' && !Number.isNaN(lng)) params.set('lng', String(lng));
    if (radiusKm) params.set('radiusKm', String(radiusKm));
    if (location) params.set('location', String(location));
    if (q) params.set('q', String(q));
    if (category) params.set('category', String(category));
    if (sort) params.set('sort', String(sort));
    if (offerTypes) params.set('offerTypes', String(offerTypes));
    if (topDiscountOnly) params.set('topDiscount', String(topDiscountOnly));
    if (activeNowOnly === false) params.set('activeNow', 'false');
    if (
        applyPriceFilter &&
        typeof maxPrice === 'number' &&
        !Number.isNaN(maxPrice) &&
        maxPrice > 0
    ) {
        params.set('maxPrice', String(maxPrice));
    }
    if (_t) params.set('_t', String(_t));  // cache buster
    params.set('page', String(page));
    params.set('limit', String(limit));
    const endpoint = `/offers/nearby?${params.toString()}`;
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;

    if (isNearbyOffersPrimaryUnsupported()) {
        try {
            return await fetchAbsoluteJson(`${LOCAL_BACKEND_URL}${endpoint}`);
        } catch {
            return emptyNearbyOffersResponse(safePage, safeLimit);
        }
    }

    try {
        return await apiClient(endpoint);
    } catch (error) {
        if (error?.status !== 404) {
            throw error;
        }

        markNearbyOffersPrimaryUnsupported();
        try {
            return await fetchAbsoluteJson(`${LOCAL_BACKEND_URL}${endpoint}`);
        } catch {
            return emptyNearbyOffersResponse(safePage, safeLimit);
        }
    }
}

export async function getNearbyOfferDetails(offerId) {
    const endpoint = `/offers/${offerId}`;

    if (isNearbyOffersPrimaryUnsupported()) {
        return fetchAbsoluteJson(`${LOCAL_BACKEND_URL}${endpoint}`);
    }

    try {
        return await apiClient(endpoint);
    } catch (error) {
        if (error?.status !== 404) {
            throw error;
        }

        markNearbyOffersPrimaryUnsupported();
        return fetchAbsoluteJson(`${LOCAL_BACKEND_URL}${endpoint}`);
    }
}

// ============================================================
// PAYMENTS APIs
// ============================================================

export async function createPaymentOrder(payload) {
    return apiClient('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function verifyPayment(payload) {
    return apiClient('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function markPaymentFailed(payload) {
    return apiClient('/payments/fail', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function refundPayment(payload) {
    return apiClient('/payments/refund', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getMyPayments({ page = 1, limit = 10, status } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return apiClient(`/payments/my?${params.toString()}`);
}

export async function getPaymentById(paymentId) {
    return apiClient(`/payments/${paymentId}`);
}

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(false);
        if (window.Razorpay) return resolve(true);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function openRazorpayCheckout({ amount, adId, description, notes, prefill }) {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    const orderResponse = await createPaymentOrder({
        amount,
        currency: 'INR',
        adId,
        description,
        notes,
        idempotencyKey: `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    });

    const orderData = orderResponse?.data;
    const order = orderData?.order;
    const keyId = orderData?.keyId;
    const paymentRecord = orderData?.payment;

    if (!order || !keyId) {
        throw new Error('Invalid payment order response from server.');
    }

    return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
            key: keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'GOLO',
            description: description || 'GOLO Payment',
            order_id: order.id,
            prefill: prefill || {},
            notes: notes || {},
            theme: {
                color: '#157A4F',
            },
            handler: async (response) => {
                try {
                    const verifyRes = await verifyPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                    });
                    resolve({
                        success: true,
                        order,
                        paymentRecord,
                        verification: verifyRes?.data,
                    });
                } catch (error) {
                    reject(error);
                }
            },
            modal: {
                ondismiss: async () => {
                    try {
                        await markPaymentFailed({
                            razorpayOrderId: order.id,
                            failureDescription: 'Checkout closed by user',
                        });
                    } catch {
                    }
                    reject(new Error('Payment checkout was cancelled.'));
                },
            },
        });

        razorpay.on('payment.failed', async function (response) {
            try {
                await markPaymentFailed({
                    razorpayOrderId: order.id,
                    razorpayPaymentId: response?.error?.metadata?.payment_id,
                    failureCode: response?.error?.code,
                    failureDescription: response?.error?.description,
                });
            } catch {
            }
            reject(new Error(response?.error?.description || 'Payment failed.'));
        });

        razorpay.open();
    });
}

// ============================================================
// CHATS APIs
// ============================================================

export async function startConversation({ adId, sellerId }) {
    return apiClient('/chats/start', {
        method: 'POST',
        body: JSON.stringify({ adId, sellerId }),
    });
}

export async function getMyConversations() {
    return apiClient('/chats/conversations');
}

export async function getConversationMessages(conversationId, { page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/chats/conversations/${conversationId}/messages?${params.toString()}`);
}

export async function sendConversationMessage(conversationId, text, adId, attachments = []) {
    return apiClient(`/chats/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, adId, attachments }),
    });
}

export async function uploadChatAttachment(file) {
    if (!file) {
        throw new Error('No file selected');
    }

    // Use the secure Cloudinary utility with environment variables
    const { uploadToCloudinary } = await import('../services/cloudinaryConfig');
    return uploadToCloudinary(file);
}

export async function deleteConversation(conversationId) {
    return apiClient(`/chats/conversations/${conversationId}`, {
        method: 'DELETE',
    });
}

export async function getCallHistory({ page = 1, limit = 100 } = {}) {
    const params = new URLSearchParams({ page, limit });
    return apiClient(`/calls/history?${params.toString()}`);
}

// ============================================================
// MERCHANT PRODUCTS APIs
// ============================================================

export async function getMerchantProducts({ page = 1, limit = 10, search = '' } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return apiClient(`/merchant/products?${params.toString()}`);
}

export async function createMerchantProduct(payload) {
    return apiClient('/merchant/products', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getMerchantProductById(productId) {
    return apiClient(`/merchant/products/${productId}`);
}

export async function getPublicMerchantProductById(productId) {
    return apiClient(`/merchant/products/public/item/${productId}`);
}

export async function deleteMerchantProduct(productId) {
    return apiClient(`/merchant/products/${productId}`, {
        method: 'DELETE',
    });
}

// ==================== AD REPORTING & MODERATION ====================

/**
 * Submit a report for an ad
 */
export async function submitReport(adId, reason, description) {
    return apiClient(`/ads/${adId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason, description }),
    });
}

/**
 * Get all reports for a specific ad (admin only)
 */
export async function getAdReports(adId) {
    return apiClient(`/ads/reports/${adId}`);
}

/**
 * Get ALL reports queue (admin only) - shows all reports regardless of status
 */
export async function getAllReports() {
    return apiClient('/ads/reports');
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatus(reportId, status, adminNotes) {
    return apiClient(`/ads/reports/${reportId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes }),
    });
}

/**
 * Admin review decision on flagged ad (admin only)
 */
export async function reviewAd(adId, decision, adminNotes) {
    return apiClient(`/ads/admin/${adId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, adminNotes }),
    });
}

/**
 * Admin: Update any ad
 */
export async function adminUpdateAd(adId, updateData) {
    return apiClient(`/ads/admin/${adId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
}

/**
 * Admin: Delete any ad
 */
export async function adminDeleteAd(adId) {
    return apiClient(`/ads/admin/${adId}`, {
        method: 'DELETE',
    });
}

/**
 * Admin: Get all ads
 */
export async function adminGetAllAds() {
    return apiClient('/ads/admin/all');
}

/**
 * Admin: Manage Users
 */
export async function adminGetAllUsers(page = 1, limit = 10) {
    return apiClient(`/users/admin/users?page=${page}&limit=${limit}`);
}

export async function adminBanUser(userId, reason) {
    return apiClient(`/users/admin/users/${userId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function adminUnbanUser(userId) {
    return apiClient(`/users/admin/users/${userId}/unban`, {
        method: 'POST',
    });
}

/**
 * Admin: Stats & Logs
 */
export async function getAdminStats() {
    return apiClient('/users/admin/stats');
}

export async function getAdminLogs(page = 1, limit = 50) {
    return apiClient(`/admin/logs?page=${page}&limit=${limit}`);
}

// ============================================================
// MERCHANT STORE LOCATION APIs
// ============================================================

/**
 * Update merchant store location with coordinates
 * @param {object} locationData - {address, latitude, longitude}
 * @returns {Promise} - API response
 */
export async function updateMerchantStoreLocation(locationData) {
    return apiClient('/merchant/store-location', {
        method: 'PUT',
        body: JSON.stringify({
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        }),
    });
}

/**
 * Get merchant store location
 * @returns {Promise} - Store location with coordinates
 */
export async function getMerchantStoreLocation() {
    return apiClient('/merchant/store-location');
}

export async function getPublicMerchantProfile(merchantId) {
    return apiClient(`/merchant/public/${merchantId}/profile`);
}

export async function getPublicMerchantStoreLocation(merchantId) {
    return apiClient(`/merchant/public/${merchantId}/store-location`);
}

export async function getPublicMerchantProducts(merchantId, { page = 1, limit = 10, search = '' } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return apiClient(`/merchant/products/public/${merchantId}?${params.toString()}`);
}

/**
 * Update merchant profile information
 * @param {Object} profileData - Merchant profile data to update
 * @returns {Promise} - API response
 */
export async function updateMerchantProfile(profileData) {
    return apiClient('/merchant/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
}

// ============================================================
// VOUCHER & REDEMPTION APIs
// ============================================================

/**
 * Claim an offer and receive a voucher
 * @param {string} offerId - The offer ID to claim
 */
export async function claimOffer(offerId) {
    return apiClient('/vouchers/claim', {
        method: 'POST',
        body: JSON.stringify({ offerId }),
    });
}

/**
 * Get user's claimed vouchers
 * @param {object} params - {page, limit, status}
 */
export async function getMyVouchers({ page = 1, limit = 10, status } = {}) {
    let url = `/vouchers/my-vouchers?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return apiClient(url);
}

/**
 * Get single voucher details by ID
 * @param {string} voucherId - The voucher ID
 */
export async function getVoucherById(voucherId) {
    return apiClient(`/vouchers/${voucherId}`, {
        cache: 'no-store',
    });
}

export async function getPublicVoucherStatus(voucherId) {
    return apiClient(`/vouchers/public/${voucherId}/status`, {
        cache: 'no-store',
    });
}

/**
 * Download voucher QR code
 * @param {string} voucherId - The voucher ID
 */
export async function downloadVoucherQR(voucherId) {
    return apiClient(`/vouchers/${voucherId}/download-qr`);
}

/**
 * Share voucher with friend
 * @param {string} voucherId - The voucher ID
 * @param {string} friendEmail - Friend's email
 */
export async function shareVoucher(voucherId, friendEmail) {
    return apiClient(`/vouchers/${voucherId}/share`, {
        method: 'POST',
        body: JSON.stringify({ friendEmail }),
    });
}

/**
 * Verify voucher using QR code without redeeming
 * @param {string} voucherId - The voucher ID
 * @param {string} qrCode - The QR code
 */
export async function verifyVoucher(voucherId, qrCode) {
    return apiClient(`/vouchers/${voucherId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ qrCode }),
    });
}

/**
 * Redeem voucher (merchant completes redemption)
 * @param {string} voucherId - The voucher ID
 * @param {object} verificationData - {qrCode, verificationCode}
 */
export async function redeemVoucher(voucherId, verificationData) {
    return apiClient(`/vouchers/${voucherId}/redeem`, {
        method: 'POST',
        body: JSON.stringify(verificationData),
    });
}

/**
 * Generate verification code on-demand
 * @param {string} voucherId - The voucher ID
 */
export async function generateVerificationCode(voucherId) {
    return apiClient(`/vouchers/${voucherId}/generate-code`, {
        method: 'POST',
    });
}

/**
 * Get merchant's pending redemptions
 * @param {object} params - {page, limit, status}
 */
export async function getMerchantPendingRedemptions({ page = 1, limit = 20, status } = {}) {
    let url = `/vouchers/merchant/pending?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return apiClient(url);
}

/**
 * Get merchant's redemption history
 * @param {object} params - {page, limit}
 */
export async function getMerchantRedemptionHistory({ page = 1, limit = 20 } = {}) {
    return apiClient(`/vouchers/merchant/history?page=${page}&limit=${limit}`);
}

/**
 * Get merchant's active offers
 * @param {object} params - {page, limit, status}
 */
export async function getMerchantOffers({ page = 1, limit = 20, status } = {}) {
    let url = `/vouchers/merchant/offers?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return apiClient(url);
}

// ============================================================
// MERCHANT ANALYTICS & DASHBOARD APIs
// ============================================================

/**
 * Get merchant dashboard summary
 */
export async function getMerchantDashboardSummary() {
    return apiClient('/merchant-dashboard/summary');
}

/**
 * Get merchant order statistics
 */
export async function getMerchantOrderStats() {
    return apiClient('/orders/merchant/stats');
}

/**
 * Get merchant realtime analytics payload for dashboard sections
 */
export async function getMerchantRealtimeAnalytics() {
    return apiClient('/merchant-dashboard/analytics/realtime');
}

/**
 * Get merchant trend analytics
 */
export async function getMerchantTrendAnalytics() {
    return apiClient('/merchant-dashboard/analytics/trend');
}

/**
 * Get merchant events analytics
 */
export async function getMerchantEventsAnalytics() {
    return apiClient('/merchant-dashboard/analytics/events');
}

/**
 * Get merchant top products analytics
 */
export async function getMerchantTopProductsAnalytics() {
    return apiClient('/merchant-dashboard/analytics/top-products');
}

/**
 * Get merchant top regions analytics
 */
export async function getMerchantTopRegionsAnalytics() {
    return apiClient('/merchant-dashboard/analytics/top-regions');
}

/**
 * Get merchant device analytics
 */
export async function getMerchantDeviceAnalytics() {
    return apiClient('/merchant-dashboard/analytics/device-breakdown');
}

/**
 * Get analytics device breakdown
 * @param {string} dateRange - Time range for analytics (e.g., '7days', '30days')
 */
export async function getAnalyticsDeviceBreakdown(dateRange = '7days') {
    return apiClient(`/analytics/device-breakdown?dateRange=${dateRange}`);
}

// ============================================================
// LOYALTY POINTS APIs
// ============================================================

/**
 * Get merchant loyalty leaderboard (top customers by loyalty points)
 */
export async function getMerchantLoyaltyLeaderboard() {
    return apiClient('/merchant-dashboard/loyalty-leaderboard');
}

/**
 * Get analytics top regions
 * @param {string} dateRange - Time range for analytics
 */
export async function getAnalyticsTopRegions(dateRange = '7days') {
    return apiClient(`/analytics/top-regions?dateRange=${dateRange}`);
}

/**
 * Get analytics top pages
 * @param {string} dateRange - Time range for analytics
 */
export async function getAnalyticsTopPages(dateRange = '7days') {
    return apiClient(`/analytics/top-pages?dateRange=${dateRange}`);
}

/**
 * Get analytics events
 * @param {string} dateRange - Time range for analytics
 */
export async function getAnalyticsEvents(dateRange = '7days') {
    return apiClient(`/analytics/events?dateRange=${dateRange}`);
}

// ============================================================
// MERCHANT ORDERS APIs
// ============================================================

/**
 * Get merchant orders
 * @param {object} params - {status, page, limit, search}
 */
export async function getMerchantOrders({ status = 'all', page = 1, limit = 30, search } = {}) {
    let url = `/orders/merchant?page=${page}&limit=${limit}`;
    if (status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient(url);
}

/**
 * Update merchant order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 */
export async function updateMerchantOrderStatus(orderId, status) {
    return apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// ============================================================
// MERCHANT REVIEWS & RATINGS APIs
// ============================================================

/**
 * Get merchant reviews and ratings
 * @param {object} params - {status, search, page, limit}
 */
export async function getMerchantReviews({ status, search, page = 1, limit = 30 } = {}) {
    let url = `/reviews/merchant?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiClient(url);
}

/**
 * Get merchant review statistics
 */
export async function getMerchantReviewStats() {
    return apiClient('/reviews/merchant/stats');
}

/**
 * Update merchant review status
 * @param {string} reviewId - Review ID
 * @param {string} status - New status
 * @param {string} response - Merchant response
 */
export async function updateMerchantReviewStatus(reviewId, status, response = '') {
    return apiClient(`/reviews/${reviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, response }),
    });
}

/**
 * Get public reviews for an offer
 * @param {string} offerId - Offer ID
 * @param {object} params - {page, limit}
 */
export async function getOfferReviews(offerId, { page = 1, limit = 10 } = {}) {
    return apiClient(`/reviews/offers/${offerId}?page=${page}&limit=${limit}`, {
        cache: 'no-store',
    });
}

/**
 * Submit or update a redeemed-offer review
 * @param {string} voucherId - Voucher ID or voucher code id
 * @param {object} payload - {rating, content}
 */
export async function submitOfferReview(voucherId, payload) {
    return apiClient(`/reviews/vouchers/${voucherId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ============================================================
// MERCHANT PRODUCTS APIs
// ============================================================

/**
 * Update merchant product
 * @param {string} productId - Product ID
 * @param {object} updateData - Product update data
 */
export async function updateMerchantProduct(productId, updateData) {
    return apiClient(`/merchant/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
}

// ============================================================
// MERCHANT ANALYTICS APIS
// ============================================================

/**
 * Get merchant's liked products (offers sorted by wishlist count)
 * @param {number} limit - Number of results to return
 */
export async function getMerchantLikedProducts(limit = 10) {
    return apiClient(`/users/merchant/liked-products?limit=${limit}`);
}

// ============================================================
// BANNER PROMOTION APIs
// ============================================================

/**
 * Update banner promotion
 * @param {string} promotionId - Promotion ID
 * @param {object} updateData - Promotion update data
 */
export async function updateMyBannerPromotion(promotionId, updateData) {
    return apiClient(`/banners/promotions/${promotionId}?type=banner`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
}

export async function updateMyOfferPromotion(promotionId, updateData) {
    const response = await apiClient(`/offers/${promotionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
    rememberOfferPromotionId(promotionId);
    return response;
}

/**
 * Delete banner promotion
 * @param {string} promotionId - Promotion ID
 */
export async function deleteMyBannerPromotion(promotionId) {
    return apiClient(`/banners/promotions/${promotionId}?type=banner`, {
        method: 'DELETE',
    });
}

export async function deleteMyOfferPromotion(promotionId) {
    const response = await apiClient(`/offers/${promotionId}`, {
        method: 'DELETE',
    });
    forgetOfferPromotionId(promotionId);
    return response;
}

/**
 * Save merchant offer template in backend cache (Redis)
 */
export async function saveMyOfferTemplate(payload) {
    return apiClient('/offers/template/save', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Get merchant offer template from backend cache (Redis)
 */
export async function getMyOfferTemplate() {
    return apiClient('/offers/template');
}

/**
 * Clear merchant offer template from backend cache (Redis)
 */
export async function clearMyOfferTemplate() {
    return apiClient('/offers/template', {
        method: 'DELETE',
    });
}

// ============================================================
// CONTENT MODERATION APIs
// ============================================================

/**
 * Get merchant moderation reports
 * @param {object} params - {status, page, limit}
 */
export async function getMerchantModerationReports({ status, page = 1, limit = 30 } = {}) {
    let url = `/ads/reports/merchant/my?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return apiClient(url);
}

/**
 * Update moderation report status
 * @param {string} reportId - Report ID
 * @param {string} status - New status
 */
export async function updateMerchantModerationReportStatus(reportId, status, adminNotes = '') {
    return apiClient(`/ads/reports/${reportId}/merchant-status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminNotes }),
    });
}

/**
 * Verify voucher using verification code (manual entry)
 * @param {string} code - Verification code
 */
export async function verifyVoucherByCode(code) {
    return apiClient(`/vouchers/verify-code`, {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}

// ============================================================
// USER DEALS & VOUCHERS APIs
// ============================================================

/**
 * Get user's claimed vouchers/deals
 * @param {object} params - {page, limit, status}
 */
export async function getUserVouchers({ page = 1, limit = 50, status } = {}) {
    let url = `/vouchers/my-vouchers?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return apiClient(url);
}

/**
 * Calculate user deal statistics
 * Fetches all user vouchers and calculates redeemed deals and savings
 */
export async function getUserDealStatistics() {
    try {
        const result = await getUserVouchers({ limit: 100 });
        if (!result.success || !result.data) {
            return {
                dealsRedeemed: 0,
                totalSavings: 0,
                expired: [],
            };
        }

        const vouchers = result.data || [];
        let dealsRedeemed = 0;
        let totalSavings = 0;
        const expired = [];

        const now = new Date();

        vouchers.forEach(voucher => {
            // Check if voucher is redeemed (status: 'redeemed', 'partially_redeemed', 'used')
            if (voucher.status === 'redeemed' || voucher.status === 'used' || voucher.status === 'partially_redeemed') {
                dealsRedeemed++;
                // Add any discount/savings value from the offer
                if (voucher.discountValue) {
                    totalSavings += voucher.discountValue;
                } else if (voucher.offer?.discountValue) {
                    totalSavings += voucher.offer.discountValue;
                }
            }

            // Check if voucher is expired
            if (voucher.expiryDate && new Date(voucher.expiryDate) < now) {
                expired.push(voucher._id || voucher.id);
            }
        });

        return {
            dealsRedeemed,
            totalSavings,
            expired,
            allVouchers: vouchers,
        };
    } catch (error) {
        console.error('Error calculating deal statistics:', error);
        return {
            dealsRedeemed: 0,
            totalSavings: 0,
            expired: [],
        };
    }
}
