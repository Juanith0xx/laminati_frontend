"use client";

import {
  useEffect,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  trackEvent,
} from "@/services/analytics.service";

const PRIVATE_PREFIXES = [
  "/admin",
  "/login",
  "/registro",
  "/mi-cuenta",
];

function shouldTrackPath(
  pathname
) {
  if (!pathname) {
    return false;
  }

  return !PRIVATE_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(
        `${prefix}/`
      )
  );
}

function getCollectionSlug(
  pathname,
  searchParams
) {
  const laminadosMatch =
    pathname.match(
      /^\/productos\/laminados\/([^/]+)\/?$/
    );

  if (
    laminadosMatch?.[1]
  ) {
    return decodeURIComponent(
      laminadosMatch[1]
    );
  }

  if (
    pathname ===
    "/productos/laminados"
  ) {
    return "laminados";
  }

  if (
    pathname ===
    "/productos/meg"
  ) {
    return "meg";
  }

  if (
    pathname ===
    "/productos/labgrade"
  ) {
    return "labgrade";
  }

  if (
    pathname ===
    "/productos"
  ) {
    const collection =
      searchParams.get(
        "collection"
      );

    if (collection) {
      return collection;
    }
  }

  return null;
}

export default function AnalyticsTracker() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const queryString =
    searchParams.toString();

  useEffect(() => {
    if (
      !shouldTrackPath(
        pathname
      )
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        queryString
      );

    const pagePath =
      queryString
        ? `${pathname}?${queryString}`
        : pathname;

    void trackEvent(
      "PAGE_VIEW",
      {
        page_path:
          pagePath,
      }
    );

    const collectionSlug =
      getCollectionSlug(
        pathname,
        params
      );

    if (
      collectionSlug
    ) {
      void trackEvent(
        "COLLECTION_VIEW",
        {
          page_path:
            pagePath,
          collection_slug:
            collectionSlug,
          metadata: {
            source:
              "catalog_route",
          },
        }
      );
    }
  }, [
    pathname,
    queryString,
  ]);

  return null;
}
