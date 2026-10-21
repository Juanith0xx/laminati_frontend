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
        3,
    }
  );

const dateFormatter =
  new Intl.DateTimeFormat(
    "es-CL",
    {
      day:
        "2-digit",
      month:
        "2-digit",
      year:
        "numeric",
      timeZone:
        "America/Santiago",
    }
  );

const formatUsd = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? usdFormatter.format(
        number
      )
    : "—";
};

const formatQuantity = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? quantityFormatter.format(
        number
      )
    : "0";
};

const formatDate = (
  value
) => {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return dateFormatter.format(
    date
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

function PriceCell({
  price,
  total,
  quantity,
}) {
  const missing =
    price ===
      null ||
    price ===
      undefined;

  if (
    missing
  ) {
    return (
      <div>
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
          Sin precio Italia
        </span>

        <p className="mt-2 text-xs text-neutral-400">
          {
            formatQuantity(
              quantity
            )
          }{" "}
          láminas
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-semibold text-neutral-950">
        {
          formatUsd(
            total
          )
        }
      </p>

      <p className="mt-1 text-xs text-neutral-400">
        {
          formatQuantity(
            quantity
          )
        }{" "}
        ×{" "}
        {
          formatUsd(
            price
          )
        }
      </p>
    </div>
  );
}

export default function GerenciaSalesPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    detailError,
    setDetailError,
  ] = useState(
    ""
  );

  const [
    data,
    setData,
  ] = useState({
    summary: {
      total_orders:
        0,
      total_units:
        0,
      priced_units:
        0,
      unpriced_units:
        0,
      total_value_usd:
        0,
      orders_with_unpriced_items:
        0,
    },
    filters: {
      collections:
        [],
    },
    pagination: {
      page:
        1,
      total:
        0,
      total_pages:
        0,
      has_next_page:
        false,
      has_previous_page:
        false,
    },
    sales: [],
  });

  const [
    selectedSaleId,
    setSelectedSaleId,
  ] = useState(
    null
  );

  const [
    selectedSale,
    setSelectedSale,
  ] = useState(
    null
  );

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
    fromDate,
    setFromDate,
  ] = useState(
    ""
  );

  const [
    toDate,
    setToDate,
  ] = useState(
    ""
  );

  const [
    page,
    setPage,
  ] = useState(
    1
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
            (
              item
            ) => ({
              name:
                String(
                  item?.name ||
                    ""
                ).trim(),
              value:
                String(
                  item?.slug ||
                    item?.name ||
                    ""
                ).trim(),
            })
          )
          .filter(
            (
              item
            ) => {
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
          );
      },
      [
        data.filters
          ?.collections,
      ]
    );

  const loadDetail =
    useCallback(
      async (
        saleId
      ) => {
        if (
          !saleId
        ) {
          setSelectedSale(
            null
          );

          return;
        }

        try {
          setDetailLoading(
            true
          );

          setDetailError(
            ""
          );

          const response =
            await apiRequest(
              `/gerencia/ventas/${encodeURIComponent(
                saleId
              )}`
            );

          setSelectedSale(
            response?.sale ||
              null
          );
        } catch (
          requestError
        ) {
          if (
            requestError?.status ===
              401 ||
            requestError?.status ===
              403
          ) {
            router.replace(
              "/login?redirect=/gerencia/ventas"
            );

            return;
          }

          setDetailError(
            requestError
              ?.message ||
              "No fue posible cargar el detalle de la venta."
          );
        } finally {
          setDetailLoading(
            false
          );
        }
      },
      [
        router,
      ]
    );

  const loadSales =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const params =
            new URLSearchParams();

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (
            collection !==
            "ALL"
          ) {
            params.set(
              "collection",
              collection
            );
          }

          if (
            fromDate
          ) {
            params.set(
              "from",
              fromDate
            );
          }

          if (
            toDate
          ) {
            params.set(
              "to",
              toDate
            );
          }

          params.set(
            "page",
            String(
              page
            )
          );

          params.set(
            "limit",
            "20"
          );

          const response =
            await apiRequest(
              `/gerencia/ventas?${params.toString()}`
            );

          const sales =
            Array.isArray(
              response?.sales
            )
              ? response.sales
              : [];

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
            pagination:
              response?.pagination ||
              {
                page:
                  1,
                total:
                  0,
                total_pages:
                  0,
                has_next_page:
                  false,
                has_previous_page:
                  false,
              },
            sales,
          });

          const currentStillExists =
            sales.some(
              (
                sale
              ) =>
                sale.id ===
                selectedSaleId
            );

          const nextSelectedId =
            currentStillExists
              ? selectedSaleId
              : sales[0]?.id ||
                null;

          setSelectedSaleId(
            nextSelectedId
          );

          if (
            nextSelectedId
          ) {
            loadDetail(
              nextSelectedId
            );
          } else {
            setSelectedSale(
              null
            );
          }
        } catch (
          requestError
        ) {
          if (
            requestError?.status ===
              401 ||
            requestError?.status ===
              403
          ) {
            router.replace(
              "/login?redirect=/gerencia/ventas"
            );

            return;
          }

          setError(
            requestError
              ?.message ||
              "No fue posible cargar las Ventas Distribución Chile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        collection,
        fromDate,
        loadDetail,
        page,
        router,
        search,
        selectedSaleId,
        toDate,
      ]
    );

  useEffect(
    () => {
      loadSales();
    },
    [
      loadSales,
    ]
  );

  useEffect(
    () => {
      setPage(
        1
      );
    },
    [
      collection,
      fromDate,
      search,
      toDate,
    ]
  );

  const selectSale =
    (
      saleId
    ) => {
      setSelectedSaleId(
        saleId
      );

      loadDetail(
        saleId
      );
    };

  const clearFilters =
    () => {
      setSearch(
        ""
      );
      setCollection(
        "ALL"
      );
      setFromDate(
        ""
      );
      setToDate(
        ""
      );
      setPage(
        1
      );
    };

  const summary =
    data.summary ||
    {};

  const pagination =
    data.pagination ||
    {};

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Gerencia Italia
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Ventas Distribución Chile
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Pedidos completados de productos ABET LAMINATI valorizados exclusivamente con el Precio Italia correspondiente a la venta.
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadSales
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
            eyebrow="Pedidos vendidos"
            value={
              loading
                ? "—"
                : formatQuantity(
                    summary.total_orders
                  )
            }
            detail="Pedidos completados con laminados ABET."
          />

          <SummaryCard
            eyebrow="Láminas vendidas"
            value={
              loading
                ? "—"
                : `${formatQuantity(
                    summary.total_units
                  )} láminas`
            }
            detail={`${formatQuantity(
              summary.priced_units
            )} láminas valorizadas en USD`}
          />

          <SummaryCard
            eyebrow="Valor ventas USD"
            value={
              loading
                ? "—"
                : formatUsd(
                    summary.total_value_usd
                  )
            }
            detail="Valor calculado únicamente con Precio Italia."
          />

          <SummaryCard
            eyebrow="Sin valorizar"
            value={
              loading
                ? "—"
                : `${formatQuantity(
                    summary.unpriced_units
                  )} láminas`
            }
            detail={`${formatQuantity(
              summary.orders_with_unpriced_items
            )} pedidos contienen líneas sin Precio Italia`}
            warning={
              Number(
                summary.unpriced_units ||
                  0
              ) >
              0
            }
          />
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,1.4fr)_minmax(190px,0.8fr)_repeat(2,minmax(160px,0.7fr))_auto] lg:items-end">
            <label>
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
                placeholder="Pedido, SKU o laminado…"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </label>

            <label>
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
                  (
                    item
                  ) => (
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

            <label>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Desde
              </span>

              <input
                type="date"
                value={
                  fromDate
                }
                onChange={(
                  event
                ) =>
                  setFromDate(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              />
            </label>

            <label>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Hasta
              </span>

              <input
                type="date"
                value={
                  toDate
                }
                onChange={(
                  event
                ) =>
                  setToDate(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              />
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

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Ventas
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                  Pedidos registrados
                </h2>
              </div>

              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                {
                  loading
                    ? "Cargando…"
                    : `${formatQuantity(
                        pagination.total
                      )} pedidos`
                }
              </span>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

                <p className="mt-4 text-sm text-neutral-500">
                  Cargando ventas…
                </p>
              </div>
            ) : data.sales.length ===
              0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-base font-semibold text-neutral-900">
                  No encontramos ventas con estos filtros.
                </p>

                <p className="mt-2 text-sm text-neutral-500">
                  Ajusta la búsqueda o el rango de fechas.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        <th className="px-6 py-4">
                          Pedido
                        </th>
                        <th className="px-5 py-4">
                          Laminados
                        </th>
                        <th className="px-5 py-4 text-right">
                          Cantidad
                        </th>
                        <th className="px-6 py-4 text-right">
                          Total USD
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-black/5">
                      {data.sales.map(
                        (
                          sale
                        ) => {
                          const selected =
                            sale.id ===
                            selectedSaleId;

                          const preview =
                            sale.items_preview ||
                            [];

                          const names =
                            preview
                              .slice(
                                0,
                                2
                              )
                              .map(
                                (
                                  item
                                ) =>
                                  `${item.sku || ""} ${item.name || ""}`.trim()
                              )
                              .join(
                                " · "
                              );

                          return (
                            <tr
                              key={
                                sale.id
                              }
                              onClick={() =>
                                selectSale(
                                  sale.id
                                )
                              }
                              className={`cursor-pointer transition ${
                                selected
                                  ? "bg-neutral-100"
                                  : "hover:bg-[#fafaf9]"
                              }`}
                            >
                              <td className="px-6 py-4">
                                <p className="font-semibold text-neutral-950">
                                  {
                                    sale.order_number
                                  }
                                </p>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {
                                    formatDate(
                                      sale.created_at
                                    )
                                  }
                                </p>
                              </td>

                              <td className="max-w-[330px] px-5 py-4">
                                <p className="truncate text-sm font-medium text-neutral-800">
                                  {
                                    names ||
                                    "—"
                                  }
                                </p>

                                {preview.length >
                                2 ? (
                                  <p className="mt-1 text-xs text-neutral-400">
                                    +{
                                      preview.length -
                                      2
                                    } líneas
                                  </p>
                                ) : null}
                              </td>

                              <td className="px-5 py-4 text-right font-semibold text-neutral-800">
                                {
                                  formatQuantity(
                                    sale.total_units
                                  )
                                }
                              </td>

                              <td className="px-6 py-4 text-right">
                                <p className="font-semibold text-neutral-950">
                                  {
                                    formatUsd(
                                      sale.total_value_usd
                                    )
                                  }
                                </p>

                                {sale.unpriced_items >
                                0 ? (
                                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                                    {
                                      sale.unpriced_items
                                    }{" "}
                                    sin valorizar
                                  </p>
                                ) : null}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-black/5 lg:hidden">
                  {data.sales.map(
                    (
                      sale
                    ) => (
                      <button
                        key={
                          sale.id
                        }
                        type="button"
                        onClick={() =>
                          selectSale(
                            sale.id
                          )
                        }
                        className={`block w-full p-5 text-left ${
                          sale.id ===
                          selectedSaleId
                            ? "bg-neutral-100"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-neutral-950">
                              {
                                sale.order_number
                              }
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                              {
                                formatDate(
                                  sale.created_at
                                )
                              }
                            </p>
                          </div>

                          <p className="font-semibold text-neutral-950">
                            {
                              formatUsd(
                                sale.total_value_usd
                              )
                            }
                          </p>
                        </div>

                        <p className="mt-3 text-sm text-neutral-600">
                          {
                            formatQuantity(
                              sale.total_units
                            )
                          }{" "}
                          láminas ·{" "}
                          {
                            sale.item_count
                          }{" "}
                          líneas
                        </p>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-black/5 px-5 py-4 sm:px-6">
                  <button
                    type="button"
                    disabled={
                      !pagination.has_previous_page
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            current -
                              1,
                            1
                          )
                      )
                    }
                    className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <span className="text-xs font-medium text-neutral-500">
                    Página{" "}
                    {
                      pagination.page ||
                      1
                    }{" "}
                    de{" "}
                    {
                      pagination.total_pages ||
                      1
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      !pagination.has_next_page
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          current +
                          1
                      )
                    }
                    className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="self-start rounded-[1.75rem] border border-black/5 bg-white shadow-sm xl:sticky xl:top-[92px]">
            <div className="border-b border-black/5 px-5 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Detalles
              </p>

              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                {
                  selectedSale
                    ?.order_number ||
                  "Selecciona un pedido"
                }
              </h2>

              {selectedSale ? (
                <p className="mt-1 text-xs text-neutral-400">
                  {
                    formatDate(
                      selectedSale.created_at
                    )
                  }
                </p>
              ) : null}
            </div>

            {detailLoading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

                <p className="mt-4 text-sm text-neutral-500">
                  Cargando detalle…
                </p>
              </div>
            ) : detailError ? (
              <div className="p-5 text-sm font-medium text-red-700 sm:p-6">
                {
                  detailError
                }
              </div>
            ) : !selectedSale ? (
              <div className="p-6 text-sm leading-6 text-neutral-500">
                Selecciona un pedido para revisar sus laminados y valorización USD.
              </div>
            ) : (
              <>
                <div className="divide-y divide-black/5">
                  {(selectedSale.items || []).map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.order_item_id
                        }
                        className="p-5 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                              {
                                item.sku ||
                                "—"
                              }
                            </span>

                            <p className="mt-2 font-semibold leading-5 text-neutral-950">
                              {
                                item.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                              {
                                [
                                  item.collection,
                                  item.finish,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  ) ||
                                "Laminado"
                              }
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <PriceCell
                              price={
                                item.italy_unit_price_usd
                              }
                              total={
                                item.italy_total_usd
                              }
                              quantity={
                                item.quantity
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="border-t border-black/5 bg-[#fafaf9] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-neutral-500">
                      Cantidad total
                    </span>

                    <span className="font-semibold text-neutral-950">
                      {
                        formatQuantity(
                          selectedSale.total_units
                        )
                      }{" "}
                      láminas
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-neutral-900">
                      Total
                    </span>

                    <span className="text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                      {
                        formatUsd(
                          selectedSale.total_value_usd
                        )
                      }
                    </span>
                  </div>

                  {selectedSale.unpriced_items >
                  0 ? (
                    <p className="mt-3 text-xs font-medium leading-5 text-amber-700">
                      {
                        selectedSale.unpriced_items
                      }{" "}
                      líneas todavía no cuentan con Precio Italia válido.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
