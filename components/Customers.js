import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import Svg, { Path, Line, Circle, Polyline, Text as SvgText } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../config";
import { getValidToken, handleAuthError } from "../services/authService";
import { textPresets } from "../theme/typography";

const normalizeUrl = (url) => String(url || "").replace(/\/{2,}$/, "");
const CHART_WIDTH = Dimensions.get("window").width - 96;
const CHART_HEIGHT = 140;
const CHART_PADDING_LEFT = 36;
const CHART_PADDING_TOP = 10;
const CHART_PADDING_BOTTOM = 24;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - 10;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

export default function Customers() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState([]);
  const [topRegions, setTopRegions] = useState([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState({});
  const [retentionData, setRetentionData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [likedOffers, setLikedOffers] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);
  const [likesLoading, setLikesLoading] = useState(true);

  const fetchRealtimeAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (authErr) {
        await handleAuthError(navigation);
        return;
      }

      const response = await fetch(
        `${normalizeUrl(BASE_URL)}/merchant-dashboard/analytics/realtime`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        await handleAuthError(navigation);
        return;
      }

      const payload = await response.json();
      if (!response.ok || payload?.success === false)
        throw new Error(payload?.message || "Unable to load analytics");

      setDemographics(Array.isArray(payload?.data?.demographics) ? payload.data.demographics : []);
      setTopRegions(Array.isArray(payload?.data?.regions) ? payload.data.regions : []);
      setDeviceBreakdown(
        payload?.data?.device && typeof payload.data.device === "object"
          ? {
            Mobile: Number(payload.data.device.Mobile ?? payload.data.device.mobile ?? 0),
            Desktop: Number(payload.data.device.Desktop ?? payload.data.device.desktop ?? 0),
            Tablet: Number(payload.data.device.Tablet ?? payload.data.device.tablet ?? 0),
          }
          : {}
      );

      const events = payload?.data?.events;
      if (events) {
        setRetentionData({
          totalActive: Number(events.totalActive || 0),
          newSignups: Number(events.newSignups || 0),
          retention: Number(events.retention || 0),
          totalOrders: Number(events.totalOrders || 0),
        });
      }

      // Trend data for the line graph (labels + values arrays from backend)
      const trend = payload?.data?.trend;
      if (trend && Array.isArray(trend.labels) && Array.isArray(trend.values)) {
        setTrendData({ labels: trend.labels, values: trend.values });
      }
    } catch (err) {
      setError(String(err?.message || "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedProductsAndOffers = async () => {
    setLikesLoading(true);
    try {
      let token;
      try {
        token = await getValidToken();
      } catch (_authErr) {
        setLikesLoading(false);
        return;
      }
      if (!token) return;
      const response = await fetch(
        `${normalizeUrl(BASE_URL)}/users/merchant/liked-products?limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        await handleAuthError(navigation);
        return;
      }
      if (response.ok) {
        const payload = await response.json();
        const data = payload?.data || {};
        setLikedOffers(Array.isArray(data.offers) ? data.offers : []);
        setLikedProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch (err) {
      console.warn("Failed to load liked products:", err?.message || err);
    } finally {
      setLikesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRealtimeAnalytics();
      fetchLikedProductsAndOffers();
    }, [])
  );

  // ─── Helper: resolve offer image from multiple sources ───
  const resolveOfferImage = (offer) => {
    if (offer?.image && offer.image.length > 0) return offer.image;
    if (offer?.imageUrl && offer.imageUrl.length > 0) return offer.imageUrl;
    // Try first product in selectedProducts
    const products = Array.isArray(offer?.selectedProducts) ? offer.selectedProducts : [];
    for (const p of products) {
      const img = p?.imageUrl || p?.image || "";
      if (img.length > 0) return img;
    }
    return null;
  };

  // ─── SVG line graph for retention trend ───
  const renderLineGraph = () => {
    if (!trendData || !trendData.values.length) {
      return <Text style={styles.emptyText}>No trend data available.</Text>;
    }

    const { labels, values } = trendData;
    const maxVal = Math.max(...values, 1);
    const points = values.map((v, i) => {
      const x = CHART_PADDING_LEFT + (i / Math.max(values.length - 1, 1)) * PLOT_WIDTH;
      const y = CHART_PADDING_TOP + PLOT_HEIGHT - (v / maxVal) * PLOT_HEIGHT;
      return { x, y, v };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    // Gradient fill path
    const firstX = points[0]?.x || CHART_PADDING_LEFT;
    const lastX = points[points.length - 1]?.x || CHART_WIDTH;
    const bottomY = CHART_PADDING_TOP + PLOT_HEIGHT;
    const fillPath = `M ${firstX},${bottomY} ` +
      points.map((p) => `L ${p.x},${p.y}`).join(" ") +
      ` L ${lastX},${bottomY} Z`;

    // Y-axis lines
    const yLines = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
      y: CHART_PADDING_TOP + PLOT_HEIGHT - frac * PLOT_HEIGHT,
      label: Math.round(frac * maxVal),
    }));

    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        {/* Y-axis grid lines */}
        {yLines.map((yl, i) => (
          <React.Fragment key={`y-${i}`}>
            <Line x1={CHART_PADDING_LEFT} y1={yl.y} x2={CHART_WIDTH - 10} y2={yl.y} stroke="#f0f0f0" strokeWidth={1} />
            <SvgText x={CHART_PADDING_LEFT - 6} y={yl.y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{yl.label}</SvgText>
          </React.Fragment>
        ))}

        {/* Fill area */}
        <Path d={fillPath} fill="#157a4f" opacity={0.08} />

        {/* Line */}
        <Polyline points={polylinePoints} fill="none" stroke="#157a4f" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke="#157a4f" strokeWidth={2} />
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          const x = CHART_PADDING_LEFT + (i / Math.max(labels.length - 1, 1)) * PLOT_WIDTH;
          // Show every label if <=7, else every other
          if (labels.length > 7 && i % 2 !== 0 && i !== labels.length - 1) return null;
          return (
            <SvgText key={`x-${i}`} x={x} y={CHART_HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">{label}</SvgText>
          );
        })}
      </Svg>
    );
  };

  // ─── Pie chart helpers ───
  const polarToCartesian = (cx, cy, radius, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180.0;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };
  const renderDeviceChart = () => {
    const slices = [
      { label: "Mobile", value: Number(deviceBreakdown.Mobile || 0), color: "#157a4f" },
      { label: "Desktop", value: Number(deviceBreakdown.Desktop || 0), color: "#3b82f6" },
      { label: "Tablet", value: Number(deviceBreakdown.Tablet || 0), color: "#f59e0b" },
    ].filter((s) => s.value > 0);
    if (!slices.length) return <Text style={styles.emptyText}>No device type data available.</Text>;

    const total = slices.reduce((sum, s) => sum + s.value, 0);
    let sa = 0;
    const chartSlices = slices.map((s) => {
      const ea = sa + (s.value / total) * 360;
      // Guard against a full 360° slice: start/end angles map to the same
      // point so the arc path degenerates. Cap just short of a full circle.
      const clampedEa = ea - sa >= 359.99 ? sa + 359.99 : ea;
      const path = describeArc(60, 60, 50, sa, clampedEa);
      sa = ea;
      return { ...s, path, isFull: ea - (ea - (clampedEa - sa)) };
    });

    return (
      <View style={styles.deviceChartCard}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {chartSlices.length === 1 ? (
            // Single device type = 100% share, draw a plain full circle
            <Circle cx={60} cy={60} r={50} fill={chartSlices[0].color} />
          ) : (
            chartSlices.map((s) => <Path key={s.label} d={s.path} fill={s.color} />)
          )}
        </Svg>
        <View style={styles.deviceLegend}>
          {chartSlices.map((s) => (
            <View key={s.label} style={styles.deviceLegendItem}>
              <View style={[styles.deviceLegendDot, { backgroundColor: s.color }]} />
              <Text style={styles.deviceLegendText}>{s.label} {s.value}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStackedBar = (values, colors) => {
    const total = values.reduce((sum, v) => sum + Math.max(0, Number(v) || 0), 0);
    return (
      <View style={styles.barRow}>
        {values.map((v, i) => {
          const amt = Math.max(0, Number(v) || 0);
          const w = total ? Math.max(8, Math.round((amt / total) * 220)) : 8;
          return <View key={i} style={[styles.segment, { width: w, backgroundColor: colors[i] || "#d1d5db" }]} />;
        })}
      </View>
    );
  };

  const renderRow = (label, values, valueText, colors) => (
    <View style={styles.dataRow} key={label}>
      <View style={styles.rowLabelContainer}>
        <Text style={styles.rowLabel} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      </View>
      <View style={styles.rowContent}>
        {renderStackedBar(values, colors)}
        <Text style={styles.rowValue}>{valueText}</Text>
      </View>
    </View>
  );

  const renderDemographicRows = () => {
    if (!demographics.length) return <Text style={styles.emptyText}>No redeemed customer demographics available.</Text>;
    return demographics.map((row) => {
      const m = Number(row?.male || 0), f = Number(row?.female || 0), o = Number(row?.other || 0);
      return renderRow(row.label || "Unknown", [m, f, o], `${m + f + o}`, ["#4caf50", "#f9a641", "#6b7280"]);
    });
  };

  const renderRegionRows = () => {
    if (!topRegions.length) return <Text style={styles.emptyText}>No location redemption data available.</Text>;
    return topRegions.map((row) => {
      const p = Number(row?.percent || 0);
      return renderRow(row.region || "Unknown", [p], `${p}%`, ["#157a4f"]);
    });
  };

  // ─── Liked offers (with image fix + scrollable) ───
  const renderLikedOffers = () => {
    if (likesLoading) return <ActivityIndicator style={styles.loading} size="small" color="#157a4f" />;
    if (!likedOffers.length) return <Text style={styles.emptyText}>No liked offers yet.</Text>;

    return (
      <ScrollView style={styles.likedScrollContainer} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {likedOffers.map((offer, index) => {
          const imgUri = resolveOfferImage(offer);
          return (
            <View key={`offer-${offer.offerId || index}`} style={styles.likedItemCard}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.likedItemImage} />
              ) : (
                <View style={[styles.likedItemImage, styles.likedItemImagePlaceholder]}>
                  <Text style={{ color: "#9ca3af", ...textPresets.label }}>No img</Text>
                </View>
              )}
              <View style={styles.likedItemInfo}>
                <Text style={styles.likedItemName} numberOfLines={1}>{offer.name || "Untitled Offer"}</Text>
                <Text style={styles.likedItemType} numberOfLines={1}>{offer.type || "General"}</Text>
                {offer.customers ? <Text style={styles.likedItemCustomers} numberOfLines={1}>By: {offer.customers}</Text> : null}
              </View>
              <View style={styles.likedItemBadge}>
                <Text style={styles.likedItemBadgeText}>❤ {offer.likes || 0}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ─── Liked products (scrollable) ───
  const renderLikedProducts = () => {
    if (likesLoading) return <ActivityIndicator style={styles.loading} size="small" color="#157a4f" />;
    if (!likedProducts.length) return <Text style={styles.emptyText}>No liked products yet.</Text>;

    return (
      <ScrollView style={styles.likedScrollContainer} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {likedProducts.map((product, index) => {
          const imgUri = product?.image || product?.imageUrl || null;
          return (
            <View key={`product-${product.productId || index}`} style={styles.likedItemCard}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.likedItemImage} />
              ) : (
                <View style={[styles.likedItemImage, styles.likedItemImagePlaceholder]}>
                  <Text style={{ color: "#9ca3af", ...textPresets.label }}>No img</Text>
                </View>
              )}
              <View style={styles.likedItemInfo}>
                <Text style={styles.likedItemName} numberOfLines={1}>{product.name || "Untitled Product"}</Text>
                <Text style={styles.likedItemType} numberOfLines={1}>{product.type || "General"}</Text>
                {product.customers ? <Text style={styles.likedItemCustomers} numberOfLines={1}>By: {product.customers}</Text> : null}
              </View>
              <View style={styles.likedItemBadge}>
                <Text style={styles.likedItemBadgeText}>❤ {product.likes || 0}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Customer Retention — Line Graph */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Customer Retention</Text>
            <Text style={styles.cardSubtitle}>Weekly order trend (last 7 days)</Text>
          </View>
          {loading ? (
            <ActivityIndicator style={styles.loading} size="small" color="#157a4f" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View>
              {renderLineGraph()}
              {retentionData && (
                <View style={styles.retentionStatsRow}>
                  <View style={styles.retentionStatItem}>
                    <Text style={styles.retentionStatValue}>{retentionData.retention}%</Text>
                    <Text style={styles.retentionStatLabel}>Retention</Text>
                  </View>
                  <View style={[styles.retentionStatItem, styles.retentionStatDivider]}>
                    <Text style={styles.retentionStatValue}>{retentionData.totalActive}</Text>
                    <Text style={styles.retentionStatLabel}>Active</Text>
                  </View>
                  <View style={[styles.retentionStatItem, styles.retentionStatDivider]}>
                    <Text style={styles.retentionStatValue}>{retentionData.newSignups}</Text>
                    <Text style={styles.retentionStatLabel}>New (7d)</Text>
                  </View>
                  <View style={styles.retentionStatItem}>
                    <Text style={styles.retentionStatValue}>{retentionData.totalOrders}</Text>
                    <Text style={styles.retentionStatLabel}>Orders</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Liked Offers */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Liked Offers</Text>
            <Text style={styles.cardSubtitle}>Offers liked by customers</Text>
          </View>
          {renderLikedOffers()}
        </View>
      </View>

      {/* Liked Products */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Liked Products</Text>
            <Text style={styles.cardSubtitle}>Products liked by customers</Text>
          </View>
          {renderLikedProducts()}
        </View>
      </View>

      {/* Device Type */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Device Type</Text>
            <Text style={styles.cardSubtitle}>Realtime usage split</Text>
          </View>
          {loading ? <ActivityIndicator style={styles.loading} size="small" color="#157a4f" /> : error ? <Text style={styles.errorText}>{error}</Text> : renderDeviceChart()}
        </View>
      </View>

      {/* Demographics */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Age and Gender</Text>
            <View style={styles.legendRow}>
              {[{ c: "#4caf50", l: "Male" }, { c: "#f9a641", l: "Female" }, { c: "#6b7280", l: "Other" }].map((it) => (
                <View key={it.l} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: it.c }]} />
                  <Text style={styles.legendText}>{it.l}</Text>
                </View>
              ))}
            </View>
          </View>
          {loading ? <ActivityIndicator style={styles.loading} size="small" color="#157a4f" /> : error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.rowsContainer}>{renderDemographicRows()}</View>}
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.cardSubtitle}>Top redeemed regions</Text>
          </View>
          {loading ? <ActivityIndicator style={styles.loading} size="small" color="#157a4f" /> : error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.rowsContainer}>{renderRegionRows()}</View>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 50, paddingHorizontal: 16 },
  section: { marginTop: 16 },
  card: { backgroundColor: "#ffffff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  cardHeader: { marginBottom: 14 },
  cardTitle: { ...textPresets.body, marginBottom: 8, lineHeight: Math.round(14 * 1.5) },
  cardSubtitle: { color: "#6b7280", ...textPresets.label },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  legendColor: { width: 12, height: 12, borderRadius: 4 },
  legendText: { marginLeft: 6, color: "#374151", ...textPresets.label },
  rowsContainer: { gap: 12 },
  deviceChartCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, paddingVertical: 8 },
  deviceLegend: { flex: 1, minWidth: 140, gap: 12 },
  deviceLegendItem: { flexDirection: "row", alignItems: "center" },
  deviceLegendDot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  deviceLegendText: { color: "#374151", ...textPresets.label },
  dataRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  rowLabelContainer: { width: 90 },
  rowLabel: { color: "#111827", ...textPresets.label },
  rowContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  barRow: { flexDirection: "row", alignItems: "center", height: 16, borderRadius: 10, overflow: "hidden", backgroundColor: "#e5e7eb", flex: 1 },
  segment: { height: "100%" },
  rowValue: { minWidth: 40, color: "#374151", textAlign: "right", ...textPresets.label },
  loading: { paddingVertical: 20 },
  errorText: { color: "#b91c1c", ...textPresets.label },
  emptyText: { color: "#6b7280", ...textPresets.label },
  // Retention stats
  retentionStatsRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  retentionStatItem: { alignItems: "center", flex: 1 },
  retentionStatDivider: { borderLeftWidth: 1, borderColor: "#f3f4f6" },
  retentionStatValue: { color: "#111827", lineHeight: Math.round(14 * 1.5), ...textPresets.body },
  retentionStatLabel: { color: "#6b7280", marginTop: 2, ...textPresets.label },
  // Liked items — scrollable container with min height
  likedScrollContainer: { minHeight: 80, maxHeight: 260 },
  likedItemCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#f3f4f6" },
  likedItemImage: { width: 44, height: 44, borderRadius: 8, resizeMode: "cover", backgroundColor: "#e5e7eb" },
  likedItemImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  likedItemInfo: { flex: 1, marginLeft: 10 },
  likedItemName: { color: "#111827", ...textPresets.body },
  likedItemType: { color: "#6b7280", marginTop: 2, ...textPresets.label },
  likedItemCustomers: { color: "#9ca3af", marginTop: 1, ...textPresets.label },
  likedItemBadge: { backgroundColor: "#fef2f2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  likedItemBadgeText: { color: "#e74c3c", ...textPresets.label },
});