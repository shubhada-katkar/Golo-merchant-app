import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Entypo } from "@expo/vector-icons";
import All from "../components/All";
import Accepted from "../components/Accepted";
import Completed  from "../components/Completed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL as CONFIG_BASE_URL } from "../config";

export default function Orders() {    const navigation = useNavigation();    const [activeTab, setactiveTab] = useState("All");
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
            setOrders(list);
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
        // mark as rejected (backend has no delete endpoint), then refresh list
        await updateOrderStatus(orderId, 'rejected');
        await fetchOrders();
    };

    return (
        <View style={{flex:1}}>

            <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                <View style={styles.card1}>
                        <Text style={{ fontSize: 19, fontFamily:"Medium",
                            lineHeight: Math.round(19 * 1.5)
                         }}>Total Orders</Text>
                    <Text style={{fontSize:14, fontFamily:"Medium",
                        lineHeight: Math.round(14 * 1.5), color:"#157a4f"
                    }}>{totalCount} Orders</Text>                        
                </View>
            </View>

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => setactiveTab("All")}
                    style={[styles.row1button, activeTab == "All" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Accepted")}
                    style={[styles.row1button, activeTab == "Accepted" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>Accepted</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Completed")}
                    style={[styles.row1button, activeTab == "Completed" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>Completed</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ paddingTop: 30, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#157a4f" />
                </View>
            ) : (
                <>
                    {activeTab == "All" && <All orders={orders} onStatusChange={updateOrderStatus} onRefresh={fetchOrders} onDelete={deleteOrder} />}
                    {activeTab == "Accepted" && <Accepted orders={acceptedOrders} onRefresh={fetchOrders} onComplete={(order) => navigation.navigate("OrderDetailPage", { order })} onDelete={deleteOrder} />}
                    {activeTab == "Completed" && <Completed orders={completedOrders} onRefresh={fetchOrders} onDelete={deleteOrder} />}
                </>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    card1: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 80,
        borderWidth: 1,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        paddingHorizontal: 16,
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center",     
    },
    row1: {
        flexDirection: "row",
        paddingHorizontal:12,
        gap:8,
        paddingBottom:8
    },
    row1text: {
        fontSize: 14,
        color: "white",
        paddingHorizontal: 6,
        fontFamily:"Medium",
        lineHeight: Math.round(14 * 1.5)
    },
    row1button: {
        flex:1,
        borderRadius: 20,
        backgroundColor: "#a5a4a4",
        paddingVertical: 6,
        alignItems: "center",
        justifyContent:"center"
    },
    ActiveTab: {
        backgroundColor: "#818181",
        borderWidth: 2,
        borderColor: "#535353",
    }
})
