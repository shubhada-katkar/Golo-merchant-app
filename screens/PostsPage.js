import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import Recent from "../postscomponents/Recent";
import Expire from "../postscomponents/Expire";
import Active from "../postscomponents/Active";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfilePage({ navigation }) {
    const [activeTab, setactiveTab] = useState("Recent");
    const { colors } = useContext(ThemeContext);

    return (
        <SafeAreaView style={{ flex: 1 }}>
                    <LinearGradient
                        colors={["#f8a812", "#fad081", "#fffbf4"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{height: 250, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0}}
                    />
            <View style={{ zIndex: 1 }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <MaterialIcons name="arrow-back-ios" size={26} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, paddingLeft: 5, color: colors.text,
                    fontFamily:"Medium", lineHeight: Math.round(20 * 1.5)
                 }}>Offers</Text>
            </View>

            <View style={styles.row2}>
                <TouchableOpacity onPress={() => setactiveTab("Recent")}
                    style={[styles.row2button, activeTab == "Recent" && styles.ActiveTab]}>
                    <Text style={[styles.row2text, activeTab == "Recent" && styles.ActiveTabText]}>Recent</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Active")}
                    style={[styles.row2button, activeTab == "Active" && styles.ActiveTab]}>
                    <Text style={[styles.row2text, activeTab == "Active" && styles.ActiveTabText]}>Active</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Expire")}
                    style={[styles.row2button, activeTab == "Expire" && styles.ActiveTab]}>
                    <Text style={[styles.row2text, activeTab == "Expire" && styles.ActiveTabText]}>Expire</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginTop: 5 }} />
</View>

            {activeTab == "Recent" && <Recent />}

            {activeTab == "Active" && <Active />}

            {activeTab == "Expire" && <Expire />}

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
        paddingBottom: 6

    },
    row2text: {
        fontSize: 14,
        color: "white",
        fontFamily:"Medium", 
        lineHeight: Math.round(14 * 1.5)
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