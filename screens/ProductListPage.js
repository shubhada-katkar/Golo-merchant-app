import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";

import Total from "../productlistcomponents/Total";
import Draft from "../productlistcomponents/Draft";
import Publish from "../productlistcomponents/Publish";

export default function ProductListPage({ navigation }) {
  const { colors } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState("Total");
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]); // ✅ SINGLE SOURCE OF TRUTH

  const normalizePublicationStatus = (item) => {
    const publicationStatus = String(item?.publicationStatus || "").toLowerCase().trim();
    const status = String(item?.status || "").toLowerCase().trim();

    if (publicationStatus === "draft" || publicationStatus === "published") return publicationStatus;
    if (status === "inactive") return "draft";
    if (status === "active") return "published";
    if (status === "draft" || status === "published") return status;
    return "published";
  };

  const normalizeProduct = (item) => ({
    _id: item?.productId || item?._id || item?.id,
    productId: item?.productId || item?._id || item?.id,
    productname: item?.productname || item?.name || item?.productName || "",
    category: item?.category || "",
    description: item?.description || "",
    price: Number(item?.price || item?.regularPrice || 0),
    stockQuantity: Number(item?.stockQuantity ?? item?.stock ?? 0),
    status: normalizePublicationStatus(item),
    rawStatus: item?.status || "",
    publicationStatus: item?.publicationStatus || "",
    image: (() => {
      const img =
        item?.image ||
        (item?.productImages?.[0] ? { url: item.productImages[0] } : null) ||
        (item?.images?.[0] ? { url: item.images[0] } : null);
      if (!img) return null;
      const url = img.url || img.path || img;
      if (!url) return null;
      const normalizedUrl =
        typeof url === "string" && !/^https?:\/\//i.test(url)
          ? `${BASE_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
          : url;
      return { url: normalizedUrl };
    })(),
    imageUrl: (() => {
      const img =
        item?.image ||
        (item?.productImages?.[0] ? item.productImages[0] : null) ||
        (item?.images?.[0] ? item.images[0] : null);
      if (!img) return null;
      const url = img.url || img.path || img;
      if (!url) return null;
      return typeof url === "string" && !/^https?:\/\//i.test(url)
        ? `${BASE_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
        : url;
    })(),
    images: Array.isArray(item?.productImages)
      ? item.productImages.map((u) =>
          typeof u === "string" && !/^https?:\/\//i.test(u)
            ? `${BASE_URL.replace(/\/$/, "")}/${u.replace(/^\//, "")}`
            : u,
        )
      : Array.isArray(item?.images)
      ? item.images.map((u) =>
          typeof u === "string" && !/^https?:\/\//i.test(u)
            ? `${BASE_URL.replace(/\/$/, "")}/${u.replace(/^\//, "")}`
            : u,
        )
      : [],
  });

  // ================= FETCH ALL PRODUCTS =================
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("merchantToken");
      if (!token) return;

      let res = await fetch(`${BASE_URL}/products/merchant`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/merchant/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data)
          ? data
          : data?.products || data?.data?.products || data?.data || [];
        setProducts(list.map(normalizeProduct));
      }
    } catch (err) {
      console.log("Fetch products error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Refresh products when screen comes into focus (after add/edit)
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  // ================= DERIVED COUNTS (REAL TIME) =================
  const totalCount = products.length;

  const publishCount = products.filter(
    (p) => p.status === "published"
  ).length;

  const draftCount = products.filter(
    (p) => p.status === "draft"
  ).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Topbar />

      {/* Header */}
      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
          <MaterialIcons
            name="arrow-back-ios"
            size={28}
            color={colors.text}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: colors.text }}>
          Product List
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: colors.divider }} />

      {/* Tabs */}
      <View style={styles.row2}>
        <Tab
          title="Total"
          count={totalCount}
          active={activeTab === "Total"}
          onPress={() => setActiveTab("Total")}
        />
        <Tab
          title="Publish"
          count={publishCount}
          active={activeTab === "Publish"}
          onPress={() => setActiveTab("Publish")}
        />
        <Tab
          title="Draft"
          count={draftCount}
          active={activeTab === "Draft"}
          onPress={() => setActiveTab("Draft")}
        />
      </View>

      {/* Search */}
      <View style={styles.search}>
        <TextInput
          placeholder="Search product..."
          value={searchText}
          onChangeText={setSearchText}
          style={{ fontSize: 16 }}
        />
      </View>

      {/* Content */}
      {activeTab === "Total" && (
        <Total
          products={products}
          setProducts={setProducts}
          searchText={searchText}
        />
      )}

      {activeTab === "Publish" && (
        <Publish
          products={products}
          setProducts={setProducts}
          searchText={searchText}
        />
      )}

      {activeTab === "Draft" && (
        <Draft
          products={products}
          setProducts={setProducts}
          searchText={searchText}
        />
      )}

      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }}
      >
        <Bottombar />
      </SafeAreaView>
    </SafeAreaView>
  );
}

/* ---------------- UI Helpers ---------------- */
const Tab = ({ title, count, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.row2button, active && styles.ActiveTab]}
  >
    <Text style={styles.row2text}>{title}</Text>
    <Text style={styles.number}>{count}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row1: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  row2: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  row2button: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#b8b5b5",
    paddingVertical: 16,
    alignItems: "center",
  },
  ActiveTab: {
    backgroundColor: "#979797",
    borderWidth: 1,
    borderColor: "#535353",
  },
  row2text: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  number: {
    fontSize: 20,
    color: "#303030",
  },
  search: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 0.5,
  },
});
