import React, { useState, useContext } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

export default function ResetPassword({ navigation, route }) {
  const { colors } = useContext(ThemeContext);

  const initialEmail = route?.params?.email || "";
  const initialOtp = route?.params?.otp || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(initialOtp);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visiblepass, setVisiblepass] = useState(false);

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    return { message: text || "Request failed" };
  };

  const handlePasswordReset = async () => {
    if (!email.trim() || !otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert("Error", "Fill all fields");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      if (!BASE_URL) {
        Alert.alert("Configuration Error", "API URL is not configured");
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/users/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
        signal: controller.signal,
      });

      const data = await parseResponse(response);
      setLoading(false);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Unable to reset password");
        return;
      }

      Alert.alert("Success", "Password changed successfully. Please login with your new password.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login", { email: email.trim().toLowerCase() }),
        },
      ]);
    } catch (err) {
      setLoading(false);
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long to respond");
      } else {
        Alert.alert("Server Error", "Unable to reset password");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
      <View style={{ flex: 1, backgroundColor: "#ffffff" }} />

      <View style={styles.centerContainer}>
        <Text style={{ color: "#ffffff", ...textPresets.subtitle }}>
          Reset Password
        </Text>

        <View style={styles.card}>
          <Text style={styles.text}>New Password</Text>
          <View style={styles.inputpassword}>
            <TextInput
              style={{ ...textPresets.body }}
              placeholder="Enter new password"
              secureTextEntry={!visiblepass}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={{ padding: 14 }} onPress={() => setVisiblepass((prev) => !prev)}>
              <Entypo name={visiblepass ? "eye" : "eye-with-line"} size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.text}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry={!visiblepass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            onPress={handlePasswordReset}
            style={[styles.button, loading && { opacity: 0.6 }]}
            disabled={loading}
          >
            <Text style={{ color: "white", ...textPresets.subtitle }}>
              {loading ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login", { email: email.trim().toLowerCase() })}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    width: width * 0.85,
    minHeight: height * 0.5,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  text: {
    ...textPresets.body
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
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
  link: {
    color: "#4caf50",
    paddingHorizontal: 10,
    ...textPresets.body
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
    ...textPresets.body,
    lineHeight:Math.round(14 * 1.5)
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