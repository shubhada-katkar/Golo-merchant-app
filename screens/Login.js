import React, { useState, useContext, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { saveAuthData } from "../services/authService";
import { startMerchantNotificationPolling } from "../services/notificationService";
import { textPresets } from "../theme/typography";

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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
 
      <View style={styles.centerContainer}>

        {!forgotMode && (
          <Text style={{ ...textPresets.title,color: "#ffffff", }}>
          Login To Your Account</Text>
        )}
        {forgotMode && (
          <Text style={{ ...textPresets.title, color: "#ffffff", }}>
            Forgot Password</Text>
        )}

        <View style={styles.card}>
          {!forgotMode ? (
            // ============ NORMAL LOGIN ============
            <>
              <Text style={styles.text}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.text}>Password</Text>
              <View style={styles.inputpassword}>
                <TextInput style={{ flex: 1, ...textPresets.body }}
                  placeholder="Enter password"
                  secureTextEntry={!visiblepass}
                  value={password}
                  onChangeText={setPassword}
                />
                {!visiblepass ? (
                  <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(true)}>
                    <Entypo name="eye-with-line" size={20} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(false)}>
                    <Entypo name="eye" size={20} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity onPress={() => {
                setForgotMode(true);
                setPassword("");
              }} style={{ alignSelf: "flex-end" }}>
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.button, loading && { opacity: 0.6 }]}
                disabled={loading}
              >
                <Text style={{ ...textPresets.subtitle, color: "white" }}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>
            </>

          ) : (
            // ============ FORGOT PASSWORD ============
            <>
              <Text style={styles.text}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter registered email"
                value={email}
                onChangeText={setEmail}
              />

              {!otpSent ? (

                <TouchableOpacity
                  style={[
                    styles.button,
                    (otpCooldown > 0 || otpLoading) && { opacity: 0.6 }
                  ]}
                  onPress={handleSendOtp}
                  disabled={otpCooldown > 0 || otpLoading}>

                  <Text style={{ color: "white", ...textPresets.subtitle
                   }}>
                    {otpLoading
                      ? "Sending..."
                      : otpCooldown > 0
                        ? `Sent ✓ (${otpCooldown}s)`
                        : "Send OTP"}
                  </Text>

                </TouchableOpacity>
              ) : (

                <>
                  <Text style={styles.text}>OTP</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
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
                          placeholderTextColor="#999"
                        />
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.verifybutton,
                      verifyLoading && { opacity: 0.6 }
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={verifyLoading}
                  >
                    <Text style={{ color: "white", ...textPresets.subtitle }}>
                      {verifyLoading ? "Verifying..." : "Verify"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.smallButton,
                      (otpCooldown > 0 || otpLoading) && { opacity: 0.6 }
                    ]}
                    onPress={handleSendOtp}
                    disabled={otpCooldown > 0 || otpLoading}
                  >
                    <Text style={{ color: "white", ...textPresets.subtitle }}>
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
                </>)}
            </>)}
        </View>

        {!forgotMode ? (
          <>
            <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
              <Text style={{ ...textPresets.body
               }}>
                Don't Have An Account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Registration")}>
                <Text style={styles.link}>Register Here</Text>
              </TouchableOpacity>
            </View>
          </>

        ) : (

          <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity onPress={() => {
              setForgotMode(false);
              setOtp("");
              setOtpSent(false);
            }}>
              <Text style={styles.link}>Back To Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  ); }

const { width, height } = Dimensions.get("window");
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    width: width * 0.85,
    minHeight: height * 0.35,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: "#000000"
  },
  text: {
    ...textPresets.subtitle,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#000000",
    ...textPresets.body
  },
  otpInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#000000",
    ...textPresets.body
  },
  button: {
    backgroundColor: "#157a4f",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  verifybutton: {
    backgroundColor: "#157a4f",
    padding: 12,
    borderRadius: 12,
  },
  link: {
    ...textPresets.body,
    color: "#4caf50",
    paddingHorizontal: 10,
  },
  smallButton: {
    backgroundColor: "#157a4f",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  noteText: {
    marginTop: 8,
    ...textPresets.caption,
    color: "#333",
    textAlign: "center",
    
  },
  inputpassword: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingLeft: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000000",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  otpBox: {
    width: 42,
    height: 60,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 10,
    marginHorizontal: 2,
    ...textPresets.body
  },
  centerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
