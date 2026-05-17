"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useVoucher } from "../../context/VoucherContext";
import { Html5Qrcode } from "html5-qrcode";
import { Check, AlertCircle, Zap } from "lucide-react";
import { verifyVoucherByCode, getMerchantRedemptionHistory } from "../../lib/api";
import MerchantNavbar from "../MerchantNavbar";

export default function MerchantQRScannerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { verifyVoucherHandler, redeemVoucherHandler, generateVerificationCodeHandler, loading: voucherLoading } = useVoucher();
  
  const qrScannerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const [scanResult, setScanResult] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'valid', 'invalid', 'redeemed'
  const [scanError, setScanError] = useState("");
  const [manualQRCode, setManualQRCode] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("inactive"); // 'inactive', 'initializing', 'active', 'error', 'permission-denied'
  const [todaysRedemptions, setTodaysRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);

  const stopScanner = async () => {
    const scannerInstance = qrScannerRef.current;
    if (!scannerInstance) {
      return;
    }

    try {
      await scannerInstance.stop();
    } catch {
      // Ignore stop errors from partially initialized states.
    }

    try {
      await scannerInstance.clear();
    } catch {
      // Ignore clear errors from already-cleared DOM.
    }

    qrScannerRef.current = null;
  };

  // Check merchant access
  useEffect(() => {
    if (!authLoading && (!user || user.accountType !== "merchant")) {
      router.push("/login?redirect=/merchant/redeem");
    }
  }, [user, authLoading, router]);

  // Check camera permission status on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (!navigator.permissions || !navigator.permissions.query) {
          console.log("Permissions API not supported");
          return;
        }
        
        const permission = await navigator.permissions.query({ name: "camera" });
        console.log("Camera permission status:", permission.state);
      } catch (err) {
        console.log("Could not check camera permission:", err);
      }
    };

    checkCameraPermission();
  }, []);

  // Generate verification code on-demand when voucher is scanned
  useEffect(() => {
    const generateCode = async () => {
      if (scanResult?.voucherId && !scanResult?.verificationCode && verificationStatus === "valid") {
        try {
          console.log("Generating verification code for voucher:", scanResult.voucherId);
          const response = await generateVerificationCodeHandler(scanResult._id || scanResult.voucherId);
          
          // Update scanResult with the generated verification code
          if (response?.data?.verificationCode) {
            setScanResult(prev => ({
              ...prev,
              verificationCode: response.data.verificationCode
            }));
          }
        } catch (err) {
          if (err?.status === 404 && err?.data?.message === "Voucher not found") {
            return;
          }

          console.error("Failed to generate verification code:", err);
        }
      }
    };

    generateCode();
  }, [scanResult, verificationStatus, generateVerificationCodeHandler]);

  // Cleanup scanner on unmount or when switching to manual entry
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Fetch today's redemptions
  const fetchTodaysRedemptions = useCallback(async () => {
    setLoadingRedemptions(true);
    try {
      const response = await getMerchantRedemptionHistory({ page: 1, limit: 100 });
      const allRedemptions = response.data || [];

      // Filter for today's redemptions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todays = allRedemptions.filter(v => {
        if (!v.redeemedAt) return false;
        const redeemedDate = new Date(v.redeemedAt);
        return redeemedDate >= today;
      });

      setTodaysRedemptions(todays);
    } catch (err) {
      console.error("Failed to fetch today's redemptions:", err);
    } finally {
      setLoadingRedemptions(false);
    }
  }, []);

  // Load today's redemptions on mount
  useEffect(() => {
    if (user && user.accountType === "merchant") {
      fetchTodaysRedemptions();
    }
  }, [user, fetchTodaysRedemptions]);

  // Initialize scanner when qr-reader div is in DOM and not inactive
  useEffect(() => {
    if (cameraStatus === "inactive" || cameraStatus === "permission-denied") {
      return; // Don't initialize in these states
    }

    const initializeScanner = async () => {
      if (isInitializingRef.current || qrScannerRef.current) {
        return;
      }

      isInitializingRef.current = true;
      try {
        const qrElement = document.getElementById("qr-reader");
        if (!qrElement) {
          console.log("QR element not found, retrying...");
          isInitializingRef.current = false;
          setTimeout(initializeScanner, 100);
          return;
        }

        console.log("Found QR element, initializing Html5Qrcode...");

        // Clear the element
        qrElement.innerHTML = "";

        const html5QrCode = new Html5Qrcode("qr-reader");
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (qrCodeMessage) => {
          console.log("✓ QR Code detected:", qrCodeMessage);
          processScan(qrCodeMessage);
          // Stop scanning immediately after a successful read to prevent repeated scans.
          stopScanner();
          setCameraStatus("inactive");
          },
          () => {
            // Ignore scan-frame errors; these are noisy and expected.
          },
        );

        setCameraStatus("active");
        console.log("✓ QR scanner is ready and scanning!");

      } catch (err) {
        console.error("Scanner initialization error:", err);
        const message = err?.message || "Failed to initialize scanner. Please try again.";
        if (
          message.toLowerCase().includes("permission") ||
          message.toLowerCase().includes("notallowed")
        ) {
          setCameraStatus("permission-denied");
        } else {
          setCameraStatus("error");
        }
        setScanError(message);
        qrScannerRef.current = null;
      } finally {
        isInitializingRef.current = false;
      }
    };

    if (cameraStatus === "initializing") {
      const timeout = setTimeout(initializeScanner, 300);
      return () => clearTimeout(timeout);
    }
  }, [cameraStatus]);

  const processScan = async (input) => {
    setScanError("");
    setVerificationStatus(null);

    try {
      let verifyResponse;

      // Check if it's a manual verification code (XXXX-XXXX-XXXX format)
      if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(input)) {
        console.log("Processing as manual verification code:", input);
        
        // Verify using verification code
        verifyResponse = await verifyVoucherByCode(input);
        
        if (verifyResponse?.valid) {
          setScanResult({
            voucherId: verifyResponse.data?.voucherId,
            verificationCode: verifyResponse.data?.verificationCode,
            customerName: verifyResponse.data?.userName,
            offerTitle: verifyResponse.data?.offerTitle,
            discount: verifyResponse.data?.discount,
          });
          setVerificationStatus("valid");
        } else {
          setVerificationStatus("invalid");
          setScanError(verifyResponse?.message || "Invalid or expired voucher");
        }
      } 
      // Otherwise treat as QR code scan
      else if (input.startsWith("voucher-")) {
        console.log("Processing as QR code scan:", input);
        
        // QR code format from backend: "voucher-{voucherId}-{offerId}"
        // Example: "voucher-VOUCHER-1713427200000-OFFER-123456"
        
        // Extract voucherId from the QR code
        const parts = input.split("-");
        if (parts.length < 3) {
          setVerificationStatus("invalid");
          setScanError("Invalid QR code format");
          return;
        }

        // voucherId is parts[1] + "-" + parts[2] (e.g., "VOUCHER-1713427200000")
        const voucherId = parts[1] + "-" + parts[2];

        // Verify using the full QR code string
        verifyResponse = await verifyVoucherHandler(voucherId, input);
        
        if (verifyResponse?.valid) {
          setScanResult({
            voucherId,
            qrCode: input, // Store the full QR code for redemption
            customerName: verifyResponse.data?.userName,
            offerTitle: verifyResponse.data?.offerTitle,
            discount: verifyResponse.data?.discount,
          });
          setVerificationStatus("valid");
        } else {
          setVerificationStatus("invalid");
          setScanError(verifyResponse?.message || "Invalid or expired voucher");
        }
      } 
      else {
        setVerificationStatus("invalid");
        setScanError("Invalid code format. Use QR code or verification code (XXXX-XXXX-XXXX)");
      }
    } catch (err) {
      setVerificationStatus("invalid");
      const message = err?.data?.message || "Failed to verify voucher";
      setScanError(message);
      if (err?.status !== 403) {
        console.error("Scan processing error:", err);
      }
    }
  };

  // Request camera permission and set status for useEffect to initialize
  const requestCameraPermission = async () => {
    try {
      console.log("Starting camera initialization...");
      setScanError("");
      // Directly set to initializing - let html5-qrcode handle permissions
      setCameraStatus("initializing");
      
    } catch (err) {
      console.error("Camera error:", err);
      setCameraStatus("error");
      setScanError(err.message || "Failed to access camera");
    }
  };

  const handleRedeemVoucher = async () => {
    if (!scanResult) return;

    try {
      // Use either QR code or verification code
      const verificationData = {
        ...(scanResult.qrCode && { qrCode: scanResult.qrCode }),
        ...(scanResult.verificationCode && { verificationCode: scanResult.verificationCode }),
      };

      await redeemVoucherHandler(scanResult.voucherId, verificationData);
      setVerificationStatus("redeemed");

      // Refresh today's redemptions
      await fetchTodaysRedemptions();

      // Clear after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setVerificationStatus(null);
        setCameraStatus("inactive");
      }, 3000);
    } catch (err) {
      setScanError(err.data?.message || "Failed to redeem voucher");
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#ececec]" />;
  }

  return (
    <div className="min-h-screen bg-[#ececec]">
      <MerchantNavbar activeKey="redeem" />

      <main className="w-full max-w-[1200px] mx-auto px-6 py-8">
        <section className="rounded-[12px] border border-[#d5d5d5] bg-white p-8 shadow-sm">
          <h1 className="text-[42px] font-semibold leading-none text-[#1e1e1e]">Scan Voucher QR Code</h1>
          <p className="mt-3 text-[13px] text-[#6f6f6f]">
            Use your device camera to scan customer voucher QR codes and redeem them.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* QR SCANNER */}
            <div className="rounded-[12px] border-2 border-dashed border-[#e0e0e0] p-6 bg-[#fafafa]">
              <p className="text-[14px] font-bold text-[#1e1e1e] mb-4">Camera Scanner</p>
              
              {!isManualEntry ? (
                <div className="space-y-4">
                  {cameraStatus === "inactive" && (
                    <button
                      onClick={requestCameraPermission}
                      className="w-full py-8 rounded-[8px] bg-black border-2 border-dashed border-[#555] text-white text-[14px] font-semibold hover:bg-gray-900 flex flex-col items-center justify-center"
                      style={{ aspectRatio: "1" }}
                    >
                      📷 Enable Camera
                    </button>
                  )}

                  {cameraStatus !== "inactive" && (
                    <>
                      <div 
                        id="qr-reader"
                        className="relative overflow-hidden rounded-[8px] mx-auto"
                        style={{ 
                          width: "100%",
                          maxWidth: "400px",
                          height: "400px",
                          backgroundColor: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      />
                      
                      {(cameraStatus === "initializing" || cameraStatus === "error" || cameraStatus === "permission-denied") && (
                        <div className="text-center p-4 bg-yellow-50 rounded-[8px] border border-yellow-200">
                          {cameraStatus === "initializing" && (
                            <>
                              <Zap size={24} className="mx-auto text-yellow-600 animate-spin mb-2" />
                              <p className="text-yellow-800 text-[12px] mb-2">Initializing camera...</p>
                              <p className="text-yellow-700 text-[10px]">Allow camera access in the permission dialog</p>
                            </>
                          )}
                          {cameraStatus === "error" && (
                            <>
                              <AlertCircle size={24} className="mx-auto text-red-600 mb-2" />
                              <p className="text-red-700 text-[12px] mb-3">{scanError}</p>
                              <button
                                onClick={() => setCameraStatus("inactive")}
                                className="px-4 py-2 bg-red-600 text-white text-[11px] font-semibold rounded-[6px] hover:bg-red-700"
                              >
                                Back to Scanner
                              </button>
                            </>
                          )}
                          {cameraStatus === "permission-denied" && (
                            <>
                              <AlertCircle size={24} className="mx-auto text-yellow-600 mb-2" />
                              <p className="text-yellow-800 text-[12px] mb-3">{scanError}</p>
                              <button
                                onClick={() => {
                                  setCameraStatus("inactive");
                                  setScanError("");
                                }}
                                className="px-4 py-2 bg-yellow-600 text-white text-[11px] font-semibold rounded-[6px] hover:bg-yellow-700"
                              >
                                Try Again
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={async () => {
                      // Cleanup scanner before switching to manual entry
                      await stopScanner();
                      setCameraStatus("inactive");
                      setIsManualEntry(true);
                    }}
                    className="w-full py-2 rounded-[8px] border border-[#d5d5d5] bg-white text-[12px] font-semibold text-[#157a4f] hover:bg-[#f8f8f8]"
                  >
                    Or Enter Code Manually
                  </button>
                </div>
              ) : (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={manualQRCode}
                    onChange={(e) => setManualQRCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        processScan(manualQRCode);
                      }
                    }}
                    placeholder="Paste QR code or voucher ID..."
                    className="w-full px-4 py-3 rounded-[8px] border border-[#d5d5d5] text-[12px] focus:border-[#157a4f] focus:outline-none"
                  />
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => processScan(manualQRCode)}
                      className="flex-1 py-2 rounded-[8px] bg-[#157a4f] text-[12px] font-semibold text-white hover:bg-[#126a3f]"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => {
                        setIsManualEntry(false);
                        setManualQRCode("");
                        // Reset camera status so user can enable it again
                        setCameraStatus("inactive");
                      }}
                      className="flex-1 py-2 rounded-[8px] border border-[#d5d5d5] bg-white text-[12px] font-semibold text-[#666] hover:bg-[#f8f8f8]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* VERIFICATION RESULT */}
            <div>
              <p className="text-[14px] font-bold text-[#1e1e1e] mb-4">Verification Status</p>

              {!verificationStatus && (
                <div className="rounded-[12px] border border-[#d5d5d5] bg-[#f9f9f9] p-6 text-center">
                  <Zap size={48} className="mx-auto text-[#ccc]" />
                  <p className="mt-4 text-[13px] text-[#666]">Scan a QR code to verify the voucher</p>
                </div>
              )}

              {verificationStatus === "valid" && scanResult && (
                <div className="rounded-[12px] border border-green-200 bg-green-50 p-6 space-y-4">
                  <div className="flex gap-3">
                    <Check className="text-green-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-[14px] font-bold text-green-900">Voucher Valid</p>
                      <p className="text-[12px] text-green-800 mt-1">This voucher can be redeemed</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[12px] bg-white rounded-[8px] p-4">
                    <div className="flex justify-between">
                      <span className="text-[#666]">Customer:</span>
                      <span className="font-semibold">{scanResult.customerName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-[#666]">Offer:</span>
                      <span className="font-semibold text-right max-w-[200px]">{scanResult.offerTitle}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-[#666]">Discount:</span>
                      <span className="font-semibold">{scanResult.discount || "N/A"}</span>
                    </div>
                  </div>

                  {scanResult.verificationCode && (
                    <div className="rounded-[8px] border-2 border-[#157a4f] bg-[#f0fdf4] p-4">
                      <p className="text-[11px] text-[#666] font-semibold mb-2 uppercase tracking-widest">Verification Code</p>
                      <p className="text-[20px] font-bold text-[#157a4f] tracking-[0.15em] text-center" style={{fontFamily: 'monospace'}}>
                        {scanResult.verificationCode}
                      </p>
                      <p className="text-[10px] text-[#999] mt-2 text-center">Ask customer to provide this code</p>
                    </div>
                  )}

                  <button
                    onClick={handleRedeemVoucher}
                    disabled={voucherLoading}
                    className="w-full py-3 rounded-[8px] bg-[#157a4f] text-[12px] font-semibold text-white hover:bg-[#126a3f] disabled:opacity-60"
                  >
                    {voucherLoading ? "Redeeming..." : "✓ Redeem Voucher"}
                  </button>
                </div>
              )}

              {verificationStatus === "redeemed" && (
                <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-6 text-center">
                  <Check className="mx-auto text-blue-600" size={48} />
                  <p className="mt-4 text-[14px] font-bold text-blue-900">Successfully Redeemed!</p>
                  <p className="text-[12px] text-blue-800 mt-2">Voucher has been marked as redeemed</p>
                </div>
              )}

              {verificationStatus === "invalid" && (
                <div className="rounded-[12px] border border-red-200 bg-red-50 p-6">
                  <div className="flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-[14px] font-bold text-red-900">Voucher Invalid</p>
                      <p className="text-[12px] text-red-800 mt-2">{scanError || "This voucher cannot be redeemed"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* REDEMPTION HISTORY */}
        <section className="mt-8 rounded-[12px] border border-[#d5d5d5] bg-white p-8 shadow-sm">
          <h2 className="text-[24px] font-semibold text-[#1e1e1e]">Today's Redemptions</h2>
          <p className="mt-2 text-[12px] text-[#6f6f6f]">QR codes scanned and redeemed today</p>

          {loadingRedemptions ? (
            <div className="mt-6 text-center py-8 text-[#999] text-[12px]">Loading redemptions...</div>
          ) : todaysRedemptions.length === 0 ? (
            <div className="mt-6 text-center py-8 text-[#999] text-[12px]">No redemptions today</div>
          ) : (
            <div className="mt-6 rounded-[8px] border border-[#d5d5d5] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f9f9f9] border-b border-[#d5d5d5]">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">Customer</th>
                    <th className="text-left px-4 py-3 font-bold">Offer</th>
                    <th className="text-left px-4 py-3 font-bold">Discount</th>
                    <th className="text-left px-4 py-3 font-bold">Time</th>
                    <th className="text-left px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysRedemptions.map((voucher, index) => (
                    <tr key={voucher._id || index} className="border-t border-[#d5d5d5]">
                      <td className="px-4 py-3">{voucher.userName || "N/A"}</td>
                      <td className="px-4 py-3">{voucher.offerTitle || "N/A"}</td>
                      <td className="px-4 py-3">{voucher.discount || "N/A"}</td>
                      <td className="px-4 py-3">
                        {voucher.redeemedAt
                          ? new Date(voucher.redeemedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#d3f3dd] text-[#15803d] px-2 py-0.5 rounded text-[10px] font-semibold">
                          Redeemed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
