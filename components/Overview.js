import React, { useState, useContext, useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform } from "react-native";
import { Octicons, AntDesign, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme/ThemeContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { enrichOrderDetails, enrichOrdersList } from "../services/orderService";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from '../theme/typography';

export default function Overview() {

    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);
    const [shopName, setShopName] = useState("Shop Name");
    const [profileImage, setProfileImage] = useState(require("../assets/profile.png"));
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [uniqueClaimedCustomers, setUniqueClaimedCustomers] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [visitsTrend, setVisitsTrend] = useState({ labels: [], values: [] });
    const [trendPeriod, setTrendPeriod] = useState("weekly");

    const getActiveData = () => {
        if (trendPeriod === "weekly") {
            return {
                labels: visitsTrend.labels || [],
                values: visitsTrend.values || [],
            };
        } else {
            const labels = [];
            const values = [];
            const now = new Date();

            // Generate labels for 30 days
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const lbl = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                labels.push(lbl);
                values.push(0);
            }

            // Overwrite the last items with available trend values from backend
            const bLabels = visitsTrend.labels || [];
            const bValues = visitsTrend.values || [];
            const startIdx = Math.max(0, 30 - bValues.length);

            for (let i = 0; i < bValues.length; i++) {
                const destIdx = startIdx + i;
                if (destIdx < 30) {
                    values[destIdx] = Number(bValues[i] || 0);
                    if (bLabels[i]) {
                        labels[destIdx] = bLabels[i];
                    }
                }
            }

            return { labels, values };
        }
    };

    const normalizeImageUrl = (value) => {
        if (!value) return null;
        if (typeof value === "object") {
            const candidates = [
                value.secure_url,
                value.url,
                value.imageUrl,
                value.photo,
                value.profilePhoto,
                value.shopPhoto,
                value.uri,
                value.path,
            ];
            for (const candidate of candidates) {
                const normalized = normalizeImageUrl(candidate);
                if (normalized) return normalized;
            }
            return null;
        }
        if (typeof value !== "string") return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("data:") || trimmed.startsWith("base64,")) return trimmed;
        if (trimmed.startsWith("//")) return `https:${trimmed}`;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `${BASE_URL.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
    };

    const timeAgo = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const resolveRating = (item) => {
        const rating = Number(item?.rating ?? item?.stars ?? 0);
        if (!Number.isFinite(rating)) return 0;
        return Math.min(5, Math.max(0, rating));
    };

    const handleOpenCustomerApp = async () => {
        const customerAppScheme = "golo://";
        const fallbackUrl = "https://drive.google.com/drive/folders/1x7QPqCVtgoZfIUd8iblraYAXdc4RWM5y";

        try {
            await Linking.openURL(customerAppScheme);
        } catch (error) {
            console.log("Customer app not installed, opening Drive link:", error);
            await Linking.openURL(fallbackUrl);
        }
    };

    // ✅ Fetch profile and latest merchant reviews every time screen opens
    useFocusEffect(
        useCallback(() => {
            let active = true;

            const fetchProfile = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch (authErr) {
                        await handleAuthError(navigation);
                        return;
                    }
                    if (!token) return;

                    let res = await fetch(`${BASE_URL}/users/merchant/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (res.status === 401) {
                        await handleAuthError(navigation);
                        return;
                    }

                    if (!res.ok && res.status === 404) {
                        res = await fetch(`${BASE_URL}/merchant/profile`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                    }

                    const data = await res.json();
                    const merchantData = data?.data || data?.merchant || data || null;

                    if (!active) return;

                    if (merchantData) {
                        setShopName(merchantData.storeName || merchantData.shopName || "Shop Name");
                        const imageUrl = normalizeImageUrl(
                            merchantData.profilePhoto ||
                            merchantData.shopPhoto ||
                            merchantData.image ||
                            merchantData.profilePhotoUrl ||
                            merchantData.photo
                        );

                        if (imageUrl) {
                            setProfileImage({ uri: imageUrl });
                        } else {
                            setProfileImage(require("../assets/profile.png"));
                        }
                    }
                } catch (error) {
                    console.log("Overview profile fetch error:", error);
                }
            };

            const fetchUniqueCustomers = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch (_authErr) { return; }
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/merchant-dashboard/analytics/events`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.status === 401) { await handleAuthError(navigation); return; }
                    const data = await res.json();
                    const count = data?.data?.totalActive || 0;
                    if (active) setUniqueClaimedCustomers(count);
                } catch (error) {
                    console.log("Overview unique customers fetch error:", error);
                }
            };

            const fetchShopVisitsTrend = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch (_authErr) { return; }
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/merchant-dashboard/analytics/trend`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.status === 401) { await handleAuthError(navigation); return; }
                    const data = await res.json();
                    const payload = data?.data || data || {};
                    if (active) setVisitsTrend({ labels: payload.labels || [], values: payload.values || [] });
                } catch (error) {
                    console.log("Overview shop visits fetch error:", error);
                }
            };

            const fetchRecentOrders = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch (_authErr) { return; }
                    if (!token) return;

                    let res = await fetch(`${BASE_URL}/orders/merchant?page=1&limit=2`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (res.status === 401) { await handleAuthError(navigation); return; }

                    if (!res.ok && res.status === 404) {
                        res = await fetch(`${BASE_URL}/api/orders/merchant?page=1&limit=2`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }

                    let data = await res.json();
                    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : data?.orders || [];
                    const slicedOrders = list.slice(0, 2);
                    const enrichedOrders = await enrichOrdersList(slicedOrders, token);
                    if (active) setRecentOrders(enrichedOrders);
                } catch (error) {
                    console.log("Overview recent orders fetch error:", error);
                }
            };

            const fetchReviews = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch (_authErr) { return; }
                    if (!token) return;

                    setReviewsLoading(true);
                    const res = await fetch(`${BASE_URL}/reviews/merchant?page=1&limit=2`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (res.status === 401) { await handleAuthError(navigation); return; }

                    const data = await res.json();
                    if (!active) return;

                    const list = Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data)
                            ? data
                            : [];
                    setReviews(list.slice(0, 2));
                } catch (error) {
                    console.log("Overview review fetch error:", error);
                } finally {
                    if (active) {
                        setReviewsLoading(false);
                    }
                }
            };

            fetchProfile();
            fetchReviews();
            fetchUniqueCustomers();
            fetchShopVisitsTrend();
            fetchRecentOrders();

            return () => {
                active = false;
            };
        }, [])
    );

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}
            style={{ backgroundColor: "transparent" }}>

            {/* ===== PROFILE HEADER ===== */}
            <View style={[styles.profileCard, { marginTop: 16 }]}>
                <Image source={profileImage} style={{ height: 90, width: 90, borderRadius: 46 }} />

                <View style={{ flexDirection: "column", paddingHorizontal: 14, maxWidth: "75%" }}>
                    <Text style={{ ...textPresets.title }} numberOfLines={1} ellipsizeMode="tail">
                        {shopName}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{
                            color: "#9ca3af", ...textPresets.label
                        }}>
                            Total Customers
                        </Text>

                        <Text style={{
                            ...textPresets.label, color: "#157a4f"
                        }}>
                            {uniqueClaimedCustomers}
                        </Text>

                    </View>
                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 16 }}>
                <View style={styles.graph}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 6 }}>
                        <Text style={{ ...textPresets.label }}>
                            Shop Visits
                        </Text>
                        <Octicons name="graph" size={16} color="green" style={{ paddingLeft: 8 }} />
                    </View>

                    <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 2, alignSelf: "flex-end" }}>
                        <TouchableOpacity
                            style={{
                                paddingVertical: 4,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                backgroundColor: trendPeriod === 'weekly' ? '#157a4f' : 'transparent',
                            }}
                            onPress={() => setTrendPeriod('weekly')}
                        >
                            <Text style={{ ...textPresets.caption, color: trendPeriod === 'weekly' ? '#ffffff' : '#6b7280' }}>
                                Weekly
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                paddingVertical: 4,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                backgroundColor: trendPeriod === 'monthly' ? '#157a4f' : 'transparent',
                            }}
                            onPress={() => setTrendPeriod('monthly')}
                        >
                            <Text style={{ ...textPresets.caption, color: trendPeriod === 'monthly' ? '#ffffff' : '#6b7280' }}>
                                Monthly
                            </Text>
                        </TouchableOpacity>
                    </View>


                    {/* Bar chart with Y axis (numbers) and X axis (dates) */}
                    {visitsTrend.values && visitsTrend.values.length > 0 ? (
                        (() => {
                            const { labels: activeLabels, values: activeValues } = getActiveData();
                            const vals = activeValues.map(v => Number(v || 0));
                            const max = Math.max(...vals, 1);
                            const chartHeight = 120;
                            const steps = 3; // number of ticks on Y axis

                            return (
                                <View style={{ marginTop: 6 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Y axis labels */}
                                        <View style={{ width: 26, height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 2 }}>
                                            {Array.from({ length: steps + 1 }).map((_, i) => {
                                                const t = steps - i;
                                                const value = Math.round((t / steps) * max);
                                                return (
                                                    <Text key={i} style={{
                                                        color: '#6b7280',
                                                        ...textPresets.label
                                                    }}>{value}</Text>
                                                );
                                            })}
                                        </View>

                                        {/* Y axis line */}
                                        <View style={{ width: 1, height: chartHeight, backgroundColor: '#cbd5e1' }} />

                                        {/* Scrollable / Non-scrollable area */}
                                        {trendPeriod === "monthly" ? (
                                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
                                                <View style={{ width: activeLabels.length * 45 }}>
                                                    {/* Bars container */}
                                                    <View style={{ height: chartHeight, position: 'relative', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' }}>
                                                        {/* Horizontal grid lines */}
                                                        {Array.from({ length: steps + 1 }).map((_, gi) => {
                                                            const top = Math.round((gi / steps) * chartHeight);
                                                            return (
                                                                <View
                                                                    key={"grid-" + gi}
                                                                    style={{ position: 'absolute', left: 0, right: 0, top: top, height: 1, backgroundColor: '#e6eef2' }}
                                                                />
                                                            );
                                                        })}

                                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
                                                            {vals.map((v, i) => {
                                                                const barHeight = Math.max(6, Math.round((v / max) * chartHeight));
                                                                return (
                                                                    <View key={i} style={{ width: 45, alignItems: 'center' }}>
                                                                        <View style={{ width: 14, borderRadius: 4, backgroundColor: '#34d399', height: barHeight }} />
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>

                                                    {/* X axis labels (dates) */}
                                                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                                        {activeLabels.map((lbl, i) => (
                                                            <View key={i} style={{ width: 45, alignItems: 'center' }}>
                                                                <Text style={{ ...textPresets.caption, color: '#6b7280' }} numberOfLines={1}>{lbl || ''}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </ScrollView>
                                        ) : (
                                            <View style={{ flex: 1 }}>
                                                {/* Bars container */}
                                                <View style={{ height: chartHeight, position: 'relative', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' }}>
                                                    {/* Horizontal grid lines */}
                                                    {Array.from({ length: steps + 1 }).map((_, gi) => {
                                                        const top = Math.round((gi / steps) * chartHeight);
                                                        return (
                                                            <View
                                                                key={"grid-" + gi}
                                                                style={{ position: 'absolute', left: 0, right: 0, top: top, height: 1, backgroundColor: '#e6eef2' }}
                                                            />
                                                        );
                                                    })}

                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
                                                        {vals.map((v, i) => {
                                                            const barHeight = Math.max(6, Math.round((v / max) * chartHeight));
                                                            return (
                                                                <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
                                                                    <View style={{ width: 12, borderRadius: 4, backgroundColor: '#34d399', height: barHeight }} />
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>

                                                {/* X axis labels (dates) */}
                                                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                                                    {activeLabels.map((lbl, i) => (
                                                        <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
                                                            <Text style={{ ...textPresets.caption, color: '#6b7280' }} numberOfLines={1}>{lbl || ''}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })()
                    ) : (
                        <Text style={{ color: '#9ca3af' }}>No visit data</Text>
                    )}
                </View>
            </View>

            <View style={styles.columncontainer}>
                <Text style={styles.text}>Recent Orders</Text>

                {recentOrders.length > 0 ? (
                    recentOrders.map((o, idx) => {
                        const placed = o.placedAt || o.createdAt || o.placedAt;
                        const customer = o.customerName || o.userName || o.userEmail || (o.user && o.user.name) || "Customer";
                        const offer = o.offerTitle || o.offerName || o.voucher?.offerTitle || o.offer?.title || "Offer";
                        const offerType = o.offerType || o.voucher?.offerType || o.offer?.type || "";
                        const status = String(o?.status || o?.orderStatus || o?.voucher?.status || "").toLowerCase();
                        const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
                        const initials = customer.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                        return (
                            <TouchableOpacity key={idx} style={[styles.card2, styles.orderCard, { backgroundColor: "#ffffff" }]} onPress={() => navigation.navigate("OrderDetailPage", { order: o })}>
                                {/* Customer row with avatar */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 }}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>{initials}</Text>
                                    </View>
                                    <View style={{ flex: 1, paddingLeft: 10 }}>
                                        <Text style={{ color: '#111827', ...textPresets.subtitle }}>
                                            {customer}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            <MaterialIcons name="access-time" size={12} color="#999999" />
                                            <Text style={{ ...textPresets.label, color: '#999999' }}>
                                                Purchased {timeAgo(placed)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: '#919191', marginHorizontal: 10, marginTop: 8 }} />

                                <View style={styles.metaBlock}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialIcons name="punch-clock" size={14} color="#106440" />
                                        <Text style={styles.metaLabel}>Order Status</Text>
                                    </View>
                                    <Text style={[styles.metaValue, { color: status === "completed" ? "#106440" : status === "accepted" ? "#157a4f" : "#6b7280" }]}>{statusLabel}</Text>
                                </View>

                                {/* Offer Name row */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <MaterialIcons name="shopping-cart" size={14} color="#da9412" />
                                        <Text style={{ ...textPresets.label, color: "#5f5f5f" }}>
                                            Offer Name
                                        </Text>
                                    </View>
                                    <Text style={{ ...textPresets.label, color: '#da9412', maxWidth: '60%' }} numberOfLines={1} ellipsizeMode="tail">
                                        {offer}
                                    </Text>
                                </View>

                                {/* Offer Type row */}
                                {offerType ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingTop: 4, paddingBottom: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <MaterialIcons name="local-offer" size={15} color="#9ca3af" />
                                            <Text style={{ ...textPresets.label, color: '#6b7280' }}>
                                                Offer Type
                                            </Text>
                                        </View>
                                        <Text style={{ ...textPresets.label, color: '#157a4f' }}>
                                            {offerType}
                                        </Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.card2}>
                        <Text style={{ padding: 10, color: "#6b7280", ...textPresets.label }}>
                            No recent orders
                        </Text>
                    </View>
                )}

                <Text style={styles.text}>Reviews</Text>

                {reviewsLoading ? (
                    <View style={styles.card2}>
                        <ActivityIndicator size="small" color="#0f766e" style={{ marginTop: 16 }} />
                    </View>
                ) : reviews.length > 0 ? (
                    reviews.map((item, index) => {
                        const rating = resolveRating(item);
                        return (
                            <View key={index} style={[styles.card2, styles.reviewCard]}>
                                <View style={{
                                    flexDirection: 'row', paddingHorizontal: 10,
                                    justifyContent: "space-between", alignItems: "center"
                                }}>
                                    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                                        <MaterialCommunityIcons name="account-circle-outline" size={18} color="#157a4f" />
                                        <Text style={{
                                            ...textPresets.label, color: "#157a4f"
                                        }}>
                                            {item.userName || item.userEmail || "Customer"}
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                        {Array.from({ length: 5 }).map((_, starIndex) => (
                                            <AntDesign
                                                key={starIndex}
                                                name="star"
                                                size={18}
                                                color={starIndex < rating ? "#f5de0b" : "#dadada"}
                                            />
                                        ))}
                                    </View>
                                </View>

                                <Text style={{
                                    paddingHorizontal: 10, paddingTop: 4, color: "#4b5563", ...textPresets.label
                                }}>
                                    {item.content || "No review text provided."}
                                </Text>
                                {item.createdAt ? (
                                    <Text style={styles.reviewDate}>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                ) : null}
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.card2}>
                        <Text style={{ padding: 10, color: "#6b7280", ...textPresets.label }}>
                            No recent reviews yet.
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate("AllReviewsPage")}
                >
                    <Text style={styles.seeAllText}>See More</Text>
                    <AntDesign name="right" size={14} color="#ec9831" />
                </TouchableOpacity>

                {/*Last Box*/}
                <View style={{ paddingVertical: 14 }}>
                    <TouchableOpacity activeOpacity={0.85} onPress={handleOpenCustomerApp}>
                        <View style={styles.lastbox}>
                            <LinearGradient colors={["#f7ad24", "#f8c15b", "#fae4ba"]}
                                style={{ height: 120, borderRadius: 10, padding: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={{ ...textPresets.subtitle }}>See Your Shop As Customer</Text>
                                <Text style={{ ...textPresets.label }}>
                                    Open Customer App to See How Customers View Your Profile
                                </Text>
                                <Text style={{ ...textPresets.label }}>Tap to explore!</Text>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    profileCard: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        elevation: 6,
        shadowColor: "#413f4f",
        shadowRadius: 8,
        shadowOffset: { height: 3, width: 2 },
        shadowOpacity: 0.18,
        zIndex: 10
    },
    graph: {
        flex: 1,
        borderRadius: 10,
        minHeight: 200,
        maxHeight: 280,
        elevation: 8,
        shadowColor: "#413f4f",
        shadowRadius: 10,
        shadowOffset: { height: 4, width: 3 },
        paddingVertical: 10,
        paddingHorizontal: 6,
        paddingRight: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
    },
    text: {
        width: "100%",
        ...textPresets.subtitle,
    },
    card1: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 80,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding: 4,
    },
    columncontainer: {
        paddingHorizontal: 16,
        gap: 10,
        top: 14
    },
    smallcardtext: {
        ...textPresets.label
    },
    metaBlock: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        top: 2,
        justifyContent: "space-between"
    },
    metaLabel: {
        ...textPresets.label,
        color: "#5f5f5f",
    },
    metaValue: {
        ...textPresets.label,
        color: "#0a0a0a",
    },
    card2: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 80,
        shadowOffset: { height: 4, width: 3 },
        shadowColor: "#413f4f",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        elevation: 10,
        backgroundColor: "white",
        paddingVertical: 8,
    },
    reviewCard: {
        borderWidth: 1,
        borderColor: "#157a4f",
        elevation: 4,
    },
    orderCard: {
        paddingVertical: 16,
        marginVertical: 6,
        paddingBottom: 12,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#dbf5e9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    avatarText: {
        ...textPresets.subtitle,
        color: "#157a4f",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        justifyContent: "center",
    },
    seeAllText: {
        ...textPresets.body,
        color: "#f9a641"
    },
    reviewDate: {
        paddingHorizontal: 10,
        paddingTop: 8,
        ...textPresets.caption,
        color: "#9ca3af",
    },
    lastbox: {
        borderRadius: 10,
        height: 80,
        shadowOffset: { height: 4, width: 3 },
        shadowColor: "#413f4f",
        elevation: 10,
    }
})