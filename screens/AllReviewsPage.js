import React, { useState, useContext, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import Topbar from "../components/Topbar";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";

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
          const token = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
          if (!token) return;

          setLoading(true);
          const response = await fetch(`${BASE_URL}/reviews/merchant?page=1&limit=100`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

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
      <Topbar />
       <View style={styles.row1}>
                    <TouchableOpacity style={{padding:10}} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={26} color={colors.text}/>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, paddingLeft: 5, color:colors.text,
                        fontFamily:"Medium", lineHeight: Math.round(20 * 1.5)
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
                <Text style={[styles.userName, { color: colors.text }]}> {item.userName || item.userEmail || "Customer"}</Text>
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
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily:"Medium",
    lineHeight: Math.round(22 * 1.5)
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
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
    fontSize: 16,
    fontFamily:"Medium",
    lineHeight: Math.round(16 * 1.5)
  },
  reviewCard: {
    marginBottom: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  starRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontFamily:"Medium",
    lineHeight: Math.round(16 * 1.5),
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 12,
    lineHeight: Math.round(12 * 1.5),
    color: "#374151",
    fontFamily:"Medium"
  },
  reviewDate: {
    marginTop: 12,
    fontSize: 12,
    color: "#9ca3af",
    fontFamily:"Medium",
    lineHeight: Math.round(12 * 1.5)
  },
});
