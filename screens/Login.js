import React, { useState, useContext } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Entypo } from "@expo/vector-icons";

export default function Login({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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

      setLoading(true);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${BASE_URL}/api/merchant/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        }),
        signal: controller.signal
      });

      const data = await response.json();

      setLoading(false);

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }
      Alert.alert("Login Successful");

      // Token validation
      if (!data.token || !data.merchant || !data.merchant._id) {
        Alert.alert("Error", "Invalid server response");
        return;
      }
      
      // Save securely
      await AsyncStorage.multiSet([
        ["merchantToken", data.token],
        ["merchantData", JSON.stringify(data.merchant)],
        ["merchantId", data.merchant._id]
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

      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email,role:"merchant" })
      });

      const data = await res.json();

      setOtpLoading(false);

      if (!res.ok) {
        return Alert.alert("Error", data.message);
      }

      Alert.alert("Success", "OTP sent to email");

      setOtpSent(true);

      // ✅ START 2 MINUTE TIMER (120 seconds)
      setOtpCooldown(120);

      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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

      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, role:"merchant" })
      });

      const data = await res.json();

      setVerifyLoading(false);

      if (!res.ok) {
        return Alert.alert("Error", data.message);
      }

      Alert.alert("Success", "OTP Verified");

      navigation.replace("HomePage");

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

        <Text style={{ fontSize: width * 0.07, color: "#ffffff" }}>
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
                <TextInput style={{ fontSize: 16, flex: 1 }}
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
                <Text style={{ color: "white", fontSize: 18 }}>
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

                  <Text style={{ color: "white", fontSize: 18 }}>
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
                      <Text style={{ color: "white" }}>
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
              <Text style={{ fontSize: 18 }}>Don't Have An Account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Registration")}>
                <Text style={styles.link}>Register Here</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", flexDirection: "row", marginTop: 10 }}>
              <Text style={{ fontSize: 18 }}>Forgot Password?</Text>
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
  },

  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#000000"
  },

  otpInput: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    flex: 1,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#000000"
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
    fontSize: 18,
    color: "#4caf50",
    paddingHorizontal: 10
  },
  inputpassword: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingLeft: 12,
    height: 48,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000000"
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