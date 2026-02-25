import React, { useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";

export default function ChatScreen({ navigation }) {
    const { colors } = useContext(ThemeContext);
    return (

        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate("ChatsPage")}>
                        <Ionicons name="arrow-back" size={26} style={{ padding: 5 }} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sagar Sweets</Text>
                    <View style={styles.headerIcons}>
                        <Ionicons name="call-outline" size={22} />
                        <Entypo name="dots-three-vertical" size={20} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <View style={styles.systemMsg}>
                        <Text>Chat from: Store Chat</Text>
                    </View>

                    <View style={styles.leftBubble}><Text>So excited!</Text></View>
                    <View style={styles.leftBubble}><Text>What should we make?</Text></View>
                    <View style={styles.leftBubble}><Text>Barfi?</Text></View>

                    <View style={styles.linkCard}>
                        <View style={styles.imagePlaceholder} />
                        <Text style={styles.linkTitle}>Homemade Kaju katli</Text>
                        <Text style={styles.linkUrl}>everyKajukatliever.com</Text>
                    </View>
                    <View style={styles.rightBubble}>
                        <Text style={{ color: "#ffffff" }}>
                            or we could make this?
                        </Text></View>

                    <View style={styles.leftBubble}><Text>Sounds good!</Text></View>
                </ScrollView>

                {/* Input */}
                <View style={styles.inputRow}>
                    <TouchableOpacity><Ionicons name="add" size={24} /></TouchableOpacity>
                    <TextInput placeholder="Type a message..." style={styles.input} />
                    <TouchableOpacity><Ionicons name="send" size={24} /></TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fffaf2" },
    header: {
        flexDirection: "row",
        padding: 16,
        justifyContent: "space-between",
        alignItems: "center"
    },
    headerTitle: { fontSize: 20 },
    headerIcons: { flexDirection: "row", gap: 12 },

    systemMsg: {
        backgroundColor: "#ddd",
        padding: 8,
        borderRadius: 8,
        alignSelf: "center",
        marginBottom: 12
    },

    leftBubble: {
        backgroundColor: "#f5b849",
        padding: 10,
        borderRadius: 16,
        alignSelf: "flex-start",
        marginVertical: 4
    },

    rightBubble: {
        backgroundColor: "#0c6b4f",
        padding: 10,
        borderRadius: 16,
        alignSelf: "flex-end",
        marginTop: 8
    },

    linkCard: {
        backgroundColor: "#0c6b4f",
        borderRadius: 12,
        padding: 10,
        marginVertical: 8
    },

    imagePlaceholder: {
        height: 120,
        backgroundColor: "#ddd",
        borderRadius: 8
    },

    linkTitle: { color: "white", marginTop: 6 },
    linkUrl: { color: "#bde5d3", fontSize: 12 },

    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderTopWidth: 1,
        borderColor: "#eee"
    },
    input: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 12,
        marginHorizontal: 8
    }
});