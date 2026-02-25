import React, { useContext, useState, useEffect } from "react";
import {
    View, StyleSheet, Text, Switch, TouchableOpacity,
    TextInput, ScrollView, TouchableWithoutFeedback, KeyboardAvoidingView,
    Keyboard, Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import OfferScroll from "../components/OfferScroll";
import { ThemeContext } from "../theme/ThemeContext";
import Dropdown from "../components/Dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";

export default function AddOfferPage({ navigation, route }) {
    const {template, offerData} = route.params || {};

    const { colors } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const [showOffers, setShowOffers] = useState(false);
    const [discount, setDiscount] = useState("");
    const [token, setToken] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [activeField, setActiveField] = useState(null);

    const [title, setTitle] = useState("");
    const [stars, setStars] = useState("");
    const [terms, setTerms] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Load merchant token
    useEffect(() => {
        const loadToken = async () => {
            const savedToken = await AsyncStorage.getItem("merchantToken");
            setToken(savedToken);
        };
        loadToken();
    }, []);

    // Prefill form if editing
    useEffect(() => {
        if (offerData) {
            setTitle(offerData.title || "");
            setDiscount(offerData.discountPercentage?.toString() || "");
            setFromDate(offerData.validFrom ? new Date(offerData.validFrom) : null);
            setToDate(offerData.validTo ? new Date(offerData.validTo) : null);
            setIsDarkMode(offerData.loyaltyEnabled || false);
            setStars(offerData.stars?.toString() || "");
            setTerms(offerData.termsAndConditions || "");
            setSelectedIds(offerData.products?.map(p => p._id) || []);
        }
    }, [offerData]);

    // Fetch selected products whenever IDs or token change
    useEffect(() => {
        const fetchSelectedProducts = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/products/by-ids`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids: selectedIds })
                });
                const data = await res.json();
                setSelectedProducts(data);
            } catch (error) {
                console.log("Offer products fetch error:", error);
            }
        };

        if (selectedIds.length > 0 && token) {
            fetchSelectedProducts();
        } else {
            setSelectedProducts([]);
        }
    }, [selectedIds, token]);

    const clearAllFields = () => {
        setTitle("");
        setDiscount("");
        setFromDate(null);
        setToDate(null);
        setIsDarkMode(false);
        setStars("");
        setTerms("");
        setSelectedIds([]);
        setSelectedProducts([]);
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

            const url = `${BASE_URL}/api/offers/${offerData._id}`;
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Offer deleted successfully!");
                navigation.goBack();
            } else {
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.log("Delete error:", err);
            alert("Network error");
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
        if (!title || !discount || selectedIds.length === 0 || !fromDate || !toDate) {
            alert("Please fill all required fields");
            return;
        }
        if (isDarkMode && !stars) {
            alert("Please enter loyalty stars");
            return;
        }

        try {
            setIsSaving(true);

            const offerImage = selectedProducts[0]?.image?.url || "";
            const payload = {
                title,
                discountPercentage: Number(discount),
                products: selectedIds,
                offerImage,
                loyaltyEnabled: isDarkMode,
                stars: Number(stars),
                termsAndConditions: terms,
                validFrom: fromDate.toISOString(),
                validTo: toDate.toISOString()
            };

            const url = offerData
                ? `${BASE_URL}/api/offers/${offerData._id}`
                : `${BASE_URL}/api/offers/create`;
            const method = offerData ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert(offerData ? "Offer updated!" : "Offer created!");
                navigation.goBack();
            } else {
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.log("Offer save error:", err);
            alert("Network error");
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
                        <TouchableOpacity onPress={() => navigation.navigate("TemplatePage")}>
                            <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{ padding: 10 }} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>
                            {offerData ? "Edit Offer" : "Add Offer"}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                    {token && (
                        <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                            <Dropdown
                                BASE_URL={BASE_URL}
                                token={token}
                                onChange={setSelectedIds}
                                value={selectedIds}
                            />
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
                            <OfferScroll products={selectedProducts} discount={discount} />
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

                        <Text style={[styles.text, { color: colors.text }]}>Discount Percentage</Text>
                        <TextInput
                            placeholder="Enter discount (1-100)"
                            keyboardType="numeric"
                            style={styles.input}
                            value={discount}
                            onChangeText={(value) => {
                                const num = value.replace(/[^0-9]/g, "");
                                if (num === "" || (Number(num) >= 1 && Number(num) <= 100)) setDiscount(num);
                            }}
                        />

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
                                onValueChange={setIsDarkMode}
                                thumbColor={isDarkMode ? "#157a4f" : "#f4f3f4"}
                                trackColor={{ false: "#ccc", true: "#141414" }}
                                ios_backgroundColor="#ccc"
                                style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10 }}
                            />
                        </View>

                        <Text style={[styles.text, { color: colors.text }]}>Number of Stars</Text>
                        <TextInput
                            placeholder="Enter Number Of Stars"
                            keyboardType="numeric"
                            value={stars}
                            onChangeText={(value) => {
                                const num = value.replace(/[^0-9]/g, "");
                                if (num === "" || Number(num) <= 100) setStars(num);
                            }}
                            style={styles.input}
                        />

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
                        <View style={{ flexDirection: "row", marginTop: 20,justifyContent:"space-between" }}>
                            <TouchableOpacity
                                style={[styles.rowButton, isSaving && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={isSaving || isDeleting}
                            >
                                <Text style={{ color: "#fff", fontSize:16 }}>
                                    {isSaving ? (offerData ? "Updating..." : "Saving...") : offerData ? "Update Offer" : "Add Offer"}
                                </Text>
                            </TouchableOpacity>

                            {offerData && (
                                <TouchableOpacity
                                    style={[styles.rowButton, { backgroundColor: "#e53935" }, isDeleting && { opacity: 0.6 }]}
                                    onPress={handleDelete}
                                    disabled={isSaving || isDeleting}
                                >
                                    <Text style={{ color: "#fff", fontSize:16 }}>
                                        {isDeleting ? "Deleting..." : "Delete Offer"}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.rowButton}
                                onPress={()=>navigation.navigate("PreviewPage",{template})} >
                                <Text style={{ color: "#fff", fontSize:16 }}>See Preview</Text>
                            </TouchableOpacity>
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
});