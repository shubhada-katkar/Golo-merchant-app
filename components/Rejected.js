import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";
import { textPresets } from "../theme/typography";

export default function Rejected({ orders = [], onDelete }) {
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
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <MaterialIcons name="account-circle" size={20} color="#f9a641"
                    style={{ borderWidth: 0.5, borderColor: "#000000", borderRadius: 20 }} />
                  <Text style={{ ...textPresets.label }}>{customerName}</Text>
                </View>
                <Text style={{ ...textPresets.caption, color: "#e44d42" }}>
                  Rejected
                </Text>
              </View>

              <View style={{ flexDirection: "row", backgroundColor: colors.divider, height: 1, marginVertical: 4 }} />

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Offer Claimed</Text>
                <Text style={styles.metaValue}>{offerName}</Text>
              </View>

              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Phone</Text>
                <Text style={styles.metaValue}>{customerPhone}</Text>
              </View>

              {/* 
              <View style={{ flexDirection: "row", gap: 10, alignSelf: "flex-end", marginTop: 10 }}>
                <View style={[styles.button, { backgroundColor: "#e44d42" }]}>
                  <TouchableOpacity onPress={() => onDelete?.(id)}
                    style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Entypo name="trash" size={14} color="white" />
                    <Text style={styles.text}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View> */}

            </View>
          );
        })}
        {orders.length === 0 ? <Text style={{ textAlign: "center", marginTop: 24 }}>No rejected orders</Text> : null}
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
    gap: 4
  },
  text: {
    color: "white",
    ...textPresets.label
  },
  metaBlock: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  metaLabel: {
    color: "#5f5f5f",
    ...textPresets.label
  },
  metaValue: {
    color: "#000000",
    ...textPresets.label
  },
});
