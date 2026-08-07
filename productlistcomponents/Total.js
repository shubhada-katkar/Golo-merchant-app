import React, { useState, useContext } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal,
} from "react-native";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";
import CustomAlertModal from "../components/CustomAlertModal";

export default function Total({ products, setProducts, searchText, }) {

  const { colors } = useContext(ThemeContext);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const navigation = useNavigation();

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    onClose: null,
  });

  const showAlert = (type, title, message, onClose = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onClose,
    });
  };

  const handleCloseAlert = () => {
    const cb = alertConfig.onClose;
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (typeof cb === "function") {
      cb();
    }
  };

  const getProductId = (item) => item?.productId || item?._id || item?.id;

  // ================= DELETE PRODUCT =================
  const deleteProduct = async (productId) => {
    try {
      setDeletingId(productId);

      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }
      if (!token) {
        showAlert("error", "Error", "Not authenticated");
        return;
      }

      let res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        await handleAuthError(navigation);
        return;
      }

      if (!res.ok && res.status === 404) {
        res = await fetch(`${BASE_URL}/merchant/products/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) {
        showAlert("error", "Error", "Delete failed");
        return;
      }

      setProducts((prev) => prev.filter((p) => getProductId(p) !== productId));

      showAlert("success", "Success", "Product deleted");
    } catch (err) {
      console.error(err);
      showAlert("error", "Error", "Server error");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (productId) => {
    setDeleteConfirmId(productId);
  };

  // ================= FILTER =================
  const filteredProducts = products.filter(
    (item) =>
      item.productname?.toLowerCase().includes(searchText?.toLowerCase() || "") ||
      item.category?.toLowerCase().includes(searchText?.toLowerCase() || "")
  );

  // ================= UI =================
  const renderItem = ({ item }) => {
    const id = getProductId(item);
    const isActive = item.isActive !== false;
    const isDeleting = deletingId === id;

    const imageUri =
      typeof item.image === "string"
        ? item.image
        : item.image?.url || item.image?.imageUrl || item.imageUrl || item.images?.[0] || item.productImages?.[0];

    return (
      <View style={styles.card}>
        {/* ---- Top section: image + main info ---- */}
        <View style={styles.topSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialIcons name="image-not-supported" size={22} color="#9a9a9a" />
            </View>
          )}

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.productName, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.productname}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isActive ? "#e6f4ea" : "#fde8e6" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? "#157a4f" : "#d90d06" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? "#157a4f" : "#d90d06" },
                  ]}
                >
                  {isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* ---- Description section ---- */}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.description}
            >
              Description: {item.description}
            </Text>

            <View style={styles.categoryPill}>
              <AntDesign name="tag" size={11} color="#157a4f" />
              <Text style={styles.categoryText} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>

        {/* ---- Footer: actions, clearly separated ---- */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => navigation.navigate("NewProductPage", { product: item })}
          >
            <AntDesign name="edit" size={16} color="#157a4f" />
            <Text style={[styles.footerBtnText, { color: "#157a4f" }]}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.footerDivider} />

          <TouchableOpacity
            style={styles.footerBtn}
            disabled={isDeleting}
            onPress={() => confirmDelete(id)}
          >
            <MaterialIcons
              name={isDeleting ? "hourglass-empty" : "delete-outline"}
              size={16}
              color="#d90d06"
            />
            <Text style={[styles.footerBtnText, { color: "#d90d06" }]}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => getProductId(item)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
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

      {/* Custom Delete Product Confirmation Modal */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background === "#383838" ? "#2d2d2d" : "#ffffff" }]}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="close-circle" size={40} color="#e53935" />
            </View>
            <Text style={[styles.modalTitleText, { color: colors.text }]}>Delete Product</Text>
            <Text style={[styles.modalMessageText, { color: colors.text === "#ffffff" ? "#cccccc" : "#555555" }]}>
              Are you sure you want to delete this product?
            </Text>
            <View style={styles.modalConfirmRow}>
              <TouchableOpacity
                style={[styles.modalHalfBtn, { backgroundColor: "#888888" }]}
                onPress={() => setDeleteConfirmId(null)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalHalfBtn, { backgroundColor: "#e53935" }]}
                onPress={() => {
                  const targetId = deleteConfirmId;
                  setDeleteConfirmId(null);
                  if (targetId) deleteProduct(targetId);
                }}
              >
                <Text style={styles.modalBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleCloseAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  topSection: {
    flexDirection: "row",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
    gap: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productName: {
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...textPresets.caption,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#eef7f1",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    ...textPresets.caption,
    color: "#157a4f",
  },
  description: {
    ...textPresets.label,
    opacity: 0.85,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#b3b3b3ff",
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerBtnText: {
    ...textPresets.label,
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: "#b3b3b3ff",
  },
  addbuttton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 30,
    backgroundColor: "#157a4f",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleText: {
    ...textPresets.body,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: Math.round(14 * 1.5),
  },
  modalMessageText: {
    ...textPresets.label,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: Math.round(14 * 1.5),
  },
  modalConfirmRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalHalfBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    color: "#ffffff",
    ...textPresets.body,
    lineHeight: Math.round(14 * 1.5),
  },
});