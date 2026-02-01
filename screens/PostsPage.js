import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import Recent from "../postscomponents/Recent";
import Expire from "../postscomponents/Expire";
import MostRevenue from "../postscomponents/MostRevenue";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";


export default function ProfilePage({ navigation }) {
    const [activeTab, setactiveTab] = useState("Recent");
    const { colors } = useContext(ThemeContext);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                    <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{ padding: 10 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>Posts</Text>
            </View>

            <View style={styles.row2}>
                <TouchableOpacity onPress={() => setactiveTab("Recent")}
                    style={[styles.row2button, activeTab == "Recent" && styles.ActiveTab]}>
                    <Text style={styles.row2text}>Recent</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Most Revenue")}
                    style={[styles.row2button, activeTab == "Most Revenue" && styles.ActiveTab]}>
                    <Text style={styles.row2text}>Most Revenue</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Expire")}
                    style={[styles.row2button, activeTab == "Expire" && styles.ActiveTab]}>
                    <Text style={styles.row2text}>Expire</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginTop: 5 }} />

            {activeTab == "Recent" && <Recent />}

            {activeTab == "Most Revenue" && <MostRevenue />}

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
        paddingVertical: 8,
        paddingHorizontal: 14
    },
    row2: {
        flexDirection: "row",
        paddingHorizontal: 10,
        gap: 5
    },
    row2text: {
        fontSize: 16,
        color: "white",
        paddingVertical: 2
    },
    row2button: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: "#a5a4a4",
        paddingVertical: 6,
        width: "28%",
        alignItems: "center",
        justifyContent: "center"
    },
    ActiveTab: {
        backgroundColor: "#818181",
        borderWidth: 2,
        borderColor: "#535353",
    }
})