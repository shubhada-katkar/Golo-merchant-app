import React, { useState, useContext, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, Alert, TextInput, ActivityIndicator } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

export default function BannerList({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [search, setSearch] = useState("");
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);

    const getAuthHeaders = async () => {
        const token = (await AsyncStorage.getItem("merchantToken")) || (await AsyncStorage.getItem("accessToken"));
        if (!token) {
            throw new Error("Please log in again to continue.");
        }
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    };

    const loadBanners = async () => {
        if (!BASE_URL) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/banners/promotions/my?type=banner`, {
                headers,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || "Unable to load banner requests right now.");
            }
            setBanners(Array.isArray(payload?.data) ? payload.data : []);
        } catch (error) {
            Alert.alert("Unable to load banners", error?.message || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadBanners);
        return unsubscribe;
    }, [navigation]);

    const getStatusStyle = (item) => {
        const normalizedStatus = String(item?.status || "").toLowerCase();
        const paymentStatus = String(item?.paymentStatus || "").toLowerCase();

        if (normalizedStatus === "approved" && paymentStatus !== "paid") {
            return { label: "Approved", bg: "#E3EEFD", text: "#2563EB", canPay: true };
        }
        if (normalizedStatus === "active" || paymentStatus === "paid") {
            return { label: "Active", bg: "#E3F8EA", text: "#15803D", canPay: false };
        }
        if (normalizedStatus === "rejected") {
            return { label: "Rejected", bg: "#FDE3E3", text: "#DC2626", canPay: false };
        }
        if (normalizedStatus === "under_review") {
            return { label: "Under Review", bg: "#FFF4D6", text: "#B7791F", canPay: false };
        }
        if (normalizedStatus === "expired") {
            return { label: "Expired", bg: "#F3F4F6", text: "#6B7280", canPay: false };
        }
        return { label: "Pending", bg: colors.divider, text: colors.subtext, canPay: false };
    };

    const handlePayNow = async (item) => {
        try {
            setPayingId(item?.requestId || item?._id);
            const headers = await getAuthHeaders();
            const response = await fetch(`${BASE_URL}/banners/promotions/${item?.requestId || item?._id}/pay`, {
                method: "POST",
                headers,
                body: JSON.stringify({ paymentReference: "merchant-app" }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || "Could not complete payment.");
            }
            Alert.alert("Payment recorded", "Your banner is now active.");
            loadBanners();
        } catch (error) {
            Alert.alert("Payment failed", error?.message || "Please try again.");
        } finally {
            setPayingId(null);
        }
    };

    const filteredBanners = banners.filter((item) => {
        const keyword = (item?.bannerTitle || "").toLowerCase();
        return keyword.includes(search.toLowerCase());
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text, lineHeight: Math.round(20 * 1.2), fontFamily: "Medium", flex: 1 }}>Banner Promotions List</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 110, padding: 14 }} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color="#a7a7a7" />
                    <TextInput
                        placeholder="Search by banner title"
                        placeholderTextColor={colors.subtext}
                        value={search}
                        onChangeText={setSearch}
                        style={{ marginLeft: 6, color: colors.text, fontFamily: "Medium", fontSize: 14, top: 3.5, flex: 1 }}
                    />
                </View>

                <TouchableOpacity style={[styles.promoteBtn, { backgroundColor: "#1F8A4C" }]} onPress={() => navigation.navigate("BannerPage")}>
                    <AntDesign name="plus" size={14} color="#fff" />
                    <Text style={styles.promoteBtnText}>Promote Banner</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="small" color="#f8a812" />
                        <Text style={{ color: colors.subtext, marginTop: 8, fontFamily: "Medium" }}>Loading requests...</Text>
                    </View>
                ) : filteredBanners.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={{ color: colors.subtext, fontFamily: "Medium" }}>No banner requests found.</Text>
                    </View>
                ) : (
                    filteredBanners.map((item) => {
                        const statusStyle = getStatusStyle(item);
                        return (
                            <View key={item?.requestId || item?._id} style={styles.bannerCard}>
                                <View style={styles.bannerCardTop}>
                                    <View style={[styles.bannerThumb, { backgroundColor: colors.divider }]}> 
                                        {item?.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
                                        ) : (
                                            <Feather name="image" size={20} color={colors.subtext} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{ color: colors.text, fontFamily: "Medium", fontSize: 15, lineHeight: Math.round(15 * 1.5) }}>{item?.bannerTitle || "Banner"}</Text>
                                        <Text style={{ color: colors.subtext, fontFamily: "Medium", fontSize: 12, lineHeight: Math.round(12 * 1.5) }}>{item?.bannerCategory || "General"}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}> 
                                        <Text style={{ color: statusStyle.text, fontFamily: "Medium", fontSize: 11, lineHeight: Math.round(11 * 1.5) }}>{statusStyle.label}</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                                <View style={styles.bannerDetailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.subtext }]}>Posted Date</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{item?.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</Text>
                                </View>

                                <View style={styles.bannerDetailRow}>
                                    <Text style={[styles.detailLabel, { color: colors.subtext }]}>Budget</Text>
                                    <Text style={[styles.detailValue, { color: colors.text, fontFamily: "Medium" }]}>Rs. {item?.totalPrice || 0}</Text>
                                </View>

                                {statusStyle.canPay ? (
                                    <TouchableOpacity style={styles.paybtn} onPress={() => handlePayNow(item)} disabled={payingId === (item?.requestId || item?._id)}>
                                        {payingId === (item?.requestId || item?._id) ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={{ color: colors.text, fontFamily: "Medium", fontSize: 14, lineHeight: Math.round(14 * 1.5) }}>Pay Now</Text>
                                        )}
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: { alignItems: "center", flexDirection: "row", paddingVertical: 8, paddingHorizontal: 14 },
    promoteBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 4, alignSelf: "flex-end", marginTop: 10 },
    promoteBtnText: { color: "#fff", fontFamily: "Medium", fontSize: 12, marginLeft: 4, lineHeight: Math.round(12 * 1.5) },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#c0c0c0" },
    bannerCard: { borderRadius: 14, padding: 14, marginTop: 12, backgroundColor: "#fff", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3.84 },
    bannerCardTop: { flexDirection: "row", alignItems: "center" },
    bannerThumb: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    divider: { height: 1, marginVertical: 12 },
    bannerDetailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    detailLabel: { fontFamily: "Medium", fontSize: 13, lineHeight: Math.round(13 * 1.5) },
    detailValue: { fontFamily: "Medium", fontSize: 13, lineHeight: Math.round(13 * 1.5) },
    paybtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#f5b849", justifyContent: "center", width: "100%", alignSelf: "center", marginVertical: 5 },
    loaderBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
    emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
});