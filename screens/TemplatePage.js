import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, AntDesign, Entypo } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";

export default function TemplatePagePage({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            {/* Header */}
            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={28}
                        color={colors.text}
                        style={{ padding: 10 }}
                    />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text }}>
                    Add Offer
                </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 90 }}  >
                <Text style={styles.title}>Choose Your Ad</Text>

                {/*Card1*/}
                <View style={styles.card}>
                    <View style={styles.imagePlaceholder} />
                    <Text style={styles.productTitle}>JP International School Uniform</Text>
                    <Text style={styles.subText}>By Raina clothing shop</Text>

                    <View style={styles.price1}>
                        <Text style={{ color: "green" }}>560rs</Text>
                        <Text style={styles.strike}>1200rs</Text>
                    </View>
                    <View style={styles.price2}>
                        <Text style={{ color: "green" }}>Discounted Price</Text>
                        <Text style={styles.strike}>Original Price</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.star}>
                            <AntDesign name="star" color="#fde248" size={14} />
                            <Text>4.5 (89)</Text>
                        </View>

                        <View style={styles.star}>
                            <Entypo name="location-pin" size={16} color="#000000" />
                            <Text>0.3 km</Text>
                        </View>

                        <View style={styles.star}>
                            <AntDesign name="clock-circle" size={16} color="#157a4f" />
                            <Text style={{ color: "green" }}>Open</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.chat}><Text>Chat</Text></View>
                        <View style={styles.call}><Text style={{ color: "white" }}>Call</Text></View>
                    </View>

                    <TouchableOpacity style={styles.coupon} onPress={() => navigation.navigate("AddOfferPage",{template:"template1"})}>
                        <Text style={{ color: "white" }}>Copy This Coupon For Discount</Text>
                    </TouchableOpacity>

                    <View style={styles.priceBtn}>
                        <Text style={{ color: "white" }}>For ₹15 only</Text>
                    </View>
                </View>

                {/*Card2*/}
                <View style={styles.card}>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={styles.imagePlaceholder2} />
                        <View style={{ paddingHorizontal: 5 }}>
                            <Text style={styles.productTitle}>JP International School Uniform</Text>
                            <Text style={styles.subText}>By Raina clothing shop</Text>
                        </View>
                    </View>

                    <View style={styles.price1}>
                        <Text style={{ color: "green" }}>560rs</Text>
                        <Text style={styles.strike}>1200rs</Text>
                    </View>
                    <View style={styles.price2}>
                        <Text style={{ color: "green" }}>Discounted Price</Text>
                        <Text style={styles.strike}>Original Price</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.star}>
                            <AntDesign name="star" color="#fde248" size={14} />
                            <Text>4.5 (89)</Text>
                        </View>

                        <View style={styles.star}>
                            <Entypo name="location-pin" size={16} color="#000000" />
                            <Text>0.3 km</Text>
                        </View>

                        <View style={styles.star}>
                            <AntDesign name="clock-circle" size={16} color="#157a4f" />
                            <Text style={{ color: "green" }}>Open</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.chat}><Text>Chat</Text></View>
                        <View style={styles.call}><Text style={{ color: "white" }}>Call</Text></View>
                    </View>

                    <TouchableOpacity style={styles.coupon} onPress={() => navigation.navigate("AddOfferPage",{template:"template2"})} >
                        <Text style={{ color: "white" }}>Copy This Coupon For Discount</Text>
                    </TouchableOpacity>

                    <View style={styles.priceBtn}>
                        <Text style={{ color: "white" }}>For ₹10 only</Text>
                    </View>
                </View>

                {/*Card3*/}
                <View style={styles.card}>

                    <View style={{ paddingHorizontal: 5 }}>
                        <Text style={styles.productTitle}>JP International School Uniform</Text>
                        <Text style={styles.subText}>By Raina clothing shop</Text>
                    </View>

                    <View style={styles.price1}>
                        <Text style={{ color: "green" }}>560rs</Text>
                        <Text style={styles.strike}>1200rs</Text>
                    </View>
                    <View style={styles.price2}>
                        <Text style={{ color: "green" }}>Discounted Price</Text>
                        <Text style={styles.strike}>Original Price</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.star}>
                            <AntDesign name="star" color="#fde248" size={14} />
                            <Text>4.5 (89)</Text>
                        </View>

                        <View style={styles.star}>
                            <Entypo name="location-pin" size={16} color="#000000" />
                            <Text>0.3 km</Text>
                        </View>

                        <View style={styles.star}>
                            <AntDesign name="clock-circle" size={16} color="#157a4f" />
                            <Text style={{ color: "green" }}>Open</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.chat}><Text>Chat</Text></View>
                        <View style={styles.call}><Text style={{ color: "white" }}>Call</Text></View>
                    </View>

                    <TouchableOpacity style={styles.coupon} onPress={() => navigation.navigate("AddOfferPage",{template:"template3"})}>
                        <Text style={{ color: "white" }}>Copy This Coupon For Discount</Text>
                    </TouchableOpacity>

                    <View style={styles.priceBtn}>
                        <Text style={{ color: "white" }}>For ₹5 only</Text>
                    </View>
                </View>

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
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
    },
    container: { flex: 1, padding: 16, backgroundColor: "#fffaf2" },
    title: { fontSize: 20, marginBottom: 12 },

    star: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center"
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        elevation: 3
    },

    imagePlaceholder: {
        height: 160,
        backgroundColor: "#e0e0e0",
        borderRadius: 12,
        marginBottom: 10
    },

    imagePlaceholder2: {
        height: 100,
        width: 160,
        backgroundColor: "#e0e0e0",
        borderRadius: 12,
        marginBottom: 10
    },

    productTitle: { fontSize: 16, fontWeight: "600" },
    subText: { color: "gray" },
    price1: {
        marginTop: 6,
        gap: 98,
        alignItems: "center",
        flexDirection: "row"
    },
    price2: {
        gap: 40,
        alignItems: "center",
        flexDirection: "row"
    },
    strike: { textDecorationLine: "line-through", color: "red" },

    row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
    chat: {
        backgroundColor: "#f5b849",
        padding: 8,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: "center"
    },
    call: {
        backgroundColor: "#157a4f",
        padding: 8,
        borderRadius: 8,
        flex: 1,
        alignItems: "center"
    },

    coupon: {
        backgroundColor: "#777",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    },
    priceBtn: {
        backgroundColor: "#333",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10
    },
    nextBtn: {
        backgroundColor: "#f5b849",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 30
    }
});
