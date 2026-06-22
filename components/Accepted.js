import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";
import {LinearGradient} from "expo-linear-gradient";

export default function Accepted({ orders = [], onComplete}) {
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
          return (
            <View key={id} style={styles.card2}>

              <View style={{ flexDirection: "row", justifyContent: "space-between" ,
                alignItems: "center" }} >
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <MaterialIcons name="account-circle" size={20} color="#f9a641"
                  style={{borderWidth: 0.5, borderColor: "#000000", borderRadius: 20}}/>
                  <Text style={{ fontSize: 13, fontFamily:"Medium",
                      lineHeight: Math.round(13 * 1.5)
                   }}>{customerName}</Text>
                </View>
              <Text style={{ fontSize: 12, fontFamily:"Medium",
                lineHeight: Math.round(12 * 1.5), color: "#5f5f5f"
              }}
              >Purchased {fmtAgo(order?.placedAt || order?.createdAt)}</Text>
              </View>

              <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1,
                marginVertical: 4
               }} />

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Offer Claimed</Text>
                  <Text style={styles.metaValue}>{offerName}</Text>
                </View>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Phone</Text>
                  <Text style={styles.metaValue}>{customerPhone}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
                  <LinearGradient colors={["#fc9312","#ffb937", "#fad99c"]} start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }} style={styles.button}>
                  <TouchableOpacity onPress={() => onComplete?.(order)}>
                    <Text style={styles.buttonText}>Complete Order</Text>
                  </TouchableOpacity>
                  </LinearGradient>
                </View>

            </View>
          );
        })}
        {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 24 }}>No accepted orders</Text> : null}
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
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6
  },
  buttonText: {
    color: "white",
    fontFamily:"Medium",
    lineHeight: Math.round(14 * 1.5),
    fontSize: 14
  },
  metaBlock: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
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
});