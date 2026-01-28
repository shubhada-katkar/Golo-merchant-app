import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function ProfileSettingsPage({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [name, setname] = useState();
    const [number, setnumber] = useState();
    const [email, setemail] = useState();
    const saveProfile = async () => {

        const profileData = {
            name,
            phone: number,
            email
        };

        try {

            const res = await fetch("http://192.168.1.6:5000/api/merchant/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(profileData)
            });

            const data = await res.json();
            console.log(data);

        } catch (error) {
            console.log(error);
        }
    };


    const clearAllFields = () => {
        setname("");
        setemail("");
        setnumber("");
    }
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >

                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >

                        <Topbar />

                        <View style={styles.row1}>
                            <TouchableOpacity onPress={() => navigation.goBack(" ")}>
                                <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{ padding: 10 }} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>Profile Settings</Text>
                        </View>

                        <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                        <View style={styles.row2}>
                            <Image source={require("../assets/profile.png")} style={{ width: 90, height: 90 }} />
                            <Text style={{ fontSize: 26, paddingHorizontal: 16, color: colors.text }}>Moon Cafe</Text>
                        </View>

                        <View style={{ paddingHorizontal: 14 }}>
                            <Text style={[styles.text, { color: colors.text }]}>Your Name/ Company Name</Text>
                            <TextInput value={name} style={styles.input}
                                placeholder="Enter name" onChangeText={(text) => setname(text)} />

                            <Text style={[styles.text, { color: colors.text }]}>Contact Number</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={number}
                                placeholder="Enter number" onChangeText={(number) => setnumber(number)} />

                            <Text style={[styles.text, { color: colors.text }]}>Email</Text>
                            <TextInput value={email} style={styles.input}
                                placeholder="Enter email" onChangeText={(text) => setemail(text)} />
                        </View>

                        <View style={{ paddingVertical: 36, paddingHorizontal: 16, gap: 18 }}>
                            <TouchableOpacity style={styles.button} onPress={saveProfile} >
                                <Text style={{ fontSize: 20 }}>Save Details</Text>
                            </TouchableOpacity>

                            {/* CLEAR BUTTON */}
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: "#157a4f" }]}
                                onPress={clearAllFields}
                            >
                                <Text style={{ fontSize: 18 }}>Clear All</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>

            <SafeAreaView edges={["bottom"]}
                style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14
    },
    row2: {
        flexDirection: "row",
        paddingHorizontal: 22,
        alignItems: "center",
        paddingTop: 10
    },
    text: {
        fontSize: 20,
        paddingTop: 20
    },
    input: {
        backgroundColor: "#dad8d8",
        borderRadius: 10,
        borderColor: "#6b6a6a",
        borderWidth: 1,
        padding: 10,
        fontSize: 16
    },
    button: {
        backgroundColor: "#f5b849",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        borderColor: "#b9b9b9",
        borderWidth: 1,
    }
})