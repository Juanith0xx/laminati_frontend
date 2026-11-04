"use client";

const SESSION_KEY =
  "laminati_analytics_session";

const SESSION_CONTEXT_KEY =
  "laminati_analytics_context";

const RECENT_EVENT_WINDOW_MS =
  1500;

let memorySessionKey = null;

const recentEvents =
  new Map();

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

const normalizeSlug = (
  value
) => {
  const text =
    cleanText(
      value,
      150
    );

  if (!text) {
    return null;
  }

  return text
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      150
    );
};

const createSessionKey = () => {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
};

const getSessionStorage = () => {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getOrCreateSession = () => {
  const storage =
    getSessionStorage();

  if (storage) {
    const existing =
      storage.getItem(
        SESSION_KEY
      );

    if (existing) {
      return {
        sessionKey:
          existing,
        isNew:
          false,
      };
    }

    const created =
      createSessionKey();

    storage.setItem(
      SESSION_KEY,
      created
    );

    return {
      sessionKey:
        created,
      isNew:
        true,
    };
  }

  if (
    memorySessionKey
  ) {
    return {
      sessionKey:
        memorySessionKey,
      isNew:
        false,
    };
  }

  memorySessionKey =
    createSessionKey();

  return {
    sessionKey:
      memorySessionKey,
    isNew:
      true,
  };
};

const inferSourceFromReferrer = (
  referrer
) => {
  if (!referrer) {
    return {
      source: null,
      medium: null,
    };
  }

  try {
    const url =
      new URL(referrer);

    if (
      typeof window !==
        "undefined" &&
      url.hostname ===
        window.location.hostname
    ) {
      return {
        source: null,
        medium: null,
      };
    }

    const hostname =
      url.hostname
        .replace(
          /^www\./,
          ""
        )
        .toLowerCase();

    if (
      hostname.includes(
        "google."
      )
    ) {
      return {
        source: "google",
        medium: "organic",
      };
    }

    if (
      hostname.includes(
        "bing."
      )
    ) {
      return {
        source: "bing",
        medium: "organic",
      };
    }

    if (
      hostname.includes(
        "instagram."
      )
    ) {
      return {
        source: "instagram",
        medium: "referral",
      };
    }

    if (
      hostname.includes(
        "facebook."
      ) ||
      hostname ===
        "fb.com"
    ) {
      return {
        source: "facebook",
        medium: "referral",
      };
    }

    return {
      source:
        hostname ||
        null,
      medium:
        hostname
          ? "referral"
          : null,
    };
  } catch {
    return {
      source: null,
      medium: null,
    };
  }
};

const readInitialContext = () => {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  const storage =
    getSessionStorage();

  if (storage) {
    try {
      const existing =
        storage.getItem(
          SESSION_CONTEXT_KEY
        );

      if (existing) {
        return JSON.parse(
          existing
        );
      }
    } catch {
      // Se reconstruye si el dato guardado está dañado.
    }
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const referrer =
    cleanText(
      document.referrer,
      2000
    );

  const inferred =
    inferSourceFromReferrer(
      referrer
    );

  const context = {
    landing_page:
      cleanText(
        `${window.location.pathname}${window.location.search}`,
        2000
      ),
    referrer,
    utm_source:
      cleanText(
        params.get(
          "utm_source"
        ),
        150
      ) ||
      inferred.source,
    utm_medium:
      cleanText(
        params.get(
          "utm_medium"
        ),
        150
      ) ||
      inferred.medium,
    utm_campaign:
      cleanText(
        params.get(
          "utm_campaign"
        ),
        150
      ),
  };

  if (storage) {
    try {
      storage.setItem(
        SESSION_CONTEXT_KEY,
        JSON.stringify(
          context
        )
      );
    } catch {
      // Analytics nunca debe romper la navegación.
    }
  }

  return context;
};

const getDeviceType = () => {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const width =
    Number(
      window.innerWidth
    ) || 0;

  if (
    width > 0 &&
    width <= 767
  ) {
    return "mobile";
  }

  if (
    width > 767 &&
    width <= 1180
  ) {
    return "tablet";
  }

  return "desktop";
};

const shouldSkipEvent = (
  eventType,
  payload
) => {
  const now =
    Date.now();

  const key =
    [
      eventType,
      payload.page_path ||
        "",
      payload.product_id ||
        "",
      payload.product_code ||
        "",
      payload.collection_slug ||
        "",
      payload.search_term ||
        "",
      payload?.metadata
        ?.source ||
        "",
    ].join("|");

  const previous =
    recentEvents.get(
      key
    );

  recentEvents.set(
    key,
    now
  );

  for (
    const [
      recentKey,
      timestamp,
    ] of recentEvents
  ) {
    if (
      now - timestamp >
      RECENT_EVENT_WINDOW_MS *
        4
    ) {
      recentEvents.delete(
        recentKey
      );
    }
  }

  return Boolean(
    previous &&
      now - previous <
        RECENT_EVENT_WINDOW_MS
  );
};

const analyticsEnabled = () =>
  process.env
    .NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED !==
  "false";

const buildEventPayload = (
  eventType,
  payload = {}
) => {
  if (
    typeof window ===
      "undefined" ||
    !analyticsEnabled()
  ) {
    return null;
  }

  const normalizedEventType =
    cleanText(
      eventType,
      50
    )?.toUpperCase();

  if (
    !normalizedEventType
  ) {
    return null;
  }

  const {
    sessionKey,
    isNew,
  } =
    getOrCreateSession();

  const context =
    readInitialContext();

  const pagePath =
    cleanText(
      payload.page_path ||
        `${window.location.pathname}${window.location.search}`,
      2000
    );

  const normalizedPayload = {
    session_key:
      sessionKey,
    session_is_new:
      isNew,
    event_type:
      normalizedEventType,
    page_path:
      pagePath,
    product_id:
      cleanText(
        payload.product_id,
        64
      ),
    product_code:
      cleanText(
        payload.product_code,
        100
      ),
    collection_slug:
      normalizeSlug(
        payload.collection_slug
      ),
    search_term:
      cleanText(
        payload.search_term,
        500
      ),
    metadata:
      payload.metadata &&
      typeof payload.metadata ===
        "object" &&
      !Array.isArray(
        payload.metadata
      )
        ? payload.metadata
        : {},
    device_type:
      getDeviceType(),
    ...context,
  };

  if (
    shouldSkipEvent(
      normalizedEventType,
      normalizedPayload
    )
  ) {
    return {
      skipped: true,
      payload:
        normalizedPayload,
    };
  }

  return {
    skipped: false,
    payload:
      normalizedPayload,
  };
};

export async function trackEvent(
  eventType,
  payload = {}
) {
  const prepared =
    buildEventPayload(
      eventType,
      payload
    );

  if (!prepared) {
    return false;
  }

  if (
    prepared.skipped
  ) {
    return true;
  }

  try {
    const response =
      await fetch(
        "/api/analytics/track",
        {
          method: "POST",
          cache: "no-store",
          credentials:
            "same-origin",
          keepalive:
            true,
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              prepared.payload
            ),
        }
      );

    return response.ok;
  } catch {
    return false;
  }
}

export function trackNavigationEvent(
  eventType,
  payload = {}
) {
  const prepared =
    buildEventPayload(
      eventType,
      payload
    );

  if (!prepared) {
    return false;
  }

  if (
    prepared.skipped
  ) {
    return true;
  }

  const body =
    JSON.stringify(
      prepared.payload
    );

  if (
    typeof navigator !==
      "undefined" &&
    typeof navigator.sendBeacon ===
      "function"
  ) {
    try {
      const blob =
        new Blob(
          [body],
          {
            type:
              "application/json",
          }
        );

      const queued =
        navigator.sendBeacon(
          "/api/analytics/track",
          blob
        );

      if (queued) {
        return true;
      }
    } catch {
      // Si Beacon falla, usamos fetch keepalive.
    }
  }

  try {
    void fetch(
      "/api/analytics/track",
      {
        method: "POST",
        cache: "no-store",
        credentials:
          "same-origin",
        keepalive:
          true,
        headers: {
          "Content-Type":
            "application/json",
        },
        body,
      }
    );

    return true;
  } catch {
    return false;
  }
}
