import { Poppins } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppBubble from "@/components/public/WhatsAppBubble";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-site",
  display: "swap",
});

export const metadata = {
  title: "Laminati",
  description:
    "Laminados, superficies y soluciones para arquitectura, diseño y mobiliario.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>
        <Navbar />
        {children}
        <Footer />
        <WhatsAppBubble />
      </body>
    </html>
  );
}