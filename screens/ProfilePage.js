import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { BackHandler, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function ProfilePage({ navigation }) {
    const { colors } = useContext(ThemeContext);
    useFocusEffect(
        useCallback(() => {

            const onBackPress = () => {
                BackHandler.exitApp(); // CLOSE APP
                return true; // Prevent default behavior
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );

            return () => subscription.remove();

        }, [])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>Profile</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider }} />

            <View style={styles.row2}>
                <TouchableOpacity >
                    <Image source={require("../assets/profile.png")} style={styles.image} />
                </TouchableOpacity>

                <Text style={{ fontSize: 26, paddingHorizontal: 16, color: colors.text }}>Moon Cafe</Text>
                <TouchableOpacity>
                    <MaterialIcons name="edit" size={22} color={colors.text}/>
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 40, paddingVertical: 6 }}>
                <TouchableOpacity style={styles.switch}>
                    <View style={{ flexDirection: "row" }}>
                        <MaterialCommunityIcons name="account-switch-outline" size={20} />
                        <Text style={{ fontSize: 14, paddingHorizontal: 5 }}>Switch To Customer</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ paddingTop: 30 }}>
                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("SettingsPage")}>
                    <Feather name="settings" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items}>
                    <AntDesign name="question-circle" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Help Center</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("LoyaltyPage")}>
                    <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Loyality Rewards</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                    <MaterialCommunityIcons name="account-cog-outline" size={24} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Profile Settings</Text>
                </TouchableOpacity>
            </View>

            <SafeAreaView edges={["bottom"]}
                style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>

        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    image: {
        width: 90,
        height: 90
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14
    },
    row2: {
        flexDirection: "row",
        paddingHorizontal: 30,
        alignItems: "center",
        paddingTop: 8
    },
    switch: {
        backgroundColor: "#c0bdbd",
        borderRadius: 14,
        justifyContent: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 22,
        paddingVertical: 6
    },
    items: {
        flexDirection: "row",
        paddingHorizontal: 40,
        paddingVertical: 12,
        alignItems: "center"
    },
    text: {
        fontSize: 20,
        paddingHorizontal: 8,
    },
})