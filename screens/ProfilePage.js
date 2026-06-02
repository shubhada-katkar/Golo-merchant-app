import React, { useState, useContext, useCallback } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";

export default function ProfilePage({ navigation }) {
    const { colors } = useContext(ThemeContext);
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
                    const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                    if (!token) return;

                    let res = await fetch(`${BASE_URL}/users/merchant/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!res.ok && res.status === 404) {
                        res = await fetch(`${BASE_URL}/merchant/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                        });
                    }

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
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text,
                    lineHeight: Math.round(20 * 1.2), fontFamily: "Medium", flex: 1
                 }}>Profile</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider }} />

            <View style={styles.row2}>
                <Image source={profileImage} style={styles.image} />
                <Text style={{ fontSize: 24, paddingHorizontal: 16, color: colors.text,
                    lineHeight: Math.round(24 * 1.2), fontFamily: "SemiBold", flex: 1
                 }}>{shopName}</Text>
            </View>

            <View style={{ paddingTop: 30 }}>
                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("SettingsPage")}>
                    <Feather name="settings" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items}>
                    <AntDesign name="question-circle" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Help Center</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("LoyaltyPage")}>
                    <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Loyality Rewards</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                    <MaterialCommunityIcons name="account-cog-outline" size={24} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Profile Settings</Text>
                </TouchableOpacity>
            </View>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    image: {
        width: 90,
        height: 90,
        borderRadius: 45
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14
    },
    row2: {
        flexDirection: "row",
        paddingHorizontal: 30,
        alignItems: "center",
        paddingTop: 30
    },
    switch: {
        backgroundColor: "#c0bdbd",
        borderRadius: 14,
        justifyContent: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 22,
        paddingVertical: 6
    },
    items: {
        flexDirection: "row",
        paddingHorizontal: 40,
        paddingVertical: 12,
        alignItems: "center"
    },
    text: {
        fontSize: 18,
        paddingHorizontal: 8,
        lineHeight: Math.round(18 * 1.2),
        fontFamily: "Medium"
    },
});
