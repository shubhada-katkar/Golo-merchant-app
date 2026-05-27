import React, { useContext, useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

export default function ({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLoyaltyData = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = (await AsyncStorage.getItem("merchantToken")) || (await AsyncStorage.getItem("accessToken"));
            if (!token) {
                throw new Error("Merchant authentication token not found.");
            }

            let response = await fetch(`${BASE_URL}/merchant-dashboard/loyalty-leaderboard`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                response = await fetch(`${BASE_URL}/api/merchant-dashboard/loyalty-leaderboard`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.message || payload?.error || `Failed to load loyalty data (${response.status})`);
            }

            const loyaltyRows = Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.data?.data)
                    ? payload.data.data
                    : [];

            setCustomers(loyaltyRows);
        } catch (fetchError) {
            console.error("LoyaltyPage fetch error:", fetchError);
            setError(fetchError?.message || "Unable to load loyalty data.");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const aggregatedCustomers = useMemo(() => {
        if (!customers?.length) return [];

        const customerMap = new Map();

        customers.forEach((row) => {
            const customerId = String(
                row.userId || row.email || row.userEmail || row.user?.email || row.userName || row.name || row.voucherId || ''
            );
            const points = Number(
                row.points ??
                row.merchantPoints ??
                row.totalPoints ??
                row.loyaltyPointsCredited ??
                row.loyaltyPoints ??
                row.loyaltyPointsPerPurchase ??
                row.offer?.loyaltyPointsPerPurchase ??
                0
            );
            const redeemedAt = row.redeemedAt || row.claimedAt || row.createdAt || null;
            const previous = customerMap.get(customerId);

            if (previous) {
                previous.merchantPoints += points;
                previous.offerCount += 1;
                if (redeemedAt) {
                    const previousDate = previous.lastRedeemedAt ? new Date(previous.lastRedeemedAt) : null;
                    const currentDate = new Date(redeemedAt);
                    if (!previousDate || currentDate > previousDate) {
                        previous.lastRedeemedAt = redeemedAt;
                    }
                }
                if (!previous.userName && (row.userName || row.name || row.email || row.userEmail)) {
                    previous.userName = row.userName || row.name || row.email || row.userEmail;
                }
            } else {
                customerMap.set(customerId, {
                    customerId,
                    userName: row.userName || row.name || row.userEmail || row.email || 'Customer',
                    userEmail: row.userEmail || row.email || null,
                    merchantPoints: points,
                    offerCount: 1,
                    lastRedeemedAt: redeemedAt,
                });
            }
        });

        return Array.from(customerMap.values()).sort(
            (a, b) => b.merchantPoints - a.merchantPoints,
        );
    }, [customers]);

    const topCustomerIds = useMemo(() => {
        if (!aggregatedCustomers?.length) return [];
        return aggregatedCustomers.slice(0, 3).map((customer) => customer.customerId);
    }, [aggregatedCustomers]);

    useEffect(() => {
        fetchLoyaltyData();
        const interval = setInterval(fetchLoyaltyData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.row1}>
                    <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Loyalty Rewards</Text>
                </View>

                <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryText, { color: colors.text }]}>Active Customers</Text>
                    <Text style={[styles.summaryText, { color: colors.text }]}>Loyalty points</Text>
                </View>

                <View style={styles.row2}>
                    {loading ? (
                        <View style={styles.loaderWrapper}>
                            <ActivityIndicator size="large" color={colors.primary || "#000"} />
                            <Text style={[styles.statusText, { color: colors.text }]}>Loading loyalty rewards...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.loaderWrapper}>
                            <Text style={[styles.statusText, { color: colors.error || "#b00020" }]}>{error}</Text>
                        </View>
                    ) : customers.length === 0 ? (
                        <View style={styles.loaderWrapper}>
                            <Text style={[styles.statusText, { color: colors.text }]}>No loyalty customer records found yet.</Text>
                        </View>
                    ) : (
                        aggregatedCustomers.map((customer, index) => {
                            const merchantPoints = customer.merchantPoints || 0;
                            const isTopCustomer = topCustomerIds.includes(customer.customerId);
                            const formattedDate = customer.lastRedeemedAt
                                ? new Date(customer.lastRedeemedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                                : null;

                            // Create initial from name
                            const initial = String(customer.userName || 'C').charAt(0).toUpperCase();

                            // Pick a dynamic beautiful HSL background color for avatar based on name hash
                            let charCodeSum = 0;
                            for (let i = 0; i < (customer.userName || '').length; i++) {
                                charCodeSum += (customer.userName || '').charCodeAt(i);
                            }
                            const hue = charCodeSum % 360;
                            const avatarBgColor = `hsl(${hue}, 65%, 45%)`;

                            return (
                                <View key={`${customer.customerId || index}-${index}`} style={[styles.card1, { borderColor: colors.divider || "#e5e7eb", backgroundColor: colors.card || "#ffffff" }]}>
                                    <View style={styles.cardLeft}>
                                        {customer.profilePhoto ? (
                                            <Image source={{ uri: customer.profilePhoto }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarBgColor }]}>
                                                <Text style={styles.avatarText}>{initial}</Text>
                                            </View>
                                        )}
                                        <View style={styles.customerInfo}>
                                            <Text style={[styles.customerName, { color: colors.text || "#111827" }]} numberOfLines={1}>
                                                {customer.userName || 'Customer'}
                                            </Text>
                                            {customer.userEmail ? (
                                                <Text style={[styles.customerEmail, { color: colors.subText || "#6b7280" }]} numberOfLines={1}>
                                                    {customer.userEmail}
                                                </Text>
                                            ) : null}
                                            <View style={styles.statsRow}>
                                                <Text style={[styles.detailText, { color: colors.subText || "#6b7280" }]}>
                                                    Redeemed {customer.offerCount || 0} {customer.offerCount === 1 ? 'offer' : 'offers'}
                                                </Text>
                                                {formattedDate ? (
                                                    <Text style={[styles.detailText, { color: colors.subText || "#6b7280" }]}>
                                                        {"  •  "}Last: {formattedDate}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.cardRight}>
                                        <View style={[styles.pointsBadge, { backgroundColor: isTopCustomer ? "#fef3c7" : "#f3f4f6" }]}>
                                            {isTopCustomer && (
                                                <MaterialIcons name="star" size={14} color="#d97706" style={{ marginRight: 3 }} />
                                            )}
                                            <Text style={[styles.pointsLabel, { color: isTopCustomer ? "#d97706" : "#374151" }]}>
                                                {merchantPoints} pts
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    pageTitle: {
        fontSize: 18,
        paddingLeft: 5,
        fontFamily: "Medium",
        lineHeight: Math.round(18 * 1.2),
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    summaryText: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.2),
    },
    row2: {
        paddingHorizontal: 14,
        paddingBottom: 120,
    },
    card1: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    cardRight: {
        justifyContent: "center",
        alignItems: "flex-end",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
    customerInfo: {
        marginLeft: 14,
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    customerEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    pointsBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    pointsLabel: {
        fontSize: 14,
        fontWeight: "bold",
    },
    detailText: {
        fontSize: 12,
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 999,
        backgroundColor: "#e5e7eb",
        overflow: "hidden",
        marginTop: 12,
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 999,
    },
    loaderWrapper: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    statusText: {
        marginTop: 10,
        fontSize: 15,
        textAlign: "center",
        fontFamily: "Medium",
        lineHeight: Math.round(15 * 1.2),
    },
});