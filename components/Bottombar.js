import React from "react";
import { View,Text,StyleSheet,TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, FontAwesome6,FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function Bottombar(){
    const navigation=useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const {colors} = useContext(ThemeContext);

    return(
        <View style={[styles.top, {backgroundColor:colors.bottombar}]}>

            <TouchableOpacity style={[styles.bar ]} onPress={()=>navigation.navigate("HomePage")}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={24}
                color={currentRoute === "HomePage" ? "#157a4f" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "HomePage" ? "#157a4f":"black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("PostsPage")}>
                <MaterialCommunityIcons name="account-group-outline" size={24}
                color={currentRoute === "PostsPage" ? "#157a4f" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "PostsPage" ? "#157a4f" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Posts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} >
                <FontAwesome name="plus-square-o" size={24} onPress={()=>navigation.navigate("AddOfferPage")}
                color= {currentRoute === "AddOfferPage" ? "#157a4f" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "AddOfferPage" ? "#157a4f" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Add Offer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("ProductListPage")}>
                <MaterialCommunityIcons name="format-list-checkbox" size={24}
                color= {currentRoute === "ProductListPage" ? "#157a4f" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ProductListPage" ? "#157a4f" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Product List</Text>
            </TouchableOpacity>

                <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("ProfilePage")}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} 
                color={currentRoute === "ProfilePage" ? "#157a4f" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ProfilePage" ? "#157a4f" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Profile</Text>
                </TouchableOpacity>

        </View>
    );
}

const styles=StyleSheet.create({
    top : {
        flexDirection:"row",
        minHeight: 60,
        borderColor:"grey", 
        backgroundColor:"white", 
        borderTopWidth:1, 
        paddingVertical: 8,
        alignItems: "center",
    },
    bar: {
        flex: 1,
        alignItems:"center",
        flexDirection: "column", 
    },
})