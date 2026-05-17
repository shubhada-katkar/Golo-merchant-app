import React, { useContext, useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

export default function Recent() {

    const { colors } = useContext(ThemeContext);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const [token, setToken] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem("merchantToken").then(setToken);
    }, []);

    // FETCH OFFERS
    const fetchOffers = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            let response = await fetch(`${BASE_URL}/offers/merchant`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok && response.status === 404) {
                response = await fetch(`${BASE_URL}/banners/promotions/my`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    method: "GET"
                });
            }

            const result = await response.json();
            setOffers(Array.isArray(result) ? result : []);

        } catch (error) {
            console.log("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Auto-refresh whenever screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchOffers();
        }, [token])
    );

    // FILTER: Only show non-expired offers
    const activeOffers = offers.filter((item) => {
        const validTo = new Date(item.validTo);
        const now = new Date();
        return validTo > now; // Only future dates
    });

    // RENDER CARD
    const renderItem = ({ item }) => {
        let productImage = item.products?.[0]?.image?.url;
        // Normalize image URL if relative
        if (productImage && typeof productImage === 'string' && !/^https?:\/\//i.test(productImage)) {
            productImage = `${BASE_URL.replace(/\/$/, '')}/${productImage.replace(/^\//, '')}`;
        }

        return (
            <View style={styles.card2}>
                <View style={{ flexDirection: "row" }}>
                    {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.image} />
                    ) : (
                        <View style={styles.image} />
                    )}

                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <View style={styles.rowBetween}>
                            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                                {item.title}
                            </Text>

                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{
                                    color: item.status === "active" ? "green" : "red",
                                    marginRight: 10
                                }}>
                                    {item.status}
                                </Text>

                                {item.status === "active" && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate("AddOfferPage", {
                                                offerData: item
                                            })
                                        }
                                    >
                                        <AntDesign name="edit" size={18} color="black" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <Text style={{ marginTop: 5 }}>
                            Discount: {item.discountPercentage}%
                        </Text>

                        <Text style={{ fontSize: 12, marginTop: 3 }}>
                            Valid Till: {new Date(item.validTo).toDateString()}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={activeOffers}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={fetchOffers}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 20, color: colors.text }}>
                        No active offers
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card2: {
        borderRadius: 10,
        minHeight: 120,
        borderWidth: 1,
        elevation: 5,
        backgroundColor: "white",
        justifyContent: "center",
        paddingHorizontal: 10,
        marginBottom: 18
    },
    image: {
        width: 100,
        height: 100,
        backgroundColor: "#b8b8b8",
        borderRadius: 14
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    }
});
