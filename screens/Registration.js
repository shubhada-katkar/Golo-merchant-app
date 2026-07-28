import React, { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { WebView } from "react-native-webview";
import { BASE_URL } from "../config";
import CustomAlertModal from "../components/CustomAlertModal";

const { width, height } = Dimensions.get("window");

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

export default function Registration({ navigation }) {
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [storeSubCategory, setStoreSubCategory] = useState("");
  const [storeLocation, setStoreLocation] = useState("");

  const [storeLocationLatitude, setStoreLocationLatitude] = useState(null);
  const [storeLocationLongitude, setStoreLocationLongitude] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);

  const [visiblePass, setVisiblePass] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    onClose: null,
  });

  const showAlert = (type, title, message, onClose = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onClose,
    });
  };

  const handleCloseAlert = () => {
    const cb = alertConfig.onClose;
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (typeof cb === "function") {
      cb();
    }
  };

  const subCategoryOptions = useMemo(
    () => STORE_SUBCATEGORIES[storeCategory] || [],
    [storeCategory],
  );

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const leafLetHtml = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .search-wrap {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      z-index: 1000;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      padding: 6px;
      display: flex;
      gap: 6px;
    }
    .search-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 14px;
      outline: none;
    }
    .search-btn {
      background: #157a4f;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="search-wrap">
    <input id="q" class="search-input" placeholder="Search address or area..." />
    <button class="search-btn" onclick="doSearch()">Search</button>
  </div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const defaultLat = ${storeLocationLatitude || 20.5937};
    const defaultLng = ${storeLocationLongitude || 78.9629};

    const map = L.map('map').setView([defaultLat, defaultLng], ${storeLocationLatitude ? 15 : 5});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    function sendLocation(lat, lng, addressName = "") {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "locationSelected",
          latitude: lat,
          longitude: lng,
          address: addressName
        }));
      }
    }

    marker.on('dragend', function (e) {
      const coord = e.target.getLatLng();
      reverseGeocode(coord.lat, coord.lng);
    });

    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    async function reverseGeocode(lat, lng) {
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${lat}&lon=\${lng}\`);
        const data = await res.json();
        const addressName = data.display_name || "";
        sendLocation(lat, lng, addressName);
      } catch (err) {
        sendLocation(lat, lng, "");
      }
    }

    async function doSearch() {
      const q = document.getElementById("q").value;
      if (!q || !q.trim()) return;

      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=jsonv2&q=\${encodeURIComponent(q)}\`);
        const results = await res.json();

        if (results && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          sendLocation(lat, lng, item.display_name || q);
        } else {
          alert("Location not found");
        }
      } catch (err) {
        alert("Search failed");
      }
    }
  </script>
</body>
</html>
`,
    [storeLocationLatitude, storeLocationLongitude],
  );

  const handleMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === "locationSelected") {
        setStoreLocationLatitude(data.latitude);
        setStoreLocationLongitude(data.longitude);
        if (data.address) {
          setStoreLocation(data.address);
        }
      }
    } catch (e) {
      // ignore JSON parse error
    }
  };

  const handleRegister = async () => {
    if (registerLoading) return;

    if (!BASE_URL) return showAlert("error", "Error", "API URL is not configured");
    if (!name.trim()) return showAlert("error", "Error", "Enter merchant name");
    if (!storeName.trim()) return showAlert("error", "Error", "Enter shop name");
    if (!email.trim() || !isValidEmail(email)) return showAlert("error", "Error", "Enter valid login email");
    if (!password || password.length < 6) return showAlert("error", "Error", "Password should be at least 6 characters");
    if (!storeLocation.trim()) return showAlert("error", "Error", "Select or enter store location");
    if (storeLocationLatitude === null || storeLocationLongitude === null) {
      return showAlert("error", "Error", "Please select your store on the map");
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      accountType: "merchant",
      storeName: storeName.trim(),
      storeEmail: email.trim().toLowerCase(),
      contactNumber: contactNumber.trim() || undefined,
      storeCategory: storeCategory || undefined,
      storeSubCategory: storeSubCategory.trim() || undefined,
      storeLocation: storeLocation.trim(),
      storeLocationLatitude,
      storeLocationLongitude,
    };

    try {
      setRegisterLoading(true);

      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        showAlert(
          "success",
          "Success",
          "Merchant registration successful",
          () => navigation.navigate("Login")
        );
      } else {
        showAlert("error", "Registration Failed", data?.message || "Registration failed");
      }
    } catch (error) {
      showAlert("error", "Server Error", "Server error. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
        <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
      </View>

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            <Text style={styles.title}>Merchant Registration</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Owner Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                placeholder="Enter owner name"
                onChangeText={setName}
              />

              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.input}
                value={storeName}
                placeholder="Enter shop name"
                onChangeText={setStoreName}
              />

              <Text style={styles.label}>Login Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                placeholder="Enter login email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={contactNumber}
                placeholder="Enter store contact number"
                keyboardType="phone-pad"
                onChangeText={setContactNumber}
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputPassword}>
                <TextInput
                  style={{
                    fontSize: 14, flex: 1,
                    fontFamily: "Medium"
                  }}
                  placeholder="Enter password"
                  secureTextEntry={!visiblePass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={{ padding: 12 }} onPress={() => setVisiblePass((v) => !v)}>
                  <Entypo name={visiblePass ? "eye" : "eye-with-line"} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Store Category</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={storeCategory}
                  onValueChange={(value) => {
                    setStoreCategory(value);
                    setStoreSubCategory("");
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select store category" value="" style={{
                    fontSize: 14, fontFamily: "Medium", lineHeight: Math.round(14 * 1.5)
                  }} />
                  {STORE_CATEGORIES.map((category) => (
                    <Picker.Item key={category} label={category} value={category}
                      style={{ fontSize: 14, fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) }} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Store Sub-category</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={storeSubCategory}
                  onValueChange={(value) => setStoreSubCategory(value)}
                  style={styles.picker}
                  enabled={!!storeCategory}
                >
                  <Picker.Item
                    label={storeCategory ? "Select store sub-category" : "Select store category first"}
                    value=""
                    style={{ fontSize: 14, fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) }}
                  />
                  {subCategoryOptions.map((subCategory) => (
                    <Picker.Item key={subCategory} label={subCategory} value={subCategory}
                      style={{ fontSize: 14, fontFamily: "Medium", lineHeight: Math.round(14 * 1.5) }} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Store Location</Text>
              <TextInput
                style={styles.input}
                value={storeLocation}
                placeholder="Pick on map or enter complete address"
                onChangeText={setStoreLocation}
              />

              <TouchableOpacity style={styles.mapBtn} onPress={() => setMapVisible(true)}>
                <Text style={styles.mapBtnText}>Open Map To Pick Store Location</Text>
              </TouchableOpacity>

              <Text style={styles.coordPreview}>
                {storeLocationLatitude !== null && storeLocationLongitude !== null
                  ? `Selected: ${storeLocationLatitude.toFixed(6)}, ${storeLocationLongitude.toFixed(6)}`
                  : "No map location selected yet"}
              </Text>

              <TouchableOpacity
                style={[styles.button, registerLoading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator color="white" />
                    <Text style={{ color: "white", fontSize: 16 }}>Please wait...</Text>
                  </View>
                ) : (
                  <Text style={{
                    color: "white", fontSize: 16,
                    fontFamily: "Medium", lineHeight: Math.round(16 * 1.5)
                  }}>Register</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>Have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ fontSize: 16, color: "#157a4f", fontFamily: "Medium", lineHeight: Math.round(16 * 1.5) }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={mapVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Tap on map to set store location</Text>
            <TouchableOpacity onPress={() => setMapVisible(false)}>
              <Text style={styles.mapClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ html: leafLetHtml }} onMessage={handleMapMessage} javaScriptEnabled />
        </SafeAreaView>
      </Modal>

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleCloseAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: width * 0.060,
    color: "#ffffff",
    fontFamily: "Medium",
    lineHeight: Math.round(width * 0.060 * 1.5),
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    width: Math.min(width * 0.9, 420),
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.03,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Medium",
    borderWidth: 1,
    borderColor: "#000000",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    backgroundColor: "#157a4f",
    marginTop: 18,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  mapBtn: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#157a4f",
    backgroundColor: "#e9f7f1",
  },
  mapBtnText: {
    color: "#157a4f",
    fontFamily: "Medium",
    fontSize: 14,
    lineHeight: Math.round(14 * 1.5),
  },
  coordPreview: {
    marginTop: 8,
    fontSize: 12,
    color: "#444",
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
  },
  inputPassword: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingLeft: 12,
    minHeight: 46,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000000",
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
    paddingVertical: 60,
  },
  mapHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  mapTitle: {
    fontSize: 15,
    fontFamily: "Medium",
    lineHeight: Math.round(15 * 1.5),
  },
  mapClose: {
    fontSize: 15,
    color: "#157a4f",
    fontFamily: "Medium",
    lineHeight: Math.round(15 * 1.5),
  },
});