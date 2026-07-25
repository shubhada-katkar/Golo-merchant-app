import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from "../theme/typography";

const PAGE_SIZE = 10;

const CompletedCard = memo(function CompletedCard({ order, onViewOrder, colors }) {
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
    <View style={styles.card2}>

      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center"
      }} >
        <View style={{ flexDirection: "row", gap: 5 }}>
          <MaterialIcons name="account-circle" size={20} color="#f5b849"
            style={{ borderWidth: 0.5, borderRadius: 20 }} />
          <Text style={{
            ...textPresets.label
          }}>{customerName}</Text>
        </View>

        <Text style={{
          ...textPresets.caption, color: "#5f5f5f"
        }}
        >Order Completed</Text>
      </View>

      <View style={{
        flexDirection: "row", backgroundColor: colors.divider, height: 1,
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

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8, alignSelf: "flex-end" }}>
        <TouchableOpacity
          onPress={() => onViewOrder?.(order)}
          style={styles.button}
          activeOpacity={0.7}
        >
          <Feather name="check-circle" size={16} color="#ffffff" />
          <Text style={styles.buttonText}>Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function Completed({ orders = [], onViewOrder }) {
  const { colors } = useContext(ThemeContext);
  const [nowTick, setNowTick] = useState(Date.now());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  // Reset pagination when orders list changes
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

  const handleViewOrder = useCallback((order) => {
    onViewOrder?.(order);
  }, [onViewOrder]);

  const renderItem = useCallback(({ item }) => (
    <CompletedCard order={item} onViewOrder={handleViewOrder} colors={colors} />
  ), [handleViewOrder, colors]);

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
      ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24 }}>No completed orders</Text>}
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
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#157a4f"
  },
  buttonText: {
    color: "#ffffff",
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
    color: "#1f1f1f",
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
