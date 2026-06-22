import React from "react";
import { Text, View, StyleSheet, ScrollView, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function Customers() {
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.card3}>
                    <Text style={{ fontSize: 18, paddingHorizontal: 10,
                        lineHeight: Math.round(18 * 1.5), fontFamily:"Medium" }}>Age and Gender</Text>

                    <View style={{ flexDirection: "row" }}>
                        <Text style={{ paddingHorizontal: 10, color: "#727272",
                            fontSize: 14, lineHeight: Math.round(14 * 1.5), fontFamily:"Medium"
                         }}>Statistics</Text>

                        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center" }}>
                            <FontAwesome name="circle" size={18} color="#4caf50" />
                            <Text style={{ paddingHorizontal: 10, fontSize: 14, lineHeight: Math.round(14 * 1.5), fontFamily:"Medium" }}>
                                Male</Text>

                            <FontAwesome name="circle" size={18} color="#f9a641" />
                            <Text style={{ paddingHorizontal: 10, fontSize: 14, lineHeight: Math.round(14 * 1.5), fontFamily:"Medium" }}>
                                Female</Text>
                        </View>

                    </View>

                    <View style={{paddingLeft:10,paddingTop:26,gap:26}}>
                        <Text style={styles.smallfont}>18-24</Text>
                        <Text style={styles.smallfont}>25-34</Text>
                        <Text style={styles.smallfont}>35-44</Text>
                        <Text style={styles.smallfont}>45-64</Text>
                        <Text style={styles.smallfont}>65+</Text>
                    </View>

                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.card3}>
                    <Text style={{ fontSize: 18, paddingHorizontal: 10, 
                        lineHeight: Math.round(18 * 1.5), fontFamily:"Medium" }}>Location</Text>
                    <Text style={{ paddingHorizontal: 10, color: "#727272", fontSize: 14, lineHeight: Math.round(14 * 1.5), fontFamily:"Medium" }}>Statistics</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    graph: {
        flex: 1,
        borderRadius: 10,
        minHeight: 240,
        elevation: 8,
        shadowColor: "#413f4f",
        shadowRadius: 10,
        shadowOffset: { height: 4, width: 3 },
        padding: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
    },
    card1: {
        flex: 1,
        flexDirection: "column",
        borderRadius: 10,
        minHeight: 240,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding: 10,
    },
    card2: {
        flex: 1,
        flexDirection: "column",
        borderRadius: 10,
        minHeight: 440,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding: 10,
    },
    card3: {
        flex: 1,
        flexDirection: "column",
        borderRadius: 10,
        minHeight: 360,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        padding: 10,
    },
    smallfont: {
        fontSize: 13,
        fontFamily:"Medium",
        lineHeight: Math.round(13 * 1.5),
    }
})