import React, { useState, useContext, useCallback } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Switch, ScrollView, Modal } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons, Feather, AntDesign, EvilIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAuthStorage, getValidToken } from "../services/authService";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { Linking } from "react-native";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

export default function ProfilePage({ navigation }) {
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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

    // ================= LOGOUT =================
    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const performLogout = async () => {
        setLogoutModalVisible(false);
        try {
            setLoadingLogout(true);

            const token = await AsyncStorage.getItem("merchantToken");
            const refreshToken = await AsyncStorage.getItem("merchantRefreshToken");

            try {
                if (token) {
                    await fetch(`${BASE_URL}/users/logout`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ refreshToken: refreshToken || null }),
                    });
                }
            } catch (logoutError) {
                console.log("Logout API error:", logoutError);
            }

            await clearAuthStorage();

            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        } catch (err) {
            showAlert("error", "Logout Failed", "Please try again");
        } finally {
            setLoadingLogout(false);
        }
    };

    const [shopName, setShopName] = useState("Shop Name");
    const [profileImage, setProfileImage] = useState(require("../assets/profile.png"));

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

    // Fetch profile whenever the page comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    let token;
                    try {
                        token = await getValidToken();
                    } catch {
                        return; // not logged in or network error – skip silently
                    }
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/users/merchant/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const data = await res.json();
                    const merchantData = data?.data || data?.merchant || data || null;

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
                    console.log("Error fetching profile:", error);
                }
            };

            fetchProfile();
        }, [])
    );

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
                <Text style={{ ...textPresets.title, flex: 1 }}>Profile</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>

                {/* Banner + Avatar */}
                <View style={styles.bannerContainer}>
                    <Image source={profileImage} style={styles.image} />
                    {/* Name + meta */}
                    <View style={styles.nameBlock}>
                        <Text style={styles.shopName}>{shopName}</Text>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.menuContainer}>

                    <Text style={styles.sectionHeader}>GENERAL SETTINGS</Text>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="account-cog-outline" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>Profile Settings</Text>
                            <Text style={styles.menuSub}>Manage your business information</Text>
                        </View>
                        <Feather name="chevron-right" size={20} />
                    </TouchableOpacity>

                    <Text style={[styles.sectionHeader, { marginTop: 18 }]}>PROMOTE AND UPGRADE</Text>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={() => navigation.navigate("BannerList")}>
                        <View style={styles.iconCircle}>
                            <Feather name="list" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>Banners</Text>
                            <Text style={[styles.menuSub, { color: "#888" }]}>Attract More Customers with Every Banner.</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={"#aaa"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={() => navigation.navigate("UpgradePlanPage")}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="crown-outline" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>Upgrade Your Plan</Text>
                            <Text style={[styles.menuSub, { color: "#888" }]}>Enhance your business with premium features.</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={"#aaa"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={() => navigation.navigate("TransactionPage")}>
                        <View style={styles.iconCircle}>
                            <AntDesign name="credit-card" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>View Transactions</Text>
                            <Text style={[styles.menuSub, { color: "#888" }]}>Track your transaction history</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={"#aaa"} />
                    </TouchableOpacity>

                    <Text style={[styles.sectionHeader, { marginTop: 18 }]}>REWARDS & SUPPORT</Text>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={() => navigation.navigate("LoyaltyPage")}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="trophy-outline" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>Loyalty Rewards</Text>
                            <Text style={[styles.menuSub, { color: "#888" }]}>View your current program status</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={"#aaa"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]}
                        onPress={() => Linking.openURL("https://golo.co.in/merchant/help")}>
                        <View style={styles.iconCircle}>
                            <AntDesign name="question-circle" size={20} color="#157a4f" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={styles.menuTitle}>Help Center</Text>
                            <Text style={[styles.menuSub, { color: "#888" }]}>FAQs and customer support</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={"#aaa"} />
                    </TouchableOpacity>

                    {/* Divider before Sign Out */}
                    <View style={[styles.divider, { backgroundColor: "#eee" }]} />

                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: "#fff" }]} onPress={handleLogout} disabled={loadingLogout}>
                        <View style={[styles.iconCircle, { backgroundColor: "#fff0f0" }]}>
                            <MaterialIcons name="logout" size={20} color="#ff6b6b" />
                        </View>
                        <View style={styles.menuText}>
                            <Text style={[styles.menuTitle, { color: "#ff6b6b" }]}>
                                {loadingLogout ? "Logging out..." : "Sign Out"}
                            </Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#ff6b6b" />
                    </TouchableOpacity>

                </View>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>

            {/* Logout Confirmation Modal */}
            <Modal
                visible={logoutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: "#ffffff" }]}>
                        <View style={styles.modalIconContainer}>
                            <MaterialIcons name="logout" size={40} color="#e53935" />
                        </View>
                        <Text style={styles.modalTitleText}>Confirm Logout</Text>
                        <Text style={[styles.modalMessageText, { color: "#555555" }]}>
                            Are you sure you want to logout?
                        </Text>
                        <View style={styles.modalConfirmRow}>
                            <TouchableOpacity
                                style={[styles.modalHalfBtn, { backgroundColor: "#888888" }]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalHalfBtn, { backgroundColor: "#e53935" }]}
                                onPress={performLogout}
                            >
                                <Text style={styles.modalBtnText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: "#b1b1b1",
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    bannerContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 26,
    },
    nameBlock: {
        paddingHorizontal: 24,
    },
    shopName: {
        ...textPresets.title,
        width: "90%"
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        letterSpacing: 0.8,
        opacity: 0.5,
        marginBottom: 8,
        marginLeft: 4,
        ...textPresets.label
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e8f5ee",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        ...textPresets.body
    },
    menuSub: {
        marginTop: 1,
        opacity: 0.7,
        ...textPresets.label,
        color: "#888"
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginHorizontal: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalCard: {
        width: "100%",
        maxWidth: 320,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    modalIconContainer: {
        marginBottom: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitleText: {
        ...textPresets.body,
        textAlign: "center",
        marginBottom: 8,
        lineHeight: Math.round(14 * 1.5)
    },
    modalMessageText: {
        ...textPresets.label,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: Math.round(14 * 1.5)
    },
    modalConfirmRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    modalHalfBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBtnText: {
        ...textPresets.body,
        color: "#ffffff",
        lineHeight: Math.round(14 * 1.5)
    },
});