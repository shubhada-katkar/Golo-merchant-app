import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView,
  Platform, Modal, ActivityIndicator, FlatList, Dimensions, Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { searchLocations, reverseGeocode } from "../app/services/leafletService";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";
import { uploadImageToCloudinary } from "../services/cloudinaryService";

const STORE_CATEGORIES = [
  "Food & Restaurants",
  "Home Services",
  "Beauty & Wellness",
  "Healthcare & Medical",
  "Hotels & Accommodation",
  "Shopping & Retail",
  "Education & Training",
  "Real Estate",
  "Events & Entertainment",
  "Professional Services",
  "Automotive Services",
  "Home Improvement",
  "Fitness & Sports",
  "Daily Needs & Utilities",
  "Local Businesses & Vendors",
];

const STORE_SUBCATEGORIES = {
  "Food & Restaurants": ["Restaurants", "Cafes", "Bakeries", "Fast Food", "Cloud Kitchen"],
  "Home Services": ["Cleaning", "Plumbing", "Electrical", "Appliance Repair", "Pest Control"],
  "Beauty & Wellness": ["Salon", "Spa", "Skincare", "Haircare", "Makeup Services"],
  "Healthcare & Medical": ["Clinics", "Pharmacy", "Diagnostics", "Dental Care", "Physiotherapy"],
  "Hotels & Accommodation": ["Hotels", "Resorts", "Guest House", "Homestay", "Hostels"],
  "Shopping & Retail": ["Clothing", "Footwear", "Grocery", "Jewelry", "Accessories"],
  "Education & Training": ["Coaching", "Tuition", "Language Classes", "Computer Training", "Skill Development"],
  "Real Estate": ["Residential", "Commercial", "Rentals", "Property Consultants", "Property Management"],
  "Events & Entertainment": ["Event Planning", "Photography", "Catering", "Music & DJ", "Decorations"],
  "Professional Services": ["Legal", "Accounting", "Consulting", "Marketing", "IT Services"],
  "Automotive Services": ["Car Service", "Bike Service", "Car Wash", "Tyre Shop", "Accessories"],
  "Home Improvement": ["Interior Design", "Furniture", "Paint Services", "Carpentry", "Renovation"],
  "Fitness & Sports": ["Gym", "Yoga", "Personal Training", "Sports Coaching", "Nutrition"],
  "Daily Needs & Utilities": ["Laundry", "Water Supply", "Gas Services", "Stationery", "Household Supplies"],
  "Local Businesses & Vendors": ["General Store", "Wholesaler", "Local Vendor", "Handicrafts", "Other Services"],
};

export default function ProfileSettingsPage({ navigation }) {

  const { colors } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [storeSubCategory, setStoreSubCategory] = useState("");
  const [merchantImage, setMerchantImage] = useState(null);
  const [merchantImageError, setMerchantImageError] = useState(false);
  const [storeImage, setStoreImage] = useState(null);
  const [storeImageError, setStoreImageError] = useState(false);
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
  const subCategoryOptions = React.useMemo(
    () => STORE_SUBCATEGORIES[storeCategory] || [],
    [storeCategory],
  );

  const DEFAULT_REGION = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  const loadStoreLocation = useCallback(async () => {
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (_authErr) { return; }
      if (!token) return;

      const locationRes = await fetch(`${BASE_URL}/merchant/store-location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (locationRes.status === 401) { await handleAuthError(navigation); return; }
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
    if (!value) return null;

    if (typeof value === "object") {
      const candidates = [
        value.secure_url,
        value.url,
        value.imageUrl,
        value.photo,
        value.profilePhoto,
        value.shopPhoto,
        value.uri,
        value.path,
      ];
      for (const candidate of candidates) {
        const normalized = normalizeImageUrl(candidate);
        if (normalized) return normalized;
      }
      return null;
    }

    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("data:") || trimmed.startsWith("base64,")) {
      return trimmed;
    }

    if (trimmed.startsWith("//")) return `https:${trimmed}`;

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `${BASE_URL.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
  };

  const getLeafletMapHtml = (latitude, longitude, locked = false) => {
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
      ${locked ? `.leaflet-container { pointer-events: none; }` : ``}
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${safeLatitude};
      const lng = ${safeLongitude};
      const locked = ${locked ? "true" : "false"};
      const map = L.map('map', {
        dragging: !locked,
        touchZoom: !locked,
        scrollWheelZoom: !locked,
        doubleClickZoom: !locked,
        boxZoom: !locked,
        keyboard: !locked,
        tap: !locked,
      }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      const marker = L.marker([lat, lng], { draggable: !locked }).addTo(map);
      function sendLocation(latitude, longitude) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationChanged',
          latitude,
          longitude,
        }));
      }
      if (!locked) {
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          sendLocation(position.lat, position.lng);
        });
        map.on('click', (event) => {
          marker.setLatLng(event.latlng);
          sendLocation(event.latlng.lat, event.latlng.lng);
        });
      }
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
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch merchant profile
      const userProfilePromise = fetch(`${BASE_URL}/users/profile`, { headers });
      let merchantRes = await fetch(`${BASE_URL}/users/merchant/profile`, { headers });
      if (!merchantRes.ok && merchantRes.status === 404) {
        merchantRes = await fetch(`${BASE_URL}/merchant/profile`, { headers });
      }

      const merchantJson = merchantRes.ok ? await merchantRes.json() : null;
      const userProfileRes = await userProfilePromise;
      const userProfileJson = userProfileRes.ok ? await userProfileRes.json() : null;

      // Backend returns { success: true, data: { merchant_object } }
      const merchantData = merchantJson?.data || null;
      const userProfileData = userProfileJson?.data || null;

      if (!merchantData) {
        console.log("No merchant data found");
        return;
      }

      // Extract fields from merchant object using backend field names
      const mergedName = userProfileData?.name || merchantData?.merchantName || merchantData?.name || "";
      const mergedShopName = merchantData?.storeName || "";
      const mergedEmail = merchantData?.storeEmail || merchantData?.email || "";
      const mergedNumber = merchantData?.contactNumber || merchantData?.phone || "";
      const mergedCategory = merchantData?.storeCategory || userProfileData?.merchantProfile?.storeCategory || "";
      const mergedSubCategory = merchantData?.storeSubCategory || userProfileData?.merchantProfile?.storeSubCategory || "";
      const mergedMerchantImage =
        merchantData?.profilePhoto ||
        merchantData?.image ||
        merchantData?.profilePhotoUrl ||
        merchantData?.photo ||
        userProfileData?.merchantProfile?.profilePhoto ||
        userProfileData?.profilePhoto ||
        null;
      const mergedStoreImage =
        merchantData?.shopPhoto ||
        merchantData?.storePhoto ||
        userProfileData?.merchantProfile?.shopPhoto ||
        userProfileData?.merchantProfile?.storePhoto ||
        null;
      const mergedStoreAddress = merchantData?.storeLocation || merchantData?.address || "";
      const mergedLatitude = merchantData?.storeLocationLatitude ?? merchantData?.latitude ?? null;
      const mergedLongitude = merchantData?.storeLocationLongitude ?? merchantData?.longitude ?? null;

      console.log("Loaded merchant profile:", {
        mergedName,
        mergedShopName,
        mergedEmail,
        mergedNumber,
        mergedCategory,
        mergedSubCategory,
        hasMerchantImage: !!mergedMerchantImage,
        hasStoreImage: !!mergedStoreImage,
        mergedStoreAddress,
        mergedLatitude,
        mergedLongitude,
      });
      console.log("Merged merchant image:", mergedMerchantImage);
      console.log("Merged store image:", mergedStoreImage);

      setName(mergedName);
      setEmail(mergedEmail);
      setNumber(mergedNumber);
      setShopName(mergedShopName);
      setStoreCategory(mergedCategory);
      setStoreSubCategory(mergedSubCategory);
      setStoreAddress(mergedStoreAddress);
      setStoreLatitude(mergedLatitude);
      setStoreLongitude(mergedLongitude);

      // Set images with proper normalization
      if (mergedMerchantImage) {
        const normalizedMerchantImage = normalizeImageUrl(mergedMerchantImage);
        if (normalizedMerchantImage) {
          setMerchantImage(normalizedMerchantImage);
          setMerchantImageError(false);
        } else {
          setMerchantImage(null);
        }
      } else {
        setMerchantImage(null);
      }

      if (mergedStoreImage) {
        const normalizedStoreImage = normalizeImageUrl(mergedStoreImage);
        if (normalizedStoreImage) {
          setStoreImage(normalizedStoreImage);
          setStoreImageError(false);
        } else {
          setStoreImage(null);
        }
      } else {
        setStoreImage(null);
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
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
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
  const pickMerchantImage = async () => {
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
      setMerchantImage(uri);
      setMerchantImageError(false);
      await uploadImageForField(uri, "profilePhoto");
    }
  };

  const pickStoreImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setStoreImage(uri);
      setStoreImageError(false);
      await uploadImageForField(uri, "shopPhoto");
    }
  };

  // ================= SAVE PROFILE =================
  const saveProfile = async () => {
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) return alert("Not authenticated");

      const [merchantRes, userRes] = await Promise.all([
        fetch(`${BASE_URL}/merchant/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            storeName: shopName,
            contactNumber: number,
            storeCategory,
            storeSubCategory,
          }),
        }),
        fetch(`${BASE_URL}/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
          }),
        }),
      ]);

      const merchantData = await merchantRes.json();
      const userData = await userRes.json();

      if (merchantRes.ok && userRes.ok) {
        await loadProfile();
        alert("Profile updated successfully");
      } else {
        alert(merchantData.message || userData.message || "Update failed");
      }
    } catch (error) {
      console.log("Error updating profile:", error);
      alert("Server Error");
    }
  };

  const uploadImageForField = async (imageUri, fieldName) => {
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) return alert("Not authenticated");

      const uploadResult = await uploadImageToCloudinary(imageUri, "golo/profile-photos");
      if (!uploadResult.success) {
        return alert(uploadResult.message || "Image upload failed");
      }

      const payload = {};
      payload[fieldName] = uploadResult.url;

      let res = await fetch(`${BASE_URL}/merchant/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Image upload error:", data);
        return alert(data.message || "Image upload failed");
      }

      const uploadedImageUrl = data?.data?.[fieldName] || data?.[fieldName] || uploadResult.url;
      const normalizedImage = normalizeImageUrl(uploadedImageUrl);

      if (fieldName === "profilePhoto") {
        setMerchantImage(normalizedImage || imageUri);
        setMerchantImageError(false);
      } else if (fieldName === "shopPhoto") {
        setStoreImage(normalizedImage || imageUri);
        setStoreImageError(false);
      }

      await loadProfile();
      alert(`${fieldName === "profilePhoto" ? "Merchant" : "Store"} image updated`);
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
        <LinearGradient
          colors={["#f8a812", "#fad081", "#f8f6f265"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
        />
        <Topbar />

        {/* HEADER */}
        <View style={styles.row1}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={22}
              color={colors.text} style={{ padding: 10 }}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Profile Settings</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">

          {/* BANNER + PROFILE IMAGES */}
          <View style={styles.bannerContainer}>
            {/* Store/Banner Image */}
            <TouchableOpacity onPress={pickStoreImage}>
              <View style={{ position: "relative" }}>
                <Image
                  source={
                    !storeImage || storeImageError
                      ? require("../assets/profile.png")
                      : { uri: storeImage }
                  }
                  style={styles.storeImage}
                />
                <View style={styles.storeCameraIcon}>
                  <MaterialIcons name="camera-alt" size={16} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Profile Image Overlapping Banner */}
            <TouchableOpacity
              onPress={pickMerchantImage}
              style={styles.profileImageWrap}
            >
              <Image
                source={
                  !merchantImage || merchantImageError
                    ? require("../assets/profile.png")
                    : { uri: merchantImage }
                }
                style={styles.profileImage}
              />

              <View style={styles.cameraIcon}>
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* PERSONAL INFORMATION CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <MaterialIcons name="person" size={20} color="#157a4f" />
              <Text style={styles.cardHeaderText}>PERSONAL INFORMATION</Text>
            </View>

            <Text style={styles.fieldLabel}>YOUR NAME / COMPANY NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              placeholder="Enter name"
              placeholderTextColor="#999"
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>CONTACT NUMBER</Text>
            <TextInput
              style={styles.input}
              value={number}
              keyboardType="numeric"
              placeholder="Enter number"
              placeholderTextColor="#999"
              onChangeText={setNumber}
            />

            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.lockedInputWrap}>
              <TextInput
                style={[styles.input, styles.lockedInput]}
                value={email}
                placeholder="Enter email"
                placeholderTextColor="#999"
                editable={false}
                selectTextOnFocus={false}
              />
              <MaterialIcons
                name="lock"
                size={16}
                color="#9a9a9a"
                style={styles.lockedInputIcon}
              />
            </View>
          </View>

          {/* STORE SPECIFICATIONS CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <MaterialIcons name="store" size={20} color="#157a4f" />
              <Text style={styles.cardHeaderText}>STORE SPECIFICATIONS</Text>
            </View>

            <Text style={styles.fieldLabel}>BUSINESS NAME</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Store Name"
              placeholderTextColor="#999"
            />

            <Text style={styles.fieldLabel}>STORE CATEGORY</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={storeCategory}
                onValueChange={(value) => {
                  setStoreCategory(value);
                  setStoreSubCategory("");
                }}
                style={styles.picker}
              >
                <Picker.Item
                  label="Select store category"
                  value=""
                  style={styles.pickerItem}
                />
                {STORE_CATEGORIES.map((category) => (
                  <Picker.Item
                    key={category}
                    label={category}
                    value={category}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>STORE SUB-CATEGORY</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={storeSubCategory}
                onValueChange={(value) => setStoreSubCategory(value)}
                style={styles.picker}
                enabled={!!storeCategory} >
                <Picker.Item
                  label={storeCategory ? "Select store sub-category" : "Select store category first"}
                  value=""
                  style={styles.pickerItem} />
                {subCategoryOptions.map((subCategory) => (
                  <Picker.Item
                    key={subCategory}
                    label={subCategory}
                    value={subCategory}
                    style={styles.pickerItem} />
                ))}
              </Picker>
            </View>
            {loadingProfile ? (
              <Text style={{ marginTop: 8, color: colors.text }}>Refreshing profile...</Text>
            ) : null}
          </View>

          {/* STORE LOCATION */}
          <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Store Location</Text>
            <View style={[styles.locationCard, { borderColor: colors.divider }]}>
              <View style={styles.locationPreviewMapContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: getLeafletMapHtml(
                      storeLatitude ?? DEFAULT_REGION.latitude,
                      storeLongitude ?? DEFAULT_REGION.longitude,
                      true
                    ),
                  }}
                  style={styles.locationPreviewMap}
                  scrollEnabled={false}
                  pointerEvents="none" />
              </View>
            </View>

            <TouchableOpacity style={styles.locationeditbox} onPress={openLocationModal}>
              <Text style={[styles.locationPreviewText, { color: colors.text }]} numberOfLines={2}>
                {storeAddress || "Tap to set your store location on map"}
              </Text>
              <Text style={[styles.locationPreviewAction, { color: colors.text }]}>Tap to edit location</Text>
            </TouchableOpacity>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.updateButton} onPress={saveProfile}>
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="cancel" size={18} color="#fff" />
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={locationModalVisible} animationType="slide">
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Store Location</Text>
                <TouchableOpacity onPress={closeLocationModal} style={styles.modalCloseButton}>
                  <Text style={{ ...textPresets.label, color: "#d32b2b" }}>Cancel</Text>
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
                  )} />
              )}

              <View style={[styles.modalMapContainer, { borderColor: colors.divider }]}>
                <WebView
                  ref={webviewRef}
                  originWhitelist={['*']}
                  source={{
                    html: getLeafletMapHtml(
                      tempLocation.latitude ?? DEFAULT_REGION.latitude,
                      tempLocation.longitude ?? DEFAULT_REGION.longitude),
                  }}
                  style={styles.modalMap}
                  scrollEnabled={false}
                  onMessage={handleWebViewMessage} />
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
  title: { ...textPresets.title },


  bannerContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 70, // space for overlap
  },

  storeImage: {
    width: "100%",
    height: 170,
  },

  profileImageWrap: {
    position: "absolute",
    left: 16,
    bottom: -50, // pushes circle outside banner
    zIndex: 10,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
  },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#949494",
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  storeCameraIcon: {
    position: "absolute",
    bottom: -16,
    right: 14,
    backgroundColor: "#949494",
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardHeaderText: {
    color: "#157a4f",
    letterSpacing: 0.5,
    ...textPresets.body,
    lineHeight: Math.round(textPresets.body.fontSize * 1.4),
  },
  fieldLabel: {
    color: "#8a8a8a",
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.4,
    ...textPresets.label,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 10,
    ...textPresets.body,
  },
  lockedInputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  lockedInput: {
    backgroundColor: "#e9e9e9",
    color: "#8a8a8a",
    paddingRight: 34,
  },
  lockedInputIcon: {
    position: "absolute",
    right: 10,
  },
  pickerWrap: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: { height: 50, width: "100%" },
  pickerItem: {
    ...textPresets.body,
  },

  sectionLabel: {
    ...textPresets.body,
    marginBottom: 8,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 160,
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
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 10,
  },
  locationPreviewText: {
    ...textPresets.label,
  },
  locationPreviewAction: {
    marginTop: 4,
    ...textPresets.label,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  updateButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#157a4f",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  updateButtonText: { ...textPresets.body, color: "#fff", lineHeight: Math.round(textPresets.body.fontSize * 1.5) },
  discardButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#d32b2b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  discardButtonText: { ...textPresets.body, color: "#fff", lineHeight: Math.round(textPresets.body.fontSize * 1.5) },

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
    ...textPresets.subtitle,
  },
  modalCloseButton: {
    padding: 10,
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
    ...textPresets.body,
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
  searchResultText: { ...textPresets.body },
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
    marginBottom: 16,
    ...textPresets.label,
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
    ...textPresets.body,
  },
});