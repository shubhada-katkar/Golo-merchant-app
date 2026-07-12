import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { getValidToken, clearAuthStorage } from "../services/authService";

/**
 * AuthLoading – shown on every cold start of the merchant app.
 *
 * What it does:
 *  1. Tries to get (or silently refresh) a valid access token.
 *  2. On success  → send merchant straight to HomePage (no re-login needed).
 *  3. On SESSION_EXPIRED / NOT_AUTHENTICATED → clear storage, send to Login.
 *  4. On NETWORK_ERROR → still go to HomePage with cached token
 *     (merchant is offline but was previously logged in – let them proceed).
 */
export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await getValidToken(); // refreshes silently if access token has expired
        navigation.reset({ index: 0, routes: [{ name: "HomePage" }] });
      } catch (err) {
        if (err.message === "NETWORK_ERROR") {
          // Offline but session exists – let them in with the cached token
          navigation.reset({ index: 0, routes: [{ name: "HomePage" }] });
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
    fontSize: 18,
    fontFamily: "Medium",
  },
});
