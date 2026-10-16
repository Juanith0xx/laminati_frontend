import Link from "next/link";

import {
  getProducts,
} from "@/services/products.service";

import HeroLaminateMotion from "./HeroLaminateMotion";


/* =========================================
   TEXTURAS MANUALES DEL HERO

   Cambia solamente estos SKU para cambiar
   las 4 placas mostradas en el Hero.
========================================= */

const HERO_TEXTURE_SKUS = [
  "1210S",   // placa 1
  "5726S",   // placa 2
  "5835S",  // placa 3
  "6119L",   // placa 4
];

function getProductImage(
  product
) {
  return (
    product
      ?.primary_image_url ||
    product
      ?.primary_image
      ?.detail_url ||
    product
      ?.primary_image
      ?.card_url ||
    null
  );
}


function getProductsFromResponse(
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


function normalizeSku(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}


function toTexture(
  product
) {
  if (!product) {
    return null;
  }

  const imageUrl =
    getProductImage(
      product
    );

  if (!imageUrl) {
    return null;
  }

  return {
    id:
      product.id,
    sku:
      product.sku,
    name:
      product.name,
    imageUrl,
    slug:
      product.slug,
  };
}

function productSearchText(
  product
) {
  return [
    product?.name,
    product?.category,
    product?.collection,
    product?.color,
    product?.finish,
    product?.texture,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreProductForSlot(
  product,
  slot
) {
  const text =
    productSearchText(
      product
    );

  const rules = {
    lightWood: [
      "apple",
      "rovere",
      "oak",
      "madera",
      "legni",
      "wood",
      "maple",
      "acero",
      "olmo",
      "douglas",
      "limba",
    ],
    darkWood: [
      "dark",
      "nero",
      "moka",
      "noir",
      "cocoa",
      "weng",
      "zebrano",
      "rovere",
      "wood",
      "madera",
      "legni",
    ],
    stone: [
      "marble",
      "marmo",
      "pietra",
      "stone",
      "cement",
      "cemento",
      "travert",
      "granito",
      "mineral",
      "speckle",
      "grey",
      "grigio",
    ],
    neutral: [
      "grey",
      "grigio",
      "beige",
      "bianco",
      "white",
      "ivory",
      "crema",
      "taupe",
      "brown",
      "colours",
    ],
  };

  const keywords =
    rules[slot] || [];

  let score = 0;

  keywords.forEach(
    (
      keyword,
      index
    ) => {
      if (
        text.includes(
          keyword
        )
      ) {
        score +=
          Math.max(
            10,
            45 -
              index * 3
          );
      }
    }
  );

  if (
    product
      ?.is_featured
  ) {
    score += 18;
  }

  if (
    product
      ?.collection
  ) {
    score += 3;
  }

  return score;
}

function pickTextureProducts(
  products
) {
  const candidates =
    products.filter(
      (
        product
      ) =>
        product
          ?.commercial_mode !==
          "PROJECT_ONLY" &&
        getProductImage(
          product
        )
    );

  const slots = [
    "lightWood",
    "darkWood",
    "stone",
    "neutral",
  ];

  const used =
    new Set();

  const selected =
    slots.map(
      (
        slot
      ) => {
        const ranked =
          [...candidates]
            .filter(
              (
                product
              ) =>
                !used.has(
                  product.id
                )
            )
            .sort(
              (
                a,
                b
              ) =>
                scoreProductForSlot(
                  b,
                  slot
                ) -
                scoreProductForSlot(
                  a,
                  slot
                )
            );

        const picked =
          ranked[0];

        if (picked) {
          used.add(
            picked.id
          );
        }

        return picked;
      }
    );

  candidates.forEach(
    (
      product
    ) => {
      if (
        selected.filter(
          Boolean
        ).length >= 4
      ) {
        return;
      }

      if (
        !used.has(
          product.id
        )
      ) {
        const emptyIndex =
          selected.findIndex(
            (
              item
            ) =>
              !item
          );

        if (
          emptyIndex !==
          -1
        ) {
          selected[
            emptyIndex
          ] =
            product;

          used.add(
            product.id
          );
        }
      }
    }
  );

  return selected
    .filter(Boolean)
    .map(
      (
        product
      ) => ({
        id:
          product.id,
        name:
          product.name,
        imageUrl:
          getProductImage(
            product
          ),
        slug:
          product.slug,
      })
    );
}

async function loadProductBySku(
  sku
) {
  try {
    const response =
      await getProducts({
        search:
          sku,
        limit:
          12,
        sort:
          "featured",
      });

    const products =
      getProductsFromResponse(
        response
      );

    const normalizedSku =
      normalizeSku(
        sku
      );

    return (
      products.find(
        (
          product
        ) =>
          normalizeSku(
            product?.sku
          ) ===
            normalizedSku &&
          product
            ?.commercial_mode !==
            "PROJECT_ONLY" &&
          getProductImage(
            product
          )
      ) ||
      null
    );
  } catch (error) {
    console.error(
      `Error cargando SKU ${sku} para el Hero:`,
      error
    );

    return null;
  }
}


async function loadAutomaticFallbackProducts() {
  try {
    const [
      featuredResponse,
      newestResponse,
    ] =
      await Promise.all([
        getProducts({
          in_stock:
            true,
          limit:
            24,
          sort:
            "featured",
        }),

        getProducts({
          in_stock:
            true,
          limit:
            24,
          sort:
            "newest",
        }),
      ]);

    const products = [
      ...getProductsFromResponse(
        featuredResponse
      ),
      ...getProductsFromResponse(
        newestResponse
      ),
    ];

    const unique =
      Array.from(
        new Map(
          products.map(
            (
              product
            ) => [
              product.id,
              product,
            ]
          )
        ).values()
      );

    return unique.filter(
      (
        product
      ) =>
        product
          ?.commercial_mode !==
          "PROJECT_ONLY" &&
        getProductImage(
          product
        )
    );
  } catch (error) {
    console.error(
      "Error cargando fallback automático del Hero:",
      error
    );

    return [];
  }
}


async function loadHeroTextures() {
  /*
   * 1. Buscamos exactamente los SKU configurados.
   * 2. Conservamos el orden de HERO_TEXTURE_SKUS.
   * 3. Si falta un SKU o su imagen, rellenamos solo
   *    ese espacio con el selector automático anterior.
   */

  const manualProducts =
    await Promise.all(
      HERO_TEXTURE_SKUS.map(
        (
          sku
        ) =>
          loadProductBySku(
            sku
          )
      )
    );

  const usedIds =
    new Set(
      manualProducts
        .filter(Boolean)
        .map(
          (
            product
          ) =>
            product.id
        )
    );

  let fallbackProducts =
    [];

  if (
    manualProducts.some(
      (
        product
      ) =>
        !product
    )
  ) {
    fallbackProducts =
      await loadAutomaticFallbackProducts();
  }

  const automaticSelection =
    pickTextureProducts(
      fallbackProducts.filter(
        (
          product
        ) =>
          !usedIds.has(
            product.id
          )
      )
    );

  let fallbackIndex =
    0;

  const textures =
    manualProducts.map(
      (
        product,
        index
      ) => {
        if (product) {
          return toTexture(
            product
          );
        }

        const fallbackTexture =
          automaticSelection[
            fallbackIndex
          ] ||
          null;

        fallbackIndex += 1;

        if (
          !fallbackTexture
        ) {
          console.warn(
            `No se encontró el SKU ${HERO_TEXTURE_SKUS[index]} ni un fallback disponible para la placa ${index + 1}.`
          );
        }

        return fallbackTexture;
      }
    );

  return textures.filter(
    Boolean
  );
}

export default async function Hero() {
  const textures =
    await loadHeroTextures();

  return (
    <section className="overflow-hidden bg-[#f5f4f0]">

      <div className="site-container grid min-h-[calc(100svh-72px)] items-center gap-10 py-12 md:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:py-16">

        {/* CONTENIDO */}
        <div className="relative z-10 max-w-3xl">

          <p className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-neutral-500 sm:text-sm">
            Diseño · Arquitectura · Superficies
          </p>

          <h1 className="text-[clamp(2.8rem,7vw,6.8rem)] font-medium leading-[0.95] tracking-[-0.045em] text-neutral-950">

            Materiales que

            <span className="block text-neutral-500">
              transforman.
            </span>

          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            Laminados y soluciones pensadas para proyectos de arquitectura, mobiliario y diseño de interiores.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/productos"
              style={{
                color:
                  "#ffffff",
              }}
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-neutral-950 px-7 text-sm font-semibold !text-white transition duration-300 hover:bg-neutral-800 hover:!text-white"
            >
              <span className="!text-white">
                Explorar productos
              </span>

              <span className="ml-2 !text-white">
                →
              </span>
            </Link>

            <Link
              href="/colecciones"
              style={{
                color:
                  "#171717",
              }}
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-black/15 bg-white/40 px-7 text-sm font-semibold !text-neutral-900 transition duration-300 hover:bg-white hover:!text-black"
            >
              <span className="!text-neutral-900">
                Ver colecciones
              </span>
            </Link>

          </div>

        </div>

        {/* MUESTRAS HPL REALES + ANIME.JS */}
        <HeroLaminateMotion
          textures={
            textures
          }
        />

      </div>

    </section>
  );
}
