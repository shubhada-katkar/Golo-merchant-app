import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Dimensions, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { uploadImageToCloudinary } from "../services/cloudinaryService";

export default function NewProductPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const screenHeight = Dimensions.get("window").height;
  const bottomPadding = screenHeight * 0.10;
  const editProduct = route?.params?.product;
  const isEdit = !!editProduct;
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [image, setImage] = useState(null);

  const initialForm = {
    price: "",
    productname: "",
    description: "",
    stockQuantity: "",
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    if (isEdit) {
      setForm({
        productname: editProduct.productname || "",
        description: editProduct.description || "",
        price: String(editProduct.price || ""),
        stockQuantity: String(editProduct.stockQuantity ?? editProduct.stock ?? ""),
      });

      const imageUrl =
        editProduct.productImages?.[0] ||
        editProduct.images?.[0] ||
        editProduct.image?.url ||
        editProduct.image?.imageUrl ||
        editProduct.image ||
        null;
      setImage(typeof imageUrl === "string" ? imageUrl : null);
    }
    return () => {
      showSub.remove();
      hideSub.remove();
    };
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

const saveProduct = async () => {
  if (isSaving) return;

  setIsSaving(true);

    try {
      if (!form.productname || form.price === "") {
        alert("Please fill all required fields");
        return;
      }

      const stockQuantity = Number(form.stockQuantity ?? 0);
      if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
        alert("Please enter a valid stock quantity");
        return;
      }

      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) {
        alert("Login expired. Please login again.");
        navigation.replace("Login");
        return;
      }

      const method = isEdit ? "PUT" : "POST";

      let imageSourceUrl;
      if (typeof image === "string" && !/^https?:\/\//i.test(image)) {
        const uploadResult = await uploadImageToCloudinary(image, "golo/product-images");
        if (!uploadResult.success) {
          alert(uploadResult.message || "Failed to upload image. Please try again.");
          return;
        }
        imageSourceUrl = uploadResult.url;
        setImage(uploadResult.url);
      } else if (typeof image === "string" && /^https?:\/\//i.test(image)) {
        imageSourceUrl = image;
      }

      const productImages = imageSourceUrl ? [imageSourceUrl] : undefined;

      const createJsonPayload = {
        productName: form.productname,
        description: form.description,
        regularPrice: Number(form.price),
        stockQuantity,
        ...(productImages ? { productImages } : {}),
      };

      const updateJsonPayload = {
       ...createJsonPayload,
      };

      const merchantCreatePayload = {
        name: form.productname,
        description: form.description,
        price: Number(form.price),
        stockQuantity,
        ...(productImages ? { images: productImages } : {}),
      };

      const merchantUpdatePayload = {
        name: form.productname,
        description: form.description,
        price: Number(form.price),
        stockQuantity,
      };

      const stripUnsupportedFields = (payload) => {
        const { image, ...rest } = payload;
        return rest;
      };

      const editIdentifier = editProduct?.productId || editProduct?._id || editProduct?.id;
      const urlCandidates = isEdit
        ? [`${BASE_URL}/products/${editIdentifier}`, `${BASE_URL}/merchant/products/${editIdentifier}`]
        : [`${BASE_URL}/products`, `${BASE_URL}/merchant/products`];

      const cleanCreateJsonPayload = stripUnsupportedFields(createJsonPayload);
      const cleanUpdateJsonPayload = stripUnsupportedFields(updateJsonPayload);
      const cleanMerchantCreatePayload = stripUnsupportedFields(merchantCreatePayload);
      const cleanMerchantUpdatePayload = stripUnsupportedFields(merchantUpdatePayload);

      let response = null;
      for (const url of urlCandidates) {
        const bodyPayload = url.includes("/merchant/products")
          ? isEdit
            ? cleanMerchantUpdatePayload
            : cleanMerchantCreatePayload
          : isEdit
          ? cleanUpdateJsonPayload
          : cleanCreateJsonPayload;

        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (response.ok) break;
      }

      const text = await response?.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      console.log("Raw server response:", text);

      if (response?.ok) {
        alert(isEdit ? "Product Updated Successfully!" : "Product Added Successfully!");
        navigation.goBack();
      } else {
        alert(data.message || "Something went wrong");
      }

    } catch (error) {
      console.log(error);
      alert("Network / Server Error");
    } finally {
      setIsSaving(false);
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
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Topbar />
                      <View style={styles.row1}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialIcons
                  name="arrow-back-ios"
                  size={26}
                  style={{ padding: 10 }}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, color: colors.text,
                fontFamily:"Medium", lineHeight: Math.round(20 * 1.5)
               }}>
                {isEdit ? "Edit Product" : "Add New Product"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "black", height: 1 }} />
          <ScrollView
            contentContainerStyle={{ paddingBottom: isKeyboardVisible ? bottomPadding + 140 : bottomPadding, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
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
              <Text style={{ fontSize: 18, color: colors.text,
                  fontFamily:"Medium", lineHeight: Math.round(18 * 1.5)
               }}>Product Details</Text>

              <Text style={[styles.text, { color: colors.text }]}>Product Name*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={form.productname}
                onChangeText={(text) => setForm({ ...form, productname: text })}
              />

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

              <Text style={[styles.text, { color: colors.text }]}>Stock Quantity*</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter stock quantity"
                keyboardType="numeric"
                value={form.stockQuantity}
                onChangeText={(text) => setForm({ ...form, stockQuantity: text })}
              />
            </View>

           <View
  style={{
    paddingTop: 30,
    paddingHorizontal: 16,
  }}
>
  <TouchableOpacity
    style={[styles.button, { opacity: isSaving ? 0.6 : 1 }]}
    onPress={saveProduct}
    disabled={isSaving}
  >
    <Text style={{ fontSize: 16, fontFamily:"Medium", lineHeight: Math.round(18 * 1.5) }}>
      {isSaving ? "Processing..." : "Save Product"}
    </Text>
  </TouchableOpacity>
</View>

            <TouchableOpacity
              onPress={clearAllFields}
            >
              <Text style={{ fontSize: 16, alignSelf: "center", color: "red", paddingTop: 20,
                fontFamily:"Medium", lineHeight: Math.round(16 * 1.5)
               }}>Clear All</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {!isKeyboardVisible && (
        <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
          <Bottombar />
        </SafeAreaView>
      )}
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
    fontSize: 16,
    paddingTop: 16,
      fontFamily:"Medium",
      lineHeight: Math.round(16 * 1.5)
  },
  input: {
    backgroundColor: "#dad8d8",
    borderRadius: 10,
    borderColor: "#6b6a6a",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily:"Medium",
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


