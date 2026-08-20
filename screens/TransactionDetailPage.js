import React, { useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const DETAIL = {
    status: "Payment Successful",
    statusSub: "Your payment was completed successfully.",
    paidAmount: "₹2,499",
    completedOn: "12 Jul 2026, 10:42 AM",
    subscription: {
        plan: "GOLO PRO",
        billingPeriod: "Monthly",
        subscriptionStart: "12 Jul 2026",
        nextBillingDate: "12 Aug 2026",
        renewal: "Auto Renewal ON",
        status: "Active",
    },
    payment: {
        method: "Visa •••• 3456",
        transactionId: "TXN202607120001",
        invoiceNumber: "INV-2026-0001",
        referenceId: "REF89324521",
        gateway: "Razorpay",
    },
    billing: {
        planPrice: "₹2,499",
        discount: "₹0",
        gst: "₹0",
        totalPaid: "₹2,499",
    },
    customer: {
        merchantName: "Shubhada Katkar",
        merchantId: "MRC-10245",
        email: "shubhada@example.com",
        phone: "+91 98765 43210",
    },
};

export default function TransactionDetailPage({ navigation }) {

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
                <Text style={{ ...textPresets.title, flex: 1 }}>Transaction Details</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, paddingBottom: 110 }}>

                {/* Status card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIconWrap}>
                        <MaterialIcons name="check" size={20} color="#1f9d55" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.statusTitle}>{DETAIL.status}</Text>
                        <Text style={styles.statusSub}>{DETAIL.statusSub}</Text>
                    </View>
                </View>

                <View style={styles.amountRow}>
                    <View>
                        <Text style={styles.amountLabel}>PAID AMOUNT</Text>
                        <Text style={styles.amountValue}>{DETAIL.paidAmount}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.amountLabel}>COMPLETED ON</Text>
                        <Text style={styles.amountDate}>{DETAIL.completedOn}</Text>
                    </View>
                </View>

                {/* Subscription Details */}
                <Section icon="event" title="Subscription Details">
                    <Row label="Plan" value={DETAIL.subscription.plan} bold />
                    <Row label="Billing Period" value={DETAIL.subscription.billingPeriod} bold />
                    <Row label="Subscription Start" value={DETAIL.subscription.subscriptionStart} bold />
                    <Row label="Next Billing Date" value={DETAIL.subscription.nextBillingDate} bold />
                    <Row label="Renewal" value={DETAIL.subscription.renewal} bold color="#1f9d55" />
                    <Row label="Status" value={DETAIL.subscription.status} statusDot />
                </Section>

                {/* Payment Information */}
                <Section icon="credit-card" title="Payment Information">
                    <View style={styles.rowBetween}>
                        <Text style={styles.rowLabel}>Payment Method</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <FontAwesome5 name="cc-visa" size={16} color="#1a56db" style={{ marginRight: 6 }} />
                            <Text style={styles.rowValue}>{DETAIL.payment.method}</Text>
                        </View>
                    </View>
                    <Row label="Transaction ID" value={DETAIL.payment.transactionId} bold />
                    <Row label="Invoice Number" value={DETAIL.payment.invoiceNumber} bold />
                    <Row label="Reference ID" value={DETAIL.payment.referenceId} bold />
                    <Row label="Gateway" value={DETAIL.payment.gateway} bold />
                </Section>

                {/* Billing Summary */}
                <Section icon="description" title="Billing Summary">
                    <Row label="Plan Price" value={DETAIL.billing.planPrice} bold />
                    <Row label="Discount" value={DETAIL.billing.discount} bold />
                    <Row label="GST (0%)" value={DETAIL.billing.gst} bold />
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalValue}>{DETAIL.billing.totalPaid}</Text>
                    </View>
                </Section>

                {/* Customer Information */}
                <Section icon="person" title="Customer Information">
                    <Row label="Merchant Name" value={DETAIL.customer.merchantName} bold />
                    <Row label="Merchant ID" value={DETAIL.customer.merchantId} bold />
                    <Row label="Email" value={DETAIL.customer.email} bold />
                    <Row label="Phone" value={DETAIL.customer.phone} bold />
                </Section>

                {/* Download invoice */}
                <TouchableOpacity style={styles.downloadBtn}>
                    <MaterialIcons name="file-download" size={16} color="#ffffffff" />
                    <Text style={styles.downloadText}>Download Invoice (PDF)</Text>
                </TouchableOpacity>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

function Section({ icon, title, children }) {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                    <MaterialIcons name={icon} size={16} color="#1f9d55" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function Row({ label, value, bold, color, statusDot }) {
    return (
        <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>{label}</Text>
            {statusDot ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.dot} />
                    <Text style={[styles.rowValue, { color: "#1f9d55" }]}>{value}</Text>
                </View>
            ) : (
                <Text style={[styles.rowValue, bold && { ...textPresets.label }, color && { color }]}>{value}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row1: { alignItems: "center", flexDirection: "row", paddingVertical: 8, paddingHorizontal: 14 },
    downloadBtn: {
        flexDirection: "row",
        alignSelf: "stretch",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        paddingVertical: 10,
        marginTop: 20,
        backgroundColor: "#157a4f"
    },
    downloadText: { color: "#ffffffff", marginLeft: 6, ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statusIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#e8f7ef",
        alignItems: "center",
        justifyContent: "center",
    },
    statusTitle: { color: "#222", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
    statusSub: { color: "#888", marginTop: 2, ...textPresets.caption },
    amountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    amountLabel: { color: "#999", letterSpacing: 0.5, ...textPresets.label },
    amountValue: { color: "#1f9d55", marginTop: 4, ...textPresets.label },
    amountDate: { color: "#333", marginTop: 4, ...textPresets.label },
    sectionCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    sectionIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 7,
        backgroundColor: "#e8f7ef",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    sectionTitle: { color: "#222", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 7,
    },
    rowLabel: { color: "#888", ...textPresets.label },
    rowValue: { color: "#222", ...textPresets.body, lineHeight: Math.round(14 * 1.5) },
    totalLabel: { color: "#222", ...textPresets.label },
    totalValue: { color: "#1f9d55", ...textPresets.label },
    divider: { height: 1, backgroundColor: "#eee", marginVertical: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#1f9d55", marginRight: 6 },
});