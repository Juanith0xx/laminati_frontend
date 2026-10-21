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

const STATUS_LABELS = {
  DRAFT:
    "Borrador",
  SENT:
    "Enviada",
  ACCEPTED:
    "Aceptada",
  REJECTED:
    "Rechazada",
  EXPIRED:
    "Vencida",
  CONVERTED:
    "Convertida",
  CANCELLED:
    "Cancelada",
};

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

  return Number.isNaN(
    date.getTime()
  )
    ? "—"
    : dateFormatter.format(
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

function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status ||
        ""
    ).toUpperCase();

  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
      {
        STATUS_LABELS[
          normalized
        ] ||
        normalized ||
        "—"
      }
    </span>
  );
}

export default function GerenciaProjectQuotationsPage() {
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
    summary: {},
    filters: {
      collections:
        [],
      statuses:
        [],
    },
    pagination: {},
    quotations:
      [],
  });

  const [
    selectedId,
    setSelectedId,
  ] = useState(
    null
  );

  const [
    selectedQuotation,
    setSelectedQuotation,
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
    status,
    setStatus,
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
        quotationId
      ) => {
        if (
          !quotationId
        ) {
          setSelectedQuotation(
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
              `/gerencia/cotizaciones-proyectos/${encodeURIComponent(
                quotationId
              )}`
            );

          setSelectedQuotation(
            response
              ?.quotation ||
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
              "/login?redirect=/gerencia/cotizaciones-proyectos"
            );

            return;
          }

          setDetailError(
            requestError
              ?.message ||
              "No fue posible cargar el detalle de la cotización."
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

  const loadData =
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
            status !==
            "ALL"
          ) {
            params.set(
              "status",
              status
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
              `/gerencia/cotizaciones-proyectos?${params.toString()}`
            );

          const quotations =
            Array.isArray(
              response
                ?.quotations
            )
              ? response.quotations
              : [];

          setData({
            summary:
              response
                ?.summary ||
              {},
            filters:
              response
                ?.filters ||
              {
                collections:
                  [],
                statuses:
                  [],
              },
            pagination:
              response
                ?.pagination ||
              {},
            quotations,
          });

          const currentExists =
            quotations.some(
              (
                item
              ) =>
                item.id ===
                selectedId
            );

          const nextId =
            currentExists
              ? selectedId
              : quotations[0]
                  ?.id ||
                null;

          setSelectedId(
            nextId
          );

          if (
            nextId
          ) {
            loadDetail(
              nextId
            );
          } else {
            setSelectedQuotation(
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
              "/login?redirect=/gerencia/cotizaciones-proyectos"
            );

            return;
          }

          setError(
            requestError
              ?.message ||
              "No fue posible cargar las Cotizaciones Proyectos Chile."
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
        selectedId,
        status,
        toDate,
      ]
    );

  useEffect(
    () => {
      loadData();
    },
    [
      loadData,
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
      status,
      toDate,
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

      setStatus(
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

  const selectQuotation =
    (
      id
    ) => {
      setSelectedId(
        id
      );

      loadDetail(
        id
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
                Cotizaciones Proyectos Chile
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Cotizaciones de proyectos con laminados ABET LAMINATI valorizadas exclusivamente con Precio Italia (USD).
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadData
              }
              disabled={
                loading
              }
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:border-black disabled:opacity-50"
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
            eyebrow="Proyectos cotizados"
            value={
              loading
                ? "—"
                : formatQuantity(
                    summary.total_quotations
                  )
            }
            detail="Cotizaciones tipo PROJECT con laminados ABET."
          />

          <SummaryCard
            eyebrow="Láminas cotizadas"
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
            eyebrow="Valor cotizaciones USD"
            value={
              loading
                ? "—"
                : formatUsd(
                    summary.total_value_usd
                  )
            }
            detail="Suma calculada sólo con Precio Italia."
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
              summary.quotations_with_unpriced_items
            )} proyectos contienen líneas sin Precio Italia`}
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
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.2fr)_minmax(180px,0.75fr)_minmax(150px,0.65fr)_repeat(2,minmax(145px,0.6fr))_auto] xl:items-end">
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
                placeholder="Cotización, proyecto, SKU o laminado…"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
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
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
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
                Estado
              </span>

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
              >
                <option value="ALL">
                  Todos
                </option>

                {(
                  data.filters
                    ?.statuses ||
                  []
                ).map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {
                        STATUS_LABELS[
                          item
                        ] ||
                        item
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
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
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
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
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

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.75fr)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Proyectos
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                  Cotizaciones registradas
                </h2>
              </div>

              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                {
                  loading
                    ? "Cargando…"
                    : `${formatQuantity(
                        pagination.total
                      )} cotizaciones`
                }
              </span>
            </div>

            {loading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

                <p className="mt-4 text-sm text-neutral-500">
                  Cargando cotizaciones…
                </p>
              </div>
            ) : data.quotations
                .length ===
              0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-base font-semibold text-neutral-900">
                  No encontramos cotizaciones de proyecto.
                </p>

                <p className="mt-2 text-sm text-neutral-500">
                  Ajusta los filtros para ampliar la búsqueda.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        <th className="px-6 py-4">
                          Cotización
                        </th>
                        <th className="px-5 py-4">
                          Proyecto
                        </th>
                        <th className="px-5 py-4">
                          Estado
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
                      {data.quotations.map(
                        (
                          quote
                        ) => (
                          <tr
                            key={
                              quote.id
                            }
                            onClick={() =>
                              selectQuotation(
                                quote.id
                              )
                            }
                            className={`cursor-pointer transition ${
                              quote.id ===
                              selectedId
                                ? "bg-neutral-100"
                                : "hover:bg-[#fafaf9]"
                            }`}
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold text-neutral-950">
                                {
                                  quote.quote_number
                                }
                              </p>

                              <p className="mt-1 text-xs text-neutral-400">
                                {
                                  formatDate(
                                    quote.created_at
                                  )
                                }
                              </p>
                            </td>

                            <td className="max-w-[300px] px-5 py-4">
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {
                                  quote.project_name
                                }
                              </p>

                              {quote.project_reference ? (
                                <p className="mt-1 truncate text-xs text-neutral-400">
                                  {
                                    quote.project_reference
                                  }
                                </p>
                              ) : null}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  quote.status
                                }
                              />
                            </td>

                            <td className="px-5 py-4 text-right font-semibold text-neutral-800">
                              {
                                formatQuantity(
                                  quote.total_units
                                )
                              }
                            </td>

                            <td className="px-6 py-4 text-right">
                              <p className="font-semibold text-neutral-950">
                                {
                                  formatUsd(
                                    quote.total_value_usd
                                  )
                                }
                              </p>

                              {quote.unpriced_items >
                              0 ? (
                                <p className="mt-1 text-[11px] font-medium text-amber-700">
                                  {
                                    quote.unpriced_items
                                  }{" "}
                                  sin valorizar
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-black/5 lg:hidden">
                  {data.quotations.map(
                    (
                      quote
                    ) => (
                      <button
                        key={
                          quote.id
                        }
                        type="button"
                        onClick={() =>
                          selectQuotation(
                            quote.id
                          )
                        }
                        className={`block w-full p-5 text-left ${
                          quote.id ===
                          selectedId
                            ? "bg-neutral-100"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-neutral-950">
                              {
                                quote.quote_number
                              }
                            </p>

                            <p className="mt-1 text-sm font-medium text-neutral-700">
                              {
                                quote.project_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                              {
                                formatDate(
                                  quote.created_at
                                )
                              }
                            </p>
                          </div>

                          <p className="font-semibold text-neutral-950">
                            {
                              formatUsd(
                                quote.total_value_usd
                              )
                            }
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4">
                          <StatusBadge
                            status={
                              quote.status
                            }
                          />

                          <span className="text-xs font-medium text-neutral-500">
                            {
                              formatQuantity(
                                quote.total_units
                              )
                            }{" "}
                            láminas
                          </span>
                        </div>
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
                    className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 disabled:opacity-40"
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
                    className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 disabled:opacity-40"
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
                  selectedQuotation
                    ?.quote_number ||
                  "Selecciona una cotización"
                }
              </h2>

              {selectedQuotation ? (
                <>
                  <p className="mt-2 font-semibold text-neutral-800">
                    {
                      selectedQuotation.project_name
                    }
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={
                        selectedQuotation.status
                      }
                    />

                    <span className="text-xs text-neutral-400">
                      {
                        formatDate(
                          selectedQuotation.created_at
                        )
                      }
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {detailLoading ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
              </div>
            ) : detailError ? (
              <div className="p-6 text-sm font-medium text-red-700">
                {
                  detailError
                }
              </div>
            ) : !selectedQuotation ? (
              <div className="p-6 text-sm leading-6 text-neutral-500">
                Selecciona una cotización para revisar sus laminados.
              </div>
            ) : (
              <>
                <div className="divide-y divide-black/5">
                  {(selectedQuotation.items || []).map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.project_line_id
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

                            <p className="mt-1 text-xs leading-5 text-neutral-400">
                              {
                                [
                                  item.collection,
                                  item.finish,
                                  item.format_label,
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
                            {item.italy_unit_price_usd ===
                            null ? (
                              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                Sin precio Italia
                              </span>
                            ) : (
                              <>
                                <p className="font-semibold text-neutral-950">
                                  {
                                    formatUsd(
                                      item.italy_total_usd
                                    )
                                  }
                                </p>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {
                                    formatQuantity(
                                      item.quantity
                                    )
                                  }{" "}
                                  ×{" "}
                                  {
                                    formatUsd(
                                      item.italy_unit_price_usd
                                    )
                                  }
                                </p>
                              </>
                            )}
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
                          selectedQuotation.total_units
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
                          selectedQuotation.total_value_usd
                        )
                      }
                    </span>
                  </div>

                  {selectedQuotation.unpriced_items >
                  0 ? (
                    <p className="mt-3 text-xs font-medium leading-5 text-amber-700">
                      {
                        selectedQuotation.unpriced_items
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
