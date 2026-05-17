import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";

export default function ProfileSettingsPage({ navigation }) {

  const { colors } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [pass, setpass] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const normalizeImageUrl = (value) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return encodeURI(trimmed);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      let userRes = await fetch(`${BASE_URL}/users/profile`, { headers });
      if (!userRes.ok && userRes.status === 404) {
        userRes = await fetch(`${BASE_URL}/api/user/profile`, { headers });
      }

      let merchantRes = await fetch(`${BASE_URL}/users/merchant/profile`, { headers });
      if (!merchantRes.ok && merchantRes.status === 404) {
        merchantRes = await fetch(`${BASE_URL}/api/merchant/profile`, { headers });
      }

      const userJson = userRes.ok ? await userRes.json() : null;
      const merchantJson = merchantRes.ok ? await merchantRes.json() : null;

      const userData = userJson?.data || userJson?.user || userJson || null;
      const merchantData =
        merchantJson?.data?.merchant ||
        merchantJson?.merchant ||
        merchantJson?.data ||
        merchantJson ||
        null;

      const mergedName =
        userData?.name ||
        userData?.username ||
        merchantData?.name ||
        merchantData?.username ||
        "";
      const mergedEmail =
        userData?.email ||
        merchantData?.storeEmail ||
        merchantData?.email ||
        "";
      const mergedNumber =
        merchantData?.contactNumber ||
        userData?.profile?.phone ||
        userData?.phone ||
        merchantData?.phone ||
        "";
      const mergedShop =
        merchantData?.storeName ||
        merchantData?.shopName ||
        merchantData?.businessName ||
        "";
      const mergedImage =
        merchantData?.profilePhoto ||
        userData?.profile?.avatar ||
        userData?.avatar ||
        merchantData?.image?.url ||
        merchantData?.profilePic?.url ||
        merchantData?.profilePic ||
        null;

      setName(mergedName);
      setEmail(mergedEmail);
      setNumber(mergedNumber);
      setShopName(mergedShop);
      setProfileImage((prev) => normalizeImageUrl(mergedImage) || prev);
    } catch (error) {
      console.log("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

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

      let res = await fetch(`${BASE_URL}/users/merchant/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/api/merchant/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      }

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
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

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
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await uploadProfileImage(uri); // ✅ pass fresh URI
    }
  };

  // ================= SAVE PROFILE =================
  const saveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return alert("Not authenticated");

      let res = await fetch(`${BASE_URL}/users/merchant/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: name,
          phone: number,
          email,
          shopName,
        }),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/api/merchant/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: name,
          phone: number,
          email,
          shopName,
        }),
      });
      }

      const data = await res.json();

      if (res.ok) {
        await loadProfile();
        alert("Profile updated successfully");
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      alert("Server Error");
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return alert("Not authenticated");

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      let res = await fetch(`${BASE_URL}/users/merchant/profile/image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/api/merchant/profile/image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      }

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message || "Image upload failed");
      }

      const uploadedImageUrl =
        data?.image?.url ||
        data?.data?.image?.url ||
        data?.profilePhoto ||
        data?.data?.profilePhoto ||
        null;
      setProfileImage((prev) => normalizeImageUrl(uploadedImageUrl) || prev);
      await loadProfile();
      alert("Profile image updated");

    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingLogout(true);

            const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");

            if (token) {
              // Try primary modern endpoint
              let res = await fetch(`${BASE_URL}/users/logout`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refreshToken: null }),
              });

              // Legacy fallback
              if (!res.ok && res.status === 404) {
                await fetch(`${BASE_URL}/api/merchant/logout`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ refreshToken: null }),
                });
              }
            }

            // Clear local storage keys used by this app
            await AsyncStorage.multiRemove([
              "merchantToken",
              "merchantData",
              "merchantId",
              "accessToken",
              "user",
              "refreshToken",
            ]);

            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (err) {
            Alert.alert("Logout failed", "Please try again");
          } finally {
            setLoadingLogout(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"} >

        <Topbar />

        {/* HEADER */}
        <View style={styles.row1}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={26}
              color={colors.text} style={{ padding: 10 }}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Profile Settings</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">

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
            {loadingProfile ? (
              <Text style={{ marginTop: 8, color: colors.text }}>Refreshing profile...</Text>
            ) : null}
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

                <View style={{flexDirection:"row",marginTop:14,gap:10}}>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[styles.button, { flex:1}]}
                >

                  <Text style={{ fontSize: 18 }}>
                    {loadingPass ? "Updating..." : "Done"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setpass(false)}
                  style={[styles.button, { flex:1}]}
                >
                  <Text style={{ fontSize: 18 }}>Cancel</Text>
                </TouchableOpacity>

                </View>
              </View>
            </>
          )}

            <View style={{ paddingHorizontal: 20, gap: 12, top:18 }}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff6b6b' }]}
              onPress={handleLogout}
              disabled={loadingLogout}
            >
              <Text style={{ fontSize: 18, color: '#fff' }}>
                {loadingLogout ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>

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
    paddingVertical: 8,
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
    right: 12,
    backgroundColor: "#949494",
    padding: 5,
    borderRadius: 20,
  }
});
