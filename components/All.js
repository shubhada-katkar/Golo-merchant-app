import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { Entypo, MaterialIcons, Feather } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";
import {LinearGradient} from "expo-linear-gradient";

export default function All({ orders = [], onStatusChange, onViewOrder }) {
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
          const offerName =
            order?.offerTitle ||
            order?.offerName ||
            order?.title ||
            order?.name ||
            order?.voucher?.offerTitle ||
            order?.voucher?.offer?.title ||
            order?.voucher?.title ||
            order?.voucher?.name ||
            order?.offer?.title ||
            order?.offer?.bannerTitle ||
            "Offer details not available";
          const customerPhone =
            order?.customerPhone ||
            order?.phone ||
            order?.user?.phone ||
            order?.customer?.phone ||
            order?.contactNumber ||
            "Phone not available";
          const status = String(order?.status || "").toLowerCase();
          const isPending = ["pending", "new", "claimed"].includes(status);

          return (
            <View key={id} style={styles.card2}>

<View style={{ flexDirection: "row", justifyContent: "space-between" ,
  alignItems: "center" }} >
                <View style={{ flexDirection: "row", gap: 5, 
                   flex: 1, alignItems: "center" }}>
                  <MaterialIcons name="account-circle" size={20} color="#f9a641"
                  style={{borderWidth: 0.5, borderColor: "#000000", borderRadius: 20}}/>
                  <Text style={{ fontSize: 13, fontFamily:"Medium", lineHeight: Math.round(13 * 1.5),
                  flexShrink: 1
                  }} numberOfLines={1}  ellipsizeMode="tail"
                  >{customerName}</Text>
                </View>

                <Text style={{ fontSize: 12, fontFamily:"Medium",
                  lineHeight: Math.round(12 * 1.5), color: "#5f5f5f"
                }}
                >Purchased {fmtAgo(order?.placedAt || order?.createdAt)}</Text>
</View>

              <View style={{ flexDirection: "row", backgroundColor: "#979797", height: 1, marginVertical: 4 }} />

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Offer Claimed</Text>
                  <Text style={styles.metaValue}>{offerName}</Text>
                </View>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Phone</Text>
                  <Text style={styles.metaValue} >
                    {customerPhone}
                  </Text>
                </View>

                {isPending ? (
                  <View style={{ flexDirection: "row", gap: 10, alignSelf:"flex-end"}}>
                    <LinearGradient colors={["#d80000","#db5454" ,"#f0625d"]} start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }} style={styles.button}>
                    <TouchableOpacity onPress={() => onStatusChange?.(id, "rejected") }
                      style={{ flexDirection: "row", gap: 6 }}>
                      <Entypo name="cross" size={16} color="white" style={{ top: 2 }} />
                      <Text style={styles.text}>Reject</Text>
                    </TouchableOpacity>
                      </LinearGradient>

                    <LinearGradient colors={["#106440", "#50a180","#56d6a1"]} start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }} style={styles.button}>
                    <TouchableOpacity onPress={() => onStatusChange?.(id, "accepted") }
                      style={{ flexDirection: "row", gap: 6 }}>
                      <Feather name="check" size={16} color="white" style={{ top: 2 }} />
                      <Text style={styles.text}>Accept</Text>
                    </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ) : status === "accepted" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
                    <LinearGradient colors={["#fc9312","#ffb937", "#fad99c"]} start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }} style={styles.button}>
                    <TouchableOpacity onPress={() => onViewOrder?.(order)}> 
                      <Text style={styles.acceptedButtonText}>Accepted</Text>
                    </TouchableOpacity>
                    </LinearGradient>
                  </View>

                ) : status === "completed" ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
                    <LinearGradient colors={["#106440", "#50a180","#56d6a1"]} start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }} style={styles.button}>
                    <TouchableOpacity
                      onPress={() => onViewOrder?.(order)}
                      style={{ flexDirection: "row", gap: 6 }}
                    > 
                      <Feather name="check-circle" size={16} color="#ffffff" 
                      style={{ top:2}} />
                      <Text style={styles.completedButtonText}>Completed</Text>
                    </TouchableOpacity>
                    </LinearGradient>
                  </View>

                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: "#dadada" }]}> 
                      <Text style={styles.text}>{(order?.status || "Updated").toString().charAt(0).toUpperCase() + (order?.status || "").toString().slice(1) || "Updated"}</Text>
                    </TouchableOpacity>
                  </View>
                )}

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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12
  },
  card2: {
    borderRadius: 10,
    borderColor: "black",
    minHeight: 100,
    shadowColor: "#413f4f",
    elevation: 10,
    backgroundColor: "white",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 4 },
    padding: 10
  },
  button: {
    flexDirection: "row",
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
  metaBlock: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: "#5f5f5f",
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
  },
  metaValue: {
    fontSize: 12,
    color: "#000000",
    fontFamily: "Medium",
    lineHeight: Math.round(12 * 1.5),
  },
  acceptedButtonText: {
    color: "white",
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  },
  completedButtonText: {
    color: "#ffffff",
    fontFamily: "Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  },
});
