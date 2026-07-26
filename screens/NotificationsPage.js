import React, { useContext, useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { BASE_URL as CONFIG_BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

function formatRelativeTime(value) {
    if (!value) return "Just now";

    const diffMs = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function Notifications({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");

    const getAuthToken = async () => {
        return await getValidToken();
    };

    const loadNotifications = useCallback(async (showLoader = false, isRefresh = false) => {
        try {
            if (showLoader) setLoading(true);
            if (isRefresh) setRefreshing(true);

            let token;
            try {
                token = await getAuthToken();
            } catch (authErr) {
                await handleAuthError(navigation);
                return;
            }
            if (!BASE_URL) {
                setNotifications([]);
                return;
            }

            let res = await fetch(`${BASE_URL}/users/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                await handleAuthError(navigation);
                return;
            }

            if (!res.ok && res.status === 404) {
                res = await fetch(`${BASE_URL}/api/users/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const data = await res.json();
            const list = data?.data?.notifications || data?.notifications || [];
            setNotifications(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log("Notifications fetch error:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [BASE_URL]);

    const markAllAsSeen = useCallback(async () => {
        try {
            const token = await getAuthToken();
            if (!token || !BASE_URL) return;

            let res = await fetch(`${BASE_URL}/users/notifications/read-all`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${BASE_URL}/api/users/notifications/read-all`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (res.ok) {
                setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
            }
        } catch (error) {
            console.log("Mark notifications as seen error:", error);
        }
    }, [BASE_URL]);

    useEffect(() => {
        const initialiseNotifications = async () => {
            await loadNotifications(true);
            await markAllAsSeen();
        };

        initialiseNotifications();
    }, [loadNotifications, markAllAsSeen]);

    const renderItem = ({ item }) => {
        const title = item.senderName || item.title || item.adTitle || "Notification";
        const message = item.message || item.body || item.adTitle || "You have a new notification.";
        const dateLabel = formatRelativeTime(item.createdAt || item.timestamp || item.updatedAt);
        const initials = String(title)
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
        const isAccepted = item?.type === "order_accepted";

        return (
            <View style={styles.card}>
                <View style={styles.cardFooter}>
                    <MaterialIcons
                        name={isAccepted ? "check-circle" : "notifications-active"}
                        size={18}
                        color={isAccepted ? "#16a34a" : "#f8a812"}
                    />
                    <Text style={styles.cardFooterText} numberOfLines={1}>
                        {isAccepted ? "Accepted" : "New update"}
                    </Text>
                </View>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                            {title}
                        </Text>
                        <Text style={styles.cardMessage} numberOfLines={3}>
                            {message}
                        </Text>
                        <Text style={styles.cardMeta}>{dateLabel}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerGradient}
            />

            <Topbar />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} style={styles.backButton} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{notifications.length > 0 ? "Seen" : "Live"}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#f8a812" />
                    <Text style={styles.emptyText}>Loading your updates...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id || item.id || `${item.createdAt || "notification"}-${Math.random()}`}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadNotifications(false, true)}
                            tintColor="#f8a812"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerState}>
                            <MaterialIcons name="notifications-none" size={44} color="#b7b7b7" />
                            <Text style={styles.emptyTitle}>No notifications yet</Text>
                            <Text style={styles.emptyText}>New merchant updates will appear here instantly.</Text>
                        </View>
                    }
                    renderItem={renderItem}
                />
            )}

            <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerGradient: {
        height: 220,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 1,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        ...textPresets.title,
    },
    headerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#fff3d6",
        overflow: "hidden",
    },
    headerBadgeText: {
        ...textPresets.label,
        color: "#8a5a00",
        lineHeight: Math.round(14 * 1.5),
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#fff6df",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarText: {
        ...textPresets.subtitle,
        color: "#8a5a00",
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        ...textPresets.body,
        marginBottom: 4,
        lineHeight: Math.round(14 * 1.5),
    },
    cardMessage: {
        ...textPresets.label,
        color: "#6b7280",
    },
    cardMeta: {
        ...textPresets.label,
        color: "#9ca3af",
        marginTop: 6,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    cardFooterText: {
        ...textPresets.label,
        color: "#6b7280",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        width: "100%",
    },
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    emptyTitle: {
        ...textPresets.subtitle,
        marginTop: 10,
        color: "#111827",
    },
    emptyText: {
        color: "#6b7280",
        textAlign: "center",
        marginTop: 6,
        ...textPresets.body,
    },
});