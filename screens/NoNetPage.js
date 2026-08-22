import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { textPresets } from "../theme/typography";
import NetInfo from "@react-native-community/netinfo";

export default function NoNetPage({ navigation, route }) {
    const [checking, setChecking] = useState(false);

    const handleRetry = async () => {
        setChecking(true);
        const state = await NetInfo.fetch();
        setChecking(false);

        const isOnline = state.isConnected && state.isInternetReachable !== false;
        if (isOnline) {
            // Go back to wherever the user came from, or reset to AuthLoading
            if (route?.params?.onRetrySuccess) {
                route.params.onRetrySuccess();
            } else if (navigation?.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.reset({ index: 0, routes: [{ name: "AuthLoading" }] });
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#ffffffff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 200, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />

            {/* Empty state content */}
            <View style={styles.center}>
                <View style={styles.iconCircle}>
                    <Ionicons name="wifi-outline" size={64} color="#f8a812" />
                    <View style={styles.slash} />
                </View>

                <Text style={styles.title}>No Internet Connection</Text>
                <Text style={styles.subtitle}>
                    Please check your Wi-Fi or mobile data settings and try again.
                </Text>

                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleRetry}
                    disabled={checking}
                    activeOpacity={0.8}
                >
                    {checking ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <MaterialIcons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.retryText}>Try Again</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#fff3e0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },
    slash: {
        position: "absolute",
        width: 90,
        height: 3,
        backgroundColor: "#f8a812",
        transform: [{ rotate: "45deg" }],
        borderRadius: 2,
    },
    title: {
        color: "#222",
        marginBottom: 10,
        textAlign: "center",
        ...textPresets.title
    },
    subtitle: {
        color: "#777",
        textAlign: "center",
        marginBottom: 32,
        ...textPresets.label
    },
    retryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8a812",
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 30,
        minWidth: 160,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    retryText: {
        color: "#fff",
        ...textPresets.body,
        lineHeight: Math.round(14 * 1.5)
    },
});