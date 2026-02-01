import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert } from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Draft() {

  const { colors } = useContext(ThemeContext);
  const [drafts, setDrafts] = useState([]);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  const navigation = useNavigation();

  // Fetch Drafts
  const fetchDrafts = async () => {
    try {

      const token = await AsyncStorage.getItem("merchantToken");

      if (!token) {
        Alert.alert("Login Required", "Please login again");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/products/draft`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        setDrafts(data);
      } else {
        Alert.alert("Error", data.message || "Failed to load drafts");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server error");
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Publish Draft
  const publishNow = async (productId) => {
    try {

      const token = await AsyncStorage.getItem("merchantToken");

      const res = await fetch(
        `${BASE_URL}/api/products/${productId}/publish`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Product published!");
        fetchDrafts();
      } else {
        Alert.alert("Error", data.message || "Publish failed");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server error");
    }
  };

  // Render Card
  const renderItem = ({ item }) => {

    const shortDescription =
      item.description?.length > 25
        ? item.description.substring(0, 25) + "..."
        : item.description;

    return (
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
            <Text>{shortDescription}</Text>

            <TouchableOpacity
              style={styles.publish}
              onPress={() => publishNow(item._id)}>

              <Text>+ Publish Now</Text>

            </TouchableOpacity>

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
        data={drafts}
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
        onPress={() => navigation.navigate("NewProductPage")}>

        <AntDesign name="plus" size={24} color="#fff" />

      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  card2: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "white",
    marginBottom: 15,
    elevation: 5
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#ccc"
  },

  publish: {
    backgroundColor: "#f5b849",
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start"
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
