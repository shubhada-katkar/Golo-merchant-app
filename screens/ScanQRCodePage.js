import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Camera, CameraView } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { textPresets } from "../theme/typography";

export default function ScanQRCodePage() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { onScanned } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

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
      Alert.alert("Scan failed", "Empty QR code detected. Please try again.");
      setScanned(false);
      return;
    }

    try {
      if (typeof onScanned === "function") {
        await onScanned(scannedValue);
        return;
      }

      Alert.alert("QR code scanned", "Scan successful. Returning to orders.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ], { cancelable: false });
    } catch (error) {
      Alert.alert("Scan failed", String(error?.message || error || "Invalid QR code"));
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#157a4f" />
          <Text style={[styles.statusText, { color: colors.text }]}>Requesting camera access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.loadingContainer}>
          <Text style={[styles.statusText, { color: colors.text }]}>Camera access is required to scan QR codes.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => Camera.requestCameraPermissionsAsync().then(({ status }) => setHasPermission(status === "granted"))}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="#157a4f" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Scan QR Code</Text>
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
    zIndex: 2,paddingVertical: 12,
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
});
