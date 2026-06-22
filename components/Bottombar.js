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
                color={currentRoute === "HomePage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "HomePage" ? "#f9a641":"black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("PostsPage")}>
                <MaterialCommunityIcons name="account-group-outline" size={24}
                color={currentRoute === "PostsPage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "PostsPage" ? "#f9a641" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Posts</Text>
            </TouchableOpacity>

           <View style={styles.centerContainer}>
  <TouchableOpacity  onPress={() => navigation.navigate("AddOfferPage")}
    style={[styles.addButton, 
        {backgroundColor:currentRoute==="AddOfferPage" ? "#f9a641" :"#4caf50"}
    ]} >
    <MaterialCommunityIcons
      name="plus"
      size={32}
      color={currentRoute==="AddOfferPage" ? "#ffffff" : "black"}
    />
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 11,
      color: currentRoute === "AddOfferPage" ? "#f9a641" : "black",
      fontFamily: "Medium",
    }}
  >
    Add Offer
  </Text>
</View>

            <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("ProductListPage")}>
                <MaterialCommunityIcons name="format-list-checkbox" size={24}
                color= {currentRoute === "ProductListPage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ProductListPage" ? "#f9a641" : "black",
                    fontFamily : "Medium", lineHeight: Math.round(11*1.5)
                }}>Product List</Text>
            </TouchableOpacity>

                <TouchableOpacity style={styles.bar} onPress={()=>navigation.navigate("ProfilePage")}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} 
                color={currentRoute === "ProfilePage" ? "#f9a641" : "black"}/>
                <Text style={{textAlign:"auto",fontSize:11,color:currentRoute === "ProfilePage" ? "#f9a641" : "black",
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
     centerContainer:{
        flexDirection:"column",
        justifyContent:"center",
        alignSelf:"center",
        alignItems:"center",
     },
addButton: {
  width: 60,
  height: 60,
  borderRadius: 30,

  justifyContent: "center",
  alignItems: "center",

  borderWidth: 3,
  borderColor: "#d1d1d1",

  marginTop: -30, // lifts button above bar
},
})