import React, { useState, useContext, useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Entypo, FontAwesome5, Octicons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../config";

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

    // ✅ Fetch profile and latest merchant reviews every time screen opens
    useFocusEffect(
        useCallback(() => {
            let active = true;

            const fetchProfile = async () => {
                try {
                    const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                    if (!token) return;

                    let res = await fetch(`${BASE_URL}/users/merchant/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

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
                    const token = await AsyncStorage.getItem("merchantToken");
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/merchant-dashboard/analytics/events`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    const count = data?.data?.totalActive || 0;
                    if (active) setUniqueClaimedCustomers(count);
                } catch (error) {
                    console.log("Overview unique customers fetch error:", error);
                }
            };

            const fetchShopVisitsTrend = async () => {
                try {
                    const token = await AsyncStorage.getItem("merchantToken");
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/merchant-dashboard/analytics/trend`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    const payload = data?.data || data || {};
                    if (active) setVisitsTrend({ labels: payload.labels || [], values: payload.values || [] });
                } catch (error) {
                    console.log("Overview shop visits fetch error:", error);
                }
            };

            const fetchRecentOrders = async () => {
                try {
                    const token = await AsyncStorage.getItem("merchantToken");
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/orders/merchant?status=pending&page=1&limit=2`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    let data = await res.json();
                    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : data?.orders || [];
                    if (active) setRecentOrders(list.slice(0, 2));
                } catch (error) {
                    console.log("Overview recent orders fetch error:", error);
                }
            };

            const fetchReviews = async () => {
                try {
                    const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                    if (!token) return;

                    setReviewsLoading(true);
                    const res = await fetch(`${BASE_URL}/reviews/merchant?page=1&limit=2`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

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
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            {/* ===== PROFILE HEADER ===== */}
            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" }}>
                <Image source={profileImage} style={{ height: 80, width: 80, borderRadius: 45 }} />

                <View style={{ flexDirection: "column", paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 20, color: colors.text,
                        fontFamily: "Medium", lineHeight: Math.round(20 * 1.5)
                     }}>
                        {shopName}
                    </Text>

                    <Text style={{ fontSize: 18, color: colors.text,
                        fontFamily: "Medium", lineHeight: Math.round(18 * 1.5)
                     }}>
                        {uniqueClaimedCustomers}
                    </Text>

                    <Text style={{ fontSize: 12, color: "#969494",
                        fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                     }}>
                        Total Customers
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18 }}>
                <View style={styles.graph}>
                    <View style={{ flexDirection: "row", alignContent: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>
                                Shop Visits
                            </Text>
                            <Octicons name="graph" size={20} color="green" style={{ paddingLeft: 8 }} />
                        </View>
                        <Text style={{ fontSize: 12, color: "#6b7280", fontFamily: "Medium" }}>Live</Text>
                    </View>

                    {/* Bar chart with Y axis (numbers) and X axis (dates) */}
                    {visitsTrend.values && visitsTrend.values.length > 0 ? (
                        (() => {
                            const vals = visitsTrend.values.map(v => Number(v || 0));
                            const max = Math.max(...vals, 1);
                            const chartHeight = 120;
                            const steps = 4; // number of ticks on Y axis

                            return (
                                <View style={{ marginTop: 12 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Y axis labels */}
                                        <View style={{ width: 40, height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
                                            {Array.from({ length: steps + 1 }).map((_, i) => {
                                                const t = steps - i;
                                                const value = Math.round((t / steps) * max);
                                                return (
                                                    <Text key={i} style={{ fontSize: 11, color: '#6b7280' }}>{value}</Text>
                                                );
                                            })}
                                        </View>

                                        {/* Y axis line */}
                                        <View style={{ width: 1, height: chartHeight, backgroundColor: '#cbd5e1' }} />

                                        {/* Bars container with horizontal grid lines and visible X axis */}
                                        <View style={{ flex: 1, height: chartHeight, position: 'relative' }}>
                                            {/* Horizontal grid lines matching Y ticks */}
                                            {Array.from({ length: steps + 1 }).map((_, gi) => {
                                                const top = Math.round((gi / steps) * chartHeight);
                                                return (
                                                    <View
                                                        key={"grid-" + gi}
                                                        style={{ position: 'absolute', left: 0, right: 0, top: top, height: 1, backgroundColor: '#e6eef2' }}
                                                    />
                                                );
                                            })}

                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' }}>
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
                                    </View>

                                    {/* X axis labels (dates) */}
                                    <View style={{ flexDirection: 'row', marginTop: 6, paddingLeft: 40 }}>
                                        {visitsTrend.labels.map((lbl, i) => (
                                            <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 4 }}>
                                                <Text style={{ fontSize: 10, color: '#6b7280' }}>{lbl || ''}</Text>
                                            </View>
                                        ))}
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
                <Text style={[styles.text, { color: colors.text }]}>Recent Orders</Text>

                {recentOrders.length > 0 ? (
                    recentOrders.map((o, idx) => {
                        const placed = o.placedAt || o.createdAt || o.placedAt;
                        const customer = o.customerName || o.userName || o.userEmail || (o.user && o.user.name) || "Customer";
                        const offer = o.offerTitle || o.offerName || o.voucher?.offerTitle || o.offer?.title || "Offer";
                        return (
                            <TouchableOpacity key={idx} style={[styles.card2, styles.orderCard]} onPress={() => navigation.navigate("OrderDetailPage", { order: o })}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
                                    <Text style={{ paddingTop: 4, color: '#4b5563', fontSize:12,
                                        lineHeight: Math.round(12 * 1.5), fontFamily: "Medium"
                                     }}>{offer}</Text>
                                    <Text style={{ fontSize: 12, color: '#000000', 
                                        lineHeight: Math.round(12 * 1.5), fontFamily: "Medium"
                                     }}>{timeAgo(placed)}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap:5, paddingHorizontal: 10}}>
                                    <MaterialCommunityIcons name="account" size={18} color="#157a4f" />
                                <Text style={{ paddingTop: 8, fontSize: 13, color: '#157a4f', fontFamily: 'Medium' }}>{customer}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.card2}>
                        <Text style={{ padding: 10, color: "#6b7280", lineHeight: Math.round(14 * 1.5), fontFamily: "Medium", fontSize: 14 }}>
                            No recent orders
                        </Text>
                    </View>
                )}

                    <Text style={[styles.text, { color: colors.text }]}>Reviews</Text>                   

                {reviewsLoading ? (
                    <View style={styles.card2}>
                        <ActivityIndicator size="small" color="#0f766e" style={{ marginTop: 16 }} />
                    </View>
                ) : reviews.length > 0 ? (
                    reviews.map((item, index) => {
                        const rating = resolveRating(item);
                        return (
                            <View key={index} style={styles.card2}>
                                <View style={{ flexDirection: 'row', paddingTop: 10, paddingHorizontal: 10 }}>
                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                        <AntDesign
                                            key={starIndex}
                                            name="star"
                                            size={18}
                                            color={starIndex < rating ? "yellow" : "#d1d5db"}
                                        />
                                    ))}
                                </View>
                                <Text style={{ paddingTop: 10, paddingHorizontal: 10,
                                    fontSize:12, fontFamily: "Medium", lineHeight: Math.round(12 * 1.5), color:"#157a4f"
                                 }}>
                                    {item.userName || item.userEmail || "Customer"}
                                </Text>
                                <Text style={{ paddingHorizontal: 10, paddingTop: 4, color: "#4b5563",
                                    fontSize: 12, fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
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
                        <Text style={{ padding: 10, color: "#6b7280", lineHeight: Math.round(14 * 1.5), fontFamily: "Medium", fontSize: 14 }}>
                            No recent reviews yet.
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => navigation.navigate("AllReviewsPage")}
                    >
                        <Text style={[styles.seeAllText, { color: colors.text }]}>See all</Text>
                        <AntDesign name="right" size={16} color={colors.text} />
                    </TouchableOpacity>

                {/*Last Box*/}
                <View style={{ paddingVertical: 14 }}>
                    <View style={styles.lastbox}>
                        <LinearGradient colors={["#f7ad24", "#f8c15b", "#fae4ba"]}
                            style={{ height: 120, borderRadius: 10, padding: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={{ fontSize: 18, fontFamily:"Medium",
                                lineHeight: Math.round(18 * 1.5)
                             }}>See Your Shop As Customer</Text>
                            <Text style={{ fontSize: 12,
                                fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                             }}>Open the customer app to see your shop exactly how
                                customers see it.
                            </Text>
                            <Text style={{ fontSize: 12,
                                fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                             }}>Tap to explore!</Text>
                        </LinearGradient>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    graph: {
        flex: 1,
        borderRadius: 10,
        minHeight: 200,
        maxHeight: 280,
        elevation: 8,
        shadowColor: "#413f4f",
        shadowRadius: 10,
        shadowOffset: { height: 4, width: 3 },
        padding: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
    },
    text: {
        fontSize: 16,
        width: "100%",
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5)
    },
    card1: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 80,
        borderWidth: 1,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding: 4,
    },
    columncontainer: {
        paddingHorizontal: 22,
        gap: 10,
        top:10
    },
    smallcardtext: {
        fontSize: 14,
        paddingHorizontal: 10,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5)
    },
    card2: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 80,
        shadowOffset: { height: 4, width: 3 },
        borderWidth: 1,
        shadowColor: "#413f4f",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        elevation: 10,
        backgroundColor: "white",
        paddingVertical: 5,
    },
    orderCard: {
        paddingVertical: 8,
        marginVertical: 6,
        paddingBottom: 12,
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent:"center"
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: "Medium",
        lineHeight: Math.round(14 * 1.5),
    },
    reviewDate: {
        paddingHorizontal: 10,
        paddingTop: 8,
        fontSize: 12,
        color: "#9ca3af",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5)
    },
    lastbox: {
        borderRadius: 10,
        height: 110,
        shadowOffset: { height: 4, width: 3 },
        shadowColor: "#413f4f",
        elevation: 10,
    }
})
