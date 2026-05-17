"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { CheckCircle2, CircleAlert, ExternalLink, LocateFixed, MapPin, MessageCircle, Share2, Star, ThumbsUp } from "lucide-react";

const ratingBars = [
  { label: "5 Stars", value: 78 },
  { label: "4 Stars", value: 12 },
  { label: "3 Stars", value: 6 },
  { label: "2 Stars", value: 3 },
  { label: "1 Stars", value: 1 },
];

const reviews = [
  {
    name: "Sarah Johnson",
    avatar: "/images/place2.avif",
    rating: 5,
    date: "2 days ago",
    likes: 12,
    body: "The Signature Tasting Menu was absolutely divine! Every course was balanced perfectly. The service was also top-notch. Highly recommend claiming this deal while it lasts.",
  },
  {
    name: "Marcus Chen",
    avatar: "/images/banner3.avif",
    rating: 4,
    date: "1 week ago",
    likes: 5,
    body: "Great atmosphere and solid food. The discount made it an incredible value. Only reason for 4 stars was a slight delay in seating despite our reservation.",
  },
  {
    name: "Elena Rodriguez",
    avatar: "/images/deal2.avif",
    rating: 5,
    date: "Oct 24, 2024",
    likes: 28,
    body: "Hidden gem in the city! This bistro knows how to handle seasonal ingredients. The claim process was smooth and the staff welcomed the coupon with a smile.",
  },
];

export default function RatingsReviewsPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#ededed] pb-16">
        <div className="mx-auto max-w-[1260px] px-6 pt-3">
          <div className="text-[11px] text-[#777]">
            Home <span className="mx-2">›</span> Restaurants <span className="mx-2">›</span> The Gourmet Bistro <span className="mx-2">›</span>
            <span className="font-semibold text-[#f0aa19]"> Ratings & Reviews</span>
          </div>

          <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <div className="rounded-[12px] border border-[#e0e0e0] bg-[#efefef] px-4 py-3">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-[10px] border border-[#d79f20] bg-[#2f3236] p-0.5">
                    <div className="relative h-full w-full overflow-hidden rounded-[8px]">
                      <Image src="/images/banner3.avif" alt="The Gourmet Bistro" fill className="object-cover" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#666]">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#d8d8d8] bg-white px-2 py-0.5">
                        <CheckCircle2 size={12} className="text-[#157a4f]" /> Verified Merchant
                      </span>
                      <span>Fine Dining</span>
                      <span>•</span>
                      <span>French Cuisine</span>
                    </div>

                    <h1 className="mt-1 text-[38px] font-bold leading-none text-[#1e1e1e]">The Gourmet Bistro</h1>
                    <div className="mt-2 flex items-center gap-2 text-[13px] text-[#666]">
                      <span className="text-[#f0aa19]">★★★★★</span>
                      <span className="font-semibold text-[#1f1f1f]">4.8</span>
                      <span>(1,245 Reviews)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="h-9 rounded-full border border-[#d7d7d7] bg-white px-4 text-[12px] font-semibold text-[#4f4f4f] inline-flex items-center gap-1.5">
                      <Share2 size={13} /> Share
                    </button>
                    <button className="h-9 rounded-full bg-[#157a4f] px-5 text-[12px] font-semibold text-white inline-flex items-center gap-1.5">
                      <MessageCircle size={13} /> Message
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[12px] border border-[#d9d9d9] bg-[#f7f7f7] p-4">
                <div className="grid grid-cols-[140px_1fr] gap-6 items-center">
                  <div className="text-center">
                    <p className="text-[50px] font-bold leading-none text-[#232323]">4.8</p>
                    <p className="mt-1 text-[#f0aa19]">★★★★★</p>
                    <p className="mt-1 text-[10px] font-semibold tracking-wide text-[#6f6f6f]">STORE AVERAGE</p>
                  </div>

                  <div className="space-y-2">
                    {ratingBars.map((item) => (
                      <div key={item.label} className="grid grid-cols-[58px_1fr_34px] items-center gap-2 text-[11px] text-[#595959]">
                        <span>{item.label}</span>
                        <div className="h-2 rounded-full bg-[#ebebeb]">
                          <div className="h-2 rounded-full bg-[#e7a91d]" style={{ width: `${item.value}%` }} />
                        </div>
                        <span className="text-right">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <section className="mt-5 rounded-[12px] border border-[#dcdcdc] bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[30px] font-bold leading-none text-[#202020]">Customer Reviews</h2>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#666]">Sort by:</span>
                    <button className="rounded-full border border-[#e8c87e] bg-[#fff5da] px-3 py-1 font-semibold text-[#d59812]">Recommended</button>
                    <button className="rounded-full border border-[#e2e2e2] bg-white px-3 py-1 text-[#666]">Newest</button>
                    <button className="rounded-full border border-[#e2e2e2] bg-white px-3 py-1 text-[#666]">Highest</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article key={review.name} className="rounded-[10px] border border-[#e5e5e5] bg-[#fbfbfb] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-9 w-9 overflow-hidden rounded-full border border-[#e1e1e1]">
                            <Image src={review.avatar} alt={review.name} width={36} height={36} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#1f1f1f]">{review.name}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#777]">
                              <span className="text-[#f0aa19]">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                              <span>{review.date}</span>
                              <span className="rounded-full border border-[#dddddd] px-2 py-0.5 text-[10px]">Verified Purchase</span>
                            </div>
                          </div>
                        </div>

                        <button className="text-[11px] text-[#666] inline-flex items-center gap-1">
                          <ThumbsUp size={12} /> {review.likes}
                        </button>
                      </div>

                      <p className="mt-3 text-[13px] leading-6 text-[#4f4f4f]">{review.body}</p>
                    </article>
                  ))}
                </div>

                <button className="mt-4 h-10 w-full rounded-[8px] border border-[#e5d8b2] bg-[#fff7e5] text-[12px] font-semibold text-[#d59812]">
                  Load More Reviews
                </button>
              </section>
            </div>

            <aside className="space-y-4 lg:pt-1">
              <div className="rounded-[12px] border border-[#dfdfdf] bg-white p-4">
                <h3 className="text-[20px] font-bold text-[#1f1f1f]">About the Store</h3>
                <div className="mt-3 space-y-2 text-[12px] text-[#555]">
                  <p><MapPin size={12} className="mr-1.5 inline text-[#f0aa19]" />123 Main Street, Suite 400</p>
                  <p className="pl-[18px] text-[11px] text-[#777]">San Francisco, CA 94105</p>
                  <p><CircleAlert size={12} className="mr-1.5 inline text-[#f0aa19]" />Open Today</p>
                  <p className="pl-[18px] text-[11px] text-[#777]">11:00 AM - 09:00 PM</p>
                </div>

                <div className="mt-3 relative h-[120px] overflow-hidden rounded-[10px] border border-[#ececec] bg-[#f5f5f5]">
                  <Image src="/images/banner3.avif" alt="Store location map" fill className="object-cover" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="h-9 rounded-[8px] border border-[#dfdfdf] bg-white text-[12px] font-semibold text-[#4e4e4e] inline-flex items-center justify-center gap-1.5">
                    <LocateFixed size={12} /> Directions
                  </button>
                  <button className="h-9 rounded-[8px] border border-[#dfdfdf] bg-white text-[12px] font-semibold text-[#4e4e4e] inline-flex items-center justify-center gap-1.5">
                    <ExternalLink size={12} /> Website
                  </button>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#dfdfdf] bg-white p-4">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#666]">YOUR RECENT CLAIM</p>
                <div className="mt-3 rounded-[10px] border border-[#ececec] bg-[#fbfbfb] p-2">
                  <div className="flex gap-2">
                    <div className="relative h-12 w-16 overflow-hidden rounded-[6px] border border-[#ececec]">
                      <Image src="/images/deal2.avif" alt="Claimed deal" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#222]">50% Off Signature Tasting Menu</p>
                      <p className="text-[10px] text-[#777]">Claim ID: #GLO-2891-X</p>
                      <span className="mt-1 inline-flex rounded-full bg-[#e8f6ec] px-2 py-0.5 text-[9px] font-semibold text-[#157a4f]">Valid till Dec 31</span>
                    </div>
                  </div>
                </div>

                <button className="mt-3 h-10 w-full rounded-[8px] bg-[#15191f] text-[13px] font-semibold text-white">View QR Code</button>
                <button className="mt-2 h-9 w-full rounded-[8px] border border-[#dfdfdf] bg-white text-[12px] font-semibold text-[#4d4d4d]">Deal Details</button>
                <button className="mt-2 h-9 w-full rounded-[8px] bg-[#edf7ef] text-[11px] font-semibold text-[#157a4f]">PRINT RECEIPT</button>
              </div>

              <div className="rounded-[12px] border border-[#dfdfdf] bg-white p-4">
                <p className="text-[13px] font-semibold text-[#333]">Helpful Tips</p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-[#666]">
                  <li>Reserve your table 24h in advance</li>
                  <li>Mention GOLO upon arrival</li>
                  <li>Review helps others find great deals</li>
                  <li>Deal valid for dine-in only</li>
                </ul>
              </div>

              <div className="rounded-[10px] bg-[#e7a91d] p-4 text-[#2f2204]">
                <p className="text-[24px] font-bold leading-none">Ready for more?</p>
                <p className="mt-2 text-[12px]">Explore similar trending deals in San Francisco today.</p>
                <button
                  onClick={() => router.push("/nearby-deals")}
                  className="mt-3 h-9 w-full rounded-[8px] bg-[#f9f1dc] text-[12px] font-semibold text-[#8f6515]"
                >
                  Browse Recommended →
                </button>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
