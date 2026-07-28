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
}) {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || {};

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          <View style={styles.modalIconContainer}>
            {type === "success" ? (
              <MaterialCommunityIcons name="check-circle" size={40} color="#157a4f" />
            ) : (
              <MaterialCommunityIcons name="close-circle" size={40} color="#e53935" />
            )}
          </View>

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

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: type === "success" ? "#157a4f" : "#e53935" },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalButtonText}>{buttonText}</Text>
          </TouchableOpacity>
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
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    ...textPresets.body,
    color: "#ffffff",
  },
});
