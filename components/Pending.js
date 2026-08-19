import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { MaterialIcons, Entypo, Feather } from "@expo/vector-icons";
import { fmtAgo } from "../utils/timeFormatter";
import { textPresets } from "../theme/typography";

const PAGE_SIZE = 10;

const PendingCard = memo(function PendingCard({ order, onStatusChange, colors }) {
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
    <View style={styles.card2}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", gap: 5 }}>
          <MaterialIcons name="account-circle" size={20} color="#f9a641"
            style={{ borderWidth: 0.5, borderColor: "#000000", borderRadius: 20 }} />
          <Text style={{ ...textPresets.label }}>{customerName}</Text>
        </View>
        <Text style={{ ...textPresets.caption, color: "#5f5f5f" }}>
          Purchased {fmtAgo(order?.placedAt || order?.createdAt)}
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

      <View style={{ flexDirection: "row", gap: 10, alignSelf: "flex-end", marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => onStatusChange?.(id, "rejected")}
          style={[styles.button, { backgroundColor: "#e44d42" }]}
          activeOpacity={0.7}
        >
          <Entypo name="cross" size={16} color="white" style={{ top: 2 }} />
          <Text style={styles.text}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onStatusChange?.(id, "accepted")}
          style={[styles.button, { backgroundColor: "#157a4f" }]}
          activeOpacity={0.7}
        >
          <Feather name="check" size={16} color="white" style={{ top: 2 }} />
          <Text style={styles.text}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function Pending({ orders = [], onStatusChange }) {
  const { colors } = useContext(ThemeContext);
  const [nowTick, setNowTick] = useState(Date.now());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  // Reset pagination when the orders list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [orders]);

  const visibleOrders = orders.slice(0, visibleCount);
  const hasMore = visibleCount < orders.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, orders.length));
    }
  }, [hasMore, orders.length]);

  const handleStatusChange = useCallback((id, newStatus) => {
    onStatusChange?.(id, newStatus);
  }, [onStatusChange]);

  const renderItem = useCallback(({ item }) => (
    <PendingCard order={item} onStatusChange={handleStatusChange} colors={colors} />
  ), [handleStatusChange, colors]);

  const keyExtractor = useCallback((order) => String(order?._id || order?.id || Math.random()), []);

  const ListFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#157a4f" />
        <Text style={styles.loadMoreText}>Loading more orders…</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={visibleOrders}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.colcontainer}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24, ...textPresets.caption }}>No pending orders</Text>}
      ListFooterComponent={ListFooter}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      initialNumToRender={PAGE_SIZE}
      maxToRenderPerBatch={PAGE_SIZE}
      windowSize={7}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  colcontainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  loadMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreText: {
    color: "#157a4f",
    ...textPresets.caption,
  },
});
