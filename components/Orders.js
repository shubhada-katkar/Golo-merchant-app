import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Entypo } from "@expo/vector-icons";
import All from "../components/All";
import Completed from "../components/Completed";
import Pending  from "../components/Pending";

export default function Orders() {
    const [activeTab, setactiveTab] = useState("All");
    return (
        <View style={{flex:1}}>

            <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                <View style={styles.card1}>

                    <View style={{ flexDirection: "row",justifyContent:"space-between", alignItems:"center" }}>
                        <Text style={{ fontSize: 22 }}>Today's Orders</Text>
                        <View style={{flexDirection:"row", alignItems:"center", gap:6 }}>
                        <Entypo name="bar-graph" size={26} color="green" />
                        <Text style={{ fontSize: 22 }}>38739</Text>
                        </View>
                    </View>

                    <View><Text>46 Orders</Text></View>
                </View>
            </View>

            <View style={styles.row1}>
                <TouchableOpacity onPress={() => setactiveTab("All")}
                    style={[styles.row1button, activeTab == "All" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Completed")}
                    style={[styles.row1button, activeTab == "Completed" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>Completed</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setactiveTab("Pending")}
                    style={[styles.row1button, activeTab == "Pending" && styles.ActiveTab]}>
                    <Text style={styles.row1text}>Pending</Text>
                </TouchableOpacity>
            </View>

            {activeTab == "All" && <All />}
            {activeTab == "Completed" && <Completed />}
            {activeTab == "Pending" && <Pending />}

        </View>
    );
}

const styles = StyleSheet.create({
    card1: {
        borderRadius: 10,
        borderColor: "black",
        minHeight: 95,
        borderWidth: 1,
        shadowColor: "#413f4f",
        elevation: 10,
        backgroundColor: "white",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 2, height: 4 },
        paddingHorizontal: 16,
        paddingVertical: 18
    },
    row1: {
        flexDirection: "row",
        paddingHorizontal:12,
        gap:8,
        paddingBottom:8
    },
    row1text: {
        fontSize: 16,
        color: "white",
        paddingHorizontal: 6
    },
    row1button: {
        flex:1,
        borderRadius: 20,
        backgroundColor: "#a5a4a4",
        paddingVertical: 6,
        alignItems: "center",
        justifyContent:"center"
    },
    ActiveTab: {
        backgroundColor: "#818181",
        borderWidth: 2,
        borderColor: "#535353",
    }
})