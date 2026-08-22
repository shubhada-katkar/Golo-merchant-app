import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { getValidToken, clearAuthStorage } from "../services/authService";
import { textPresets } from "../theme/typography";

/**
 * AuthLoading – shown on every cold start of the merchant app.
 *
 * What it does:
 *  1. Checks network connectivity using NetInfo. If offline → sends to NoNetPage.
 *  2. Tries to get (or silently refresh) a valid access token.
 *  3. On success  → send merchant straight to HomePage (no re-login needed).
 *  4. On SESSION_EXPIRED / NOT_AUTHENTICATED → clear storage, send to Login.
 *  5. On NETWORK_ERROR → send merchant to NoNetPage.
 */
export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const netState = await NetInfo.fetch();
        const isOffline = netState.isConnected === false || (netState.isConnected === true && netState.isInternetReachable === false);
        if (isOffline) {
          navigation.reset({ index: 0, routes: [{ name: "NoNetPage" }] });
          return;
        }

        await getValidToken(); // refreshes silently if access token has expired
        navigation.reset({ index: 0, routes: [{ name: "HomePage" }] });
      } catch (err) {
        if (err.message === "NETWORK_ERROR") {
          navigation.reset({ index: 0, routes: [{ name: "NoNetPage" }] });
        } else {
          // Token truly expired / no session
          await clearAuthStorage();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }
      }
    };

    const t = setTimeout(bootstrap, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#157a4f" />
      <Text style={styles.title}>Please wait…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    marginTop: 16,
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
});
