import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert } from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Total() {

  const { colors } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const navigation = useNavigation();
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  // Fetch All Merchant Products
  const fetchProducts = async () => {
    try {

      const token = await AsyncStorage.getItem("merchantToken");

      if (!token) {
        Alert.alert("Login Required", "Please login again");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(data.reverse());
      } else {
        Alert.alert("Error", data.message || "Failed to load products");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server error");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Short description helper
  const truncate = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card2}>

      <View style={{ flexDirection: "row" }}>

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.image} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 10 }}>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 20 }}>{item.productname}</Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("NewProductPage", { product: item })
              }>

              <AntDesign name="edit" size={22} />

            </TouchableOpacity>
          </View>

          <Text>{item.category}</Text>
          <Text>{truncate(item.description)}</Text>

        </View>

      </View>

    </View>
  );

  return (

    <View style={{ flex: 1 }}>

      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.text }}>
            No products available
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.addbuttton}
        onPress={() => navigation.navigate("NewProductPage")}>

        <AntDesign name="plus" size={24} color="#fff" />

      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  card2: {
    borderRadius: 10,
    minHeight: 120,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "white",
    elevation: 6,
    marginBottom: 12
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#ccc"
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
    alignItems: "center"
  }

});
