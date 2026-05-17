import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Entypo, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function Pending({ orders = [], onStatusChange }) {
  const { colors } = useContext(ThemeContext);
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.colcontainer}>
        {orders.map((order) => {
          const id = order?._id || order?.id || "";
          const total = Number(order?.totalAmount || order?.total || 0);
          const itemCount = order?.items?.length || order?.products?.length || 0;
          const customerName = order?.customerName || order?.user?.name || "Customer";

          return (
            <View key={id} style={styles.card2}>
              <Text>Order #{id.slice(-6) || "N/A"}</Text>
              <Text>Pending</Text>
              <View style={{ flexDirection: "row", paddingHorizontal: 10, justifyContent: "space-evenly" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Entypo name="bar-graph" size={26} color="green" />
                  <Text style={styles.bigcardtext}>{Math.round(total)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FontAwesome5 name="box" size={24} color="green" />
                  <Text style={styles.bigcardtext}>{itemCount} Items</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

              <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <MaterialCommunityIcons name="account" size={20} />
                  <Text>{customerName}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#dadada" }]} onPress={() => onStatusChange?.(id, "rejected")}>
                    <Text>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#4caf50" }]} onPress={() => onStatusChange?.(id, "accepted")}>
                    <Text>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 24 }}>No pending orders</Text> : null}
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
    padding: 10
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
});
