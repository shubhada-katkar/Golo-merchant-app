import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { useRef } from "react";


export default function SettingsPage({ navigation }) {
    const [location, setLocation] = useState("Karveer");
    const { theme, colors, toggleTheme } = useContext(ThemeContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
    const arrowRef = useRef();

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
            <Topbar />

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => navigation.goBack("ProfilePage")}>
                    <MaterialIcons name="arrow-back-ios" size={28} style={{ padding: 10 }} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>
                    Settings
                </Text>

            </View>

            <View style={{ flexDirection: "row", backgroundColor: "black", height: 1 }} />

            <View style={{ paddingTop: 30 }}>
                <View style={styles.items} onPress={() => navigation.navigate("SettingsPage")}>
                    <Feather name="settings" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Dark Mode</Text>
                    <Switch
                        value={theme === "dark"}
                        onValueChange={toggleTheme}
                        thumbColor={theme === "dark" ? "#157a4f" : "#f4f3f4"}
                        trackColor={{ false: "#ccc", true: "#141414" }}
                        ios_backgroundColor="#ccc"
                        style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10 }}
                    />
                </View>

                <View style={{ position: "relative" }}>

                    {/* LOCATION ROW */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.items}
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Ionicons name="location-outline" size={22} color={colors.text} />

                        <Text style={[styles.text, { color: colors.text }]}>
                            {location}
                        </Text>

                        <MaterialIcons
                            name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                            size={30}
                            color={colors.text}
                        />
                    </TouchableOpacity>

                    {/* DROPDOWN */}
                    {showDropdown && (
                        <>
                            <View style={styles.dropdown}>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled={true}
                                >
                                    {["Karveer", "Ichalkaranji", "Rajampuri", "Shahupuri", "Bawda", "Gandhinagar"].map(item => (
                                        <TouchableOpacity
                                            key={item}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setLocation(item);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdowntext}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </>
                    )}
                </View>
                <TouchableOpacity style={styles.items}>
                    <Ionicons name="language-outline" size={22} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Language</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.items} onPress={() => navigation.navigate("ProfileSettingsPage")}>
                    <MaterialCommunityIcons name="account-cog-outline" size={24} color={colors.text} />
                    <Text style={[styles.text, { color: colors.text }]}>Profile Settings</Text>
                </TouchableOpacity>
            </View>

                {/* FULL SCREEN OVERLAY */}
                {showDropdown && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowDropdown(false)}
                    />
                )}

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
    items: {
        flexDirection: "row",
        paddingHorizontal: 40,
        paddingVertical: 12,
        alignItems: "center"
    },
    text: {
        fontSize: 20,
        paddingHorizontal: 8
    },
    dropdown: {
        position: "absolute",
        top: "100%",
        marginTop: 5,
        width: "70%",
        left: 40,
        backgroundColor: "white",
        borderRadius: 10,
        zIndex: 2,
        maxHeight: 180,

        // Android shadow
        elevation: 10,

        // iOS shadow
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
    },

    dropdownItem: {
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    dropdowntext: {
        fontSize: 18
    },
    overlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1
    },
})