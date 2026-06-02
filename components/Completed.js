import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";

export default function Completed({ orders = [], onDelete }) {
  const { colors } = useContext(ThemeContext);
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

          return (
            <View key={id} style={styles.card2}>
              <Text style={{ fontSize: 12, fontFamily:"Medium",
                lineHeight: Math.round(12 * 1.5)
              }}
              >Order Completed Successfully</Text>            
            
              <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1,
                marginVertical: 4
               }} />

                <View style={{ flexDirection: "row", gap: 5 }}>
                  <MaterialCommunityIcons name="account" size={20} />
                  <Text style={{fontFamily:"Medium",
                    fontSize: 13, lineHeight: Math.round(13 * 1.5)
                  }}>{customerName}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#32a3388e" }]}> 
                    <Feather name="check-circle" size={16} color="#154926" />
                    <Text style={styles.buttonText}>Completed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete?.(order?._id || order?.id)}>
                    <Feather name="trash-2" size={16} color="#b71c1c" />
                  </TouchableOpacity>
                </View>
              </View>
          );
        })}
        {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 24 }}>No completed orders</Text> : null}
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
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1549268e",
    flexDirection: "row",
    gap:6
  },
  buttonText: {
    color: "#154926",
    fontFamily:"Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  }
  ,deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent"
  }
});
