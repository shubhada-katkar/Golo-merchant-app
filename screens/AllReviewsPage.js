import React, { useState, useContext, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import { BASE_URL } from "../config";
import Topbar from "../components/Topbar";
import { MaterialIcons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

export default function AllReviewsPage({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const resolveRating = (item) => {
    const rating = Number(item?.rating ?? item?.stars ?? 0);
    if (!Number.isFinite(rating)) return 0;
    return Math.min(5, Math.max(0, rating));
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadReviews = async () => {
        try {
          let token;
          try {
            token = await getValidToken();
          } catch (authErr) {
            await handleAuthError(navigation);
            return;
          }
          if (!token) return;

          setLoading(true);
          const response = await fetch(`${BASE_URL}/reviews/merchant?page=1&limit=100`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            await handleAuthError(navigation);
            return;
          }

          const data = await response.json();
          if (!active) return;

          const list = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setReviews(list);
        } catch (error) {
          console.log("AllReviewsPage fetch error:", error);
        } finally {
          if (active) setLoading(false);
        }
      };

      loadReviews();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
      />
      <Topbar />
      <View style={styles.row1}>
        <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{
          ...textPresets.title
        }}>All Reviews</Text>
      </View>

      <View style={{ height: 1, backgroundColor: colors.divider, marginBottom: 10 }} />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f766e" />
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No reviews found yet.</Text>
          </View>
        ) : (
          reviews.map((item) => {
            const rating = resolveRating(item);
            return (
              <View key={item._id || item.id || Math.random()} style={styles.reviewCard}>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                    <MaterialCommunityIcons name="account-circle-outline" size={18} color="#157a4f" />
                    <Text style={styles.userName}>{item.userName || item.userEmail || "Customer"}</Text>
                  </View>

                  <View style={styles.starRow}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <AntDesign
                        key={index}
                        name="star"
                        size={18}
                        color={index < rating ? "yellow" : "#d1d5db"}
                      />
                    ))}

                  </View>
                </View>

                <Text style={[styles.reviewText, { color: colors.text }]}>{item.content || "No review content."}</Text>
                {item.createdAt ? (
                  <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  loadingBox: {
    paddingTop: 24,
    alignItems: "center",
  },
  emptyBox: {
    paddingTop: 24,
    alignItems: "center",
  },
  emptyText: {
    ...textPresets.body,
  },
  reviewCard: {
    marginBottom: 14,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    borderWidth: 0.5,
    borderColor: "#157a4f"
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  userName: {
    ...textPresets.body,
    color: "#157a4f",
    lineHeight: Math.round(14 * 1.5),
  },
  reviewText: {
    ...textPresets.label,
    color: "#374151",
  },
  reviewDate: {
    marginTop: 8,
    color: "#9ca3af",
    ...textPresets.caption
  },
});