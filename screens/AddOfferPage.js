import React, { useContext, useState, useEffect, useCallback } from "react";
import {
    View, StyleSheet, Text, Switch, TouchableOpacity,
    TextInput, ScrollView, TouchableWithoutFeedback, KeyboardAvoidingView,
    Keyboard, Platform, FlatList, Modal, ActivityIndicator, Image
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import OfferScroll from "../components/OfferScroll";
import { ThemeContext } from "../theme/ThemeContext";
import Dropdown from "../components/Dropdown";
import { fetchMerchantProducts } from "../services/merchantProducts";
import { MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "../services/cloudinaryService";
import { Video, ResizeMode } from "expo-av";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";
import { getValidToken, authenticatedFetch, handleAuthError } from "../services/authService";
import CustomAlertModal from "../components/CustomAlertModal";

const parseResponseSafely = async (response) => {
    const responseText = await response.text();

    if (!responseText) {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return { message: responseText };
    }
};

const getErrorMessageFromResponse = (data) => {
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
};

const isModerationFailureResponse = (data) => {
    const message = getErrorMessageFromResponse(data)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const rejectionPhrases = [
        "inappropriate content",
        "moderation failure",
        "content moderation",
        "failed moderation",
    ];

    return rejectionPhrases.some((phrase) => message.includes(phrase));
};

const isModerationApiErrorResponse = (data) => {
    const message = getErrorMessageFromResponse(data)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    return message.includes("image moderation failed");
};

const isModerationWarningResponse = (data) => {
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
};

const formatRestrictionUntil = (date) => {
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
};


const formatDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const buildSelectedDates = (fromDate, toDate) => {
    if (!fromDate || !toDate) return [];

    const dates = [];
    const current = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

    while (current <= end) {
        dates.push(formatDateOnly(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

const calculateOfferPrice = (price, offerType) => {
    const numericPrice = Number(price || 0);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return 0;
    }

    const normalizedOfferType = String(offerType || "").toLowerCase();
    switch (normalizedOfferType) {
        case "bogo":
        case "b1g1":
            return Number((numericPrice * 0.5).toFixed(2));
        case "50% off":
        case "50%off":
            return Number((numericPrice * 0.5).toFixed(2));
        case "70% off":
        case "70%off":
            return Number((numericPrice * 0.3).toFixed(2));
        default:
            return numericPrice;
    }
};

const normalizeSelectedProduct = (product, offerType = "") => {
    const originalPrice = Number(product?.price ?? product?.originalPrice ?? 0);
    const numericStock = Number(
        product?.stock ??
        product?.stockQuantity ??
        product?.quantity ??
        product?.stock_qty ??
        product?.available ??
        product?.availableQuantity ??
        product?.inStock ??
        0
    );

    let offerPrice = product?.offerPrice;
    if (offerPrice === undefined || offerPrice === null || offerPrice === "") {
        offerPrice = calculateOfferPrice(originalPrice, offerType);
    } else {
        offerPrice = Number(offerPrice);
        if (!Number.isFinite(offerPrice)) {
            offerPrice = calculateOfferPrice(originalPrice, offerType);
        }
    }

    return {
        productId: product?._id || product?.id || product?.productId || "",
        productName: product?.name || product?.productname || product?.productName || "Product",
        imageUrl: product?.image?.url || product?.images?.[0] || product?.imageUrl || "",
        originalPrice,
        offerPrice,
        stockQuantity: Number.isFinite(numericStock) ? numericStock : 0,
    };
};

export default function AddOfferPage({ navigation, route }) {
    const { template, offerData } = route.params || {};

    const { colors } = useContext(ThemeContext);

    const [showOffers, setShowOffers] = useState(false);
    const [offerType, setOfferType] = useState("");
    const [offerTypeModalOpen, setOfferTypeModalOpen] = useState(false);
    const [authToken, setAuthToken] = useState("");
    const [merchantId, setMerchantId] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [merchantStoreSubCategory, setMerchantStoreSubCategory] = useState("");
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [offerTypeOpen, setOfferTypeOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [stars, setStars] = useState("");
    const [terms, setTerms] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bannerImage, setBannerImage] = useState(null); // local URI
    const [isBannerUploading, setIsBannerUploading] = useState(false);
    const [offerVideo, setOfferVideo] = useState(null); // local URI or remote URL
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [flaggedModalVisible, setFlaggedModalVisible] = useState(false);
    const [warningModalVisible, setWarningModalVisible] = useState(false);
    const [warningModalMessage, setWarningModalMessage] = useState("");
    const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
    const [confirmActiveModalVisible, setConfirmActiveModalVisible] = useState(false);
    const [confirmModalPlanName, setConfirmModalPlanName] = useState("");
    const [confirmModalMaxProducts, setConfirmModalMaxProducts] = useState(1);
    const [currentPlanName, setCurrentPlanName] = useState("");
    const [offerLimit, setOfferLimit] = useState(0);

    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

    const [restrictionModalVisible, setRestrictionModalVisible] = useState(false);
    const [restrictionUntil, setRestrictionUntil] = useState(null);
    const [countdownText, setCountdownText] = useState("");
    const [merchantProducts, setMerchantProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

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

    const offerTypeOptions = [
        { label: "Special", value: "Special" },
        { label: "Festival", value: "Festival" },
        { label: "Limited Time", value: "Limited Time" },
        { label: "Combo", value: "Combo" },
        { label: "Clearance", value: "Clearance" },
        { label: "Flash Sale", value: "Flash Sale" },
        { label: "Buy One Get One (BOGO)", value: "BOGO" },
        { label: "Flat Discount", value: "Flat Discount" },
        { label: "Percentage Off", value: "Percentage Off" },
        { label: "Bundle Deal", value: "Bundle Deal" },
        { label: "New Arrival Offer", value: "New Arrival Offer" },
        { label: "Weekend Offer", value: "Weekend Offer" },
        { label: "Member Exclusive", value: "Member Exclusive" },
        { label: "Seasonal Offer", value: "Seasonal Offer" },
        { label: "Happy Hour Deal", value: "Happy Hour Deal" },
        { label: "First Purchase Offer", value: "First Purchase Offer" },
        { label: "Referral Offer", value: "Referral Offer" },
        { label: "Loyalty Reward", value: "Loyalty Reward" },
        { label: "Clear Stock Sale", value: "Clear Stock Sale" },
        { label: "Free Gift Offer", value: "Free Gift Offer" },
    ];

    useEffect(() => {
        const checkRestrictionStatus = async () => {
            try {
                const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
                const merchantId = await AsyncStorage.getItem("merchantId") || "default";
                const restrictionKey = `golo_restricted_until:${merchantId}`;
                const flaggedKey = `golo_images_flagged:${merchantId}`;

                if (token) {
                    try {
                        const headers = { Authorization: `Bearer ${token}` };
                        let response = await fetch(`${BASE_URL}/users/merchant/profile`, { headers });
                        if (!response.ok && response.status === 404) {
                            response = await fetch(`${BASE_URL}/merchant/profile`, { headers });
                        }
                        if (response.ok) {
                            const data = await response.json();
                            const merchantData = data?.data || data || {};
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
                                    return;
                                }
                            }
                            setRestrictionUntil(null);
                            await AsyncStorage.removeItem(restrictionKey);
                            await AsyncStorage.removeItem(flaggedKey);
                            return;
                        }
                    } catch (err) {
                        console.warn("Failed to sync restriction from backend profile", err);
                    }
                }

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

    const clearAllFields = useCallback(() => {
        setTitle("");
        setOfferType("");
        setFromDate(null);
        setToDate(null);
        setIsDarkMode(false);
        setStars("");
        setTerms("");
        setSelectedIds([]);
        setSelectedProducts([]);
        setBannerImage(null);
        setOfferVideo(null);
        setShowOffers(false);
    }, []);

    // Prefill form if editing or reset if creating new offer
    useEffect(() => {
        const loadMerchantProfile = async () => {
            try {
                let token;
                try { token = await getValidToken(); } catch { return; }
                if (!token) return;
                let response = await authenticatedFetch(`${BASE_URL}/users/merchant/profile`);
                if (!response.ok && response.status === 404) {
                    response = await authenticatedFetch(`${BASE_URL}/merchant/profile`);
                }
                if (!response.ok) return;
                const data = await response.json();
                const merchantData = data?.data || data || {};
                setMerchantStoreSubCategory(merchantData.storeSubCategory || "");
            } catch (err) {
                console.warn("Error fetching merchant profile:", err);
            }
        };

        loadMerchantProfile();

        if (offerData) {
            setTitle(offerData.title || offerData.bannerTitle || "");
            setOfferType(offerData.offerType || offerData.bannerCategory || offerData.category || "");
            setFromDate(offerData.validFrom ? new Date(offerData.validFrom) : offerData.startDate ? new Date(offerData.startDate) : null);
            setToDate(offerData.validTo ? new Date(offerData.validTo) : offerData.endDate ? new Date(offerData.endDate) : null);
            setIsDarkMode(Boolean(offerData.loyaltyEnabled || offerData.loyaltyRewardEnabled));
            setStars((offerData.stars ?? offerData.loyaltyStarsToOffer ?? offerData.loyaltyPointsPerPurchase ?? offerData.loyaltyScorePerStar)?.toString() || "");
            setTerms(offerData.termsAndConditions || "");
            setSelectedIds(
                offerData.products?.map(p => p._id || p.id) ||
                offerData.selectedProducts?.map(p => p.productId) ||
                []
            );
            setSelectedProducts(
                Array.isArray(offerData.selectedProducts)
                    ? offerData.selectedProducts.map((product) => ({
                        _id: product?.productId || "",
                        id: product?.productId || "",
                        name: product?.productName || "Product",
                        productname: product?.productName || "Product",
                        price: Number(product?.originalPrice || 0),
                        stockQuantity: Number(product?.stockQuantity || 0),
                        image: { url: product?.imageUrl || "" },
                        images: product?.imageUrl ? [product.imageUrl] : [],
                        offerPrice: Number(product?.offerPrice || 0),
                    }))
                    : []
            );
            setBannerImage(offerData.bannerUrl || offerData.imageUrl || null);
            setOfferVideo(offerData.videoUrl || null);
        } else {
            clearAllFields();
        }
    }, [offerData, route.params?.resetKey, clearAllFields]);

    // Fetch all merchant products on page load
    useEffect(() => {
        const loadMerchantProducts = async () => {
            try {
                setLoadingProducts(true);
                let accessToken;
                try { accessToken = await getValidToken(); } catch {
                    navigation.navigate("Login");
                    return;
                }
                const storedMerchantId = await AsyncStorage.getItem("merchantId");
                if (!accessToken) {
                    navigation.navigate("Login");
                    return;
                }
                setAuthToken(accessToken);
                setMerchantId(storedMerchantId || "");

                const products = await fetchMerchantProducts({ token: accessToken, merchantId: storedMerchantId || undefined });
                setMerchantProducts(Array.isArray(products) ? products : []);
            } catch (error) {
                console.error("Failed to load merchant products:", error);
            } finally {
                setLoadingProducts(false);
            }
        };

        loadMerchantProducts();
    }, [navigation]);

    // Build selected products with real data from merchant products
    useEffect(() => {
        if (selectedIds.length === 0) {
            setSelectedProducts([]);
            return;
        }

        // Map selectedIds to actual product objects from merchantProducts
        const fallbackProducts = Array.isArray(offerData?.selectedProducts)
            ? offerData.selectedProducts
            : [];

        setSelectedProducts((prevSelectedProducts) => {
            return selectedIds
                .map((id) => {
                    const existingProduct = prevSelectedProducts.find(
                        p => p.productId === id || p._id === id || p.id === id
                    );

                    const merchantProduct = merchantProducts.find(p => p._id === id || p.id === id);
                    if (merchantProduct) {
                        const normalized = normalizeSelectedProduct(merchantProduct, offerType);
                        if (existingProduct && existingProduct.offerPrice !== undefined) {
                            normalized.offerPrice = existingProduct.offerPrice;
                        }
                        return normalized;
                    }

                    const fallbackProduct = fallbackProducts.find(
                        (product) => product?.productId === id || product?._id === id || product?.id === id
                    );

                    if (!fallbackProduct) {
                        if (existingProduct) {
                            return existingProduct;
                        }
                        return null;
                    }

                    const normalized = normalizeSelectedProduct(fallbackProduct, offerType);
                    if (existingProduct && existingProduct.offerPrice !== undefined) {
                        normalized.offerPrice = existingProduct.offerPrice;
                    }
                    return normalized;
                })
                .filter(Boolean);
        });
    }, [selectedIds, merchantProducts, offerType, offerData]);

    const handleDiscountPriceChange = (productId, value) => {
        // Strip any non-numeric and non-decimal characters
        const cleanedValue = value.replace(/[^0-9.]/g, "");

        // Handle double decimals
        const firstDecimalIndex = cleanedValue.indexOf(".");
        let finalValue = cleanedValue;
        if (firstDecimalIndex !== -1) {
            const beforeDecimal = cleanedValue.slice(0, firstDecimalIndex + 1);
            const borderAfterDecimal = cleanedValue.slice(firstDecimalIndex + 1).replace(/\./g, "");
            finalValue = beforeDecimal + borderAfterDecimal;
        }

        setSelectedProducts((prevProducts) => {
            return prevProducts.map((p) => {
                const id = p.productId || p._id || p.id;
                if (id === productId) {
                    return {
                        ...p,
                        offerPrice: finalValue,
                    };
                }
                return p;
            });
        });
    };

    // Helper to calculate active days (inclusive of both start and end date)
    const getActiveDays = () => {
        if (!fromDate || !toDate) return 0;
        const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        const diffTime = end - start;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    // Helper to calculate expiry days from today to toDate
    const getDaysUntilExpiry = () => {
        if (!toDate) return 0;
        const today = new Date();
        const todayZero = new Date(today.getTime());
        todayZero.setHours(0, 0, 0, 0);
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        const diffTime = end - todayZero;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };



    const pickBannerImage = async () => {
        if (restrictionUntil && restrictionUntil > new Date()) {
            setRestrictionModalVisible(true);
            return;
        }
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showAlert("error", "Permission Required", "Please allow access to your photo library to upload a banner.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setBannerImage(result.assets[0].uri);
                try {
                    const merchantId = await AsyncStorage.getItem("merchantId") || "default";
                    await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
                } catch (error) {
                    console.warn("Failed to clear moderation flag", error);
                }
            }
        } catch (err) {
            console.error("Image picker error:", err);
            showAlert("error", "Error", "Failed to open image picker.");
        }
    };

    const getVideoFileName = (url) => {
        if (typeof url !== "string" || !url.trim()) return null;
        const sanitizedUrl = url.split("?")[0].split("#")[0];
        const fileName = sanitizedUrl.split("/").pop();
        if (!fileName || fileName === "upload") return null;
        return fileName;
    };

    const pickOfferVideo = async () => {
        if (restrictionUntil && restrictionUntil > new Date()) {
            setRestrictionModalVisible(true);
            return;
        }
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showAlert("error", "Permission Required", "Please allow access to your photo library to upload a video.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 0.8,
                selectionLimit: 1,
                videoMaxDuration: 30,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const videoAsset = result.assets[0];
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

                setOfferVideo(videoAsset.uri);
            }
        } catch (err) {
            console.error("Video picker error:", err);
            showAlert("error", "Error", "Failed to open video picker.");
        }
    };

    const removeOfferVideo = () => {
        setOfferVideo(null);
    };

    const handleDelete = () => {
        if (!offerData) return;

        Alert.alert(
            "Delete Offer",
            "Are you sure you want to delete this offer?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: deleteOfferConfirmed }
            ]
        );
    };

    const deleteOfferConfirmed = async () => {
        try {
            setIsDeleting(true);

            let accessToken;
            try {
                accessToken = await getValidToken();
            } catch (authErr) {
                await handleAuthError(navigation);
                return;
            }
            if (!accessToken) {
                navigation.navigate("Login");
                return;
            }

            const requestId = offerData?.requestId || offerData?._id || offerData?.offerId;
            const response = await fetch(`${BASE_URL}/offers/${requestId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const responseData = await parseResponseSafely(response);
            if (!response.ok) {
                const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`;
                showAlert("error", "Delete Failed", errorMessage);
                return;
            }

            showAlert("success", "Success", "Offer deleted successfully", () => navigation.goBack());
        } catch (err) {
            showAlert("error", "Delete Failed", err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const onChange = (event, selectedDate) => {
        if (offerData) {
            setShowPicker(false);
            return;
        }
        if (event.type === "dismissed") {
            setShowPicker(false);
            return;
        }
        setShowPicker(false);

        if (activeField === "from") {
            setFromDate(selectedDate);
            if (toDate && selectedDate > toDate) setToDate(null);
        }
        if (activeField === "to") setToDate(selectedDate);
    };

    const handleSubmit = async () => {
        if (isSaving || isDeleting) return;
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        if (!title || !offerType || selectedIds.length === 0 || !fromDate || !toDate) {
            showAlert("error", "Missing Fields", "Please fill all required fields");
            return;
        }
        if (isDarkMode && !stars) {
            showAlert("error", "Points Required", "Please enter loyalty points");
            return;
        }
        if (isDarkMode && (!Number.isFinite(Number(stars)) || Number(stars) < 1 || Number(stars) > 50)) {
            showAlert("error", "Invalid Points", "Loyalty points must be between 1 and 50");
            return;
        }

        if (!offerData) {
            try {
                let accessToken;
                try {
                    accessToken = await getValidToken();
                } catch (_authErr) { /* continue without subscription check */ }
                const storedMerchantId = merchantId;

                if (accessToken && storedMerchantId) {
                    const subRes = await fetch(`${BASE_URL}/merchants/${storedMerchantId}/subscription`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    if (subRes.ok) {
                        const subData = await subRes.json();
                        const maxMonthlyOffers = subData?.planFeatures?.maxMonthlyOffers ?? 2;
                        const maxProducts = subData?.planFeatures?.maxProducts ?? -1;
                        const planName = subData?.name || "Free Tier";
                        const cycleToken = subData?.startedAt || subData?.expiresAt || subData?.assignedAt || "";
                        const cycleId = `${planName}_${cycleToken}`;

                        setCurrentPlanName(planName);
                        setOfferLimit(maxMonthlyOffers);

                        // Check active products confirmation for plan cycle
                        if (maxProducts > 0 && maxProducts !== -1) {
                            const storageKey = `active_products_selected_${storedMerchantId}`;
                            const idsKey = `active_product_ids_${storedMerchantId}`;
                            const savedCycle = await AsyncStorage.getItem(storageKey);
                            const savedIdsRaw = await AsyncStorage.getItem(idsKey);

                            let savedIds = null;
                            if (savedIdsRaw) {
                                try { savedIds = JSON.parse(savedIdsRaw); } catch (e) { }
                            }

                            const isConfirmed = (savedCycle === cycleId) && Array.isArray(savedIds);
                            const totalProducts = Array.isArray(merchantProducts) ? merchantProducts.length : 0;

                            if (!isConfirmed && totalProducts > maxProducts) {
                                setConfirmModalPlanName(planName);
                                setConfirmModalMaxProducts(maxProducts);
                                setConfirmActiveModalVisible(true);
                                return;
                            }
                        }

                        if (maxMonthlyOffers !== -1) {
                            const resOffers = await fetch(`${BASE_URL}/offers/my?page=1&limit=100`, {
                                headers: { Authorization: `Bearer ${accessToken}` },
                            });
                            if (resOffers.ok) {
                                const result = await resOffers.json();
                                const offers = Array.isArray(result) ? result : (result?.data && Array.isArray(result.data)) ? result.data : [];

                                const isActiveOffer = (item) => {
                                    const raw = item.endDate || item.validTo || item.expiresAt || item.endsAt || item.expiredAt;
                                    if (!raw) return false;
                                    const endDate = new Date(raw);
                                    if (isNaN(endDate.getTime())) return false;
                                    return endDate.getTime() > Date.now();
                                };
                                const activeOffersCount = offers.filter(isActiveOffer).length;

                                if (activeOffersCount >= maxMonthlyOffers) {
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
            return;
        }
        try {
            try {
                const storedFlag = await AsyncStorage.getItem(`golo_images_flagged:${merchantId}`);
                if (storedFlag === "true") {
                    setFlaggedModalVisible(true);
                    return;
                }
            } catch (error) {
                console.warn("Failed to read moderation flag before submit", error);
            }

            setIsSaving(true);

            let accessToken;
            try {
                accessToken = await getValidToken();
            } catch (authErr) {
                navigation.navigate("Login");
                return;
            }
            if (!accessToken) {
                navigation.navigate("Login");
                return;
            }

            // Upload banner image to Cloudinary if one was selected
            let bannerUrl = null;
            if (bannerImage) {
                if (/^https?:\/\//i.test(bannerImage)) {
                    bannerUrl = bannerImage;
                } else {
                    setIsBannerUploading(true);
                    const uploadResult = await uploadImageToCloudinary(bannerImage, "golo/offer-banners");
                    setIsBannerUploading(false);
                    if (!uploadResult.success) {
                        showAlert("error", "Upload Failed", "Could not upload banner image. Please try again.");
                        setIsSaving(false);
                        return;
                    }
                    bannerUrl = uploadResult.url;
                }
            }

            // Upload offer video to Cloudinary if one was selected
            let uploadedVideoUrl = null;
            if (offerVideo) {
                if (/^https?:\/\//i.test(offerVideo)) {
                    uploadedVideoUrl = offerVideo;
                } else {
                    setIsVideoUploading(true);
                    const videoUploadResult = await uploadVideoToCloudinary(offerVideo, "golo/offer-videos");
                    setIsVideoUploading(false);
                    if (!videoUploadResult.success) {
                        showAlert("error", "Upload Failed", "Could not upload offer video. Please try again.");
                        setIsSaving(false);
                        return;
                    }
                    uploadedVideoUrl = videoUploadResult.url;
                }
            }

            // Prepare offer payload
            const selectedDates = buildSelectedDates(fromDate, toDate);
            const selectedProductPayload = (
                selectedProducts.length > 0
                    ? selectedProducts
                    : Array.isArray(offerData?.selectedProducts)
                        ? offerData.selectedProducts
                        : []
            ).map((product) => normalizeSelectedProduct(product, offerType));

            const totalPrice = selectedProductPayload.reduce(
                (sum, product) => sum + (Number(product.offerPrice) || 0),
                0,
            );

            const payload = {
                title: title.trim(),
                // category is the offer type selected from dropdown by merchant
                category: offerType,
                // prefer explicit banner upload, otherwise use first selected product image or existing data
                imageUrl: bannerUrl || selectedProductPayload?.[0]?.imageUrl || offerData?.imageUrl || offerData?.bannerUrl || "",
                videoUrl: uploadedVideoUrl,
                selectedDates,
                totalPrice,
                loyaltyRewardEnabled: isDarkMode,
                loyaltyStarsToOffer: isDarkMode ? Number(stars) : 0,
                loyaltyStarsPerPurchase: isDarkMode ? Number(stars) : 0,
                loyaltyScorePerStar: isDarkMode ? Number(stars) : 0,
                selectedProducts: selectedProductPayload,
            };

            if (isDarkMode) {
                payload.loyaltyPointsPerPurchase = Number(stars);
            }

            if (terms?.trim()) {
                payload.termsAndConditions = terms.trim();
            }

            if (!payload.imageUrl) {
                showAlert("error", "Image Required", "Please upload an image or select a product with an image before saving this offer.");
                setIsSaving(false);
                return;
            }

            // Collect all unique candidate images for the offer
            const candidateImages = [];
            if (payload.imageUrl && typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
                candidateImages.push(payload.imageUrl.trim());
            }
            selectedProductPayload.forEach((prod) => {
                if (prod?.imageUrl && typeof prod.imageUrl === "string" && prod.imageUrl.trim()) {
                    const img = prod.imageUrl.trim();
                    if (!candidateImages.includes(img)) {
                        candidateImages.push(img);
                    }
                }
            });

            // Determine which candidate images require pre-check probing
            let imagesToProbe = [];
            if (!offerData) {
                // Create mode: backend POST natively moderates payload.imageUrl (candidateImages[0]).
                // Probe any extra product images beyond candidateImages[0].
                imagesToProbe = candidateImages.slice(1);
            } else {
                // Edit mode: backend PUT skips moderation if payload.imageUrl is unchanged.
                // Probe all images that are new / modified or differ from initial offerData.imageUrl.
                const initialUrl = offerData.imageUrl || offerData.bannerUrl || "";
                imagesToProbe = candidateImages.filter((img) => img !== initialUrl);
            }

            // Run probe POST to /offers/request for each image needing moderation pre-check
            for (const imgUrl of imagesToProbe) {
                const probePayload = {
                    title: title.trim() || "Moderation Check",
                    category: offerType || "Special",
                    imageUrl: imgUrl,
                    selectedDates: selectedDates.length ? selectedDates : [formatDateOnly(new Date())],
                    totalPrice: 0,
                    selectedProducts: [],
                };

                const probeResponse = await fetch(`${BASE_URL}/offers/request`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(probePayload),
                });

                const probeData = await parseResponseSafely(probeResponse);

                if (!probeResponse.ok) {
                    const isProbeRestricted = probeResponse.status === 403 || probeData?.code === "CONTENT_UPLOAD_RESTRICTED";
                    if (isProbeRestricted) {
                        const until = probeData?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
                        try {
                            await AsyncStorage.setItem(`golo_restricted_until:${merchantId}`, until);
                        } catch (e) { }
                        setRestrictionUntil(new Date(until));
                        setRestrictionModalVisible(true);
                        setIsSaving(false);
                        return;
                    }

                    if (isModerationWarningResponse(probeData)) {
                        const msg = getErrorMessageFromResponse(probeData);
                        setWarningModalMessage(msg || "Repeated uploads that violate GOLO's content policy may restrict your account temporarily.");
                        setWarningModalVisible(true);
                        setIsSaving(false);
                        return;
                    }

                    if (isModerationFailureResponse(probeData)) {
                        try {
                            await AsyncStorage.setItem(`golo_images_flagged:${merchantId}`, "true");
                        } catch (error) {
                            console.warn("Failed to set moderation flag during probe", error);
                        }
                        setFlaggedModalVisible(true);
                        setIsSaving(false);
                        return;
                    }

                    if (isModerationApiErrorResponse(probeData)) {
                        showAlert("error", "Moderation Unavailable", "Image moderation is temporarily unavailable. Please try again in a moment.");
                        setIsSaving(false);
                        return;
                    }
                } else {
                    // Probe passed moderation and created a temporary request — clean it up immediately
                    const probeRequestId = probeData?.data?.requestId || probeData?.requestId || null;
                    if (probeRequestId) {
                        try {
                            await fetch(`${BASE_URL}/offers/${probeRequestId}`, {
                                method: "DELETE",
                                headers: { "Authorization": `Bearer ${accessToken}` },
                            });
                        } catch (cleanupErr) {
                            console.warn("Probe cleanup failed:", cleanupErr);
                        }
                    }
                }
            }

            // Determine endpoint and method for final offer creation / update
            const method = offerData ? "PUT" : "POST";
            const requestId = offerData?.requestId || offerData?._id || offerData?.offerId;
            const endpoint = offerData
                ? `/offers/${requestId}`
                : "/offers/request";
            const fullUrl = `${BASE_URL}${endpoint}`;

            console.log("Offer API Request:", {
                url: fullUrl,
                method: method,
                hasToken: !!accessToken,
                payload: payload,
            });

            const response = await fetch(fullUrl, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const responseData = await parseResponseSafely(response);

            if (!response.ok) {
                const isRestricted = response.status === 403 || responseData?.code === "CONTENT_UPLOAD_RESTRICTED";
                if (isRestricted) {
                    const until = responseData?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
                    try {
                        await AsyncStorage.setItem(`golo_restricted_until:${merchantId}`, until);
                    } catch (error) { }
                    setRestrictionUntil(new Date(until));
                    setRestrictionModalVisible(true);
                    return;
                }

                if (isModerationWarningResponse(responseData)) {
                    const msg = getErrorMessageFromResponse(responseData);
                    setWarningModalMessage(msg || "Repeated uploads that violate GOLO's content policy may restrict your account temporarily.");
                    setWarningModalVisible(true);
                    return;
                }

                if (isModerationFailureResponse(responseData)) {
                    try {
                        await AsyncStorage.setItem(`golo_images_flagged:${merchantId}`, "true");
                    } catch (error) {
                        console.warn("Failed to set moderation flag", error);
                    }
                    setFlaggedModalVisible(true);
                    return;
                }

                if (isModerationApiErrorResponse(responseData)) {
                    showAlert("error", "Moderation Unavailable", "Image moderation is temporarily unavailable. Please try again in a moment.");
                    return;
                }

                const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`;
                showAlert("error", "Error", errorMessage);
                return;
            }

            try {
                await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`);
            } catch (error) {
                console.warn("Failed to clear moderation flag after success", error);
            }

            showAlert("success", "Success", offerData ? "Offer updated successfully" : "Offer created successfully", () => navigation.goBack());
        } catch (err) {
            console.error("Save offer error:", err);
            showAlert("error", "Save Failed", "Unable to save offer: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <Topbar />
                    <View style={styles.row1}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} style={{ padding: 10 }} />
                        </TouchableOpacity>
                        <Text style={{
                            ...textPresets.title
                        }}>
                            {offerData ? "Edit Offer" : "Add Offer"}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                    {!!authToken && (
                        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                            {loadingProducts ? (
                                <View style={{ padding: 20, justifyContent: "center", alignItems: "center" }}>
                                    <ActivityIndicator size="small" color="#157a4f" />
                                    <Text style={{
                                        color: colors.text, marginTop: 8, ...textPresets.label
                                    }}>Loading products...</Text>
                                </View>
                            ) : (
                                <Dropdown
                                    BASE_URL={BASE_URL}
                                    token={authToken}
                                    onChange={setSelectedIds}
                                    value={selectedIds}
                                />
                            )}
                        </View>
                    )}

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

                        {selectedIds.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowOffers(!showOffers)}
                                style={styles.viewSelectedBtn}>
                                <Text style={styles.viewSelectedText}>
                                    {showOffers ? "Hide Selected Products" : "View Selected Products"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showOffers && (
                            <View style={{ marginTop: 10 }}>
                                <OfferScroll
                                    products={selectedProducts}
                                    offerType={offerType}
                                    onChangeDiscountPrice={handleDiscountPriceChange}
                                />
                            </View>
                        )}

                        <Text style={styles.text}>Offer Photo</Text>

                        <TouchableOpacity
                            style={styles.card1}
                            onPress={pickBannerImage}
                            disabled={isBannerUploading || isVideoUploading}
                            activeOpacity={0.75}
                        >
                            {bannerImage ? (
                                <>
                                    <Image
                                        source={{ uri: bannerImage }}
                                        style={{ width: "100%", height: 180, borderRadius: 10 }}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.bannerOverlay}>
                                        <Feather name="edit-2" size={18} color="#fff" />
                                        <Text style={{
                                            color: "#fff", marginLeft: 6, ...textPresets.label
                                        }}>Tap to change</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Feather name="upload" size={30} color="#157a4f" />
                                    <Text style={{ color: "#157a4f", marginTop: 8, ...textPresets.label }}>Upload Banner Image</Text>
                                    <Text style={{ color: "#999", marginTop: 4, ...textPresets.label }}>Recommended: 16:9 ratio</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.text, { marginTop: 15 }]}>Offer Video (Optional)</Text>

                        <TouchableOpacity
                            style={styles.card1}
                            onPress={pickOfferVideo}
                            disabled={isVideoUploading || isBannerUploading}
                            activeOpacity={0.75}
                        >
                            {offerVideo ? (
                                <View style={{ width: "100%", height: 180, borderRadius: 10, backgroundColor: "#000", overflow: "hidden", position: "relative" }}>
                                    {/* Actual video preview — works for both local URIs and remote Cloudinary URLs */}
                                    <Video
                                        source={{ uri: offerVideo }}
                                        style={{ width: "100%", height: 180 }}
                                        resizeMode={ResizeMode.COVER}
                                        isLooping
                                        isMuted
                                        shouldPlay
                                        useNativeControls={false}
                                    />
                                    {/* Semi-transparent overlay with action buttons */}
                                    <View style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        backgroundColor: "rgba(0,0,0,0.45)",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        paddingVertical: 8,
                                        gap: 12,
                                    }}>
                                        <TouchableOpacity
                                            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                                            onPress={pickOfferVideo}
                                        >
                                            <Feather name="edit-2" size={14} color="#fff" />
                                            <Text style={{ color: "#fff", marginLeft: 4, ...textPresets.caption }}>Tap to Change</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#d32a2aff", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                                            onPress={removeOfferVideo}
                                        >
                                            <Feather name="trash-2" size={14} color="#ffffffff" />
                                            <Text style={{ color: "#ffffffff", marginLeft: 4, ...textPresets.caption }}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <Feather name="video" size={30} color="#157a4f" />
                                    <Text style={{ color: "#157a4f", marginTop: 8, ...textPresets.label }}>Upload Offer Video</Text>
                                    <Text style={{ color: "#999", marginTop: 4, ...textPresets.label }}>Recommended: MP4 format, up to 30s</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.text, { color: colors.text }]}>Offer Title</Text>
                        <TextInput
                            placeholder="Enter Offer Title"
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.text}>Offer Type</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 15 }]}
                            onPress={() => setOfferTypeModalOpen(true)}
                        >
                            <Text style={{
                                color: offerType ? "#000" : "#999", ...textPresets.body
                            }}>
                                {offerType ? offerTypeOptions.find(opt => opt.value === offerType)?.label : "Select offer type"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#333" />
                        </TouchableOpacity>

                        <Modal
                            visible={offerTypeModalOpen}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setOfferTypeModalOpen(false)}
                            statusBarTranslucent
                        >
                            <TouchableWithoutFeedback onPress={() => setOfferTypeModalOpen(false)}>
                                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                                    <View style={{ backgroundColor: "#fff", borderRadius: 15, width: "85%", maxHeight: "50%", paddingVertical: 20 }}>
                                        <Text style={{
                                            ...textPresets.subtitle, marginBottom: 15, paddingHorizontal: 20, color: "#157a4f"
                                        }}>
                                            Select Offer Type
                                        </Text>
                                        <FlatList
                                            data={offerTypeOptions}
                                            keyExtractor={(item) => item.value}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={{
                                                        paddingVertical: 15,
                                                        paddingHorizontal: 20,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: "#eee",
                                                        backgroundColor: offerType === item.value ? "#ecfdf5" : "#fff",
                                                    }}
                                                    onPress={() => {
                                                        setOfferType(item.value);
                                                        setOfferTypeModalOpen(false);
                                                    }}
                                                >
                                                    <Text style={{ ...textPresets.body, color: offerType === item.value ? "#157a4f" : colors.text }}>
                                                        {item.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>

                        <Text style={[styles.text, { color: colors.text }]}>Offer Validity</Text>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.dateCard, offerData && { opacity: 0.6, backgroundColor: "#f2f2f2" }]}
                                onPress={() => { if (offerData) return; setActiveField("from"); setShowPicker(true); }}
                                disabled={Boolean(offerData)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={offerData ? "#888" : "#157a4f"} />
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={styles.dateLabel}>STARTS</Text>
                                    <Text style={[styles.dateValue, offerData && { color: colors.subtext || "#888" }]}>
                                        {fromDate ? fromDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select date"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateCard, offerData && { opacity: 0.6, backgroundColor: "#f2f2f2" }]}
                                onPress={() => { if (offerData) return; setActiveField("to"); setShowPicker(true); }}
                                disabled={Boolean(offerData)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={offerData ? "#888" : "#157a4f"} />
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={styles.dateLabel}>ENDS</Text>
                                    <Text style={[styles.dateValue, offerData && { color: colors.subtext || "#888" }]}>
                                        {toDate ? toDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select date"}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {offerData && (
                            <Text style={{ color: colors.subtext || "#6b7280", marginTop: 6, ...textPresets.caption }}>
                                * Validity dates cannot be modified after offer creation.
                            </Text>
                        )}

                        {fromDate && toDate && (
                            <View style={styles.validitySummary}>
                                <View style={styles.summaryItem}>
                                    <MaterialIcons name="date-range" size={18} color="#157a4f" />
                                    <Text style={styles.summaryText}>
                                        Active Days: <Text style={styles.summaryText}>{getActiveDays()} {getActiveDays() === 1 ? "day" : "days"}</Text>
                                    </Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <MaterialIcons name="timer" size={18} color="#e53935" />
                                    <Text style={styles.summaryText}>Promotion Expiry:
                                        {getDaysUntilExpiry() > 1 ? (
                                            ` Offer ends in ${getDaysUntilExpiry()} days`
                                        ) : getDaysUntilExpiry() === 1 ? (
                                            " Offer ends in 1 day"
                                        ) : getDaysUntilExpiry() === 0 ? (
                                            " Offer ends today"
                                        ) : (
                                            " Offer expired"
                                        )}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {showPicker && (
                            <DateTimePicker
                                value={activeField === "from" ? fromDate || new Date() : toDate || fromDate || new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                minimumDate={activeField === "to" ? fromDate : new Date()}
                                onChange={onChange}
                            />
                        )}

                        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 10 }}>
                            <Text style={{
                                color: colors.text, ...textPresets.body,
                            }}>Loyalty Reward</Text>
                            <Switch
                                value={isDarkMode}
                                onValueChange={(value) => {
                                    if (offerData) return; // Prevent toggling when editing
                                    setIsDarkMode(value);
                                    if (!value) {
                                        setStars("");
                                    }
                                }}
                                disabled={!!offerData}
                                thumbColor={isDarkMode ? "#157a4f" : "#f4f3f4"}
                                trackColor={{ false: "#ccc", true: "#141414" }}
                                ios_backgroundColor="#ccc"
                                style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10, opacity: offerData ? 0.5 : 1 }}
                            />
                            {offerData && isDarkMode ? (
                                <Text style={{ color: "#6b7280", marginLeft: 8, ...textPresets.label }}>Locked</Text>
                            ) : null}
                        </View>

                        {isDarkMode && (
                            <>
                                <Text style={[styles.text, { color: colors.text }]}>Loyalty Points (1-50)</Text>
                                <TextInput
                                    placeholder="Enter loyalty points"
                                    keyboardType="numeric"
                                    value={stars}
                                    onChangeText={(value) => {
                                        if (offerData) return; // Prevent editing when in edit mode
                                        const num = value.replace(/[^0-9]/g, "");
                                        if (num === "" || Number(num) <= 50) setStars(num);
                                    }}
                                    editable={!offerData}
                                    style={[styles.input, offerData ? { backgroundColor: "#e5e3df", color: "#999" } : {}]}
                                />
                                {offerData ? (
                                    <Text style={{ color: "#6b7280", marginTop: 4, ...textPresets.label }}>
                                        Loyalty points cannot be changed after offer creation.
                                    </Text>
                                ) : null}
                            </>
                        )}

                        <Text style={[styles.text, { color: colors.text }]}>Terms and Conditions</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 40, maxHeight: 150 }]}
                            placeholder="Enter T & C"
                            multiline
                            scrollEnabled
                            textAlignVertical="top"
                            value={terms}
                            onChangeText={setTerms}
                        />

                        {/* Buttons Row */}
                        <View style={{ flexDirection: "row", marginTop: 20, justifyContent: "space-between" }}>
                            <TouchableOpacity
                                style={[styles.rowButton, (isSaving || isBannerUploading || isVideoUploading) && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={isSaving || isDeleting || isBannerUploading || isVideoUploading}
                            >
                                <MaterialIcons name="check-circle" size={20} color="#fff" />
                                <Text style={{
                                    color: "#fff",
                                    lineHeight: Math.round(14 * 1.5),
                                    ...textPresets.body
                                }}>
                                    {isVideoUploading ? "Uploading Video..." : isBannerUploading ? "Uploading Image..." : isSaving ? (offerData ? "Updating..." : "Saving...") : offerData ? "Update Offer" : "Add Offer"}
                                </Text>
                            </TouchableOpacity>


                            {!offerData &&
                                <TouchableOpacity style={[styles.rowButton, { backgroundColor: "#e93c3c" }]}
                                    onPress={clearAllFields} >
                                    <MaterialIcons name="cancel" size={20} color="#fff" />
                                    <Text style={{ color: "white", lineHeight: Math.round(14 * 1.5), ...textPresets.body }}>Discard</Text>
                                </TouchableOpacity>
                            }

                            {offerData && (
                                <TouchableOpacity
                                    style={[styles.rowButton, { backgroundColor: "#e53935" }, isDeleting && { opacity: 0.6 }]}
                                    onPress={handleDelete}
                                    disabled={isSaving || isDeleting} >
                                    <Text style={{ color: "#fff", lineHeight: Math.round(14 * 1.5), ...textPresets.body }}>
                                        {isDeleting ? "Deleting..." : "Delete Offer"}
                                    </Text>
                                </TouchableOpacity>
                            )}

                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>

            <SafeAreaView edges={["bottom"]} style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>

            {/* Moderation restriction countdown modal */}
            <Modal
                visible={restrictionModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { }}
                statusBarTranslucent >
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
                            activeOpacity={0.85}  >
                            <Text style={styles.flaggedButtonText}>I Understand, Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={flaggedModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFlaggedModalVisible(false)}
                statusBarTranslucent >
                <View style={styles.flaggedOverlay}>
                    <View style={styles.flaggedCard}>
                        <View style={styles.flaggedHeaderRow}>
                            <View style={styles.flaggedHeaderTextWrap}>
                                <View style={styles.flaggedHeaderIconCircle}>
                                    <Feather name="alert-triangle" size={14} color="#d92d20" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.flaggedHeaderTitle}>Inappropriate Content</Text>
                                    <Text style={styles.flaggedHeaderSubtitle}>
                                        Your image has been flagged by our safety system.
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
                            One or more of your uploaded images contains content that violates our community
                            guidelines. Please remove the inappropriate images and try posting again.
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
                            {currentPlanName || "Free Tier"} merchants can only add up to {offerLimit} offers. Please upgrade to a higher plan.
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

            {/* Confirm Active Products Required Modal */}
            <Modal
                visible={confirmActiveModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmActiveModalVisible(false)}
                statusBarTranslucent
            >
                <View style={styles.upgradeModalOverlay}>
                    <View style={styles.upgradeModalCard}>
                        <TouchableOpacity
                            style={styles.upgradeModalCloseButton}
                            onPress={() => setConfirmActiveModalVisible(false)}
                        >
                            <Feather name="x" size={20} color="#9ca3af" />
                        </TouchableOpacity>

                        <View style={[styles.upgradeModalIconCircle, { backgroundColor: "#e6f4ea" }]}>
                            <MaterialCommunityIcons name="tag-check-outline" size={32} color="#157a4f" />
                        </View>

                        <Text style={styles.upgradeModalTitle}>Confirm Active Products First</Text>

                        <Text style={styles.upgradeModalDescription}>
                            Under your <Text style={{ color: "#157a4f" }}>{confirmModalPlanName || "Subscription Plan"}</Text> ({confirmModalMaxProducts} active product limit), please select and confirm your active products on the Product List page before creating an offer.
                        </Text>

                        <View style={styles.upgradeModalActionsRow}>
                            <TouchableOpacity
                                style={styles.upgradeModalSecondaryButton}
                                onPress={() => setConfirmActiveModalVisible(false)}
                            >
                                <Text style={styles.upgradeModalSecondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.upgradeModalPrimaryButton}
                                onPress={() => {
                                    setConfirmActiveModalVisible(false);
                                    navigation.navigate("ProductListPage");
                                }}
                            >
                                <Text style={styles.upgradeModalPrimaryButtonText}>Go to Product List</Text>
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
    row1: { alignItems: "center", flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 },
    text: { paddingTop: 20, ...textPresets.body },
    input: { backgroundColor: "#e6e6e6", padding: 12, borderRadius: 10, ...textPresets.body },
    button: { backgroundColor: "#f5b849", borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 6, borderColor: "#b9b9b9", borderWidth: 1, marginTop: 20 },
    dateBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#ccc", borderRadius: 10, paddingHorizontal: 10 },
    rowButton: {
        width: "48%",
        backgroundColor: "#157a4f",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        flexDirection: "row",
        gap: 4
    },
    card1: {
        backgroundColor: "#f3f1ec",
        borderWidth: 1,
        borderColor: "#c8c8c8",
        borderRadius: 10,
        minHeight: 180,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    bannerOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
    },
    viewSelectedBtn: {
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        borderColor: "#157a4f",
        borderWidth: 1.5,
        backgroundColor: "#fff",
        alignItems: "center",
    },
    viewSelectedText: {
        ...textPresets.body,
        color: "#157a4f",
    },
    dateBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: "#e0e0e0" },
    dateCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e6e6e6",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    dateLabel: {
        color: "#5e5e5e",
        ...textPresets.label,
    },
    dateValue: {
        ...textPresets.label,
        color: "#111",
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
    validitySummary: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
        justifyContent: "space-around",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    summaryItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
        gap: 3
    },
    summaryText: {
        ...textPresets.label,
        color: "#333",
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
        ...textPresets.subtitle
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
        color: "#ffffff",
        ...textPresets.label
    },
});