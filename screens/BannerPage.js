import React, { useState, useContext, useCallback, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image, ScrollView, Alert, TextInput, Platform, ActivityIndicator } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Calendar } from "react-native-calendars";
import { Modal } from "react-native";
import { uploadImageToCloudinary } from "../services/cloudinaryService";
import { textPresets } from "../theme/typography";

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

function isModerationFailureResponse(data) {
    const message = getErrorMessageFromResponse(data)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const rejectionPhrases = [
        "one or more images contain inappropriate content and cannot be uploaded",
        "the uploaded video contains inappropriate content and cannot be published",
    ];

    return rejectionPhrases.some((phrase) => message.includes(phrase));
}

// Hardcoded for now — swap in real list later
const BANNER_CATEGORIES = ["Food & Restaurants",
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
    "Local Businesses & Vendors",];

// Hardcoded pricing
const RATE_PER_DAY = 240;
const PLATFORM_FEE = 0;

/**
 * Normalize a Date object or ISO date string from the backend
 * into a "YYYY-MM-DD" calendar key suitable for the date picker.
 */
const toDateKey = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function BannerPage({ navigation, route }) {
    const { colors } = useContext(ThemeContext);

    // ── Edit mode ──────────────────────────────────────────────
    const editData = route?.params?.editData || null;
    const isEditMode = Boolean(editData);
    const editRequestId = editData?.requestId || editData?._id || null;

    const [bannerTitle, setBannerTitle] = useState("");
    const [category, setCategory] = useState(BANNER_CATEGORIES[0]);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [bannerImage, setBannerImage] = useState(null);

    const [selectedDates, setSelectedDates] = useState([]); // array of "YYYY-MM-DD" strings
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [flaggedModalVisible, setFlaggedModalVisible] = useState(false);
    const [isFetchingEdit, setIsFetchingEdit] = useState(false);

    // ── Pre-populate form when editing ─────────────────────────
    useEffect(() => {
        if (!isEditMode || !editData) return;

        // Title
        if (editData.bannerTitle) setBannerTitle(editData.bannerTitle);

        // Category
        if (editData.bannerCategory && BANNER_CATEGORIES.includes(editData.bannerCategory)) {
            setCategory(editData.bannerCategory);
        }

        // Image
        if (editData.imageUrl) setBannerImage(editData.imageUrl);

        // Dates – backend stores as Date[] (ISO strings); normalise to "YYYY-MM-DD" keys
        const rawDates = Array.isArray(editData.selectedDates) ? editData.selectedDates : [];
        const dateKeys = rawDates
            .map(toDateKey)
            .filter(Boolean)
            .sort();
        // Deduplicate
        setSelectedDates([...new Set(dateKeys)]);
    }, [isEditMode]); // only run once on mount if editing

    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const formatDateLabel = (key) => {
        const [y, m, d] = key.split("-");
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const handlePickImage = useCallback(async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Please allow access to your photos to upload a banner.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            setBannerImage(result.assets[0].uri);
            // Clear flagged marker when user uploads a new image
            try { await AsyncStorage.removeItem('golo_images_flagged'); } catch (e) { }
        }
    }, []);

    const toggleDate = useCallback((key) => {
        setSelectedDates((prev) =>
            prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key].sort()
        );
    }, []);

    const removeDate = useCallback((key) => {
        setSelectedDates((prev) => prev.filter((d) => d !== key));
    }, []);

    const selectedDaysCount = selectedDates.length;
    const subtotal = RATE_PER_DAY * selectedDaysCount;
    const totalPayable = subtotal + PLATFORM_FEE;

    const handleSubmit = async () => {
        if (!bannerTitle.trim()) {
            Alert.alert("Missing title", "Please enter a banner title.");
            return;
        }
        if (!bannerImage) {
            Alert.alert("Missing image", "Please upload a banner image.");
            return;
        }
        if (selectedDaysCount === 0) {
            Alert.alert("No dates selected", "Please select at least one visibility date.");
            return;
        }
        if (!BASE_URL) {
            Alert.alert("Configuration error", "API base URL is not configured.");
            return;
        }

        // Check if image was flagged from a previous submission
        try {
            const storedFlag = await AsyncStorage.getItem("golo_images_flagged");
            if (storedFlag === "true") {
                setFlaggedModalVisible(true);
                return;
            }
        } catch (error) {
            console.warn("Failed to read moderation flag before submit", error);
        }

        try {
            setIsSubmitting(true);
            let imageUrl = bannerImage;

            if (!/^https?:\/\//i.test(bannerImage)) {
                setIsUploadingImage(true);
                const uploadResult = await uploadImageToCloudinary(bannerImage, "golo/banner-promotions");
                setIsUploadingImage(false);
                if (!uploadResult.success) {
                    Alert.alert("Upload failed", uploadResult.message || "Could not upload banner image.");
                    return;
                }
                imageUrl = uploadResult.url;
            }

            const token = (await AsyncStorage.getItem("merchantToken")) || (await AsyncStorage.getItem("accessToken"));
            if (!token) {
                Alert.alert("Login required", "Please log in again to continue.");
                return;
            }

            // ── Edit mode → PUT, Create mode → POST ───────────
            const url = isEditMode
                ? `${BASE_URL}/banners/promotions/${editRequestId}`
                : `${BASE_URL}/banners/promotions/request`;

            const method = isEditMode ? "PUT" : "POST";

            const bodyPayload = isEditMode
                ? {
                    bannerTitle: bannerTitle.trim(),
                    bannerCategory: category,
                    imageUrl,
                    selectedDates,
                    recommendedSize: "1920 x 520 px",
                }
                : {
                    bannerTitle: bannerTitle.trim(),
                    bannerCategory: category,
                    imageUrl,
                    selectedDates,
                    totalPrice: totalPayable,
                    dailyRate: RATE_PER_DAY,
                    platformFee: PLATFORM_FEE,
                    recommendedSize: "1920 x 520 px",
                };

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyPayload),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                // Check if this is a moderation failure
                const isModerationError = isModerationFailureResponse(payload);

                if (isModerationError) {
                    try {
                        await AsyncStorage.setItem('golo_images_flagged', 'true');
                    } catch (e) {
                        console.warn('Failed to set flagged marker', e);
                    }
                    setFlaggedModalVisible(true);
                    return;
                }

                throw new Error(payload?.message || (isEditMode ? "Unable to update banner right now." : "Unable to submit banner request right now."));
            }

            Alert.alert(
                isEditMode ? "Banner updated" : "Request submitted",
                isEditMode
                    ? "Your banner promotion has been updated successfully."
                    : "Your banner promotion request has been sent for review."
            );
            // Clear the moderation flag since submission succeeded
            try { await AsyncStorage.removeItem("golo_images_flagged"); } catch (e) { }
            navigation.navigate("BannerList");
        } catch (error) {
            Alert.alert("Submission failed", error?.message || "Please try again.");
        } finally {
            setIsSubmitting(false);
            setIsUploadingImage(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{
                    flex: 1, ...textPresets.title
                }}>{isEditMode ? "Edit Banner" : "Promote Banner"}</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

                {/* Form card */}
                <View style={styles.card}>

                    <Text style={[styles.label, { color: colors.subtext }]}>BANNER TITLE</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                        placeholder="Enter banner title"
                        placeholderTextColor={colors.subtext}
                        value={bannerTitle}
                        onChangeText={setBannerTitle}
                    />

                    <Text style={[styles.label, { marginTop: 18 }]}>BANNER CATEGORY</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dropdown]}
                        onPress={() => setCategoryOpen((prev) => !prev)}
                    >
                        <Text style={{ ...textPresets.body }}>{category}</Text>
                        <Feather name={categoryOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.subtext} />
                    </TouchableOpacity>
                    {categoryOpen && (
                        <View style={[styles.dropdownList, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                            {BANNER_CATEGORIES.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setCategory(item);
                                        setCategoryOpen(false);
                                    }}
                                >
                                    <Text style={{ ...textPresets.body }}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.label, { color: colors.subtext, marginTop: 18 }]}>UPLOAD BANNER</Text>
                    <TouchableOpacity
                        style={[styles.uploadBox, { borderColor: colors.border }]}
                        onPress={handlePickImage}
                        activeOpacity={0.7} >
                        {bannerImage ? (
                            <Image source={{ uri: bannerImage }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            <>
                                <View style={[styles.uploadIconCircle, { backgroundColor: colors.successLight || "#e3f3ea" }]}>
                                    <Feather name="upload" size={20} color={colors.success || "#157a4f"} />
                                </View>
                                <Text style={styles.uploadTitle}>Click to upload banner image</Text>
                                <Text style={styles.uploadSubtitle}>
                                    Recommended 1920 x 520 px (ratio ~3.7:1), max 5MB
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Promotion dates card */}
                <View style={styles.card}>
                    <View style={styles.datesHeaderRow}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Promotion Dates</Text>
                        <TouchableOpacity
                            style={[styles.addDateBtn, { backgroundColor: colors.success || "#157a4f" }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Feather name="plus" size={16} color="#fff" />
                            <Text style={styles.addDateBtnText}>Add date</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedDaysCount === 0 ? (
                        <Text style={[styles.noDatesText, { color: colors.subtext }]}>
                            Tap "Add date" to choose visibility dates.
                        </Text>
                    ) : (
                        <View style={styles.chipsWrap}>
                            {selectedDates.map((key) => (
                                <View key={key} style={[styles.chip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                    <Text style={{ ...textPresets.label }}>{formatDateLabel(key)}</Text>
                                    <TouchableOpacity onPress={() => removeDate(key)} style={{ marginLeft: 6 }}>
                                        <Feather name="x" size={14} color={colors.subtext} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.selectedDaysSummary, { color: colors.text }]}>
                        Total selected dates: <Text style={{ fontFamily: "Bold" }}>{selectedDaysCount}</Text>
                    </Text>

                    <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                        statusBarTranslucent
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalCard, { backgroundColor: colors.inputBackground }]}>
                                <Calendar
                                    minDate={formatDateKey(new Date())}
                                    markedDates={selectedDates.reduce((acc, key) => {
                                        acc[key] = { selected: true, selectedColor: colors.success || "#157a4f" };
                                        return acc;
                                    }, {})}
                                    onDayPress={(day) => toggleDate(day.dateString)}
                                    theme={{
                                        todayTextColor: colors.success || "#157a4f",
                                        arrowColor: colors.success || "#157a4f",
                                    }}
                                />
                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: colors.success || "#157a4f", marginTop: 12 }]}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <Text style={styles.submitBtnText}>Done ({selectedDaysCount} selected)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                {/* Pricing summary card */}
                <View style={styles.card}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Pricing Summary</Text>

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.subtext }]}>Rate per day</Text>
                        <Text style={[styles.priceValue, { color: colors.text }]}>Rs. {RATE_PER_DAY}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.subtext }]}>Selected days</Text>
                        <Text style={[styles.priceValue, { color: colors.text }]}>{selectedDaysCount}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.subtext }]}>Subtotal</Text>
                        <Text style={[styles.priceValue, { color: colors.text }]}>Rs. {subtotal}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.subtext }]}>Platform fee</Text>
                        <Text style={[styles.priceValue, { color: colors.text }]}>Rs. {PLATFORM_FEE}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider, marginTop: 6 }]} />

                    <View style={[styles.priceRow, { marginTop: 10 }]}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Payable</Text>
                        <Text style={[styles.totalValue, { color: colors.success || "#157a4f" }]}>Rs. {totalPayable}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: colors.success || "#157a4f", opacity: isSubmitting || isUploadingImage ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || isUploadingImage}
                    >
                        {isSubmitting || isUploadingImage ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>{isEditMode ? "Update Banner" : "Submit For Approval"}</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.footnote, { color: colors.subtext }]}>
                        Request status will be shown in Banner Promotions list as Under Review, Rejected, or Approved. Pay option appears after approval.
                    </Text>
                </View>

            </ScrollView>

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
    card: {
        marginHorizontal: 18,
        marginTop: 16,
        borderRadius: 14,
        padding: 16,
        backgroundColor: "#fff",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
    },
    cardTitle: {
        ...textPresets.subtitle,
        marginBottom: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
    },
    modalCard: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 14,
    },
    label: {
        ...textPresets.label,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        ...textPresets.body,
    },
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 6,
        overflow: "hidden",
    },
    dropdownItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    uploadBox: {
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: 14,
        paddingVertical: 30,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    uploadIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    uploadTitle: {
        textAlign: "center",
        marginBottom: 6,
        ...textPresets.body,
    },
    uploadSubtitle: {
        ...textPresets.caption,
        textAlign: "center",
    },
    previewImage: {
        width: "100%",
        height: 140,
        borderRadius: 10,
    },
    datesHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    addDateBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    addDateBtnText: {
        color: "#fff",
        marginLeft: 4,
        ...textPresets.label
    },
    noDatesText: {
        marginBottom: 6,
        ...textPresets.label
    },
    chipsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    selectedDaysSummary: {
        ...textPresets.label,
        marginTop: 12,
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    priceLabel: {
        ...textPresets.label
    },
    priceValue: {
        ...textPresets.label
    },
    totalLabel: {
        ...textPresets.label
    },
    totalValue: {
        ...textPresets.label
    },
    submitBtn: {
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: "center",
        marginTop: 18,
    },
    submitBtnText: {
        color: "#fff",
        ...textPresets.body
    },
    footnote: {
        ...textPresets.caption,
        textAlign: "center",
        marginTop: 10,
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
});
