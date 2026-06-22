import React, { useContext, useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Alert
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

export default function Expire() {
    const { colors } = useContext(ThemeContext);
    const navigation = useNavigation();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [deletingOfferId, setDeletingOfferId] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem("merchantToken").then((value) => {
            if (value) {
                setToken(value);
            } else {
                AsyncStorage.getItem("accessToken").then((fallback) => {
                    if (fallback) setToken(fallback);
                });
            }
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
            Alert.alert("Delete Failed", "Unable to identify this offer.");
            return;
        }

        try {
            setDeletingOfferId(offerId);
            const accessToken = token || await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
            if (!accessToken) {
                Alert.alert("Authentication Required", "Please login again to delete offers.");
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
                Alert.alert("Delete Failed", message);
                return;
            }

            setOffers((prevOffers) => prevOffers.filter((offer) => getOfferId(offer) !== offerId));
            Alert.alert("Success", "Offer deleted successfully.");
        } catch (err) {
            Alert.alert("Delete Failed", err.message || "Unable to delete offer.");
        } finally {
            setDeletingOfferId(null);
        }
    };

    const confirmDeleteOffer = (item) => {
        Alert.alert(
            "Delete Offer",
            "Are you sure you want to delete this offer?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteOffer(item) }
            ]
        );
    };

    const fetchExpiredOffers = useCallback(async () => {
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
            let expiredOffers = normalizeOfferResults(result);
            // Keep only offers whose valid-until date has already passed
            expiredOffers = expiredOffers.filter((item) => {
                const raw = item.endDate || item.validTo || item.expiresAt || item.endsAt || item.expiredAt;
                if (!raw) return false;
                const endDate = new Date(raw);
                if (isNaN(endDate.getTime())) return false;
                return endDate.getTime() <= Date.now();
            });
            const enrichedOffers = await enrichOffersWithDetails(expiredOffers);
            setOffers(enrichedOffers);
        } catch (error) {
            console.log("Fetch Expired Offers Error:", error);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchExpiredOffers();
        }, [fetchExpiredOffers])
    );

    const renderItem = ({ item }) => {
        const title = item.offerTitle || item.bannerTitle || item.title || item.requestId || "Untitled Offer";
        const status = item.status || "expired";
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

                    <View style={{ flex: 1, paddingHorizontal: 10, justifyContent:"center"
                     }}>
                            <Text style={{ fontSize: 16, fontFamily: "Medium",
                                lineHeight: Math.round(16 * 1.5), width: "80%"
                            }}>
                                {title}
                            </Text>

                        {validTo && (
                            <Text style={{ fontSize: 12, marginTop: 3,
                                fontFamily:"Medium", lineHeight: Math.round(12 * 1.5), color:"#157a4f"
                             }}>
                                Expired On: {new Date(validTo).toDateString()}
                            </Text>
                        )}
                    </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => navigation.navigate("AddOfferPage", { offerData: item }) }
                        style={styles.actionButton} >
                        <AntDesign name="edit" size={18} color="black" />
                        </TouchableOpacity>
                                
                    <TouchableOpacity onPress={() => confirmDeleteOffer(item)}
                        style={styles.actionButton}  disabled={deletingOfferId === getOfferId(item)}  >
                        <MaterialIcons name="delete-outline" size={19} color={deletingOfferId === getOfferId(item) ? "#999" : "#ef4d4d"} />
                        </TouchableOpacity>
                </View>

                </View>
            </View>
        );
    };

    return (
        <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
            data={offers}
            keyExtractor={(item) => item._id || item.offerId || item.requestId || String(item.id || Math.random())}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={fetchExpiredOffers}
            ListEmptyComponent={
                !loading && (
                    <Text style={{ textAlign: "center", marginTop: 20, color: colors.text,
                        fontSize:12, fontFamily:"Medium", lineHeight: Math.round(12 * 1.5)
                     }}>
                        No expired offers yet
                    </Text>
                )
            }
        />
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
    }
});