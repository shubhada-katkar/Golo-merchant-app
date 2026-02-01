import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity,TextInput } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import Total from "../productlistcomponents/Total";
import Draft from "../productlistcomponents/Draft";
import Publish from "../productlistcomponents/Publish";

export default function ProductListPage({navigation}) {
    const {colors} = useContext(ThemeContext);
    const [activeTab, setactiveTab] = useState("Total Products");

    return (
        <SafeAreaView style={{flex:1, backgroundColor:colors.background}}>
            <Topbar />

                <View style={styles.row1}>
                    <TouchableOpacity onPress={() => navigation.navigate("HomePage")}>
                        <MaterialIcons name="arrow-back-ios" size={28} color={colors.text} style={{padding:10}}/>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, paddingLeft: 5, color:colors.text }}>Product List</Text>
                </View>

                <View style={{ flexDirection: "row", backgroundColor:colors.divider, height: 1, }} />

                <View style={styles.row2}>
                    <TouchableOpacity onPress={() => setactiveTab("Total Products")}
                        style={[styles.row2button, activeTab == "Total Products" && styles.ActiveTab]}>
                        <Text style={styles.row2text}>Total Products</Text>
                        <Text style={styles.number}>85</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Publish")}
                        style={[styles.row2button, activeTab == "Publish" && styles.ActiveTab]}>
                        <Text style={styles.row2text}>Publish</Text>
                        <Text style={styles.number}>85</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setactiveTab("Draft")}
                        style={[styles.row2button, activeTab == "Draft" && styles.ActiveTab]}>
                        <Text style={styles.row2text}>Draft</Text>
                        <Text style={styles.number}>85</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.search}>
                    <TextInput placeholder="Search product..">
                    </TextInput>
                </View>

            {activeTab == "Total Products" && <Total />}
            {activeTab == "Publish" && <Publish />}
            {activeTab == "Draft" && <Draft />} 

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
        paddingHorizontal:12,
        paddingVertical:16,
        gap:8
    },
    row2text: {
        fontSize: 16,
        color: "white",
        fontWeight:600,
        textAlign: "center"
    },
    row2button: {
        flex:1,
        borderRadius: 20,
        backgroundColor: "#b8b5b5",
        justifyContent: "center",
        paddingVertical: 16,
        alignItems:"center"
    },
    ActiveTab: {
        backgroundColor: "#979797",
        borderWidth: 1,
        borderColor: "#535353",
    },
    number: {
        color: "#303030",
        textAlign:"center",
        fontSize: 20
    },
    search: {
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 0.5,
        margin: 10
    },
})