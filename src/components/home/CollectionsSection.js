import Link from "next/link";

import {
  getCatalogFilters,
  getProducts,
} from "@/services/products.service";

import CollectionsCarousel from "./CollectionsCarousel";


/* =========================================
   HELPERS
========================================= */

function getCollectionImage(
  collection
) {
  return (
    collection?.banner_url ||
    collection?.image_url ||
    collection?.cover_url ||
    null
  );
}


function getProductImage(
  product
) {
  return (
    product?.primary_image_url ||
    product?.primary_image?.card_url ||
    product?.primary_image?.image_url ||
    null
  );
}


function getSecondaryProductImage(
  product
) {
  return (
    product?.secondary_image_url ||
    product?.secondary_image?.card_url ||
    product?.secondary_image?.image_url ||
    null
  );
}


function extractProducts(
  response
) {
  if (
    Array.isArray(
      response?.products
    )
  ) {
    return response.products;
  }

  if (
    Array.isArray(
      response?.data?.products
    )
  ) {
    return response.data.products;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  return [];
}


function getCollectionSlugFromProduct(
  product
) {
  return String(
    product?.collection_slug ||
    product?.collection?.slug ||
    ""
  )
    .trim()
    .toLowerCase();
}


function buildProductsByCollection(
  products
) {
  const map =
    new Map();

  for (
    const product
    of products
  ) {
    const slug =
      getCollectionSlugFromProduct(
        product
      );

    if (!slug) {
      continue;
    }

    if (
      !map.has(slug)
    ) {
      map.set(
        slug,
        []
      );
    }

    map
      .get(slug)
      .push(product);
  }

  return map;
}


function buildCollectionVisual(
  collection,
  collectionProducts
) {
  const explicitImage =
    getCollectionImage(
      collection
    );

  const productImages =
    collectionProducts
      .flatMap(
        (product) => [
          getProductImage(
            product
          ),
          getSecondaryProductImage(
            product
          ),
        ]
      )
      .filter(Boolean);

  const uniqueImages =
    Array.from(
      new Set(
        productImages
      )
    );

  const background =
    explicitImage ||
    uniqueImages[0] ||
    null;

  const samples =
    uniqueImages.filter(
      (image) =>
        image !== background
    );

  return {
    ...collection,

    visual_background:
      background,

    visual_sample_one:
      samples[0] ||
      null,

    visual_sample_two:
      samples[1] ||
      null,

    product_count:
      collectionProducts.length,

    brand:
      collection?.brand ||
      collection?.brand_name ||
      collectionProducts?.[0]
        ?.brand ||
      collectionProducts?.[0]
        ?.brand_name ||
      "Abet Laminati",
  };
}


/* =========================================
   SECTION
========================================= */

export default async function CollectionsSection() {
  let collections = [];

  try {
    const [
      filtersResponse,
      productsResponse,
    ] =
      await Promise.all([
        getCatalogFilters(),

        getProducts({
          category:
            "laminados",
          limit:
            100,
          sort:
            "featured",
        }),
      ]);

    const rawCollections =
      filtersResponse
        ?.filters
        ?.collections ||
      [];

    const uniqueCollections =
      Array.from(
        new Map(
          rawCollections.map(
            (
              collection
            ) => [
              collection.id,
              collection,
            ]
          )
        ).values()
      );

    const products =
      extractProducts(
        productsResponse
      );

    const productsByCollection =
      buildProductsByCollection(
        products
      );

    collections =
      uniqueCollections.map(
        (
          collection
        ) => {
          const slug =
            String(
              collection?.slug ||
              ""
            )
              .trim()
              .toLowerCase();

          const collectionProducts =
            productsByCollection.get(
              slug
            ) ||
            [];

          return buildCollectionVisual(
            collection,
            collectionProducts
          );
        }
      );
  } catch (error) {
    console.error(
      "Error cargando colecciones del Home:",
      error
    );
  }

  if (
    collections.length ===
    0
  ) {
    return null;
  }

  return (
    <section className="bg-[#111111] py-16 text-white sm:py-20 lg:py-28">

      <div className="site-container">

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between lg:mb-14">

          <div>

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-neutral-500">
              Colecciones
            </p>

            <h2 className="max-w-3xl text-3xl font-medium tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              Diseñadas para crear espacios únicos.
            </h2>

          </div>

          <Link
            href="/colecciones"
            className="group flex w-fit items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-white"
          >
            Ver todas las colecciones

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        <CollectionsCarousel
          collections={
            collections
          }
        />

      </div>

    </section>
  );
}
