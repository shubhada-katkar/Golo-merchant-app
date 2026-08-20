import React, { useState, useEffect, useCallback, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import Recent from "../postscomponents/Recent";
import Expire from "../postscomponents/Expire";
import Active from "../postscomponents/Active";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

export default function ProfilePage({ navigation }) {
    const [activeTab, setactiveTab] = useState("Recent");
    const [searchText, setSearchText] = useState("");
    const [totalOffers, setTotalOffers] = useState(0);
    const [activeOffers, setActiveOffers] = useState(0);
    const [expiredOffers, setExpiredOffers] = useState(0);

    const normalizeOfferResults = (result) => {
        if (Array.isArray(result)) return result;
        if (result?.data && Array.isArray(result.data)) return result.data;
        return [];
    };

    const isActiveOffer = (item) => {
        const raw = item.endDate || item.validTo || item.expiresAt || item.endsAt || item.expiredAt;
        if (!raw) return false;
        const endDate = new Date(raw);
        if (isNaN(endDate.getTime())) return false;
        return endDate.getTime() > Date.now();
    };

    const fetchOfferSummary = useCallback(async () => {
        let token;
        try {
            token = await getValidToken();
        } catch (authErr) {
            await handleAuthError(navigation);
            return;
        }
        if (!token) {
            setTotalOffers(0);
            setActiveOffers(0);
            setExpiredOffers(0);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/offers/my?page=1&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 401) {
                await handleAuthError(navigation);
                return;
            }
            const result = await response.json();
            const offers = normalizeOfferResults(result);
            setTotalOffers(offers.length);
            setActiveOffers(offers.filter(isActiveOffer).length);
            setExpiredOffers(offers.filter((item) => !isActiveOffer(item)).length);
        } catch (error) {
            console.log("Offer summary error:", error);
            setTotalOffers(0);
            setActiveOffers(0);
            setExpiredOffers(0);
        }
    }, []);

    useEffect(() => {
        fetchOfferSummary();
    }, [fetchOfferSummary]);

    useFocusEffect(
        useCallback(() => {
            fetchOfferSummary();
        }, [fetchOfferSummary])
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#f8f6f265"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 250, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <View style={{ zIndex: 1 }}>
                <Topbar />

                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                        <MaterialIcons name="arrow-back-ios" size={22} style={{ padding: 10 }} />
                    </TouchableOpacity>
                    <Text style={{
                        ...textPresets.title
                    }}>Offers</Text>
                </View>


                <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1, marginBottom: 10 }} />

                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color="#919191" />
                    <TextInput
                        placeholder="Search offers..."
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                    />
                </View>

                <View style={styles.row2}>
                    <TouchableOpacity onPress={() => setactiveTab("Recent")}
                        style={[styles.row2button, activeTab == "Recent" && styles.ActiveTab]}>
                        <Text style={[styles.tabCountText, activeTab == "Recent" && styles.ActiveTabText]}>{totalOffers}</Text>
                        <Text style={[styles.row2text, activeTab == "Recent" && styles.ActiveTabText]}>Recent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Active")}
                        style={[styles.row2button, activeTab == "Active" && styles.ActiveTab]}>
                        <Text style={[styles.tabCountText, activeTab == "Active" && styles.ActiveTabText]}>{activeOffers}</Text>
                        <Text style={[styles.row2text, activeTab == "Active" && styles.ActiveTabText]}>Active</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Expire")}
                        style={[styles.row2button, activeTab == "Expire" && styles.ActiveTab]}>
                        <Text style={[styles.tabCountText, activeTab == "Expire" && styles.ActiveTabText]}>{expiredOffers}</Text>
                        <Text style={[styles.row2text, activeTab == "Expire" && styles.ActiveTabText]}>Expire</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab == "Recent" && <Recent searchText={searchText} />}

            {activeTab == "Active" && <Active searchText={searchText} />}

            {activeTab == "Expire" && <Expire searchText={searchText} />}

            <SafeAreaView edges={["bottom"]}
                style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 10
    },
    row2: {
        flexDirection: "row",
        paddingHorizontal: 10,
        justifyContent: "space-between",
        paddingBottom: 6,
    },
    searchBar: {
        backgroundColor: "white",
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: "#d1d5db",
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        top: 3,
        ...textPresets.body
    },
    row2text: {
        color: "white",
        ...textPresets.label
    },
    tabCountText: {
        color: "white",
        ...textPresets.subtitle
    },
    row2button: {
        borderRadius: 20,
        backgroundColor: "#b4b4b4",
        paddingVertical: 8,
        width: "32%",
        alignItems: "center",
        justifyContent: "center",
    },
    ActiveTab: {
        backgroundColor: "#ffffff",
        borderWidth: 2,
        borderColor: "#157a4f",
    },
    ActiveTabText: {
        color: "#157a4f",
    },
})