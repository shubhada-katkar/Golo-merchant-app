import React, { useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import Topbar from "../components/Topbar";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { textPresets } from "../theme/typography";

export const PLANS = [
  {
    id: "basic",
    name: "GOLO BASIC",
    tagline: "Perfect for small shops getting started",
    price: "999",
    icon: "bolt",
    popular: false,
    features: [
      "Up to 50 active products",
      "Basic analytics dashboard",
      "Standard customer support",
      "1 banner promotion/month",
      "Basic loyalty points system",
      "Email notifications",
      "Mobile app access",
    ],
  },
  {
    id: "pro",
    name: "GOLO PRO",
    tagline: "For growing businesses that need more",
    price: "2,499",
    icon: "trending-up",
    popular: true,
    features: [
      "Up to 500 active products",
      "Advanced analytics & insights",
      "Priority customer support",
      "5 banner promotions/month",
      "Advanced loyalty program",
      "Multi-location support",
      "Custom promotions & deals",
      "Email + chat support",
      "API access (basic)",
    ],
  },
  {
    id: "premium",
    name: "GOLO PREMIUM",
    tagline: "Maximum power for enterprise",
    price: "4,999",
    icon: "crown",
    popular: false,
    features: [
      "Unlimited active products",
      "Real-time advanced analytics",
      "24/7 dedicated support",
      "Unlimited banner promotions",
      "Enterprise loyalty program",
      "Unlimited locations",
      "Full API access & integrations",
      "Custom branding & reports",
      "Fraud protection suite",
    ],
  },
];

function PlanIcon({ icon, size = 22 }) {
  if (icon === "bolt") return <Ionicons name="flash" size={size} color="#157a4f" />;
  if (icon === "trending-up") return <Ionicons name="trending-up" size={size} color="#157a4f" />;
  return <FontAwesome5 name="crown" size={size - 4} color="#157a4f" />;
}

export default function UpgradePlanPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);

 const handleSelectPlan = (planId) => {
  const plan = PLANS.find((p) => p.id === planId);
  navigation.navigate("PaymentPage", { plan });
};

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
        <Text
          style={{
            color: colors.text,
            flex: 1,
            ...textPresets.title,
          }}
        >
          Upgrade Plan
        </Text>
      </View>
      <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section */}
        <View style={styles.headerSection}>
          <View style={styles.headerBadge}>
            <FontAwesome5 name="crown" size={12} color="#157a4f" />
            <Text style={styles.headerBadgeText}>UPGRADE YOUR PLAN</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Choose the right plan for your business
          </Text>
          <Text style={styles.headerSubtitle}>
            Scale your business with powerful tools, analytics, and promotions.
          </Text>
        </View>

        {/* Plan cards */}
        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.card,
              { backgroundColor: colors.card || "#fff" },
              plan.popular && styles.cardPopular,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <PlanIcon icon={plan.icon} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.text }]}>
                ₹{plan.price}
                <Text style={styles.priceSuffix}>/month</Text>
              </Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={18} color="#157a4f" />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.selectButtonText}>Select Plan</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Need help choosing card */}
        <View style={[styles.helpCard, { backgroundColor: colors.card || "#fff" }]}>
          <View style={styles.helpIconCircle}>
            <Ionicons name="headset-outline" size={22} color="#f9a641" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>Need help choosing?</Text>
            <Text style={styles.helpSubtitle}>
              Our team is ready to help you pick the perfect plan.
            </Text>
            <TouchableOpacity style={styles.contactSalesButton} activeOpacity={0.7}>
              <Text style={styles.contactSalesText}>Contact Sales</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4ec",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  headerBadgeText: {
    color: "#157a4f",
    marginLeft: 6,
    letterSpacing: 0.5,
    ...textPresets.label,
  },
  headerTitle: {
    textAlign: "center",
    marginBottom: 10,
    ...textPresets.subtitle,
  },
  headerSubtitle: {
    color: "#8a8a8a",
    textAlign: "center",
    paddingHorizontal: 10,
    ...textPresets.caption,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ececec",
    padding: 20,
    marginBottom: 20,
  },
  cardPopular: {
    borderColor: "#f9a641",
    borderWidth: 1.5,
  },
  popularBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    backgroundColor: "#f9a641",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  popularBadgeText: {
    color: "#fff",
    letterSpacing: 0.5,
    ...textPresets.label,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#e6f4ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  planName: {
    marginBottom: 2,
    ...textPresets.subtitle,
  },
  planTagline: {
    color: "#8a8a8a",
    ...textPresets.caption,
  },
  priceRow: {
    marginBottom: 18,
  },
  priceText: {
    ...textPresets.title,
  },
  priceSuffix: {
    fontFamily: "Medium",
    fontSize: 15,
    color: "#8a8a8a",
    lineHeight: Math.round(15 * 1.5)
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    flex: 1,
    ...textPresets.body,
  },
  selectButton: {
    backgroundColor: "#157a4f",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#fff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  helpCard: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ececec",
    padding: 18,
    alignItems: "flex-start",
  },
  helpIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fdf0e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  helpTitle: {
    ...textPresets.subtitle,
    marginBottom: 4,
    lineHeight: Math.round(16 * 1.5)
  },
  helpSubtitle: {
    color: "#8a8a8a",
    marginBottom: 10,
    ...textPresets.label
  },
  contactSalesButton: {
    alignSelf: "flex-start",
  },
  contactSalesText: {
    color: "#157a4f",
    ...textPresets.label
  },
});