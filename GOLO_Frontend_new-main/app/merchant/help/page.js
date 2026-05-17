"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle, BookOpen, MailIcon, Phone, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRoleProtection, LoadingScreen } from "../../components/RoleBasedRedirect";
import { useState, useEffect } from "react";

const topTabs = ["Profile Settings", "Loyalty Rewards", "Help", "Settings", "Logout"];

const faqs = [
  {
    category: "Account & Profile",
    items: [
      {
        question: "How do I update my store profile?",
        answer: "Go to Settings > Store Info to update your store name, description, location, and contact details. Changes are saved immediately.",
      },
      {
        question: "How can I change my password?",
        answer: "Visit Settings > Security > Change Password. You'll need to enter your current password and then set a new one.",
      },
      {
        question: "How do I verify my business?",
        answer: "Upload your GST certificate and business documents in Settings > Verification. Our team will review within 24-48 hours.",
      },
    ],
  },
  {
    category: "Products & Inventory",
    items: [
      {
        question: "How do I add products?",
        answer: "Go to Products > Add New Product. Fill in product details, upload images, set prices, and manage inventory.",
      },
      {
        question: "Can I bulk upload products?",
        answer: "Yes! Visit Products > Bulk Upload to download the CSV template, fill it out, and upload multiple products at once.",
      },
      {
        question: "How do I manage inventory?",
        answer: "Products section shows real-time inventory. Set low stock alerts and automatic reorder reminders in Settings.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    items: [
      {
        question: "How do I process orders?",
        answer: "Orders appear in the Orders dashboard. Confirm, pack, and generate shipping labels. Track shipments in real-time.",
      },
      {
        question: "What shipping partners are available?",
        answer: "We integrate with major couriers. Choose your preferred partner in Settings > Shipping & Logistics.",
      },
      {
        question: "How do I handle returns?",
        answer: "Enable return policy in Settings > Return Policy. Customers can request returns, and you can approve/reject them.",
      },
    ],
  },
  {
    category: "Analytics & Reports",
    items: [
      {
        question: "How do I view my sales performance?",
        answer: "Analytics dashboard shows sales trends, top products, customer insights, and performance metrics. You can export reports in PDF/CSV formats.",
      },
      {
        question: "How do I track order fulfillment?",
        answer: "Orders dashboard displays all orders with their status. Track from confirmation through delivery and monitor returns/refunds.",
      },
      {
        question: "Can I see customer feedback and reviews?",
        answer: "Reviews & Ratings section shows all customer feedback on your products and service. Use this to improve your offerings.",
      },
    ],
  },
];

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Available 24/7 for quick support",
    action: "Start Chat",
  },
  {
    icon: MailIcon,
    title: "Email Support",
    description: "support@golo.local - Response within 2 hours",
    action: "Send Email",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "+91 1800-GOLO-123 - Mon to Sat, 9AM-6PM",
    action: "Call Now",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Comprehensive guides and documentation",
    action: "Browse Docs",
  },
];

export default function MerchantHelpPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isLoading, isAuthorized } = useRoleProtection("merchant");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleMerchantLogout = async () => {
    await logout();
    router.push("/login");
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleMerchantLogout();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return null;
  }

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="min-h-screen bg-[#ececec] text-[#1b1b1b]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-[9999] h-16 bg-[#efb02e] border-b border-[#d7a02a] px-8 lg:px-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-[180px]">
          <button
            type="button"
            onClick={() => router.push("/merchant/dashboard")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow font-bold"
              style={{ color: "#157a4f" }}
            >
              G
            </div>
            <span className="text-xl font-semibold tracking-wide text-[#157a4f]">GOLO</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-8 text-[12px] font-semibold text-[#5a4514]">
          <nav className="flex items-center gap-8">
            <button onClick={() => router.push("/merchant/dashboard")}>Overview</button>
            <button onClick={() => router.push("/merchant/orders")}>Orders</button>
            <button onClick={() => router.push("/merchant/products")}>Products</button>
            <button onClick={() => router.push("/merchant/offers")}>Offers</button>
            <button onClick={() => router.push("/merchant/banners")}>Banners</button>
            <button onClick={() => router.push("/merchant/analytics")}>Analytics</button>
          </nav>

          <button
            type="button"
            onClick={() => router.push("/merchant/profile")}
            className="w-10 h-10 rounded-full bg-white shadow-md hover:scale-105 transition flex items-center justify-center"
          >
            <User size={18} style={{ color: "#157a4f" }} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="w-full px-8 lg:px-10 bg-white border-b border-[#e5e5e5]">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="flex items-center justify-end gap-8 text-[12px] font-semibold py-6 flex-wrap">
            {topTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === "Profile Settings") {
                    router.push("/merchant/profile");
                  } else if (tab === "Loyalty Rewards") {
                    router.push("/merchant/profile?tab=loyalty");
                  } else if (tab === "Settings") {
                    router.push("/merchant/profile?tab=settings");
                  } else if (tab === "Logout") {
                    setShowLogoutConfirm(true);
                  }
                }}
                className={`relative pb-1 transition ${
                  tab === "Help"
                    ? "text-[#157a4f]"
                    : tab === "Logout"
                      ? "text-[#ef4444]"
                      : "text-[#111]"
                }`}
              >
                <span>{tab}</span>
                {tab === "Help" && <span className="absolute left-0 right-0 -bottom-[5px] h-[2px] bg-[#157a4f]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-8 lg:px-10 py-6">
        <div className="mx-auto w-full max-w-[1400px] space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-[32px] font-bold text-[#1f1f1f] mb-2">Help & Support</h1>
            <p className="text-[14px] text-[#666]">Get answers to your questions and find solutions quickly</p>
          </div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportChannels.map((channel, idx) => {
              const IconComponent = channel.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[12px] border border-[#d5d5d5] p-6 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent size={24} style={{ color: "#157a4f" }} />
                  </div>
                  <h3 className="font-semibold text-[14px] text-[#1f1f1f] mb-1">{channel.title}</h3>
                  <p className="text-[12px] text-[#666] mb-4">{channel.description}</p>
                  <button className="text-[12px] font-semibold text-[#157a4f] hover:underline flex items-center gap-1">
                    {channel.action}
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="mt-8">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-3 text-[#999]" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-[8px] border border-[#d5d5d5] bg-white text-[13px] focus:outline-none focus:border-[#157a4f]"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="text-[20px] font-bold text-[#1f1f1f]">Frequently Asked Questions</h2>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, catIdx) => (
                <div key={catIdx} className="space-y-3">
                  <h3 className="text-[14px] font-semibold text-[#157a4f] uppercase">{category.category}</h3>
                  {category.items.map((faq, faqIdx) => {
                    const isExpanded = expandedFaq === `${catIdx}-${faqIdx}`;
                    return (
                      <div
                        key={faqIdx}
                        className="bg-white rounded-[8px] border border-[#d5d5d5] overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedFaq(isExpanded ? null : `${catIdx}-${faqIdx}`)
                          }
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f9f9f9] transition"
                        >
                          <span className="text-[13px] font-semibold text-[#1f1f1f] text-left">
                            {faq.question}
                          </span>
                          <ChevronRight
                            size={18}
                            className={`text-[#157a4f] transition ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-5 py-4 bg-[#f9f9f9] border-t border-[#d5d5d5]">
                            <p className="text-[13px] text-[#666] leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[8px] border border-[#d5d5d5] p-8 text-center">
                <p className="text-[14px] text-[#999]">No FAQs found matching your search. Try different keywords.</p>
              </div>
            )}
          </div>

          {/* Additional Resources */}
          <div className="bg-white rounded-[12px] border border-[#d5d5d5] p-6 mt-8">
            <h3 className="text-[16px] font-semibold text-[#1f1f1f] mb-4">Didn't find what you need?</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-[#157a4f] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#1a6e44] transition">
                Contact Support
              </button>
              <button className="px-4 py-2 border border-[#157a4f] text-[#157a4f] text-[13px] font-semibold rounded-[8px] hover:bg-[#f0f9f6] transition">
                Browse Documentation
              </button>
              <button
                onClick={handleMerchantLogout}
                className="px-4 py-2 border border-[#ef4444] text-[#ef4444] text-[13px] font-semibold rounded-[8px] hover:bg-[#fef2f2] transition ml-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-[420px] rounded-[14px] bg-white shadow-2xl border border-[#e5e5e5] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#ececec]">
              <h3 className="text-[18px] font-semibold text-[#1b1b1b]">Confirm Logout</h3>
              <p className="mt-2 text-[13px] text-[#666]">Are you sure you want to log out of your merchant account?</p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3 bg-[#fafafa]">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="h-9 px-4 rounded-[8px] border border-[#cfd5dc] bg-white text-[12px] font-semibold text-[#555]">
                Cancel
              </button>
              <button type="button" onClick={confirmLogout} className="h-9 px-4 rounded-[8px] bg-[#ef4d4d] text-white text-[12px] font-semibold">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
