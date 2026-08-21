import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { textPresets } from "../theme/typography";

export default function CustomAlertModal({
  visible,
  type = "success",
  title,
  message,
  onClose,
  buttonText = "OK",
  showCancelButton = false,
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || {};

  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else handleClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else handleClose();
  };

  const getIcon = () => {
    if (type === "success") {
      return <MaterialCommunityIcons name="check-circle" size={40} color="#157a4f" />;
    }
    if (type === "warning" || type === "info") {
      return <MaterialCommunityIcons name="alert-circle" size={40} color="#f59e0b" />;
    }
    return <MaterialCommunityIcons name="close-circle" size={40} color="#e53935" />;
  };

  const getButtonColor = () => {
    if (type === "success") return "#157a4f";
    if (type === "warning" || type === "info") return "#f59e0b";
    return "#e53935";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.background === "#383838" ? "#2d2d2d" : "#ffffff" },
          ]}
        >
          {/* Centered Top Icon */}
          <View style={styles.modalIconContainer}>{getIcon()}</View>

          {/* Title */}
          {!!title && (
            <Text style={[styles.modalTitle, { color: colors.text || "#000000" }]}>
              {title}
            </Text>
          )}

          {/* Message */}
          {!!message && (
            <Text
              style={[
                styles.modalMessage,
                { color: colors.text === "#ffffff" ? "#cccccc" : "#555555" },
              ]}
            >
              {message}
            </Text>
          )}

          {/* Action Buttons */}
          {showCancelButton ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.flexButton,
                  { backgroundColor: getButtonColor() },
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: getButtonColor() },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalTitle: {
    ...textPresets.subtitle,
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    ...textPresets.body,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: Math.round(14 * 1.5)
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flexButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    ...textPresets.body,
    color: "#333333",
    lineHeight: Math.round(14 * 1.5)
  },
  modalButtonText: {
    ...textPresets.body,
    color: "#ffffff",
    lineHeight: Math.round(14 * 1.5)
  },
});
