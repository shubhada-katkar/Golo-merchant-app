import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import Overview from "../components/Overview";
import Orders from "../components/Orders";
import Customers from "../components/Customers";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";


export default function HomePage() {
    const [activeTab, setactiveTab] = useState("Overview");
    const { colors } = useContext(ThemeContext);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
        paddingVertical: 5,
        paddingHorizontal: 18,
        justifyContent: "space-between"
    },
    text1: {
        fontSize: 18,
    },
    ActiveTab: {
        height: 3,
        backgroundColor: "#8a8989",
        borderRadius: 10,
        alignSelf: "center",
        width: "85%"
    },
})