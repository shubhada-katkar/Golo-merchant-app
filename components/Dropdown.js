import React, { useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL as CONFIG_BASE_URL } from "../config";

export default function Dropdown({ BASE_URL, token, onChange, value: parentValue = [] }) {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(parentValue); // sync with parent
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvedToken, setResolvedToken] = useState(token || "");
    const resolvedBaseUrl = (BASE_URL || process.env.EXPO_PUBLIC_API_URL || CONFIG_BASE_URL || "").replace(/\/+$/, "");

    useEffect(() => {
        const resolveAuth = async () => {
            if (token) {
                setResolvedToken(token);
                return;
            }
            const storedToken = await AsyncStorage.getItem("merchantToken") || await AsyncStorage.getItem("accessToken");
            setResolvedToken(storedToken || "");
        };
        resolveAuth();
    }, [token]);

    useEffect(() => {
        if (resolvedToken && resolvedBaseUrl) loadProducts();
    }, [resolvedToken, resolvedBaseUrl]);

    // 🔥 sync AFTER items load
    useEffect(() => {
        if (items.length > 0) {
            setValue(parentValue);
        }
    }, [items, parentValue]);

    const handleChange = (val) => {
        setValue(val);
        onChange(val); // notify parent
    };

    const loadProducts = async () => {
        try {
            const cached = await AsyncStorage.getItem("cachedProducts");
            if (cached) setItems(JSON.parse(cached));

            let res = await fetch(`${resolvedBaseUrl}/merchant/products`, {
                headers: { Authorization: `Bearer ${resolvedToken}` }
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${resolvedBaseUrl}/products/merchant`, {
                    headers: { Authorization: `Bearer ${resolvedToken}` }
                });
            }

            const data = await res.json();

            const rawList = Array.isArray(data)
                ? data
                : data?.products || data?.data?.products || data?.data || [];
            const list = rawList.filter((item) => {
                const status = String(item?.publicationStatus || item?.status || "").toLowerCase();
                return !status || status === "published";
            });
            const formatted = list.map(p => ({
                label: p.productname || p.name || p.productName || "Product",
                value: p._id || p.id
            }));

            setItems(formatted);
            await AsyncStorage.setItem("cachedProducts", JSON.stringify(formatted));
        } catch (e) {
            console.log("Dropdown fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropDownPicker
            open={open}
            value={value}
            items={items}

            setOpen={setOpen}
            setValue={handleChange}
            setItems={setItems}

            searchable
            searchDelay={300}

            multiple
            mode="BADGE"

            showBadgeCloseIcon
            badgeColors={["#E5E7EB"]}
            badgeTextStyle={{ color: "#000" }}
            badgeStyle={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8
            }}

            listMode="FLATLIST"
            flatListProps={{ nestedScrollEnabled: true }}
            loading={loading}

            placeholder={items.length === 0
                ? "No published products found"
                : "Select products"}
            searchPlaceholder="Search Product"
            maxHeight={220}

            style={{
                paddingHorizontal: 20,
                borderColor: "#ccc",
            }}

            textStyle={{ fontSize: 16 }}

            searchContainerStyle={{
                borderBottomWidth: 0
            }}

            searchTextInputStyle={{ borderWidth: 0.5 }}

            zIndex={3000}
            zIndexInverse={1000}
        />
    );
}
