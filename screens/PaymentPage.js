import React, { useContext, useState, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import Topbar from "../components/Topbar";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { PLANS } from "./UpgradePlanPage";
import { textPresets } from "../theme/typography";

const DURATIONS = [
  { months: 1, label: "1 Month" },
  { months: 3, label: "3 Months" },
  { months: 6, label: "6 Months" },
  { months: 12, label: "12 Months" },
];

function PlanIcon({ icon, size = 22 }) {
  if (icon === "bolt") return <Ionicons name="flash" size={size} color="#157a4f" />;
  if (icon === "trending-up") return <Ionicons name="trending-up" size={size} color="#157a4f" />;
  return <FontAwesome5 name="crown" size={size - 4} color="#157a4f" />;
}

export default function PaymentPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const [plan, setPlan] = useState(route.params?.plan);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);

  const monthlyPrice = useMemo(
    () => Number(String(plan?.price || "0").replace(/,/g, "")),
    [plan]
  );

  const totalAmount = monthlyPrice * selectedMonths;
  const selectedDuration = DURATIONS.find((d) => d.months === selectedMonths);

  const formatCurrency = (value) => value.toLocaleString("en-IN");

  const handlePayNow = async () => {
    // TODO: wire this up to your payment gateway
    console.log("Pay now:", { planId: plan?.id, months: selectedMonths, amount: totalAmount });
  };

  const handleChangePlan = (newPlan) => {
    setPlan(newPlan);
    setPlanModalVisible(false);
  };

  const handleSelectDuration = (months) => {
    setSelectedMonths(months);
    setDurationModalVisible(false);
  };

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...textPresets.body }}>No plan selected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
      />
      <Topbar />

      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} style={{ padding: 10 }} />
        </TouchableOpacity>
        <Text style={{ paddingLeft: 5, flex: 1, ...textPresets.title }}>
          Payment
        </Text>
      </View>
      <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected plan summary */}
        <View style={[styles.planCard, { backgroundColor: colors.card || "#fff" }]}>
          <View style={styles.planCardTopRow}>
            <View style={styles.iconCircle}>
              <PlanIcon icon={plan.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
            </View>
            <Text style={[styles.planPrice, { color: colors.text }]}>
              ₹{plan.price}
              <Text style={styles.planPriceSuffix}>/mo</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changePlanButton}
            onPress={() => setPlanModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={16} color="#157a4f" />
            <Text style={styles.changePlanText}>Change Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Duration dropdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Duration</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: colors.card || "#fff" }]}
          onPress={() => setDurationModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={18} color="#157a4f" />
            <Text style={[styles.dropdownTriggerText, { color: colors.text }]}>
              {selectedDuration?.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#8a8a8a" />
        </TouchableOpacity>

        {/* Price breakdown */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card || "#fff" }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{plan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Price</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{plan.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{selectedDuration?.label}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed pay button */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.payButton} onPress={handlePayNow} activeOpacity={0.85}>
          <Text style={styles.payButtonText}>Pay ₹{formatCurrency(totalAmount)}</Text>
        </TouchableOpacity>
      </View>

      {/* Duration selection modal - centered */}
      <Modal
        visible={durationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.centeredOverlay} onPress={() => setDurationModalVisible(false)}>
          <Pressable style={[styles.centeredModal, { backgroundColor: colors.card || "#fff" }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Duration</Text>
            {DURATIONS.map((d) => {
              const active = d.months === selectedMonths;
              return (
                <TouchableOpacity
                  key={d.months}
                  style={[styles.modalOptionRow, active && styles.modalOptionRowActive]}
                  onPress={() => handleSelectDuration(d.months)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: active ? "#157a4f" : colors.text },
                    ]}
                  >
                    {d.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color="#157a4f" />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.centeredCancelButton}
              onPress={() => setDurationModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.centeredCancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Change plan modal */}
      <Modal
        visible={planModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlanModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPlanModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card || "#fff" }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose a Plan</Text>
            {PLANS.map((p) => {
              const active = p.id === plan.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planOptionRow, active && styles.modalOptionRowActive]}
                  onPress={() => handleChangePlan(p)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircleSmall}>
                    <PlanIcon icon={p.icon} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planOptionName, { color: colors.text }]}>{p.name}</Text>
                    <Text style={styles.planOptionPrice}>₹{p.price}/month</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color="#157a4f" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ececec",
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  planCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e6f4ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e6f4ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  planName: {
    ...textPresets.subtitle,
  },
  planTagline: {
    ...textPresets.caption,
    color: "#8a8a8a",
  },
  planPrice: {
    ...textPresets.body,
  },
  planPriceSuffix: {
    ...textPresets.caption,
    color: "#8a8a8a",
  },
  changePlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#157a4f",
    borderRadius: 12,
    paddingVertical: 10,
  },
  changePlanText: {
    color: "#157a4f",
    marginLeft: 6,
    ...textPresets.label,
  },
  sectionTitle: {
    marginBottom: 12,
    ...textPresets.subtitle
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececec",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  dropdownTriggerText: {
    ...textPresets.body,
    marginLeft: 10,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ececec",
    padding: 18,
  },
  summaryTitle: {
    ...textPresets.body,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    ...textPresets.label,
    color: "#8a8a8a",
  },
  summaryValue: {
    ...textPresets.label,
  },
  divider: {
    height: 1,
    backgroundColor: "#ececec",
    marginVertical: 10,
  },
  totalLabel: {
    ...textPresets.body,
  },
  totalValue: {
    color: "#157a4f",
    ...textPresets.subtitle
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  payButton: {
    backgroundColor: "#157a4f",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    ...textPresets.body
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ececec",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    ...textPresets.subtitle,
    marginBottom: 14,
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalOptionRowActive: {
    backgroundColor: "#e6f4ec",
  },
  modalOptionText: {
    ...textPresets.body,
  },
  planOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  planOptionName: {
    ...textPresets.body,
  },
  planOptionPrice: {
    ...textPresets.caption,
    color: "#8a8a8a",
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  centeredModal: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
  },
  centeredCancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#157a4f",
    borderRadius: 12,
  },
  centeredCancelText: {
    ...textPresets.body,
  },
});