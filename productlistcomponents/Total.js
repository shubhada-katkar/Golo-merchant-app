import React, { useState, useContext } from "react";
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

export default function Total({ products, setProducts, searchText,}) {

  const { colors } = useContext(ThemeContext);

  const [deletingId, setDeletingId] = useState(null);
  const navigation = useNavigation();

  const getProductId = (item) => item?.productId || item?._id || item?.id;

  // ================= DELETE PRODUCT =================
 const deleteProduct = async (productId) => {
  try {
    setDeletingId(productId);

    const token = await AsyncStorage.getItem("merchantToken");
    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }

    let res = await fetch(`${BASE_URL}/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status === 404) {
      res = await fetch(`${BASE_URL}/merchant/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (!res.ok) {
      Alert.alert("Error", "Delete failed");
      return;
    }

    setProducts((prev) => prev.filter((p) => getProductId(p) !== productId));

    Alert.alert("Success", "Product deleted");
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Server error");
  } finally {
    setDeletingId(null);
  }
};

  const confirmDelete = (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure?",
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

  // ================= FILTER =================
  const filteredProducts = products.filter(
    (item) =>
      item.productname?.toLowerCase().includes(searchText?.toLowerCase() || "") ||
      item.category?.toLowerCase().includes(searchText?.toLowerCase() || "")
  );

  // ================= UI =================
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row" }}>
        {(() => {
          const imageUri =
            typeof item.image === "string"
              ? item.image
              : item.image?.url || item.image?.imageUrl || item.imageUrl || item.images?.[0] || item.productImages?.[0];
          return imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.image} />
          );
        })()}

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <View style={styles.row}>
            <Text style={{ fontSize: 18 }}>{item.productname}</Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                disabled={deletingId === getProductId(item)}
                onPress={() => confirmDelete(getProductId(item))}
              >
                <MaterialIcons
                  name={
                    deletingId === getProductId(item)
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
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => getProductId(item)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.text }}>
            No products available
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
    marginBottom: 12,
    elevation: 5,
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
