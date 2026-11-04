"use client";

import Link from "next/link";

import {
  trackEvent,
} from "@/services/analytics.service";

export default function TrackedProductLink({
  href,
  productId,
  productCode,
  collectionSlug,
  metadata = {},
  children,
  onClick,
  ...props
}) {
  const handleClick = (
    event
  ) => {
    void trackEvent(
      "PRODUCT_CLICK",
      {
        product_id:
          productId ||
          null,
        product_code:
          productCode ||
          null,
        collection_slug:
          collectionSlug ||
          null,
        metadata: {
          source:
            "catalog_card",
          ...metadata,
        },
      }
    );

    if (
      typeof onClick ===
      "function"
    ) {
      onClick(event);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
