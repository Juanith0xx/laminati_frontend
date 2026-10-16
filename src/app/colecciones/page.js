import Link from "next/link";

import {
  getCatalogFilters,
  getProducts,
} from "@/services/products.service";

export const dynamic = "force-dynamic";

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


function getCollectionBrand(
  collection,
  products = []
) {
  return (
    collection?.brand ||
    collection?.brand_name ||
    products?.[0]?.brand ||
    products?.[0]?.brand_name ||
    "Abet Laminati"
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


function getVisualData(
  collection,
  collectionProducts
) {
  const explicitCollectionImage =
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
    explicitCollectionImage ||
    uniqueImages[0] ||
    null;

  const samples =
    uniqueImages.filter(
      (image) =>
        image !== background
    );

  return {
    background,

    sampleOne:
      samples[0] ||
      null,

    sampleTwo:
      samples[1] ||
      null,
  };
}


/* =========================================
   VISUALES DE TARJETA
========================================= */

const fallbackGradients = [
  "from-[#d8cbb8] via-[#aa9276] to-[#594639]",
  "from-[#d1cec7] via-[#8e8a82] to-[#393733]",
  "from-[#899086] via-[#4d554d] to-[#1f241f]",
  "from-[#c2ad95] via-[#806b59] to-[#382d25]",
  "from-[#b99f7d] via-[#78614c] to-[#30251e]",
  "from-[#c8c4bc] via-[#8e8981] to-[#403d39]",
];


function CollectionVisual({
  collection,
  collectionProducts,
  index,
}) {
  const {
    background,
    sampleOne,
    sampleTwo,
  } = getVisualData(
    collection,
    collectionProducts
  );

  const variant =
    index % 6;

  return (
    <>
      {/* FONDO */}
      {background ? (
        <img
          src={background}
          alt=""
          aria-hidden="true"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover

            scale-[1.015]

            transition-transform
            duration-700
            ease-out

            group-hover:scale-[1.075]
          "
        />
      ) : (
        <div
          className={`
            absolute
            inset-0

            bg-gradient-to-br

            ${
              fallbackGradients[
                index %
                fallbackGradients.length
              ]
            }
          `}
        />
      )}

      {/* DESENFOQUE EDITORIAL */}
      <div
        className="
          absolute
          inset-0

          bg-white/[0.02]

          transition
          duration-500

          group-hover:bg-transparent
        "
      />

      {/* =====================================
          COMPOSICIONES DE LÁMINAS
      ===================================== */}

      {sampleOne &&
        variant === 0 && (
          <>
            <div
              className="
                absolute
                left-[10%]
                top-[14%]

                h-[31%]
                w-[76%]

                rotate-[-7deg]
                overflow-hidden
                rounded-[0.75rem]

                border
                border-white/15

                bg-neutral-200

                shadow-[0_28px_55px_rgba(0,0,0,0.32)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-y-2

                group-hover:
                rotate-[-4deg]

                group-hover:
                scale-[1.035]
              "
            >
              <img
                src={sampleOne}
                alt=""
                aria-hidden="true"
                className="
                  h-full
                  w-full
                  object-cover
                "
              />

              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  left-[18%]
                  top-[25%]

                  h-[26%]
                  w-[68%]

                  rotate-[5deg]
                  overflow-hidden
                  rounded-[0.7rem]

                  border
                  border-white/10

                  shadow-[0_20px_42px_rgba(0,0,0,0.30)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  translate-x-2

                  group-hover:
                  rotate-[2deg]
                "
              >
                <img
                  src={sampleTwo}
                  alt=""
                  aria-hidden="true"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            )}
          </>
        )}

      {sampleOne &&
        variant === 1 && (
          <>
            <div
              className="
                absolute
                -right-[8%]
                top-[9%]

                h-[51%]
                w-[67%]

                rotate-[8deg]
                overflow-hidden
                rounded-[1.05rem]

                border
                border-white/10

                shadow-[0_28px_60px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-x-3

                group-hover:
                rotate-[4deg]
              "
            >
              <img
                src={sampleOne}
                alt=""
                aria-hidden="true"
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  -left-[10%]
                  top-[25%]

                  h-[35%]
                  w-[64%]

                  rotate-[-9deg]
                  overflow-hidden
                  rounded-[0.9rem]

                  border
                  border-white/10

                  shadow-[0_22px_45px_rgba(0,0,0,0.28)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  translate-x-4

                  group-hover:
                  rotate-[-5deg]
                "
              >
                <img
                  src={sampleTwo}
                  alt=""
                  aria-hidden="true"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            )}
          </>
        )}

      {sampleOne &&
        variant === 2 && (
          <div
            className="
              absolute
              left-[17%]
              top-[8%]

              h-[56%]
              w-[68%]

              origin-bottom

              -rotate-[3deg]
              overflow-hidden
              rounded-t-[1.4rem]
              rounded-b-[0.55rem]

              border
              border-white/10

              shadow-[0_30px_65px_rgba(0,0,0,0.35)]

              transition-all
              duration-700
              ease-out

              group-hover:
              -translate-y-3

              group-hover:
              rotate-0

              group-hover:
              scale-[1.035]
            "
          >
            <img
              src={sampleOne}
              alt=""
              aria-hidden="true"
              className="
                h-full
                w-full
                object-cover
              "
            />

            <div
              className="
                absolute
                inset-x-0
                bottom-0

                h-1/3

                bg-gradient-to-t
                from-black/25
                to-transparent
              "
            />
          </div>
        )}

      {sampleOne &&
        variant === 3 && (
          <>
            <div
              className="
                absolute
                left-[8%]
                top-[17%]

                h-[37%]
                w-[83%]

                rotate-[2deg]
                overflow-hidden
                rounded-[0.6rem]

                border
                border-white/10

                shadow-[0_26px_55px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-y-2

                group-hover:
                rotate-0
              "
            >
              <img
                src={sampleOne}
                alt=""
                aria-hidden="true"
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  right-[11%]
                  top-[27%]

                  h-[31%]
                  w-[63%]

                  rotate-[-7deg]
                  overflow-hidden
                  rounded-[0.55rem]

                  border
                  border-white/10

                  shadow-[0_18px_40px_rgba(0,0,0,0.26)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  -translate-x-2

                  group-hover:
                  rotate-[-3deg]
                "
              >
                <img
                  src={sampleTwo}
                  alt=""
                  aria-hidden="true"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            )}
          </>
        )}

      {sampleOne &&
        variant === 4 && (
          <div
            className="
              absolute
              left-[13%]
              top-[9%]

              h-[55%]
              w-[73%]

              overflow-hidden
              rounded-[40%_40%_1.25rem_1.25rem]

              border
              border-white/10

              shadow-[0_28px_58px_rgba(0,0,0,0.30)]

              transition-all
              duration-700
              ease-out

              group-hover:
              -translate-y-3

              group-hover:
              scale-[1.03]
            "
          >
            <img
              src={sampleOne}
              alt=""
              aria-hidden="true"
              className="
                h-full
                w-full
                object-cover
              "
            />
          </div>
        )}

      {sampleOne &&
        variant === 5 && (
          <>
            <div
              className="
                absolute
                -left-[3%]
                top-[10%]

                h-[51%]
                w-[53%]

                rotate-[-5deg]
                overflow-hidden
                rounded-[1rem]

                border
                border-white/10

                shadow-[0_25px_50px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                translate-x-3

                group-hover:
                rotate-[-2deg]
              "
            >
              <img
                src={sampleOne}
                alt=""
                aria-hidden="true"
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  right-[4%]
                  top-[17%]

                  h-[43%]
                  w-[54%]

                  rotate-[6deg]
                  overflow-hidden
                  rounded-[1rem]

                  border
                  border-white/10

                  shadow-[0_25px_50px_rgba(0,0,0,0.30)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  -translate-x-3

                  group-hover:
                  rotate-[2deg]
                "
              >
                <img
                  src={sampleTwo}
                  alt=""
                  aria-hidden="true"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            )}
          </>
        )}

      {/* SOMBRA + LECTURA DEL TEXTO */}
      <div
        className="
          absolute
          inset-0

          bg-gradient-to-t
          from-black/80
          via-black/10
          to-black/10

          transition
          duration-500

          group-hover:
          from-black/75
        "
      />

      {/* VELO LATERAL */}
      <div
        className="
          absolute
          inset-0

          bg-gradient-to-r
          from-black/5
          via-transparent
          to-black/5
        "
      />

      {/* DESTELLO */}
      <div
        className="
          pointer-events-none

          absolute
          -left-[90%]
          top-[-20%]

          h-[145%]
          w-[55%]

          rotate-[18deg]

          bg-gradient-to-r
          from-transparent
          via-white/12
          to-transparent

          transition-transform
          duration-[1100ms]
          ease-out

          group-hover:
          translate-x-[430%]
        "
      />

      {/* ACABADO LIMPIO SIN BORDE INTERIOR */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[inherit]
        "
      />
    </>
  );
}


/* =========================================
   PAGE
========================================= */

export default async function CollectionsPage() {
  let collections = [];
  let products = [];

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

    collections =
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

    products =
      extractProducts(
        productsResponse
      );
  } catch (error) {
    console.error(
      "Error cargando colecciones:",
      error
    );
  }

  const productsByCollection =
    buildProductsByCollection(
      products
    );

  return (
    <main className="bg-white">

      {/* =====================================
          HERO / INTRO
      ===================================== */}

      <section className="border-b border-black/[0.05] bg-[#f7f6f2]">

        <div className="site-container py-14 sm:py-16 lg:py-20">

          <nav className="flex items-center gap-2 text-xs text-neutral-400">
            <Link
              href="/"
              className="transition hover:text-neutral-900"
            >
              Inicio
            </Link>

            <span>/</span>

            <span className="text-neutral-600">
              Colecciones
            </span>
          </nav>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-400">
                Laminati
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-medium tracking-[-0.045em] text-neutral-950 sm:text-5xl lg:text-6xl">
                Colecciones para transformar espacios.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500 sm:text-base">
                Explora nuestras colecciones de laminados, colores, maderas, texturas y superficies para proyectos de arquitectura, mobiliario e interiorismo.
              </p>

            </div>

            <Link
              href="/productos?category=laminados"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-neutral-700 transition hover:text-black"
            >
              Ver todos los laminados
              <span>
                →
              </span>
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================
          GRID DE COLECCIONES
      ===================================== */}

      <section className="site-container py-12 sm:py-16 lg:py-20">

        {collections.length ===
        0 ? (
          <div className="rounded-[1.75rem] border border-black/[0.06] bg-neutral-50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No hay colecciones disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">

            {collections.map(
              (
                collection,
                index
              ) => {

                const collectionSlug =
                  String(
                    collection?.slug ||
                    ""
                  )
                    .trim()
                    .toLowerCase();

                const collectionProducts =
                  productsByCollection.get(
                    collectionSlug
                  ) ||
                  [];

                const brand =
                  getCollectionBrand(
                    collection,
                    collectionProducts
                  );

                return (
                  <Link
                    key={
                      collection.id
                    }
                    href={`/productos?collection=${encodeURIComponent(
                      collection.slug
                    )}`}
                    className="
                      group
                      relative
                      block

                      rounded-[2rem]

                      !border-0
                      !outline-none
                      !ring-0
                      !shadow-none

                      focus:!outline-none
                      focus:!ring-0
                      focus-visible:!outline-none
                      focus-visible:!ring-0
                    "
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      background: "transparent",
                    }}
                  >

                    <article
                      style={{
                        border: "none",
                        outline: "none",
                      }}
                      className="
                        relative

                        aspect-[4/5]
                        sm:aspect-[3/4]

                        overflow-hidden

                        rounded-[2rem]

                        !border-0
                        !outline-none
                        !ring-0

                        bg-neutral-900

                        shadow-[0_14px_34px_rgba(0,0,0,0.07)]

                        transition-all
                        duration-500
                        ease-out

                        group-hover:
                        -translate-y-1.5

                        group-hover:
                        shadow-[0_24px_56px_rgba(0,0,0,0.12)]
                      "
                    >

                      <CollectionVisual
                        collection={
                          collection
                        }
                        collectionProducts={
                          collectionProducts
                        }
                        index={
                          index
                        }
                      />

                      {/* NÚMERO */}
                      <div
                        className="
                          absolute
                          left-5
                          top-5

                          z-20

                          text-[10px]
                          font-semibold

                          tracking-[0.2em]

                          text-white/65
                        "
                      >
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      {/* CTA */}
                      <div
                        className="
                          absolute
                          right-5
                          top-5

                          z-20

                          flex
                          h-10
                          w-10

                          items-center
                          justify-center

                          rounded-full

                          border
                          border-white/25

                          bg-white/10

                          text-white

                          backdrop-blur-md

                          transition-all
                          duration-300

                          group-hover:
                          scale-110

                          group-hover:
                          border-white

                          group-hover:
                          bg-white

                          group-hover:
                          text-black
                        "
                      >
                        ↗
                      </div>

                      {/* TEXTO */}
                      <div
                        className="
                          absolute
                          bottom-0
                          left-0
                          right-0

                          z-20

                          p-5
                          sm:p-6
                        "
                      >

                        <p
                          className="
                            text-[10px]
                            font-semibold

                            uppercase

                            tracking-[0.2em]

                            text-white/60
                          "
                        >
                          Colección
                        </p>

                        <h2
                          className="
                            mt-2

                            max-w-[95%]

                            text-[1.35rem]
                            font-medium

                            leading-[1.12]

                            tracking-[-0.04em]

                            text-white

                            sm:text-2xl
                          "
                        >
                          {
                            collection.name
                          }
                        </h2>

                        <div className="mt-3 flex items-center justify-between gap-4">

                          <p
                            className="
                              truncate

                              text-xs

                              text-white/60
                            "
                          >
                            {
                              brand
                            }
                          </p>

                          {collectionProducts.length >
                            0 && (
                            <span
                              className="
                                shrink-0

                                rounded-full

                                border
                                border-white/15

                                bg-white/[0.08]

                                px-2.5
                                py-1

                                text-[9px]
                                font-medium

                                uppercase

                                tracking-[0.12em]

                                text-white/60

                                backdrop-blur
                              "
                            >
                              {
                                collectionProducts.length
                              }{" "}
                              {
                                collectionProducts.length ===
                                1
                                  ? "producto"
                                  : "productos"
                              }
                            </span>
                          )}

                        </div>

                      </div>

                    </article>

                  </Link>
                );
              }
            )}

          </div>
        )}

      </section>

    </main>
  );
}
