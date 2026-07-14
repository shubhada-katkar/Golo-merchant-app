import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";
import All from "../components/All";
import Accepted from "../components/Accepted";
import Completed from "../components/Completed";
import Pending from "../components/Pending";
import Rejected from "../components/Rejected";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL as CONFIG_BASE_URL } from "../config";
import { enrichOrderDetails } from "../services/orderService";
import { textPresets } from "../theme/typography";

export default function Orders() {
    const navigation = useNavigation(); const [activeTab, setactiveTab] = useState("All");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
            if (!token || !BASE_URL) {
                setOrders([]);
                return;
            }

            let res = await fetch(`${BASE_URL}/orders/merchant?page=1&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${BASE_URL}/banners/promotions/my?page=1&limit=100`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            const data = await res.json();
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : data?.orders || [];

            const enrichedList = await Promise.all(
                list.map((order) => enrichOrderDetails(order, token).catch(() => order))
            );

            setOrders(enrichedList);
        } catch (error) {
            console.log("Orders fetch error:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [BASE_URL]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useFocusEffect(
        React.useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const totalAmount = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order?.totalAmount || order?.total || order?.amount || 0), 0),
        [orders]
    );
    const totalCount = orders.length;
    const completedOrders = useMemo(
        () => orders.filter((o) => ["completed"].includes(String(o?.status || "").toLowerCase())),
        [orders]
    );
    const acceptedOrders = useMemo(
        () => orders.filter((o) => ["accepted"].includes(String(o?.status || "").toLowerCase())),
        [orders]
    );
    const pendingOrders = useMemo(
        () => orders.filter((o) => ["pending", "new", "claimed"].includes(String(o?.status || "").toLowerCase())),
        [orders]
    );
    const rejectedOrders = useMemo(
        () => orders.filter((o) => ["rejected"].includes(String(o?.status || "").toLowerCase())),
        [orders]
    );

    const updateOrderStatus = async (orderId, nextStatus) => {
        try {
            const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
            if (!token || !BASE_URL) return;

            let res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: nextStatus }),
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: nextStatus }),
                });
            }

            if (res.ok) {
                setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)));
            }
        } catch (error) {
            console.log("Update order status error:", error);
        }
    };

    const deleteOrder = async (orderId) => {
        Alert.alert(
            'Delete order',
            'Are you sure you want to delete this order?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                            if (!token || !BASE_URL) return;

                            let res = await fetch(`${BASE_URL}/orders/${orderId}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            if (!res.ok && res.status === 404) {
                                res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                });
                            }

                            if (res.ok) {
                                await fetchOrders();
                            }
                        } catch (error) {
                            console.log('Delete order error:', error);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={{ flex: 1 }}>

            <View style={{ paddingVertical: 12 }}>
                <View style={styles.card1}>
                    <Text style={{
                        ...textPresets.body
                    }}>Total Orders</Text>
                    <Text style={{
                        ...textPresets.body, color: "#157a4f"
                    }}>{totalCount} Orders</Text>
                </View>
            </View>

            <View style={{ marginBottom: 6 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row1Scroll}>
                    <TouchableOpacity onPress={() => setactiveTab("All")}
                        style={[styles.row1button, activeTab == "All" && styles.ActiveTab]}>
                        <Text style={[styles.row1text, activeTab == "All" && styles.ActiveTabText]}>All</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Pending")}
                        style={[styles.row1button, activeTab == "Pending" && styles.ActiveTab]}>
                        <Text style={[styles.row1text, activeTab == "Pending" && styles.ActiveTabText]}>Pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Accepted")}
                        style={[styles.row1button, activeTab == "Accepted" && styles.ActiveTab]}>
                        <Text style={[styles.row1text, activeTab == "Accepted" && styles.ActiveTabText]}>Accepted</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Completed")}
                        style={[styles.row1button, activeTab == "Completed" && styles.ActiveTab]}>
                        <Text style={[styles.row1text, activeTab == "Completed" && styles.ActiveTabText]}>Completed</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Rejected")}
                        style={[styles.row1button, activeTab == "Rejected" && styles.ActiveTab]}>
                        <Text style={[styles.row1text, activeTab == "Rejected" && styles.ActiveTabText]}>Rejected</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {loading ? (
                <View style={{ paddingTop: 30, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#157a4f" />
                </View>
            ) : (
                <>
                    {activeTab == "All" && <All orders={orders} onStatusChange={updateOrderStatus} onViewOrder={(order) => navigation.navigate("OrderDetailPage", { order })} onRefresh={fetchOrders} onDelete={deleteOrder} />}
                    {activeTab == "Pending" && <Pending orders={pendingOrders} onStatusChange={updateOrderStatus} />}
                    {activeTab == "Accepted" && <Accepted orders={acceptedOrders} onRefresh={fetchOrders} onComplete={(order) => navigation.navigate("OrderDetailPage", { order })} onDelete={deleteOrder} />}
                    {activeTab == "Completed" && <Completed orders={completedOrders} onViewOrder={(order) => navigation.navigate("OrderDetailPage", { order })} onRefresh={fetchOrders} onDelete={deleteOrder} />}
                    {activeTab == "Rejected" && <Rejected orders={rejectedOrders} onDelete={deleteOrder} />}
                </>
            )}

        </View>
    );
}
const styles = StyleSheet.create({
    card1: {
        minHeight: 50,
        paddingHorizontal: 22,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",
    },
    row1Scroll: {
        flexDirection: "row",
        paddingHorizontal: 12,
        gap: 8,
        paddingBottom: 8,
    },
    row1text: {
        color: "white",
        paddingHorizontal: 6,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    row1button: {
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#bebebe",
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 80,
    },
    ActiveTab: {
        backgroundColor: "#ffffff",
        borderWidth: 2,
        borderColor: "#157a4f",
    },
    ActiveTabText: {
        color: "#157a4f",
    }
})
