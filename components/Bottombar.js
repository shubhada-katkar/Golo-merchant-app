import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { textPresets } from "../theme/typography";

export default function Bottombar() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;
  const { colors } = useContext(ThemeContext);

  return (
    <View style={[styles.top, { backgroundColor: colors.bottombar }]}>

      <TouchableOpacity style={[styles.bar]} onPress={() => navigation.navigate("HomePage", { initialTab: "Overview", resetKey: Date.now() })}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24}
          color={currentRoute === "HomePage" ? "#f9a641" : "black"} />
        <Text style={{
          ...textPresets.caption, textAlign: "auto", color: currentRoute === "HomePage" ? "#f9a641" : "black",
        }}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("PostsPage")}>
        <MaterialCommunityIcons name="account-group-outline" size={24}
          color={currentRoute === "PostsPage" ? "#f9a641" : "black"} />
        <Text style={{
          ...textPresets.caption, textAlign: "auto", color: currentRoute === "PostsPage" ? "#f9a641" : "black",
        }}>Offers</Text>
      </TouchableOpacity>

      <View style={styles.centerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("AddOfferPage", { offerData: null, resetKey: Date.now() })}
          style={[styles.addButton,
          { backgroundColor: currentRoute === "AddOfferPage" ? "#f9a641" : "#4caf50" }
          ]} >
          <MaterialCommunityIcons
            name="plus"
            size={30}
            color={currentRoute === "AddOfferPage" ? "#ffffff" : "black"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("AddOfferPage", { offerData: null, resetKey: Date.now() })}>
          <Text
            style={{
              ...textPresets.caption,
              color: currentRoute === "AddOfferPage" ? "#f9a641" : "black",
              top: 7
            }}
          >
            Add Offer
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("ProductListPage")}>
        <MaterialCommunityIcons name="format-list-checkbox" size={24}
          color={currentRoute === "ProductListPage" ? "#f9a641" : "black"} />
        <Text style={{
          ...textPresets.caption, textAlign: "auto", color: currentRoute === "ProductListPage" ? "#f9a641" : "black",
        }}>Product List</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bar} onPress={() => navigation.navigate("ProfilePage")}>
        <MaterialCommunityIcons name="account-circle-outline" size={24}
          color={currentRoute === "ProfilePage" ? "#f9a641" : "black"} />
        <Text style={{
          ...textPresets.caption, textAlign: "auto", color: currentRoute === "ProfilePage" ? "#f9a641" : "black",
        }}>Profile</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    minHeight: 60,
    borderColor: "grey",
    backgroundColor: "white",
    borderTopWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  bar: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
  },
  centerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignSelf: "center",
    alignItems: "center",
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 30,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 3,
    borderColor: "#d1d1d1",

    marginTop: -40, // lifts button above bar
  },
})