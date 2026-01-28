import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";

export default function NewProductPage({ navigation }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { colors } = useContext(ThemeContext);
    const screenHeight = Dimensions.get("window").height;
    const bottomPadding = screenHeight * 0.06; // 6% of screen

    const initialForm = {
        price: "",
        discount: "",
        finalPrice: "",
        productname: "",
        category: "",
        description: "",
        stars: "",
        terms: "",
    };

    const [form, setForm] = useState(initialForm);

    const clearAllFields = () => {
        setForm(initialForm); // clears price, discount, final price
        setIsDarkMode(false); // keeps your theme logic safe
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <Topbar />
                    <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <View style={styles.row1}>
                            <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                                <MaterialIcons name="arrow-back-ios" size={28} style={{ padding: 10 }} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 22, paddingLeft: 5, color: colors.text }}>Add New Product</Text>
                        </View>

                        <View style={{ flexDirection: "row", backgroundColor: "black", height: 1 }} />

                        <View style={styles.row2}>
                            <View style={styles.card1}>
                                <TouchableOpacity style={{alignItems:"center",padding:10}}>
                                <Feather name="upload" size={30} color="#157a4f" />
                                </TouchableOpacity>
                                <Text>Upload Image</Text>
                            </View>
                            <View style={styles.card1}>
                                <Image source={require("../assets/profile.png")} style={{ width: 150, height: 150 }} />
                            </View>
                        </View>

                        <View style={{ paddingHorizontal: 18 }}>
                            <Text style={{ fontSize: 20, color: colors.text }}>Product Details</Text>
                            <Text style={[styles.text, { color: colors.text }]}>Product Name*</Text>
                            <TextInput style={styles.input} placeholder="Enter product name"
                                value={form.productname} onChangeText={(text) => {
                                    setForm({
                                        ...form,
                                        productname: text,
                                    })
                                }} />

                            <Text style={[styles.text, { color: colors.text }]}>Category*</Text>
                            <TextInput style={styles.input} placeholder="Enter Category"
                                value={form.category} onChangeText={(text) => {
                                    setForm({
                                        ...form,
                                        category: text,
                                    })
                                }} />

                            <Text style={[styles.text, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        minHeight: 40,
                                        maxHeight: 150,
                                    },
                                ]}
                                placeholder="Enter Description"
                                multiline
                                scrollEnabled
                                textAlignVertical="top"
                                value={form.description}
                                onChangeText={(text) => {
                                    setForm({
                                        ...form,
                                        description: text,
                                    });
                                }}
                            />


                            <Text style={[styles.text, { color: colors.text }]}>
                                Price*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter price"
                                keyboardType="numeric"
                                value={form.price}
                                onChangeText={(text) => {

                                    const discounted =
                                        text && form.discount
                                            ? text - (text * form.discount) / 100
                                            : "";

                                    setForm({
                                        ...form,
                                        price: text,
                                        finalPrice: discounted.toString(),
                                    });
                                }}
                            />


                            <Text style={[styles.text, { color: colors.text }]}>
                                Discount Percentage</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter discounted percentage"
                                keyboardType="numeric"
                                value={form.discount}
                                onChangeText={(text) => {

                                    const discounted =
                                        form.price && text
                                            ? form.price - (form.price * text) / 100
                                            : "";

                                    setForm({
                                        ...form,
                                        discount: text,
                                        finalPrice: discounted.toString(),
                                    });
                                }}
                            />


                            <Text style={[styles.text, { color: colors.text }]}>Discounted Price</Text>
                            <TextInput style={styles.input} value={form.finalPrice}
                                editable={false} placeholder="Discounted price" />


                            <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 10 }}>
                                <Text style={{ fontSize: 18, color: colors.text }}>Loyalty Reward</Text>
                                <Switch
                                    value={isDarkMode}
                                    onValueChange={setIsDarkMode}
                                    thumbColor={isDarkMode ? "#157a4f" : "#f4f3f4"}
                                    trackColor={{ false: "#ccc", true: "#141414" }}
                                    ios_backgroundColor="#ccc"
                                    style={{ transform: [{ scaleX: 1.17 }, { scaleY: 1.17 }], paddingLeft: 10 }}
                                />
                            </View>

                            <Text style={[styles.text, { color: colors.text }]}>Please specify the total number of stars to be offered</Text>
                            <TextInput style={styles.input} placeholder="Number of Stars" keyboardType="numeric"
                                value={form.stars} onChangeText={(text) => {
                                    setForm({
                                        ...form,
                                        stars: text,
                                    })
                                }} />

                            <Text style={[styles.text, { color: colors.text }]}>Terms and Conditions</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        minHeight: 40,
                                        maxHeight: 150,
                                    },
                                ]}
                                placeholder="Enter T & C"
                                multiline
                                scrollEnabled
                                textAlignVertical="top"
                                value={form.terms}
                                onChangeText={(text) => {
                                    setForm({
                                        ...form,
                                        terms: text,
                                    });
                                }}
                            />


                        </View>

                        <View style={{ paddingVertical: 36, paddingHorizontal: 16, gap: 24 }}>

                            {/* SAVE BUTTON */}
                            <TouchableOpacity style={styles.button}>
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
        paddingVertical: 30,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: "space-around",
    },
    card1: {
        backgroundColor: "#f3f1ec",
        borderWidth: 1,
        borderRadius: 10,
        minHeight: 180,
        width: "48%",
        alignItems: "center",
        justifyContent: "center"
    },
    text: {
        fontSize: 18,
        paddingTop: 16
    },
    input: {
        backgroundColor: "#dad8d8",
        borderRadius: 10,
        borderColor: "#6b6a6a",
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 18
    },
    button: {
        backgroundColor: "#f5b849",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        borderColor: "#b9b9b9",
        borderWidth: 1,
    },
})