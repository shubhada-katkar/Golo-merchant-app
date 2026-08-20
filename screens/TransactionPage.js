import React, { useState, useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const SUMMARY = [
    { key: "total", label: "Total Paid", value: "₹17,493", sub: "Across 8 transactions", icon: "wallet", bg: "#e8f7ef", tint: "#1f9d55" },
    { key: "count", label: "Total Transactions", value: "12", sub: "All time transactions", icon: "receipt", bg: "#e8f7ef", tint: "#1f9d55" },
    { key: "pending", label: "Pending", value: "0", sub: "Payments pending", icon: "schedule", bg: "#fdf3d9", tint: "#d99a1b" },
    { key: "failed", label: "Failed / Refunded", value: "2", sub: "Across 2 transactions", icon: "error-outline", bg: "#fde8e8", tint: "#d9483a" },
];

const TRANSACTIONS = [
    { id: "INV-2026-0001", plan: "GOLO PRO", cycle: "1 Month", date: "01 Jul 2026, 10:42 AM", amount: "₹2,499", status: "Paid", method: "UPI" },
    { id: "INV-2026-0002", plan: "GOLO PRO", cycle: "1 Month", date: "01 Jun 2026, 10:31 AM", amount: "₹2,499", status: "Paid", method: "UPI" },
    { id: "INV-2026-0003", plan: "GOLO PRO", cycle: "1 Month", date: "01 May 2026, 09:15 AM", amount: "₹2,499", status: "Paid", method: "Visa •••• 4242" },
    { id: "INV-2026-0004", plan: "GOLO PRO", cycle: "1 Month", date: "01 Apr 2026, 09:10 AM", amount: "₹2,499", status: "Paid", method: "Visa •••• 4242" },
    { id: "INV-2026-0005", plan: "GOLO BASIC", cycle: "1 Month", date: "01 Mar 2026, 11:20 AM", amount: "₹999", status: "Paid", method: "UPI" },
    { id: "INV-2026-0006", plan: "GOLO PRO", cycle: "1 Month", date: "01 Feb 2026, 10:05 AM", amount: "₹2,499", status: "Failed", method: "PayPal" },
];

const TABS = ["All Transactions", "Paid", "Failed", "Refunded"];

const STATUS_STYLE = {
    Paid: { bg: "#e8f7ef", text: "#1f9d55" },
    Failed: { bg: "#fde8e8", text: "#d9483a" },
    Refunded: { bg: "#fdf3d9", text: "#d99a1b" },
};

const METHOD_ICON = {
    UPI: { icon: "mobile-alt", color: "#5b21b6" },
    "Visa •••• 4242": { icon: "cc-visa", color: "#1a56db" },
    PayPal: { icon: "paypal", color: "#003087" },
};

export default function TransactionPage({ navigation }) {
    const [activeTab, setActiveTab] = useState("All Transactions");

    const filtered = TRANSACTIONS.filter((t) => {
        if (activeTab === "All Transactions") return true;
        return t.status === activeTab;
    });

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={22} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ ...textPresets.title, flex: 1 }}>Transactions</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Summary cards */}
                <View style={styles.summaryGrid}>
                    {SUMMARY.map((s) => (
                        <View key={s.key} style={styles.summaryCard}>
                            <View style={[styles.summaryIconWrap, { backgroundColor: s.bg }]}>
                                <MaterialIcons name={s.icon} size={18} color={s.tint} />
                            </View>
                            <Text style={styles.summaryLabel}>{s.label}</Text>
                            <Text style={styles.summaryValue}>{s.value}</Text>
                            <Text style={styles.summarySub}>{s.sub}</Text>
                        </View>
                    ))}
                </View>

                {/* Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 14 }} // Move horizontal padding here
                    style={{ marginTop: 14, maxHeight: 40 }} // Prevent ScrollView from grabbing unnecessary vertical space
                >
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Transaction list */}
                <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
                    {filtered.map((t) => {
                        const statusStyle = STATUS_STYLE[t.status];
                        const methodMeta = METHOD_ICON[t.method] || { icon: "credit-card", color: "#888" };
                        return (
                            <TouchableOpacity
                                key={t.id}
                                style={styles.txCard}
                                onPress={() => navigation.navigate("TransactionDetailPage", { invoiceId: t.id })}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={styles.txId}>{t.id}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>{t.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.txPlan}>{t.plan} • {t.cycle}</Text>
                                    <Text style={styles.txDate}>{t.date}</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                                        <FontAwesome5 name={methodMeta.icon} size={13} color={methodMeta.color} style={{ marginRight: 6 }} />
                                        <Text style={styles.txMethod}>{t.method}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.txAmount}>{t.amount}</Text>
                                    <MaterialIcons name="chevron-right" size={22} color="#bbb" style={{ marginTop: 20 }} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: { alignItems: "center", flexDirection: "row", paddingVertical: 8, paddingHorizontal: 14 },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 10,
        marginTop: 8,
    },
    summaryCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        margin: "1%",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    summaryIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    summaryLabel: { color: "#888", ...textPresets.label },
    summaryValue: { color: "#222", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
    summarySub: { color: "#aaa", marginTop: 2, ...textPresets.caption },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#fff",
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#eee",
        alignItems: "center",
        justifyContent: "center"
    },
    tabActive: { backgroundColor: "#e8f7ef", borderColor: "#1f9d55" },
    tabText: { color: "#666", ...textPresets.label },
    tabTextActive: { color: "#1f9d55" },
    txCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    txId: { color: "#222", marginRight: 8, ...textPresets.label },
    txPlan: { color: "#555", marginTop: 4, ...textPresets.label },
    txDate: { color: "#999", marginTop: 2, ...textPresets.label },
    txMethod: { color: "#666", ...textPresets.label },
    txAmount: { color: "#222", ...textPresets.label },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText: { ...textPresets.label },
});