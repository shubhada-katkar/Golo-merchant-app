import React, { useState, useContext } from "react";
import { View, TouchableOpacity, Text, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import { Dimensions } from "react-native";
import { Entypo, Feather } from "@expo/vector-icons";
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
  const [visibleConfirmPass, setVisibleConfirmPass] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Set a new password for your account</Text>
        </View>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!visiblepass}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setVisiblepass((prev) => !prev)}
          >
            <Entypo name={visiblepass ? "eye" : "eye-with-line"} size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!visibleConfirmPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setVisibleConfirmPass((prev) => !prev)}
          >
            <Entypo name={visibleConfirmPass ? "eye" : "eye-with-line"} size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handlePasswordReset}
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Resetting..." : "Reset Password"}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login", { email: email.trim().toLowerCase() })}
          >
            <Text style={styles.registerLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
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
  button: {
    backgroundColor: "#157a4f",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    width: CONTENT_WIDTH,
    marginTop: 8,
  },
  buttonText: {
    ...textPresets.subtitle,
    color: "#ffffff",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerLink: {
    ...textPresets.body,
    color: "#157a4f",
  },
});