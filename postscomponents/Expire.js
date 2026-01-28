import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";

export default function Expire() {
    const { colors } = useContext(ThemeContext);
    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 80 }}>
            <View style={{ padding: 14, gap: 18 }}>
                {/*Card number 1*/}
                <View style={styles.card2}>
                    <View style={{ flexDirection: "row" }}>
                        <View style={styles.image}></View>

                        <View style={{ flex:1,justifyContent: "space-between", paddingHorizontal: 10}}>
                            <View style={{flexDirection:'row',justifyContent:"space-between",alignItems:"center"}}>
                                <Text style={{ fontSize: 24 }}>Noodles</Text>
                                <TouchableOpacity style={{padding:10}}>
                                 <AntDesign name="edit" size={20}/>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14 }}>Category 234</Text>
                                <Text style={{ fontSize: 14 }}>Supporting line text</Text>
                            </View>

                        </View>

                    </View>
                </View>

                {/*Card number 2*/}
                <View style={styles.card2}>
                    <View style={{ flexDirection: "row" }}>
                        <View style={styles.image}></View>

                        <View style={{ flex:1,justifyContent: "space-between", paddingHorizontal: 10}}>
                            <View style={{flexDirection:'row',justifyContent:"space-between",alignItems:"center"}}>
                                <Text style={{ fontSize: 24 }}>Noodles</Text>
                                <TouchableOpacity style={{padding:10}}>
                                 <AntDesign name="edit" size={20}/>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14 }}>Category 235</Text>
                                <Text style={{ fontSize: 14 }}>Supporting line text</Text>
                            </View>

                        </View>

                    </View>
                </View>

                {/*Card number 3*/}
                <View style={styles.card2}>
                    <View style={{ flexDirection: "row" }}>
                        <View style={styles.image}></View>

                        <View style={{ flex:1,justifyContent: "space-between", paddingHorizontal: 10}}>
                            <View style={{flexDirection:'row',justifyContent:"space-between",alignItems:"center"}}>
                                <Text style={{ fontSize: 24 }}>Noodles</Text>
                                <TouchableOpacity style={{padding:10}}>
                                 <AntDesign name="edit" size={20}/>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14 }}>Category 236</Text>
                                <Text style={{ fontSize: 14 }}>Supporting line text</Text>
                            </View>

                        </View>

                    </View>
                </View>

                {/*Card number 4*/}
                <View style={styles.card2}>
                    <View style={{ flexDirection: "row" }}>
                        <View style={styles.image}></View>

                        <View style={{ flex:1,justifyContent: "space-between", paddingHorizontal: 10}}>
                            <View style={{flexDirection:'row',justifyContent:"space-between",alignItems:"center"}}>
                                <Text style={{ fontSize: 24 }}>Noodles</Text>
                                <TouchableOpacity style={{padding:10}}>
                                 <AntDesign name="edit" size={20}/>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={{ fontSize: 14 }}>Category 237</Text>
                                <Text style={{ fontSize: 14 }}>Supporting line text</Text>
                            </View>

                        </View>

                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create(
    {
        card2: {
            borderRadius: 10,
            borderColor: "black",
            minHeight: 120,
            shadowOffset: { height: 4, width: 3 },
            borderWidth: 1,
            shadowColor: "#413f4f",
            shadowOpacity: 0.25,
            shadowRadius: 5,
            shadowOffset: { width: 2, height: 4 },
            elevation: 10,
            backgroundColor: "white",
            justifyContent: "center",
            paddingHorizontal: 10
        },
        image: {
            width: 100,
            height: 100,
            backgroundColor: "#b8b8b8",
            borderRadius: 14
        }
    }
)