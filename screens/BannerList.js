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
import { textPresets } from "../theme/typography";

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

        const canPay = normalizedStatus === "approved" && paymentStatus !== "paid";
        const isActive = normalizedStatus === "active" || paymentStatus === "paid";
        const isExpired = normalizedStatus === "expired";

        if (isActive) {
            return { label: "Active", bg: "#E3F8EA", text: "#15803D", canPay: false };
        }
        if (isExpired) {
            return { label: "Expired", bg: "#F3F4F6", text: "#6B7280", canPay: false };
        }
        return { label: null, bg: null, text: null, canPay };
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
        if (String(item?.status || "").toLowerCase() === "deleted") {
            return false;
        }
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
                    <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ ...textPresets.title, flex: 1 }}>Banner Promotions List</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 110, padding: 14 }} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color="#a7a7a7" />
                    <TextInput
                        placeholder="Search by banner title"
                        placeholderTextColor={colors.subtext}
                        value={search}
                        onChangeText={setSearch}
                        style={{ marginLeft: 6, top: 2, flex: 1, ...textPresets.body }}
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
                                        <Text style={{ ...textPresets.body }}>{item?.bannerTitle || "Banner"}</Text>
                                        <Text style={{ ...textPresets.caption }}>{item?.bannerCategory || "General"}</Text>
                                    </View>
                                    {statusStyle.label ? (
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={{ color: statusStyle.text, ...textPresets.caption }}>{statusStyle.label}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                                <View style={styles.bannerDetailRow}>
                                    <Text style={styles.detailLabel}>Posted Date</Text>
                                    <Text style={styles.detailValue}>{item?.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</Text>
                                </View>

                                <View style={styles.bannerDetailRow}>
                                    <Text style={styles.detailLabel}>Budget</Text>
                                    <Text style={styles.detailValue}>Rs. {item?.totalPrice || 0}</Text>
                                </View>

                                <View style={styles.bannerActionsRow}>
                                    {statusStyle.canPay ? (
                                        <TouchableOpacity style={[styles.paybtn, { flex: 1 }]} onPress={() => handlePayNow(item)} disabled={payingId === (item?.requestId || item?._id)}>
                                            {payingId === (item?.requestId || item?._id) ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={{ ...textPresets.body }}>Pay Now</Text>
                                            )}
                                        </TouchableOpacity>
                                    ) : null}

                                    {String(item?.status || "").toLowerCase() === "active" || String(item?.paymentStatus || "").toLowerCase() === "paid" ? (
                                        <TouchableOpacity
                                            style={styles.editBtn}
                                            onPress={() => navigation.navigate("BannerPage", { editData: item })}
                                        >
                                            <Feather name="edit-2" size={14} color="#fff" />
                                            <Text style={{ color: "#fff", marginLeft: 4, ...textPresets.label }}>Edit</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
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
    promoteBtnText: { color: "#fff", ...textPresets.label },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#c0c0c0" },
    bannerCard: { borderRadius: 14, padding: 14, marginTop: 12, backgroundColor: "#fff", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3.84 },
    bannerCardTop: { flexDirection: "row", alignItems: "center" },
    bannerThumb: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    divider: { height: 1, marginVertical: 12 },
    bannerDetailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    detailLabel: { ...textPresets.label },
    detailValue: { ...textPresets.label },
    paybtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#f5b849", justifyContent: "center", width: "100%", alignSelf: "center", marginVertical: 5 },
    loaderBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
    emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
    bannerActionsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2, alignSelf: "flex-end" },
    editBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#157a4f", justifyContent: "center" },
});