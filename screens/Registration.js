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
      overflow: hidden;
      font-family: Arial, sans-serif;
    }
    .search-row {
      display: flex;
      border-bottom: 1px solid #e5e5e5;
    }
    #searchInput {
      flex: 1;
      border: 0;
      outline: none;
      padding: 12px;
      font-size: 14px;
    }
    #searchBtn {
      border: 0;
      background: #157a4f;
      color: #fff;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 700;
    }
    #results {
      max-height: 160px;
      overflow-y: auto;
    }
    .result-item {
      padding: 10px 12px;
      font-size: 13px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <div class="search-wrap">
    <div class="search-row">
      <input id="searchInput" placeholder="Search location" />
      <button id="searchBtn">Search</button>
    </div>
    <div id="results"></div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    function emit(lat, lng, address) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng, address: address || "" }));
      }
    }

    function placeMarker(lat, lng, address) {
      const latlng = L.latLng(lat, lng);
      if (marker) {
        marker.setLatLng(latlng);
      } else {
        marker = L.marker(latlng).addTo(map);
      }
      map.setView(latlng, 16);
      emit(lat, lng, address);
    }

    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng, "");
    });

    async function searchLocation() {
      const input = document.getElementById('searchInput');
      const query = (input.value || '').trim();
      const results = document.getElementById('results');
      results.innerHTML = '';
      if (!query) return;

      try {
        const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&q=' + encodeURIComponent(query);
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          results.innerHTML = '<div class="result-item">No locations found</div>';
          return;
        }

        data.slice(0, 6).forEach((item) => {
          const div = document.createElement('div');
          div.className = 'result-item';
          div.textContent = item.display_name;
          div.onclick = () => {
            placeMarker(Number(item.lat), Number(item.lon), item.display_name || "");
            results.innerHTML = '';
          };
          results.appendChild(div);
        });
      } catch (e) {
        results.innerHTML = '<div class="result-item">Search failed. Try again.</div>';
      }
    }

    document.getElementById('searchBtn').addEventListener('click', searchLocation);
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') searchLocation();
    });
  </script>
</body>
</html>`,
    [],
  );

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (data?.display_name) {
        setStoreLocation(data.display_name);
      }
    } catch (e) {
      // Keep manual address as fallback if reverse geocode fails.
    }
  };

  const handleMapMessage = async (event) => {
    try {
      const { lat, lng, address } = JSON.parse(event.nativeEvent.data);
      setStoreLocationLatitude(Number(lat));
      setStoreLocationLongitude(Number(lng));
      if (address && address.trim()) { setStoreLocation(address); } else { await reverseGeocode(lat, lng); }
    } catch (e) {
      // Ignore malformed messages from webview.
    }
  };

  const handleRegister = async () => {
    if (registerLoading) return;

    if (!BASE_URL) return alert("API URL is not configured");
    if (!name.trim()) return alert("Enter merchant name");
    if (!storeName.trim()) return alert("Enter shop name");
    if (!email.trim() || !isValidEmail(email)) return alert("Enter valid login email");
    if (!password || password.length < 6) return alert("Password should be at least 6 characters");
    if (!storeLocation.trim()) return alert("Select or enter store location");
    if (storeLocationLatitude === null || storeLocationLongitude === null) {
      return alert("Please select your store on the map");
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
        alert("Merchant registration successful");
        navigation.navigate("Login");
      } else {
        alert(data?.message || "Registration failed");
      }
    } catch (error) {
      alert("Server error. Please try again.");
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
                  style={{ fontSize: 16, flex: 1 }}
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
                    fontSize: 14, fontFamily:"Medium", lineHeight:Math.round(14 * 1.5)
                  }} />
                  {STORE_CATEGORIES.map((category) => (
                    <Picker.Item key={category} label={category} value={category} 
                    style={{fontSize: 14, fontFamily:"Medium", lineHeight:Math.round(14 * 1.5)}} />
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
                    style={{fontSize: 14, fontFamily:"Medium", lineHeight:Math.round(14 * 1.5)}} />
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
                  <Text style={{ color: "white", fontSize: 16,
                    fontFamily:"Medium", lineHeight:Math.round(16 * 1.5)
                   }}>Register</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              <Text style={{ fontSize: 16, fontFamily:"Medium", lineHeight:Math.round(16 * 1.5) }}>Have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={{ fontSize: 16, color: "#157a4f", fontFamily:"Medium", lineHeight:Math.round(16 * 1.5) }}>Login</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: width * 0.060,
    color: "#ffffff",
    fontFamily:"Medium",
    lineHeight:Math.round(width * 0.060 * 1.5),
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
    fontFamily:"Medium",
    lineHeight:Math.round(14 * 1.5),
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
    fontFamily:"Medium",
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
    fontFamily:"Medium",
    fontSize: 14,
    lineHeight:Math.round(14 * 1.5),
  },
  coordPreview: {
    marginTop: 8,
    fontSize: 12,
    color: "#444",
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
    fontFamily:"Medium",
    lineHeight:Math.round(15 * 1.5),
  },
  mapClose: {
    fontSize: 15,
    color: "#157a4f",
    fontFamily:"Medium",
    lineHeight:Math.round(15 * 1.5),
  },
});