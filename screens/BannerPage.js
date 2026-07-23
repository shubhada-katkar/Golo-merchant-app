import React, { useState, useContext, useCallback, useEffect, useRef } from "react";
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
    // Tracks whether the user picked a brand-new local image during edit mode.
    // Needed because the backend PUT route skips image moderation, so we must
    // run a moderation pre-check on the frontend before issuing the PUT.
    const [imageChangedDuringEdit, setImageChangedDuringEdit] = useState(false);

    const [selectedDates, setSelectedDates] = useState([]); // array of "YYYY-MM-DD" strings
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [flaggedModalVisible, setFlaggedModalVisible] = useState(false);
    const [warningModalVisible, setWarningModalVisible] = useState(false);
    const [warningModalMessage, setWarningModalMessage] = useState("");
    const [isFetchingEdit, setIsFetchingEdit] = useState(false);

    const [restrictionModalVisible, setRestrictionModalVisible] = useState(false);
    const [restrictionUntil, setRestrictionUntil] = useState(null);
    const [countdownText, setCountdownText] = useState("");

    const [locations, setLocations] = useState([]);
    const [locationInputText, setLocationInputText] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const debounceTimer = useRef(null);

    // ── Pre-populate form when editing ─────────────────────────
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
        if (!isEditMode || !editData) return;

        // Title
        if (editData.bannerTitle) setBannerTitle(editData.bannerTitle);

        // Category
        if (editData.bannerCategory && BANNER_CATEGORIES.includes(editData.bannerCategory)) {
            setCategory(editData.bannerCategory);
        }

        // Image
        if (editData.imageUrl) setBannerImage(editData.imageUrl);

        // Locations
        if (Array.isArray(editData.targetCities)) {
            setLocations(editData.targetCities);
        }

        // Dates – backend stores as Date[] (ISO strings); normalise to "YYYY-MM-DD" keys
        const rawDates = Array.isArray(editData.selectedDates) ? editData.selectedDates : [];
        const dateKeys = rawDates
            .map(toDateKey)
            .filter(Boolean)
            .sort();
        // Deduplicate
        setSelectedDates([...new Set(dateKeys)]);
    }, [isEditMode]); // only run once on mount if editing

    // ── Location autocomplete via Nominatim ────────────────────
    const fetchLocationSuggestions = useCallback(async (query) => {
        const trimmed = (query || "").trim();
        if (!trimmed || trimmed.length < 2) {
            setLocationSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }
        setSuggestionsLoading(true);
        try {
            const params = new URLSearchParams({
                q: trimmed,
                format: "json",
                addressdetails: "1",
                limit: "6",
                "accept-language": "en",
            });
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                { headers: { "User-Agent": "GoloMerchantApp/1.0" } }
            );
            const data = await response.json();
            const seen = new Set();
            const suggestions = (data || []).map((item) => {
                const addr = item.address || {};
                const city = addr.city || addr.town || addr.village || addr.state_district || addr.county || "";
                const state = addr.state || "";
                const country = addr.country || "";
                const label = [city, state, country].filter(Boolean).join(", ") || item.display_name || trimmed;
                return { id: String(item.place_id), label, city };
            }).filter((s) => {
                if (!s.city || seen.has(s.city.toLowerCase())) return false;
                seen.add(s.city.toLowerCase());
                return true;
            });
            setLocationSuggestions(suggestions);
        } catch (err) {
            console.warn("Location suggestion error:", err);
            setLocationSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }
    }, []);

    const handleLocationInputChange = useCallback((text) => {
        setLocationInputText(text);
        setLocationSuggestions([]);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => fetchLocationSuggestions(text), 400);
    }, [fetchLocationSuggestions]);

    const handleSelectSuggestion = useCallback((suggestion) => {
        const cityName = suggestion.city || suggestion.label;
        if (locations.length >= 7) {
            Alert.alert("Limit reached", "You can specify up to 7 locations only.");
            return;
        }
        if (locations.some((l) => l.toLowerCase() === cityName.toLowerCase())) {
            Alert.alert("Duplicate", "This location is already in your list.");
            return;
        }
        setLocations([...locations, cityName]);
        setLocationInputText("");
        setLocationSuggestions([]);
    }, [locations]);

    const handleAddLocation = () => {
        const trimmed = locationInputText.trim();
        if (!trimmed) return;
        if (locations.length >= 7) {
            Alert.alert("Limit reached", "You can specify up to 7 locations only.");
            return;
        }
        if (locations.includes(trimmed)) {
            Alert.alert("Duplicate location", "This location has already been added.");
            return;
        }
        setLocations([...locations, trimmed]);
        setLocationInputText("");
        setLocationSuggestions([]);
    };

    const handleRemoveLocation = (locToRemove) => {
        setLocations(locations.filter((loc) => loc !== locToRemove));
    };

    // ── Delete banner ───────────────────────────────────────────
    const handleDelete = async () => {
        if (!isEditMode || !editRequestId) return;
        Alert.alert(
            "Delete Banner",
            "Are you sure you want to permanently delete this banner promotion? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            const token = (await AsyncStorage.getItem("merchantToken")) || (await AsyncStorage.getItem("accessToken"));
                            const response = await fetch(`${BASE_URL}/banners/promotions/${editRequestId}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!response.ok) {
                                const err = await response.json().catch(() => ({}));
                                throw new Error(err?.message || "Could not delete banner.");
                            }
                            Alert.alert("Deleted", "Banner promotion has been deleted.");
                            navigation.navigate("BannerList");
                        } catch (e) {
                            Alert.alert("Error", e?.message || "Please try again.");
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

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
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        if (restrictionUntil && restrictionUntil > new Date()) {
            setRestrictionModalVisible(true);
            return;
        }
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
            // Mark that a new image was selected during edit so we know to run
            // a moderation pre-check before the PUT (backend PUT skips isImageSafe).
            if (isEditMode) setImageChangedDuringEdit(true);
            // Clear any previously stored flagged marker when user picks a new image
            try { await AsyncStorage.removeItem('golo_images_flagged:' + merchantId); } catch (e) { }
        }
    }, [isEditMode, restrictionUntil]);

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
        const merchantId = await AsyncStorage.getItem("merchantId") || "default";
        if (restrictionUntil && restrictionUntil > new Date()) {
            setRestrictionModalVisible(true);
            return;
        }
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
        if (!isEditMode && locations.length === 0) {
            Alert.alert("Missing locations", "Please add at least one target location.");
            return;
        }
        if (locations.length > 7) {
            Alert.alert("Too many locations", "You can specify up to 7 locations only.");
            return;
        }
        if (!BASE_URL) {
            Alert.alert("Configuration error", "API base URL is not configured.");
            return;
        }

        // Check if image was flagged from a previous submission
        try {
            const storedFlag = await AsyncStorage.getItem(`golo_images_flagged:${merchantId}`);
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

            // Upload local image to Cloudinary first (applies to both create & edit)
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

            // ── Edit mode with a new image: run the same moderation pre-check ──
            // The backend PUT route skips isImageSafe, so we fire a temporary POST
            // (which DOES run moderation) to screen the new Cloudinary URL.
            // On pass: the probe record is deleted and we proceed with PUT.
            // On fail: the moderation modal is shown, same as the create flow.
            if (isEditMode && imageChangedDuringEdit) {
                const probePayload = {
                    bannerTitle: bannerTitle.trim() || "Moderation Check",
                    bannerCategory: category,
                    imageUrl,
                    selectedDates: selectedDates.length ? selectedDates : [new Date().toISOString().slice(0, 10)],
                    totalPrice: 0,
                    dailyRate: RATE_PER_DAY,
                    platformFee: PLATFORM_FEE,
                    recommendedSize: "1920 x 520 px",
                    targetCities: locations.length ? locations : ["Moderation"],
                };

                const probeResponse = await fetch(`${BASE_URL}/banners/promotions/request`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(probePayload),
                });

                const probePayloadResult = await probeResponse.json().catch(() => ({}));

                if (!probeResponse.ok) {
                    const isProbeRestricted = probeResponse.status === 403 || probePayloadResult?.code === 'CONTENT_UPLOAD_RESTRICTED';
                    if (isProbeRestricted) {
                        const until = probePayloadResult?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
                        try {
                            await AsyncStorage.setItem(`golo_restricted_until:${merchantId}`, until);
                        } catch (error) { }
                        setRestrictionUntil(new Date(until));
                        setRestrictionModalVisible(true);
                        return;
                    }

                    if (isModerationWarningResponse(probePayloadResult)) {
                        const msg = getErrorMessageFromResponse(probePayloadResult);
                        setWarningModalMessage(msg || "Repeated uploads that violate GOLO's content policy may restrict your account temporarily.");
                        setWarningModalVisible(true);
                        return;
                    }

                    // Check if this is a moderation failure from the probe POST
                    const isModerationError = isModerationFailureResponse(probePayloadResult);
                    if (isModerationError) {
                        try {
                            await AsyncStorage.setItem(`golo_images_flagged:${merchantId}`, 'true');
                        } catch (e) {
                            console.warn('Failed to set flagged marker during edit probe', e);
                        }
                        setFlaggedModalVisible(true);
                        return;
                    }
                    // Non-moderation error on probe (e.g. validation) — fall through
                    // and attempt the actual PUT anyway, so the user isn't blocked
                    // unnecessarily by an unrelated probe issue.
                } else {
                    // Probe passed moderation — delete the temporary record to keep
                    // the list clean before doing the real PUT.
                    const probeRequestId =
                        probePayloadResult?.data?.requestId ||
                        probePayloadResult?.requestId ||
                        null;
                    if (probeRequestId) {
                        try {
                            await fetch(`${BASE_URL}/banners/promotions/${probeRequestId}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                            });
                        } catch (cleanupErr) {
                            // Non-fatal — the record will be orphaned but moderation passed
                            console.warn("Probe cleanup failed:", cleanupErr);
                        }
                    }
                }
            }

            // ── Edit mode → PUT, Create mode → POST ───────────
            const url = isEditMode
                ? `${BASE_URL}/banners/promotions/${editRequestId}`
                : `${BASE_URL}/banners/promotions/request`;

            const method = isEditMode ? "PUT" : "POST";

            // NOTE: UpdateBannerPromotionDto does NOT include targetCities
            // (backend forbidNonWhitelisted: true), so we only send it on create.
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
                    targetCities: locations,
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
                const isRestricted = response.status === 403 || payload?.code === 'CONTENT_UPLOAD_RESTRICTED';
                if (isRestricted) {
                    const until = payload?.restrictedUntil || new Date(Date.now() + 2 * 3600000).toISOString();
                    try {
                        await AsyncStorage.setItem(`golo_restricted_until:${merchantId}`, until);
                    } catch (error) { }
                    setRestrictionUntil(new Date(until));
                    setRestrictionModalVisible(true);
                    return;
                }

                if (isModerationWarningResponse(payload)) {
                    const msg = getErrorMessageFromResponse(payload);
                    setWarningModalMessage(msg || "Repeated uploads that violate GOLO's content policy may restrict your account temporarily.");
                    setWarningModalVisible(true);
                    return;
                }

                // Check if this is a moderation failure (covers create mode and
                // any future case where PUT may also run moderation)
                const isModerationError = isModerationFailureResponse(payload);

                if (isModerationError) {
                    try {
                        await AsyncStorage.setItem(`golo_images_flagged:${merchantId}`, 'true');
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
            // Clear the moderation flag and reset the changed-image tracker
            try { await AsyncStorage.removeItem(`golo_images_flagged:${merchantId}`); } catch (e) { }
            setImageChangedDuringEdit(false);
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

                    {/* BANNER LOCATIONS (MAX 7) */}
                    <Text style={[styles.label, { color: colors.subtext, marginTop: 18 }]}>BANNER LOCATIONS (MAX 7)</Text>
                    {!isEditMode ? (
                        <View style={{ position: "relative" }}>
                            <View style={styles.locationInputRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            flex: 1,
                                            color: colors.text,
                                            borderColor: locationSuggestions.length > 0 ? (colors.success || "#157a4f") : colors.border,
                                            backgroundColor: colors.inputBackground,
                                            marginRight: 8,
                                            marginBottom: 0,
                                        }
                                    ]}
                                    placeholder="Search city / area (e.g. Kolhapur)"
                                    placeholderTextColor={colors.subtext}
                                    value={locationInputText}
                                    onChangeText={handleLocationInputChange}
                                    onSubmitEditing={handleAddLocation}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.addLocationBtn,
                                        { backgroundColor: colors.success || "#157a4f" }
                                    ]}
                                    onPress={handleAddLocation}
                                >
                                    {suggestionsLoading
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Feather name="plus" size={20} color="#fff" />}
                                </TouchableOpacity>
                            </View>

                            {/* Autocomplete dropdown */}
                            {locationSuggestions.length > 0 && (
                                <View style={[styles.suggestionsDropdown, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                    {locationSuggestions.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectSuggestion(s)}
                                        >
                                            <Feather name="map-pin" size={14} color={colors.subtext} style={{ marginRight: 8 }} />
                                            <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>{s.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : null}

                    {locations.length > 0 ? (
                        <View style={[styles.chipsWrap, { marginTop: 10 }]}>
                            {locations.map((loc, idx) => (
                                <View key={idx} style={[styles.chip, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                    <Feather name="map-pin" size={12} color={colors.subtext} style={{ marginRight: 4 }} />
                                    <Text style={{ ...textPresets.label }}>{loc}</Text>
                                    {!isEditMode && (
                                        <TouchableOpacity onPress={() => handleRemoveLocation(loc)} style={{ marginLeft: 6 }}>
                                            <Feather name="x" size={14} color={colors.subtext} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.noDatesText, { color: colors.subtext, marginTop: 6 }]}>
                            No target locations added yet. (Min 1, max 7)
                        </Text>
                    )}
                    {isEditMode && (
                        <Text style={{ color: colors.subtext, marginTop: 8, ...textPresets.caption }}>
                            * Locations cannot be modified for an active promotion.
                        </Text>
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
                        {!isEditMode && (
                            <TouchableOpacity
                                style={[styles.addDateBtn, { backgroundColor: colors.success || "#157a4f" }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Feather name="plus" size={16} color="#fff" />
                                <Text style={styles.addDateBtnText}>Add date</Text>
                            </TouchableOpacity>
                        )}
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
                                    {!isEditMode && (
                                        <TouchableOpacity onPress={() => removeDate(key)} style={{ marginLeft: 6 }}>
                                            <Feather name="x" size={14} color={colors.subtext} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {isEditMode && (
                        <Text style={{ color: colors.subtext, marginTop: 8, ...textPresets.caption }}>
                            * Dates cannot be modified for an active promotion.
                        </Text>
                    )}

                    <Text style={[styles.selectedDaysSummary, { color: colors.text }]}>
                        Total selected dates: <Text style={{ ...textPresets.body }}>{selectedDaysCount}</Text>
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
                                    style={[styles.submitBtn, { backgroundColor: colors.success || "#f5b849", marginTop: 12 }]}
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
                        style={[styles.submitBtn, { backgroundColor: colors.success || "#f5b849", opacity: isSubmitting || isUploadingImage ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || isUploadingImage}
                    >
                        {isSubmitting || isUploadingImage ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>{isEditMode ? "Update Banner" : "Post Banner"}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Delete button — only shown in edit mode */}
                    {isEditMode && (
                        <TouchableOpacity
                            style={[styles.deleteBtn, { opacity: isDeleting ? 0.7 : 1 }]}
                            onPress={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting
                                ? <ActivityIndicator color="#e0483e" />
                                : <>
                                    <Feather name="trash-2" size={16} color="#e0483e" style={{ marginRight: 6 }} />
                                    <Text style={styles.deleteBtnText}>Delete This Banner</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.footnote, { color: colors.subtext }]}>
                        Request status will be shown in Banner Promotions list as Under Review, Rejected, or Approved. Pay option appears after approval.
                    </Text>
                </View>

            </ScrollView>

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
        ...textPresets.body
    },
    totalValue: {
        ...textPresets.body
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
    locationInputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        marginBottom: 0,
    },
    addLocationBtn: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    suggestionsDropdown: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 4,
        overflow: "hidden",
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#e5e5e5",
    },
    suggestionText: {
        flex: 1,
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#e0483e",
        borderRadius: 14,
        paddingVertical: 12,
        marginTop: 14,
    },
    deleteBtnText: {
        color: "#e0483e",
        lineHeight: Math.round(14 * 1.5),
        ...textPresets.body,
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
