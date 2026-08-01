import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { BASE_URL as CONFIG_BASE_URL } from "../config";
import { getValidToken } from "./authService";

const SEEN_IDS_KEY = "merchantSeenNotificationIds";
let pollingTimer = null;
let pollingInFlight = false;
let pushTokenRegistered = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");
}

async function ensureNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("merchant-notifications", {
      name: "Merchant Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#157a4f",
      sound: "default",
    });
  }

  return true;
}

async function registerPushTokenWithBackend() {
  if (pushTokenRegistered) {
    return;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    const expoToken = token?.data;

    if (!expoToken) {
      return;
    }

    let authToken;
    try {
      authToken = await getValidToken();
    } catch (_authErr) {
      return; // Not authenticated — skip push token registration
    }
    const baseUrl = getBaseUrl();

    if (!authToken || !baseUrl) {
      return;
    }

    await fetch(`${baseUrl}/users/notifications/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken: expoToken }),
    });

    pushTokenRegistered = true;
  } catch (error) {
    console.log("Register push token error:", error);
  }
}

async function getSeenIds() {
  try {
    const merchantId = (await AsyncStorage.getItem("merchantId")) || "default";
    const stored = await AsyncStorage.getItem(`${SEEN_IDS_KEY}:${merchantId}`);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSeenIds(ids) {
  try {
    const merchantId = (await AsyncStorage.getItem("merchantId")) || "default";
    const normalized = Array.isArray(ids) ? ids.slice(0, 50) : [];
    await AsyncStorage.setItem(`${SEEN_IDS_KEY}:${merchantId}`, JSON.stringify(normalized));
  } catch (error) {
    console.log("Save notification IDs error:", error);
  }
}

async function fetchNotifications() {
  let token;
  try {
    token = await getValidToken();
  } catch (_authErr) {
    return []; // Session expired — polling will stop producing results silently
  }
  const baseUrl = getBaseUrl();

  if (!token || !baseUrl) {
    return [];
  }

  let response = await fetch(`${baseUrl}/users/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status === 404) {
    response = await fetch(`${baseUrl}/api/users/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const list = data?.data?.notifications || data?.notifications || [];
  return Array.isArray(list) ? list : [];
}

async function scheduleNewNotifications(notifications) {
  const seenIds = await getSeenIds();
  const seenSet = new Set(seenIds);
  const newNotifications = notifications.filter((item) => {
    const id = String(item?._id || item?.id || "");
    return id && !seenSet.has(id);
  });

  if (!newNotifications.length) {
    return;
  }

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return;
  }

  for (const item of newNotifications.slice(0, 5)) {
    const isAdmin =
      item?.isAdmin ||
      item?.isBroadcast ||
      ["admin_warning", "promotional", "alert", "emergency", "system_update", "admin", "broadcast"].includes(item?.type) ||
      (item?.senderName && String(item.senderName).toLowerCase().includes("admin")) ||
      (item?.title && (!item?.adTitle || item?.adTitle === "-"));

    const title = (isAdmin && item?.title && item.title !== "-")
      ? item.title
      : (item?.title && item.title !== "-" ? item.title : (item?.adTitle && item.adTitle !== "-" ? item.adTitle : (item?.senderName || "New notification")));
    const body = item?.description || item?.message || item?.body || "You have a new notification.";
    const id = String(item?._id || item?.id || "");

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { screen: "NotificationsPage", notificationId: id },
        android: {
          channelId: "merchant-notifications",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          autoDismiss: true,
        },
      },
      trigger: null,
    });
  }

  const latestIds = notifications
    .map((item) => String(item?._id || item?.id || ""))
    .filter(Boolean)
    .slice(0, 50);

  await saveSeenIds(latestIds);
}

export async function pollMerchantNotifications() {
  if (pollingInFlight) return;
  pollingInFlight = true;

  try {
    const notifications = await fetchNotifications();
    if (notifications.length) {
      await scheduleNewNotifications(notifications);
    }
  } catch (error) {
    console.log("Merchant notification poll error:", error);
  } finally {
    pollingInFlight = false;
  }
}

export async function startMerchantNotificationPolling() {
  if (pollingTimer) return;

  const permissionGranted = await ensureNotificationPermission();
  if (permissionGranted) {
    await registerPushTokenWithBackend();
  }
  await pollMerchantNotifications();

  pollingTimer = setInterval(() => {
    void pollMerchantNotifications();
  }, 30000);
}

export function stopMerchantNotificationPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}
