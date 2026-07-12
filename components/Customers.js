import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { textPresets } from "../theme/typography";

const normalizeUrl = (url) => String(url || "").replace(/\/{2,}$/, "");

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState([]);
  const [topRegions, setTopRegions] = useState([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState({});

  const fetchRealtimeAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        (await AsyncStorage.getItem("merchantToken")) ||
        (await AsyncStorage.getItem("accessToken"));
      if (!token) {
        throw new Error("Merchant authentication required");
      }

      const response = await fetch(
        `${normalizeUrl(BASE_URL)}/merchant-dashboard/analytics/realtime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to load analytics");
      }

      setDemographics(
        Array.isArray(payload?.data?.demographics) ? payload.data.demographics : []
      );
      setTopRegions(
        Array.isArray(payload?.data?.regions) ? payload.data.regions : []
      );
      setDeviceBreakdown(
        payload?.data?.device && typeof payload.data.device === "object"
          ? {
              Mobile: Number(payload.data.device.Mobile ?? payload.data.device.mobile ?? 0),
              Desktop: Number(payload.data.device.Desktop ?? payload.data.device.desktop ?? 0),
              Tablet: Number(payload.data.device.Tablet ?? payload.data.device.tablet ?? 0),
            }
          : {}
      );
    } catch (err) {
      setError(String(err?.message || "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRealtimeAnalytics();
    }, [])
  );

  const polarToCartesian = (cx, cy, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      cx,
      cy,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  const renderDeviceChart = () => {
    const slices = [
      { label: "Mobile", value: Number(deviceBreakdown.Mobile || 0), color: "#157a4f" },
      { label: "Desktop", value: Number(deviceBreakdown.Desktop || 0), color: "#3b82f6" },
      { label: "Tablet", value: Number(deviceBreakdown.Tablet || 0), color: "#f59e0b" },
    ].filter((slice) => slice.value > 0);

    if (!slices.length) {
      return <Text style={styles.emptyText}>No device type data available.</Text>;
    }

    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let startAngle = 0;
    const chartSlices = slices.map((slice) => {
      const endAngle = startAngle + (slice.value / total) * 360;
      const path = describeArc(60, 60, 50, startAngle, endAngle);
      startAngle = endAngle;
      return { ...slice, path };
    });

    return (
      <View style={styles.deviceChartCard}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {chartSlices.map((slice) => (
            <Path key={slice.label} d={slice.path} fill={slice.color} />
          ))}
        </Svg>
        <View style={styles.deviceLegend}>
          {chartSlices.map((slice) => (
            <View key={slice.label} style={styles.deviceLegendItem}>
              <View
                style={[styles.deviceLegendDot, { backgroundColor: slice.color }]}
              />
              <Text style={styles.deviceLegendText}>
                {slice.label} {slice.value}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStackedBar = (values, colors) => {
    const total = values.reduce(
      (sum, value) => sum + Math.max(0, Number(value) || 0),
      0
    );

    return (
      <View style={styles.barRow}>
        {values.map((value, index) => {
          const amount = Math.max(0, Number(value) || 0);
          const width = total ? Math.max(8, Math.round((amount / total) * 220)) : 8;
          return (
            <View
              key={index}
              style={[
                styles.segment,
                { width, backgroundColor: colors[index] || "#d1d5db" },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderRow = (label, values, valueText, colors) => (
    <View style={styles.dataRow} key={label}>
      <View style={styles.rowLabelContainer}>
        <Text style={styles.rowLabel} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      </View>
      <View style={styles.rowContent}>
        {renderStackedBar(values, colors)}
        <Text style={styles.rowValue}>{valueText}</Text>
      </View>
    </View>
  );

  const renderDemographicRows = () => {
    if (!demographics.length) {
      return (
        <Text style={styles.emptyText}>
          No redeemed customer demographics available.
        </Text>
      );
    }

    return demographics.map((row) => {
      const male = Number(row?.male || 0);
      const female = Number(row?.female || 0);
      const other = Number(row?.other || 0);
      const total = male + female + other;
      return renderRow(
        row.label || "Unknown",
        [male, female, other],
        total ? `${total}` : "0",
        ["#4caf50", "#f9a641", "#6b7280"]
      );
    });
  };

  const renderRegionRows = () => {
    if (!topRegions.length) {
      return (
        <Text style={styles.emptyText}>
          No location redemption data available.
        </Text>
      );
    }

    return topRegions.map((row) => {
      const percent = Number(row?.percent || 0);
      return renderRow(
        row.region || "Unknown",
        [percent],
        `${percent}%`,
        ["#157a4f"]
      );
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Device Type</Text>
            <Text style={styles.cardSubtitle}>Realtime usage split</Text>
          </View>

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              size="small"
              color="#157a4f"
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            renderDeviceChart()
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Age and Gender</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#4caf50" }]}
                />
                <Text style={styles.legendText}>Male</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#f9a641" }]}
                />
                <Text style={styles.legendText}>Female</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#6b7280" }]}
                />
                <Text style={styles.legendText}>Other</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              size="small"
              color="#157a4f"
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.rowsContainer}>{renderDemographicRows()}</View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.cardSubtitle}>Top redeemed regions</Text>
          </View>

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              size="small"
              color="#157a4f"
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.rowsContainer}>{renderRegionRows()}</View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    ...textPresets.body,
    marginBottom: 8,
    lineHeight:Math.round(14 * 1.5)
  },
  cardSubtitle: {
    color: "#6b7280",
    ...textPresets.label
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    marginLeft: 6,
    color: "#374151",
    ...textPresets.label
  },
  rowsContainer: {
    gap: 12,
  },
deviceChartCard: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 20,
  paddingVertical: 8,
},
pieWrapper: {
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
  borderRadius: 90,
},
deviceLegend: {
  flex: 1,
  minWidth: 140,
  gap: 12,
},
deviceLegendItem: {
  flexDirection: "row",
  alignItems: "center",
},
deviceLegendDot: {
  width: 14,
  height: 14,
  borderRadius: 7,
  marginRight: 10,
},
deviceLegendText: {
  color: "#374151",
  ...textPresets.label
},
deviceLegendPercent: {
  color: "#111827",
  ...textPresets.body
},
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  rowLabelContainer: {
    width: 90,
  },
  rowLabel: {
    color: "#111827",
    ...textPresets.label
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    flex: 1,
  },
  segment: {
    height: "100%",
  },
  rowValue: {
    minWidth: 40,
    color: "#374151",
    textAlign: "right",
    ...textPresets.label
  },
  loading: {
    paddingVertical: 20,
  },
  errorText: {
    color: "#b91c1c",
    ...textPresets.label
  },
  emptyText: {
    color: "#6b7280",
    ...textPresets.label
  },
});