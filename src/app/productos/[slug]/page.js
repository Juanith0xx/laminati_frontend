import { cache } from "react";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/services/products.service";

import ProductDetailClient from "./ProductDetailClient";
import ProjectProductDetailClient from "./ProjectProductDetailClient";

const SITE_NAME = "Laminati Chile";
const SITE_URL = "https://laminati.cl";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/* =========================================
   HELPERS SEO
========================================= */

const cleanText = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateMetaDescription = (
  value,
  maxLength = 160
) => {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  const sliced = text
    .slice(0, maxLength - 1)
    .replace(/\s+\S*$/, "")
    .trim();

  return `${sliced || text.slice(0, maxLength - 1).trim()}…`;
};

const getEntityName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return cleanText(value);
  }

  return cleanText(
    value.name ||
      value.title ||
      value.label ||
      ""
  );
};

const getStableProductImageUrl = (
  image,
  variant = "detail"
) => {
  const imageId =
    cleanText(image?.id);

  if (!imageId) {
    return null;
  }

  return (
    `${SITE_URL}/media/productos/` +
    `${encodeURIComponent(imageId)}/` +
    `${encodeURIComponent(variant)}`
  );
};

const getProductImage = (product) =>
  getStableProductImageUrl(
    product?.primary_image,
    "detail"
  ) ||
  getStableProductImageUrl(
    product?.images?.[0],
    "detail"
  ) ||
  product?.primary_image?.detail_url ||
  product?.primary_image?.card_url ||
  product?.primary_image?.thumbnail_url ||
  product?.primary_image_url ||
  product?.images?.[0]?.image_url ||
  null;

const absoluteUrl = (value) => {
  const raw = cleanText(value);

  if (!raw) {
    return null;
  }

  try {
    return new URL(raw, SITE_URL).toString();
  } catch {
    return null;
  }
};

const getProductImages = (product) => {
  const publicImages =
    Array.isArray(product?.images)
      ? product.images
      : [];

  const stableCandidates = [
    getStableProductImageUrl(
      product?.primary_image,
      "detail"
    ),
    ...publicImages.map((image) =>
      getStableProductImageUrl(
        image,
        "detail"
      )
    ),
  ];

  const hasStableImages =
    stableCandidates.some(Boolean);

  const fallbackCandidates = [
    product?.primary_image?.detail_url,
    product?.primary_image?.card_url,
    product?.primary_image?.thumbnail_url,
    product?.primary_image_url,
    ...publicImages.flatMap((image) => [
      image?.image_url,
      image?.url,
    ]),
  ];

  const candidates =
    hasStableImages
      ? stableCandidates
      : fallbackCandidates;

  return [
    ...new Set(
      candidates
        .map(absoluteUrl)
        .filter(Boolean)
    ),
  ];
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : null;
};

const buildProductJsonLd = (product, slug) => {
  const canonicalSlug =
    cleanText(product?.slug) || slug;

  const productUrl =
    `${SITE_URL}/productos/${encodeURIComponent(
      canonicalSlug
    )}`;

  const brandName =
    getEntityName(
      product?.brand_name || product?.brand
    );

  const categoryName =
    getEntityName(
      product?.category_name || product?.category
    );

  const collectionName =
    getEntityName(
      product?.collection_name || product?.collection
    );

  const images =
    getProductImages(product);

  const publicPrice =
    toPositiveNumber(
      product?.final_price ??
        product?.promotional_price ??
        product?.base_price
    );

  const availableStock =
    Number(product?.available_web);

  const isInStock =
    product?.in_stock === true ||
    (Number.isFinite(availableStock) &&
      availableStock > 0);

  const canPublishOffer =
    product?.commercial_mode !== "PROJECT_ONLY" &&
    product?.allow_sale !== false &&
    publicPrice !== null;

  const additionalProperty = [
    product?.finish
      ? {
          "@type": "PropertyValue",
          name: "Acabado",
          value: cleanText(product.finish),
        }
      : null,
    toPositiveNumber(product?.height_mm)
      ? {
          "@type": "PropertyValue",
          name: "Largo",
          value: `${Number(product.height_mm)} mm`,
        }
      : null,
    toPositiveNumber(product?.width_mm)
      ? {
          "@type": "PropertyValue",
          name: "Ancho",
          value: `${Number(product.width_mm)} mm`,
        }
      : null,
    toPositiveNumber(product?.thickness_mm)
      ? {
          "@type": "PropertyValue",
          name: "Espesor",
          value: `${Number(product.thickness_mm)} mm`,
        }
      : null,
  ].filter(Boolean);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name:
      cleanText(product?.name) ||
      "Producto Laminati",
    url: productUrl,
    description:
      buildProductDescription(product),
    ...(cleanText(product?.sku)
      ? { sku: cleanText(product.sku) }
      : {}),
    ...(brandName
      ? {
          brand: {
            "@type": "Brand",
            name: brandName,
          },
        }
      : {}),
    ...(categoryName
      ? { category: categoryName }
      : {}),
    ...(collectionName
      ? {
          isRelatedTo: {
            "@type": "ProductGroup",
            name: collectionName,
          },
        }
      : {}),
    ...(images.length > 0
      ? { image: images }
      : {}),
    ...(additionalProperty.length > 0
      ? { additionalProperty }
      : {}),
    ...(canPublishOffer
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "CLP",
            price: publicPrice,
            availability: isInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition:
              "https://schema.org/NewCondition",
            seller: {
              "@id": ORGANIZATION_ID,
            },
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Productos",
        item: `${SITE_URL}/productos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name:
          cleanText(product?.name) ||
          "Producto",
        item: productUrl,
      },
    ],
  };

  return {
    productJsonLd,
    breadcrumbJsonLd,
  };
};

const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

const buildProductTitle = (product) => {
  const productName =
    cleanText(product?.name) ||
    "Producto Laminati";

  const internalCode =
    cleanText(product?.internal_code);

  const brandName =
    getEntityName(
      product?.brand_name ||
        product?.brand
    );

  let descriptiveName =
    productName;

  if (
    internalCode &&
    !productName
      .toLowerCase()
      .includes(
        internalCode.toLowerCase()
      )
  ) {
    descriptiveName =
      `${productName} ${internalCode}`;
  }

  const parts = [
    descriptiveName,
  ];

  if (
    brandName &&
    !descriptiveName
      .toLowerCase()
      .includes(
        brandName.toLowerCase()
      )
  ) {
    parts.push(brandName);
  }

  parts.push(SITE_NAME);

  return parts.join(" | ");
};

const buildProductDescription = (product) => {
  const suppliedDescription =
    product?.meta_description ||
    product?.short_description ||
    product?.description;

  if (cleanText(suppliedDescription)) {
    return truncateMetaDescription(
      suppliedDescription
    );
  }

  const productName =
    cleanText(product?.name) ||
    "Producto";

  const brandName =
    getEntityName(
      product?.brand_name ||
        product?.brand
    );

  const categoryName =
    getEntityName(
      product?.category_name ||
        product?.category
    );

  return truncateMetaDescription(
    `${productName}${
      brandName
        ? ` de ${brandName}`
        : ""
    }${
      categoryName
        ? `, categoría ${categoryName}`
        : ""
    }. Disponible en Laminati Chile.`
  );
};

/*
 * React cache evita repetir la misma consulta dentro de
 * una renderización cuando generateMetadata y la página
 * necesitan el mismo producto.
 */
const loadProduct = cache(
  async (slug) => {
    const response =
      await getProductBySlug(
        slug
      );

    if (
      !response?.success ||
      !response?.product
    ) {
      return null;
    }

    return response.product;
  }
);

/* =========================================
   METADATA DINÁMICA PRODUCTO
========================================= */

export async function generateMetadata({
  params,
}) {
  const { slug } =
    await params;

  try {
    const product =
      await loadProduct(slug);

    if (!product) {
      return {
        title: "Producto no encontrado | Laminati Chile",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const title =
      buildProductTitle(
        product
      );

    const description =
      buildProductDescription(
        product
      );

    const canonicalSlug =
      cleanText(
        product.slug
      ) || slug;

    const canonical =
      `/productos/${canonicalSlug}`;

    const image =
      getProductImage(
        product
      );

    const isIndexable =
      product.is_active !== false &&
      product.is_published !== false;

    return {
      title,
      description,

      alternates: {
        canonical,
      },

      robots: {
        index: isIndexable,
        follow: true,
      },

      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_NAME,
        locale: "es_CL",
        type: "website",
        ...(image
          ? {
              images: [
                {
                  url: image,
                  alt:
                    cleanText(
                      product.name
                    ) ||
                    "Producto Laminati",
                },
              ],
            }
          : {}),
      },

      twitter: {
        card: image
          ? "summary_large_image"
          : "summary",
        title,
        description,
        ...(image
          ? {
              images: [
                image,
              ],
            }
          : {}),
      },
    };
  } catch (error) {
    console.error(
      "Error generando metadata de producto:",
      error
    );

    return {
      title: "Producto | Laminati Chile",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

/* =========================================
   PRODUCT DETAIL PAGE
========================================= */

export default async function ProductPage({
  params,
}) {
  const { slug } = await params;

  let product = null;

  try {
    product =
      await loadProduct(slug);
  } catch (error) {
    console.error(
      "Error cargando producto:",
      error
    );
  }

  if (!product) {
    notFound();
  }

  const isIndexable =
    product.is_active !== false &&
    product.is_published !== false;

  const {
    productJsonLd,
    breadcrumbJsonLd,
  } = buildProductJsonLd(
    product,
    slug
  );

  const productDetail =
    product.commercial_mode ===
    "PROJECT_ONLY" ? (
      <ProjectProductDetailClient
        product={product}
      />
    ) : (
      <ProductDetailClient
        product={product}
      />
    );

  return (
    <>
      {isIndexable && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html:
                serializeJsonLd(
                  productJsonLd
                ),
            }}
          />

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html:
                serializeJsonLd(
                  breadcrumbJsonLd
                ),
            }}
          />
        </>
      )}

      {productDetail}
    </>
  );
}
