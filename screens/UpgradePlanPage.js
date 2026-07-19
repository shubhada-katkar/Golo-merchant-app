import React, { useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import Topbar from "../components/Topbar";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { textPresets } from "../theme/typography";

function PlanIcon({ icon, size = 22 }) {
  if (icon === "bolt") return <Ionicons name="flash" size={size} color="#157a4f" />;
  if (icon === "trending-up") return <Ionicons name="trending-up" size={size} color="#157a4f" />;
  return <FontAwesome5 name="crown" size={size - 4} color="#157a4f" />;
}

export default function UpgradePlanPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const [plans, setPlans] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchRealTimePlans = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/subscriptions/plans`);
      if (response.ok) {
        const fetchedPlans = await response.json();
        if (Array.isArray(fetchedPlans) && fetchedPlans.length > 0) {
          // Include all plans, including the default Free Tier
          const mappedPlans = fetchedPlans.map((plan) => {
            const lowerName = plan.name.toLowerCase();
            let icon = "bolt";
            let tagline = plan.description || "Perfect for small shops getting started";
            let popular = plan.isPopular;

            if (lowerName.includes("pro") || lowerName.includes("starter") || lowerName.includes("basic")) {
              if (lowerName.includes("pro")) {
                icon = "trending-up";
                tagline = plan.description || "For growing businesses that need more";
                popular = true;
              } else {
                icon = "bolt";
                tagline = plan.description || "Perfect for small shops getting started";
                popular = false;
              }
            } else if (lowerName.includes("premium") || lowerName.includes("crown") || lowerName.includes("enterprise")) {
              icon = "crown";
              tagline = plan.description || "Maximum power for enterprise";
              popular = false;
            }

            return {
              id: plan.id,
              name: plan.name.toUpperCase(),
              originalName: plan.name,
              tagline: tagline,
              price: Number(plan.price).toLocaleString("en-IN"),
              icon: icon,
              popular: popular,
              features: plan.displayFeatures || [],
            };
          });
          setPlans(mappedPlans);
        } else {
          setPlans([]);
          setError("No plans are available right now.");
        }
      } else {
        setError("Couldn't load plans. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching real time plans:", err);
      setError("Couldn't load plans. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRealTimePlans();
  }, [fetchRealTimePlans]);

  const handleSelectPlan = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    navigation.navigate("PaymentPage", { plan, plans });
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
        {loading ? (
          <View style={{ paddingVertical: 40, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#157a4f" />
            <Text style={{ marginTop: 10, color: colors.text, ...textPresets.body }}>Loading plans...</Text>
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 40, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="alert-circle-outline" size={32} color="#c0392b" />
            <Text style={{ marginTop: 10, marginBottom: 16, color: colors.text, ...textPresets.body, textAlign: "center" }}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, { paddingHorizontal: 24 }]}
              onPress={fetchRealTimePlans}
              activeOpacity={0.85}
            >
              <Text style={styles.selectButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
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
          ))
        )}

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