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
import { LinearGradient } from "expo-linear-gradient";

export default function NewProductPage({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const screenHeight = Dimensions.get("window").height;
  const bottomPadding = screenHeight * 0.10;
  const editProduct = route?.params?.product;
  const isEdit = !!editProduct;
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [merchantStoreSubCategory, setMerchantStoreSubCategory] = useState("");

  const [selectedImages, setSelectedImages] = useState([]);

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

    const loadMerchantProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        let response = await fetch(`${BASE_URL}/users/merchant/profile`, { headers });
        if (!response.ok && response.status === 404) {
          response = await fetch(`${BASE_URL}/merchant/profile`, { headers });
        }

        if (!response.ok) return;
        const data = await response.json();
        const merchantData = data?.data || data || {};
        setMerchantStoreSubCategory(merchantData.storeSubCategory || "");
      } catch (error) {
        console.log("Error fetching merchant category:", error);
      }
    };

    loadMerchantProfile();

    if (isEdit) {
      setForm({
        productname: editProduct.productname || "",
        description: editProduct.description || "",
        price: String(editProduct.price || ""),
        stockQuantity: String(editProduct.stockQuantity ?? editProduct.stock ?? ""),
      });

      const existingImages = [
        ...(Array.isArray(editProduct.productImages) ? editProduct.productImages : []),
        ...(Array.isArray(editProduct.images) ? editProduct.images : []),
      ];
      const fallbackImage =
        editProduct.image?.url ||
        editProduct.image?.imageUrl ||
        editProduct.image ||
        null;
      const imageUris = existingImages.length
        ? existingImages
        : typeof fallbackImage === "string"
        ? [fallbackImage]
        : [];
      setSelectedImages(imageUris.map((uri) => ({ uri })));
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
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (!result.canceled) {
      const pickedImages = result.assets.map((asset) => ({ uri: asset.uri }));
      setSelectedImages((currentImages) => [...currentImages, ...pickedImages]);
    }
  };

  const removeSelectedImage = (indexToRemove) => {
    setSelectedImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );
  };

const saveProduct = async () => {
  if (isSaving) return;

  setIsSaving(true);

    try {
      if (!form.productname || form.price === "") {
        alert("Please fill all required fields");
        return;
      }

      if (!merchantStoreSubCategory) {
        alert("Please select your store sub-category in Profile Settings before adding products.");
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

      const uploadedImages = [];
      for (const selectedImage of selectedImages) {
        const imageUri = selectedImage?.uri;
        if (!imageUri) continue;

        if (/^https?:\/\//i.test(imageUri)) {
          uploadedImages.push(imageUri);
          continue;
        }

        const uploadResult = await uploadImageToCloudinary(imageUri, "golo/product-images");
        if (!uploadResult.success) {
          alert(uploadResult.message || "Failed to upload image. Please try again.");
          return;
        }
        uploadedImages.push(uploadResult.url);
      }

      if (uploadedImages.length) {
        setSelectedImages(uploadedImages.map((uri) => ({ uri })));
      }

      const productImages =
        uploadedImages.length > 0
          ? uploadedImages
          : isEdit
          ? []
          : undefined;
      const productCategory = merchantStoreSubCategory;

      const createJsonPayload = {
        productName: form.productname,
        description: form.description,
        category: productCategory,
        regularPrice: Number(form.price),
        stockQuantity,
        ...(productImages !== undefined ? { productImages } : {}),
      };

      const updateJsonPayload = {
       ...createJsonPayload,
      };

      const merchantCreatePayload = {
        name: form.productname,
        description: form.description,
        category: productCategory,
        price: Number(form.price),
        stockQuantity,
        ...(productImages !== undefined ? { images: productImages } : {}),
      };

      const merchantUpdatePayload = {
        name: form.productname,
        description: form.description,
        category: productCategory,
        price: Number(form.price),
        stockQuantity,
        ...(productImages !== undefined ? { images: productImages } : {}),
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
    setSelectedImages([]);
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
        <LinearGradient
             colors={["#f8a812", "#fad081", "#fffbf4"]}
             start={{ x: 0, y: 0 }}
             end={{ x: 0, y: 1 }}
             style={{height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
        />
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

            <View style={styles.divider} />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Product Details</Text>

              <View style={styles.imageUploadCard}>
                {selectedImages.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.selectedImagesScroll}
                    contentContainerStyle={styles.selectedImagesContent}
                  >
                    {selectedImages.map((selectedImage, index) => (
                      <View key={`${selectedImage.uri}-${index}`} style={styles.selectedImageWrap}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeSelectedImage(index)}
                        >
                          <Feather name="x" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity style={styles.imageDropZone} onPress={pickImage}>
                  <View style={styles.imagePlaceholder}>
                    <Feather name="upload" size={28} color="#157a4f" />
                    <Text style={styles.imagePlaceholderText}>Upload Image</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={[styles.text, { color: colors.text }]}>
                Product Name<Text style={styles.requiredStar}>*</Text>
              </Text>
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

              <View style={[styles.row, { marginTop: 16 }]}>
                <View style={styles.halfField}>
                  <Text style={[styles.text, { color: colors.text, paddingTop: 0 }]}>
                    Price<Text style={styles.requiredStar}>*</Text>
                  </Text>
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

                <View style={styles.halfField}>
                  <Text style={[styles.text, { color: colors.text, paddingTop: 0 }]}>Stock Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter stock quantity"
                    keyboardType="numeric"
                    value={form.stockQuantity}
                    onChangeText={(text) => setForm({ ...form, stockQuantity: text })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.updateButton, { opacity: isSaving ? 0.6 : 1 }]}
                onPress={saveProduct}
                disabled={isSaving}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {isSaving ? "Processing..." : isEdit ? "Update" : "Save Product"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.discardButton} onPress={clearAllFields}>
                <MaterialIcons name="cancel" size={20} color="#fff" />
                <Text style={styles.buttonText}>Discard</Text>
              </TouchableOpacity>
            </View>

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
  divider: {
    height: 1,
    backgroundColor: "#1b1b1b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#157a4f",
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
    marginBottom: 12,
  },
  imageUploadCard: {
    width: "100%",
    minHeight: 200,
    borderRadius: 12,
    backgroundColor: "#f3f1ec",
    marginBottom: 8,
    padding: 12,
  },
  selectedImagesScroll: {
    minHeight: 85,
    marginBottom: 12,
  },
  selectedImagesContent: {
    gap: 14,
    paddingTop: 6,
    paddingBottom: 2,
    paddingRight: 4,
  },
  selectedImageWrap: {
    width: 80,
    height: 80,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0473e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f3f1ec",
  },
  imageDropZone: {
    flex: 1,
    minHeight: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c7c4bf",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
  flex: 1,
  width: "100%",
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},
imagePlaceholderText: {
  color: "#157a4f",
  fontSize: 14,
  fontFamily: "Medium",
},
  text: {
    fontSize: 14,
    paddingTop: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
  },
  requiredStar: {
    color: "#e74c3c",
  },
  input: {
    backgroundColor: "#f0eeea",
    borderRadius: 10,
    borderColor: "#d8d6d2",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Medium",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  updateButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1e9e5c",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  discardButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#e0473e",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Medium",
    lineHeight: Math.round(16 * 1.5),
  },
});
