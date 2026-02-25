import React, { useContext, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Notifications({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const profileImg = require("../assets/profile.png"); 

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <View style={{ justifyContent: 'center' }}>
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={26}
                            color={colors.text}
                            style={{ padding: 10 }}
                        />
                    </View>

                </TouchableOpacity>
                <Text style={{ fontSize: 22, color: colors.text, lineHeight: Math.round(24 * 1.2) }}>Notifications</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {[1, 2, 3, 4, 5, 6].map((item, index) => (
                    <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
                        {/* Grey placeholder square */}
                        <Image source={profileImg} style={styles.profileImage} />

                        {/* Text Content */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={{ fontSize: 16, fontFamily: "SemiBold", color: colors.text }}>
                                Moon cafe
                            </Text>
                            <View style={{ flexDirection: "row", gap: 50, alignItems:"center" }}>
                                <Text style={{ fontSize: 13, color: colors.text }}>
                                    Your order is ready.
                                </Text>
                                <Text style={{ fontSize: 13, color: colors.text }}>
                                    11:30 am
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }} >
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 14
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginHorizontal: 10,
        marginTop: 14,
        borderRadius: 12,
        borderRadius: 10,
        borderWidth: 0.5
    },

profileImage: {
    width: 68,
    height: 68,
    borderRadius: 34,  
}
})