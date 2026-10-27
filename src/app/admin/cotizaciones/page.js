"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteQuotation,
  listQuotations,
} from "@/services/showroom.service";

import {
  QUOTATION_TRACKING_UPDATED_EVENT,
} from "@/services/adminNotifications.service";

const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const money = (value) =>
  moneyFormatter.format(Number(value || 0));


function formatDate(value) {
  if (!value) return "—";

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("es-CL");
}


function formatDateTime(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).format(parsed);
}


function formatShortTime(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).format(parsed);
}


function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}


function normalizeTracking(value) {
  const tracking =
    value && typeof value === "object"
      ? value
      : {};

  return {
    send_count:
      Number(tracking.send_count || 0),

    last_sent_at:
      tracking.last_sent_at || null,

    first_opened_at:
      tracking.first_opened_at || null,

    last_opened_at:
      tracking.last_opened_at || null,

    open_count:
      Number(tracking.open_count || 0),

    first_viewed_at:
      tracking.first_viewed_at || null,

    last_viewed_at:
      tracking.last_viewed_at || null,

    view_count:
      Number(tracking.view_count || 0),

    distinct_view_environments:
      Number(
        tracking.distinct_view_environments ||
          0
      ),

    has_detected_open:
      Boolean(
        tracking.has_detected_open ||
          Number(tracking.open_count || 0) > 0
      ),

    has_been_viewed:
      Boolean(
        tracking.has_been_viewed ||
          Number(tracking.view_count || 0) > 0
      ),
  };
}


const statusLabel = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
};


function EditIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}


function TrashIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}


function EyeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}


function MailIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}


function ActivityIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}


function CloseIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}


function TrackingSummary({
  quotation,
  onOpen,
}) {
  const tracking =
    normalizeTracking(
      quotation.tracking
    );

  const hasTracking =
    tracking.send_count > 0 ||
    Boolean(quotation.sent_at);

  if (!hasTracking) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1.5">
      {tracking.has_been_viewed ? (
        <button
          type="button"
          onClick={onOpen}
          className="group flex w-fit items-center gap-1.5 text-left text-[11px] font-medium text-neutral-800 transition hover:text-black"
          title="Ver actividad de la cotización"
        >
          <EyeIcon className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            Vista{" "}
            {tracking.last_viewed_at
              ? formatShortTime(
                  tracking.last_viewed_at
                )
              : ""}
          </span>
        </button>
      ) : tracking.has_detected_open ? (
        <button
          type="button"
          onClick={onOpen}
          className="group flex w-fit items-center gap-1.5 text-left text-[11px] font-medium text-neutral-700 transition hover:text-black"
          title="Ver actividad de la cotización"
        >
          <MailIcon className="h-3.5 w-3.5 text-sky-600" />
          <span>Correo visualizado</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="group flex w-fit items-center gap-1.5 text-left text-[11px] text-neutral-400 transition hover:text-neutral-700"
          title="Ver actividad de la cotización"
        >
          <MailIcon className="h-3.5 w-3.5" />
          <span>Sin visualización detectada</span>
        </button>
      )}

      {tracking.view_count > 0 && (
        <p className="text-[10px] text-neutral-500">
          {tracking.view_count}{" "}
          {pluralize(
            tracking.view_count,
            "visualización",
            "visualizaciones"
          )}
          {tracking.distinct_view_environments > 1
            ? ` · ${tracking.distinct_view_environments} entornos`
            : ""}
        </p>
      )}
    </div>
  );
}


function TrackingModal({
  quotation,
  onClose,
}) {
  const tracking = useMemo(
    () =>
      normalizeTracking(
        quotation?.tracking
      ),
    [quotation]
  );

  if (!quotation) {
    return null;
  }

  const sentAt =
    tracking.last_sent_at ||
    quotation.sent_at ||
    null;

  const timeline = [
    sentAt
      ? {
          key: "sent",
          label: "Cotización enviada",
          value: sentAt,
          icon: "mail",
        }
      : null,

    tracking.first_opened_at
      ? {
          key: "opened",
          label: "Correo visualizado",
          value:
            tracking.first_opened_at,
          icon: "mail",
        }
      : null,

    tracking.first_viewed_at
      ? {
          key: "first_view",
          label: "Cotización visualizada",
          value:
            tracking.first_viewed_at,
          icon: "eye",
        }
      : null,

    tracking.view_count > 1 &&
    tracking.last_viewed_at &&
    tracking.last_viewed_at !==
      tracking.first_viewed_at
      ? {
          key: "last_view",
          label:
            "Última visualización",
          value:
            tracking.last_viewed_at,
          icon: "eye",
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Actividad comercial
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neutral-950">
              {quotation.quote_number}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {quotation.legal_name ||
                quotation.customer_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar actividad"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Envíos
              </p>

              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {tracking.send_count}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Último:{" "}
                {sentAt
                  ? formatDateTime(sentAt)
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Aperturas email
              </p>

              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {tracking.open_count}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {tracking.last_opened_at
                  ? `Última: ${formatDateTime(
                      tracking.last_opened_at
                    )}`
                  : "No detectada"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Visualizaciones
              </p>

              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {tracking.view_count}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {tracking.last_viewed_at
                  ? `Última: ${formatDateTime(
                      tracking.last_viewed_at
                    )}`
                  : "Sin visualizaciones"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-black/5 p-5">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-950">
                Historial
              </h3>
            </div>

            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                Aún no existe actividad registrada para esta cotización.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {timeline.map((event) => (
                  <div
                    key={event.key}
                    className="flex gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                      {event.icon === "eye" ? (
                        <EyeIcon className="h-4 w-4" />
                      ) : (
                        <MailIcon className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-950">
                        {event.label}
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDateTime(
                          event.value
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tracking.distinct_view_environments > 1 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-950">
                {tracking.distinct_view_environments} entornos diferentes detectados
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Esto puede corresponder al mismo destinatario usando distintos dispositivos o navegadores, o a un enlace compartido. No se interpreta automáticamente como un reenvío del correo.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-black/5 bg-neutral-50 p-4">
            <p className="text-xs leading-5 text-neutral-500">
              La apertura del correo depende de que el cliente de email cargue imágenes externas. La visualización de la cotización es una señal más confiable porque corresponde al acceso al enlace único enviado al cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [trackingQuotation, setTrackingQuotation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [data, setData] = useState({
    quotations: [],
    pagination: null,
  });

  const load =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        try {
          if (
            !silent
          ) {
            setLoading(
              true
            );
          }

          setError("");

          const response =
            await listQuotations({
              search,
              status,
              type,
              page: 1,
              limit: 50,
            });

          const quotations =
            response?.quotations ||
            [];

          setData({
            quotations,
            pagination:
              response?.pagination ||
              null,
          });

          /*
           * Si el modal de actividad está
           * abierto, también recibe el
           * resumen actualizado.
           */
          setTrackingQuotation(
            (
              current
            ) => {
              if (
                !current?.id
              ) {
                return current;
              }

              return (
                quotations.find(
                  (
                    item
                  ) =>
                    item.id ===
                    current.id
                ) ||
                current
              );
            }
          );
        } catch (err) {
          setError(
            err?.message ||
              "No fue posible cargar las cotizaciones."
          );
        } finally {
          if (
            !silent
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        search,
        status,
        type,
      ]
    );

  const handleDeleteQuotation =
    async () => {
      if (
        !quotationToDelete?.id ||
        deletingId
      ) {
        return;
      }

      try {
        setDeletingId(
          quotationToDelete.id
        );
        setError("");
        setMessage("");

        await deleteQuotation(
          quotationToDelete.id
        );

        setMessage(
          `Cotización ${quotationToDelete.quote_number} eliminada correctamente.`
        );

        setQuotationToDelete(null);

        await load();
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible eliminar la cotización."
        );
      } finally {
        setDeletingId(null);
      }
    };

  useEffect(
    () => {
      const timeout =
        setTimeout(
          () => {
            load();
          },
          220
        );

      return () =>
        clearTimeout(
          timeout
        );
    },
    [
      load,
    ]
  );


  /*
   * Actualización realtime:
   * Socket.IO recibe el evento global y
   * AdminRealtimeNotifications lo publica
   * como CustomEvent dentro del navegador.
   *
   * Se hace un refetch silencioso para
   * conservar PostgreSQL como fuente de
   * verdad sin recargar la página.
   */
  useEffect(
    () => {
      let refreshTimer =
        null;

      const handleTrackingUpdated =
        (
          event
        ) => {
          const quotationId =
            event
              ?.detail
              ?.quotation_id;

          if (
            !quotationId
          ) {
            return;
          }

          if (
            refreshTimer
          ) {
            window.clearTimeout(
              refreshTimer
            );
          }

          refreshTimer =
            window.setTimeout(
              () => {
                load({
                  silent:
                    true,
                });
              },
              120
            );
        };

      window.addEventListener(
        QUOTATION_TRACKING_UPDATED_EVENT,
        handleTrackingUpdated
      );

      return () => {
        window.removeEventListener(
          QUOTATION_TRACKING_UPDATED_EVENT,
          handleTrackingUpdated
        );

        if (
          refreshTimer
        ) {
          window.clearTimeout(
            refreshTimer
          );
        }
      };
    },
    [
      load,
    ]
  );

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Administración
            </p>

            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
              Cotizaciones
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-neutral-500">
              Administra cotizaciones comerciales y de proyecto desde un solo lugar, con edición, PDF, envío y seguimiento en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/showroom"
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black"
            >
              Showroom
            </Link>

            <Link
              href="/admin/cotizaciones/nueva"
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-neutral-900 transition hover:border-black"
            >
              Nueva cotización
            </Link>

            <Link
              href="/admin/cotizaciones/nueva/proyecto"
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-xs font-semibold !text-white transition hover:bg-neutral-800"
              style={{ color: "#ffffff" }}
            >
              Nueva cotización de proyecto
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_220px]">
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar número, cliente, RUT, proyecto, referencia, código o producto"
              className="h-11 rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-black"
            />

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
            >
              <option value="">
                Todos los tipos
              </option>
              <option value="STANDARD">
                Estándar
              </option>
              <option value="PROJECT">
                Proyecto
              </option>
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black"
            >
              <option value="">
                Todos los estados
              </option>

              {Object.entries(
                statusLabel
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              Cargando cotizaciones...
            </div>
          ) : data.quotations.length ===
            0 ? (
            <div className="p-10 text-center text-sm text-neutral-500">
              No hay cotizaciones para mostrar.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {data.quotations.map(
                (quotation) => {
                  const canEdit =
                    [
                      "DRAFT",
                      "SENT",
                      "EXPIRED",
                    ].includes(
                      quotation.status
                    );

                  const canDelete =
                    !quotation.converted_order_id &&
                    quotation.status !==
                      "CONVERTED";

                  const productSkus =
                    Array.isArray(
                      quotation.product_skus
                    )
                      ? quotation.product_skus.filter(
                          Boolean
                        )
                      : [];

                  const visibleSkus =
                    productSkus.slice(
                      0,
                      3
                    );

                  const hiddenSkuCount =
                    productSkus.length -
                    visibleSkus.length;

                  const tracking =
                    normalizeTracking(
                      quotation.tracking
                    );

                  return (
                    <div
                      key={quotation.id}
                      className="grid gap-3 p-5 transition hover:bg-neutral-50 sm:grid-cols-[1.2fr_1fr_0.8fr_1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold text-neutral-950">
                          {
                            quotation.quote_number
                          }
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-neutral-500">
                            {quotation.intended_document_type ===
                            "FACTURA"
                              ? "Factura"
                              : "Boleta"}
                          </span>

                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                              quotation.quotation_type === "PROJECT"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {quotation.quotation_type === "PROJECT"
                              ? "Proyecto"
                              : "Estándar"}
                          </span>
                        </div>

                        {quotation.quotation_type === "PROJECT" &&
                          quotation.project_name && (
                          <p className="mt-1.5 text-xs font-medium text-neutral-700">
                            {quotation.project_name}
                          </p>
                        )}

                        <div
                          className="mt-2 flex flex-wrap items-center gap-1.5"
                          aria-label="Códigos de los productos cotizados"
                        >
                          {visibleSkus.map(
                            (sku) => (
                              <span
                                key={sku}
                                title={`Código del laminado: ${sku}`}
                                className="inline-flex max-w-full break-all rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-800"
                              >
                                {sku}
                              </span>
                            )
                          )}

                          {hiddenSkuCount >
                            0 && (
                            <span className="text-[11px] font-medium text-neutral-500">
                              +
                              {
                                hiddenSkuCount
                              }{" "}
                              códigos
                            </span>
                          )}

                          {productSkus.length ===
                            0 && (
                            <span className="text-[11px] text-neutral-400">
                              Sin códigos asociados
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-neutral-900">
                          {quotation.legal_name ||
                            quotation.customer_name}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          {quotation.rut}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-neutral-950">
                          {money(
                            quotation.total
                          )}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          Válida hasta{" "}
                          {formatDate(
                            quotation.valid_until
                          )}
                        </p>
                      </div>

                      <div>
                        <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
                          {statusLabel[
                            quotation.status
                          ] ||
                            quotation.status}
                        </span>

                        <TrackingSummary
                          quotation={
                            quotation
                          }
                          onOpen={() =>
                            setTrackingQuotation(
                              quotation
                            )
                          }
                        />

                        {tracking.view_count >
                          0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTrackingQuotation(
                                quotation
                              )
                            }
                            className="mt-1 text-[10px] font-medium text-neutral-400 underline-offset-2 transition hover:text-neutral-700 hover:underline"
                          >
                            Ver actividad
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                        {canEdit && (
                          <Link
                            href={`/admin/cotizaciones/${quotation.id}/editar`}
                            aria-label={`Editar cotización ${quotation.quote_number}`}
                            title="Editar cotización"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 transition hover:border-black/20 hover:bg-neutral-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-black/15"
                          >
                            <EditIcon className="h-[18px] w-[18px]" />
                          </Link>
                        )}

                        <Link
                          href={`/admin/cotizaciones/${quotation.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-medium !text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/20"
                          style={{
                            color:
                              "#ffffff",
                          }}
                        >
                          Ver detalle →
                        </Link>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setError(
                                ""
                              );
                              setMessage(
                                ""
                              );
                              setQuotationToDelete(
                                quotation
                              );
                            }}
                            aria-label={`Eliminar cotización ${quotation.quote_number}`}
                            title="Eliminar cotización"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                          >
                            <TrashIcon className="h-[18px] w-[18px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {quotationToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500">
              Eliminar cotización
            </p>

            <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em] text-neutral-950">
              {
                quotationToDelete.quote_number
              }
            </h2>

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Esta acción eliminará permanentemente la cotización y sus productos asociados. No se puede deshacer.
            </p>

            <div className="mt-5 rounded-2xl border border-black/5 bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Cliente
              </p>

              <p className="mt-1 text-sm font-medium text-neutral-950">
                {quotationToDelete.legal_name ||
                  quotationToDelete.customer_name}
              </p>

              <p className="mt-3 text-xs text-neutral-500">
                Total
              </p>

              <p className="mt-1 text-lg font-semibold text-neutral-950">
                {money(
                  quotationToDelete.total
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setQuotationToDelete(
                    null
                  )
                }
                disabled={Boolean(
                  deletingId
                )}
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteQuotation
                }
                disabled={Boolean(
                  deletingId
                )}
                className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold !text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                style={{
                  color:
                    "#ffffff",
                }}
              >
                {deletingId
                  ? "Eliminando..."
                  : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {trackingQuotation && (
        <TrackingModal
          quotation={
            trackingQuotation
          }
          onClose={() =>
            setTrackingQuotation(
              null
            )
          }
        />
      )}
    </main>
  );
}
