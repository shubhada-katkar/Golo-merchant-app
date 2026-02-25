import React, { useContext, useRef } from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons } from "@expo/vector-icons";

export default function ChatPage({navigation}) {
    const { colors } = useContext(ThemeContext);

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
                <Text style={{ fontSize: 24, color: colors.text, fontFamily: "SemiBold", lineHeight: Math.round(24 * 1.2) }}>Chats</Text>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, color: colors.divider, marginTop: 10 }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.chatCard} onPress={()=>navigation.navigate("ChatScreen")}>
                        {/* Profile Image */}
                        <Image
                            source={require("../assets/profile.png")}
                            style={styles.avatar}
                        />

                        {/* Chat Content */}
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.name,{color:colors.text}]}>Sagar Sweets</Text>
                            <Text style={[styles.message,{color:colors.text}]}>Pls take a look at the images.</Text>
                        </View>

                        {/* Time + Badge */}
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.time}>18.31</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>5</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>


            <SafeAreaView
                edges={["bottom"]}
                style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
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
    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    avatar: {
        width: 60,
        height: 60,
        borderRadius: 24,
        marginRight: 12,
    },

    name: {
        fontSize: 16,
        fontFamily: "SemiBold",
        color: "#111",
    },

    message: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },

    time: {
        fontSize: 12,
        color: "#999",
    },

    badge: {
        marginTop: 6,
        backgroundColor: "#5E5CE6",
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },

    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "SemiBold",
    },

})