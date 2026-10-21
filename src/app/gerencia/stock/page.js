"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  apiRequest,
} from "@/services/api";

const usdFormatter =
  new Intl.NumberFormat(
    "es-CL",
    {
      style:
        "currency",
      currency:
        "USD",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  );

const quantityFormatter =
  new Intl.NumberFormat(
    "es-CL",
    {
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        2,
    }
  );

const formatUsd = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "—";
  }

  return usdFormatter.format(
    number
  );
};

const formatQuantity = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "0";
  }

  return quantityFormatter.format(
    number
  );
};

function SummaryCard({
  eyebrow,
  value,
  detail,
  warning = false,
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {
          eyebrow
        }
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-[1.75rem]">
        {
          value
        }
      </p>

      <p
        className={`mt-2 text-xs leading-5 ${
          warning
            ? "text-amber-700"
            : "text-neutral-500"
        }`}
      >
        {
          detail
        }
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-base font-semibold text-neutral-900">
        No encontramos productos con estos filtros.
      </p>

      <p className="mt-2 text-sm text-neutral-500">
        Ajusta la búsqueda o limpia los filtros para volver a mostrar el inventario.
      </p>
    </div>
  );
}

function PriceBadge({
  value,
}) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        Sin precio Italia
      </span>
    );
  }

  return (
    <span className="font-semibold text-neutral-950">
      {
        formatUsd(
          value
        )
      }
    </span>
  );
}

export default function GerenciaStockPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    data,
    setData,
  ] = useState({
    summary: {
      total_products:
        0,
      products_with_stock:
        0,
      products_with_italy_price:
        0,
      products_without_italy_price:
        0,
      total_stock_units:
        0,
      priced_stock_units:
        0,
      unpriced_stock_units:
        0,
      total_stock_value_usd:
        0,
    },
    filters: {
      collections:
        [],
    },
    products: [],
  });

  const [
    search,
    setSearch,
  ] = useState(
    ""
  );

  const [
    collection,
    setCollection,
  ] = useState(
    "ALL"
  );

  const [
    priceStatus,
    setPriceStatus,
  ] = useState(
    "ALL"
  );

  const [
    stockStatus,
    setStockStatus,
  ] = useState(
    "ALL"
  );

  const loadStock =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await apiRequest(
              "/gerencia/stock"
            );

          setData({
            summary:
              response?.summary ||
              {},
            filters:
              response?.filters ||
              {
                collections:
                  [],
              },
            products:
              Array.isArray(
                response?.products
              )
                ? response.products
                : [],
          });
        } catch (
          requestError
        ) {
          if (
            requestError?.status ===
            401
          ) {
            router.replace(
              "/login?redirect=/gerencia/stock"
            );

            return;
          }

          if (
            requestError?.status ===
            403
          ) {
            setError(
              "Tu perfil no tiene permisos para consultar este módulo."
            );

            return;
          }

          setError(
            requestError?.message ||
              "No fue posible cargar el Stock Distribución Chile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        router,
      ]
    );

  useEffect(
    () => {
      loadStock();
    },
    [
      loadStock,
    ]
  );

  const collectionOptions =
    useMemo(
      () => {
        const seen =
          new Set();

        return (
          data.filters
            ?.collections ||
          []
        )
          .map(
            (item) => {
              const name =
                String(
                  item?.name ||
                    ""
                ).trim();

              const value =
                String(
                  item?.slug ||
                    name
                ).trim();

              return {
                name,
                value,
              };
            }
          )
          .filter(
            (item) => {
              if (
                !item.name ||
                !item.value ||
                seen.has(
                  item.value
                )
              ) {
                return false;
              }

              seen.add(
                item.value
              );

              return true;
            }
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
                "es",
                {
                  sensitivity:
                    "base",
                }
              )
          );
      },
      [
        data.filters
          ?.collections,
      ]
    );

  useEffect(
    () => {
      if (
        collection ===
        "ALL"
      ) {
        return;
      }

      const exists =
        collectionOptions.some(
          (item) =>
            item.value ===
            collection
        );

      if (!exists) {
        setCollection(
          "ALL"
        );
      }
    },
    [
      collection,
      collectionOptions,
    ]
  );

  const filteredProducts =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return data.products.filter(
          (product) => {
            const hasPrice =
              product.italy_price_usd !==
                null &&
              product.italy_price_usd !==
                undefined;

            const stock =
              Number(
                product.stock_quantity ||
                  0
              );

            const matchesSearch =
              !normalizedSearch ||
              [
                product.sku,
                product.name,
                product.collection,
                product.finish,
                product.texture,
                product.color,
              ]
                .filter(
                  Boolean
                )
                .some(
                  (value) =>
                    String(
                      value
                    )
                      .toLowerCase()
                      .includes(
                        normalizedSearch
                      )
                );

            const matchesCollection =
              collection ===
                "ALL" ||
              product.collection_slug ===
                collection ||
              product.collection ===
                collection;

            const matchesPrice =
              priceStatus ===
                "ALL" ||
              (
                priceStatus ===
                  "WITH_PRICE" &&
                hasPrice
              ) ||
              (
                priceStatus ===
                  "WITHOUT_PRICE" &&
                !hasPrice
              );

            const matchesStock =
              stockStatus ===
                "ALL" ||
              (
                stockStatus ===
                  "WITH_STOCK" &&
                stock > 0
              ) ||
              (
                stockStatus ===
                  "WITHOUT_STOCK" &&
                stock <= 0
              );

            return (
              matchesSearch &&
              matchesCollection &&
              matchesPrice &&
              matchesStock
            );
          }
        );
      },
      [
        collection,
        data.products,
        priceStatus,
        search,
        stockStatus,
      ]
    );

  const clearFilters =
    () => {
      setSearch(
        ""
      );
      setCollection(
        "ALL"
      );
      setPriceStatus(
        "ALL"
      );
      setStockStatus(
        "ALL"
      );
    };

  const summary =
    data.summary ||
    {};

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1450px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Gerencia Italia
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Stock Distribución Chile
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Inventario de laminados valorizado exclusivamente con el Precio Italia vigente en USD.
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadStock
              }
              disabled={
                loading
              }
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {
                loading
                  ? "Actualizando…"
                  : "Actualizar"
              }
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            eyebrow="Stock total"
            value={
              loading
                ? "—"
                : `${formatQuantity(
                    summary.total_stock_units
                  )} láminas`
            }
            detail={`${formatQuantity(
              summary.products_with_stock
            )} productos con stock`}
          />

          <SummaryCard
            eyebrow="Valor stock USD"
            value={
              loading
                ? "—"
                : formatUsd(
                    summary.total_stock_value_usd
                  )
            }
            detail="Sólo incluye productos con Precio Italia configurado."
          />

          <SummaryCard
            eyebrow="Productos valorizados"
            value={
              loading
                ? "—"
                : formatQuantity(
                    summary.products_with_italy_price
                  )
            }
            detail={`${formatQuantity(
              summary.priced_stock_units
            )} láminas con valorización USD`}
          />

          <SummaryCard
            eyebrow="Sin precio Italia"
            value={
              loading
                ? "—"
                : formatQuantity(
                    summary.products_without_italy_price
                  )
            }
            detail={`${formatQuantity(
              summary.unpriced_stock_units
            )} láminas pendientes de valorizar`}
            warning={
              Number(
                summary.products_without_italy_price ||
                  0
              ) > 0
            }
          />
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,0.7fr))_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Buscar
              </span>

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="SKU, laminado, colección o acabado…"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Colección
              </span>

              <select
                value={
                  collection
                }
                onChange={(
                  event
                ) =>
                  setCollection(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              >
                <option value="ALL">
                  Todas
                </option>

                {collectionOptions.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Precio Italia
              </span>

              <select
                value={
                  priceStatus
                }
                onChange={(
                  event
                ) =>
                  setPriceStatus(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              >
                <option value="ALL">
                  Todos
                </option>
                <option value="WITH_PRICE">
                  Con precio
                </option>
                <option value="WITHOUT_PRICE">
                  Sin precio
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Stock
              </span>

              <select
                value={
                  stockStatus
                }
                onChange={(
                  event
                ) =>
                  setStockStatus(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              >
                <option value="ALL">
                  Todos
                </option>
                <option value="WITH_STOCK">
                  Con stock
                </option>
                <option value="WITHOUT_STOCK">
                  Sin stock
                </option>
              </select>
            </label>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        {error ? (
          <section className="mt-5 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {
              error
            }
          </section>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-black/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Inventario
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                Laminados registrados
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
              {
                loading
                  ? "Cargando…"
                  : `${formatQuantity(
                      filteredProducts.length
                    )} de ${formatQuantity(
                      data.products.length
                    )} productos`
              }
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

              <p className="mt-4 text-sm text-neutral-500">
                Cargando inventario…
              </p>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      <th className="px-6 py-4">
                        Laminado
                      </th>
                      <th className="px-5 py-4">
                        Colección
                      </th>
                      <th className="px-5 py-4">
                        Acabado
                      </th>
                      <th className="px-5 py-4 text-right">
                        Stock
                      </th>
                      <th className="px-5 py-4 text-right">
                        Precio Italia
                      </th>
                      <th className="px-6 py-4 text-right">
                        Valor stock
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black/5">
                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                          className="transition hover:bg-[#fafaf9]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex min-w-[64px] justify-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                                {
                                  product.sku ||
                                  "—"
                                }
                              </span>

                              <div>
                                <p className="font-semibold text-neutral-950">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {product.color ||
                                    product.texture ||
                                    "Laminado"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-neutral-600">
                            {
                              product.collection ||
                              "—"
                            }
                          </td>

                          <td className="px-5 py-4 text-sm text-neutral-600">
                            <p>
                              {
                                product.finish ||
                                "—"
                              }
                            </p>

                            {product.thickness_mm !==
                            null ? (
                              <p className="mt-1 text-xs text-neutral-400">
                                {formatQuantity(
                                  product.thickness_mm
                                )} mm
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="font-semibold text-neutral-950">
                              {formatQuantity(
                                product.stock_quantity
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-sm">
                            <PriceBadge
                              value={
                                product.italy_price_usd
                              }
                            />
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-neutral-950">
                              {product.stock_value_usd ===
                              null
                                ? "—"
                                : formatUsd(
                                    product.stock_value_usd
                                  )}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-black/5 lg:hidden">
                {filteredProducts.map(
                  (product) => (
                    <article
                      key={
                        product.id
                      }
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                              {
                                product.sku ||
                                "—"
                              }
                            </span>

                            <span className="text-xs text-neutral-400">
                              {
                                product.collection ||
                                "Sin colección"
                              }
                            </span>
                          </div>

                          <h3 className="mt-2 text-sm font-semibold text-neutral-950">
                            {
                              product.name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-neutral-500">
                            {product.finish ||
                              "Sin acabado"}
                            {product.thickness_mm !==
                            null
                              ? ` · ${formatQuantity(
                                  product.thickness_mm
                                )} mm`
                              : ""}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                            Stock
                          </p>

                          <p className="mt-1 text-lg font-semibold text-neutral-950">
                            {formatQuantity(
                              product.stock_quantity
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#f7f7f5] p-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                            Precio Italia
                          </p>

                          <div className="mt-2 text-sm">
                            <PriceBadge
                              value={
                                product.italy_price_usd
                              }
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                            Valor stock
                          </p>

                          <p className="mt-2 text-sm font-semibold text-neutral-950">
                            {product.stock_value_usd ===
                            null
                              ? "—"
                              : formatUsd(
                                  product.stock_value_usd
                                )}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </section>

        <p className="mt-4 px-2 text-xs leading-5 text-neutral-400">
          El valor de stock se calcula como Stock × Precio Italia vigente. Los productos sin Precio Italia se muestran, pero no se incluyen en la valorización total USD.
        </p>
      </div>
    </div>
  );
}
