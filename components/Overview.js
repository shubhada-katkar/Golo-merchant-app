import React, { useState, useContext, useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { Entypo, FontAwesome5, Octicons, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function Overview() {

    const { colors } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const [shopName, setShopName] = useState("Shop Name");
    const [profileImage, setProfileImage] = useState(require("../assets/profile.png"));

    // ✅ Fetch profile from DB every time screen opens
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const token = await AsyncStorage.getItem("merchantToken");
                    if (!token) return;

                    const res = await fetch(`${BASE_URL}/api/merchant/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    const data = await res.json();

                    if (data.merchant) {
                        setShopName(data.merchant.shopName || "Shop Name");

                        if (data.merchant.image?.url) {
                            setProfileImage({ uri: data.merchant.image.url });
                        } else {
                            setProfileImage(require("../assets/profile.png"));
                        }
                    }

                } catch (error) {
                    console.log("Overview profile fetch error:", error);
                }
            };

            fetchProfile();
        }, [])
    );

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            {/* ===== PROFILE HEADER ===== */}
            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" }}>
                <Image source={profileImage} style={{ height: 90, width: 90, borderRadius: 45 }} />

                <View style={{ flexDirection: "column", paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 20, color: colors.text }}>
                        {shopName}
                    </Text>

                    <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>
                        350
                    </Text>

                    <Text style={{ fontSize: 14, color: "#969494" }}>
                        Total Customers
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18 }}>
                <View style={styles.graph}>
                    <View style={{ flexDirection: "row", alignContent: "center" }}>
                        <Text style={{ fontSize: 20 }}>Shop Visits</Text>
                        <Octicons name="graph" size={24} color="green" style={{ paddingLeft: 8 }} />
                    </View>
                </View>
            </View>

            <View style={{
                flexDirection: "row", paddingVertical: 14,
                paddingHorizontal: 24, alignItems: "center", justifyContent: "space-between"
            }}>

                <View style={{ width: "48%" }}>
                    <Text style={[styles.text, { color: colors.text }]}>Orders Placed</Text>
                    <View style={styles.card1}>
                        <Text style={styles.smallcardtext}>In 7 Days</Text>
                        <Text style={styles.bigcardtext}>340+</Text>
                    </View>
                </View>

                <View style={{ width: "48%" }}>
                    <Text style={[styles.text, { color: colors.text }]}>Revenue Earned</Text>
                    <View style={styles.card1}>
                        <Text style={styles.smallcardtext}>In 7 Days</Text>
                        <Text style={styles.bigcardtext}>₹ 12900</Text>
                    </View>
                </View>
            </View>

            <View style={styles.columncontainer}>
                <Text style={[styles.text, { color: colors.text }]}>Recent Orders</Text>

                <View style={styles.card2}>
                    <Text style={styles.smallcardtext}>Order #1231</Text>
                    <Text style={styles.smallcardtext}>Placed 12 hrs ago</Text>

                    <View style={{ flexDirection: "row", paddingHorizontal: 10, justifyContent: "space-evenly" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Entypo name="bar-graph" size={22} color="green" />
                            <Text style={styles.bigcardtext}>500</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <FontAwesome5 name="box" size={20} color="green" />
                            <Text style={styles.bigcardtext}>5 Items</Text>
                        </View>
                    </View>
                </View>

                {/*Reviews*/}
                <Text style={[styles.text, { color: colors.text }]}>Reviews</Text>
                <View style={styles.card2}>
                    <View style={{ flexDirection: 'row', paddingTop: 10, paddingHorizontal: 10 }}>
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                    </View>
                    <Text style={{ paddingTop: 10, paddingHorizontal: 10 }}>Rahul K.</Text>
                    <Text style={{ paddingHorizontal: 10 }}>"Bext local store on Golo"</Text>
                </View>

                <View style={styles.card2}>
                    <View style={{ flexDirection: 'row', paddingTop: 10, paddingHorizontal: 10 }}>
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                        <AntDesign name="star" size={18} color="yellow" />
                    </View>
                    <Text style={{ paddingTop: 10, paddingHorizontal: 10 }}>Amit Kumar</Text>
                    <Text style={{ paddingHorizontal: 10 }}>"Bext local store on Golo"</Text>
                </View>

                {/*Last Box*/}
                <View style={{ paddingVertical: 14 }}>
                    <View style={styles.lastbox}>
                        <LinearGradient colors={["#f7ad24", "#f8c15b", "#fae4ba"]}
                            style={{ height: 120, borderRadius: 10, padding: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={{ fontSize: 18, fontWeight: 600 }}>See Your Shop As Customer</Text>
                            <Text style={{ fontSize: 14 }}>Open the customer app to see your shop exactly how
                                customers see it.
                            </Text>
                            <Text style={{ fontSize: 14 }}>Tap to explore!</Text>
                        </LinearGradient>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    graph: {
        flex: 1,
        borderRadius: 10,
        minHeight: 200,
        maxHeight: 280,
        elevation: 8,
        shadowColor: "#413f4f",
        shadowRadius: 10,
        shadowOffset: { height: 4, width: 3 },
        padding: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
    },
    text: {
        fontSize: 20,
        width: "100%",
    },
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
        padding: 4,
    },
    columncontainer: {
        paddingHorizontal: 24,
        gap: 10
    },
    smallcardtext: {
        fontSize: 16,
        paddingHorizontal: 10,
    },
    bigcardtext: {
        fontSize: 26,
        paddingHorizontal: 8
    },
    card2: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 110,
        shadowOffset: { height: 4, width: 3 },
        borderWidth: 1,
        shadowColor: "#413f4f",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        elevation: 10,
        backgroundColor: "white",
        paddingVertical: 5,
    },
    lastbox: {
        borderRadius: 10,
        height: 110,
        shadowOffset: { height: 4, width: 3 },
        shadowColor: "#413f4f",
        elevation: 10,
    }
})