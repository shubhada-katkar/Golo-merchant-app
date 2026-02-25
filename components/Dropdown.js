import React, { useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Dropdown({ BASE_URL, token, onChange, value: parentValue = [] }) {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(parentValue); // sync with parent
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) loadProducts();
    }, [token]);

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

            const res = await fetch(`${BASE_URL}/api/products/published`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            const formatted = data.map(p => ({
                label: p.productname,
                value: p._id
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