import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

export default function ActiveProductsModal({
  visible,
  products = [],
  maxProducts = 0,
  planName = "Current Plan",
  onSave,
  onSkip,
  saving = false,
}) {
  const { colors } = useContext(ThemeContext);
  const isDark = colors.background === "#383838";

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const getProductId = (item) => item?.productId || item?._id || item?.id;

  // Initialize pre-selected active products whenever modal opens or products change
  useEffect(() => {
    if (visible && Array.isArray(products)) {
      // Pick products currently marked active
      const currentlyActive = products.filter((p) => p.isActive !== false);
      let initialIds = currentlyActive.map(getProductId);

      if (maxProducts !== -1 && maxProducts > 0) {
        // If active count exceeds max, take first maxProducts
        if (initialIds.length > maxProducts) {
          initialIds = initialIds.slice(0, maxProducts);
        } else if (initialIds.length === 0 && products.length > 0) {
          // If none are active, preselect first maxProducts items
          initialIds = products.slice(0, maxProducts).map(getProductId);
        }
      } else if (maxProducts === -1) {
        // For unlimited plan (-1), if currently active list is empty, preselect all products
        if (initialIds.length === 0 && products.length > 0) {
          initialIds = products.map(getProductId);
        }
      }

      setSelectedIds(initialIds);
      setSearchText("");
    }
  }, [visible, products, maxProducts]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (maxProducts !== -1 && selectedIds.length >= maxProducts) {
        setAlertConfig({
          visible: true,
          title: "Limit Reached",
          message: `Your ${planName} allows a maximum of ${maxProducts} active products. Deselect another product first.`,
        });
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSave = () => {
    if (typeof onSave === "function") {
      onSave(selectedIds);
    }
  };

  const filteredProducts = products.filter((item) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    const name = (item.productname || item.name || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    return name.includes(query) || category.includes(query);
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onSkip}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.cardContainer,
            { backgroundColor: isDark ? "#2a2a2a" : "#ffffff" },
          ]}
        >
          {/* Top Bar / Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={14} color="#157a4f" />
                <Text style={styles.badgeText}>Active Plan: {planName}</Text>
              </View>
              <TouchableOpacity onPress={onSkip} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.text || "#333"} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: colors.text || "#000" }]}>
              Select Active Products
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#aaaaaa" : "#666666" },
              ]}
            >
              {maxProducts === -1 ? (
                <>Your <Text style={styles.highlight}>{planName}</Text> allows unlimited active products. Only active products can be added to offers.</>
              ) : (
                <>Choose up to <Text style={styles.highlight}>{maxProducts}</Text> products to keep active. Only active products can be added to offers.</>
              )}
            </Text>

            {/* Selection Counter Pill */}
            <View style={styles.counterRow}>
              <Text style={styles.counterText}>
                Selected: <Text style={styles.counterBold}>{selectedIds.length}</Text> / {maxProducts === -1 ? "Unlimited" : maxProducts}
              </Text>
              {maxProducts !== -1 && selectedIds.length >= maxProducts && (
                <View style={styles.maxReachedBadge}>
                  <Text style={styles.maxReachedText}>Limit Reached</Text>
                </View>
              )}
            </View>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: isDark ? "#383838" : "#f3f4f6" }]}>
            <Feather name="search" size={16} color="#888888" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search product to activate..."
              placeholderTextColor="#888888"
              value={searchText}
              onChangeText={setSearchText}
              style={[styles.searchInput, { color: colors.text || "#000" }]}
            />
            {!!searchText && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Feather name="x-circle" size={16} color="#888888" />
              </TouchableOpacity>
            )}
          </View>

          {/* Products List */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => getProductId(item)}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            renderItem={({ item }) => {
              const id = getProductId(item);
              const isSelected = selectedIds.includes(id);
              const imageUri =
                typeof item.image === "string"
                  ? item.image
                  : item.image?.url || item.image?.imageUrl || item.imageUrl || item.images?.[0];

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleSelect(id)}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: "#ffffff",
                      borderColor: isSelected ? "#157a4f" : "#444",
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: isDark ? "#555" : "#e0e0e0" }]} />
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: colors.text || "#000" }]} numberOfLines={1}>
                      {item.productname || item.name}
                    </Text>
                    <Text style={styles.itemCategory} numberOfLines={1}>
                      Category: {item.category || "General"}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.checkboxContainer}>
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                      size={26}
                      color={isSelected ? "#157a4f" : "#999999"}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inventory" size={40} color="#888888" />
                <Text style={[styles.emptyText, { color: colors.text || "#888888" }]}>
                  No matching products found
                </Text>
              </View>
            }
          />

          {/* Action Buttons Footer */}
          <View style={[styles.footer, { borderTopColor: isDark ? "#444" : "#eee" }]}>
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: isDark ? "#666" : "#cccccc" }]}
              onPress={onSkip}
              disabled={saving}
            >
              <Text style={[styles.skipBtnText, { color: colors.text || "#555" }]}>
                Skip for now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#157a4f" }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Confirm ({selectedIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomAlertModal
        visible={alertConfig.visible}
        type="error"
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  cardContainer: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4ea",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    ...textPresets.label,
    color: "#157a4f",
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    marginBottom: 4,
    ...textPresets.subtitle
  },
  subtitle: {
    marginBottom: 10,
    ...textPresets.caption
  },
  highlight: {
    color: "#157a4f",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(21, 122, 79, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  counterText: {
    color: "#157a4f",
    ...textPresets.label
  },
  counterBold: {
    ...textPresets.label,
  },
  maxReachedBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  maxReachedText: {
    color: "#dc2626",
    ...textPresets.label
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 2,
    ...textPresets.body
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemImage: {
    width: 58,
    height: 58,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    marginBottom: 2,
    ...textPresets.label
  },
  itemCategory: {
    color: "#888888",
    marginBottom: 2,
    ...textPresets.caption
  },
  itemPrice: {
    color: "#157a4f",
    ...textPresets.caption
  },
  checkboxContainer: {
    paddingLeft: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5)
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    ...textPresets.label
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#ffffff",
    ...textPresets.label,
  },
});
