import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { enrichOrderDetails, fetchVoucherDetails } from "../services/orderService";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialCommunityIcons, MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

export default function OrderDetailPage() {
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const [orderData, setOrderData] = useState(route.params?.order || {});
  const [enriching, setEnriching] = useState(false);
  const order = orderData;
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const enrichDetails = async () => {
      try {
        setEnriching(true);
        let token;
        try {
          token = await getValidToken();
        } catch (authErr) {
          await handleAuthError(navigation);
          return;
        }

        const enrichedOrder = await enrichOrderDetails(orderData, token);
        setOrderData(enrichedOrder);
      } catch (error) {
        console.error("Failed to enrich order details:", error);
        // Continue with whatever data we have
      } finally {
        setEnriching(false);
      }
    };

    if (orderData) {
      enrichDetails();
    }
  }, []);

  const offerName =
    order?.offerTitle ||
    order?.offerName ||
    order?.title ||
    order?.name ||
    order?.voucher?.offerTitle ||
    order?.voucher?.offer?.title ||
    order?.voucher?.title ||
    order?.voucher?.name ||
    order?.offer?.title ||
    order?.offer?.bannerTitle ||
    "Offer details not available";
  const claimedAt = order?.claimedAt || order?.createdAt || order?.placedAt || order?.timestamp;
  const customerName = order?.customerName || order?.user?.name || order?.customer?.name || "Customer";
  const customerPhone = order?.customerPhone || order?.phone || order?.user?.phone || order?.customer?.phone || order?.contactNumber || "Phone not available";
  const orderId = order?._id || order?.id || order?.orderNumber || "N/A";
  const orderRecordId = order?._id || order?.id || null;
  const orderStatus = String(order?.status || order?.orderStatus || "").toLowerCase();
  const voucherStatus = String(order?.voucher?.status || "").toLowerCase();
  const isOrderRedeemed =
    orderStatus === "completed" ||
    orderStatus === "redeemed" ||
    voucherStatus === "redeemed" ||
    Boolean(order?.redeemedAt || order?.voucher?.redeemedAt);

  const resolveVoucherIdFromOrder = (orderObj) => {
    const candidate = orderObj?.voucherId || orderObj?.voucher?.voucherId || orderObj?.voucher?.id || orderObj?.voucher?._id;
    if (!candidate) return null;
    return String(candidate).trim();
  };

  const orderVoucherId = resolveVoucherIdFromOrder(order);

  useEffect(() => {
    if (isOrderRedeemed) {
      setShowCodeInput(false);
      setCodeValue("");
    }
  }, [isOrderRedeemed]);

  const parseVoucherIdFromQrString = (qrString) => {
    if (!qrString) return null;
    const trimmed = String(qrString).trim();
    if (!trimmed.toLowerCase().startsWith("voucher-")) {
      return null;
    }
    const parts = trimmed.split("-");
    if (parts.length < 3) {
      return null;
    }
    return `${parts[1]}-${parts[2]}`;
  };

  const fetchVoucherIdFromCode = async (code) => {
    if (!code) return null;
    let token;
    try {
      token = await getValidToken();
    } catch (_authErr) { return null; }
    if (!BASE_URL) return null;

    const response = await fetch(`${BASE_URL}/vouchers/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code: String(code).trim() }),
    });

    if (response.status === 401) {
      await handleAuthError(navigation);
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Verification failed (${response.status})`);
    }

    return payload?.data?.voucherId || null;
  };

  const fetchVoucherIdFromVoucherRecord = async (rawId) => {
    if (!rawId) return null;
    let token;
    try {
      token = await getValidToken();
    } catch (_authErr) { return null; }
    if (!BASE_URL) return null;

    const details = await fetchVoucherDetails(rawId, token);
    return details?.voucherId || details?._id || null;
  };

  const updateOrderStatus = async (status) => {
    if (!orderRecordId || !BASE_URL) {
      return false;
    }

    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return false;
      }

      let res = await fetch(`${BASE_URL}/orders/${orderRecordId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.status === 401) {
        await handleAuthError(navigation);
        return false;
      }

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/api/orders/${orderRecordId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });
      }

      if (res.ok) {
        setOrderData((prev) => ({ ...prev, status }));
      }

      return res.ok;
    } catch (error) {
      return false;
    }
  };

  const redeemVoucher = useCallback(async ({ qrCode, verificationCode }) => {
    if (!qrCode && !verificationCode) {
      throw new Error('No verification data provided');
    }

    if (!BASE_URL) {
      throw new Error('API URL not configured');
    }

    let token;
    try {
      token = await getValidToken();
    } catch (authErr) {
      await handleAuthError(navigation);
      throw new Error('Session expired, please log in again');
    }

    let selectedVoucherId = orderVoucherId;

    // If the order payload only contains a raw voucher record _id, resolve the voucherId string.
    if (!selectedVoucherId && order?.voucher?._id) {
      selectedVoucherId = await fetchVoucherIdFromVoucherRecord(order.voucher._id);
    }

    // Validation for QR Code
    if (qrCode) {
      const parsedVoucherId = parseVoucherIdFromQrString(qrCode);

      if (!parsedVoucherId) {
        throw new Error('Invalid QR code format');
      }

      if (orderVoucherId && orderVoucherId !== parsedVoucherId) {
        throw new Error('Scanned QR code does not belong to this order');
      }

      selectedVoucherId = parsedVoucherId;
    }

    // Validation for Alphanumeric Code
    if (verificationCode) {
      const verifiedVoucherId = await fetchVoucherIdFromCode(verificationCode);

      if (!verifiedVoucherId) {
        throw new Error('Invalid or expired verification code');
      }

      if (orderVoucherId && orderVoucherId !== verifiedVoucherId) {
        throw new Error('Entered code does not belong to this order');
      }

      selectedVoucherId = verifiedVoucherId;
    }

    if (!selectedVoucherId) {
      throw new Error('Voucher ID not available');
    }

    const payload = {};
    if (qrCode) payload.qrCode = String(qrCode).trim();
    if (verificationCode) payload.verificationCode = String(verificationCode).trim();

    const res = await fetch(`${BASE_URL}/vouchers/${encodeURIComponent(selectedVoucherId)}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const resp = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = resp?.message || resp?.error || `Redeem failed (${res.status})`;
      throw new Error(errorMsg);
    }

    // Backend already marks the order as COMPLETED during voucher redemption.
    // Try updateOrderStatus as a best-effort status sync.
    try {
      await updateOrderStatus('completed');
    } catch (_ignored) {
      // Order status updated on backend via voucher redemption endpoint
    }

    setOrderData((prev) => ({
      ...prev,
      status: 'completed',
      redeemedAt: new Date().toISOString(),
      voucher: {
        ...(prev?.voucher || {}),
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
      },
    }));
    return resp;
  }, [BASE_URL, orderVoucherId, order]);

  const handleQRCodeScanned = useCallback(async (qrCodeValue) => {
    setLoading(true);
    try {
      await redeemVoucher({ qrCode: qrCodeValue });
      showAlert("success", "Success", "Order redeemed successfully", () => {
        navigation.navigate("HomePage");
        navigation.navigate("HomePage");
      });
    } finally {
      setLoading(false);
    }
  }, [navigation, redeemVoucher]);

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
          <View style={{ justifyContent: 'center' }}>
            <MaterialIcons
              name="arrow-back-ios"
              size={22}
              style={{ padding: 10 }}
            />
          </View>
        </TouchableOpacity>

        <Text style={{
          flex: 1, ...textPresets.title
        }}>Order Details</Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#000", marginBottom: 10 }} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} >
        <ScrollView ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]} keyboardShouldPersistTaps="handled" >

          {/* Customer Info Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={18} color="#157a4f" />
              <Text style={styles.sectionTitle}>Customer Info</Text>
            </View>

            <Text style={styles.fieldLabel}>NAME</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CONTACT NUMBER</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{customerPhone}</Text>
            </View>
          </View>

          {/* Offer Details Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-offer" size={16} color="#157a4f" />
              <Text style={styles.sectionTitle}>Offer Details</Text>
            </View>

            <Text style={styles.fieldLabel}>OFFER NAME</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{offerName}</Text>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CLAIMED DATE AND TIME</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{formatDateTime(claimedAt)}</Text>
            </View>
          </View>

          {!isOrderRedeemed && (
            <View style={{ flexDirection: "row", marginTop: 8, alignItems: "center", justifyContent: "space-between" }}>

              <TouchableOpacity style={styles.actionButton} onPress={() => {
                setShowCodeInput(false);
                navigation.navigate("ScanQRCodePage", { onScanned: handleQRCodeScanned });
              }}>
                <AntDesign name="qrcode" size={20} color="white" />
                <Text style={styles.actionText}>Scan QR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f5b849' }]} onPress={() => {
                setShowCodeInput(true);
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}>
                <Ionicons name="ticket-outline" size={20} color="white" />
                <Text style={styles.actionText}>Enter Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Inline Code Input Section */}
          {showCodeInput && !isOrderRedeemed && (
            <View style={styles.codeInputSection}>
              <Text style={styles.codeInputLabel}>Enter verification code</Text>
              <TextInput
                value={codeValue}
                onChangeText={setCodeValue}
                placeholder="Enter code"
                style={styles.codeInput}
                autoCapitalize="characters"
                placeholderTextColor="#999"
              />
              <View style={styles.codeButtonRow}>
                <TouchableOpacity
                  style={[styles.codeButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCodeInput(false);
                    setCodeValue("");
                  }} >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.codeButton, styles.submitButton]}
                  onPress={async () => {
                    try {
                      if (!codeValue.trim()) {
                        showAlert("error", "Error", "Please enter a verification code");
                        return;
                      }
                      setLoading(true);
                      // token is obtained inside redeemVoucher via getValidToken()
                      if (!BASE_URL) throw new Error('Missing credentials');

                      await redeemVoucher({ verificationCode: codeValue });
                      showAlert("success", "Success", "Order redeemed successfully", () => {
                        setShowCodeInput(false);
                        setCodeValue("");
                        navigation.goBack();
                      });
                    } catch (err) {
                      showAlert("error", "Redeem Failed", String(err?.message || err));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading} >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.codeButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      <SafeAreaView edges={["bottom"]}
        style={{ width: "100%", bottom: 0, position: "absolute" }}>
        <Bottombar />
      </SafeAreaView>

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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },
  sectionTitle: {
    ...textPresets.subtitle,
    color: "#157a4f",
  },
  fieldLabel: {
    color: "#888",
    letterSpacing: 0.6,
    marginBottom: 6,
    ...textPresets.label,
  },
  fieldBox: {
    backgroundColor: "#f4f6f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldValue: {
    ...textPresets.body,
    color: "#1a1a1a",
  },
  actionButton: {
    backgroundColor: '#157a4f',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    width: "48%",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  actionText: {
    color: 'white',
    ...textPresets.body,
  },
  codeInputSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12
  },
  codeInputLabel: {
    ...textPresets.body,
    color: "#157a4f",
    paddingBottom: 8,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
    color: '#111827',
    ...textPresets.body
  },
  codeButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14
  },
  submitButton: {
    backgroundColor: '#157a4f',
    paddingVertical: 14
  },
  codeButtonText: {
    color: 'white',
    ...textPresets.body
  },
  cancelButtonText: {
    color: '#111827',
    ...textPresets.label
  },
});
