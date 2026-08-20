import React, { useState, useContext, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, TextInput, ActivityIndicator, Modal } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather, AntDesign, Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

export default function BannerList({ navigation }) {
    const [search, setSearch] = useState("");
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
    const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
    const [razorpayOrderData, setRazorpayOrderData] = useState(null);
    const [activeRazorpayItem, setActiveRazorpayItem] = useState(null);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        type: "error",
        title: "",
        message: "",
        onClose: null,
    });

    const showAlert = (type, title, message, onClose = null) => {
        setAlertConfig({
            visible: true,
            type,
            title,
            message,
            onClose,
        });
    };

    const handleCloseAlert = () => {
        const cb = alertConfig.onClose;
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        if (typeof cb === "function") {
            cb();
        }
    };

    const getAuthHeaders = async () => {
        let token;
        try {
            token = await getValidToken();
        } catch (authErr) {
            await handleAuthError(navigation);
            throw authErr;
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
            showAlert("error", "Unable to load banners", error?.message || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadBanners);
        return unsubscribe;
    }, [navigation]);

    const getStatusStyle = (item) => {
        const status = String(item?.status || "").toLowerCase();
        const paymentStatus = String(item?.paymentStatus || "").toLowerCase();

        if (status === "active" || paymentStatus === "paid") {
            return { label: "Active", bg: "#E3F8EA", text: "#15803D", canPay: false, canEdit: true };
        }
        if (status === "approved" && paymentStatus !== "paid") {
            return { label: "Approved - Pay Now", bg: "#EFF6FF", text: "#1D4ED8", canPay: true, canEdit: true };
        }
        if (status === "pending" && paymentStatus !== "paid") {
            return { label: "Pending Payment", bg: "#FFF7ED", text: "#C2410C", canPay: true, canEdit: true };
        }
        if (status === "under_review") {
            return { label: "Under Review", bg: "#FEF3C7", text: "#B45309", canPay: false, canEdit: true };
        }
        if (status === "rejected") {
            return { label: "Rejected", bg: "#FEE2E2", text: "#DC2626", canPay: false, canEdit: true };
        }
        if (status === "expired") {
            return { label: "Expired", bg: "#F3F4F6", text: "#6B7280", canPay: false, canEdit: false };
        }

        // Default fallback if any unhandled status
        const canPay = paymentStatus !== "paid" && status !== "expired" && status !== "deleted";
        return {
            label: status ? status.toUpperCase() : "Pending",
            bg: "#FFF7ED",
            text: "#C2410C",
            canPay: canPay,
            canEdit: status !== "expired" && status !== "deleted",
        };
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
            showAlert("success", "Payment Recorded", "Your banner is now active.", loadBanners);
        } catch (error) {
            showAlert("error", "Payment Failed", error?.message || "Please try again.");
        } finally {
            setPayingId(null);
        }
    };

    const handlePayWithRazorpay = async (item) => {
        const reqId = item?.requestId || item?._id;
        setPayingId(reqId);
        setIsRazorpayProcessing(true);
        setActiveRazorpayItem(item);

        try {
            let token;
            try {
                token = await getValidToken();
            } catch (authErr) {
                await handleAuthError(navigation);
                return;
            }

            let orderData = null;
            const price = Number(item?.totalPrice || 0);

            try {
                const response = await fetch(`${BASE_URL}/payments/create-order`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: price,
                        currency: "INR",
                        description: `Banner Promotion - ${item?.bannerTitle || 'Banner'}`,
                        notes: {
                            bannerRequestId: reqId,
                            bannerTitle: item?.bannerTitle
                        }
                    })
                });

                const resData = await response.json();
                if (response.ok && resData.success && resData.data?.keyId) {
                    orderData = resData.data;
                }
            } catch (apiErr) {
                console.warn("Backend Razorpay order endpoint unavailable, using test mode:", apiErr);
            }

            // Fallback for test mode if backend payment gateway endpoint is unconfigured on remote server
            if (!orderData) {
                orderData = {
                    keyId: "rzp_test_S0GsFh4dYJBDOG",
                    order: {
                        id: `order_test_${Date.now()}`,
                        amount: price * 100,
                        currency: "INR"
                    }
                };
            }

            setRazorpayOrderData(orderData);
            setRazorpayModalVisible(true);
        } catch (error) {
            console.error("Razorpay order initialization error:", error);
            showAlert(
                "error",
                "Initialization Failed",
                error.message || "An error occurred while launching Razorpay."
            );
        } finally {
            setIsRazorpayProcessing(false);
            setPayingId(null);
        }
    };

    const handleWebViewMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.event === "SUCCESS") {
                setRazorpayModalVisible(false);
                setRazorpayOrderData(null);
                setIsRazorpayProcessing(true);

                const reqId = activeRazorpayItem?.requestId || activeRazorpayItem?._id;

                const headers = await getAuthHeaders();
                const response = await fetch(`${BASE_URL}/banners/promotions/${reqId}/pay`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        paymentReference: `razorpay:${data.razorpay_payment_id || 'test'}`
                    }),
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.message || "Could not complete payment verification.");
                }

                showAlert("success", "Payment Recorded", "Your banner promotion is now active via Razorpay!", loadBanners);
            } else if (data.event === "CANCELLED") {
                setRazorpayModalVisible(false);
                setRazorpayOrderData(null);
                showAlert("error", "Payment Cancelled", "Payment process was cancelled.");
            } else if (data.event === "FAILED") {
                setRazorpayModalVisible(false);
                setRazorpayOrderData(null);
                showAlert("error", "Payment Failed", data.error?.description || "Razorpay payment failed.");
            }
        } catch (err) {
            console.error("Razorpay webview message error:", err);
            setRazorpayModalVisible(false);
            setRazorpayOrderData(null);
            showAlert("error", "Payment Error", err.message || "An unexpected error occurred.");
        } finally {
            setIsRazorpayProcessing(false);
        }
    };

    const getRazorpayCheckoutHtml = () => {
        if (!razorpayOrderData) return "";
        const { keyId, order } = razorpayOrderData;
        const isRealOrder = order && order.id && !String(order.id).startsWith("order_test_");
        const title = activeRazorpayItem?.bannerTitle || "Banner Promotion";

        return `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f8f9fa;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .loading {
                  font-size: 16px;
                  color: #157a4f;
                  font-weight: bold;
                }
              </style>
              <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body>
              <div class="loading">Loading Razorpay Gateway...</div>
              <script>
                var options = {
                  "key": "${keyId}",
                  "amount": "${order.amount}",
                  "currency": "${order.currency || 'INR'}",
                  "name": "Golo Banners",
                  "description": "${title}",
                  ${isRealOrder ? `"order_id": "${order.id}",` : ''}
                  "handler": function (response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      event: "SUCCESS",
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id || "",
                      razorpay_signature: response.razorpay_signature || ""
                    }));
                  },
                  "modal": {
                    "ondismiss": function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        event: "CANCELLED"
                      }));
                    }
                  },
                  "theme": {
                    "color": "#157a4f"
                  }
                };
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    event: "FAILED",
                    error: response.error
                  }));
                });
                window.onload = function() {
                  rzp.open();
                };
              </script>
            </body>
          </html>
        `;
    };

    const filteredBanners = banners.filter((item) => {
        if (String(item?.status || "").toLowerCase() === "deleted") {
            return false;
        }
        const keyword = (item?.bannerTitle || "").toLowerCase();
        return keyword.includes(search.toLowerCase());
    });

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={22} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ ...textPresets.title, flex: 1 }}>Banner Promotions List</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 110, padding: 14 }} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color="#a7a7a7" />
                    <TextInput
                        placeholder="Search by banner title"
                        placeholderTextColor={"#8f8f8fff"}
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
                        <Text style={{ marginTop: 8, ...textPresets.body }}>Loading requests...</Text>
                    </View>
                ) : filteredBanners.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={{ ...textPresets.body }}>No banner requests found.</Text>
                    </View>
                ) : (
                    filteredBanners.map((item) => {
                        const statusStyle = getStatusStyle(item);
                        const itemId = item?.requestId || item?._id;
                        const isThisPaying = payingId === itemId;

                        return (
                            <View key={itemId} style={styles.bannerCard}>
                                <View style={styles.bannerCardTop}>
                                    <View style={styles.bannerThumb}>
                                        {item?.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="cover" />
                                        ) : (
                                            <Feather name="image" size={20} color={"#000"} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
                                        <Text style={{ ...textPresets.body }} numberOfLines={1}>{item?.bannerTitle || "Banner Promotion"}</Text>
                                        <Text style={{ ...textPresets.caption }}>{item?.bannerCategory || "General"}</Text>
                                    </View>
                                    {statusStyle.label ? (
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={{ color: statusStyle.text, ...textPresets.caption }}>{statusStyle.label}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                <View style={[styles.divider, { backgroundColor: "#000" }]} />

                                {item?.coverageType ? (
                                    <View style={styles.bannerDetailRow}>
                                        <Text style={styles.detailLabel}>Coverage Area</Text>
                                        <Text style={styles.detailValue}>{item.coverageType}</Text>
                                    </View>
                                ) : null}

                                {Array.isArray(item?.targetCities) && item.targetCities.length > 0 ? (
                                    <View style={styles.bannerDetailRow}>
                                        <Text style={styles.detailLabel}>Target Locations</Text>
                                        <Text style={[styles.detailValue, { flex: 1, textAlign: "right", marginLeft: 12 }]} numberOfLines={1}>
                                            {item.targetCities.join(", ")}
                                        </Text>
                                    </View>
                                ) : null}

                                <View style={styles.bannerDetailRow}>
                                    <Text style={styles.detailLabel}>Posted Date</Text>
                                    <Text style={styles.detailValue}>
                                        {item?.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                    </Text>
                                </View>

                                <View style={styles.bannerDetailRow}>
                                    <Text style={styles.detailLabel}>Payable Amount</Text>
                                    <Text style={[styles.detailValue, { color: "#157a4f" }]}>
                                        Rs. {item?.totalPrice || 0}
                                    </Text>
                                </View>

                                {statusStyle.canPay ? (
                                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                                        <TouchableOpacity
                                            style={[styles.paybtn, { flex: 1 }, isThisPaying && { opacity: 0.7 }]}
                                            onPress={() => handlePayNow(item)}
                                            disabled={isThisPaying || isRazorpayProcessing}
                                        >
                                            {isThisPaying && !isRazorpayProcessing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.payBtnText}>Pay Now</Text>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.razorpayBtn, { flex: 1 }, isThisPaying && { opacity: 0.7 }]}
                                            onPress={() => handlePayWithRazorpay(item)}
                                            disabled={isThisPaying || isRazorpayProcessing}
                                        >
                                            {isThisPaying && isRazorpayProcessing ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.razorpayBtnText}>Pay through Razorpay</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : null}

                                {statusStyle.canEdit ? (
                                    <TouchableOpacity
                                        style={[styles.editBtn, { marginTop: statusStyle.canPay ? 8 : 10 }]}
                                        onPress={() => navigation.navigate("BannerPage", { editData: item })}
                                    >
                                        <Feather name="edit-2" size={14} color="#157a4f" />
                                        <Text style={styles.editBtnText}>Edit Banner</Text>
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

            {/* Razorpay WebView Modal */}
            <Modal
                visible={razorpayModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => {
                    setRazorpayModalVisible(false);
                    setRazorpayOrderData(null);
                }}
                statusBarTranslucent
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
                    <View style={styles.razorpayHeader}>
                        <Text style={styles.razorpayHeaderTitle}>Razorpay Gateway (Test Mode)</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setRazorpayModalVisible(false);
                                setRazorpayOrderData(null);
                                showAlert("error", "Payment Cancelled", "Razorpay payment window closed.");
                            }}
                            style={{ padding: 6 }}
                        >
                            <Ionicons name="close" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>
                    {razorpayOrderData && (
                        <WebView
                            originWhitelist={["*"]}
                            source={{ html: getRazorpayCheckoutHtml() }}
                            onMessage={handleWebViewMessage}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.webViewLoading}>
                                    <ActivityIndicator size="large" color="#157a4f" />
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            <CustomAlertModal
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={handleCloseAlert}
            />
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
    loaderBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
    emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
    paybtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#f5b849", justifyContent: "center" },
    payBtnText: { color: "#fff", ...textPresets.label },
    razorpayBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: "#157a4f", justifyContent: "center" },
    razorpayBtnText: { color: "#fff", ...textPresets.label },
    editBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: "#157a4f", backgroundColor: "#f0fdf4", justifyContent: "center" },
    editBtnText: { color: "#157a4f", marginLeft: 6, ...textPresets.label },
    razorpayHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#ececec",
        backgroundColor: "#ffffff",
    },
    razorpayHeaderTitle: {
        ...textPresets.subtitle,
    },
    webViewLoading: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
});