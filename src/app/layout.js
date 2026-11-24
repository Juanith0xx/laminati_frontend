import { Suspense } from "react";
import { Poppins } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppBubble from "@/components/public/WhatsAppBubble";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import "./globals.css";

const SITE_URL = "https://laminati.cl";
const PRODUCT_STORAGE_ORIGIN =
  "https://contained-rack-ctv164ff-h.t3.storageapi.dev";

const API_ORIGIN = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : null;
  } catch {
    return null;
  }
})();


const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const ORGANIZATION_LOGO =
  `${SITE_URL}/images/logo-laminati-world.png`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Laminati Chile",
  legalName: "Laminati Chile Spa",
  url: SITE_URL,
  logo: ORGANIZATION_LOGO,
  description:
    "Distribuidor oficial de Abet Laminati en Chile. Laminados HPL, MEG, superficies y adhesivos para arquitectura, mobiliario y diseño.",
  email: "contacto@laminati.cl",
  telephone: "+56442890784",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Santa Rosa 5415",
    addressLocality: "San Miguel",
    addressRegion: "Región Metropolitana",
    addressCountry: "CL",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+56442890784",
    email: "contacto@laminati.cl",
    contactType: "customer service",
    areaServed: "CL",
    availableLanguage: ["es"],
  },
};

const serializedOrganizationJsonLd =
  JSON.stringify(organizationJsonLd).replace(
    /</g,
    "\\u003c"
  );

const DEFAULT_TITLE =
  "Laminati Chile | Laminados HPL Abet Laminati y superficies";

const DEFAULT_DESCRIPTION =
  "Laminati Chile, distribuidor oficial de Abet Laminati en Chile. Laminados HPL, MEG, superficies y adhesivos para arquitectura, mobiliario y diseño.";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-site",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Laminati Chile",
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  creator: "Laminati Chile",
  publisher: "Laminati Chile",
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: "Laminati Chile",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={poppins.variable}>
      <head>
        <link
          rel="preconnect"
          href={PRODUCT_STORAGE_ORIGIN}
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href={PRODUCT_STORAGE_ORIGIN}
        />
        {API_ORIGIN ? (
          <>
            <link
              rel="preconnect"
              href={API_ORIGIN}
              crossOrigin="anonymous"
            />
            <link
              rel="dns-prefetch"
              href={API_ORIGIN}
            />
          </>
        ) : null}
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializedOrganizationJsonLd,
          }}
        />

        <a
          href="#site-content"
          className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white focus:not-sr-only"
        >
          Saltar al contenido
        </a>

        <Navbar />

        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>

        <div id="site-content">
          {children}
        </div>

        <Footer />
        <WhatsAppBubble />

        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <GoogleAnalytics
            gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        ) : null}
      </body>
    </html>
  );
}
