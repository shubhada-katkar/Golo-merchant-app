"use client";

import { createContext, useContext, useState, useCallback } from "react";
import {
    claimOffer,
    getMyVouchers,
    getVoucherById,
    redeemVoucher,
    verifyVoucher,
    generateVerificationCode,
    downloadVoucherQR,
    shareVoucher,
    getMerchantPendingRedemptions,
    getMerchantRedemptionHistory,
    getMerchantOffers,
} from "../lib/api";

const VoucherContext = createContext(null);

export function VoucherProvider({ children }) {
    const [myVouchers, setMyVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CLAIM OFFER
    const claimOfferHandler = useCallback(async (offerId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await claimOffer(offerId);
            const newVoucher = response.data; // Voucher is directly in data
            
            if (newVoucher && newVoucher._id) {
                // Add to my vouchers
                setMyVouchers(prev => [newVoucher, ...prev]);
                setSelectedVoucher(newVoucher);
            }
            
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to claim offer");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GET MY VOUCHERS
    const fetchMyVouchers = useCallback(async ({ page = 1, limit = 10, status } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMyVouchers({ page, limit, status });
            // Backend returns { success: true, data: [...] } - data is the array directly
            const vouchers = Array.isArray(response.data) ? response.data : (response.data?.vouchers || []);
            setMyVouchers(vouchers);
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to fetch vouchers");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GET SINGLE VOUCHER
    const fetchVoucherDetails = useCallback(async (voucherId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getVoucherById(voucherId);
            const voucher = response.data; // Voucher is directly in data
            if (voucher && voucher._id) {
                setSelectedVoucher(voucher);
            } else {
                throw new Error('Invalid voucher response structure');
            }
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to fetch voucher details");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // DOWNLOAD QR
    const downloadQR = useCallback(async (voucherId) => {
        setError(null);
        try {
            const response = await downloadVoucherQR(voucherId);
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to download QR");
            throw err;
        }
    }, []);

    // SHARE VOUCHER
    const shareVoucherHandler = useCallback(async (voucherId, friendEmail) => {
        setError(null);
        try {
            const response = await shareVoucher(voucherId, friendEmail);
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to share voucher");
            throw err;
        }
    }, []);

    // VERIFY VOUCHER (Merchant)
    const verifyVoucherHandler = useCallback(async (voucherId, qrCode) => {
        setError(null);
        try {
            const response = await verifyVoucher(voucherId, qrCode);
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to verify voucher");
            throw err;
        }
    }, []);

    // REDEEM VOUCHER (Merchant)
    const redeemVoucherHandler = useCallback(async (voucherId, verificationData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await redeemVoucher(voucherId, verificationData);
            
            // Update voucher status in list
            setMyVouchers(prev =>
                prev.map(v => v._id === voucherId ? {...v, status: 'redeemed'} : v)
            );
            
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to redeem voucher");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GENERATE VERIFICATION CODE ON-DEMAND
    const generateVerificationCodeHandler = useCallback(async (voucherId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await generateVerificationCode(voucherId);
            
            // Update voucher with generated verification code
            setMyVouchers(prev =>
                prev.map(v => v._id === voucherId ? {...v, verificationCode: response.data.verificationCode} : v)
            );
            
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to generate verification code");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GET MERCHANT PENDING REDEMPTIONS
    const fetchPendingRedemptions = useCallback(async ({ page = 1, limit = 20, status } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMerchantPendingRedemptions({ page, limit, status });
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to fetch pending redemptions");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GET MERCHANT REDEMPTION HISTORY
    const fetchRedemptionHistory = useCallback(async ({ page = 1, limit = 20 } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMerchantRedemptionHistory({ page, limit });
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to fetch redemption history");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // GET MERCHANT OFFERS
    const fetchMerchantOffers = useCallback(async ({ page = 1, limit = 20, status } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMerchantOffers({ page, limit, status });
            return response;
        } catch (err) {
            setError(err.data?.message || "Failed to fetch offers");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        // State
        myVouchers,
        selectedVoucher,
        loading,
        error,
        setSelectedVoucher,

        // User Actions
        claimOfferHandler,
        fetchMyVouchers,
        fetchVoucherDetails,
        downloadQR,
        shareVoucherHandler,

        // Merchant Actions
        verifyVoucherHandler,
        redeemVoucherHandler,
        generateVerificationCodeHandler,
        fetchPendingRedemptions,
        fetchRedemptionHistory,
        fetchMerchantOffers,
    };

    return (
        <VoucherContext.Provider value={value}>
            {children}
        </VoucherContext.Provider>
    );
}

export function useVoucher() {
    const context = useContext(VoucherContext);
    if (!context) {
        throw new Error("useVoucher must be used within a VoucherProvider");
    }
    return context;
}
