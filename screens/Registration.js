import React, { useContext, useState } from "react";
import {
    View,
    TouchableOpacity,
    Text,
    TextInput,
    StyleSheet,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../theme/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { Entypo } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function Registration({ navigation }) {

    const { colors } = useContext(ThemeContext);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const [profileImage, setProfileImage] = useState(null);
    const [username, setUsername] = useState("");
    const [shopName, setShopName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [visiblepass, setvisiblepass] = useState(false);

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);

    const [loadingOtp, setLoadingOtp] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    // ================= EMAIL VALIDATION =================

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

    // ================= EMAIL VERIFY HANDLER =================

    const handleEmailVerification = async () => {

        try {

            if (!email) return alert("Enter email first");
            if (!isValidEmail(email)) return alert("Enter valid email");

            // -------- SEND OTP --------
            if (!otpSent) {

                setLoadingOtp(true);

                const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, role:"merchant" }),
                });

                const data = await res.json();
                setLoadingOtp(false);

                if (!res.ok) return alert(data.message);

                setOtpSent(true);
                alert("OTP sent to your email");

            }

            // -------- VERIFY OTP --------
            else {
                if (!otp) return alert("Enter OTP");

                setLoadingOtp(true);

                const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, otp, role:"merchant" }),
                });

                const data = await res.json();
                setLoadingOtp(false);

                if (!res.ok) return alert(data.message || "Invalid OTP");
                setOtpVerified(true);
                setEmailVerified(true);
                alert("Email verified successfully");
            }

        } catch (err) {
            setLoadingOtp(false);
            alert("Network error");
        }
    };

    // ================= IMAGE PICKER =================

    const pickImage = async () => {

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            alert("Permission required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    // ================= REGISTER =================
    const handleRegister = async () => {
        if (registerLoading) return;

        if (!emailVerified) {
            return alert("Please verify your email");
        }

        try {
            setRegisterLoading(true);

            const formData = new FormData();
            formData.append("username", username);
            formData.append("shopName", shopName);
            formData.append("email", email);
            formData.append("phone", phone);
            formData.append("password", password);

            if (profileImage) {
                formData.append("image", {
                    uri: profileImage,
                    name: "profile.jpg",
                    type: "image/jpeg",
                });
            }

            const response = await fetch(`${BASE_URL}/api/merchant/register`, {
                method: "POST",
                body: formData, 
            });

            const data = await response.json();

            setRegisterLoading(false);

            if (response.ok) {
                alert("Registration Successful");
                navigation.navigate("Login");
            } else {
                alert(data.message || "Registration Failed");
            }

        } catch (error) {
            setRegisterLoading(false);
            alert("Server Error");
        }
    };

    // ================= UI =================

    return (

        <SafeAreaView style={{ flex: 1, }}>

            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "#f5b849" }} />
                <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
            </View>

            <KeyboardAvoidingView
                style={StyleSheet.absoluteFill}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                >

                    <View style={styles.centerContainer}>

                        <Text style={styles.title}>Ready To Grow With GOLO?</Text>

                        <View style={styles.card}>

                            {/* IMAGE */}

                            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                                <View style={{ position: "relative" }}>
                                    <Image
                                        source={
                                            profileImage
                                                ? { uri: profileImage }
                                                : require("../assets/profile.png")
                                        }
                                        style={styles.profileImage}
                                    />
                                    <View style={styles.cameraIcon}>
                                        <MaterialIcons name="camera-alt" size={22} color="#ffffff" />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* INPUTS */}

                            <Text style={{ fontSize: 16 }}>Username</Text>
                            <TextInput style={styles.input} value={username}
                                placeholder="Enter your name" onChangeText={setUsername} />

                            <Text style={styles.label}>Shop Name</Text>
                            <TextInput style={styles.input} value={shopName}
                                placeholder="Enter your shop name" onChangeText={setShopName} />

                            <Text style={styles.label}>Email</Text>

                            <View style={styles.emailRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]} value={email}
                                    editable={!emailVerified}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setOtpSent(false);
                                        setOtp("");
                                        setEmailVerified(false);
                                    }}
                                    keyboardType="email-address" placeholder="Enter Email"
                                />

                                <TouchableOpacity
                                    style={[
                                        styles.verifyBtn,
                                        otpSent && { backgroundColor: "#4caf50" }
                                    ]}
                                    onPress={handleEmailVerification}
                                    disabled={otpSent || loadingOtp}
                                >

                                    {loadingOtp ?
                                        <ActivityIndicator color="white" /> :
                                        <Text style={{ color: "white" }}>
                                            {otpSent ? "Sent ✓" : "Send OTP"}
                                        </Text>
                                    }
                                </TouchableOpacity>

                            </View>

                            {otpSent && (
                                <>
                                    <Text style={styles.label}>OTP</Text>

                                    <View style={styles.emailRow}>

                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            value={otp}
                                            editable={!otpVerified}
                                            onChangeText={setOtp}
                                            keyboardType="numeric"
                                        />

                                        <TouchableOpacity
                                            style={[
                                                styles.verifyBtn,
                                                otpVerified && { backgroundColor: "#4caf50" }
                                            ]}
                                            onPress={handleEmailVerification}
                                            disabled={otpVerified || loadingOtp}
                                        >

                                            {loadingOtp ?
                                                <ActivityIndicator color="white" /> :
                                                <Text style={{ color: "white" }}>
                                                    {otpVerified ? "Verified ✓" : "Verify OTP"}
                                                </Text>
                                            }

                                        </TouchableOpacity>

                                    </View>
                                </>
                            )}

                            <Text style={styles.label}>Phone</Text>
                            <TextInput style={styles.input} value={phone}
                                placeholder="Enter contact number" onChangeText={setPhone} keyboardType="numeric" />

                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputpassword}>
                                <TextInput style={{ fontSize: 16, flex: 1 }}
                                    placeholder="Enter password"
                                    secureTextEntry={!visiblepass}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                {!visiblepass ? (
                                    <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(true)}>
                                        <Entypo name="eye-with-line" size={20} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={{ padding: 14 }} onPress={() => setvisiblepass(false)}>
                                        <Entypo name="eye" size={20} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    registerLoading && { opacity: 0.7 }
                                ]}
                                onPress={handleRegister}
                                disabled={registerLoading}
                            >

                                {registerLoading ? (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <ActivityIndicator color="white" />
                                        <Text style={{ color: "white", fontSize: 16 }}>
                                            Please wait...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={{ color: "white", fontSize: 18 }}>
                                        Register
                                    </Text>
                                )}

                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 18 }}>Have An Account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={{ fontSize: 18, color: "#4caf50" }}>Login
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    );
}

// ================= STYLES =================

const styles = StyleSheet.create({

    title: {
        fontSize: width * 0.06,
        color: "#ffffff",
    },

    card: {
        backgroundColor: "#ffffff",
        width: Math.min(width * 0.85, 380),
        minHeight: height * 0.55,
        borderRadius: 20,
        paddingBottom: 8,
        paddingHorizontal: 16,
        borderWidth: 0.5,
        borderColor: "#000000"
    },

    label: {
        marginTop: 6,
        fontSize: 16
    },
    scrollContainer: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: height * 0.05,
    },

    input: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#000000"
    },

    emailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },

    verifyBtn: {
        backgroundColor: "#157a4f",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: "center"
    },

    button: {
        backgroundColor: "#157a4f",
        marginTop: 16,
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12
    },
    inputpassword: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 10,
        paddingLeft: 12,
        height: 48,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#000000"
    },
    cameraIcon: {
        position: "absolute",
        bottom: 14,
        right: 16,
        backgroundColor: "#4b4a4a",
        padding: 3,
        borderRadius: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignSelf: "center"
    },
    avatarWrapper: {
        position: "relative",
        alignSelf: "center",
    },
    centerContainer: {
        alignItems: "center",
        width: "100%",
    },
});