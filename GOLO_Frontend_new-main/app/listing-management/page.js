"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../lib/api";

export default function ListingManagementPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    apiClient("/ads/admin/all")
      .then((data) => {
        setListings(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading listings...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Listing Management</h1>
      {listings.length === 0 ? (
        <>
          <div>No listings found.</div>
          <pre className="bg-gray-100 text-xs p-2 mt-4 rounded border overflow-x-auto">{JSON.stringify(listings, null, 2)}</pre>
        </>
      ) : (
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border">Title</th>
              <th className="py-2 px-4 border">Category</th>
              <th className="py-2 px-4 border">User ID</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Created</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing._id || listing.adId} className="border-t">
                <td className="py-2 px-4 border">{listing._id || listing.adId}</td>
                <td className="py-2 px-4 border">{listing.title}</td>
                <td className="py-2 px-4 border">{listing.category}</td>
                <td className="py-2 px-4 border">{listing.userId}</td>
                <td className="py-2 px-4 border">{listing.status}</td>
                <td className="py-2 px-4 border">{listing.createdAt ? new Date(listing.createdAt).toLocaleString() : "-"}</td>
                <td className="py-2 px-4 border">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => router.push(`/product/${listing._id || listing.adId}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
