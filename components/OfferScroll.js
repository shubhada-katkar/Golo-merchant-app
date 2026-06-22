import React from "react";
import {
  View, StyleSheet, Image, Text,
} from "react-native";

export default function OfferScroll({ products = [] }) {
  if (!products || products.length === 0) {
    return null;
  }

  const renderItem = (item, index) => {
    const imageUri = item.image?.url || item.imageUrl || item.images?.[0] || "";
    const name = item.productname || item.name || item.productName || "Product";
    const originalPrice = Number(item.originalPrice ?? item.price ?? item.offerPrice ?? 0);
    const offerPrice = Number(item.offerPrice ?? item.price ?? item.originalPrice ?? 0);
    const hasDiscount = offerPrice !== originalPrice && originalPrice > 0;
    const key = item._id || item.id || item.productId || `${name}-${index}`;

    return (
      <View key={key} style={styles.card}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.textbox}>
          <Text style={styles.nameText} numberOfLines={2}>{name}</Text>
          <Text style={styles.text}>Price: Rs. {offerPrice.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.text}>Original: Rs. {originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        {products.map(renderItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    marginVertical: 10,
  },
  listContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 10,
  },
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    maxWidth: "48%",
    borderRadius: 15,
    borderColor: "#000000",
    borderWidth: 1,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  image: {
    borderRadius: 12,
    borderColor: "#d7d7d7",
    width: "100%",
    aspectRatio: 1.25,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeeee",
  },
  imagePlaceholderText: {
    color: "#777",
    fontFamily: "Medium",
    fontSize: 12,
    lineHeight: Math.round(12 * 1.5),
  },
  textbox: {
    paddingTop: 10,
  },
  nameText: {
    fontSize: 14,
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    color: "#111",
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    fontFamily: "Medium",
    lineHeight: Math.round(13 * 1.5),
    color: "#333",
  },
});
