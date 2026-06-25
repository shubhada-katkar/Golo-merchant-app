import React, { useState, useContext, useCallback } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { uploadImageToCloudinary } from "../services/cloudinaryService";

// Hardcoded for now — swap in real list later
const BANNER_CATEGORIES = ["Books", "Electronics", "Fashion", "Grocery", "Home & Kitchen", "Beauty"];

// Hardcoded pricing
const RATE_PER_DAY = 240;
const PLATFORM_FEE = 0;

export default function BannerPage({ navigation }) {
    const { colors } = useContext(ThemeContext);

    const [bannerTitle, setBannerTitle] = useState("");
    const [category, setCategory] = useState(BANNER_CATEGORIES[0]);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [bannerImage, setBannerImage] = useState(null);

    const [selectedDates, setSelectedDates] = useState([]); // array of "YYYY-MM-DD" strings
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        }
    }, []);

    const handleDateChange = useCallback((event, date) => {
        setShowDatePicker(false);
        if (Platform.OS === "android" && event.type === "dismissed") return;
        if (!date) return;

        const key = formatDateKey(date);
        setSelectedDates((prev) => {
            if (prev.includes(key)) return prev; // already added
            return [...prev, key].sort();
        });
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

            const response = await fetch(`${BASE_URL}/banners/promotions/request`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bannerTitle: bannerTitle.trim(),
                    bannerCategory: category,
                    imageUrl,
                    selectedDates,
                    totalPrice: totalPayable,
                    dailyRate: RATE_PER_DAY,
                    platformFee: PLATFORM_FEE,
                    recommendedSize: "1920 x 520 px",
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || "Unable to submit banner request right now.");
            }

            Alert.alert("Request submitted", "Your banner promotion request has been sent for admin review.");
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
                    <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text,
                    lineHeight: Math.round(20 * 1.2), fontFamily: "Medium", flex: 1
                }}>Promote Banner</Text>
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

                    <Text style={[styles.label, { color: colors.subtext, marginTop: 18 }]}>BANNER CATEGORY</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dropdown]}
                        onPress={() => setCategoryOpen((prev) => !prev)}
                    >
                        <Text style={{ color: colors.text, fontSize: 15 }}>{category}</Text>
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
                                    <Text style={{ color: colors.text, fontSize: 15 }}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.label, { color: colors.subtext, marginTop: 18 }]}>UPLOAD BANNER</Text>
                    <TouchableOpacity
                        style={[styles.uploadBox, { borderColor: colors.border }]}
                        onPress={handlePickImage}
                        activeOpacity={0.7}
                    >
                        {bannerImage ? (
                            <Image source={{ uri: bannerImage }} style={styles.previewImage} resizeMode="cover" />
                        ) : (
                            <>
                                <View style={[styles.uploadIconCircle, { backgroundColor: colors.successLight || "#e3f3ea" }]}>
                                    <Feather name="upload" size={20} color={colors.success || "#157a4f"} />
                                </View>
                                <Text style={[styles.uploadTitle, { color: colors.text }]}>Click to upload banner image</Text>
                                <Text style={[styles.uploadSubtitle, { color: colors.subtext }]}>
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
                                    <Text style={{ color: colors.text, fontSize: 13,
                                        fontFamily: "Medium", lineHeight: Math.round(13 * 1.5)
                                     }}>{formatDateLabel(key)}</Text>
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

                    {showDatePicker && (
                        <DateTimePicker
                            value={new Date()}
                            mode="date"
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            minimumDate={new Date()}
                            onChange={handleDateChange}
                        />
                    )}
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
                            <Text style={styles.submitBtnText}>Submit For Approval</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.footnote, { color: colors.subtext }]}>
                        Request status will be shown in Banner Promotions list as Under Review, Rejected, or Approved. Pay option appears after approval.
                    </Text>
                </View>

            </ScrollView>

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
    headerBlock: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 6,
    },
    heading: {
        fontSize: 24,
        fontFamily: "Bold",
        marginBottom: 8,
    },
    subheading: {
        fontSize: 12,
        lineHeight: 20,
        fontFamily: "Medium",
        lineHeight: Math.round(12 * 1.5),
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
        fontSize: 16,
        fontFamily: "Medium",
        marginBottom: 4,
        lineHeight: Math.round(16 * 1.5),
    },
    label: {
        fontSize: 12,
        fontFamily: "Medium",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 7,
        fontSize: 14,
        fontFamily: "Medium",
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
        fontSize: 14,
        fontFamily: "Medium",
        textAlign: "center",
        marginBottom: 6,
        lineHeight: Math.round(14 * 1.5),
    },
    uploadSubtitle: {
        fontSize: 12,
        fontFamily: "Medium",
        textAlign: "center",
        lineHeight: Math.round(12 * 1.5),
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
        fontSize: 13,
        fontFamily: "Medium",
        marginLeft: 4,
        lineHeight: Math.round(13 * 1.5),
    },
    noDatesText: {
        fontSize: 13,
        fontFamily: "Medium",
        marginBottom: 6,
        lineHeight: Math.round(13 * 1.5),
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
        fontSize: 14,
        fontFamily: "Medium",
        marginTop: 12,
        lineHeight: Math.round(14 * 1.5),
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
        fontSize: 13,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5),
    },
    priceValue: {
        fontSize: 13,
        fontFamily: "Medium",
        lineHeight: Math.round(13 * 1.5),
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: "Bold",
        lineHeight: Math.round(16 * 1.5),
    },
    totalValue: {
        fontSize: 16,
        fontFamily: "Bold",
        lineHeight: Math.round(16 * 1.5),
    },
    submitBtn: {
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: "center",
        marginTop: 18,
    },
    submitBtnText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: "Medium",
        lineHeight: Math.round(16 * 1.5),
    },
    footnote: {
        fontSize: 12,
        fontFamily: "Medium",
        textAlign: "center",
        marginTop: 10,
        lineHeight: Math.round(12 * 1.5),
    },
});