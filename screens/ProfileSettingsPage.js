import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProfileSettingsPage({ navigation }) {

  const { colors } = useContext(ThemeContext);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [pass, setpass] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);

  const handleResetPassword = async () => {

    // Empty check
    if (!newPassword || !confirmPassword) {
      return alert("Please fill both password fields");
    }

    // Match check
    if (newPassword !== confirmPassword) {
      return alert("Passwords do not match");
    }

    // Length validation (recommended)
    if (newPassword.length < 6) {
      return alert("Password must be at least 6 characters");
    }

    try {

      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return alert("Not authenticated");

      setLoadingPass(true);

      const res = await fetch(`${BASE_URL}/api/merchant/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      setLoadingPass(false);

      if (!res.ok) {
        return alert(data.message || "Password update failed");
      }

      alert("Password updated successfully");

      // Reset UI
      setpass(false);
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      setLoadingPass(false);
      alert("Server error");
    }
  };

  // ================= LOAD MERCHANT PROFILE =================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("merchantToken");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/api/merchant/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.merchant) {
          setName(data.merchant.username);
          setEmail(data.merchant.email);
          setNumber(data.merchant.phone);
          setShopName(data.merchant.shopName);
          setProfileImage(data.merchant.image);
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
      }
    };

    loadProfile();
  }, []);

  // ================= IMAGE PICKER =================
  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ================= SAVE PROFILE =================
  const saveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return alert("Not authenticated");

      const res = await fetch(`${BASE_URL}/api/merchant/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: name,
          phone: number,
          email,
          shopName,
          image: profileImage
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully");
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.log("Error updating profile:", error);
      alert("Server Error");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled">

          <Topbar />

          {/* HEADER */}
          <View style={styles.row1}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name="arrow-back-ios"
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Profile Settings</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* IMAGE + SHOP NAME */}
          <View style={styles.row2}>
            <TouchableOpacity onPress={pickProfileImage}>
              <View style={{ position: "relative" }}>
                <Image
                  source={
                    profileImage
                      ? { uri: profileImage }
                      : require("../assets/profile.png")
                  }
                  style={styles.profileImage}
                />
                <View style={styles.cameraIcon}>
                  <MaterialIcons name="camera-alt" size={20} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Editable shop name */}
            <TextInput
              style={[styles.shopNameInput, { color: colors.text }]}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Shop Name"
              placeholderTextColor="#555"
            />
          </View>


          {/* INPUT FIELDS */}
          <View style={{ paddingHorizontal: 14 }}>

            <Text style={[styles.text, { color: colors.text }]}>Your Name / Company Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              placeholder="Enter name"
              placeholderTextColor="#555"
              onChangeText={setName}
            />

            <Text style={[styles.text, { color: colors.text }]}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={number}
              keyboardType="numeric"
              placeholder="Enter number"
              placeholderTextColor="#555"
              onChangeText={setNumber}
            />

            <Text style={[styles.text, { color: colors.text }]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              placeholder="Enter email"
              placeholderTextColor="#555"
              onChangeText={setEmail}
            />
          </View>

          {/* BUTTONS */}
          <View style={{ padding: 20, gap: 15 }}>
            <TouchableOpacity style={styles.button} onPress={saveProfile}>
              <Text style={{ fontSize: 18 }}>Save Details</Text>
            </TouchableOpacity>
          </View>

          {!pass ? (
            <View style={{ paddingHorizontal: 20, gap: 15 }}>
              <TouchableOpacity style={styles.button} onPress={() => setpass(true)}>
                <Text style={{ fontSize: 18 }}>Reset Password</Text>
              </TouchableOpacity>
            </View>) : (
            <>
              <View style={styles.passcard}>

                <Text style={styles.text}>Set Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={styles.text}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[styles.button, { marginTop: 20 }]}
                >

                  <Text style={{ fontSize: 18 }}>
                    {loadingPass ? "Updating..." : "Done"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setpass(false)}
                  style={[styles.button, { marginTop: 20 }]}
                >
                  <Text style={{ fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>

              </View>
            </>
          )
          }

        </ScrollView>

      </KeyboardAvoidingView>
      <Bottombar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: { flexDirection: "row", alignItems: "center", padding: 12 },
  title: { fontSize: 22, marginLeft: 6 },
  divider: { height: 1 },
  row2: { flexDirection: "row", alignItems: "center", padding: 14 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  text: { fontSize: 18, marginTop: 18 },
  input: {
    backgroundColor: "#dad8d8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6b6a6a",
    padding: 10,
    fontSize: 16
  },
  button: {
    backgroundColor: "#f5b849",
    borderRadius: 10,
    padding: 10,
    alignItems: "center"
  },
  shopNameInput: {
    fontSize: 26,
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#6b6a6a",
    paddingVertical: 2,
    minWidth: 140,
  },
  passcard: {
    padding: 16,
    backgroundColor: "#fffedd",
    margin: 16,
    borderRadius: 12,
    elevation: 2
  },
  cameraIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#000000",
    padding: 5,
    borderRadius: 20,
  }
});