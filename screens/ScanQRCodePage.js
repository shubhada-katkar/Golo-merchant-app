import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Camera, CameraView } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { textPresets } from "../theme/typography";

export default function ScanQRCodePage() {
  const navigation = useNavigation();
  const route = useRoute();
  const { onScanned } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "success", // "success" | "error"
    title: "",
    message: "",
    onClose: null,
  });

  const showAlertModal = (type, title, message, onClose) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      onClose: onClose || (() => navigation.goBack()),
    });
  };

  const handleCloseModal = () => {
    const cb = modalConfig.onClose;
    setModalConfig((prev) => ({ ...prev, visible: false }));
    if (typeof cb === "function") {
      cb();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      } catch (err) {
        setHasPermission(false);
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const scannedValue = String(data || "").trim();

    if (!scannedValue) {
      showAlertModal(
        "error",
        "Invalid QR Code",
        "This QR code could not be read. Please try again."
      );
      return;
    }

    try {
      if (typeof onScanned === "function") {
        await onScanned(scannedValue);
      }

      showAlertModal(
        "success",
        "QR Code Scanned",
        "Scan successful."
      );
    } catch (error) {
      showAlertModal(
        "error",
        "Invalid QR Code",
        String(error?.message || error || "This QR code could not be processed.")
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#157a4f" />
          <Text style={styles.statusText}>Requesting camera access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.statusText}>Camera access is required to scan QR codes.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => Camera.requestCameraPermissionsAsync().then(({ status }) => setHasPermission(status === "granted"))}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="#157a4f" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          onCameraReady={() => setCameraReady(true)}
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Align the QR code inside the box</Text>
        </View>

        {(!cameraReady || scanned) && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.overlayText}>{scanned ? "QR scanned!" : "Starting camera..."}</Text>
          </View>
        )}
      </View>

      {/* Custom Designed Alert Modal */}
      <Modal
        visible={modalConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: "#ffffff" }]}>
            {/* Centered Top Icon */}
            <View style={styles.modalIconContainer}>
              {modalConfig.type === "success" ? (
                <MaterialCommunityIcons name="check-circle" size={40} color="#157a4f" />
              ) : (
                <MaterialCommunityIcons name="close-circle" size={40} color="#e53935" />
              )}
            </View>

            {/* Title & Message */}
            {!!modalConfig.title && (
              <Text style={[styles.modalTitle, { color: "#333333" }]}>
                {modalConfig.title}
              </Text>
            )}
            {!!modalConfig.message && (
              <Text style={[styles.modalMessage, { color: "#555555" }]}>
                {modalConfig.message}
              </Text>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: modalConfig.type === "success" ? "#157a4f" : "#e53935" }
              ]}
              onPress={handleCloseModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 2, paddingVertical: 12,
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...textPresets.subtitle,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  scanHint: {
    marginTop: 16,
    color: "white",
    textAlign: "center",
    ...textPresets.body,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: 12,
    color: "white",
    ...textPresets.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statusText: {
    marginTop: 14,
    ...textPresets.body,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#157a4f",
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "white",
    ...textPresets.body,
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