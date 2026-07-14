import React from "react";
import {
  View, StyleSheet, Image, Text, TextInput,
} from "react-native";
import { textPresets } from "../theme/typography";

export default function OfferScroll({ products = [], onChangeDiscountPrice }) {
  if (!products || products.length === 0) {
    return null;
  }

  const renderItem = (item, index) => {
    const imageUri = item.image?.url || item.imageUrl || item.images?.[0] || "";
    const name = item.productname || item.name || item.productName || "Product";
    const originalPrice = Number(item.originalPrice ?? item.price ?? 0);

    // Use the raw string/number value from state, default to original price
    const offerPriceVal = item.offerPrice !== undefined && item.offerPrice !== null ? item.offerPrice : originalPrice;
    const offerPriceNum = Number(offerPriceVal);
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
          <Text style={styles.text}>Original Price: Rs. {originalPrice.toFixed(2)}</Text>
          {onChangeDiscountPrice ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Discount Price (Rs.):</Text>
              <TextInput
                style={styles.discountInput}
                value={offerPriceVal.toString()}
                keyboardType="numeric"
                onChangeText={(val) => onChangeDiscountPrice(key, val)}
              />
            </View>
          ) : (
            <Text style={styles.text}>
              Price: Rs. {Number.isFinite(offerPriceNum) ? offerPriceNum.toFixed(2) : originalPrice.toFixed(2)}
            </Text>
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
    paddingVertical: 12,
    marginVertical: 10,
  },
  listContainer: {
    flexDirection: "column",
    gap: 12,
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderColor: "#000000",
    borderWidth: 1,
    padding: 10,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
  },
  image: {
    borderRadius: 10,
    borderColor: "#d7d7d7",
    width: 90,
    height: 90,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeeee",
  },
  imagePlaceholderText: {
    color: "#777",
    ...textPresets.label
  },
  textbox: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  nameText: {
    color: "#111",
    marginBottom: 4,
    fontWeight: "bold",
    ...textPresets.label
  },
  text: {
    color: "#555",
    ...textPresets.label
  },
  inputContainer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 8,
    height: 38,
  },
  inputLabel: {
    color: "#333",
    fontSize: 12,
    marginRight: 4,
    ...textPresets.label,
  },
  discountInput: {
    flex: 1,
    color: "#111",
    fontSize: 14,
    paddingVertical: 2,
    fontWeight: "bold",
  },
});