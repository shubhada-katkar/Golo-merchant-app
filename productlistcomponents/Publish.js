import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";

export default function Publish({products, setProducts,searchText,}) {

  const { colors } = useContext(ThemeContext);
  const [deletingId, setDeletingId] = useState(null);
  const navigation = useNavigation();
  // ================= DELETE =================
  const confirmDelete = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProduct(productId),
        },
      ]
    );
  };

const deleteProduct = async (productId) => {
  try {
    setDeletingId(productId);
    const token = await AsyncStorage.getItem("merchantToken");

    let res = await fetch(`${BASE_URL}/merchant/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    }

    if (!res.ok) {
      Alert.alert("Error", "Delete failed");
      return;
    }

    // 🔥 update parent state
    setProducts(prev => prev.filter(p => p._id !== productId));

    Alert.alert("Success", "Product deleted successfully");
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

  const renderItem = ({ item }) => {
    const shortDescription =
      item.description?.length > 25
        ? item.description.substring(0, 25) + "..."
        : item.description;

    return (
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
                  onPress={() => confirmDelete(item._id)}
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
            <Text>{shortDescription}</Text>
          </View>
        </View>
      </View>
    );
  };

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
            No published products available
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
    borderRadius: 12,
    backgroundColor: "#ccc",
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
