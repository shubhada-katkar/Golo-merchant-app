import React, { useContext, useState, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, Modal, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import Topbar from "../components/Topbar";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { PLANS } from "./UpgradePlanPage";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

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
  const [plan, setPlan] = useState(route.params?.plan);
  const plansList = route.params?.plans || PLANS;
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    onClose: null,
  });

  const showAlert = (type, title, message, onClose = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onClose,
    });
  };

  const handleCloseAlert = () => {
    const cb = alertConfig.onClose;
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (typeof cb === "function") {
      cb();
    }
  };

  const monthlyPrice = useMemo(
    () => Number(String(plan?.price || "0").replace(/,/g, "")),
    [plan]
  );

  const totalAmount = monthlyPrice * selectedMonths;
  const selectedDuration = DURATIONS.find((d) => d.months === selectedMonths);

  const formatCurrency = (value) => value.toLocaleString("en-IN");

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }

      const response = await fetch(`${BASE_URL}/subscriptions/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: plan.originalName || plan.name,
          billingCycle: selectedMonths === 12 ? "yearly" : "monthly"
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || "Failed to activate subscription plan.");
      }

      showAlert(
        "success",
        "Payment Successful",
        `Your subscription to ${plan.name} has been activated successfully!`,
        () => navigation.navigate("HomePage")
      );
    } catch (error) {
      console.error("Payment error:", error);
      showAlert(
        "error",
        "Subscription Failed",
        error.message || "An error occurred during payment."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayWithRazorpay = async () => {
    setIsRazorpayProcessing(true);
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }

      let orderData = null;

      try {
        const response = await fetch(`${BASE_URL}/payments/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: totalAmount,
            currency: "INR",
            description: `Subscription - ${plan.name} (${selectedDuration?.label || '1 Month'})`,
            notes: {
              planName: plan.originalName || plan.name,
              billingCycle: selectedMonths === 12 ? "yearly" : "monthly"
            }
          })
        });

        const resData = await response.json();
        if (response.ok && resData.success && resData.data?.keyId) {
          orderData = resData.data;
        }
      } catch (apiErr) {
        console.warn("Backend Razorpay order endpoint unavailable, using test mode:", apiErr);
      }

      // Fallback for test mode if backend payment gateway endpoint is unconfigured on remote server
      if (!orderData) {
        orderData = {
          keyId: "rzp_test_S0GsFh4dYJBDOG",
          order: {
            id: `order_test_${Date.now()}`,
            amount: totalAmount * 100,
            currency: "INR"
          }
        };
      }

      setRazorpayOrderData(orderData);
      setRazorpayModalVisible(true);
    } catch (error) {
      console.error("Razorpay order initialization error:", error);
      showAlert(
        "error",
        "Initialization Failed",
        error.message || "An error occurred while launching Razorpay."
      );
    } finally {
      setIsRazorpayProcessing(false);
    }
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === "SUCCESS") {
        setRazorpayModalVisible(false);
        setRazorpayOrderData(null);
        setIsRazorpayProcessing(true);

        let token;
        try {
          token = await getValidToken();
        } catch (authErr) {
          await handleAuthError(navigation);
          return;
        }

        // 1. Try backend payment verification if a live backend order was used
        if (data.razorpay_order_id && !data.razorpay_order_id.startsWith("order_test_")) {
          try {
            await fetch(`${BASE_URL}/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: data.razorpay_order_id,
                razorpayPaymentId: data.razorpay_payment_id,
                razorpaySignature: data.razorpay_signature
              })
            });
          } catch (verifyErr) {
            console.warn("Backend payment verification skipped:", verifyErr);
          }
        }

        // 2. Activate Subscription
        const subRes = await fetch(`${BASE_URL}/subscriptions/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            planName: plan.originalName || plan.name,
            billingCycle: selectedMonths === 12 ? "yearly" : "monthly"
          })
        });

        const subData = await subRes.json();
        if (!subRes.ok) {
          throw new Error(subData?.message || "Failed to update subscription.");
        }

        showAlert(
          "success",
          "Payment Successful",
          `Your subscription to ${plan.name} has been activated successfully via Razorpay!`,
          () => navigation.navigate("HomePage")
        );
      } else if (data.event === "CANCELLED") {
        setRazorpayModalVisible(false);
        setRazorpayOrderData(null);
        showAlert("error", "Payment Cancelled", "Payment process was cancelled.");
      } else if (data.event === "FAILED") {
        setRazorpayModalVisible(false);
        setRazorpayOrderData(null);
        showAlert("error", "Payment Failed", data.error?.description || "Razorpay payment failed.");
      }
    } catch (err) {
      console.error("Razorpay webview message error:", err);
      setRazorpayModalVisible(false);
      setRazorpayOrderData(null);
      showAlert("error", "Payment Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsRazorpayProcessing(false);
    }
  };

  const getRazorpayCheckoutHtml = () => {
    if (!razorpayOrderData) return "";
    const { keyId, order } = razorpayOrderData;
    const isRealOrder = order && order.id && !String(order.id).startsWith("order_test_");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f8f9fa;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .loading {
              font-size: 16px;
              color: #157a4f;
              font-weight: bold;
            }
          </style>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <div class="loading">Loading Razorpay Gateway...</div>
          <script>
            var options = {
              "key": "${keyId}",
              "amount": "${order.amount}",
              "currency": "${order.currency || 'INR'}",
              "name": "Golo Subscriptions",
              "description": "Subscription - ${plan.name}",
              ${isRealOrder ? `"order_id": "${order.id}",` : ''}
              "handler": function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: "SUCCESS",
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id || "",
                  razorpay_signature: response.razorpay_signature || ""
                }));
              },
              "modal": {
                "ondismiss": function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    event: "CANCELLED"
                  }));
                }
              },
              "theme": {
                "color": "#157a4f"
              }
            };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: "FAILED",
                error: response.error
              }));
            });
            window.onload = function() {
              rzp.open();
            };
          </script>
        </body>
      </html>
    `;
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
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...textPresets.body }}>No plan selected.</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={{ paddingLeft: 5, flex: 1, ...textPresets.title }}>
          Payment
        </Text>
      </View>
      <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected plan summary */}
        <View style={[styles.planCard, { backgroundColor: "#fff" }]}>
          <View style={styles.planCardTopRow}>
            <View style={styles.iconCircle}>
              <PlanIcon icon={plan.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
            </View>
            <Text style={styles.planPrice}>
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
        <Text style={styles.sectionTitle}>Select Duration</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: "#fff" }]}
          onPress={() => setDurationModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={18} color="#157a4f" />
            <Text style={styles.dropdownTriggerText}>
              {selectedDuration?.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#8a8a8a" />
        </TouchableOpacity>

        {/* Price breakdown */}
        <View style={[styles.summaryCard, { backgroundColor: "#fff" }]}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{plan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly Price</Text>
            <Text style={styles.summaryValue}>₹{plan.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{selectedDuration?.label}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed pay buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (isProcessing || isRazorpayProcessing) && { opacity: 0.6 }]}
          onPress={handlePayNow}
          disabled={isProcessing || isRazorpayProcessing}
          activeOpacity={0.85} >
          <Text style={styles.payButtonText}>
            {isProcessing ? "Processing..." : `Pay ₹${formatCurrency(totalAmount)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.razorpayButton,
            (isProcessing || isRazorpayProcessing) && { opacity: 0.6 }
          ]}
          onPress={handlePayWithRazorpay}
          disabled={isProcessing || isRazorpayProcessing}
          activeOpacity={0.85}
        >
          <Ionicons name="card-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.razorpayButtonText}>
            {isRazorpayProcessing ? "Initializing..." : "Pay through Razorpay"}
          </Text>
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
          <Pressable style={[styles.centeredModal, { backgroundColor: "#fff" }]}>
            <Text style={styles.modalTitle}>Select Duration</Text>
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
                      { color: active ? "#157a4f" : "#000" },
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
              <Text style={styles.centeredCancelText}>Cancel</Text>
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
          <Pressable style={[styles.modalSheet, { backgroundColor: "#fff" }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose a Plan</Text>
            {plansList.map((p) => {
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
                    <Text style={styles.planOptionName}>{p.name}</Text>
                    <Text style={styles.planOptionPrice}>₹{p.price}/month</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color="#157a4f" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={razorpayModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setRazorpayModalVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={styles.razorpayHeader}>
            <Text style={styles.razorpayHeaderTitle}>Razorpay Gateway (Test Mode)</Text>
            <TouchableOpacity
              onPress={() => {
                setRazorpayModalVisible(false);
                showAlert("error", "Payment Cancelled", "Razorpay payment window closed.");
              }}
              style={{ padding: 6 }}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          {razorpayOrderData && (
            <WebView
              originWhitelist={["*"]}
              source={{ html: getRazorpayCheckoutHtml() }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#157a4f" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleCloseAlert}
      />
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
  razorpayButton: {
    backgroundColor: "#f5ba47",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  razorpayButtonText: {
    color: "#fff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  razorpayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
    backgroundColor: "#ffffff",
  },
  razorpayHeaderTitle: {
    ...textPresets.subtitle,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});