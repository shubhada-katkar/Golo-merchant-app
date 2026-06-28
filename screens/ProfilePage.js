import React, { useState, useContext, useCallback } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, Switch, ScrollView, Alert } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { Linking } from "react-native";

export default function ProfilePage({ navigation }) {
        const { theme, colors, toggleTheme } = useContext(ThemeContext);
        const [loadingLogout, setLoadingLogout] = useState(false);
    
        // ================= LOGOUT =================
        const handleLogout = async () => {
          Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Logout",
              style: "destructive",
              onPress: async () => {
                try {
                  setLoadingLogout(true);

                  const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");

                  try {
                    if (token) {
                      const logoutHeaders = {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      };

                      let res = await fetch(`${BASE_URL}/users/logout`, {
                        method: "POST",
                        headers: logoutHeaders,
                        body: JSON.stringify({ refreshToken: null }),
                      });

                      if (!res.ok && res.status === 404) {
                        await fetch(`${BASE_URL}/users/logout`, {
                          method: "POST",
                          headers: logoutHeaders,
                          body: JSON.stringify({ refreshToken: null }),
                        });
                      }
                    }
                  } catch (logoutError) {
                    console.log("Logout API error:", logoutError);
                  }

                  await AsyncStorage.multiRemove([
                    "merchantToken",
                    "merchantData",
                    "merchantId",
                    "accessToken",
                    "user",
                    "refreshToken",
                  ]);

                  navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                } catch (err) {
                  Alert.alert("Logout failed", "Please try again");
                } finally {
                  setLoadingLogout(false);
                }
              },
            },
          ]);
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
         <LinearGradient
            colors={["#f8a812", "#fad081", "#f8f6f265"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
            />
         <Topbar />

        <View style={styles.row1}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} style={{ padding: 10 }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text,
                lineHeight: Math.round(20 * 1.2), fontFamily: "Medium", flex: 1
             }}>Profile</Text>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />
        <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>

        {/* Banner + Avatar */}
        <View style={styles.bannerContainer}>
                <Image source={profileImage} style={styles.image} />
        {/* Name + meta */}
            <View style={styles.nameBlock}>
            <Text style={[styles.shopName, { color: colors.text }]}>{shopName}</Text>
            </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>

            <Text style={[styles.sectionHeader, { color: colors.text }]}>GENERAL SETTINGS</Text>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="account-cog-outline" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Profile Settings</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>Manage your business information</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>

            <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 18 }]}>PROMOTE BANNER</Text>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("BannerList")}>
                <View style={styles.iconCircle}>
                    <Feather name="list" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Banners</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>Attract More Customers with Every Banner.</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>
            
            <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 18 }]}>REWARDS & SUPPORT</Text>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={() => navigation.navigate("LoyaltyPage")}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="trophy-outline" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Loyalty Rewards</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>View your current program status</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]}
            onPress={() => Linking.openURL("https://golo.co.in/merchant/help")}>
                <View style={styles.iconCircle}>
                    <AntDesign name="question-circle" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Help Center</Text>
                    <Text style={[styles.menuSub, { color: colors.subText || "#888" }]}>FAQs and customer support</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.subText || "#aaa"} />
            </TouchableOpacity>

            {/* Dark Mode row */}
           {/* <View style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="weather-night" size={20} color="#157a4f" />
                </View>
                <View style={styles.menuText}>
                    <Text style={[styles.menuTitle, { color: colors.text }]}>Dark Mode</Text>
                </View>
                <Switch
                    value={theme === "dark"}
                    onValueChange={toggleTheme}
                    thumbColor={theme === "dark" ? "#157a4f" : "#f4f3f4"}
                    trackColor={{ false: "#ccc", true: "#141414" }}
                    ios_backgroundColor="#ccc"
                />
            </View> */}

            {/* Divider before Sign Out */}
            <View style={[styles.divider, { backgroundColor: colors.divider || "#eee" }]} />

            <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card || "#fff" }]} onPress={handleLogout} disabled={loadingLogout}>
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
        padding:26,
    },
    nameBlock: {
        paddingHorizontal: 24,
    },
    shopName: {
        fontSize: 22,
        fontFamily: "Medium",
        lineHeight:Math.round(22*1.5)
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        fontSize: 11,
        fontFamily: "Medium",
        letterSpacing: 0.8,
        opacity: 0.5,
        marginBottom: 8,
        marginLeft: 4,
        lineHeight:Math.round(11*1.5)
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
        fontSize: 15,
        fontFamily: "Medium",
        lineHeight:Math.round(15*1.5)
    },
    menuSub: {
        fontSize: 12,
        marginTop: 1,
        fontFamily: "Medium",
        opacity: 0.7,
        lineHeight:Math.round(12*1.5)
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginHorizontal: 4,
    },
});