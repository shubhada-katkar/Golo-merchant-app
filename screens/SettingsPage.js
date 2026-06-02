import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useRef } from "react";
import { BASE_URL } from "../config";


export default function SettingsPage({ navigation }) {
    const [location, setLocation] = useState("Karveer");
    const { theme, colors, toggleTheme } = useContext(ThemeContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
    const [loadingLogout, setLoadingLogout] = useState(false);
    const arrowRef = useRef();

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

              if (token) {
                // Try primary modern endpoint
                let res = await fetch(`${BASE_URL}/users/logout`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ refreshToken: null }),
                });

                // Legacy fallback
                if (!res.ok && res.status === 404) {
                  await fetch(`${BASE_URL}/users/logout`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ refreshToken: null }),
                  });
                }
              }

              // Clear local storage keys used by this app
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

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack("ProfilePage")}>
                    <MaterialIcons name="arrow-back-ios" size={26} style={{ padding: 10 }} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text,
                  lineHeight: Math.round(20 * 1.2), fontFamily: "Medium", flex: 1
                 }}>
                    Settings
                </Text>

            </View>

            <View style={{ flexDirection: "row", backgroundColor: "black", height: 1 }} />

            <View style={{ paddingTop: 30 }}>
                <View style={styles.items} onPress={() => navigation.navigate("SettingsPage")}>
                    <Feather name="settings" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Dark Mode</Text>
                    <Switch
                        value={theme === "dark"}
                        onValueChange={toggleTheme}
                        thumbColor={theme === "dark" ? "#157a4f" : "#f4f3f4"}
                        trackColor={{ false: "#ccc", true: "#141414" }}
                        ios_backgroundColor="#ccc"
                        style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10 }}
                    />
                </View>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                    <MaterialCommunityIcons name="account-cog-outline" size={24} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Profile Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.items]} 
                  onPress={handleLogout}
                  disabled={loadingLogout}
                >
                    <MaterialIcons name="logout" size={24} color="#ff6b6b" />
                    <Text style={[styles.text, { color: '#ff6b6b' }]}>
                      {loadingLogout ? 'Logging out...' : 'Logout'}
                    </Text>
                </TouchableOpacity>
            </View>

                {/* FULL SCREEN OVERLAY */}
                {showDropdown && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowDropdown(false)}
                    />
                )}

            <SafeAreaView edges={["bottom"]}
                style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14
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
        fontFamily: "Medium",
        lineHeight: Math.round(18 * 1.2),
    },
    dropdown: {
        position: "absolute",
        top: "100%",
        marginTop: 5,
        width: "70%",
        left: 40,
        backgroundColor: "white",
        borderRadius: 10,
        zIndex: 2,
        maxHeight: 180,

        // Android shadow
        elevation: 10,

        // iOS shadow
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
    },

    dropdownItem: {
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    dropdowntext: {
        fontSize: 18
    },
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1
    },
})