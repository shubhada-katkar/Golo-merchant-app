import React, { useContext, useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

export default function ({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

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

            const loyaltyRows = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
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
                row.userId || row._id || row.email || row.userEmail || row.user?.email || row.userName || row.name || row.voucherId || ''
            );
            const points = Number(
                row.totalPoints ??
                row.points ??
                row.merchantPoints ??
                row.loyaltyPointsCredited ??
                row.loyaltyPoints ??
                row.loyaltyPointsPerPurchase ??
                row.offer?.loyaltyPointsPerPurchase ??
                0
            );
            const redeemedAt = row.redeemedAt || row.claimedAt || row.createdAt || null;
            const previous = customerMap.get(customerId);
            const rowOfferCount = Number(row.offersClaimed ?? row.offerCount ?? 0);

            if (previous) {
                previous.merchantPoints += points;
                previous.offerCount += rowOfferCount || 1;
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
                    userName: row.name || row.userName || row.userEmail || row.email || 'Customer',
                    userEmail: row.userEmail || row.email || null,
                    merchantPoints: points,
                    offerCount: rowOfferCount || 1,
                    lastRedeemedAt: redeemedAt,
                });
            }
        });

        return Array.from(customerMap.values()).sort(
            (a, b) => b.merchantPoints - a.merchantPoints,
        );
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return aggregatedCustomers;

        return aggregatedCustomers.filter((customer) => {
            const haystack = [
                customer.userName,
                customer.userEmail,
                customer.customerId,
                customer.merchantPoints,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [aggregatedCustomers, searchQuery]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <LinearGradient
            colors={["#f8a812", "#fad081", "#fffbf4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
        />

        <Topbar />

        <View style={styles.row1}>
            <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Loyalty Rewards</Text>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

        <ScrollView contentContainerStyle={{paddingBottom:90}} style={styles.container}>
            <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color="#8e8e93" style={{ marginRight: 6 }} />
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search Customer"
                    placeholderTextColor="#8e8e93"
                    style={styles.searchInput}
                />
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
                    filteredCustomers.map((customer, index) => {
                        const merchantPoints = customer.merchantPoints || 0;
                        const isTopCustomer = topCustomerIds.includes(customer.customerId);
                        const initial = String(customer.userName || "C").charAt(0).toUpperCase();
                        const isLast = index === filteredCustomers.length - 1;

                        return (
                            <View
                                key={`${customer.customerId || index}-${index}`}
                                style={[
                                    styles.card1,
                                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider || "#e5e7eb" },
                                ]}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>{initial}</Text>
                                    </View>
                                    <View style={styles.customerInfo}>
                                        <Text
                                            style={[
                                                styles.customerName,
                                                { color: isTopCustomer ? "#105c3b" : colors.text || "#111827" },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {customer.userName || "Customer"}
                                        </Text>
                                        {customer.userEmail ? (
                                            <Text
                                                style={[styles.customerEmail, { color: colors.subText || "#6b7280" }]}
                                                numberOfLines={1}
                                            >
                                                {customer.userEmail}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                        <View style={[ styles.pointsBadge, { backgroundColor: isTopCustomer ? "#f8d612" : "#f3f4f6" } ]}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                            {isTopCustomer && (
                                <MaterialIcons name="star" size={14} color="#000000" style={{ marginRight: 4 }} /> )}

                            <Text style={[ styles.pointsNumber,  { color: isTopCustomer ? "#000000" : "#374151" } ]} >
                            {merchantPoints}
                            </Text>
                        </View>

                         <Text style={[ styles.pointsLabel, { color: isTopCustomer ? "#000000" : "#6b7280" }]} >
                         Points
                         </Text>
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

// ─── REPLACE StyleSheet ───────────────────────────────────────────────────────
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
        ...textPresets.title,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        marginHorizontal: 14,
        marginTop: 14,
        marginBottom: 4,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: "#d1d5db",
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        ...textPresets.body,
    },
    row2: {
        marginHorizontal: 14,
        marginTop: 10,
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: "#e5e7eb",
        paddingBottom: 120,
        overflow: "hidden",
    },
    card1: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#b6dbc3",
        justifyContent: "center",
        alignItems: "center",
        borderWidth:1,
        borderColor:"#157a4f"
    },
    avatarText: {
        color: "#157a4f",
        ...textPresets.subtitle,
    },
    customerInfo: {
        marginLeft: 14,
        flex: 1,
    },
    customerName: {
        ...textPresets.body,
    },
    customerEmail: {
        ...textPresets.caption,
    },
    pointsBadge: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth:0.5
    },
    pointsNumber: {
        ...textPresets.subtitle,
    },
    pointsLabel: {
        ...textPresets.label,
    },
    loaderWrapper: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    statusText: {
        marginTop: 10,
      textAlign: "center",
        ...textPresets.caption
    },
});