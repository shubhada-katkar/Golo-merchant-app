import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons, Feather } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { getValidToken, clearAuthStorage } from "../services/authService";
import { textPresets } from "../theme/typography";

const REASONS = [
    "Closing my business / store",
    "Switching to another platform",
    "Not getting enough customer orders or leads",
    "Technical issues or difficulty using the app",
    "High subscription or advertising costs",
    "Other",
];

export default function DeleteAccountModal({
    visible,
    onClose,
    navigation,
    onShowAlert,
}) {
    // Steps: 1 = Warning, 2 = Select Reason, 3 = Final Confirmation & Type DELETE, 4 = Success
    const [step, setStep] = useState(1);
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [deleteKeyword, setDeleteKeyword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (visible) {
            setStep(1);
            setSelectedReason("");
            setCustomReason("");
            setDeleteKeyword("");
            setIsDeleting(false);
            setErrorMessage("");
        }
    }, [visible]);

    if (!visible) return null;

    const handleClose = () => {
        if (isDeleting) return;
        if (onClose) onClose();
    };

    const handleNextFromWarning = () => {
        setStep(2);
    };

    const handleNextFromReason = () => {
        if (!selectedReason) {
            setErrorMessage("Please select a reason for deleting your account.");
            return;
        }
        if (selectedReason === "Other" && !customReason.trim()) {
            setErrorMessage("Please provide your reason in the text box.");
            return;
        }
        setErrorMessage("");
        setStep(3);
    };

    const handlePerformDeletion = async () => {
        if (deleteKeyword.trim() !== "DELETE") {
            setErrorMessage('You must type "DELETE" exactly to confirm.');
            return;
        }

        try {
            setIsDeleting(true);
            setErrorMessage("");

            const token = await getValidToken();
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const payload = {
                reason: selectedReason,
                customReason: selectedReason === "Other" ? customReason.trim() : undefined,
                confirmation: "DELETE",
            };

            // Call DELETE /merchant/account with fallback to /users/account if needed
            let response = await fetch(`${BASE_URL}/merchant/account`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 404) {
                response = await fetch(`${BASE_URL}/users/account`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                const message = data?.message || "Failed to delete account. Please try again.";
                throw new Error(Array.isArray(message) ? message.join(", ") : message);
            }

            // Step 5: Clean up credentials and show success
            await clearAuthStorage();
            setStep(4);
        } catch (err) {
            const errorText = err?.message || "An unexpected error occurred. Please try again.";
            setErrorMessage(errorText);
            if (onShowAlert) {
                onShowAlert("error", "Deletion Failed", errorText);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFinishSuccess = () => {
        handleClose();
        if (navigation) {
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalCard}>
                    {/* STEP 1: Important Data Warning Popup */}
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: "#fef2f2" }]}>
                                <MaterialIcons name="warning" size={38} color="#e53935" />
                            </View>

                            <Text style={styles.modalTitle}>Important Warning</Text>

                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    Deleting your merchant account will permanently remove your store information, products and offers. This information will no longer be available.
                                </Text>
                            </View>

                            <Text style={styles.confirmPromptText}>
                                Are you sure you want to continue?
                            </Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelBtn]}
                                    onPress={handleClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.dangerBtn]}
                                    onPress={handleNextFromWarning}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dangerBtnText}>Continue</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 2: Select Reason */}
                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.stepHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setErrorMessage("");
                                        setStep(1);
                                    }}
                                    style={styles.backBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Feather name="arrow-left" size={20} color="#333" />
                                </TouchableOpacity>
                                <Text style={styles.stepIndicator}>Step 2 of 3</Text>
                            </View>

                            <Text style={styles.modalTitle}>Why are you leaving?</Text>
                            <Text style={styles.subTitle}>
                                Please select the reason for deleting your merchant account:
                            </Text>

                            <ScrollView
                                style={styles.reasonsList}
                                contentContainerStyle={{ paddingBottom: 10 }}
                                showsVerticalScrollIndicator={false}
                            >
                                {REASONS.map((r) => {
                                    const isSelected = selectedReason === r;
                                    return (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.reasonItem,
                                                isSelected && styles.reasonItemSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedReason(r);
                                                setErrorMessage("");
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    isSelected && styles.radioCircleSelected,
                                                ]}
                                            >
                                                {isSelected && <View style={styles.radioDot} />}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.reasonText,
                                                    isSelected && styles.reasonTextSelected,
                                                ]}
                                            >
                                                {r}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {selectedReason === "Other" && (
                                    <View style={styles.customReasonContainer}>
                                        <TextInput
                                            style={styles.customReasonInput}
                                            placeholder="Please describe your reason here..."
                                            placeholderTextColor="#999"
                                            value={customReason}
                                            onChangeText={(text) => {
                                                setCustomReason(text);
                                                if (errorMessage) setErrorMessage("");
                                            }}
                                            multiline
                                            numberOfLines={3}
                                            maxLength={250}
                                        />
                                        <Text style={styles.charCount}>
                                            {customReason.length}/250
                                        </Text>
                                    </View>
                                )}

                                {!!errorMessage && (
                                    <Text style={styles.errorText}>{errorMessage}</Text>
                                )}
                            </ScrollView>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelBtn]}
                                    onPress={handleClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.primaryBtn,
                                        (!selectedReason ||
                                            (selectedReason === "Other" && !customReason.trim())) &&
                                        styles.btnDisabled,
                                    ]}
                                    onPress={handleNextFromReason}
                                    disabled={
                                        !selectedReason ||
                                        (selectedReason === "Other" && !customReason.trim())
                                    }
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.primaryBtnText}>Continue</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 3: Final Confirmation & Enter DELETE Keyword */}
                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.stepHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (isDeleting) return;
                                        setErrorMessage("");
                                        setStep(2);
                                    }}
                                    style={styles.backBtn}
                                    disabled={isDeleting}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Feather name="arrow-left" size={20} color="#333" />
                                </TouchableOpacity>
                                <Text style={styles.stepIndicator}>Step 3 of 3</Text>
                            </View>

                            <View style={[styles.iconCircle, { backgroundColor: "#fef2f2", width: 54, height: 54, borderRadius: 27 }]}>
                                <MaterialCommunityIcons name="delete-forever" size={32} color="#e53935" />
                            </View>

                            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>

                            <View style={styles.finalWarningBox}>
                                <Text style={styles.finalWarningText}>
                                    This action is permanent and cannot be reversed. Your merchant account, store profile, products, offers, vouchers, reviews, and analytics data will be permanently deleted immediately.
                                </Text>
                            </View>

                            <Text style={styles.keywordInstruction}>
                                To confirm, please type <Text style={{ color: "#e53935" }}>DELETE</Text> below:
                            </Text>

                            <TextInput
                                style={[
                                    styles.keywordInput,
                                    deleteKeyword === "DELETE" && styles.keywordInputValid,
                                ]}
                                placeholder="Type DELETE"
                                placeholderTextColor="#aaa"
                                value={deleteKeyword}
                                onChangeText={(text) => {
                                    setDeleteKeyword(text);
                                    if (errorMessage) setErrorMessage("");
                                }}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                editable={!isDeleting}
                            />

                            {!!errorMessage && (
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            )}

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelBtn]}
                                    onPress={handleClose}
                                    disabled={isDeleting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.dangerBtn,
                                        (deleteKeyword.trim() !== "DELETE" || isDeleting) && styles.btnDisabled,
                                    ]}
                                    onPress={handlePerformDeletion}
                                    disabled={deleteKeyword.trim() !== "DELETE" || isDeleting}
                                    activeOpacity={0.7}
                                >
                                    {isDeleting ? (
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text style={styles.dangerBtnText}>Deleting...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.dangerBtnText}>Delete Account</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* STEP 4: Successful Deletion Completion */}
                    {step === 4 && (
                        <View style={styles.stepContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: "#e8f5ee" }]}>
                                <MaterialCommunityIcons name="check-circle" size={44} color="#157a4f" />
                            </View>

                            <Text style={styles.modalTitle}>Account Deleted</Text>

                            <Text style={styles.successMessageText}>
                                Your merchant account and all associated store data have been successfully and permanently removed.
                            </Text>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.successBtn]}
                                onPress={handleFinishSuccess}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.successBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
        maxHeight: "85%",
    },
    stepContainer: {
        alignItems: "center",
        width: "100%",
    },
    stepHeader: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    backBtn: {
        padding: 4,
    },
    stepIndicator: {
        ...textPresets.label,
        color: "#888888",
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    modalTitle: {
        ...textPresets.subtitle,
        color: "#1a1a1a",
        textAlign: "center",
        marginBottom: 8,
    },
    subTitle: {
        ...textPresets.label,
        color: "#666666",
        textAlign: "center",
        marginBottom: 14,
        lineHeight: 18,
    },
    warningBox: {
        backgroundColor: "#fff5f5",
        borderLeftWidth: 4,
        borderLeftColor: "#e53935",
        borderRadius: 8,
        padding: 12,
        marginBottom: 14,
        width: "100%",
    },
    warningText: {
        ...textPresets.caption,
        color: "#c62828",
    },
    finalWarningBox: {
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fca5a5",
        borderRadius: 10,
        padding: 12,
        marginVertical: 10,
        width: "100%",
    },
    finalWarningText: {
        ...textPresets.label,
        color: "#991b1b",
        lineHeight: 18,
        textAlign: "center",
    },
    confirmPromptText: {
        ...textPresets.body,
        color: "#333333",
        textAlign: "center",
        marginBottom: 20,
    },
    reasonsList: {
        width: "100%",
        maxHeight: 220,
        marginBottom: 12,
    },
    reasonItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    reasonItemSelected: {
        backgroundColor: "#fef2f2",
        borderColor: "#f87171",
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#9ca3af",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    radioCircleSelected: {
        borderColor: "#e53935",
    },
    radioDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: "#e53935",
    },
    reasonText: {
        ...textPresets.label,
        color: "#374151",
        flex: 1,
    },
    reasonTextSelected: {
        color: "#991b1b",
    },
    customReasonContainer: {
        marginTop: 4,
        marginBottom: 8,
        width: "100%",
    },
    customReasonInput: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        padding: 10,
        color: "#1f2937",
        minHeight: 65,
        textAlignVertical: "top",
    },
    charCount: {
        ...textPresets.caption,
        color: "#9ca3af",
        textAlign: "right",
        marginTop: 4,
    },
    keywordInstruction: {
        ...textPresets.body,
        color: "#4b5563",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 10,
    },
    keywordInput: {
        width: "100%",
        backgroundColor: "#f9fafb",
        borderWidth: 1.5,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        color: "#111827",
        textAlign: "center",
        letterSpacing: 2,
        marginBottom: 14,
        ...textPresets.body
    },
    keywordInputValid: {
        borderColor: "#e53935",
        backgroundColor: "#fff5f5",
    },
    errorText: {
        ...textPresets.label,
        color: "#dc2626",
        textAlign: "center",
        marginBottom: 10,
        width: "100%",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
        marginTop: 6,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtn: {
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cancelBtnText: {
        ...textPresets.body,
        color: "#4b5563",
        lineHeight: Math.round(14 * 1.5)
    },
    dangerBtn: {
        backgroundColor: "#e53935",
    },
    dangerBtnText: {
        ...textPresets.body,
        color: "#ffffff",
        lineHeight: Math.round(14 * 1.5)
    },
    primaryBtn: {
        backgroundColor: "#157a4f",
    },
    primaryBtnText: {
        ...textPresets.body,
        color: "#ffffff",
        lineHeight: Math.round(14 * 1.5)
    },
    successBtn: {
        width: "100%",
        backgroundColor: "#157a4f",
        marginTop: 18,
    },
    successBtnText: {
        ...textPresets.body,
        color: "#ffffff",
        lineHeight: Math.round(14 * 1.5)
    },
    btnDisabled: {
        opacity: 0.5,
    },
    successMessageText: {
        ...textPresets.body,
        color: "#4b5563",
        textAlign: "center",
        lineHeight: 20,
        marginTop: 4,
        paddingHorizontal: 8,
    },
});
