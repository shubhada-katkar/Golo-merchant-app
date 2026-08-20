import React, { useState, useRef, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Animated } from "react-native";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { SafeAreaView } from "react-native-safe-area-context";
import Overview from "../components/Overview";
import Orders from "../components/Orders";
import Customers from "../components/Customers.js";
import { LinearGradient } from "expo-linear-gradient";
import { textPresets } from '../theme/typography';

const TABS = ["Overview", "Orders", "Customers"];
const TAB_LABELS = { Overview: "Overview", Orders: "Orders", Customers: "Analytics" };
const SWIPE_THRESHOLD = 50; // minimum horizontal distance (px) to count as a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3;
const UNDERLINE_WIDTH_RATIO = 0.85; // matches the old "width: 85%" of the tab

export default function HomePage() {
    const [activeTab, setactiveTab] = useState("Overview");

    // Keep a ref in sync with activeTab so the PanResponder (created once) always
    // sees the latest value without needing to be recreated on every render.
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // Layout (x position + width) of each tab label, filled in via onLayout.
    const tabLayouts = useRef({});
    const hasMeasuredAll = useRef(false);

    const underlineLeft = useRef(new Animated.Value(0)).current;
    const underlineWidth = useRef(new Animated.Value(0)).current;

    const animateUnderlineTo = (tabName, animated = true) => {
        const layout = tabLayouts.current[tabName];
        if (!layout) return;

        const targetWidth = layout.width * UNDERLINE_WIDTH_RATIO;
        const targetLeft = layout.x + (layout.width - targetWidth) / 2;

        if (!animated) {
            underlineLeft.setValue(targetLeft);
            underlineWidth.setValue(targetWidth);
            return;
        }

        Animated.parallel([
            Animated.timing(underlineLeft, {
                toValue: targetLeft,
                duration: 220,
                useNativeDriver: false,
            }),
            Animated.timing(underlineWidth, {
                toValue: targetWidth,
                duration: 220,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handleTabLayout = (tabName) => (event) => {
        const { x, width } = event.nativeEvent.layout;
        tabLayouts.current[tabName] = { x, width };

        // Once every tab has reported its layout, snap the underline under the
        // active tab without animating (avoids a weird slide-in on first mount).
        if (!hasMeasuredAll.current && TABS.every((t) => tabLayouts.current[t])) {
            hasMeasuredAll.current = true;
            animateUnderlineTo(activeTabRef.current, false);
        }
    };

    const selectTab = (tabName) => {
        setactiveTab(tabName);
        animateUnderlineTo(tabName, true);
    };

    const goToTab = (direction) => {
        const currentIndex = TABS.indexOf(activeTabRef.current);
        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < TABS.length) {
            selectTab(TABS[nextIndex]);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only claim the gesture for clearly horizontal swipes so vertical
                // scrolling inside the tab content keeps working normally.
                return (
                    Math.abs(gestureState.dx) > 20 &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
                );
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dx, vx } = gestureState;
                if (dx <= -SWIPE_THRESHOLD || vx <= -SWIPE_VELOCITY_THRESHOLD) {
                    // Swiped left -> go to next tab
                    goToTab(1);
                } else if (dx >= SWIPE_THRESHOLD || vx >= SWIPE_VELOCITY_THRESHOLD) {
                    // Swiped right -> go to previous tab
                    goToTab(-1);
                }
            },
        })
    ).current;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
                colors={["#f8a812", "#fad081", "#fffbf4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ height: 220, position: "absolute", top: 0, left: 0, right: 0, zIndex: 0 }}
            />
            <View style={{ zIndex: 1 }}>
                <Topbar />

                <View style={styles.first}>
                    {TABS.map((tabName) => (
                        <TouchableOpacity
                            key={tabName}
                            onPress={() => selectTab(tabName)}
                            onLayout={handleTabLayout(tabName)}
                        >
                            <Text style={styles.text1}>{TAB_LABELS[tabName]}</Text>
                        </TouchableOpacity>
                    ))}

                    <Animated.View
                        style={[
                            styles.ActiveTab,
                            {
                                left: underlineLeft,
                                width: underlineWidth,
                            },
                        ]}
                    />
                </View>

                <View style={{ flexDirection: "row", backgroundColor: "#000", height: 1 }} />
            </View>

            <View style={{ flex: 1 }} {...panResponder.panHandlers}>
                {activeTab == "Overview" && <Overview />}
                {activeTab == "Orders" && <Orders />}
                {activeTab == "Customers" && <Customers />}
            </View>

            <Bottombar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    first: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 18,
        justifyContent: "space-between",
        position: "relative",
    },
    text1: {
        ...textPresets.subtitle,
    },
    ActiveTab: {
        position: "absolute",
        bottom: 0,
        height: 3,
        backgroundColor: "#157A4F",
        borderRadius: 10,
    },
})