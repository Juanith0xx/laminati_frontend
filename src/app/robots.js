const SITE_URL = "https://laminati.cl";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/gerencia/",
        "/login",
        "/registro",
        "/mi-cuenta",
        "/checkout",
        "/pago/",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
