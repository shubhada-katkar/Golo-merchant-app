import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Dimensions, Keyboard, Modal, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "../services/cloudinaryService";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { getValidToken, authenticatedFetch } from "../services/authService";
import CustomAlertModal from "../components/CustomAlertModal";

function getErrorMessageFromResponse(data) {
  const candidates = [];

  const pushValue = (value) => {
    if (typeof value === "string" && value.trim()) {
      candidates.push(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(pushValue);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(pushValue);
    }
  };

  pushValue(data?.message);
  pushValue(data?.error);
  pushValue(data?.details);

  return candidates.join(" ");
}

// Returns true only when the backend explicitly rejected the image/video as
// containing inappropriate content (i.e. the image IS unsafe).
// Deliberately excludes Vision API infrastructure errors (e.g. credentials
// missing, network failure) so those don't incorrectly trigger the popup.
function isModerationFailureResponse(data) {
  const message = getErrorMessageFromResponse(data)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const contentRejectionPhrases = [
    "one or more images contain inappropriate content and cannot be uploaded",
    "the uploaded video contains inappropriate content and cannot be published",
  ];

  return contentRejectionPhrases.some((phrase) => message.includes(phrase));
}

// Returns true when the Vision API itself errored (credentials, quota, network)
// so we can surface a plain alert instead of the inappropriate-content popup.
function isModerationApiErrorResponse(data) {
  const message = getErrorMessageFromResponse(data)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  return message.includes("image moderation failed");
}

function isModerationWarningResponse(data) {
  if (!data) return false;
  if (data.code === 'MODERATION_WARNING' || data.code === 'FINAL_MODERATION_WARNING') {
    return true;
  }
  const message = getErrorMessageFromResponse(data).toLowerCase();
  return (
    message.includes("content policy") ||
    message.includes("repeated uploads") ||
    message.includes("repeated moderation") ||
    message.includes("disable image uploads") ||
    message.includes("restrict your ability to upload")
  );
}

function formatRestrictionUntil(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

function getVideoFileName(videoUrl) {
  if (typeof videoUrl !== "string" || !videoUrl.trim()) {
    return null;
  }

  const sanitizedUrl = videoUrl.split("?")[0].split("#")[0];
  const fileName = sanitizedUrl.split("/").pop();

  if (!fileName || fileName === "upload") {
    return null;
  }

  return fileName;
}

function resolveProductVideoDetails(product) {
  if (!product) {
    return null;
  }

  const videoObject =
    product?.video && typeof product.video === "object" ? product.video : null;

  const candidateUrl =
    typeof product?.videoUrl === "string" && product.videoUrl.trim()
      ? product.videoUrl.trim()
      : typeof product?.video === "string" && product.video.trim()
        ? product.video.trim()
        : typeof videoObject?.url === "string" && videoObject.url.trim()
          ? videoObject.url.trim()
          : typeof videoObject?.videoUrl === "string" && videoObject.videoUrl.trim()
            ? videoObject.videoUrl.trim()
            : typeof videoObject?.uri === "string" && videoObject.uri.trim()
              ? videoObject.uri.trim()
              : null;

  const candidateFileName =
    typeof videoObject?.fileName === "string" && videoObject.fileName.trim()
      ? videoObject.fileName.trim()
      : typeof product?.videoName === "string" && product.videoName.trim()
        ? product.videoName.trim()
        : typeof product?.fileName === "string" && product.fileName.trim()
          ? product.fileName.trim()
          : typeof videoObject?.name === "string" && videoObject.name.trim()
            ? videoObject.name.trim()
            : getVideoFileName(candidateUrl);

  if (!candidateUrl) {
    return null;
  }

  return {
    uri: candidateUrl,
    fileName: candidateFileName || "Selected video",
    duration: typeof videoObject?.duration === "number" ? videoObject.duration : undefined,
  };
}

export default function NewProductPage({ navigation, route }) {
  const screenHeight = Dimensions.get("window").height;
  const bottomPadding = screenHeight * 0.10;
  const editProduct = route?.params?.product;
  const isEdit = !!editProduct;
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [merchantStoreSubCategory, setMerchantStoreSubCategory] = useState("");
  const [flaggedModalVisible, setFlaggedModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState("");
  const [productLimit, setProductLimit] = useState(0);

  const [restrictionModalVisible, setRestrictionModalVisible] = useState(false);
  const [restrictionUntil, setRestrictionUntil] = useState(null);
  const [countdownText, setCountdownText] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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

  const categoryOptions = [
    { label: "Food & Restaurants", value: "Food & Restaurants" },
    { label: "Home Services", value: "Home Services" },
    { label: "Beauty & Wellness", value: "Beauty & Wellness" },
    { label: "Healthcare & Medical", value: "Healthcare & Medical" },
    { label: "Hotels & Accommodation", value: "Hotels & Accommodation" },
    { label: "Shopping & Retail", value: "Shopping & Retail" },
    { label: "Education & Training", value: "Education & Training" },
    { label: "Real Estate", value: "Real Estate" },
    { label: "Events & Entertainment", value: "Events & Entertainment" },
    { label: "Professional Services", value: "Professional Services" },
    { label: "Automotive Services", value: "Automotive Services" },
    { label: "Home Improvement", value: "Home Improvement" },
    { label: "Fitness & Sports", value: "Fitness & Sports" },
    { label: "Daily Needs & Utilities", value: "Daily Needs & Utilities" },
    { label: "Local Businesses & Vendors", value: "Local Businesses & Vendors" },
  ];

  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const initialForm = {
    price: "",
    productname: "",
    description: "",
    stockQuantity: "",
    category: "",
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const checkRestrictionStatus = async () => {
      try {
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        const restrictionKey = `golo_restricted_until:${merchantId}`;
        const flaggedKey = `golo_images_flagged:${merchantId}`;
        const untilStr = await AsyncStorage.getItem(restrictionKey);
        if (untilStr) {
          const untilDate = new Date(untilStr);
          if (untilDate > new Date()) {
            setRestrictionUntil(untilDate);
          } else {
            await AsyncStorage.removeItem(restrictionKey);
            await AsyncStorage.removeItem(flaggedKey);
            setRestrictionUntil(null);
          }
        } else {
          setRestrictionUntil(null);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkRestrictionStatus();
  }, []);

  useEffect(() => {
    if (!restrictionUntil) {
      setCountdownText("");
      return;
    }
    const updateTimer = async () => {
      const now = new Date();
      const diffMs = restrictionUntil - now;
      if (diffMs <= 0) {
        setRestrictionUntil(null);
        setCountdownText("");
        setRestrictionModalVisible(false);
        try {
          const merchantId = await AsyncStorage.getItem("merchantId") || "default";
          await AsyncStorage.removeItem(`golo_restricted_until:${merchantId}`);
          await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
        } catch (e) { }
        return;
      }
      const hrs = String(Math.floor(diffMs / 3600000)).padStart(2, "0");
      const mins = String(Math.floor((diffMs % 3600000) / 60000)).padStart(2, "0");
      const secs = String(Math.floor((diffMs % 60000) / 1000)).padStart(2, "0");
      setCountdownText(`${hrs}:${mins}:${secs}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [restrictionUntil]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    // Clear any stale moderation flag from previous sessions so safe images
    // don't trigger the popup the next time the merchant opens this screen.
    const clearStaleFlag = async () => {
      try {
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
      } catch (e) { }
    };
    clearStaleFlag();

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

        const merchantId = (await AsyncStorage.getItem("merchantId")) || "default";
        const restrictionKey = `golo_restricted_until:${merchantId}`;
        const flaggedKey = `golo_images_flagged:${merchantId}`;

        const serverRestrictionUntil =
          merchantData?.security?.contentUploadRestrictionUntil ||
          merchantData?.contentUploadRestrictionUntil ||
          data?.data?.user?.security?.contentUploadRestrictionUntil ||
          data?.user?.security?.contentUploadRestrictionUntil ||
          null;

        if (serverRestrictionUntil) {
          const untilDate = new Date(serverRestrictionUntil);
          if (untilDate > new Date()) {
            setRestrictionUntil(untilDate);
            await AsyncStorage.setItem(restrictionKey, untilDate.toISOString());
          } else {
            setRestrictionUntil(null);
            await AsyncStorage.removeItem(restrictionKey);
            await AsyncStorage.removeItem(flaggedKey);
          }
        } else {
          setRestrictionUntil(null);
          await AsyncStorage.removeItem(restrictionKey);
          await AsyncStorage.removeItem(flaggedKey);
        }
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
        category: editProduct.category || "",
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

      const existingVideoDetails = resolveProductVideoDetails(editProduct);

      if (existingVideoDetails?.uri) {
        setSelectedVideo(existingVideoDetails);
      }
    }
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pickImage = async () => {
    if (restrictionUntil && restrictionUntil > new Date()) {
      setRestrictionModalVisible(true);
      return;
    }
    const { status: permissionStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== "granted") {
      showAlert("error", "Permission Required", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const maxImageCount = selectedVideo ? 4 : 5;
    if (selectedImages.length >= maxImageCount) {
      showAlert(
        "error",
        "Limit Reached",
        selectedVideo
          ? "You can upload up to 4 images only when a video is attached."
          : "You can upload up to 5 images only."
      );
      return;
    }

    const remainingSlots = maxImageCount - selectedImages.length;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1,
    });

    if (!result.canceled) {
      const pickedImages = result.assets
        .map((asset) => ({ uri: asset.uri }))
        .slice(0, remainingSlots);

      if (!pickedImages.length) {
        showAlert(
          "error",
          "Limit Reached",
          selectedVideo
            ? "You can upload up to 4 images only when a video is attached."
            : "You can upload up to 5 images only."
        );
        return;
      }

      setSelectedImages((currentImages) => [...currentImages, ...pickedImages]);
      try {
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
      } catch (error) {
        console.warn("Failed to clear moderation flag", error);
      }
    }
  };

  const removeSelectedImage = (indexToRemove) => {
    setSelectedImages((currentImages) =>
      currentImages.filter((_, index) => index !== indexToRemove)
    );
  };

  const pickVideo = async () => {
    if (restrictionUntil && restrictionUntil > new Date()) {
      setRestrictionModalVisible(true);
      return;
    }
    const { status: permissionStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== "granted") {
      showAlert("error", "Permission Required", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    if (selectedVideo) {
      showAlert("error", "Limit Reached", "You can add only one video per product.");
      return;
    }

    if (selectedImages.length > 4) {
      showAlert("error", "Limit Reached", "Remove one image before adding a video. Video products can have up to 4 images only.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
      videoMaxDuration: 30,
    });

    if (!result.canceled) {
      const videoAsset = result.assets?.[0];
      if (!videoAsset?.uri) {
        showAlert("error", "Invalid Video", "Please select a valid video file.");
        return;
      }

      const rawDuration = Number(videoAsset.duration || 0);
      const normalizedDuration = rawDuration > 100 ? rawDuration / 1000 : rawDuration;
      if (normalizedDuration > 30) {
        showAlert("error", "Video Too Long", "Please choose a video that is 30 seconds or shorter.");
        return;
      }

      setSelectedVideo({
        uri: videoAsset.uri,
        fileName: videoAsset.fileName || `video_${Date.now()}.mp4`,
        duration: normalizedDuration,
      });
    }
  };

  const removeSelectedVideo = () => {
    setSelectedVideo(null);
  };

  const saveProduct = async () => {
    if (isSaving) return;

    setIsSaving(true);
    const merchantId = await AsyncStorage.getItem("merchantId") || "default";

    if (!isEdit) {
      try {
        const storedMerchantId = merchantId;
        if (storedMerchantId && storedMerchantId !== "default") {
          const subRes = await authenticatedFetch(`${BASE_URL}/merchants/${storedMerchantId}/subscription`);
          if (subRes.ok) {
            const subData = await subRes.json();
            const rawMaxProducts = subData?.planFeatures?.maxProducts ?? subData?.maxProducts ?? null;
            // A null / -1 / very large value means unlimited — skip limit enforcement.
            const isUnlimited =
              rawMaxProducts === null ||
              rawMaxProducts === undefined ||
              rawMaxProducts === -1 ||
              rawMaxProducts === Infinity ||
              rawMaxProducts >= 999999;
            const maxProducts = isUnlimited ? Infinity : Number(rawMaxProducts);
            const planName = subData?.planFeatures?.name || subData?.name || "Free Tier";
            setCurrentPlanName(planName);
            setProductLimit(isUnlimited ? 0 : maxProducts);

            if (!isUnlimited) {
              const prodRes = await authenticatedFetch(`${BASE_URL}/merchant/products`);
              if (prodRes.ok) {
                const prodData = await prodRes.json();
                const list = Array.isArray(prodData?.data) ? prodData.data : Array.isArray(prodData) ? prodData : [];
                if (list.length >= maxProducts) {
                  setIsSaving(false);
                  setUpgradeModalVisible(true);
                  return;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Verification error:", err);
      }
    }

    if (restrictionUntil && restrictionUntil > new Date()) {
      setRestrictionModalVisible(true);
      setIsSaving(false);
      return;
    }

    try {
      const storedFlag = await AsyncStorage.getItem(`golo_images_flagged:${merchantId}`);
      if (storedFlag === "true") {
        setFlaggedModalVisible(true);
        setIsSaving(false);
        return;
      }
    } catch (error) {
      console.warn("Failed to read moderation flag before submit", error);
    }

    try {
      if (!selectedImages || selectedImages.length === 0) {
        showAlert("error", "Missing Fields", "Please upload at least one product image");
        return;
      }

      if (!form.productname || !form.productname.trim()) {
        showAlert("error", "Missing Fields", "Please enter product name");
        return;
      }

      if (!form.description || !form.description.trim()) {
        showAlert("error", "Missing Fields", "Please enter product description");
        return;
      }

      if (!form.category || !form.category.trim()) {
        showAlert("error", "Missing Fields", "Please select category");
        return;
      }

      if (form.price === "" || form.price === undefined || form.price === null || Number.isNaN(Number(form.price))) {
        showAlert("error", "Missing Fields", "Please enter valid price");
        return;
      }

      if (form.stockQuantity === "" || form.stockQuantity === undefined || form.stockQuantity === null || Number.isNaN(Number(form.stockQuantity))) {
        showAlert("error", "Missing Fields", "Please enter valid stock quantity");
        return;
      }

      if (!merchantStoreSubCategory) {
        showAlert("error", "Sub-Category Required", "Please select your store sub-category in Profile Settings before adding products.");
        return;
      }

      const stockQuantity = Number(form.stockQuantity ?? 0);
      if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
        showAlert("error", "Invalid Stock", "Please enter a valid stock quantity");
        return;
      }

      const maxImageCount = selectedVideo ? 4 : 5;
      if (selectedImages.length > maxImageCount) {
        showAlert(
          "error",
          "Limit Reached",
          selectedVideo
            ? "Please keep the image count at 4 or fewer when a video is attached."
            : "Please keep the image count at 5 or fewer."
        );
        return;
      }

      let token;
      try {
        token = await getValidToken();
      } catch {
        showAlert("error", "Login Expired", "Login expired. Please login again.", () => navigation.replace("Login"));
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
          showAlert("error", "Upload Failed", uploadResult.message || "Failed to upload image. Please try again.");
          return;
        }
        uploadedImages.push(uploadResult.url);
      }

      if (uploadedImages.length) {
        setSelectedImages(uploadedImages.map((uri) => ({ uri })));
      }

      let productVideoUrl = isEdit ? null : undefined;
      if (selectedVideo?.uri) {
        if (/^https?:\/\//i.test(selectedVideo.uri)) {
          productVideoUrl = selectedVideo.uri;
        } else {
          const uploadResult = await uploadVideoToCloudinary(selectedVideo.uri, "golo/product-videos");
          if (!uploadResult.success) {
            showAlert("error", "Upload Failed", uploadResult.message || "Failed to upload video. Please try again.");
            return;
          }
          productVideoUrl = uploadResult.url;
        }
      }

      const productImages =
        uploadedImages.length > 0
          ? uploadedImages
          : isEdit
            ? []
            : undefined;
      const productCategory = form.category || merchantStoreSubCategory;

      const merchantCreatePayload = {
        name: form.productname,
        description: form.description,
        category: productCategory,
        price: Number(form.price),
        stockQuantity,
        ...(productImages !== undefined ? { images: productImages } : {}),
        ...(productVideoUrl !== undefined ? { videoUrl: productVideoUrl } : {}),
      };

      const merchantUpdatePayload = {
        name: form.productname,
        description: form.description,
        category: productCategory,
        price: Number(form.price),
        stockQuantity,
        ...(productImages !== undefined ? { images: productImages } : {}),
        ...(productVideoUrl !== undefined ? { videoUrl: productVideoUrl } : {}),
      };

      const editIdentifier = editProduct?.productId || editProduct?._id || editProduct?.id;
      const merchantUrl = isEdit
        ? `${BASE_URL}/merchant/products/${editIdentifier}`
        : `${BASE_URL}/merchant/products`;

      const bodyPayload = isEdit
        ? merchantUpdatePayload
        : merchantCreatePayload;

      console.log("Merchant product payload being sent:", JSON.stringify(bodyPayload));

      const response = await authenticatedFetch(merchantUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const text = await response?.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      console.log("Raw server response:", text);

      if (response?.ok) {
        try {
          await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
        } catch (error) {
          console.warn("Failed to clear moderation flag after success", error);
        }
        showAlert(
          "success",
          "Success",
          isEdit ? "Product Updated Successfully!" : "Product Added Successfully!",
          () => navigation.goBack()
        );
      } else {
        const isRestricted = response.status === 403 || data?.code === "CONTENT_UPLOAD_RESTRICTED";
        if (isRestricted) {
          const until = data?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
          try {
            await AsyncStorage.setItem(`golo_restricted_until:${merchantId}`, until);
          } catch (e) { }
          setRestrictionUntil(new Date(until));
          setRestrictionModalVisible(true);
          return;
        }

        if (isModerationWarningResponse(data)) {
          const msg = getErrorMessageFromResponse(data);
          setWarningModalMessage(msg || "Repeated uploads that violate GOLO's content policy may restrict your account temporarily.");
          setWarningModalVisible(true);
          return;
        }

        if (isModerationFailureResponse(data)) {
          // Image contained inappropriate content — show the popup and persist flag.
          try {
            await AsyncStorage.setItem(`golo_images_flagged:${merchantId}`, "true");
          } catch (error) {
            console.warn("Failed to set moderation flag", error);
          }
          setFlaggedModalVisible(true);
          return;
        }
        if (isModerationApiErrorResponse(data)) {
          // Vision API infrastructure error — plain alert, no persistent flag.
          showAlert("error", "Moderation Unavailable", "Image moderation is temporarily unavailable. Please try again in a moment.");
          return;
        }
        showAlert("error", "Error", data.message || "Something went wrong");
      }

    } catch (error) {
      console.log(error);
      showAlert("error", "Server Error", "Network / Server Error");
    } finally {
      setIsSaving(false);
    }
  };

  const clearAllFields = () => {
    setForm(initialForm);
    setSelectedImages([]);
    setSelectedVideo(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
            colors={["#f8a812", "#fad081", "#f8f6f265"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
          />
          <Topbar />
          <View style={styles.row1}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons
                name="arrow-back-ios"
                size={22}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
            <Text style={{
              ...textPresets.title
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
                    <Text style={styles.imagePlaceholderText}>Upload Image<Text style={styles.requiredStar}>*</Text></Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={[styles.text, { marginTop: 15 }]}>Product Video (Optional)</Text>

              <TouchableOpacity
                style={styles.card1}
                onPress={pickVideo}
                disabled={isSaving}
                activeOpacity={0.75}
              >
                {selectedVideo?.uri || typeof selectedVideo === "string" ? (
                  <View style={{ width: "100%", height: 170, borderRadius: 10, backgroundColor: "#1e293b", justifyContent: "center", alignItems: "center", position: "relative" }}>
                    <MaterialCommunityIcons name="movie-play-outline" size={42} color="#157a4f" />
                    <Text style={{ color: "#fff", marginTop: 6, paddingHorizontal: 16, textAlign: "center", ...textPresets.label }} numberOfLines={1}>
                      {selectedVideo.fileName || getVideoFileName(selectedVideo.uri || selectedVideo) || "Video Attached"}
                    </Text>
                    <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                        onPress={pickVideo}
                      >
                        <Feather name="edit-2" size={14} color="#fff" />
                        <Text style={{ color: "#fff", marginLeft: 4, ...textPresets.caption }}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(229,57,53,0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                        onPress={removeSelectedVideo}
                      >
                        <Feather name="trash-2" size={14} color="#ef4444" />
                        <Text style={{ color: "#ef4444", marginLeft: 4, ...textPresets.caption }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Feather name="video" size={30} color="#157a4f" />
                    <Text style={{ color: "#157a4f", marginTop: 8, ...textPresets.label }}>Upload Product Video</Text>
                    <Text style={{ color: "#999", marginTop: 4, ...textPresets.label }}>Recommended: MP4 format, up to 30s</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.text}>
                Product Name<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={form.productname}
                onChangeText={(text) => setForm({ ...form, productname: text })}
              />

              <Text style={styles.text}>
                Description<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { minHeight: 40, maxHeight: 150 }]}
                placeholder="Enter Description"
                multiline
                scrollEnabled
                textAlignVertical="top"
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
              />

              <Text style={styles.text}>
                Category<Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 15 }]}
                onPress={() => setCategoryModalOpen(true)}
              >
                <Text style={{
                  color: form.category ? "#000" : "#999", ...textPresets.body
                }}>
                  {form.category || "Select category"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#333" />
              </TouchableOpacity>

              <Modal
                visible={categoryModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setCategoryModalOpen(false)}
                statusBarTranslucent
              >
                <TouchableWithoutFeedback onPress={() => setCategoryModalOpen(false)}>
                  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 15, width: "85%", maxHeight: "50%", paddingVertical: 20 }}>
                      <Text style={{ ...textPresets.subtitle, marginBottom: 15, paddingHorizontal: 20, color: "#157a4f" }}>
                        Select Category
                      </Text>
                      <FlatList
                        data={categoryOptions}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={{
                              paddingVertical: 15,
                              paddingHorizontal: 20,
                              borderBottomWidth: 1,
                              borderBottomColor: "#eee",
                              backgroundColor: form.category === item.value ? "#ecfdf5" : "#fff",
                            }}
                            onPress={() => {
                              setForm({ ...form, category: item.value });
                              setCategoryModalOpen(false);
                            }}
                          >
                            <Text style={{ ...textPresets.body, color: form.category === item.value ? "#157a4f" : "#000" }}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>

              <View style={[styles.row, { marginTop: 16 }]}>
                <View style={styles.halfField}>
                  <Text style={[styles.text, { paddingTop: 0 }]}>
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
                  <Text style={[styles.text, { paddingTop: 0 }]}>
                    Stock Quantity<Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter stock"
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

      {/* Moderation restriction countdown modal */}
      <Modal
        visible={restrictionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
        statusBarTranslucent
      >
        <View style={styles.flaggedOverlay}>
          <View style={styles.flaggedCard}>
            {/* Header row: warning icon + title + close */}
            <View style={styles.flaggedHeaderRow}>
              <View style={styles.flaggedHeaderTextWrap}>
                <View style={styles.flaggedHeaderIconCircle}>
                  <Feather name="clock" size={14} color="#d92d20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedHeaderTitle}>Uploading Restricted</Text>
                  <Text style={styles.flaggedHeaderSubtitle}>
                    Temporary block due to multiple policy violations.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setRestrictionModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            {/* Centered big clock icon */}
            <View style={styles.flaggedIconWrap}>
              <View style={styles.flaggedIconCircle}>
                <Feather name="lock" size={30} color="#d92d20" />
              </View>
            </View>

            <Text style={styles.flaggedTitle}>Upload Limit Exceeded</Text>
            <Text style={styles.flaggedDescription}>
              You have been temporarily restricted from uploading content due to multiple inappropriate image submissions. Your restriction will be removed at the date and time shown below.
            </Text>

            {/* Restriction lift date & time UI */}
            <View style={{
              backgroundColor: "#fef3f2",
              borderColor: "#fda29b",
              borderWidth: 1,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginVertical: 16,
            }}>
              <Text style={{
                ...textPresets.caption,
                color: "#b42318",
                letterSpacing: 1,
                marginBottom: 4,
                textTransform: "uppercase"
              }}>
                Restriction End Date & Time
              </Text>
              <Text style={{
                ...textPresets.label,
                color: "#d92d20",
                textAlign: "center"
              }}>
                {formatRestrictionUntil(restrictionUntil) || "N/A"}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.flaggedButton, { backgroundColor: "#d92d20" }]}
              onPress={() => setRestrictionModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Flagged / rejected image modal */}
      <Modal
        visible={flaggedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
        statusBarTranslucent
      >
        <View style={styles.flaggedOverlay}>
          <View style={styles.flaggedCard}>
            {/* Header row: warning icon + title + close */}
            <View style={styles.flaggedHeaderRow}>
              <View style={styles.flaggedHeaderTextWrap}>
                <View style={styles.flaggedHeaderIconCircle}>
                  <Feather name="alert-triangle" size={14} color="#d92d20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedHeaderTitle}>Inappropriate Content</Text>
                  <Text style={styles.flaggedHeaderSubtitle}>
                    Your uploaded media has been flagged by our safety system.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setFlaggedModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            {/* Centered big shield icon */}
            <View style={styles.flaggedIconWrap}>
              <View style={styles.flaggedIconCircle}>
                <Feather name="shield" size={30} color="#d92d20" />
              </View>
            </View>

            <Text style={styles.flaggedTitle}>Upload Rejected</Text>
            <Text style={styles.flaggedDescription}>
              One or more of your uploaded media files contains content that violates our community
              guidelines. Please remove the inappropriate media and try posting again.
            </Text>

            <TouchableOpacity
              style={styles.flaggedButton}
              onPress={() => setFlaggedModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Moderation Warning Modal */}
      <Modal
        visible={warningModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarningModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.flaggedOverlay}>
          <View style={styles.flaggedCard}>
            {/* Header row: warning icon + title + close */}
            <View style={styles.flaggedHeaderRow}>
              <View style={styles.flaggedHeaderTextWrap}>
                <View style={styles.flaggedHeaderIconCircle}>
                  <Feather name="alert-triangle" size={14} color="#d92d20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flaggedHeaderTitle}>Content Policy Warning</Text>
                  <Text style={styles.flaggedHeaderSubtitle}>
                    GOLO Safety & Policy Alert
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setWarningModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#8a8a8a" />
              </TouchableOpacity>
            </View>

            {/* Centered big alert icon */}
            <View style={styles.flaggedIconWrap}>
              <View style={styles.flaggedIconCircle}>
                <Feather name="alert-circle" size={30} color="#d92d20" />
              </View>
            </View>

            <Text style={styles.flaggedTitle}>Account Restriction Warning</Text>
            <Text style={styles.flaggedDescription}>
              {warningModalMessage ||
                "Repeated uploads that violate GOLO's content policy may restrict your account temporarily."}
            </Text>

            <TouchableOpacity
              style={styles.flaggedButton}
              onPress={() => setWarningModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plan Limit / Upgrade modal */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.upgradeModalOverlay}>
          <View style={styles.upgradeModalCard}>
            {/* Close button in top-right */}
            <TouchableOpacity
              style={styles.upgradeModalCloseButton}
              onPress={() => setUpgradeModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Crown Icon Container */}
            <View style={styles.upgradeModalIconCircle}>
              <MaterialCommunityIcons name="crown-outline" size={30} color="#f59e0b" />
            </View>

            {/* Title */}
            <Text style={styles.upgradeModalTitle}>Plan Limit Reached</Text>

            {/* Description */}
            <Text style={styles.upgradeModalDescription}>
              {currentPlanName || "Free Tier"} merchants can only add up to {productLimit} products. Please upgrade to a higher plan.
            </Text>

            {/* Actions Row */}
            <View style={styles.upgradeModalActionsRow}>
              <TouchableOpacity
                style={styles.upgradeModalSecondaryButton}
                onPress={() => setUpgradeModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeModalSecondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.upgradeModalPrimaryButton}
                onPress={() => {
                  setUpgradeModalVisible(false);
                  navigation.navigate("UpgradePlanPage");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeModalPrimaryButtonText}>Upgrade Plan</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    color: "#157a4f",
    marginBottom: 12,
    ...textPresets.subtitle
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
    ...textPresets.body
  },
  card1: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 10,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  videoLabel: {
    color: "#157a4f",
    ...textPresets.label,
    marginBottom: 10,
    alignSelf: "center"
  },
  videoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8d6d2",
    padding: 10,
  },
  videoPreviewIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#e8f8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPreviewTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  videoPreviewTitle: {
    color: "#1a1a1a",
    ...textPresets.body,

  },
  videoPreviewSubtitle: {
    color: "#6b6b6b",
    ...textPresets.caption,
    marginTop: 2,
  },
  removeVideoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0473e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f3f1ec",
  },
  videoButton: {
    backgroundColor: "#157a4f",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  videoButtonText: {
    color: "#fff",
    ...textPresets.body,
  },
  text: {
    paddingTop: 16,
    ...textPresets.body
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
    ...textPresets.body,
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
    ...textPresets.body
  },
  // --- Flagged image modal (matches web "Upload Rejected" reference) ---
  flaggedOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  flaggedCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  flaggedHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  flaggedHeaderTextWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingRight: 12,
  },
  flaggedHeaderIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  flaggedHeaderTitle: {
    ...textPresets.subtitle,
    color: "#1a1a1a",
  },
  flaggedHeaderSubtitle: {
    ...textPresets.caption,
    color: "#8a8a8a",
    marginTop: 3,
  },
  flaggedIconWrap: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 14,
  },
  flaggedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
  },
  flaggedTitle: {
    ...textPresets.subtitle,
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  flaggedDescription: {
    ...textPresets.label,
    color: "#6b6b6b",
    textAlign: "center",
    marginBottom: 20,
  },
  flaggedButton: {
    backgroundColor: "#e0483e",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  flaggedButtonText: {
    color: "#fff",
    ...textPresets.body,
  },
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeModalCard: {
    width: "90%",
    maxWidth: 385,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeModalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  upgradeModalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  upgradeModalTitle: {
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
    ...textPresets.subtitle,
  },
  upgradeModalDescription: {
    color: "#4b5563",
    textAlign: "center",
    paddingHorizontal: 10,
    marginBottom: 28,
    ...textPresets.label
  },
  upgradeModalActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  upgradeModalSecondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeModalSecondaryButtonText: {
    color: "#4b5563",
    ...textPresets.label
  },
  upgradeModalPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#157a4f",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5
  },
  upgradeModalPrimaryButtonText: {
    ...textPresets.label,
    color: "#ffffff",
  },
});
