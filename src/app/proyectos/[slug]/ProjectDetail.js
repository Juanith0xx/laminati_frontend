"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="m15 18-6-6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="m9 18 6-6-6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        strokeLinecap="round"
      />
    </svg>
  );
}


function getImageUrl(
  image,
  variant = "detail"
) {
  return (
    image?.urls?.[
      variant
    ] ||
    image?.urls?.detail ||
    image?.urls?.card ||
    image?.urls?.thumbnail ||
    image?.image_url ||
    image?.instagram_media_url ||
    null
  );
}


function formatCounter(
  value
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


function getProductDecorCode(
  product
) {
  const sku =
    String(
      product?.sku ||
      ""
    ).trim();

  const numericDecor =
    sku.match(
      /^(\d+)[A-Za-z]+$/
    );

  return (
    numericDecor?.[1] ||
    sku ||
    "—"
  );
}


function getProductDecorName(
  product
) {
  const rawName =
    String(
      product?.name ||
      ""
    ).trim();

  if (!rawName) {
    return "Producto Laminati";
  }

  const withoutFinish =
    rawName
      .split("|")[0]
      .trim();

  const decorCode =
    getProductDecorCode(
      product
    );

  if (
    decorCode &&
    decorCode !== "—"
  ) {
    return (
      withoutFinish
        .replace(
          new RegExp(
            `\\s+${decorCode.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}\\s*$`,
            "i"
          ),
          ""
        )
        .trim() ||
      withoutFinish
    );
  }

  return withoutFinish;
}


function getProductDecorImage(
  product
) {
  return (
    product?.primary_image_url ||
    product?.primary_image?.card_url ||
    product?.primary_image?.detail_url ||
    product?.primary_image?.image_url ||
    product?.card_url ||
    product?.thumbnail_url ||
    product?.image_url ||
    null
  );
}


function getProductDecorColor(
  product
) {
  const explicitColor =
    String(
      product?.color_hex ||
      product?.hex_color ||
      product?.color ||
      ""
    ).trim();

  if (
    /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(
      explicitColor
    )
  ) {
    return explicitColor;
  }

  const name =
    `${product?.name || ""} ${product?.color || ""}`
      .toLowerCase();

  const palette = [
    [
      /bianco|white|blanco/,
      "#F2EFE4",
    ],
    [
      /giallo|yellow|amarillo/,
      "#DCAA32",
    ],
    [
      /grigio|grey|gray|gris/,
      "#756B60",
    ],
    [
      /nero|black|negro/,
      "#252525",
    ],
    [
      /blu|bleu|blue|azul|azzurro/,
      "#547E9D",
    ],
    [
      /verde|green/,
      "#71805E",
    ],
    [
      /rosso|red|rojo/,
      "#A94B45",
    ],
    [
      /viola|purple|morado/,
      "#71587D",
    ],
    [
      /arancio|orange|naranj/,
      "#C77B40",
    ],
    [
      /rosa|pink/,
      "#C78E99",
    ],
    [
      /beige|sabbia|sahara/,
      "#C6B493",
    ],
    [
      /marron|brown|wengue|fondente/,
      "#69584B",
    ],
  ];

  const matched =
    palette.find(
      ([pattern]) =>
        pattern.test(
          name
        )
    );

  return (
    matched?.[1] ||
    "#D9D4C9"
  );
}


export default function ProjectDetail({
  project,
}) {
  const projectImages =
    Array.isArray(
      project.images
    )
      ? project.images
      : [];

  const galleryImages =
    useMemo(
      () => {
        const primary =
          projectImages.find(
            (
              image
            ) =>
              image.is_primary
          );

        const ordered = [
          ...(primary
            ? [
                primary,
              ]
            : []),
          ...projectImages.filter(
            (
              image
            ) =>
              image.id !==
              primary?.id
          ),
        ];

        const seen =
          new Set();

        const normalized =
          ordered
            .map(
              (
                image,
                index
              ) => {
                const detailUrl =
                  getImageUrl(
                    image,
                    "detail"
                  );

                const cardUrl =
                  getImageUrl(
                    image,
                    "card"
                  ) ||
                  detailUrl;

                const thumbnailUrl =
                  getImageUrl(
                    image,
                    "thumbnail"
                  ) ||
                  cardUrl;

                if (
                  !detailUrl ||
                  seen.has(
                    detailUrl
                  )
                ) {
                  return null;
                }

                seen.add(
                  detailUrl
                );

                return {
                  ...image,
                  detailUrl,
                  cardUrl,
                  thumbnailUrl,
                  galleryKey:
                    image.id ||
                    `${detailUrl}-${index}`,
                };
              }
            )
            .filter(
              Boolean
            );

        if (
          normalized.length ===
            0 &&
          project.cover_image_url
        ) {
          normalized.push({
            galleryKey:
              "cover-image",
            detailUrl:
              project.cover_image_url,
            cardUrl:
              project.cover_image_url,
            thumbnailUrl:
              project.cover_image_url,
            alt_text:
              project.title,
            caption:
              null,
            is_primary:
              true,
          });
        }

        return normalized;
      },
      [
        projectImages,
        project.cover_image_url,
        project.title,
      ]
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  const [
    lightboxOpen,
    setLightboxOpen,
  ] =
    useState(false);

  useEffect(
    () => {
      setActiveIndex(
        0
      );
    },
    [
      project.id,
      project.slug,
    ]
  );

  useEffect(
    () => {
      if (
        !lightboxOpen
      ) {
        return undefined;
      }

      const onKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setLightboxOpen(
              false
            );
          }

          if (
            event.key ===
              "ArrowLeft" &&
            galleryImages.length >
              1
          ) {
            setActiveIndex(
              (
                current
              ) =>
                current ===
                0
                  ? galleryImages.length -
                    1
                  : current -
                    1
            );
          }

          if (
            event.key ===
              "ArrowRight" &&
            galleryImages.length >
              1
          ) {
            setActiveIndex(
              (
                current
              ) =>
                current ===
                galleryImages.length -
                  1
                  ? 0
                  : current +
                    1
            );
          }
        };

      window.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    [
      lightboxOpen,
      galleryImages.length,
    ]
  );

  const activeImage =
    galleryImages[
      activeIndex
    ] ||
    galleryImages[0] ||
    null;

  const previewImages =
    useMemo(
      () => {
        if (
          galleryImages.length <=
          1
        ) {
          return [];
        }

        const items = [];

        for (
          let step = 1;
          step <= 4;
          step += 1
        ) {
          const index =
            (
              activeIndex +
              step
            ) %
            galleryImages.length;

          if (
            index ===
            activeIndex
          ) {
            break;
          }

          if (
            !items.some(
              (
                item
              ) =>
                item.index ===
                index
            )
          ) {
            items.push({
              index,
              image:
                galleryImages[
                  index
                ],
            });
          }
        }

        return items;
      },
      [
        activeIndex,
        galleryImages,
      ]
    );

  const products =
    Array.isArray(
      project.products
    )
      ? project.products
      : [];

  const goPrevious =
    () => {
      if (
        galleryImages.length <
        2
      ) {
        return;
      }

      setActiveIndex(
        (
          current
        ) =>
          current === 0
            ? galleryImages.length -
              1
            : current -
              1
      );
    };

  const goNext =
    () => {
      if (
        galleryImages.length <
        2
      ) {
        return;
      }

      setActiveIndex(
        (
          current
        ) =>
          current ===
          galleryImages.length -
            1
            ? 0
            : current +
              1
      );
    };

  return (
    <main
      className="bg-[#f4f1eb] text-[#151515]"
    >
      <section
        className="border-b border-black/[0.07]"
      >
        <div
          className="site-container py-6 sm:py-8"
        >
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-2 text-xs font-medium !text-black/50 transition hover:!text-black"
            style={{
              textDecoration:
                "none",
            }}
          >
            <BackIcon />
            Volver a proyectos
          </Link>
        </div>
      </section>

      <section
        className="site-container py-8 sm:py-10 lg:py-14"
      >
        <div
          className="grid gap-8 lg:grid-cols-[0.76fr_1.54fr] lg:items-stretch"
        >
          <div
            className="flex flex-col justify-center py-2 lg:pr-6"
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40"
            >
              {
                project.category ||
                "Proyecto"
              }
            </p>

            <h1
              className="mt-5 max-w-2xl text-[clamp(3.2rem,5.8vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.065em]"
            >
              {
                project.title
              }
            </h1>

            {project.short_description ? (
              <p
                className="mt-7 max-w-lg text-base leading-7 text-black/55 sm:text-lg sm:leading-8"
              >
                {
                  project.short_description
                }
              </p>
            ) : null}

            <div
              className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-black/[0.08] pt-6 sm:grid-cols-3"
            >
              <div>
                <p
                  className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35"
                >
                  Categoría
                </p>
                <p
                  className="mt-2 text-sm font-medium"
                >
                  {
                    project.category ||
                    "Proyecto"
                  }
                </p>
              </div>

              <div>
                <p
                  className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35"
                >
                  Ubicación
                </p>
                <p
                  className="mt-2 text-sm font-medium"
                >
                  {
                    project.location ||
                    "—"
                  }
                </p>
              </div>

              <div>
                <p
                  className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35"
                >
                  Año
                </p>
                <p
                  className="mt-2 text-sm font-medium"
                >
                  {
                    project.project_year ||
                    "—"
                  }
                </p>
              </div>
            </div>
          </div>

          {activeImage ? (
            <div
              className="relative min-h-[400px] overflow-hidden rounded-[1.65rem] bg-black/[0.04] sm:min-h-[500px] lg:min-h-[560px]"
            >
              <img
                src={
                  activeImage.detailUrl
                }
                alt={
                  activeImage.alt_text ||
                  project.title
                }
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div
                className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
              />

              <div
                className="absolute bottom-5 left-5 rounded-full bg-black/65 px-4 py-2 text-[10px] font-semibold tracking-[0.16em] text-white backdrop-blur-md"
              >
                {formatCounter(
                  activeIndex +
                    1
                )}
                {" / "}
                {formatCounter(
                  galleryImages.length
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setLightboxOpen(
                    true
                  )
                }
                className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/75"
                aria-label="Ver imagen en pantalla completa"
              >
                <ExpandIcon />
              </button>
            </div>
          ) : (
            <div
              className="flex min-h-[400px] items-center justify-center rounded-[1.65rem] border border-dashed border-black/[0.10] bg-white/30 px-8 text-center text-sm text-black/40 sm:min-h-[500px] lg:min-h-[560px]"
            >
              Este proyecto todavía no tiene fotografías publicadas.
            </div>
          )}
        </div>
      </section>

      {activeImage ? (
        <section
          className="site-container pb-14 sm:pb-16 lg:pb-20"
        >
          <div className="grid gap-3">
            {previewImages.length >
            0 ? (
              <div
                className="grid min-h-[420px] grid-cols-2 gap-3 sm:min-h-[520px] lg:min-h-[440px] lg:grid-cols-4"
              >
                {previewImages.map(
                  (
                    item,
                    previewIndex
                  ) => (
                    <button
                      key={
                        item.image.galleryKey
                      }
                      type="button"
                      onClick={() =>
                        setActiveIndex(
                          item.index
                        )
                      }
                      className={`group/preview relative overflow-hidden rounded-[1.25rem] bg-black/[0.04] text-left ${
                        previewImages.length ===
                          1
                          ? "col-span-2 row-span-2 lg:col-span-4 lg:row-span-1"
                          : previewImages.length ===
                              2
                            ? "row-span-2 lg:col-span-2 lg:row-span-1"
                            : previewImages.length ===
                                3 &&
                              previewIndex ===
                                0
                              ? "row-span-2 lg:col-span-2 lg:row-span-1"
                              : ""
                      }`}
                      aria-label={`Ver fotografía ${item.index + 1}`}
                    >
                      <img
                        src={
                          item.image.cardUrl
                        }
                        alt={
                          item.image.alt_text ||
                          `${project.title} ${item.index + 1}`
                        }
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/preview:scale-[1.035]"
                      />

                      <span
                        className="absolute inset-0 bg-black/0 transition group-hover/preview:bg-black/10"
                      />

                      <span
                        className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-[9px] font-semibold tracking-[0.14em] text-white opacity-0 backdrop-blur transition group-hover/preview:opacity-100"
                      >
                        {formatCounter(
                          item.index +
                            1
                        )}
                      </span>
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>

          {galleryImages.length >
          1 ? (
            <div
              className="mt-7 flex items-center gap-5"
            >
              <div
                className="scrollbar-none flex min-w-0 flex-1 gap-5 overflow-x-auto pb-2"
              >
                {galleryImages.map(
                  (
                    image,
                    index
                  ) => {
                    const active =
                      index ===
                      activeIndex;

                    return (
                      <button
                        key={
                          image.galleryKey
                        }
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            index
                          )
                        }
                        className={`shrink-0 border-b pb-3 text-[10px] font-semibold tracking-[0.16em] transition ${
                          active
                            ? "border-black text-black"
                            : "border-transparent text-black/35 hover:text-black/65"
                        }`}
                        aria-label={`Ir a fotografía ${index + 1}`}
                      >
                        {formatCounter(
                          index +
                            1
                        )}
                      </button>
                    );
                  }
                )}

                <span
                  className="my-auto h-px min-w-20 flex-1 bg-black/[0.10]"
                />
              </div>

              <div
                className="hidden items-center gap-1 sm:flex"
              >
                <button
                  type="button"
                  onClick={
                    goPrevious
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/[0.05]"
                  aria-label="Fotografía anterior"
                >
                  <ChevronLeftIcon />
                </button>

                <button
                  type="button"
                  onClick={
                    goNext
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/[0.05]"
                  aria-label="Fotografía siguiente"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        className="site-container py-16 sm:py-20 lg:py-24"
      >
        <div
          className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]"
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35"
            >
              El proyecto
            </p>

            <h2
              className="mt-4 max-w-md text-3xl font-medium leading-[1.05] tracking-[-0.045em] sm:text-4xl"
            >
              Diseño y materialidad aplicados a un espacio real.
            </h2>
          </div>

          <div
            className="max-w-3xl text-base leading-8 text-black/60"
          >
            {project.description ? (
              <p
                className="whitespace-pre-line"
              >
                {
                  project.description
                }
              </p>
            ) : (
              <p>
                Este proyecto presenta una aplicación real de superficies Laminati, seleccionadas por su carácter visual, rendimiento y capacidad de integrarse al lenguaje arquitectónico del espacio.
              </p>
            )}
          </div>
        </div>
      </section>

      {products.length >
      0 ? (
        <section
          className="border-y border-black/[0.07] bg-white"
        >
          <div
            className="site-container py-16 sm:py-20 lg:py-24"
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35"
              >
                Materiales
              </p>

              <h2
                className="mt-4 text-3xl font-medium leading-[1.05] tracking-[-0.045em] sm:text-4xl"
              >
                Productos utilizados.
              </h2>
            </div>

            <div
              className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-x-8"
            >
              {products.map(
                (
                  product
                ) => {
                  const decorImage =
                    getProductDecorImage(
                      product
                    );

                  const decorColor =
                    getProductDecorColor(
                      product
                    );

                  const decorCode =
                    getProductDecorCode(
                      product
                    );

                  const decorName =
                    getProductDecorName(
                      product
                    );

                  return (
                    <Link
                      key={
                        product.product_id
                      }
                      href={`/productos/${product.slug}`}
                      className="group/product block min-w-0 !text-inherit"
                      style={{
                        color:
                          "inherit",
                        textDecoration:
                          "none",
                      }}
                    >
                      <div
                        className="relative aspect-[0.78] w-full overflow-hidden rounded-[1.5rem] border border-black/[0.04] bg-black/[0.03]"
                        style={{
                          backgroundColor:
                            decorColor,
                        }}
                      >
                        {decorImage ? (
                          <img
                            src={
                              decorImage
                            }
                            alt={
                              product.name ||
                              `Decor ${decorCode}`
                            }
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/product:scale-[1.025]"
                          />
                        ) : null}

                        <span
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/85 text-black opacity-0 shadow-sm backdrop-blur transition group-hover/product:opacity-100"
                          aria-hidden="true"
                        >
                          <ArrowIcon />
                        </span>
                      </div>

                      <div
                        className="mt-4"
                      >
                        <h3
                          className="text-base leading-6 tracking-[-0.02em] text-black sm:text-[17px]"
                        >
                          <span
                            className="font-semibold"
                          >
                            {
                              decorCode
                            }
                          </span>
                          {" "}
                          <span
                            className="font-normal"
                          >
                            {
                              decorName
                            }
                          </span>
                        </h3>

                        {product.application_note ? (
                          <p
                            className="mt-1.5 text-sm leading-5 text-black/45"
                          >
                            {
                              product.application_note
                            }
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="site-container py-20 sm:py-24"
      >
        <div
          className="grid gap-10 rounded-[2rem] bg-[#191919] px-7 py-12 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-14 lg:py-16"
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40"
            >
              Tu proyecto
            </p>

            <h2
              className="mt-4 max-w-2xl text-3xl font-medium leading-[1.05] tracking-[-0.045em] sm:text-4xl lg:text-5xl"
            >
              Encuentra la superficie adecuada para tu próxima idea.
            </h2>
          </div>

          <Link
            href="/contacto"
            className="inline-flex h-12 w-fit items-center gap-3 rounded-full bg-white px-6 text-sm font-medium !text-black transition hover:bg-white/90"
            style={{
              color:
                "#000000",
              textDecoration:
                "none",
            }}
          >
            Cotizar proyecto
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {lightboxOpen &&
      activeImage ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de proyecto"
        >
          <button
            type="button"
            onClick={() =>
              setLightboxOpen(
                false
              )
            }
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Cerrar galería"
          >
            <CloseIcon />
          </button>

          <img
            src={
              activeImage.detailUrl
            }
            alt={
              activeImage.alt_text ||
              project.title
            }
            className="max-h-[88vh] max-w-[92vw] rounded-[1.25rem] object-contain"
          />

          {galleryImages.length >
          1 ? (
            <>
              <button
                type="button"
                onClick={
                  goPrevious
                }
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-7"
                aria-label="Fotografía anterior"
              >
                <ChevronLeftIcon />
              </button>

              <button
                type="button"
                onClick={
                  goNext
                }
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-7"
                aria-label="Fotografía siguiente"
              >
                <ChevronRightIcon />
              </button>

              <div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-[10px] font-semibold tracking-[0.16em] text-white backdrop-blur"
              >
                {formatCounter(
                  activeIndex +
                    1
                )}
                {" / "}
                {formatCounter(
                  galleryImages.length
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
