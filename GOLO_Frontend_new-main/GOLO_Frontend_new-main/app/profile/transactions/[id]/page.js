"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProfileSidebar from '../../../components/ProfileSidebar';
import { getPaymentById } from '../../../lib/api';

const toDisplayStatus = (status) => {
  if (!status) return 'Created';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const statusClasses = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'captured' || normalized === 'authorized') {
    return 'bg-green-100 text-green-700';
  }
  if (normalized === 'failed') {
    return 'bg-red-100 text-red-700';
  }
  if (normalized.includes('refund')) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-blue-100 text-blue-700';
};

export default function TransactionDetailPage({ params }) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await getPaymentById(params?.id);
        setTransaction(response?.data || null);
      } catch (err) {
        setError(err?.data?.message || err.message || 'Failed to load transaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
        <Navbar />
        <div className="max-w-3xl mx-auto py-16 px-4 text-center text-gray-600">Loading transaction details...</div>
        <Footer />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
        <Navbar />
        <div className="max-w-3xl mx-auto py-16 px-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Transaction not found</h2>
            <p className="text-gray-600 mb-6">{error || 'This transaction id is invalid or no longer available.'}</p>
            <Link href="/profile/transactions" className="inline-flex items-center px-4 py-2 rounded-lg bg-[#157A4F] text-white font-semibold hover:bg-[#0f5c3a] transition">
              Back to Transactions
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const taxEstimate = Number((transaction.amount * 0.18).toFixed(2));
  const subtotal = Number(transaction.amount || 0);
  const total = Number((subtotal + taxEstimate).toFixed(2));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      <Navbar />
      <div className="flex max-w-6xl mx-auto pt-8 pb-16 px-4 lg:px-0">
        <ProfileSidebar />
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 ml-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#157A4F]">Transaction Details</h2>
            <Link href="/profile/transactions" className="text-sm font-semibold text-[#157A4F] hover:underline">
              ← Back to History
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Payment ID</p>
              <p className="font-semibold text-gray-900 break-all">{transaction.paymentId}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Razorpay Order ID</p>
              <p className="font-semibold text-gray-900 break-all">{transaction.razorpayOrderId || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Razorpay Payment ID</p>
              <p className="font-semibold text-gray-900 break-all">{transaction.razorpayPaymentId || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Paid On</p>
              <p className="font-semibold text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Payment Method</p>
              <p className="font-semibold text-gray-900">{transaction.method || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Payment Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${statusClasses(transaction.status)}`}>
                {toDisplayStatus(transaction.status)}
              </span>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden mb-8">
            <div className="bg-green-50 px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Payment Summary</h3>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Amount</span><span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Estimated GST (18%)</span><span className="font-medium text-gray-900">₹{taxEstimate.toFixed(2)}</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-base">
                <span className="font-semibold text-gray-900">Total (Estimated)</span>
                <span className="font-bold text-[#157A4F]">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
            <p className="font-semibold text-gray-900 mb-1">Additional Notes</p>
            <p className="text-gray-700">Provider: Razorpay • Currency: {transaction.currency || 'INR'}</p>
            {transaction.failureDescription && (
              <p className="text-red-700 mt-2">Failure Reason: {transaction.failureDescription}</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
