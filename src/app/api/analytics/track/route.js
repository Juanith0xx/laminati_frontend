const MAX_BODY_BYTES =
  32 * 1024;

import { createHmac } from "node:crypto";

const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|slurp|semrush|ahrefs|mj12bot|headlesschrome|playwright|puppeteer|selenium|lighthouse|pagespeed|bytespider|petalbot|claudebot|gptbot|applebot/i;

const isDevGeoAllowed = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.ANALYTICS_ALLOW_DEV_GEO === "true";

const getGeoHeader = (headers, headerName, devEnvName) =>
  headers.get(headerName) ||
  (isDevGeoAllowed() ? process.env[devEnvName] : null);

// No guardamos IP real. HMAC diario para detectar oleadas desde un mismo origen.
const getAnonymousVisitorHash = (request, secret) => {
  if (process.env.VERCEL !== "1" || !secret) return null;
  const ip = cleanText(
    request.headers.get("x-vercel-forwarded-for") ||
      request.headers.get("x-forwarded-for"),
    100
  );
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${day}:${ip}`)
    .digest("hex");
};

const cleanText = (
  value,
  maxLength = 500
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  return text.slice(
    0,
    maxLength
  );
};

const decodeHeader = (
  value
) => {
  const text =
    cleanText(
      value,
      500
    );

  if (!text) {
    return null;
  }

  try {
    return decodeURIComponent(
      text
    );
  } catch {
    return text;
  }
};

const getBackendBaseUrl = () => {
  const base =
    process.env
      .API_SERVER_URL ||
    process.env
      .NEXT_PUBLIC_API_URL ||
    "";

  return String(base)
    .trim()
    .replace(
      /\/+$/,
      ""
    );
};

const buildBackendAnalyticsUrl = () => {
  const base =
    getBackendBaseUrl();

  if (!base) {
    return null;
  }

  if (
    base.endsWith(
      "/api"
    )
  ) {
    return `${base}/analytics/events`;
  }

  return `${base}/api/analytics/events`;
};

const getGeoLocation = (
  request
) => {
  const headers =
    request.headers;

  const countryCode =
    cleanText(
      getGeoHeader(headers, "x-vercel-ip-country", "ANALYTICS_DEV_COUNTRY_CODE"),
      10
    );

  const regionCode =
    cleanText(
      getGeoHeader(headers, "x-vercel-ip-country-region", "ANALYTICS_DEV_REGION_CODE"),
      30
    );

  const city =
    decodeHeader(
      getGeoHeader(headers, "x-vercel-ip-city", "ANALYTICS_DEV_CITY")
    );

  const latitude =
    cleanText(
      getGeoHeader(headers, "x-vercel-ip-latitude", "ANALYTICS_DEV_LATITUDE"),
      30
    );

  const longitude =
    cleanText(
      getGeoHeader(headers, "x-vercel-ip-longitude", "ANALYTICS_DEV_LONGITUDE"),
      30
    );

  /*
   * La geolocalización por IP es aproximada.
   * En esta primera fase usamos la localidad
   * de Vercel como comuna aproximada en Chile.
   */
  const commune =
    cleanText(
      (isDevGeoAllowed() ? process.env.ANALYTICS_DEV_COMMUNE : null),
      150
    ) ||
    (
      countryCode ===
        "CL"
        ? city
        : null
    );

  return {
    country_code:
      countryCode,
    region_code:
      regionCode,
    city,
    commune,
    latitude,
    longitude,
  };
};

const isSameOriginRequest = (
  request
) => {
  const origin =
    request.headers.get(
      "origin"
    );

  if (!origin) {
    return true;
  }

  try {
    const originUrl =
      new URL(origin);

    const requestUrl =
      new URL(
        request.url
      );

    return (
      originUrl.host ===
      requestUrl.host
    );
  } catch {
    return false;
  }
};

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function POST(
  request
) {
  if (
    !isSameOriginRequest(
      request
    )
  ) {
    return Response.json(
      {
        success: false,
        message:
          "Origen no permitido",
      },
      {
        status: 403,
      }
    );
  }

  const userAgent =
    request.headers.get(
      "user-agent"
    ) || "";

  if (
    BOT_PATTERN.test(
      userAgent
    )
  ) {
    return new Response(
      null,
      {
        status: 204,
      }
    );
  }

  const contentLength =
    Number(
      request.headers.get(
        "content-length"
      )
    );

  if (
    Number.isFinite(
      contentLength
    ) &&
    contentLength >
      MAX_BODY_BYTES
  ) {
    return Response.json(
      {
        success: false,
        message:
          "Payload demasiado grande",
      },
      {
        status: 413,
      }
    );
  }

  const secret =
    process.env
      .ANALYTICS_INGEST_SECRET;

  const backendUrl =
    buildBackendAnalyticsUrl();

  if (
    !secret ||
    !backendUrl
  ) {
    return Response.json(
      {
        success: false,
        message:
          "Analytics no está configurado",
      },
      {
        status: 503,
      }
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message:
          "JSON inválido",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body ||
    typeof body !==
      "object" ||
    Array.isArray(
      body
    )
  ) {
    return Response.json(
      {
        success: false,
        message:
          "Payload inválido",
      },
      {
        status: 400,
      }
    );
  }

  // La ingesta es solo para navegadores con solicitudes desde el mismo sitio.
  // No bloqueamos la falta de Sec-Fetch-* (algunos navegadores la omiten).
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return new Response(null, { status: 204 });
  }

  const metadata =
    body.metadata &&
    typeof body.metadata ===
      "object" &&
    !Array.isArray(
      body.metadata
    )
      ? body.metadata
      : {};

  const payload = {
    visitor_hash: getAnonymousVisitorHash(request, secret),
    session_key:
      body.session_key,
    event_type:
      body.event_type,
    page_path:
      body.page_path,
    product_id:
      body.product_id,
    product_code:
      body.product_code,
    collection_slug:
      body.collection_slug,
    search_term:
      body.search_term,
    device_type:
      body.device_type,
    landing_page:
      body.landing_page,
    referrer:
      body.referrer,
    utm_source:
      body.utm_source,
    utm_medium:
      body.utm_medium,
    utm_campaign:
      body.utm_campaign,
    location:
      getGeoLocation(
        request
      ),
    metadata: {
      ...metadata,
      location_source:
        (process.env.VERCEL === "1" && request.headers.get("x-vercel-ip-country"))
          ? "vercel_ip"
          : (isDevGeoAllowed() ? "development_override" : "unknown"),
      commune_precision:
        "approximate",
    },
  };

  try {
    const response =
      await fetch(
        backendUrl,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type":
              "application/json",
            "X-Analytics-Secret":
              secret,
          },
          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const responseText =
      await response.text();

    if (!responseText) {
      return new Response(
        null,
        {
          status:
            response.status,
        }
      );
    }

    return new Response(
      responseText,
      {
        status:
          response.status,
        headers: {
          "Content-Type":
            response.headers.get(
              "content-type"
            ) ||
            "application/json; charset=utf-8",
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch {
    return Response.json(
      {
        success: false,
        message:
          "No fue posible registrar analytics",
      },
      {
        status: 502,
      }
    );
  }
}
