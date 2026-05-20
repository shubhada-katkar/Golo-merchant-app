import React from "react";
import {
  View, StyleSheet, Image, Text, FlatList, Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function OfferScroll({ products = [], discount }) {
  if (!products || products.length === 0) {
    return null;
  }
  const getContainerHeight = () => {
    if (products.length === 1) return height * 0.19;
    if (products.length === 2) return height * 0.36;
    if (products.length >= 3) return height * 0.53;
    return 0;
  };

  const renderItem = ({ item }) => {
    const imageUri = item.image?.url || item.imageUrl || item.images?.[0] || "";
    const name = item.productname || item.name || item.productName || "Product";
    const originalPrice = Number(item.originalPrice ?? item.price ?? item.offerPrice ?? 0);
    const offerPrice = Number(item.offerPrice ?? item.price ?? item.originalPrice ?? 0);
    const hasDiscount = offerPrice !== originalPrice && originalPrice > 0;

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        <View style={styles.textbox}>
          <Text style={styles.text}>Name: {name}</Text>
          <Text style={styles.text}>Price: ₹{offerPrice.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.text}>Original: ₹{originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { height: getContainerHeight() }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id || item.id || item.productId || String(item?.name || item?.productname || Math.random())}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    marginVertical: 10,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    borderRadius: 15,
    borderColor: "#000000",
    borderWidth: 1,
    minHeight: width * 0.3,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  image: {
    borderRadius: 12,
    borderWidth: 1,
    width: width * 0.35,
    height: width * 0.25,
  },
  textbox: {
    paddingLeft: 12,
    flex: 1,
  },
  text: {
    fontSize: Math.min(width * 0.04, 16),
  },
});