import React, { useContext, useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Modal
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BASE_URL } from "../config";
import { getValidToken } from "../services/authService";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

export default function Active({ searchText = "" }) {
    const navigation = useNavigation();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [deletingOfferId, setDeletingOfferId] = useState(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

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

    useEffect(() => {
        getValidToken()
            .then((freshToken) => {
                if (freshToken) setToken(freshToken);
            })
            .catch(() => {
                // Token not available — component will show empty state
            });
    }, []);

    const normalizeOfferResults = (result) => {
        if (Array.isArray(result)) return result;
        if (result?.data && Array.isArray(result.data)) return result.data;
        return [];
    };

    const normalizeImageUrl = (url) => {
        if (!url || typeof url !== "string") return null;
        return /^https?:\/\//i.test(url)
            ? url
            : `${BASE_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
    };

    const getOfferImage = (item) => {
        const urlCandidates = [
            item.products?.[0]?.image?.url,
            item.imageUrl,
            item.offerImage,
            item.image?.url,
            item.image?.imageUrl,
            typeof item.image === "string" ? item.image : null,
            item.images?.[0],
            item.productImages?.[0],
            item.selectedProducts?.[0]?.imageUrl,
            item.selectedProducts?.[0]?.image?.url,
        ];
        for (const url of urlCandidates) {
            const normalized = normalizeImageUrl(url);
            if (normalized) return normalized;
        }
        return null;
    };

    const fetchOfferDetails = async (offerId) => {
        if (!offerId) return null;
        try {
            const response = await fetch(`${BASE_URL}/offers/${offerId}`);
            if (!response.ok) return null;
            const json = await response.json();
            return json?.data || null;
        } catch (error) {
            console.log(`Fetch offer details failed for ${offerId}:`, error);
            return null;
        }
    };

    const enrichOffersWithDetails = async (offerList) => {
        return await Promise.all(
            offerList.map(async (item) => {
                const offerId = item.offerId || item._id || item.requestId;
                if (!offerId) {
                    return {
                        ...item,
                        imageUrl: getOfferImage(item),
                    };
                }
                const details = await fetchOfferDetails(offerId);
                const merged = {
                    ...item,
                    ...(details || {}),
                };
                return {
                    ...merged,
                    imageUrl: getOfferImage(merged),
                };
            })
        );
    };

    const getOfferId = (item) => item.requestId || item.offerId || item._id || item.id;

    const deleteOffer = async (item) => {
        const offerId = getOfferId(item);
        if (!offerId) {
            showAlert("error", "Delete Failed", "Unable to identify this offer.");
            return;
        }

        try {
            setDeletingOfferId(offerId);
            const accessToken = token || await (getValidToken().catch(() => null));
            if (!accessToken) {
                showAlert("error", "Authentication Required", "Please login again to delete offers.");
                return;
            }

            const response = await fetch(`${BASE_URL}/offers/${offerId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                const message = result?.message || result?.error || `HTTP ${response.status}`;
                showAlert("error", "Delete Failed", message);
                return;
            }

            setOffers((prevOffers) => prevOffers.filter((offer) => getOfferId(offer) !== offerId));
            showAlert("success", "Success", "Offer deleted successfully.");
        } catch (err) {
            showAlert("error", "Delete Failed", err.message || "Unable to delete offer.");
        } finally {
            setDeletingOfferId(null);
        }
    };

    const confirmDeleteOffer = (item) => {
        setDeleteConfirmItem(item);
    };

    const fetchOffers = useCallback(async () => {
        if (!token) {
            setOffers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/offers/my?page=1&limit=100`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();
            let activeOffers = normalizeOfferResults(result);
            // Keep only offers that have a valid-until date in the future
            activeOffers = activeOffers.filter((item) => {
                const raw = item.endDate || item.validTo || item.expiresAt || item.endsAt || item.expiredAt;
                if (!raw) return false;
                const endDate = new Date(raw);
                if (isNaN(endDate.getTime())) return false;
                return endDate.getTime() > Date.now();
            });
            const enrichedOffers = await enrichOffersWithDetails(activeOffers);
            setOffers(enrichedOffers);
        } catch (error) {
            console.log("Fetch Active Offers Error:", error);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchOffers();
        }, [fetchOffers])
    );

    const filteredOffers = offers.filter((item) => {
        const query = searchText?.toLowerCase?.() || "";
        const title = (item.offerTitle || item.bannerTitle || item.title || item.requestId || "").toString().toLowerCase();
        const category = (item.category || item.bannerCategory || "").toString().toLowerCase();
        return title.includes(query) || category.includes(query);
    });

    const renderItem = ({ item }) => {
        const title = item.offerTitle || item.bannerTitle || item.title || item.requestId || "Untitled Offer";
        const discountLabel = item.discount || item.discountPercentage || item.bannerCategory || "N/A";
        const validTo = item.endDate || item.expiresAt || item.endsAt || item.validTo || item.selectedDates?.[item.selectedDates.length - 1] || item.expiredAt;
        const productImage = getOfferImage(item);

        return (
            <View style={styles.card2}>
                <View style={{ flexDirection: "row" }}>
                    {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.image} />
                    ) : (
                        <View style={styles.image} />
                    )}

                    <View style={{ flex: 1, paddingHorizontal: 10, justifyContent: "center" }}>
                        <Text style={{ width: "80%", ...textPresets.body }}>
                            {title}
                        </Text>

                        {validTo && (
                            <Text style={{ ...textPresets.label, color: "#157a4f" }}>
                                Expires On: {new Date(validTo).toDateString()}
                            </Text>
                        )}
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => navigation.navigate("AddOfferPage", { offerData: item })}
                            style={styles.actionButton}  >
                            <AntDesign name="edit" size={18} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => confirmDeleteOffer(item)}
                            style={styles.actionButton}
                            disabled={deletingOfferId === getOfferId(item)}
                        >
                            <MaterialIcons name="delete-outline" size={19} color={deletingOfferId === getOfferId(item) ? "#999" : "#ef4d4d"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={filteredOffers}
                keyExtractor={(item) => item._id || item.offerId || item.requestId || String(item.id || Math.random())}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={fetchOffers}
                ListEmptyComponent={
                    <Text style={{
                        textAlign: 'center', marginTop: 20,
                        ...textPresets.body
                    }}>
                        No active offers available
                    </Text>
                }
            />

            {/* Custom Delete Offer Confirmation Modal */}
            <Modal
                visible={!!deleteConfirmItem}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteConfirmItem(null)}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: "#ffffff" }]}>
                        <View style={styles.modalIconContainer}>
                            <MaterialCommunityIcons name="close-circle" size={40} color="#e53935" />
                        </View>
                        <Text style={styles.modalTitleText}>Delete Offer</Text>
                        <Text style={[styles.modalMessageText, { color: "#555555" }]}>
                            Are you sure you want to delete this offer?
                        </Text>
                        <View style={styles.modalConfirmRow}>
                            <TouchableOpacity
                                style={[styles.modalHalfBtn, { backgroundColor: "#888888" }]}
                                onPress={() => setDeleteConfirmItem(null)}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalHalfBtn, { backgroundColor: "#e53935" }]}
                                onPress={() => {
                                    const target = deleteConfirmItem;
                                    setDeleteConfirmItem(null);
                                    if (target) deleteOffer(target);
                                }}
                            >
                                <Text style={styles.modalBtnText}>Delete</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    card2: {
        borderRadius: 10,
        elevation: 5,
        backgroundColor: "white",
        justifyContent: "center",
        padding: 10,
        marginBottom: 18
    },
    image: {
        width: 90,
        height: 90,
        backgroundColor: "#b8b8b8",
        borderRadius: 14
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    actionRow: {
        flexDirection: "row",
        flexShrink: 0,
    },
    actionButton: {
        padding: 4,
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalCard: {
        width: "100%",
        maxWidth: 320,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    modalIconContainer: {
        marginBottom: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitleText: {
        ...textPresets.body,
        textAlign: "center",
        marginBottom: 8,
        lineHeight: Math.round(14 * 1.5),
    },
    modalMessageText: {
        ...textPresets.label,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: Math.round(14 * 1.5),
    },
    modalConfirmRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    modalHalfBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBtnText: {
        color: "#ffffff",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5),
    },
});