import React, { useState, useContext } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo } from "@expo/vector-icons";
import { BASE_URL } from "../config";

export default function Login({ navigation }) {
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

  const [verifyLoading, setVerifyLoading] = useState(false);

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

      const parseResponse = async (response) => {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return response.json();
        }
        const text = await response.text();
        return { message: text || "Request failed" };
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
      Alert.alert("Login Successful");

      // Token validation
      const token = data?.data?.accessToken || data?.token;
      const merchant = data?.data?.user || data?.merchant;
      const merchantId = merchant?.id || merchant?._id;

      if (!token || !merchant || !merchantId) {
        Alert.alert("Error", "Invalid server response");
        return;
      }
      
      // Save securely
      await AsyncStorage.multiSet([
        ["merchantToken", token],
        ["merchantData", JSON.stringify(merchant)],
        ["merchantId", String(merchantId)]
      ]);

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

    if (!email) {
      return Alert.alert("Error", "Enter email");
    }

    try {
      setOtpLoading(true);
      // OTP endpoints not available in current backend
      // Disabled for now - backend doesn't support send-otp
      Alert.alert("Notice", "OTP feature temporarily unavailable");
      setOtpLoading(false);
    } catch (err) {
      setOtpLoading(false);
      Alert.alert("Server error");
    }
  };

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async () => {

    if (!email || !otp) {
      return Alert.alert("Error", "Enter OTP");
    }

    if (verifyLoading) return; // extra safety

    try {
      setVerifyLoading(true);
      // OTP endpoints not available in current backend
      // Disabled for now
      Alert.alert("Notice", "OTP verification temporarily unavailable");
      setVerifyLoading(false);
    } catch (err) {
      setVerifyLoading(false);
      Alert.alert("Server error");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} />

      <View style={styles.centerContainer}>

        <Text style={{ fontSize: width * 0.06, color: "#ffffff",
          lineHeight:Math.round(width * 0.06 * 1.5), fontFamily:"SemiBold"
         }}>
          Login To Your Account</Text>

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
                <TextInput style={{ fontSize: 16, flex: 1,
                  fontFamily:"Medium"
                 }}
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

              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.button, loading && { opacity: 0.6 }]}
                disabled={loading}
              >
                <Text style={{ color: "white", fontSize: 18,
                  fontFamily:"Medium", lineHeight:Math.round(18*1.5)
                 }}>
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

                  <Text style={{ color: "white", fontSize: 18,
                    fontFamily:"Medium", lineHeight:Math.round(18*1.5)
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>

                    <TextInput
                      style={styles.otpInput}
                      placeholder="Enter OTP"
                      keyboardType="numeric"
                      value={otp}
                      onChangeText={setOtp}
                    />

                    <TouchableOpacity
                      style={[
                        styles.verifybutton,
                        verifyLoading && { opacity: 0.6 }
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={verifyLoading}
                    >
                      <Text style={{ color: "white", fontSize: 18,
                        fontFamily:"Medium", lineHeight:Math.round(18*1.5)
                       }}>
                        {verifyLoading ? "Verifying..." : "Verify"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>)}
            </>)}
        </View>

        {!forgotMode ? (
          <>
            <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
              <Text style={{ fontSize: 16,
                fontFamily:"Medium", lineHeight:Math.round(16*1.5)
               }}>
                Don't Have An Account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Registration")}>
                <Text style={styles.link}>Register Here</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
              <Text style={{ fontSize: 16,
                fontFamily:"Medium", lineHeight:Math.round(16*1.5)
               }}>Forgot Password?</Text>
              <TouchableOpacity onPress={() => {
                setForgotMode(true);
                setPassword("");
              }}>
                <Text style={styles.link}>Click Here</Text>
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
  );
}

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
    fontSize: width * 0.048,
    fontFamily:"Medium", 
    lineHeight:Math.round(width * 0.048 * 1.5)
  },

  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#000000",
    fontFamily:"Medium"
  },

  otpInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    flex: 1,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#000000",
    fontFamily:"Medium",
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
    fontSize: 16,
    color: "#4caf50",
    paddingHorizontal: 10,
    fontFamily:"Medium", 
    lineHeight:Math.round(16*1.5)
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
    fontFamily:"Medium"
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
