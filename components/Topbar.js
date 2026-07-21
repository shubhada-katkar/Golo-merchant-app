import React, { useContext, useEffect, useState } from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL as CONFIG_BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

export default function Topbar() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const { colors } = useContext(ThemeContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");

    const getAuthToken = async () => {
        return (await AsyncStorage.getItem("merchantToken")) || (await AsyncStorage.getItem("accessToken"));
    };

    const fetchUnreadCount = async () => {
        try {
            const token = await getAuthToken();
            if (!token || !BASE_URL) {
                setUnreadCount(0);
                return;
            }

            let response = await fetch(`${BASE_URL}/users/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok && response.status === 404) {
                response = await fetch(`${BASE_URL}/api/users/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (!response.ok) {
                setUnreadCount(0);
                return;
            }

            const data = await response.json();
            const count = Number(
                data?.data?.unreadCount ??
                data?.unreadCount ??
                (Array.isArray(data?.data?.notifications)
                    ? data.data.notifications.filter((item) => !item.read).length
                    : 0) ??
                (Array.isArray(data?.notifications)
                    ? data.notifications.filter((item) => !item.read).length
                    : 0) ??
                0
            );

            setUnreadCount(Number.isFinite(count) ? count : 0);
        } catch (error) {
            console.log("Topbar unread count error:", error);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        const intervalId = setInterval(() => {
            fetchUnreadCount();
        }, 15000);

        return () => clearInterval(intervalId);
    }, [BASE_URL]);

    return (
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" }}>

            <Image source={require('../assets/newlogo2.png')}
                style={{ height: 50, width: 50, resizeMode: "contain" }} />

            <View style={{ flexDirection: "column", paddingHorizontal: 12 }}>
                <Text style={{
                    ...textPresets.subtitle
                }}>GOLO</Text>
            </View>

            <View style={styles.rowcontainer}>
                <TouchableOpacity onPress={() => navigation.navigate("NotificationsPage")} style={styles.bellButton}>
                    <FontAwesome name="bell-o" size={24}
                        color={currentRoute === "NotificationsPage" ? "#157a4f" : "black"} />
                    {unreadCount > 0 ? (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowcontainer: {
        flexDirection: "row",
        marginLeft: "auto",
        alignItems: "center",
        gap: 18
    },
    bellButton: {
        position: "relative",
        padding: 4,
    },
    badgeContainer: {
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    badgeText: {
        color: "#fff",
        ...textPresets.caption
    }
})