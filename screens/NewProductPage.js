import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NewProductPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const screenHeight = Dimensions.get("window").height;
  const bottomPadding = screenHeight * 0.10;
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const editProduct = route?.params?.product;
  const isEdit = !!editProduct;
  const categories = ["Travel", "Food", "Clothing", "Electronics", "Books"];
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoryInputY, setCategoryInputY] = useState(0);
  const [isSavingPublished, setIsSavingPublished] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [image, setImage] = useState(null);

  const initialForm = {
    price: "",
    productname: "",
    category: "",
    description: "",
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isEdit) {
      setForm({
        productname: editProduct.productname || "",
        category: editProduct.category || "",
        description: editProduct.description || "",
        price: String(editProduct.price || ""),
      });

      setImage(editProduct.image?.url || null);
    }
  }, []);

  const pickImage = async () => {
    const { status: permissionStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProduct = async (status) => {
    const isPublished = status === "published";

    if ((isPublished && isSavingPublished) || (!isPublished && isSavingDraft)) return;

    isPublished ? setIsSavingPublished(true) : setIsSavingDraft(true);

    try {
      if (!form.productname || !form.category || !form.price) {
        alert("Please fill all required fields");
        return;
      }

      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) {
        alert("Login expired. Please login again.");
        navigation.replace("Login");
        return;
      }

      const url = isEdit
        ? `${BASE_URL}/api/products/${editProduct._id}`
        : `${BASE_URL}/api/products/add`;
      const method = isEdit ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("productname", form.productname);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("status", status);

      if (image && !image.startsWith("http")) {
        formData.append("image", {
          uri: image,
          name: "product.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      console.log("Raw server response:", text);

      if (response.ok) {
        alert(isEdit ? "Product Updated Successfully!" : "Product Added Successfully!");
        navigation.goBack();
      } else {
        alert(data.message || "Something went wrong");
      }

    } catch (error) {
      console.log(error);
      alert("Network / Server Error");
    } finally {
      isPublished ? setIsSavingPublished(false) : setIsSavingDraft(false);
    }
  };

  const clearAllFields = () => {
    setForm(initialForm);
    setImage(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Detect taps outside */}
      <TouchableWithoutFeedback
        onPress={() => setCategoryDropdownOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Topbar />
          <ScrollView
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.row1}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialIcons
                  name="arrow-back-ios"
                  size={28}
                  style={{ padding: 10 }}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 22, color: colors.text }}>
                {isEdit ? "Edit Product" : "Add New Product"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "black", height: 1 }} />

            <View style={styles.row2}>
              <TouchableOpacity style={styles.card1} onPress={pickImage}>
                <Feather name="upload" size={30} color="#157a4f" />
                <Text>Upload Image</Text>
              </TouchableOpacity>

              <View style={styles.card1}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={{ width: 150, height: 150, borderRadius: 10 }}
                  />
                ) : (
                  <Image
                    source={require("../assets/profile.png")}
                    style={{ width: 150, height: 150 }}
                  />
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: 18 }}>
              <Text style={{ fontSize: 20, color: colors.text }}>Product Details</Text>

              <Text style={[styles.text, { color: colors.text }]}>Product Name*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={form.productname}
                onChangeText={(text) => setForm({ ...form, productname: text })}
              />

              <Text style={[styles.text, { color: colors.text }]}>Category*</Text>

              {/* Category Input */}
              <TouchableOpacity
                onLayout={(e) => setCategoryInputY(e.nativeEvent.layout.y)}
                style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                }}
              >
                <Text style={{ fontSize: 18, color: form.category ? colors.text : "#888" }}>
                  {form.category || "Select Category"}
                </Text>
                <Feather
                  name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>

              {/* Floating Dropdown */}
              {categoryDropdownOpen && (
                <View
                  style={{
                    position: "absolute",
                    top: categoryInputY + 50, // adjust to input height
                    left: 18,
                    right: 18,
                    borderWidth: 1,
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                    maxHeight: 200,
                    zIndex: 999,
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                  }}
                >
                  <ScrollView nestedScrollEnabled={true}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          setForm({ ...form, category: cat });
                          setCategoryDropdownOpen(false);
                        }}
                        style={{ paddingVertical: 12, paddingHorizontal: 12 }}
                      >
                        <Text style={{ fontSize: 18, color: colors.text }}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.text, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, { minHeight: 40, maxHeight: 150 }]}
                placeholder="Enter Description"
                multiline
                scrollEnabled
                textAlignVertical="top"
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
              />

              <Text style={[styles.text, { color: colors.text }]}>Price*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(text) => {
                  setForm({ ...form, price: text });
                }}
              />

            </View>

            <View style={{
              flexDirection: "row", paddingTop: 30,
              paddingHorizontal: 16,
              justifyContent: "space-equal", gap: 14
            }}>
              <TouchableOpacity
                style={[styles.button, { opacity: isSavingPublished ? 0.6 : 1 }, { flex: 1 }]}
                onPress={() => saveProduct("published")}
                disabled={isSavingPublished}
              >
                <Text style={{ fontSize: 20 }}>
                  {isSavingPublished ? "Processing..." : "Save Details"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#157a4f", opacity: isSavingDraft ? 0.6 : 1 }, { flex: 1 }]}
                onPress={() => saveProduct("draft")}
                disabled={isSavingDraft}
              >
                <Text style={{ fontSize: 20 }}>
                  {isSavingDraft ? "Processing..." : "Save As Draft"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={clearAllFields}
            >
              <Text style={{ fontSize: 20, alignSelf: "center", color: "red", paddingTop: 20 }}>Clear All</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
        <Bottombar />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  row2: {
    paddingVertical: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  card1: {
    backgroundColor: "#f3f1ec",
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 180,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    paddingTop: 16,
  },
  input: {
    backgroundColor: "#dad8d8",
    borderRadius: 10,
    borderColor: "#6b6a6a",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 18,
  },
  button: {
    backgroundColor: "#f5b849",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderColor: "#b9b9b9",
    borderWidth: 1,
  },
});