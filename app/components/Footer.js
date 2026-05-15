export default function Footer() {
  return (
    <footer className="bg-[#efb02e] py-14">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-5 gap-8 text-[#5a4514]">

        <div>
          <div className="flex items-center gap-2 font-semibold text-[#5a4514]">
            <div className="w-6 h-6 bg-white rounded-md"></div>
            Golo
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#5a4514]">Explore Golo</h4>
          <p className="text-[#5a4514]">Home</p>
          <p className="text-[#5a4514]">Categories</p>
          <p className="text-[#5a4514]">Deals</p>
          <p className="text-[#5a4514]">Trending</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#5a4514]">Language & Location</h4>
          <p className="text-[#5a4514]">English (US)</p>
          <p className="text-[#5a4514]">India</p>
          <p className="text-[#5a4514]">Change Location</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#5a4514]">Help & Support</h4>
          <p className="text-[#5a4514]">About Us</p>
          <p className="text-[#5a4514]">Contact Us</p>
          <p className="text-[#5a4514]">Support Center</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-[#5a4514]">Legal</h4>
          <p className="text-[#5a4514]">Privacy Policy</p>
          <p className="text-[#5a4514]">Terms of Service</p>
          <p className="text-[#5a4514]">Cookie Policy</p>
        </div>

      </div>
    </footer>
  );
}