import Link from "next/link";

import {
  getProducts,
} from "@/services/products.service";

function toNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function formatPrice(
  value
) {
  const number =
    toNumber(value);

  if (
    number === null
  ) {
    return "";
  }

  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  ).format(number);
}

function formatOfferDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )
    .format(date)
    .replace(
      /\./g,
      ""
    );
}

function normalizePromotions(
  product
) {
  let promotions =
    product
      ?.active_promotions;

  if (
    typeof promotions ===
    "string"
  ) {
    try {
      promotions =
        JSON.parse(
          promotions
        );
    } catch {
      promotions = [];
    }
  }

  if (
    !Array.isArray(
      promotions
    )
  ) {
    return [];
  }

  return promotions;
}

function getOfferDisplay(
  product
) {
  const promotions =
    normalizePromotions(
      product
    );

  const basePrice =
    toNumber(
      product
        ?.base_price
    );

  const quantityCandidates =
    [];

  const fixedCandidates =
    [];

  promotions.forEach(
    (
      promotion
    ) => {
      const type =
        String(
          promotion
            ?.promotion_type ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        type ===
        "QUANTITY_TIER"
      ) {
        let tiers =
          promotion?.tiers ||
          promotion
            ?.quantity_tiers ||
          [];

        if (
          typeof tiers ===
          "string"
        ) {
          try {
            tiers =
              JSON.parse(
                tiers
              );
          } catch {
            tiers = [];
          }
        }

        if (
          Array.isArray(
            tiers
          )
        ) {
          tiers.forEach(
            (
              tier
            ) => {
              const minQuantity =
                toNumber(
                  tier
                    ?.min_quantity
                );

              const unitPrice =
                toNumber(
                  tier
                    ?.unit_price
                );

              if (
                minQuantity !==
                  null &&
                minQuantity > 0 &&
                unitPrice !==
                  null
              ) {
                quantityCandidates.push({
                  type:
                    "QUANTITY_TIER",
                  minQuantity,
                  unitPrice,
                  endsAt:
                    promotion
                      ?.ends_at ||
                    null,
                  promotionName:
                    promotion
                      ?.name ||
                    null,
                });
              }
            }
          );
        }

        return;
      }

      if (
        type ===
        "FIXED_PRICE"
      ) {
        const price =
          toNumber(
            promotion
              ?.promotional_price
          );

        if (
          price !== null
        ) {
          fixedCandidates.push({
            type:
              "FIXED_PRICE",
            price,
            endsAt:
              promotion
                ?.ends_at ||
              null,
            promotionName:
              promotion
                ?.name ||
              null,
          });
        }
      }
    }
  );

  /*
   * Misma regla visual que ya usamos en catálogo/detalle:
   * si existe promoción por cantidad, se muestra esa modalidad
   * antes que la fija.
   */
  if (
    quantityCandidates
      .length > 0
  ) {
    quantityCandidates.sort(
      (
        left,
        right
      ) => {
        if (
          left.minQuantity !==
          right.minQuantity
        ) {
          return (
            left.minQuantity -
            right.minQuantity
          );
        }

        return (
          left.unitPrice -
          right.unitPrice
        );
      }
    );

    const offer =
      quantityCandidates[0];

    return {
      ...offer,
      basePrice,
      score:
        basePrice &&
        basePrice > 0
          ? Math.max(
              0,
              (
                basePrice -
                offer.unitPrice
              ) /
                basePrice
            )
          : 0,
    };
  }

  if (
    fixedCandidates
      .length > 0
  ) {
    fixedCandidates.sort(
      (
        left,
        right
      ) =>
        left.price -
        right.price
    );

    const offer =
      fixedCandidates[0];

    return {
      ...offer,
      basePrice,
      score:
        basePrice &&
        basePrice > 0
          ? Math.max(
              0,
              (
                basePrice -
                offer.price
              ) /
                basePrice
            )
          : 0,
    };
  }

  return null;
}

function getImageUrl(
  product
) {
  return (
    product
      ?.primary_image_url ||
    product
      ?.primary_image
      ?.card_url ||
    product
      ?.primary_image
      ?.detail_url ||
    null
  );
}

function getProductCode(
  product
) {
  return (
    product
      ?.internal_code ||
    product
      ?.sku ||
    ""
  );
}

function OfferCard({
  product,
  offer,
}) {
  const imageUrl =
    getImageUrl(
      product
    );

  const validUntil =
    formatOfferDate(
      offer?.endsAt
    );

  return (
    <article className="group flex h-full flex-col">

      <Link
        href={`/productos/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[1.65rem] bg-[#f3f2ee] ring-1 ring-emerald-200 transition duration-300 group-hover:-translate-y-1 group-hover:ring-emerald-300 group-hover:shadow-[0_18px_45px_rgba(0,0,0,0.09)]"
      >

        {imageUrl ? (
          <img
            src={
              imageUrl
            }
            alt={
              product
                ?.primary_image_alt ||
              product
                ?.name ||
              "Producto Laminati"
            }
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Laminati
            </span>
          </div>
        )}

        <span className="absolute right-4 top-4 inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50/95 px-3 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
          En oferta
        </span>

      </Link>

      <div className="flex flex-1 flex-col pt-4">

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          {product
            ?.collection ||
            product
              ?.category ||
            "Laminados"}
        </p>

        <Link
          href={`/productos/${product.slug}`}
          className="mt-2 block"
        >
          <h3 className="min-h-[3rem] line-clamp-2 text-base font-semibold leading-6 tracking-[-0.02em] text-neutral-950 transition group-hover:text-emerald-800">
            {getProductCode(
              product
            ) && (
              <span>
                {getProductCode(
                  product
                )}{" "}
              </span>
            )}

            {product.name}
          </h3>
        </Link>

        <div className="mt-3 min-h-[4.6rem]">

          {offer.type ===
          "QUANTITY_TIER" ? (
            <>
              {offer
                .basePrice !==
                null && (
                <p className="text-xs text-neutral-400 line-through">
                  {formatPrice(
                    offer
                      .basePrice
                  )}
                </p>
              )}

              <p className="mt-1 text-sm font-semibold text-emerald-700">
                Desde{" "}
                {offer.minQuantity}{" "}
                {offer
                  .minQuantity ===
                1
                  ? "lámina"
                  : "láminas"}
                {" · "}
                {formatPrice(
                  offer
                    .unitPrice
                )}{" "}
                c/u
              </p>
            </>
          ) : (
            <>
              {offer
                .basePrice !==
                null && (
                <p className="text-xs text-neutral-400 line-through">
                  {formatPrice(
                    offer
                      .basePrice
                  )}
                </p>
              )}

              <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-emerald-700">
                {formatPrice(
                  offer.price
                )}
              </p>
            </>
          )}

          {validUntil && (
            <p className="mt-1 text-[11px] font-medium text-neutral-400">
              Válido hasta{" "}
              {validUntil}
            </p>
          )}

        </div>

        <Link
          href={`/productos/${product.slug}`}
          className="mt-auto inline-flex h-11 items-center justify-between rounded-full border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        >
          Ver oferta
          <span>
            →
          </span>
        </Link>

      </div>

    </article>
  );
}

export default async function OffersSection() {
  let products = [];

  try {
    /*
     * Pedimos una muestra amplia de productos vendibles y filtramos
     * promociones activas que ya vienen en active_promotions.
     * De esta forma no necesitamos cambiar el backend.
     */
    const response =
      await getProducts({
        in_stock: true,
        limit: 60,
        sort: "featured",
      });

    const candidates =
      (
        response
          ?.products ||
        []
      )
        .filter(
          (
            product
          ) =>
            product
              ?.commercial_mode !==
              "PROJECT_ONLY"
        )
        .map(
          (
            product
          ) => ({
            product,
            offer:
              getOfferDisplay(
                product
              ),
          })
        )
        .filter(
          (
            item
          ) =>
            Boolean(
              item.offer
            )
        )
        .sort(
          (
            left,
            right
          ) =>
            (
              right
                .offer
                .score ||
              0
            ) -
            (
              left
                .offer
                .score ||
              0
            )
        );

    products =
      candidates.slice(
        0,
        4
      );
  } catch (error) {
    console.error(
      "Error cargando ofertas del home:",
      error
    );
  }

  if (
    products.length ===
    0
  ) {
    return null;
  }

  return (
    <section className="bg-[#f7faf8] py-16 sm:py-20 lg:py-28">

      <div className="site-container">

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between lg:mb-14">

          <div>

            <div className="mb-3 flex items-center gap-3">

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Ofertas Laminati
              </p>

              <span className="h-px w-10 bg-emerald-200" />

            </div>

            <h2 className="max-w-3xl text-3xl font-medium tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Oportunidades seleccionadas.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Láminas con precios especiales y promociones activas por tiempo limitado.
            </p>

          </div>

          <Link
            href="/productos"
            className="group flex w-fit items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
          >
            Ver catálogo

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">

          {products.map(
            (
              item
            ) => (
              <OfferCard
                key={
                  item
                    .product
                    .id
                }
                product={
                  item
                    .product
                }
                offer={
                  item.offer
                }
              />
            )
          )}

        </div>

      </div>

    </section>
  );
}
