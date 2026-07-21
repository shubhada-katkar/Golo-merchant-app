import React, { useState, useContext, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert, Linking, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo, Feather, AntDesign, FontAwesome } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { saveAuthData } from "../services/authService";
import { startMerchantNotificationPolling } from "../services/notificationService";
import { textPresets } from "../theme/typography";

const MERCHANT_REGISTER_URL = "https://golo-frontend-inky.vercel.app/merchant";

export default function Login({ navigation, route }) {
  const { colors } = useContext(ThemeContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [visiblepass, setvisiblepass] = useState(false);

  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValidSeconds, setOtpValidSeconds] = useState(0);
  const otpLength = 6;
  const otpRefs = useRef([]);

  const [verifyLoading, setVerifyLoading] = useState(false);

  const otpDigits = [...otp.split(""), ...Array(otpLength).fill("")].slice(0, otpLength);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    const nextOtp = nextDigits.join("");
    setOtp(nextOtp);
    if (digit && index < otpLength - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, event) => {
    if (event.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (route?.params?.email) {
      setEmail(route.params.email);
    }
  }, [route?.params?.email]);

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    return { message: text || "Request failed" };
  };

  // ================= REGISTER (opens webpage) =================
  const handleRegisterPress = async () => {
    try {
      const supported = await Linking.canOpenURL(MERCHANT_REGISTER_URL);
      if (supported) {
        await Linking.openURL(MERCHANT_REGISTER_URL);
      } else {
        Alert.alert("Error", "Unable to open the registration page");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to open the registration page");
    }
  };

  // ================= SOCIAL LOGIN (static placeholders for now) =================
  const handleGooglePress = () => {
    // TODO: wire up Google OAuth
    Alert.alert("Coming Soon", "Google sign-in will be available soon");
  };

  const handleFacebookPress = () => {
    // TODO: wire up Facebook OAuth
    Alert.alert("Coming Soon", "Facebook sign-in will be available soon");
  };

  // ================= LOGIN =================
  const handleLogin = async () => {
    if (forgotMode) {
      Alert.alert("Error", "Exit forgot mode first");
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Enter valid email");
      return;
    }

    try {
      if (!BASE_URL) {
        Alert.alert("Configuration Error", "API URL is not configured");
        return;
      }

      setLoading(true);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000); // 10s timeout

      const payload = {
        email: email.toLowerCase(),
        password,
      };

      // New backend contract (used by web/customer app)
      let response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, accountType: "merchant" }),
        signal: controller.signal
      });

      let data = await parseResponse(response);

      // Legacy fallback route for backward compatibility
      if (!response.ok && response.status === 404) {
        response = await fetch(`${BASE_URL}/api/merchant/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        data = await parseResponse(response);
      }

      setLoading(false);

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }
      // Token validation
      const token = data?.data?.accessToken || data?.token;
      const refreshToken = data?.data?.refreshToken || "";
      const merchant = data?.data?.user || data?.merchant;
      const merchantId = merchant?.id || merchant?._id;

      if (!token || !merchant || !merchantId) {
        Alert.alert("Error", "Invalid server response");
        return;
      }

      // Save securely via authService
      await saveAuthData({ accessToken: token, refreshToken, merchant, merchantId });
      await startMerchantNotificationPolling();

      navigation.reset({
        index: 0,
        routes: [{ name: "HomePage" }],
      });

    }
    catch (error) {

      setLoading(false);

      if (error.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long to respond");
      } else {
        Alert.alert("Network Error", "Check your internet connection");
      }
    }
  };

  // ================= SEND OTP =================
  const handleSendOtp = async () => {
    if (!email.trim()) {
      return Alert.alert("Error", "Enter email");
    }

    try {
      setOtpLoading(true);
      if (!BASE_URL) {
        Alert.alert("Configuration Error", "API URL is not configured");
        setOtpLoading(false);
        return;
      }

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/users/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: controller.signal,
      });

      const data = await parseResponse(response);
      setOtpLoading(false);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Unable to send OTP");
        return;
      }

      Alert.alert("Success", "OTP sent to your registered email address");
      setOtpSent(true);
      setOtp("");
      setOtpCooldown(60);
      setOtpValidSeconds(300);
    } catch (err) {
      setOtpLoading(false);
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long to respond");
      } else {
        Alert.alert("Server Error", "Unable to send OTP");
      }
    }
  };

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      return Alert.alert("Error", "Enter email and OTP");
    }

    if (verifyLoading) return;

    try {
      setVerifyLoading(true);
      if (!BASE_URL) {
        Alert.alert("Configuration Error", "API URL is not configured");
        setVerifyLoading(false);
        return;
      }

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/users/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
        signal: controller.signal,
      });

      const data = await parseResponse(response);
      setVerifyLoading(false);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Invalid OTP");
        return;
      }

      navigation.navigate("ResetPassword", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
    } catch (err) {
      setVerifyLoading(false);
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long to respond");
      } else {
        Alert.alert("Server Error", "Unable to verify OTP");
      }
    }
  };

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (otpValidSeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpValidSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpValidSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>
            {forgotMode ? "Forgot Password" : "Merchant Portal Login"}
          </Text>
          {!forgotMode && (
            <Text style={styles.subtitle}>Manage Your Store & Campaigns</Text>
          )}
        </View>

        {!forgotMode && (
          <>
            {/* ============ SOCIAL LOGIN (static) ============ */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGooglePress}>
                <AntDesign name="google" size={18} color="#EA4335" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={handleFacebookPress}>
                <FontAwesome name="facebook-square" size={18} color="#1877F2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        {!forgotMode ? (
          // ============ NORMAL LOGIN ============
          <>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!visiblepass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setvisiblepass((prev) => !prev)}
              >
                <Entypo name={visiblepass ? "eye" : "eye-with-line"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setForgotMode(true);
                setPassword("");
              }}
              style={styles.forgotLink}
            >
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New to Ad Network Group? </Text>
              <TouchableOpacity onPress={handleRegisterPress}>
                <Text style={styles.registerLink}>Register Now</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // ============ FORGOT PASSWORD ============
          <>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter registered email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {!otpSent ? (
              <TouchableOpacity
                style={[styles.button, (otpCooldown > 0 || otpLoading) && { opacity: 0.6 }]}
                onPress={handleSendOtp}
                disabled={otpCooldown > 0 || otpLoading}
              >
                <Text style={styles.buttonText}>
                  {otpLoading
                    ? "Sending..."
                    : otpCooldown > 0
                      ? `Sent ✓ (${otpCooldown}s)`
                      : "Send OTP"}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.label}>OTP</Text>
                <View style={styles.otpRow}>
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={`otp-${index}`}
                      ref={(ref) => (otpRefs.current[index] = ref)}
                      style={styles.otpBox}
                      keyboardType="numeric"
                      maxLength={1}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(index, value)}
                      onKeyPress={(event) => handleOtpKeyPress(index, event)}
                      textAlign="center"
                      placeholder="-"
                      placeholderTextColor="#9CA3AF"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.button, verifyLoading && { opacity: 0.6 }]}
                  onPress={handleVerifyOtp}
                  disabled={verifyLoading}
                >
                  <Text style={styles.buttonText}>
                    {verifyLoading ? "Verifying..." : "Verify"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, (otpCooldown > 0 || otpLoading) && { opacity: 0.6 }]}
                  onPress={handleSendOtp}
                  disabled={otpCooldown > 0 || otpLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    {otpLoading
                      ? "Resending..."
                      : otpCooldown > 0
                        ? `Resend OTP (${otpCooldown}s)`
                        : "Resend OTP"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.noteText}>
                  OTP valid for {otpValidSeconds > 0 ? formatTimer(otpValidSeconds) : "00:00"}
                </Text>
              </>
            )}

            <View style={styles.registerRow}>
              <TouchableOpacity
                onPress={() => {
                  setForgotMode(false);
                  setOtp("");
                  setOtpSent(false);
                }}
              >
                <Text style={styles.registerLink}>Back To Login</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const CONTENT_WIDTH = width * 0.86;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    ...textPresets.title,
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    ...textPresets.body,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    width: CONTENT_WIDTH,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: CONTENT_WIDTH * 0.47,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  socialText: {
    ...textPresets.body,
    color: "#374151",
    lineHeight: Math.round(14 * 1.5)
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: CONTENT_WIDTH,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    ...textPresets.caption,
    color: "#9CA3AF",
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  label: {
    ...textPresets.subtitle,
    color: "#111827",
    width: CONTENT_WIDTH,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: CONTENT_WIDTH,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...textPresets.body,
    color: "#111827",
  },
  eyeButton: {
    padding: 6,
  },
  forgotLink: {
    alignSelf: "flex-end",
    width: CONTENT_WIDTH,
    alignItems: "flex-end",
    marginBottom: 20,
    marginRight: 10
  },
  link: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  button: {
    backgroundColor: "#157a4f",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    width: CONTENT_WIDTH,
  },
  buttonText: {
    ...textPresets.subtitle,
    color: "#ffffff",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#157a4f",
    paddingVertical: 12,
    alignItems: "center",
    width: CONTENT_WIDTH,
    marginTop: 12,
  },
  secondaryButtonText: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    ...textPresets.body,
    color: "#6B7280",
    lineHeight: Math.round(14 * 1.5)
  },
  registerLink: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5)
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: CONTENT_WIDTH,
    marginBottom: 16,
  },
  otpBox: {
    width: 42,
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    ...textPresets.body,
    color: "#111827",
    lineHeight: Math.round(14 * 1.5)
  },
  noteText: {
    marginTop: 10,
    ...textPresets.caption,
    color: "#6B7280",
    textAlign: "center",
  },
});