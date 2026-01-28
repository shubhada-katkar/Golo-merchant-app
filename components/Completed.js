import React from "react";
import { View, Text, StyleSheet, ScrollView,TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { Entypo, FontAwesome5,MaterialCommunityIcons } from "@expo/vector-icons";

export default function Completed() {
    const {colors}=useContext(ThemeContext);
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.colcontainer}>
                {/*Card number 1*/}
                <View style={styles.card2}>
                    <Text>Order #2456</Text>
                    <Text>Purchased 1 hour ago</Text>
                    <View style={{ flexDirection: "row", paddingHorizontal: 10, justifyContent: "space-evenly" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Entypo name="bar-graph" size={26} color="green" />
                            <Text style={styles.bigcardtext}>300</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <FontAwesome5 name="box" size={24} color="green" />
                            <Text style={styles.bigcardtext}>4 Items</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                    <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", gap: 5 }}>
                            <MaterialCommunityIcons name="account" size={20} />
                            <Text>Rohit Das</Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity style={[styles.button, { backgroundColor: "#dadada" }]}>
                                <Text>Completed Order</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    colcontainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 12
    },
    card2: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 150,
        borderWidth: 1,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding:10
    },
        bigcardtext: {
        fontSize: 24,
        paddingHorizontal: 8
    },
    button: {
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: "center",
        paddingVertical: 6
    }
})