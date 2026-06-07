import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
 } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { enrichOrderDetails, fetchVoucherDetails } from "../services/orderService";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import {ThemeContext} from "../theme/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

export default function OrderDetailPage() {
  const scrollViewRef = useRef(null);
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const [orderData, setOrderData] = useState(route.params?.order || {});
  const [enriching, setEnriching] = useState(false);
  const order = orderData;
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const enrichDetails = async () => {
      try {
        setEnriching(true);
        const token = (await AsyncStorage.getItem("merchantToken")) || 
                     (await AsyncStorage.getItem("accessToken"));
        if (!token) {
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

  const resolveVoucherIdFromOrder = (orderObj) => {
    const candidate = orderObj?.voucherId || orderObj?.voucher?.voucherId || orderObj?.voucher?.id || orderObj?.voucher?._id;
    if (!candidate) return null;
    return String(candidate).trim();
  };

  const orderVoucherId = resolveVoucherIdFromOrder(order);

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
    const token = await AsyncStorage.getItem('merchantToken') || await AsyncStorage.getItem('accessToken');
    if (!token || !BASE_URL) return null;

    const response = await fetch(`${BASE_URL}/vouchers/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code: String(code).trim() }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `Verification failed (${response.status})`);
    }

    return payload?.data?.voucherId || null;
  };

  const fetchVoucherIdFromVoucherRecord = async (rawId) => {
    if (!rawId) return null;
    const token = await AsyncStorage.getItem('merchantToken') || await AsyncStorage.getItem('accessToken');
    if (!token || !BASE_URL) return null;

    const details = await fetchVoucherDetails(rawId, token);
    return details?.voucherId || details?._id || null;
  };

  const updateOrderStatus = async (status) => {
    if (!orderRecordId || !BASE_URL) {
      return false;
    }

    try {
      const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
      if (!token) return false;

      let res = await fetch(`${BASE_URL}/orders/${orderRecordId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

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

    const token = await AsyncStorage.getItem('merchantToken') || await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Missing credentials');
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

    const statusUpdated = await updateOrderStatus('completed');
    if (!statusUpdated) {
      throw new Error('Voucher redeemed, but order status update failed');
    }

    setOrderData((prev) => ({ ...prev, status: 'completed' }));
    return resp;
  }, [BASE_URL, orderVoucherId, order]);

  const handleQRCodeScanned = useCallback(async (qrCodeValue) => {
    setLoading(true);
    try {
      await redeemVoucher({ qrCode: qrCodeValue });
      Alert.alert('Success', 'Order redeemed successfully');
      navigation.goBack();
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, redeemVoucher]);

  return (
         <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Topbar/>

        <View style={styles.row1}>
            <TouchableOpacity onPress={() => navigation.navigate("HomePage")}> 
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>
                </TouchableOpacity>

                <Text style={{ fontSize: 20, color: colors.text, lineHeight: Math.round(20 * 1.2), flex: 1,
                    fontFamily: "Medium"
                 }}>Order Details</Text>
        </View>

        <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 10 }} />

        <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView
  ref={scrollViewRef}
    contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
    keyboardShouldPersistTaps="handled"
  > 

        <View style={styles.card}>
          <Text style={styles.label}>Offer Name</Text>
          <Text style={styles.value}>{offerName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Claim Date & Time</Text>
          <Text style={styles.value}>{formatDateTime(claimedAt)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.value}>{customerName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Customer Phone</Text>
          <Text style={styles.value}>{customerPhone}</Text>
        </View>

        <View style={{marginTop:8}}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setShowCodeInput(false);
            navigation.navigate("ScanQRCodePage", { onScanned: handleQRCodeScanned });
          }}>
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, {backgroundColor:'#f5b849'}]} onPress={() => {
            setShowCodeInput(true);
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}>
            <Text style={styles.actionText}>Enter Alphanumeric Code</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Code Input Section */}
        {showCodeInput && (
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
                onPress={() => { setShowCodeInput(false);
                  setCodeValue(""); }} >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.codeButton, styles.submitButton]} 
                onPress={async () => {
                  try {
                    if (!codeValue.trim()) {
                      Alert.alert('Error', 'Please enter a verification code');
                      return;
                    }
                    setLoading(true);
                    const token = await AsyncStorage.getItem('merchantToken') || await AsyncStorage.getItem('accessToken');
                    if (!token || !BASE_URL) throw new Error('Missing credentials');

                    await redeemVoucher({ verificationCode: codeValue });
                    Alert.alert('Success', 'Order redeemed successfully');
                    setShowCodeInput(false);
                    setCodeValue("");
                    navigation.goBack();
                  } catch (err) {
                    Alert.alert('Redeem failed', String(err?.message || err));
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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14
    },
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Medium",
    lineHeight: Math.round(20 * 1.5),
  },
  closeButton: {
    backgroundColor: "#157a4f",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeText: {
    color: "white",
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
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
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontFamily:"Medium",
    lineHeight: Math.round(14 * 1.5)
  },
  value: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    color: "#222",
  },
  actionButton: {
    backgroundColor: '#157a4f',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontFamily: 'Medium',
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
  codeInputSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  codeInputLabel: {
    fontSize: 14,
    fontFamily: 'SemiBold',
    marginBottom: 12,
    color: '#111827',
    lineHeight: Math.round(14 * 1.5),
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#f9fafb',
    fontSize: 14,
    fontFamily: 'Medium',
    color: '#111827',
  },
  codeButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#157a4f',
  },
  codeButtonText: {
    color: 'white',
    fontFamily: 'SemiBold',
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
  cancelButtonText: {
    color: '#111827',
    fontFamily: 'SemiBold',
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
});