import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { Entypo, FontAwesome5, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";

export default function All({ orders = [], onStatusChange }) {
  const { colors } = useContext(ThemeContext);

  // Tick state to force periodic re-render so relative times update in real-time
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.colcontainer}>
        {orders.map((order) => {
          const id = order?._id || order?.id || "";
          const total = Number(order?.totalAmount || order?.total || 0);
          const itemCount = order?.items?.length || order?.products?.length || 0;
          const customerName = order?.customerName || order?.user?.name || "Customer";
          const status = String(order?.status || "").toLowerCase();
          const isPending = ["pending", "new", "claimed"].includes(status);

          return (
            <View key={id} style={styles.card2}>

                <Text style={{ fontSize: 12, fontFamily:"Medium",
                  lineHeight: Math.round(12 * 1.5)
                }}
                >Purchased {fmtAgo(order?.placedAt || order?.createdAt)}</Text>

              <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1 }} />

              <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <MaterialCommunityIcons name="account" size={20} />
                  <Text style={{ fontSize: 13, fontFamily:"Medium", lineHeight: Math.round(13 * 1.5)
                  }}
                  >{customerName}</Text>
                </View>

                {isPending ? (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: "#df5454" }]} onPress={() => onStatusChange?.(id, "rejected")}>
                      <Entypo name="cross" size={16} color="white" />
                      <Text style={styles.text}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: "#157a4f" }]} onPress={() => onStatusChange?.(id, "accepted")}>
                      <Feather name="check" size={16} color="white" />
                      <Text style={styles.text}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                ) : status === "accepted" ? (
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#f5b849" }]}>
                    <Text style={styles.acceptedButtonText}>Accepted</Text>
                  </TouchableOpacity>
                ) : status === "completed" ? (
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#32a3388e", borderWidth: 1, borderColor: "#1549268e", flexDirection: "row", gap: 6 }]}>
                    <Feather name="check-circle" size={16} color="#154926" />
                    <Text style={styles.completedButtonText}>Completed</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#dadada" }]}>
                    <Text style={styles.text}>{order?.status || "Updated"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 24 }}>No orders found</Text> : null}
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
    minHeight: 100,
    borderWidth: 1,
    shadowColor: "#413f4f",
    elevation: 10,
    backgroundColor: "white",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 4 },
    padding: 10
  },
  button: {
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    flexDirection: "row",
    gap: 4
  },
  text:{
    fontFamily:"Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14,
    color:"white"
  },
  acceptedButtonText: {
    color: "white",
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  },
  completedButtonText: {
    color: "#154926",
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  }
});
