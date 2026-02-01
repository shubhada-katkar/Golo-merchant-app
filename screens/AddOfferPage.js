import React, { useContext, useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import Topbar from "../components/Topbar";
import Bottombar from "../components/Bottombar";
import { ThemeContext } from "../theme/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddOfferPage() {

    const { colors } = useContext(ThemeContext);

    // Dropdown states
    const [open, setOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    // ================= FETCH PRODUCTS =================

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {

            const token = await AsyncStorage.getItem("merchantToken");

            const response = await fetch(`${BASE_URL}/api/products/published`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const data = await response.json();

            if (Array.isArray(data)) {
                const formattedProducts = data.map(item => ({
                    label: item.productname,
                    value: item._id
                }));

                setProducts(formattedProducts);
            }

        } catch (error) {
            console.log("Product fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

            <Topbar />

            <View style={{ padding: 16 }}>

                {loading ? (

                    <ActivityIndicator size="small" color={colors.primary} />

                ) : (

                    <DropDownPicker
                        open={open}
                        value={selectedProducts}
                        items={products}

                        setOpen={setOpen}
                        setValue={setSelectedProducts}
                        setItems={setProducts}

                        multiple={true}
                        mode="BADGE"

                        placeholder={
                            products.length === 0
                                ? "No published products found"
                                : "Select products"
                        }

                        searchable={true}
                        searchPlaceholder="Search product"

                        listMode="FLATLIST"

                        flatListProps={{
                            nestedScrollEnabled: true
                        }}

                        style={{
                            borderColor: "#ccc"
                        }}

                        dropDownContainerStyle={{
                            borderColor: "#ccc",
                            maxHeight: 220   // scroll works now
                        }}

                        searchContainerStyle={{
                            borderBottomWidth: 0
                        }}

                        textStyle={{
                            fontSize: 16   
                        }}

                        closeOnPressOutside={true}   // 🔥 Tap outside closes dropdown
                        closeAfterSelecting={false}  // keep open for multi select

                        disabled={products.length === 0}

                        zIndex={3000}
                        zIndexInverse={1000}
                    />

                )}

            </View>

            <SafeAreaView
                edges={["bottom"]}
                style={{
                    width: "100%",
                    bottom: 0,
                    position: "absolute"
                }}>
                <Bottombar />
            </SafeAreaView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

})