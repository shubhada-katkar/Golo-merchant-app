import { Suspense } from "react";
import Navbar from "../components/Navbar";
import CategoryBar from "../components/CategoryBar";
import Categories from "../components/Categories";
import RecentListings from "../components/RecentListings";
import RecommendedDeals from "../components/Recommended";
import Footer from "../components/Footer";

export default function ChojaPage() {
  return (
    <main className="bg-white min-h-screen">
      <Suspense fallback={<div className="h-16 bg-gray-50 animate-pulse" />}>
        <Navbar />
      </Suspense>

      <div className="w-full">
        <CategoryBar />
        <Suspense fallback={<div className="h-96 bg-gray-50 animate-pulse mx-8 rounded-3xl mt-10" />}>
          <RecentListings />
        </Suspense>
        <RecommendedDeals />
      </div>

      <Footer />
    </main>
  );
}