import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { searchLocations, reverseGeocode } from "../app/services/leafletService";

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
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [storeAddress, setStoreAddress] = useState("");
  const [storeLatitude, setStoreLatitude] = useState(null);
  const [storeLongitude, setStoreLongitude] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState({ latitude: null, longitude: null, address: "" });
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const webviewRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const DEFAULT_REGION = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  const loadStoreLocation = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const locationRes = await fetch(`${BASE_URL}/merchant/store-location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!locationRes.ok) return;
      const locationJson = await locationRes.json();
      const locationData = locationJson?.data || locationJson || null;

      if (!locationData) return;
      setStoreAddress(locationData.address || locationData.storeLocation || "");
      setStoreLatitude(locationData.latitude ?? null);
      setStoreLongitude(locationData.longitude ?? null);
    } catch (error) {
      console.log("Error fetching store location:", error);
    }
  }, []);

  const normalizeImageUrl = (value) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Handle data URLs and base64 strings
    if (trimmed.startsWith("data:") || trimmed.startsWith("base64,")) {
      return trimmed;
    }
    
    // Handle protocol-relative URLs
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    
    // Handle regular URLs - don't encode if it's already a valid URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    
    // For other cases, assume it's a relative path
    return trimmed;
  };

  const getLeafletMapHtml = (latitude, longitude) => {
    const safeLatitude = typeof latitude === "number" ? latitude : DEFAULT_REGION.latitude;
    const safeLongitude = typeof longitude === "number" ? longitude : DEFAULT_REGION.longitude;

    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .leaflet-container { touch-action: none; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${safeLatitude};
      const lng = ${safeLongitude};
      const map = L.map('map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      function sendLocation(latitude, longitude) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationChanged',
          latitude,
          longitude,
        }));
      }
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        sendLocation(position.lat, position.lng);
      });
      map.on('click', (event) => {
        marker.setLatLng(event.latlng);
        sendLocation(event.latlng.lat, event.latlng.lng);
      });
      function handleNativeMessage(event) {
        try {
          const data = JSON.parse(event.data || event);
          if (data.type === 'setLocation' && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            marker.setLatLng([data.latitude, data.longitude]);
            map.setView([data.latitude, data.longitude], 15);
          }
        } catch (error) {
          // ignore invalid messages
        }
      }
      document.addEventListener('message', handleNativeMessage);
      window.addEventListener('message', handleNativeMessage);
    </script>
  </body>
</html>`;
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch merchant profile
      let merchantRes = await fetch(`${BASE_URL}/users/merchant/profile`, { headers });
      if (!merchantRes.ok && merchantRes.status === 404) {
        merchantRes = await fetch(`${BASE_URL}/merchant/profile`, { headers });
      }

      const merchantJson = merchantRes.ok ? await merchantRes.json() : null;
      
      // Backend returns { success: true, data: { merchant_object } }
      const merchantData = merchantJson?.data || null;

      if (!merchantData) {
        console.log("No merchant data found");
        return;
      }

      // Extract fields from merchant object using backend field names
      const mergedName = merchantData?.storeName || merchantData?.name || "";
      const mergedEmail = merchantData?.storeEmail || merchantData?.email || "";
      const mergedNumber = merchantData?.contactNumber || merchantData?.phone || "";
      const mergedImage = merchantData?.profilePhoto || null;
      const mergedStoreAddress = merchantData?.storeLocation || merchantData?.address || "";
      const mergedLatitude = merchantData?.storeLocationLatitude ?? merchantData?.latitude ?? null;
      const mergedLongitude = merchantData?.storeLocationLongitude ?? merchantData?.longitude ?? null;

      console.log("Loaded merchant profile:", { mergedName, mergedEmail, mergedNumber, hasImage: !!mergedImage, mergedStoreAddress, mergedLatitude, mergedLongitude });
      console.log("Raw profile image:", mergedImage);

      setName(mergedName);
      setEmail(mergedEmail);
      setNumber(mergedNumber);
      setShopName(mergedName); // Use merchant name for shop name field
      setStoreAddress(mergedStoreAddress);
      setStoreLatitude(mergedLatitude);
      setStoreLongitude(mergedLongitude);
      
      // Set profile image with proper normalization
      if (mergedImage) {
        const normalizedImage = normalizeImageUrl(mergedImage);
        console.log("Normalized image URL:", normalizedImage);
        setProfileImage(normalizedImage);
      }

      if (mergedLatitude === null || mergedLongitude === null) {
        await loadStoreLocation();
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const openLocationModal = () => {
    setTempLocation({
      latitude: storeLatitude,
      longitude: storeLongitude,
      address: storeAddress || "",
    });
    setLocationSearchQuery("");
    setLocationSearchResults([]);
    setLocationError("");
    setLocationModalVisible(true);
  };

  const closeLocationModal = () => {
    setLocationModalVisible(false);
    setLocationSearchQuery("");
    setLocationSearchResults([]);
  };

  const updateTempLocationFromCoords = async (latitude, longitude) => {
    if (latitude == null || longitude == null) return;

    setTempLocation({
      latitude,
      longitude,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    });

    try {
      const details = await reverseGeocode(longitude, latitude);
      if (details?.address) {
        setTempLocation({
          latitude,
          longitude,
          address: details.address,
        });
        setLocationSearchQuery(details.address);
      }
    } catch (error) {
      console.log("Location reverse geocode failed:", error);
    }
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === "locationChanged" && data.latitude != null && data.longitude != null) {
        await updateTempLocationFromCoords(data.latitude, data.longitude);
      }
    } catch (error) {
      console.log("WebView message failed:", error);
    }
  };

  const performLocationSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setLocationSearchResults([]);
      return;
    }
    setSearchingLocation(true);
    try {
      const results = await searchLocations(query, {
        proximity: {
          lat: storeLatitude ?? DEFAULT_REGION.latitude,
          lng: storeLongitude ?? DEFAULT_REGION.longitude,
        },
      });
      setLocationSearchResults(results || []);
    } catch (error) {
      console.log("Search locations failed:", error);
      setLocationSearchResults([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleLocationSearchChange = (text) => {
    setLocationSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (text.trim().length < 3) {
      setLocationSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      performLocationSearch(text.trim());
    }, 400);
  };

  const selectSearchResult = (location) => {
    const latitude = location?.coordinates?.lat;
    const longitude = location?.coordinates?.lng;
    if (latitude == null || longitude == null) return;

    const address = location.displayName || location.address || location.name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    setTempLocation({ latitude, longitude, address });
    setLocationSearchQuery(address);
    setLocationSearchResults([]);
    Keyboard.dismiss();
  };

  const saveStoreLocation = async () => {
    if (!tempLocation.latitude || !tempLocation.longitude) {
      return alert("Please select a location on the map or search for one.");
    }

    setSavingLocation(true);
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) {
        setSavingLocation(false);
        return alert("Not authenticated");
      }

      const res = await fetch(`${BASE_URL}/merchant/store-location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: tempLocation.address || `${tempLocation.latitude.toFixed(6)}, ${tempLocation.longitude.toFixed(6)}`,
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
        }),
      });

      const data = await res.json();
      setSavingLocation(false);

      if (!res.ok) {
        console.log("Store location save failed:", data);
        return alert(data.message || "Unable to save store location");
      }

      const updated = data?.data || {};
      setStoreAddress(updated.address || tempLocation.address || "");
      setStoreLatitude(updated.latitude ?? tempLocation.latitude);
      setStoreLongitude(updated.longitude ?? tempLocation.longitude);
      alert("Store location updated successfully");
      closeLocationModal();
      await loadStoreLocation();
    } catch (error) {
      console.log("Store location save error:", error);
      setSavingLocation(false);
      alert("Server error while saving location");
    }
  };

  useEffect(() => {
    if (!locationModalVisible) return;
    setLocationSearchResults([]);
  }, [locationModalVisible]);

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

      // Send OTP to email
      let otpRes = await fetch(`${BASE_URL}/users/send-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      if (!otpRes.ok) {
        setLoadingPass(false);
        return alert("Failed to send OTP. Please try again.");
      }

      // For now, use the OTP endpoint with a placeholder
      // In production, you should show an OTP input dialog
      let res = await fetch(`${BASE_URL}/users/change-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword, otp: "000000" })
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
      console.log("Password reset error:", error);
      setLoadingPass(false);
      alert("Server error");
    }
  };

  // ================= LOAD MERCHANT PROFILE =================
  useEffect(() => {
    loadProfile();
    loadStoreLocation();
  }, [loadProfile, loadStoreLocation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadStoreLocation();
    }, [loadProfile, loadStoreLocation])
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

      let res = await fetch(`${BASE_URL}/merchant/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName: name,
          storeEmail: email,
          contactNumber: number,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await loadProfile();
        alert("Profile updated successfully");
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.log("Error updating profile:", error);
      alert("Server Error");
    }
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return alert("Not authenticated");

      const formData = new FormData();
      formData.append("profilePhoto", {
        uri: imageUri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      let res = await fetch(`${BASE_URL}/merchant/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Image upload error:", data);
        return alert(data.message || "Image upload failed");
      }

      // Backend returns { success: true, data: { merchant_object } }
      const uploadedImageUrl = data?.data?.profilePhoto || null;
      console.log("Profile photo updated, URL:", uploadedImageUrl);
      
      if (uploadedImageUrl) {
        const normalizedImage = normalizeImageUrl(uploadedImageUrl);
        console.log("Normalized uploaded image:", normalizedImage);
        setProfileImage(normalizedImage);
      }
      
      await loadProfile();
      alert("Profile image updated");

    } catch (error) {
      console.log("Image upload error:", error);
      alert("Server error");
    }
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

          <View style={{ paddingHorizontal: 14, marginTop: 20 }}>
            <Text style={[styles.text, { color: colors.text }]}>Store Location</Text>
            <View style={[styles.locationCard, { borderColor: colors.divider }]}>              
              <View style={styles.locationPreviewMapContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: getLeafletMapHtml(
                      storeLatitude ?? DEFAULT_REGION.latitude,
                      storeLongitude ?? DEFAULT_REGION.longitude
                    ),
                  }}
                  style={styles.locationPreviewMap}
                  scrollEnabled={false}
                />
              </View>
            </View>
          </View>

              <TouchableOpacity style={styles.locationeditbox} onPress={openLocationModal}>
                <Text style={[styles.locationPreviewText, { color: colors.text }]} numberOfLines={2}>
                  {storeAddress || "Tap to set your store location on map"}
                </Text>
                <Text style={[styles.locationPreviewAction, { color: colors.text }]}>Tap to edit location</Text>
              </TouchableOpacity>


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

          <Modal visible={locationModalVisible} animationType="slide">
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Store Location</Text>
                <TouchableOpacity onPress={closeLocationModal} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.searchContainer, { borderColor: colors.divider, backgroundColor: colors.background }]}>                
                <TextInput
                  style={[styles.searchInput, { color: colors.text, borderColor: colors.divider }]}
                  value={locationSearchQuery}
                  placeholder="Search for location"
                  placeholderTextColor="#888"
                  onChangeText={handleLocationSearchChange}
                />
                {searchingLocation && <ActivityIndicator size="small" color="#157a4f" style={{ marginLeft: 8 }} />}
              </View>

              {locationSearchResults.length > 0 && (
                <FlatList
                  data={locationSearchResults}
                  keyExtractor={(item) => item.id?.toString() || item.displayName || item.name || Math.random().toString()}
                  style={styles.searchResults}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.searchResultItem, { borderColor: colors.divider }]} onPress={() => selectSearchResult(item)}>
                      <Text style={[styles.searchResultText, { color: colors.text }]}>{item.displayName || item.address || item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              <View style={[styles.modalMapContainer, { borderColor: colors.divider }]}>                
                <WebView
                  ref={webviewRef}
                  originWhitelist={['*']}
                  source={{
                    html: getLeafletMapHtml(
                      tempLocation.latitude ?? DEFAULT_REGION.latitude,
                      tempLocation.longitude ?? DEFAULT_REGION.longitude
                    ),
                  }}
                  style={styles.modalMap}
                  scrollEnabled={false}
                  onMessage={handleWebViewMessage}
                />
              </View>

              <Text style={[styles.modalNote, { color: colors.text }]} numberOfLines={2}>
                {tempLocation.address || "Tap the map or search to set the store location."}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveStoreLocation} disabled={savingLocation}>
                  {savingLocation ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Save Location</Text>}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

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
  locationCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    minHeight: 180,
  },
  locationPreviewMapContainer: {
    width: "100%",
    height: 160,
    overflow: "hidden",
  },
  locationPreviewMap: {
    width: "100%",
    height: 160,
  },
  locationeditbox: {
    padding: 12,
    backgroundColor: "#dad8d8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6b6a6a",
    marginHorizontal: 14,
    marginTop: 10,
  },
  locationPreviewText: {
    fontSize: 16,
    fontWeight: "600",
  },
  locationPreviewAction: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: 10,
  },
  modalCloseText: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 180,
    marginBottom: 12,
  },
  searchResultItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  searchResultText: {
    fontSize: 16,
  },
  modalMapContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  modalMap: {
    width: "100%",
    height: Dimensions.get("window").height * 0.42,
  },
  modalNote: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#157a4f",
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
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
