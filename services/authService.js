/**
 * authService.js – Merchant App
 *
 * Centralises all authentication helpers so every screen can call
 * `getValidToken()` instead of repeating AsyncStorage + refresh logic.
 *
 * Backend contract:
 *   POST /users/refresh  { refreshToken } → { data: { accessToken } } | { accessToken }
 *   POST /users/logout   { refreshToken } (Bearer access token required)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

// ─── Key names ────────────────────────────────────────────────────────────────
const ACCESS_KEY = "merchantToken";
const REFRESH_KEY = "merchantRefreshToken";
const DATA_KEY = "merchantData";
const ID_KEY = "merchantId";

// ─── In-memory refresh promise (prevents parallel refresh storms) ─────────────
let _refreshPromise = null;

/**
 * Returns a fresh, valid access token.
 *
 * Strategy:
 *  1. Read the stored access token.
 *  2. If it still has > 60 s of life, return it as-is.
 *  3. Otherwise call /users/refresh with the stored refresh token.
 *  4. Persist the new access token and return it.
 *  5. If refresh fails (expired / revoked), clear storage and throw so
 *     callers know the merchant must log in again.
 */
export async function getValidToken() {
  const accessToken = await AsyncStorage.getItem(ACCESS_KEY);
  const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);

  // No tokens at all → not logged in
  if (!accessToken && !refreshToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  // Check whether the access token is still valid (has > 60 s left)
  if (accessToken && !isTokenExpiredSoon(accessToken)) {
    return accessToken;
  }

  // Access token expired (or missing) → try refresh
  if (!refreshToken) {
    await clearAuthStorage();
    throw new Error("SESSION_EXPIRED");
  }

  // Deduplicate concurrent refresh calls
  if (!_refreshPromise) {
    _refreshPromise = doRefresh(refreshToken).finally(() => {
      _refreshPromise = null;
    });
  }

  return _refreshPromise;
}

/**
 * Performs the actual refresh API call.
 */
async function doRefresh(refreshToken) {
  try {
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearAuthStorage();
      throw new Error("SESSION_EXPIRED");
    }

    const json = await res.json();
    // Backend may wrap in data or return directly
    const newAccessToken = json?.data?.accessToken || json?.accessToken;

    if (!newAccessToken) {
      await clearAuthStorage();
      throw new Error("SESSION_EXPIRED");
    }

    await AsyncStorage.setItem(ACCESS_KEY, newAccessToken);
    return newAccessToken;
  } catch (err) {
    if (err.message === "SESSION_EXPIRED" || err.message === "NOT_AUTHENTICATED") {
      throw err;
    }
    // Network error – don't clear storage, just rethrow
    throw new Error("NETWORK_ERROR");
  }
}

/**
 * Checks if a JWT access token will expire within the next 60 seconds.
 * Returns true  → token is expired or expiring soon (refresh needed).
 * Returns false → token is still valid.
 */
function isTokenExpiredSoon(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      typeof atob === "function"
        ? atob(parts[1])
        : Buffer.from(parts[1], "base64").toString("utf8")
    );
    if (!payload.exp) return false; // no expiry claim → treat as valid
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp - nowSec < 60; // refresh when < 60 s remain
  } catch {
    return true; // malformed token → force refresh
  }
}

/**
 * Helper to remove all restriction/moderation flag keys from AsyncStorage.
 */
export async function clearRestrictionStorage() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const restrictionKeys = allKeys.filter(
      (key) =>
        key.startsWith("golo_restricted_until:") ||
        key.startsWith("golo_images_flagged:") ||
        key.includes("golo_restricted") ||
        key.includes("golo_images_flagged")
    );
    if (restrictionKeys.length > 0) {
      await AsyncStorage.multiRemove(restrictionKeys);
    }
  } catch (e) {
    console.warn("Failed to clear restriction storage keys:", e);
  }
}

/**
 * Removes all merchant auth keys and moderation/restriction cache keys from AsyncStorage.
 */
export async function clearAuthStorage() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, DATA_KEY, ID_KEY]);
  await clearRestrictionStorage();
}

/**
 * Saves auth data returned by the login endpoint.
 */
export async function saveAuthData({ accessToken, refreshToken, merchant, merchantId }) {
  await clearRestrictionStorage();
  await AsyncStorage.multiSet([
    [ACCESS_KEY, accessToken],
    [REFRESH_KEY, refreshToken || ""],
    [DATA_KEY, JSON.stringify(merchant)],
    [ID_KEY, String(merchantId || "")],
  ]);
}

/**
 * Handles a fatal auth error (SESSION_EXPIRED, NOT_AUTHENTICATED, or a 401
 * response from the backend).
 *
 * Clears all stored auth data and navigates the user back to the Login screen.
 * Pass the `navigation` object from the calling screen.
 */
export async function handleAuthError(navigation) {
  try {
    await clearAuthStorage();
  } catch (_) {
    // Ignore storage errors during forced logout
  }
  if (navigation) {
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }
}

/**
 * Quick check: is there any session data in storage?
 * Used by AuthLoading to decide whether to attempt a refresh at startup.
 */
export async function hasStoredSession() {
  const results = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  return results.some(([, value]) => !!value);
}

/**
 * Helper to perform authenticated HTTP fetch requests.
 * Automatically injects the Authorization header with a valid access token.
 */
export async function authenticatedFetch(url, options = {}) {
  const token = await getValidToken();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  return fetch(url, { ...options, headers });
}

