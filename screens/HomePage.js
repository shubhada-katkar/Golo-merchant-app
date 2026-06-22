import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import Overview from "../components/Overview";
import Orders from "../components/Orders";
import Customers from "../components/Customers.js";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import {LinearGradient} from "expo-linear-gradient";

export default function HomePage() {
    const [activeTab, setactiveTab] = useState("Overview");
    const { colors } = useContext(ThemeContext);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
            colors={["#f8a812", "#fad081", "#fffbf4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
        />
            <View style={{ zIndex: 1 }}>
            <Topbar />

            <View style={styles.first}>
                <TouchableOpacity onPress={() => setactiveTab("Overview")}>
                    <Text style={[styles.text1, { color: colors.text }]}>Overview</Text>
                    {activeTab == "Overview" && <View style={styles.ActiveTab} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Orders")}>
                    <Text style={[styles.text1, { color: colors.text }]}>Orders</Text>
                    {activeTab == "Orders" && <View style={styles.ActiveTab} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Customers")}>
                    <Text style={[styles.text1, { color: colors.text }]}>Customers</Text>
                    {activeTab == "Customers" && <View style={styles.ActiveTab} />}
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />
            </View>

            {activeTab == "Overview" && <Overview />}
            {activeTab == "Orders" && <Orders />}
            {activeTab == "Customers" && <Customers />}

            <Bottombar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    first: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 18,
        justifyContent: "space-between"
    },
    text1: {
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
    ActiveTab: {
        height: 3,
        backgroundColor: "#157A4F",
        borderRadius: 10,
        alignSelf: "center",
        width: "85%",
    },
})