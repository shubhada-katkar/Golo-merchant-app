import React, { useEffect, useState, useContext } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Image, Alert,
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Draft({ products, setProducts, searchText, }) {

  const { colors } = useContext(ThemeContext);
  const [deletingId, setDeletingId] = useState(null);
  const navigation = useNavigation();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  // ================= PUBLISH =================
  const publishNow = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");

      const res = await fetch(
        `${BASE_URL}/api/products/${productId}/publish`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        Alert.alert("Error", "Publish failed");
        return;
      }

      // 🔥 move product from draft → published
      setProducts(prev =>
        prev.map(p =>
          p._id === productId
            ? { ...p, status: "published" }
            : p
        )
      );

      Alert.alert("Success", "Product published!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Server error");
    }
  };

  // ================= DELETE =================
  const deleteDraft = async (productId) => {
    try {
      setDeletingId(productId);
      const token = await AsyncStorage.getItem("merchantToken");

      const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        Alert.alert("Error", "Delete failed");
        return;
      }

      // 🔥 remove globally
      setProducts(prev => prev.filter(p => p._id !== productId));

      Alert.alert("Success", "Draft deleted");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Server error");
    } finally {
      setDeletingId(null);
    }
  };

  // ================= UI =================
  const filteredProducts = products.filter(
    (item) =>
      item.productname?.toLowerCase().includes(searchText?.toLowerCase() || "") ||
      item.category?.toLowerCase().includes(searchText?.toLowerCase() || "")
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row" }}>
        {item.image?.url ? (
          <Image source={{ uri: item.image.url }} style={styles.image} />
        ) : (
          <View style={styles.image} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <View style={styles.row}>
            <Text style={{ fontSize: 18 }}>{item.productname}</Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                disabled={deletingId === item._id}
                onPress={() => deleteDraft(item._id)}
              >
                <MaterialIcons
                  name={
                    deletingId === item._id
                      ? "hourglass-empty"
                      : "delete-outline"
                  }
                  size={24}
                  color="red"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("NewProductPage", { product: item })
                }
              >
                <AntDesign name="edit" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <Text>{item.category}</Text>
          <Text numberOfLines={1}>{item.description}</Text>

          <TouchableOpacity
            style={styles.publish}
            onPress={() => publishNow(item._id)}
          >
            <Text>+ Publish Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No drafts available
          </Text>
        }
      />
      <TouchableOpacity
        style={styles.addbuttton}
        onPress={() => navigation.navigate("NewProductPage")}
      >
        <AntDesign name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  publish: {
    backgroundColor: "#f5b849",
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  addbuttton: {
    position: "absolute",
    bottom: 70,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#157a4f",
    justifyContent: "center",
    alignItems: "center",
  },
});
