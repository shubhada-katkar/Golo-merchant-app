import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext";
import { VoucherProvider } from "./context/VoucherContext";

export const metadata = {
  title: "Golo",
  description: "Best Deals & Offers Near You",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <VoucherProvider>
            {children}
          </VoucherProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
