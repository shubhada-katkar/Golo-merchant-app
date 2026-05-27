import React, { useContext, useState, useEffect } from "react";
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
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary } from "../services/cloudinaryService";
import { BASE_URL } from "../config";

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

    return {
        productId: product?._id || product?.id || product?.productId || "",
        productName: product?.name || product?.productname || product?.productName || "Product",
        imageUrl: product?.image?.url || product?.images?.[0] || product?.imageUrl || "",
        originalPrice,
        offerPrice: Number(product?.offerPrice ?? calculateOfferPrice(originalPrice, offerType)),
        stockQuantity: Number(product?.stockQuantity || 0),
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

    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [merchantProducts, setMerchantProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

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
        { label: "Loyalty Reward", value: "Loyalty Reward" },
        { label: "Custom Offer", value: "Custom Offer" },
    ];

    // Prefill form if editing
    useEffect(() => {
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
        }
    }, [offerData]);

    // Fetch all merchant products on page load
    useEffect(() => {
        const loadMerchantProducts = async () => {
            try {
                setLoadingProducts(true);
                const accessToken = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
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

        const selectedProds = selectedIds
            .map((id) => {
                const merchantProduct = merchantProducts.find(p => p._id === id || p.id === id);
                if (merchantProduct) {
                    return normalizeSelectedProduct(merchantProduct, offerType);
                }

                const fallbackProduct = fallbackProducts.find(
                    (product) => product?.productId === id || product?._id === id || product?.id === id
                );

                if (!fallbackProduct) {
                    return null;
                }

                return normalizeSelectedProduct(fallbackProduct, offerType);
            })
            .filter(Boolean);

        setSelectedProducts(selectedProds);
    }, [selectedIds, merchantProducts, offerData]);

    const clearAllFields = () => {
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
    };

    const pickBannerImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Please allow access to your photo library to upload a banner.");
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
            }
        } catch (err) {
            console.error("Image picker error:", err);
            Alert.alert("Error", "Failed to open image picker.");
        }
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

            const accessToken = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
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
                alert("Delete failed: " + errorMessage);
                return;
            }

            alert("Offer deleted successfully");
            navigation.goBack();
        } catch (err) {
            alert("Delete failed: " + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const onChange = (event, selectedDate) => {
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
        if (!title || !offerType || selectedIds.length === 0 || !fromDate || !toDate) {
            alert("Please fill all required fields");
            return;
        }
        if (isDarkMode && !stars) {
            alert("Please enter loyalty points");
            return;
        }
        if (isDarkMode && (!Number.isFinite(Number(stars)) || Number(stars) < 1 || Number(stars) > 50)) {
            alert("Loyalty points must be between 1 and 50");
            return;
        }

        try {
            setIsSaving(true);

            const accessToken = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
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
                        Alert.alert("Upload Failed", "Could not upload banner image. Please try again.");
                        setIsSaving(false);
                        return;
                    }
                    bannerUrl = uploadResult.url;
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
                category: offerType,
                imageUrl: bannerUrl || offerData?.imageUrl || offerData?.bannerUrl || "",
                selectedDates,
                totalPrice,
                loyaltyRewardEnabled: isDarkMode,
                loyaltyStarsToOffer: isDarkMode ? 1 : 0,
                loyaltyStarsPerPurchase: isDarkMode ? 1 : 0,
                loyaltyScorePerStar: isDarkMode ? Number(stars) : 0,
                loyaltyPointsPerPurchase: isDarkMode ? Number(stars) : 0,
                selectedProducts: selectedProductPayload,
            };

            if (terms?.trim()) {
                payload.termsAndConditions = terms.trim();
            }

            if (!payload.imageUrl) {
                Alert.alert("Banner Required", "Please upload a banner image before saving this offer.");
                setIsSaving(false);
                return;
            }

            // Determine endpoint and method
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
                const errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}`;
                alert("Error: " + errorMessage);
                return;
            }

            alert(offerData ? "Offer updated successfully" : "Offer created successfully");
            navigation.goBack();
        } catch (err) {
            console.error("Save offer error:", err);
            alert("Unable to save offer: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <Topbar />
                    <View style={styles.row1}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{ padding: 10 }} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>
                            {offerData ? "Edit Offer" : "Add Offer"}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                    {!!authToken && (
                        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                            {loadingProducts ? (
                                <View style={{ padding: 20, justifyContent: "center", alignItems: "center" }}>
                                    <ActivityIndicator size="small" color="#157a4f" />
                                    <Text style={{ color: colors.text, marginTop: 8 }}>Loading products...</Text>
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

                    {selectedIds.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setShowOffers(!showOffers)}
                            style={{
                                marginHorizontal: 16,
                                marginTop: 12,
                                padding: 6,
                                borderRadius: 10,
                                borderColor: "#000000",
                                borderWidth: 1,
                                backgroundColor: "#f8f6f2",
                                alignItems: "center"
                            }}>
                            <Text style={{ fontSize: 16 }}>
                                {showOffers ? "Hide Selected Products" : "View Selected Products"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {showOffers && (
                        <View style={{ marginTop: 10 }}>
                            <OfferScroll products={selectedProducts} offerType={offerType} />
                        </View>
                    )}

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
                        <Text style={[styles.text, { color: colors.text }]}>Offer Title</Text>
                        <TextInput
                            placeholder="Enter Offer Title"
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                        />


                        <Text style={[styles.text, { color: colors.text }]}>Offer Banner</Text>

                        <TouchableOpacity
                            style={styles.card1}
                            onPress={pickBannerImage}
                            disabled={isBannerUploading}
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
                                        <Text style={{ color: "#fff", fontSize: 13, marginLeft: 6 }}>Tap to change</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Feather name="upload" size={30} color="#157a4f" />
                                    <Text style={{ color: "#157a4f", fontWeight: "600", marginTop: 8 }}>Upload Banner Image</Text>
                                    <Text style={{ color: "#999", fontSize: 12, marginTop: 4 }}>Recommended: 16:9 ratio</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.text, { color: colors.text }]}>Offer Type</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 15 }]}
                            onPress={() => setOfferTypeModalOpen(true)}
                        >
                            <Text style={{ fontSize: 16, color: offerType ? "#000" : "#999" }}>
                                {offerType ? offerTypeOptions.find(opt => opt.value === offerType)?.label : "Select offer type"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#333" />
                        </TouchableOpacity>

                        <Modal
                            visible={offerTypeModalOpen}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setOfferTypeModalOpen(false)}
                        >
                            <TouchableWithoutFeedback onPress={() => setOfferTypeModalOpen(false)}>
                                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                                    <View style={{ backgroundColor: "#fff", borderRadius: 15, width: "85%", maxHeight: "40%", paddingVertical: 20 }}>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, paddingHorizontal: 20, color: colors.text }}>
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
                                                    <Text style={{ fontSize: 16, color: offerType === item.value ? "#157a4f" : colors.text, fontWeight: offerType === item.value ? "bold" : "normal" }}>
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
                            <View style={styles.dateBox}>
                                <TextInput
                                    placeholder="From"
                                    value={fromDate ? fromDate.toLocaleDateString() : ""}
                                    editable={false}
                                    style={[styles.input, { flex: 1 }]}
                                />
                                <TouchableOpacity onPress={() => { setActiveField("from"); setShowPicker(true); }}>
                                    <Ionicons name="calendar-outline" size={22} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateBox}>
                                <TextInput
                                    placeholder="To"
                                    value={toDate ? toDate.toLocaleDateString() : ""}
                                    editable={false}
                                    style={[styles.input, { flex: 1 }]}
                                />
                                <TouchableOpacity onPress={() => { setActiveField("to"); setShowPicker(true); }}>
                                    <Ionicons name="calendar-outline" size={22} />
                                </TouchableOpacity>
                            </View>
                        </View>

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
                            <Text style={{ fontSize: 18, color: colors.text }}>Loyalty Reward</Text>
                            <Switch
                                value={isDarkMode}
                                onValueChange={(value) => {
                                    setIsDarkMode(value);
                                    if (!value) {
                                        setStars("");
                                    }
                                }}
                                thumbColor={isDarkMode ? "#157a4f" : "#f4f3f4"}
                                trackColor={{ false: "#ccc", true: "#141414" }}
                                ios_backgroundColor="#ccc"
                                style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10 }}
                            />
                        </View>

                        {isDarkMode && (
                            <>
                                <Text style={[styles.text, { color: colors.text }]}>Loyalty Points (1-50)</Text>
                                <TextInput
                                    placeholder="Enter loyalty points"
                                    keyboardType="numeric"
                                    value={stars}
                                    onChangeText={(value) => {
                                        const num = value.replace(/[^0-9]/g, "");
                                        if (num === "" || Number(num) <= 50) setStars(num);
                                    }}
                                    style={styles.input}
                                />
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
                                style={[styles.rowButton, (isSaving || isBannerUploading) && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={isSaving || isDeleting || isBannerUploading}
                            >
                                <Text style={{ color: "#fff", fontSize: 16 }}>
                                    {isBannerUploading ? "Uploading banner..." : isSaving ? (offerData ? "Updating..." : "Saving...") : offerData ? "Update Offer" : "Add Offer"}
                                </Text>
                            </TouchableOpacity>

                            {offerData && (
                                <TouchableOpacity
                                    style={[styles.rowButton, { backgroundColor: "#e53935" }, isDeleting && { opacity: 0.6 }]}
                                    onPress={handleDelete}
                                    disabled={isSaving || isDeleting}
                                >
                                    <Text style={{ color: "#fff", fontSize: 16 }}>
                                        {isDeleting ? "Deleting..." : "Delete Offer"}
                                    </Text>
                                </TouchableOpacity>
                            )}

                        </View>

                        <TouchableOpacity onPress={clearAllFields} style={{ marginTop: 12, alignItems: "center" }}>
                            <Text style={{ color: "red", fontSize: 18 }}>Clear All</Text>
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
    row1: { alignItems: "center", flexDirection: "row", paddingVertical: 8, paddingHorizontal: 14 },
    text: { fontSize: 18, paddingTop: 18 },
    input: { fontSize: 16, backgroundColor: "#ccc", padding: 10, borderRadius: 10 },
    button: { backgroundColor: "#f5b849", borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 6, borderColor: "#b9b9b9", borderWidth: 1, marginTop: 20 },
    dateBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#ccc", borderRadius: 10, paddingHorizontal: 10 },
    rowButton: {
        flex: 1,
        backgroundColor: "#f5b849",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        marginHorizontal: 5,
        borderColor: "#b9b9b9",
        borderWidth: 1,
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
});
