import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons } from "@expo/vector-icons";
import { BASE_URL as CONFIG_BASE_URL } from "../config";

export default function Notifications({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const profileImg = require("../assets/profile.png");
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
            if (!token || !BASE_URL) {
                setNotifications([]);
                return;
            }

            let res = await fetch(`${BASE_URL}/users/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${BASE_URL}/api/users/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const data = await res.json();
            const list = data?.data?.notifications || data?.notifications || [];
            setNotifications(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log("Notifications fetch error:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [BASE_URL]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const clearNotifications = async () => {
        if (!notifications.length) return;
        Alert.alert("Clear notifications", "Delete all notifications?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setClearing(true);
                    try {
                        const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                        if (!token || !BASE_URL) return;

                        let res = await fetch(`${BASE_URL}/users/notifications`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (!res.ok && res.status === 404) {
                            res = await fetch(`${BASE_URL}/api/users/notifications`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });
                        }

                        if (res.ok) {
                            setNotifications([]);
                        } else {
                            console.log("Clear notifications failed", res.status);
                        }
                    } catch (error) {
                        console.log("Clear notifications error:", error);
                    } finally {
                        setClearing(false);
                    }
                },
            },
        ]);
    };

    const formatTime = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}> 
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>
                </TouchableOpacity>

                <Text style={{ fontSize: 20, color: colors.text, lineHeight: Math.round(20 * 1.2), flex: 1,
                    fontFamily: "Medium"
                 }}>Notifications</Text>

                <TouchableOpacity onPress={clearNotifications} style={styles.deleteButton} disabled={clearing || loading || !notifications.length}>
                    <MaterialIcons name="delete" size={22} color={colors.text} />
                    <Text style={[styles.deleteText, { color: colors.text }]}>{clearing ? "Clearing" : "Delete"}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {loading ? (
                    <View style={{ paddingTop: 20 }}>
                        <ActivityIndicator size="small" color={colors.text} />
                    </View>
                ) : !notifications.length ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: colors.text, fontSize: 16 }}>No notifications yet.</Text>
                    </View>
                ) : (
                    notifications.map((item, index) => (
                        <View key={item._id || index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }] }>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text, lineHeight: Math.round(16 * 1.5) }}>
                                    {item.senderName || "New Order"}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.text, marginTop: 4, lineHeight: Math.round(12 * 1.5),
                                    fontFamily: "Medium"
                                 }}>
                                    {item.message || item.adTitle || "You have a new notification."}
                                </Text>
                                <View style={styles.notificationMeta}>
                                    <Text style={{ fontSize: 12, color: colors.text, opacity: 0.7,
                                        fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                                     }}>
                                        {formatTime(item.createdAt)}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.text, opacity: 0.7,
                                        fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)
                                     }}>
                                        {item.type || "order"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginHorizontal: 10,
        marginTop: 14,
        borderRadius: 12,
        borderRadius: 10,
        borderWidth: 0.5
    },

profileImage: {
    width: 68,
    height: 68,
    borderRadius: 34,  
},
notificationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
},
deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
},
deleteText: {
    fontSize: 14,
    marginLeft: 6,
    fontFamily: "SemiBold",
    lineHeight: Math.round(16 * 1.5),
},
emptyContainer: {
    padding: 20,
    alignItems: "center",
},
})