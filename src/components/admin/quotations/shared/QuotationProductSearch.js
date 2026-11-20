"use client";

import {
  useMemo,
  useState,
} from "react";

const FAMILY_FILTERS = [
  {
    code: "ALL",
    label: "Todos",
  },
  {
    code: "HPL",
    label: "HPL",
  },
  {
    code: "STRATIFICATO",
    label: "Stratificato",
  },
  {
    code: "MEG",
    label: "MEG",
  },
  {
    code: "LABGRADE",
    label: "Labgrade",
  },
  {
    code: "LABGRADE_PLUS",
    label: "Labgrade Plus",
  },
];

const FAMILY_BADGE = {
  HPL:
    "border-neutral-200 bg-neutral-100 text-neutral-700",
  STRATIFICATO:
    "border-violet-200 bg-violet-50 text-violet-700",
  MEG:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  LABGRADE:
    "border-sky-200 bg-sky-50 text-sky-700",
  LABGRADE_PLUS:
    "border-indigo-200 bg-indigo-50 text-indigo-700",
  SERVICE:
    "border-amber-200 bg-amber-50 text-amber-700",
};

function clean(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

function money(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
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

function getFamilyCode(
  product
) {
  const sku =
    clean(
      product?.sku
    ).toUpperCase();

  if (
    sku ===
    "FEX-DESPACHO"
  ) {
    return "SERVICE";
  }

  const code =
    clean(
      product
        ?.project_family_code ||
      product
        ?.project_family
        ?.code ||
      product
        ?.family
        ?.code
    ).toUpperCase();

  return code ||
    "HPL";
}

function getFamilyLabel(
  product
) {
  const code =
    getFamilyCode(
      product
    );

  const explicit =
    clean(
      product
        ?.project_family_name ||
      product
        ?.project_family
        ?.name ||
      product
        ?.family
        ?.name
    );

  if (explicit) {
    return explicit;
  }

  switch (code) {
    case "STRATIFICATO":
      return "Stratificato";
    case "MEG":
      return "MEG";
    case "LABGRADE":
      return "Labgrade";
    case "LABGRADE_PLUS":
      return "Labgrade Plus";
    case "SERVICE":
      return "Servicio";
    default:
      return "HPL";
  }
}

function getFinishes(
  product
) {
  const projectFinishes =
    Array.isArray(
      product
        ?.project_finishes
    )
      ? product
          .project_finishes
      : [];

  if (
    projectFinishes.length >
    0
  ) {
    return projectFinishes
      .map(
        (
          finish
        ) => ({
          name:
            clean(
              finish
                ?.name
            ),
          isDefault:
            finish
              ?.is_default ===
            true,
        })
      )
      .filter(
        (
          finish
        ) =>
          Boolean(
            finish.name
          )
      );
  }

  const finish =
    clean(
      product
        ?.finish
    );

  return finish
    ? [
        {
          name:
            finish,
          isDefault:
            true,
        },
      ]
    : [];
}

function getImageUrl(
  product
) {
  return (
    clean(
      product
        ?.primary_image_url
    ) ||
    clean(
      product
        ?.primary_image
        ?.card_url
    ) ||
    clean(
      product
        ?.image_url
    ) ||
    null
  );
}

function ProductResult({
  product,
  onSelect,
  actionLabel,
  disabled,
  compact,
}) {
  const familyCode =
    getFamilyCode(
      product
    );

  const familyLabel =
    getFamilyLabel(
      product
    );

  const finishes =
    getFinishes(
      product
    );

  const imageUrl =
    getImageUrl(
      product
    );

  const sku =
    clean(
      product?.sku
    );

  const internalCode =
    clean(
      product
        ?.internal_code
    );

  const brand =
    clean(
      product
        ?.brand
    );

  const available =
    Number(
      product
        ?.available_pos
    );

  const hasStockInfo =
    Number.isFinite(
      available
    );

  const isFex =
    sku
      .toUpperCase() ===
    "FEX-DESPACHO";

  const price =
    Number(
      product
        ?.base_price
    );

  return (
    <article
      className={`flex gap-3 rounded-[22px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.035)] ${
        compact
          ? "p-3"
          : "p-4"
      }`}
    >
      <div
        className={`shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-neutral-100 ${
          compact
            ? "h-14 w-14"
            : "h-20 w-20"
        }`}
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
              sku ||
              "Producto"
            }
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-neutral-300">
            ◇
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
              FAMILY_BADGE[
                familyCode
              ] ||
              FAMILY_BADGE
                .HPL
            }`}
          >
            {
              familyLabel
            }
          </span>

          {sku ? (
            <span className="text-xs font-semibold text-neutral-500">
              {sku}
            </span>
          ) : null}

          {internalCode &&
          internalCode !==
            sku ? (
            <span className="text-[11px] text-neutral-400">
              Código{" "}
              {
                internalCode
              }
            </span>
          ) : null}
        </div>

        <h3
          className={`mt-2 font-semibold text-neutral-950 ${
            compact
              ? "text-sm"
              : "text-[15px]"
          }`}
        >
          {
            product
              ?.name ||
            "Producto"
          }
        </h3>

        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500">
          {brand ? (
            <span>
              {brand}
            </span>
          ) : null}

          {finishes.length >
          0 ? (
            <span>
              {finishes
                .map(
                  (
                    finish
                  ) =>
                    finish
                      .name
                )
                .join(
                  " · "
                )}
            </span>
          ) : null}

          {product
            ?.technical_options_configured ===
          true ? (
            <span className="font-medium text-emerald-700">
              Opciones técnicas
            </span>
          ) : null}
        </div>

        {!compact ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {isFex ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                Precio según FEX
              </span>
            ) : null}

            {hasStockInfo ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  available >
                  0
                    ? "bg-neutral-100 text-neutral-600"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {available >
                0
                  ? `Stock ${available}`
                  : "Sin stock"}
              </span>
            ) : null}

            {Number.isFinite(
              price
            ) &&
            price >
              0 ? (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                {
                  money(
                    price
                  )
                }
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() =>
            onSelect?.(
              product
            )
          }
          disabled={
            disabled
          }
          className={`rounded-xl px-4 font-semibold transition ${
            compact
              ? "h-9 text-xs"
              : "h-10 text-sm"
          } ${
            disabled
              ? "cursor-not-allowed bg-neutral-200 text-neutral-400"
              : "bg-black text-white hover:bg-neutral-800"
          }`}
        >
          {
            actionLabel
          }
        </button>
      </div>
    </article>
  );
}

export default function QuotationProductSearch({
  query,
  onQueryChange,
  products = [],
  loading = false,
  error = "",
  onSelect,
  actionLabel = "Seleccionar",
  placeholder =
    "Buscar por nombre, SKU o código...",
  emptyMessage =
    "No se encontraron productos para esta búsqueda.",
  minQueryLength = 0,
  compact = false,
  showFamilyFilters = true,
  getDisabled,
  getActionLabel,
}) {
  const [
    family,
    setFamily,
  ] = useState(
    "ALL"
  );

  const normalizedQuery =
    clean(
      query
    );

  const visibleProducts =
    useMemo(
      () => {
        if (
          family ===
          "ALL"
        ) {
          return products;
        }

        return products.filter(
          (
            product
          ) =>
            getFamilyCode(
              product
            ) ===
            family
        );
      },
      [
        products,
        family,
      ]
    );

  const hasQuery =
    normalizedQuery
      .length >=
    minQueryLength;

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          ⌕
        </span>

        <input
          type="search"
          value={
            query
          }
          onChange={(
            event
          ) =>
            onQueryChange?.(
              event
                .target
                .value
            )
          }
          placeholder={
            placeholder
          }
          className={`w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black/30 focus:ring-4 focus:ring-black/[.04] ${
            compact
              ? "h-11"
              : "h-12"
          }`}
        />
      </div>

      {showFamilyFilters ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {FAMILY_FILTERS.map(
            (
              item
            ) => (
              <button
                key={
                  item.code
                }
                type="button"
                onClick={() =>
                  setFamily(
                    item.code
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  family ===
                  item.code
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-neutral-600 hover:border-black/20 hover:text-black"
                }`}
              >
                {
                  item.label
                }
              </button>
            )
          )}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {
            error
          }
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          Buscando productos...
        </div>
      ) : null}

      {!loading &&
      hasQuery &&
      products.length ===
        0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          {
            emptyMessage
          }
        </div>
      ) : null}

      {!loading &&
      visibleProducts.length >
        0 ? (
        <div
          className={`mt-3 grid gap-3 ${
            compact
              ? "grid-cols-1"
              : "grid-cols-1 xl:grid-cols-2"
          }`}
        >
          {visibleProducts.map(
            (
              product
            ) => (
              <ProductResult
                key={
                  product
                    ?.id ||
                  product
                    ?.product_id ||
                  product
                    ?.sku
                }
                product={
                  product
                }
                onSelect={
                  onSelect
                }
                actionLabel={
                  typeof getActionLabel ===
                  "function"
                    ? getActionLabel(
                        product
                      )
                    : actionLabel
                }
                disabled={
                  typeof getDisabled ===
                  "function"
                    ? Boolean(
                        getDisabled(
                          product
                        )
                      )
                    : false
                }
                compact={
                  compact
                }
              />
            )
          )}
        </div>
      ) : null}

      {!loading &&
      products.length >
        0 &&
      visibleProducts.length ===
        0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          No hay resultados de esta familia en la búsqueda actual.
        </div>
      ) : null}
    </div>
  );
}
