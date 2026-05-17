"use client";

import Image from "next/image";
import { Heart, Share2, MapPin, Phone, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../components/RoleBasedRedirect";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";

export default function PostAdPage() {
  const [selected, setSelected] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { isLoading, isAuthorized } = useRoleProtection("user");

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return null;
  }

  const templates = [
    {
      id: 1,
      type: "Product",
      time: "20m ago",
      images: [
        "/images/template1.webp",
        "/images/template1-2.jpg",
        "/images/template1-3.jpg",
      ],
      title: "Home tiffin service now available",
      description:
        "Pure veg meals, monthly plans open. Nutritious home-cooked food delivered at your doorstep.",
      location1: "Model Town, 0.8km",
      location2: "Ghar ka Tiffin",
      price: "₹5",
      bundle1: "₹40",
      bundle2: "₹110",
    },
    {
      id: 2,
      type: "Service",
      time: "15m ago",
      image: "/images/template2.webp",
      title: "New café opening this Sunday ☕",
      description:
        "Opening offer: Flat 20% off for first 3 days.",
      location1: "Model Town, 0.8km",
      location2: "Brew & Bites Café",
      price: "₹3",
      bundle1: "₹24",
      bundle2: "₹66",
    },
    {
      id: 3,
      type: "Text Ad",
      time: "5m ago",
      image: null,
      title: "Garba workshop this weekend",
      description:
        "Free entry for college students.",
      location1: "Model Town, 0.8km",
      location2: "City Hall Club",
      price: "₹2",
      bundle1: "₹16",
      bundle2: "₹44",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % templates[0].images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />

      <div className="bg-[#F8F6F2] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-16">

          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#157A4F]">
              Choose Your Template
            </h1>
            <p className="text-gray-600 mt-4 text-lg">
              Select from high-performing templates.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mt-16">
            {templates.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelected(item.id);
                  router.push(`/post-ad/form?template=${item.id}`);
                }}
                className={`group flex flex-col bg-white rounded-3xl shadow-md border transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-2xl ${
                  selected === item.id
                    ? "border-[#157A4F]"
                    : "border-gray-200"
                }`}
              >
                <div className="p-6 flex-1 flex flex-col">

                  <div className="flex justify-between">
                    <div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF3D6] text-[#157A4F]">
                        {item.type}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">{item.time}</p>
                    </div>

                    <div className="flex gap-3 text-gray-400 group-hover:text-[#157A4F] transition">
                      <Heart size={18} />
                      <Share2 size={18} />
                    </div>
                  </div>

                  {/* IMAGE SECTION */}
                  {item.id === 1 ? (
                    <div className="relative w-full h-52 mt-6 rounded-2xl overflow-hidden">
                      {item.images.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt="template"
                          fill
                          className={`object-cover transition-opacity duration-700 ${
                            currentSlide === index
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      ))}

                      {/* Indicator Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {item.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              currentSlide === index
                                ? "bg-[#157A4F] scale-110"
                                : "bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : item.image ? (
                    <div className="relative w-full h-52 mt-6 rounded-2xl overflow-hidden">
                      <Image
                        src={item.image}
                        alt="template"
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  ) : (
                    <div className="mt-6 p-6 rounded-2xl bg-[#FFF3D6] text-center">
                      <h3 className="text-xl font-semibold text-[#157A4F]">
                        TEXT ONLY AD
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Budget-friendly promotion
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    <h3 className="font-semibold text-gray-800 w-2/3">
                      {item.title}
                    </h3>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 text-lg">
                        {item.price}
                      </p>
                      <span className="text-xs text-gray-400">PER DAY</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {item.location1}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {item.location2}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/chats");
                      }}
                      className="flex-1 py-3 rounded-full bg-[#157A4F] hover:bg-[#0f5c3a] text-white transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>

                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-3 rounded-full border border-[#157A4F] text-[#157A4F] hover:bg-[#157A4F] hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <Phone size={16} />
                      Call
                    </button>
                  </div>

                  <div className="mt-6 bg-[#FFF3D6] rounded-2xl p-4">
                    <div className="flex justify-between text-xs text-[#157A4F] font-semibold">
                      <span>BUNDLE OFFERS</span>
                      <span className="bg-[#F5B849] px-2 py-1 rounded-full text-white">
                        Best Value
                      </span>
                    </div>

                    <div className="flex justify-between mt-4">
                      <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm w-[48%]">
                        <p className="text-xs text-gray-400">10 Days</p>
                        <p className="font-bold text-[#157A4F] mt-1">
                          {item.bundle1}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm w-[48%]">
                        <p className="text-xs text-gray-400">30 Days</p>
                        <p className="font-bold text-[#157A4F] mt-1">
                          {item.bundle2}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="bg-[#FFF3D6] px-6 py-4 rounded-b-3xl flex justify-between text-sm">
                  <span className="text-[#157A4F] font-semibold">
                    TEMPLATE #{item.id}
                  </span>
                  <span className="text-[#157A4F] font-semibold group-hover:translate-x-2 transition">
                    Select →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
