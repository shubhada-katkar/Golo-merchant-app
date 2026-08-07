import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { LinearGradient } from "expo-linear-gradient";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

import Total from "../productlistcomponents/Total";
import ActiveProductsModal from "../productlistcomponents/ActiveProductsModal";
import CustomAlertModal from "../components/CustomAlertModal";

export default function ProductListPage({ navigation }) {
  const { colors } = useContext(ThemeContext);

  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]); // ✅ SINGLE SOURCE OF TRUTH
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    planName: "Free Tier",
    maxProducts: -1,
    loading: true,
  });
  const [hasConfiguredActiveProducts, setHasConfiguredActiveProducts] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [savingActiveProducts, setSavingActiveProducts] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
    });
  };

  const normalizeProduct = (item) => ({
    _id: item?.productId || item?._id || item?.id,
    productId: item?.productId || item?._id || item?.id,
    productname: item?.productname || item?.name || item?.productName || "",
    category: item?.category || "",
    description: item?.description || "",
    price: Number(item?.price || item?.regularPrice || 0),
    stockQuantity: Number(item?.stockQuantity ?? item?.stock ?? 0),
    isActive: item?.isActive !== false,
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

  // Helper to enforce plan active products limit when plan changes/downgrades
  const enforceActiveProductsLimit = async (normalizedList, limit, token) => {
    const activeProds = normalizedList.filter((p) => p.isActive !== false);

    if (limit > 0 && limit !== -1 && activeProds.length > limit) {
      const keepActiveIds = new Set(
        activeProds.slice(0, limit).map((p) => p.productId || p._id)
      );
      const toDeactivate = activeProds.filter(
        (p) => !keepActiveIds.has(p.productId || p._id)
      );

      for (const prod of toDeactivate) {
        const prodId = prod.productId || prod._id;
        try {
          await fetch(`${BASE_URL}/merchant/products/${prodId}/toggle-active`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: false }),
          });
        } catch (err) {
          console.log("Error deactivating excess active product:", err);
        }
      }

      return normalizedList.map((p) => {
        const id = p.productId || p._id;
        return {
          ...p,
          isActive: keepActiveIds.has(id),
        };
      });
    }

    return normalizedList;
  };

  // ================= FETCH SUBSCRIPTION DETAILS =================
  const fetchSubscriptionAndCheckLimit = async (normalizedProductsList) => {
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        return;
      }
      let merchantId = await AsyncStorage.getItem("merchantId");

      if (!merchantId && token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(
              typeof atob === "function"
                ? atob(parts[1])
                : Buffer.from(parts[1], "base64").toString("utf8")
            );
            merchantId = payload.id || payload.userId || payload.sub;
          }
        } catch (e) {
          console.log("Token decode error:", e);
        }
      }

      if (!merchantId) return;

      const res = await fetch(`${BASE_URL}/merchants/${merchantId}/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const planName = data?.name || data?.planType || "Subscription Plan";
        const maxProducts = data?.planFeatures?.maxProducts ?? -1;
        const cycleToken = data?.startedAt || data?.expiresAt || data?.assignedAt || "";
        const cycleId = `${planName}_${cycleToken}`;

        setSubscriptionInfo({ planName, maxProducts, cycleId, loading: false });

        const storageKey = `active_products_selected_${merchantId}`;
        const idsKey = `active_product_ids_${merchantId}`;

        const savedCycle = await AsyncStorage.getItem(storageKey);
        const savedIdsRaw = await AsyncStorage.getItem(idsKey);
        let savedIds = null;

        try {
          if (savedIdsRaw) savedIds = JSON.parse(savedIdsRaw);
        } catch (e) { }

        const isAlreadySelected = savedCycle === cycleId && Array.isArray(savedIds);
        setHasConfiguredActiveProducts(isAlreadySelected);

        let updatedList = normalizedProductsList;

        if (maxProducts > 0 && maxProducts !== -1) {
          if (isAlreadySelected && savedIds) {
            // User configured: mark strictly savedIds as active
            updatedList = normalizedProductsList.map((p) => {
              const id = p.productId || p._id;
              return {
                ...p,
                isActive: savedIds.includes(id),
              };
            });
          } else {
            // Unconfigured or Skipped: default first maxProducts items active
            updatedList = normalizedProductsList.map((p, idx) => ({
              ...p,
              isActive: idx < maxProducts,
            }));

            if (normalizedProductsList.length > maxProducts) {
              setShowModal(true);
            }
          }
          setProducts(updatedList);
        }
      }
    } catch (err) {
      console.log("Fetch subscription error:", err);
    }
  };

  // ================= FETCH ALL PRODUCTS =================
  const fetchProducts = async () => {
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) return;

      let res = await fetch(`${BASE_URL}/merchant/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        await handleAuthError(navigation);
        return;
      }

      if (!res.ok) {
        res = await fetch(`${BASE_URL}/products/merchant`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data)
          ? data
          : data?.products || data?.data?.products || data?.data || [];
        const normalized = list.map(normalizeProduct);
        setProducts(normalized);

        // Check subscription limit against fetched products
        fetchSubscriptionAndCheckLimit(normalized);
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

  // ================= SAVE ACTIVE PRODUCTS SELECTION =================
  const handleSaveActiveProducts = async (selectedIds) => {
    try {
      setSavingActiveProducts(true);

      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) return;

      const merchantId = await AsyncStorage.getItem("merchantId");

      const toDeactivate = [];
      const toActivate = [];

      for (const prod of products) {
        const prodId = prod.productId || prod._id;
        const shouldBeActive = selectedIds.includes(prodId);
        const currentlyActive = prod.isActive !== false;

        if (currentlyActive && !shouldBeActive) {
          toDeactivate.push(prodId);
        } else if (!currentlyActive && shouldBeActive) {
          toActivate.push(prodId);
        }
      }

      // Deactivate unselected products first (freeing up active capacity)
      for (const prodId of toDeactivate) {
        try {
          await fetch(`${BASE_URL}/merchant/products/${prodId}/toggle-active`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: false }),
          });
        } catch (patchErr) {
          console.log(`Failed to deactivate product ${prodId}:`, patchErr);
        }
      }

      // Activate newly selected products
      for (const prodId of toActivate) {
        try {
          await fetch(`${BASE_URL}/merchant/products/${prodId}/toggle-active`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive: true }),
          });
        } catch (patchErr) {
          console.log(`Failed to activate product ${prodId}:`, patchErr);
        }
      }

      // Save selected IDs and subscription cycle in AsyncStorage
      if (merchantId) {
        const storageKey = `active_products_selected_${merchantId}`;
        const idsKey = `active_product_ids_${merchantId}`;

        if (subscriptionInfo.cycleId || subscriptionInfo.planName) {
          await AsyncStorage.setItem(
            storageKey,
            subscriptionInfo.cycleId || subscriptionInfo.planName
          );
        }
        await AsyncStorage.setItem(idsKey, JSON.stringify(selectedIds));
      }

      setHasConfiguredActiveProducts(true);

      // Update local state immediately with new active selections
      setProducts((prev) =>
        prev.map((p) => {
          const id = p.productId || p._id;
          return {
            ...p,
            isActive: selectedIds.includes(id),
          };
        })
      );

      // Mark active products selection as completed for current subscription cycle
      if (merchantId && (subscriptionInfo.cycleId || subscriptionInfo.planName)) {
        await AsyncStorage.setItem(
          `active_products_selected_${merchantId}`,
          subscriptionInfo.cycleId || subscriptionInfo.planName
        );
        setHasConfiguredActiveProducts(true);
      }

      setShowModal(false);
      await fetchProducts();
      showAlert("success", "Success", "Active products updated successfully!");
    } catch (err) {
      console.log("Save active products error:", err);
      showAlert("error", "Error", "Failed to update active products. Please try again.");
    } finally {
      setSavingActiveProducts(false);
    }
  };

  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((item) => item.isActive !== false).length;
  const outOfStockCount = products.filter(
    (item) => Number(item.stockQuantity) <= 0
  ).length;

  const isLimitReached = subscriptionInfo.maxProducts !== -1 && activeProductsCount >= subscriptionInfo.maxProducts;
  const isConfigureDisabled = subscriptionInfo.maxProducts !== -1 && hasConfiguredActiveProducts && isLimitReached;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#f8a812", "#fad081", "#f8f6f265"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
      />

      <Topbar />

      {/* Header */}
      <View style={styles.row1}>
        <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            color={colors.text}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>
        <Text style={{ ...textPresets.title }}>
          Product List
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.divider }} />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Products</Text>
          <Text style={styles.statValue}>{totalProductsCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Out of Stock</Text>
          <Text style={styles.statValue}>{outOfStockCount}</Text>
        </View>
      </View>

      {/* Active Products Management Banner (Always Displayed) */}
      <View style={styles.activeBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.activeBannerTitle}>
            Plan Active ({subscriptionInfo.planName})
          </Text>
          <Text style={styles.activeBannerSubtitle}>
            {subscriptionInfo.maxProducts === -1
              ? `${activeProductsCount} active products (Unlimited)`
              : `${activeProductsCount} of ${subscriptionInfo.maxProducts} active products selected`}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.activeBannerBtn,
            isConfigureDisabled && styles.activeBannerBtnDisabled,
          ]}
          disabled={isConfigureDisabled}
          onPress={() => setShowModal(true)}
        >
          <Text
            style={[
              styles.activeBannerBtnText,
              isConfigureDisabled && styles.activeBannerBtnTextDisabled,
            ]}
          >
            Configure active products
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <Feather name="search" size={14} style={{ top: -3 }} color="#919191" />
        <TextInput
          placeholder="Search product..."
          value={searchText}
          onChangeText={setSearchText}
          style={{ ...textPresets.body, flex: 1 }}
        />
      </View>

      <Total
        products={products}
        setProducts={setProducts}
        searchText={searchText}
      />

      {/* Active Products Limit Selection Modal */}
      <ActiveProductsModal
        visible={showModal}
        products={products}
        maxProducts={subscriptionInfo.maxProducts}
        planName={subscriptionInfo.planName}
        onSave={handleSaveActiveProducts}
        onSkip={() => setShowModal(false)}
        saving={savingActiveProducts}
      />

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={{ position: "absolute", bottom: 0, width: "100%" }}
      >
        <Bottombar />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row1: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  search: {
    backgroundColor: "white",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    color: "#157a4f",
    ...textPresets.subtitle
  },
  statLabel: {
    color: "#6b7280",
    ...textPresets.label
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 14,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#157a4f",
  },
  activeBannerTitle: {
    color: "#157a4f",
    ...textPresets.label
  },
  activeBannerSubtitle: {
    color: "#6b7280",
    ...textPresets.caption,
    marginTop: 2
  },
  activeBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#157a4f",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeBannerBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
  activeBannerBtnText: {
    color: "#ffffff",
    ...textPresets.caption
  },
  activeBannerBtnTextDisabled: {
    color: "#e5e7eb",
    opacity: 0.85,
  },
});
