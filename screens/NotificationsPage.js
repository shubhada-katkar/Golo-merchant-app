import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { BASE_URL as CONFIG_BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";

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
                    <LinearGradient
                        colors={["#f8a812", "#fad081", "#f8f6f265"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                    />
            
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}> 
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
                    <MaterialIcons name="delete" size={22} color="#a71818" />
                    <Text style={styles.deleteText}>{clearing ? "Clearing" : "Delete"}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <View style={{ paddingTop: 20 }}>
                        <ActivityIndicator size="small" color={colors.text} />
                    </View>
                ) : !notifications.length ? (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: colors.text, fontSize: 16 }}>No notifications yet.</Text>
                    </View>
                ) : (
                    notifications.map((item, index) => {
                        const title = item.senderName || item.title || item.adTitle || "Notification";
                        const message = item.message || item.body || item.adTitle || "You have a new notification.";
                        const dateLabel = formatTime(item.createdAt || item.timestamp || item.updatedAt);
                        const initials = String(title)
                            .split(" ")
                            .filter(Boolean)
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                        return (
                            <View key={item._id || index} style={[styles.card2, styles.orderCard] }>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={styles.avatarCircle}>
                                            <Text style={styles.avatarText}>{initials}</Text>
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text, lineHeight: Math.round(16 * 1.5) }}>
                                                {title}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: colors.text, opacity: 0.7, fontFamily: "Medium", lineHeight: Math.round(12 * 1.5) }}>
                                                {dateLabel}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ height: 0.5, backgroundColor: colors.divider, marginBottom: 8 }} />

                                    <View style={{flexDirection:"row", alignItems:"center", gap:4}}>
                                        <AntDesign name="message" size={12} color="#e4a24c"/>
                                    <Text style={{ fontSize: 12, color: '#e4a24c', fontFamily: "Medium", lineHeight: Math.round(12 * 1.5)}} numberOfLines={1} ellipsizeMode="tail">
                                        {message}
                                    </Text>
                                    </View>
                            </View>
                        );
                    })
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
    card2: {
        borderRadius: 10,
        borderColor: "black",
        shadowOffset: { height: 4, width: 3 },
        shadowColor: "#413f4f",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        elevation: 10,
        backgroundColor: "white",
    },
    orderCard: {
        padding: 10,
        marginTop: 16,
        marginHorizontal:16
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#dbf5e9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#157a4f",
    },
    avatarText: {
        fontSize: 15,
        fontFamily: "Medium",
        color: "#157a4f",
        lineHeight: Math.round(15 * 1.5),
    },
    metaBlock: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
    },
    metaLabel: {
        fontSize: 12,
        color: "#5f5f5f",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },
    metaValue: {
        fontSize: 12,
        color: "#111827",
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
    },

profileImage: {
    width: 68,
    height: 68,
    borderRadius: 34,  
},
notificationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
},
deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#666666",
},
deleteText: {
    fontSize: 14,
    marginLeft: 6,
    fontFamily: "SemiBold",
    lineHeight: Math.round(16 * 1.5),
    color:"#a71818"
},
emptyContainer: {
    padding: 20,
    alignItems: "center",
},
})