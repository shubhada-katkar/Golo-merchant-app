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

export default function Expire() {

    const { colors } = useContext(ThemeContext);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const [token, setToken] = useState(null);

    // Load merchant token
    useEffect(() => {
        AsyncStorage.getItem("merchantToken").then(setToken);
    }, []);

    // Fetch expired offers
    const fetchExpiredOffers = useCallback(async () => {
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
            console.log("Fetch Expired Offers Error:", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Auto-refresh whenever screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchExpiredOffers();
        }, [fetchExpiredOffers])
    );

    // Render card
const renderItem = ({ item }) => {
    const productImage = item.products?.[0]?.image?.url;
    const isActive = item.status === "active";

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
                            {/* STATUS */}
                            <Text
                                style={{
                                    color: isActive ? "green" : "red",
                                    marginRight: 10
                                }}
                            >
                                {item.status}
                            </Text>

                            {/* EDIT ICON (disabled for expired) */}
                            {isActive && (
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
                        Expired On: {new Date(item.validTo).toDateString()}
                    </Text>
                </View>
            </View>
        </View>
    );
};

    return (
        <FlatList
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
            data={offers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={fetchExpiredOffers}
            ListEmptyComponent={
                !loading && (
                    <Text style={{ textAlign: "center", marginTop: 40 }}>
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
