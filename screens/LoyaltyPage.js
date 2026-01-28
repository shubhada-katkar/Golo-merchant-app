import React from "react";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "../theme/ThemeContext";
import { useContext } from "react";

export default function ({navigation}) {
    const {colors} = useContext(ThemeContext);
    return (
        <SafeAreaView style={{flex:1,backgroundColor: colors.background}}>
            <Topbar />

            <ScrollView style={[styles.container,{backgroundColor:colors.background}]}>

                <View style={styles.row1}>
                    <TouchableOpacity style={{padding:10}} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={28} color={colors.text}/>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, paddingLeft: 5, color:colors.text}}>Loyalty Rewards</Text>
                </View>

                <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

                <View style={{flexDirection:"row",justifyContent:"space-between"}}>
                    <Text style={{fontSize:18,padding:20,color:colors.text}}>Active Customers</Text>
                    <Text style={{fontSize:18,padding:20,color:colors.text}}>Progress Bar</Text>
                </View>

                <View style={styles.row2}>
                    <View style={styles.card1}>
                        <View style={{flexDirection:"row",justifyContent:"space-between"}}>
                            <Text style={styles.smalltext}>Anil Kumar</Text>
                            <MaterialIcons name="star" size={20} color="#d8ca09"/>
                        </View>
                        <View style={{flexDirection:"row",justifyContent:"space-between",paddingTop:10}}>
                            <Text style={styles.smalltext}>Rohit Das</Text>
                            <MaterialIcons name="star" size={20} color="#d8ca09"/>
                        </View>
                        <View style={{flexDirection:"row",justifyContent:"space-between",paddingTop:10}}>
                            <Text style={styles.smalltext}>Shital Roy</Text>
                            <MaterialIcons name="star" size={20} color="#d8ca09"/>
                        </View>
                        <View style={{flexDirection:"row",justifyContent:"space-between",paddingTop:10}}>
                            <Text style={styles.smalltext}>Anil Kumar</Text>
                            <MaterialIcons name="star" size={20} color="#d8ca09"/>
                        </View>
                    </View>
                </View>

            </ScrollView>

            <SafeAreaView edges={["bottom"]}
                style={{ width: "100%", bottom: 0, position: "absolute" }}>
                <Bottombar />
            </SafeAreaView>

        </SafeAreaView>
    );
}

const styles=StyleSheet.create({
    container: {
        flex: 1
    },
    row1: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 14
    },
    row2 : {
        paddingHorizontal:14,
    },
    card1 : {
        backgroundColor:"white",
        padding:18,
        borderRadius:10,
        borderWidth:1,
        minHeight:60
    },
    smalltext: {
        fontSize:17
    }
})