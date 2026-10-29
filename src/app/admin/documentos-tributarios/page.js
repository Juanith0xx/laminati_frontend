"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/services/api";

const PAGE_SIZE = 20;

function money(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function integer(value) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(date);
}

function dateInputLabel(value, emptyLabel) {
  if (!value) return emptyLabel;

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) {
    return emptyLabel;
  }

  return `${day}/${month}/${year}`;
}

function documentLabel(value) {
  if (value === "FACTURA") {
    return "Factura";
  }

  if (value === "BOLETA") {
    return "Boleta";
  }

  return value || "Documento";
}

function sourceLabel(value) {
  return value === "LAMINATIWORD"
    ? "Laminatiword"
    : "Relbase";
}

function siiLabel(document) {
  const status = String(
    document?.sii_status || ""
  )
    .trim()
    .toLowerCase();

  if (status === "accepted") {
    return "Aceptado";
  }

  if (
    status === "cancel" ||
    status === "cancelled"
  ) {
    return "Anulado";
  }

  if (status === "rejected") {
    return "Rechazado";
  }

  return (
    document?.sii_status_name ||
    document?.sii_status ||
    "Sin estado"
  );
}

function Icon({ name, className = "h-4 w-4" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 1 0 1 4" />
        <path d="M20 4v7h-7" />
      </svg>
    );
  }

  if (name === "invoice") {
    return (
      <svg {...common}>
        <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4M8 11h8M8 15h5" />
      </svg>
    );
  }

  if (name === "receipt") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (name === "database") {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    );
  }

  if (name === "arrow-left") {
    return (
      <svg {...common}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    );
  }

  if (name === "arrow-right") {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }

  if (name === "external") {
    return (
      <svg {...common}>
        <path d="M14 5h5v5M10 14 19 5" />
        <path d="M19 13v6H5V5h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function SummaryCard({
  icon,
  iconClass,
  title,
  value,
  helper,
}) {
  return (
    <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-black">
            {value}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {helper}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
    </article>
  );
}

function Pill({ kind = "neutral", children }) {
  const classes = {
    neutral:
      "border-neutral-200 bg-neutral-50 text-neutral-600",
    success:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    danger:
      "border-rose-100 bg-rose-50 text-rose-700",
    warning:
      "border-amber-100 bg-amber-50 text-amber-700",
    info:
      "border-blue-100 bg-blue-50 text-blue-700",
    dark: "border-black bg-black text-white",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes[kind] || classes.neutral}`}
    >
      {children}
    </span>
  );
}

function sourcePillKind(source) {
  return source === "LAMINATIWORD"
    ? "dark"
    : "info";
}

function siiPillKind(document) {
  const status = String(
    document?.sii_status || ""
  ).toLowerCase();

  if (status === "accepted") {
    return "success";
  }

  if (
    status === "cancel" ||
    status === "cancelled"
  ) {
    return "neutral";
  }

  if (status === "rejected") {
    return "danger";
  }

  return "warning";
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-neutral-100 py-3 last:border-0">
      <dt className="text-xs text-neutral-400">
        {label}
      </dt>
      <dd className="max-w-[220px] text-right text-xs font-medium text-neutral-900">
        {children || "—"}
      </dd>
    </div>
  );
}

function buildFilterParams({
  documentType,
  sourceSystem,
  siiStatus,
  from,
  to,
  search,
  page,
  includePagination = true,
}) {
  const params = new URLSearchParams();

  if (documentType !== "ALL") {
    params.set(
      "document_type",
      documentType
    );
  }

  if (sourceSystem !== "ALL") {
    params.set(
      "source_system",
      sourceSystem
    );
  }

  if (siiStatus !== "ALL") {
    params.set("sii_status", siiStatus);
  }

  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (search) params.set("search", search);

  if (includePagination) {
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
  }

  return params.toString();
}

export default function TaxDocumentsHistoryPage() {
  const router = useRouter();

  const [documents, setDocuments] =
    useState([]);
  const [summary, setSummary] =
    useState(null);
  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      total_pages: 1,
    });

  const [documentType, setDocumentType] =
    useState("ALL");
  const [sourceSystem, setSourceSystem] =
    useState("ALL");
  const [siiStatus, setSiiStatus] =
    useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] =
    useState(null);
  const [detail, setDetail] = useState(null);

  const [loading, setLoading] =
    useState(true);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
      setSelectedId(null);
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [query]);

  const filterState = useMemo(
    () => ({
      documentType,
      sourceSystem,
      siiStatus,
      from,
      to,
      search,
      page,
    }),
    [
      documentType,
      sourceSystem,
      siiStatus,
      from,
      to,
      search,
      page,
    ]
  );

  const handleApiError = useCallback(
    (requestError) => {
      if (requestError?.status === 401) {
        router.replace("/login");
        return;
      }

      setError(
        requestError?.message ||
          "No fue posible cargar el histórico tributario."
      );
    },
    [router]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const listQuery = buildFilterParams(
          filterState
        );
        const summaryQuery = buildFilterParams({
          ...filterState,
          includePagination: false,
        });

        const [listResponse, summaryResponse] =
          await Promise.all([
            apiRequest(
              `/admin/integrations/relbase/dtes/history?${listQuery}`,
              { signal: controller.signal }
            ),
            apiRequest(
              `/admin/integrations/relbase/dtes/history/summary${
                summaryQuery
                  ? `?${summaryQuery}`
                  : ""
              }`,
              { signal: controller.signal }
            ),
          ]);

        if (!active) return;

        const nextDocuments =
          listResponse?.data?.documents || [];

        setDocuments(nextDocuments);
        setPagination(
          listResponse?.data?.pagination || {
            page,
            limit: PAGE_SIZE,
            total: 0,
            total_pages: 1,
          }
        );
        setSummary(
          summaryResponse?.data?.summary || null
        );

        setSelectedId((current) => {
          if (
            current &&
            nextDocuments.some(
              (item) =>
                item.relbase_document_id ===
                current
            )
          ) {
            return current;
          }

          return (
            nextDocuments[0]
              ?.relbase_document_id || null
          );
        });
      } catch (requestError) {
        if (
          requestError?.name !==
          "AbortError"
        ) {
          handleApiError(requestError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [filterState, handleApiError, page]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadDetail() {
      setDetailLoading(true);

      try {
        const response = await apiRequest(
          `/admin/integrations/relbase/dtes/history/${encodeURIComponent(
            selectedId
          )}`,
          { signal: controller.signal }
        );

        if (active) {
          setDetail(
            response?.data?.document || null
          );
        }
      } catch (requestError) {
        if (
          requestError?.name !==
          "AbortError"
        ) {
          handleApiError(requestError);
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedId, handleApiError]);

  const resetFilters = () => {
    setDocumentType("ALL");
    setSourceSystem("ALL");
    setSiiStatus("ALL");
    setFrom("");
    setTo("");
    setQuery("");
    setSearch("");
    setPage(1);
    setSelectedId(null);
  };

  const summaryValue = summary || {
    total_documents: 0,
    facturas: 0,
    boletas: 0,
    laminatiword: 0,
    relbase: 0,
    sii: {},
    amounts: {},
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <header className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
              <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
              <div className="px-6 py-6 sm:px-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Laminati · Backoffice
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
                Documentos tributarios
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-neutral-500">
                Histórico consolidado de facturas y boletas emitidas desde Laminatiword y directamente desde Relbase.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["ALL", "Todos"],
                  ["FACTURA", "Facturas"],
                  ["BOLETA", "Boletas"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setDocumentType(id);
                      setPage(1);
                      setSelectedId(null);
                    }}
                    className={`inline-flex h-10 items-center rounded-full px-5 text-xs font-medium transition ${
                      documentType === id
                        ? "bg-black !text-white"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:border-black"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
                          </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon="database"
                iconClass="bg-neutral-100 text-neutral-700"
                title="Documentos"
                value={integer(
                  summaryValue.total_documents
                )}
                helper={`${integer(
                  summaryValue.laminatiword
                )} Laminatiword · ${integer(
                  summaryValue.relbase
                )} Relbase`}
              />
              <SummaryCard
                icon="invoice"
                iconClass="bg-blue-50 text-blue-600"
                title="Facturas"
                value={integer(
                  summaryValue.facturas
                )}
                helper="Factura electrónica · 33"
              />
              <SummaryCard
                icon="receipt"
                iconClass="bg-violet-50 text-violet-600"
                title="Boletas"
                value={integer(
                  summaryValue.boletas
                )}
                helper="Boleta electrónica · 39"
              />
              <SummaryCard
                icon="check"
                iconClass="bg-emerald-50 text-emerald-600"
                title="Total emitido"
                value={money(
                  summaryValue.amounts?.total
                )}
                helper={`${integer(
                  summaryValue.sii?.accepted
                )} aceptados por SII`}
              />
            </section>

            <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(280px,1.4fr)_160px_160px_minmax(280px,1fr)_150px] xl:items-end">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold text-neutral-700">
                    Buscar documentos
                  </span>
                  <span className="relative block">
                    <Icon
                      name="search"
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      value={query}
                      onChange={(event) =>
                        setQuery(event.target.value)
                      }
                      placeholder="Buscar folio, cliente, RUT u orden..."
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold text-neutral-700">
                    Origen
                  </span>
                  <select
                    value={sourceSystem}
                    onChange={(event) => {
                      setSourceSystem(
                        event.target.value
                      );
                      setPage(1);
                      setSelectedId(null);
                    }}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-800 outline-none transition focus:border-black"
                  >
                    <option value="ALL">
                      Todos los orígenes
                    </option>
                    <option value="LAMINATIWORD">
                      Laminatiword
                    </option>
                    <option value="RELBASE">
                      Relbase
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold text-neutral-700">
                    Estado SII
                  </span>
                  <select
                    value={siiStatus}
                    onChange={(event) => {
                      setSiiStatus(
                        event.target.value
                      );
                      setPage(1);
                      setSelectedId(null);
                    }}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-800 outline-none transition focus:border-black"
                  >
                    <option value="ALL">
                      Todos los estados
                    </option>
                    <option value="accepted">
                      Aceptado
                    </option>
                    <option value="cancel">
                      Anulado
                    </option>
                    <option value="rejected">
                      Rechazado
                    </option>
                  </select>
                </label>

                <div className="block">
                  <span className="mb-2 block text-[11px] font-semibold text-neutral-700">
                    Rango de fechas
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="relative flex h-12 cursor-pointer items-center rounded-2xl border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-700 transition hover:border-neutral-300 focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/5">
                      <Icon
                        name="calendar"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                      />
                      <span
                        className={from ? "text-neutral-800" : "text-neutral-400"}
                      >
                        {dateInputLabel(from, "Desde")}
                      </span>
                      <input
                        type="date"
                        value={from}
                        onChange={(event) => {
                          setFrom(event.target.value);
                          setPage(1);
                          setSelectedId(null);
                        }}
                        aria-label="Fecha desde"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>

                    <label className="relative flex h-12 cursor-pointer items-center rounded-2xl border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-700 transition hover:border-neutral-300 focus-within:border-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950/5">
                      <Icon
                        name="calendar"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                      />
                      <span
                        className={to ? "text-neutral-800" : "text-neutral-400"}
                      >
                        {dateInputLabel(to, "Hasta")}
                      </span>
                      <input
                        type="date"
                        value={to}
                        onChange={(event) => {
                          setTo(event.target.value);
                          setPage(1);
                          setSelectedId(null);
                        }}
                        aria-label="Fecha hasta"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-neutral-950 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/5"
                >
                  <Icon
                    name="refresh"
                    className="h-4 w-4"
                  />
                  Limpiar filtros
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
                <p className="text-xs text-neutral-400">
                  {integer(pagination.total)} documentos encontrados
                </p>
              </div>

              {error ? (
                <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="p-10 text-center text-sm text-neutral-400">
                  Cargando documentos tributarios...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-10 text-center text-sm text-neutral-400">
                  No hay documentos para los filtros seleccionados.
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[980px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          <th className="px-4 py-3">Documento</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Origen</th>
                          <th className="px-4 py-3">Estado SII</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((document) => (
                          <tr
                            key={document.id}
                            onClick={() =>
                              setSelectedId(
                                document.relbase_document_id
                              )
                            }
                            className={`cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 ${
                              selectedId ===
                              document.relbase_document_id
                                ? "bg-neutral-100/80"
                                : "bg-white"
                            }`}
                          >
                            <td className="px-4 py-3 align-top">
                              <p className="text-xs font-semibold text-neutral-950">
                                {documentLabel(
                                  document.document_type
                                )} {document.folio ? `N° ${document.folio}` : ""}
                              </p>
                              <p className="mt-1 text-[10px] text-neutral-400">
                                SII {document.sii_code || "—"} · ID {document.relbase_document_id}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="max-w-[230px] truncate text-xs font-medium text-neutral-900">
                                {document.customer_name ||
                                  (document.relbase_customer_id
                                    ? `Cliente Relbase #${document.relbase_customer_id}`
                                    : "Sin cliente asociado")}
                              </p>
                              <p className="mt-1 text-[10px] text-neutral-400">
                                {document.customer_rut ||
                                  document.order_number ||
                                  "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <Pill
                                kind={sourcePillKind(
                                  document.source_system
                                )}
                              >
                                {sourceLabel(
                                  document.source_system
                                )}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <Pill
                                kind={siiPillKind(
                                  document
                                )}
                              >
                                {siiLabel(document)}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 text-xs text-neutral-600">
                              {dateTime(
                                document.issued_at
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-semibold text-neutral-950">
                              {money(
                                document.total_amount
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-neutral-100 md:hidden">
                    {documents.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() =>
                          setSelectedId(
                            document.relbase_document_id
                          )
                        }
                        className={`w-full px-4 py-4 text-left transition ${
                          selectedId ===
                          document.relbase_document_id
                            ? "bg-neutral-100/80"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-950">
                              {documentLabel(
                                document.document_type
                              )} N° {document.folio || "—"}
                            </p>
                            <p className="mt-1 max-w-[230px] truncate text-xs text-neutral-500">
                              {document.customer_name ||
                                "Cliente no disponible"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {money(
                              document.total_amount
                            )}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill
                            kind={sourcePillKind(
                              document.source_system
                            )}
                          >
                            {sourceLabel(
                              document.source_system
                            )}
                          </Pill>
                          <Pill
                            kind={siiPillKind(
                              document
                            )}
                          >
                            {siiLabel(document)}
                          </Pill>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-4">
                    <p className="text-xs text-neutral-400">
                      Página {pagination.page} de {Math.max(
                        pagination.total_pages || 1,
                        1
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => {
                          setPage((current) =>
                            Math.max(1, current - 1)
                          );
                          setSelectedId(null);
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon
                          name="arrow-left"
                          className="h-3.5 w-3.5"
                        />
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={
                          page >=
                          (pagination.total_pages || 1)
                        }
                        onClick={() => {
                          setPage((current) =>
                            current + 1
                          );
                          setSelectedId(null);
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Siguiente
                        <Icon
                          name="arrow-right"
                          className="h-3.5 w-3.5"
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <div className="border-b border-neutral-100 px-5 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Detalle tributario
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                  {detail
                    ? `${documentLabel(
                        detail.document_type
                      )} N° ${detail.folio || "—"}`
                    : "Selecciona un documento"}
                </h2>
                {detail ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill
                      kind={sourcePillKind(
                        detail.source_system
                      )}
                    >
                      {sourceLabel(
                        detail.source_system
                      )}
                    </Pill>
                    <Pill
                      kind={siiPillKind(detail)}
                    >
                      {siiLabel(detail)}
                    </Pill>
                  </div>
                ) : null}
              </div>

              {detailLoading ? (
                <div className="p-8 text-center text-sm text-neutral-400">
                  Cargando detalle...
                </div>
              ) : detail ? (
                <div className="p-5">
                  <div className="rounded-2xl bg-neutral-950 p-5 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                      Total documento
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] !text-white">
                      {money(detail.total_amount)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-white/50">
                          Neto
                        </p>
                        <p className="mt-1 font-medium !text-white">
                          {money(detail.net_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/50">
                          IVA
                        </p>
                        <p className="mt-1 font-medium !text-white">
                          {money(detail.tax_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4">
                    <DetailRow label="Cliente">
                      {detail.customer_name || "—"}
                    </DetailRow>
                    <DetailRow label="RUT">
                      {detail.customer_rut || "—"}
                    </DetailRow>
                    <DetailRow label="Fecha emisión">
                      {dateTime(detail.issued_at)}
                    </DetailRow>
                    <DetailRow label="Estado Relbase">
                      {detail.relbase_status || "—"}
                    </DetailRow>
                    <DetailRow label="Estado SII">
                      {siiLabel(detail)}
                    </DetailRow>
                    <DetailRow label="Track ID">
                      {detail.track_id || "—"}
                    </DetailRow>
                    <DetailRow label="ID Relbase">
                      {detail.relbase_document_id || "—"}
                    </DetailRow>
                    <DetailRow label="Orden Laminatiword">
                      {detail.order_number || "No asociado"}
                    </DetailRow>
                  </dl>

                  {detail.comment ? (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Observación
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-neutral-700">
                        {detail.comment}
                      </p>
                    </div>
                  ) : null}

                  {detail.order_id ? (
                    <Link
                      href={`/admin/pedidos/${encodeURIComponent(
                        detail.order_id
                      )}`}
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-xs font-semibold !text-white transition hover:bg-neutral-800"
                    >
                      Ver pedido relacionado
                      <Icon
                        name="external"
                        className="h-4 w-4"
                      />
                    </Link>
                  ) : null}

                  <div className="mt-4 rounded-2xl border border-neutral-200 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Trazabilidad
                    </p>
                    <p className="mt-2 text-xs text-neutral-600">
                      {detail.source_detection ===
                      "LOCAL_RELBASE_DOCUMENT_ID"
                        ? "Vinculado por ID de documento Relbase con Laminatiword."
                        : detail.source_detection ===
                          "COMMENT_MARKER"
                        ? "Detectado como Laminatiword por marcador histórico en el comentario."
                        : "Documento creado directamente en Relbase, sin vínculo local."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-neutral-400">
                  Selecciona una factura o boleta para revisar su información.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
