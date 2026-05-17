"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getProfile, updateMerchantStoreLocation } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password, accountType = "user") => {
        const response = await loginUser(email, password, accountType);

        const { accessToken, refreshToken, user: userData } = response.data;

        // Ensure accountType is preserved from response or fallback to login parameter
        const userDataWithType = {
            ...userData,
            accountType: userData?.accountType || accountType || 'user'
        };

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(userDataWithType));

        if (typeof window !== "undefined" && userDataWithType?.accountType === "merchant") {
            try {
                // Ask server to sync any pending merchant location saved during registration
                await fetch('/api/users/pending-location/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
                });
            } catch (syncError) {
                console.warn("Pending merchant location sync failed:", syncError);
            }
        }

        setUser(userDataWithType);
        return response;
    }, []);

    const register = useCallback(async ({
        name,
        email,
        password,
        phone,
        accountType = "user",
        storeName,
        storeEmail,
        gstNumber,
        storeCategory,
        storeSubCategory,
        contactNumber,
        storeLocation,
        storeLocationLatitude,
        storeLocationLongitude,
    }) => {
        const response = await registerUser({
            name,
            email,
            password,
            phone,
            accountType,
            storeName,
            storeEmail,
            gstNumber,
            storeCategory,
            storeSubCategory,
            contactNumber,
            storeLocation,
            storeLocationLatitude,
            storeLocationLongitude,
        });
        return response;
    }, []);

    const logout = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                await logoutUser(refreshToken);
            }
        } catch {
            // Logout from server failed, but still clear local state
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
    }, []);

    const refreshProfile = useCallback(async () => {
        try {
            const response = await getProfile();
            const userData = response.data;
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch {
            return null;
        }
    }, []);

    const getUserAccountType = useCallback(() => {
        return user?.accountType || 'user';
    }, [user]);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
        getUserAccountType,  // Safe way to get account type
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
