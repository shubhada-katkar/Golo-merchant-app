import React from "react";
import { Text, View, StyleSheet, ScrollView, Image } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function Customers() {
    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.graph}>
                    <Text style={{ fontSize: 22 }}>Monthly Customers</Text>
                </View>
            </View>
            <View style={{ flexDirection: "row", paddingHorizontal: 34, paddingVertical: 18 }}>
                <View style={styles.card1}>
                    <Text style={{ fontSize: 22, paddingHorizontal: 20 }}>Products liked by Customers</Text>
                    <Text style={{ paddingHorizontal: 20, color: "#727272" }}>In Last 30 Days</Text>
                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.card2}>
                    <Text style={{ fontSize: 22, paddingHorizontal: 20 }}>Device Type</Text>
                    <Text style={{ paddingHorizontal: 20, color: "#727272" }}>What Customers Use</Text>

                    <Image source={require("../assets/graph.png")}
                        style={{ height: 220, width: 220, alignSelf: "center" }} />

                    <View style={{ marginTop: 10, flexDirection: "row", backgroundColor: "black", height: 1 }} />

                    <View style={{paddingTop:10,paddingHorizontal:10,gap:10}}>
                        <View style={{ flexDirection: "row",alignItems:"center" }}>
                            <FontAwesome name="circle" size={22} color="#4caf50"/>
                            <Text  style={{paddingLeft:6,fontSize:18}}>Mobile</Text>
                        </View>

                        <View style={{ flexDirection: "row",alignItems:"center" }}>
                            <FontAwesome name="circle" size={22} color="#f9a641" />
                            <Text  style={{paddingLeft:6,fontSize:18}}>Computer</Text>
                        </View>

                        <View style={{ flexDirection: "row",alignItems:"center" }}>
                            <FontAwesome name="circle" size={22} color="#c5c5c5" />
                            <Text  style={{paddingLeft:6,fontSize:18}}>Tablet</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.card3}>
                    <Text style={{ fontSize: 22, paddingHorizontal: 20 }}>Age and Gender</Text>

                    <View style={{ flexDirection: "row" }}>
                        <Text style={{ paddingHorizontal: 20, color: "#727272" }}>Statistics</Text>

                        <View style={{ flexDirection: "row", marginLeft: "auto", alignItems: "center" }}>
                            <FontAwesome name="circle" size={18} color="#4caf50" />
                            <Text style={{ paddingHorizontal: 10 }}>
                                Male</Text>

                            <FontAwesome name="circle" size={18} color="#f9a641" />
                            <Text style={{ paddingHorizontal: 10 }}>
                                Female</Text>
                        </View>

                    </View>

                    <View style={{paddingLeft:10,paddingTop:26,gap:26}}>
                        <Text style={{fontSize:18}}>18-24</Text>
                        <Text style={{fontSize:18}}>25-34</Text>
                        <Text style={{fontSize:18}}>35-44</Text>
                        <Text style={{fontSize:18}}>45-64</Text>
                        <Text style={{fontSize:18}}>65+</Text>
                    </View>

                </View>
            </View>

            <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 18 }}>
                <View style={styles.card3}>
                    <Text style={{ fontSize: 22, paddingHorizontal: 20 }}>Location</Text>
                    <Text style={{ paddingHorizontal: 20, color: "#727272" }}>Statistics</Text>
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
        minHeight: 260,
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
})