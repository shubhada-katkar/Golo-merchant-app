import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { Entypo, MaterialIcons, Feather } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";
import {LinearGradient} from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const OrderCard = memo(function OrderCard({ order, onStatusChange, onViewOrder }) {
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
  const status = String(order?.status || "").toLowerCase();
  const isPending = ["pending", "new", "claimed"].includes(status);

  return (
    <View style={styles.card2}>

      <View style={{ flexDirection: "row", justifyContent: "space-between" ,
        alignItems: "center" }} >
          <View style={{ flexDirection: "row", gap: 5, 
             flex: 1, alignItems: "center" }}>
            <MaterialIcons name="account-circle" size={20} color="#f9a641"
            style={{borderWidth: 0.5, borderColor: "#000000", borderRadius: 20}}/>
            <Text style={{ ...textPresets.label,
            flexShrink: 1
            }} numberOfLines={1}  ellipsizeMode="tail"
            >{customerName}</Text>
          </View>

          <Text style={{color: "#5f5f5f", ...textPresets.caption
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
            <View style={[styles.button, { backgroundColor: "#e44d42" }]}>
            <TouchableOpacity onPress={() => onStatusChange?.(id, "rejected") }
              style={{ flexDirection: "row", gap: 6 }}>
              <Entypo name="cross" size={16} color="white" style={{ top: 2 }} />
              <Text style={styles.text}>Reject</Text>
            </TouchableOpacity>
              </View>

            <View style={[styles.button, { backgroundColor: "#157a4f" }]}>
            <TouchableOpacity onPress={() => onStatusChange?.(id, "accepted") }
              style={{ flexDirection: "row", gap: 6 }}>
              <Feather name="check" size={16} color="white" style={{ top: 2 }} />
              <Text style={styles.text}>Accept</Text>
            </TouchableOpacity>
            </View>
          </View>
        ) : status === "accepted" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
            <View style={[styles.button, { backgroundColor: "#f5b849" }]}>
            <TouchableOpacity onPress={() => onViewOrder?.(order)}> 
              <Text style={styles.acceptedButtonText}>Click To Complete</Text>
            </TouchableOpacity>
            </View>
          </View>

        ) : status === "completed" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf:"flex-end" }}>
            <View style={[styles.button, { backgroundColor: "#157a4f" }]}>
            <TouchableOpacity
              onPress={() => onViewOrder?.(order)}
              style={{ flexDirection: "row", gap: 6 }}
            > 
              <Feather name="check-circle" size={16} color="#ffffff" 
              style={{ top:2}} />
              <Text style={styles.completedButtonText}>Completed</Text>
            </TouchableOpacity>
            </View>
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
});

export default function All({ orders = [], onStatusChange, onViewOrder }) {
  const { colors } = useContext(ThemeContext);

  // Tick state to force periodic re-render so relative times update in real-time
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  // Stable references so OrderCard's memoization isn't defeated every render
  const handleStatusChange = useCallback((id, newStatus) => {
    onStatusChange?.(id, newStatus);
  }, [onStatusChange]);

  const handleViewOrder = useCallback((order) => {
    onViewOrder?.(order);
  }, [onViewOrder]);

  const renderItem = useCallback(({ item }) => (
    <OrderCard
      order={item}
      onStatusChange={handleStatusChange}
      onViewOrder={handleViewOrder}
    />
  ), [handleStatusChange, handleViewOrder]);

  const keyExtractor = useCallback((order) => String(order?._id || order?.id || Math.random()), []);

  return (
    <FlatList
      data={orders}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.colcontainer}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24 }}>No orders found</Text>}
      // Perf tuning knobs - adjust based on real device testing
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  colcontainer: {
    paddingHorizontal: 16,
    paddingVertical: 10
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
    color:"white",
    ...textPresets.label
  },
  metaBlock: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    color: "#5f5f5f",
    ...textPresets.label
  },
  metaValue: {
    color: "#000000",
    ...textPresets.label
  },
  acceptedButtonText: {
    color: "white",
    ...textPresets.label
  },
  completedButtonText: {
    color: "#ffffff",
    ...textPresets.label
  },
});