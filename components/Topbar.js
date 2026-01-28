import React from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function Topbar() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const {colors} = useContext(ThemeContext);
    return (
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, alignItems: "center",backgroundColor: colors.background }}>

            <Image source={require('../assets/logo.png')}
                style={{ height: 48, width: 48, resizeMode: "contain" }} />

            <View style={{ flexDirection: "column", paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color:colors.text }}>GOLO</Text>
                <Text style={{ fontSize: 14, color:colors.activeTab }}>Rajarampuri,Kolhapur</Text>
            </View>

            <View style={styles.rowcontainer}>
                <TouchableOpacity onPress={() => navigation.navigate("NewProductPage")}>
                    <FontAwesome name="plus-square-o" size={30}
                        color={currentRoute === "NewProductPage" ? "#157a4f" : colors.text} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <FontAwesome name="bell-o" size={28} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <MaterialCommunityIcons name="square-rounded-badge-outline" size={30} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rowcontainer: {
        flexDirection: "row",
        marginLeft:"auto",
        alignItems: "center",
        gap:18
    }
})