"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
} from "next/navigation";

import {
  getAdminOrderById,
} from "@/services/orderManagement.service";

import {
  getTaxDocumentPdfSource,
} from "@/services/taxDocuments.service";

const money = (amount) =>
  new Intl.NumberFormat(
    "es-CL",
    {
      style:
        "currency",
      currency:
        "CLP",
      maximumFractionDigits:
        0,
    }
  ).format(
    Number(amount) || 0
  );

const quantity = (amount) =>
  new Intl.NumberFormat(
    "es-CL",
    {
      maximumFractionDigits:
        3,
    }
  ).format(
    Number(amount) || 0
  );

const dateTime = (value) =>
  value
    ? new Intl.DateTimeFormat(
        "es-CL",
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
          timeZone:
            "America/Santiago",
        }
      ).format(
        new Date(value)
      )
    : "—";

const LABELS = {
  WEB: "Online",
  STORE: "Showroom",
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  PAID: "Pagado",
  AWAITING_CONFIRMATION:
    "Por confirmar",
  AUTHORIZED:
    "Autorizado",
  FAILED:
    "Fallido",
  REFUNDED:
    "Reembolsado",
  PREPARING:
    "Preparando",
  READY_FOR_PICKUP:
    "Listo para retiro",
  DELIVERED:
    "Entregado",
  BOLETA:
    "Boleta",
  FACTURA:
    "Factura",
  ACTIVE:
    "Activa",
  ISSUED:
    "Emitido",
  ACCEPTED:
    "Aceptado",
  REJECTED:
    "Rechazado",
  ERROR:
    "Error",
};

const label = (value) =>
  LABELS[
    String(
      value || ""
    ).toUpperCase()
  ] ||
  value ||
  "—";

function Detail({
  title,
  value,
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-neutral-400">
        {title}
      </dt>

      <dd className="mt-1 break-words text-sm font-medium text-neutral-900">
        {value || "—"}
      </dd>
    </div>
  );
}

function Panel({
  title,
  children,
}) {
  return (
    <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="mb-5 text-lg font-semibold">
        {title}
      </h2>

      {children}
    </section>
  );
}

export default function AdminPedidoDetallePage() {
  const params =
    useParams();

  const orderId =
    String(
      params?.orderId ||
      ""
    );

  const [data, setData] =
    useState(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refresh, setRefresh] =
    useState(0);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const [pdfError, setPdfError] =
    useState("");

  useEffect(
    () => {
      if (!orderId) {
        return;
      }

      const controller =
        new AbortController();

      let active =
        true;

      setLoading(true);
      setError("");

      getAdminOrderById(
        orderId,
        {
          signal:
            controller.signal,
        }
      )
        .then(
          (result) => {
            if (active) {
              setData(
                result
              );
            }
          }
        )
        .catch(
          (loadError) => {
            if (
              active &&
              loadError?.name !==
                "AbortError"
            ) {
              setError(
                loadError?.message ||
                  "No fue posible cargar el pedido"
              );

              setData(
                null
              );
            }
          }
        )
        .finally(
          () => {
            if (active) {
              setLoading(
                false
              );
            }
          }
        );

      return () => {
        active =
          false;

        controller.abort();
      };
    },
    [
      orderId,
      refresh,
    ]
  );

  const order =
    data?.order;

  const items =
    Array.isArray(
      data?.items
    )
      ? data.items
      : [];

  const billing =
    data?.billing;

  const payment =
    data?.payment;

  const reservations =
    Array.isArray(
      data?.reservations
    )
      ? data.reservations
      : [];

  const document =
    data?.tax_document;

  useEffect(
    () => {
      const documentStatus =
        String(
          document?.status ||
          ""
        ).toUpperCase();

      const shouldPoll =
        !document ||
        [
          "PENDING",
          "PROCESSING",
        ].includes(
          documentStatus
        );

      if (!shouldPoll) {
        return;
      }

      const interval =
        window.setInterval(
          () => {
            if (
              window.document.visibilityState ===
              "visible"
            ) {
              setRefresh(
                (
                  value
                ) =>
                  value +
                  1
              );
            }
          },
          3000
        );

      return () =>
        window.clearInterval(
          interval
        );
    },
    [
      document?.id,
      document?.status,
      document?.relbase_document_id,
    ]
  );

  const canOpenPdf =
    Boolean(
      document?.id &&
      document?.relbase_document_id
    );

  const openPdf =
    async () => {
      if (
        !document?.id
      ) {
        return;
      }

      const previewWindow =
        window.open(
          "about:blank",
          "_blank"
        );

      if (
        previewWindow
      ) {
        previewWindow.opener =
          null;
      }

      if (
        previewWindow
      ) {
        previewWindow.document.write(
          "<title>Cargando documento...</title><p style='font-family:system-ui;padding:24px'>Cargando documento tributario…</p>"
        );
      }

      try {
        setPdfError("");
        setPdfLoading(
          true
        );

        const source =
          await getTaxDocumentPdfSource(
            document.id
          );

        let url =
          "";

        let shouldRevokeUrl =
          false;

        if (
          source?.kind ===
            "blob" &&
          source?.blob
        ) {
          url =
            URL.createObjectURL(
              source.blob
            );

          shouldRevokeUrl =
            true;
        } else if (
          source?.kind ===
            "url" &&
          source?.url
        ) {
          url =
            source.url;
        } else {
          throw new Error(
            "No fue posible obtener una fuente válida para el documento tributario."
          );
        }

        if (
          previewWindow
        ) {
          previewWindow.location.href =
            url;
        } else {
          window.location.href =
            url;
        }

        if (
          shouldRevokeUrl
        ) {
          window.setTimeout(
            () =>
              URL.revokeObjectURL(
                url
              ),
            120000
          );
        }
      } catch (
        openError
      ) {
        if (
          previewWindow
        ) {
          previewWindow.close();
        }

        setPdfError(
          openError?.message ||
            "El PDF todavía no está disponible. Intenta nuevamente en unos segundos."
        );
      } finally {
        setPdfLoading(
          false
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f7f6f4] px-4 py-7 text-neutral-950 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1350px] space-y-5">
        <header className="relative rounded-[28px] border border-neutral-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-[28px] bg-gradient-to-r from-[#e45e59] to-[#6953af]" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">
                LAMINATI · DETALLE DE PEDIDO
              </p>

              <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {order?.order_number ||
                  "Pedido"}
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                {order
                  ? `${label(
                      order.source
                    )} · ${dateTime(
                      order.created_at
                    )}`
                  : "Información del pedido"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/pedidos"
                className="inline-flex h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-medium"
              >
                ← Volver a pedidos
              </Link>

              <Link
                href="/admin/pagos"
                className="inline-flex h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-medium"
              >
                Pagos y documentos
              </Link>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setRefresh(
                    (
                      value
                    ) =>
                      value +
                      1
                  )
                }
                className="h-11 rounded-full bg-black px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div
            role="status"
            className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500"
          >
            Cargando detalle...
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {pdfError ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
          >
            {pdfError}
          </div>
        ) : null}

        {!loading &&
        order ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Estado del pedido",
                  label(
                    order.status
                  ),
                ],
                [
                  "Pago",
                  label(
                    order.payment_status
                  ),
                ],
                [
                  "Preparación / retiro",
                  label(
                    order.fulfillment_status
                  ),
                ],
                [
                  "Total",
                  money(
                    order.total
                  ),
                ],
              ].map(
                ([
                  title,
                  value,
                ]) => (
                  <div
                    key={
                      title
                    }
                    className="rounded-[22px] border border-neutral-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                      {title}
                    </p>

                    <p className="mt-3 break-words text-xl font-semibold">
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>

            <Panel title="Productos y códigos de laminado">
              <div className="space-y-3">
                {items.map(
                  (
                    item
                  ) => (
                    <article
                      key={
                        item.id
                      }
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4"
                    >
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold">
                          SKU:{" "}
                          {item.sku ||
                            item.reference_code ||
                            "Sin código"}
                        </span>

                        <h3 className="mt-2 break-words font-medium">
                          {
                            item.product_name
                          }
                        </h3>

                        <p className="mt-1 text-xs text-neutral-500">
                          {item.product_code
                            ? `Código interno: ${item.product_code} · `
                            : ""}
                          {item.finish
                            ? `Acabado: ${item.finish} · `
                            : ""}
                          {quantity(
                            item.quantity
                          )}{" "}
                          ×{" "}
                          {money(
                            item.unit_price
                          )}
                        </p>
                      </div>

                      <p className="font-semibold tabular-nums">
                        {money(
                          item.line_total
                        )}
                      </p>
                    </article>
                  )
                )}

                {items.length ===
                0 ? (
                  <p className="text-sm text-neutral-500">
                    No hay productos en este pedido.
                  </p>
                ) : null}
              </div>

              <dl className="mt-5 ml-auto grid max-w-[300px] grid-cols-2 gap-x-5 gap-y-2 border-t border-neutral-100 pt-4 text-sm">
                <dt className="text-neutral-500">
                  Subtotal
                </dt>

                <dd className="text-right">
                  {money(
                    order.subtotal
                  )}
                </dd>

                <dt className="text-neutral-500">
                  Descuentos
                </dt>

                <dd className="text-right">
                  {money(
                    order.discount_total
                  )}
                </dd>

                <dt className="text-neutral-500">
                  IVA
                </dt>

                <dd className="text-right">
                  {money(
                    order.tax_total
                  )}
                </dd>

                <dt className="font-semibold">
                  Total
                </dt>

                <dd className="text-right font-semibold">
                  {money(
                    order.total
                  )}
                </dd>
              </dl>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel title="Cliente y facturación">
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    title="Cliente"
                    value={
                      order.customer_name
                    }
                  />

                  <Detail
                    title="RUT"
                    value={
                      billing?.rut ||
                      order.customer_rut
                    }
                  />

                  <Detail
                    title="Correo"
                    value={
                      billing?.billing_email ||
                      order.email
                    }
                  />

                  <Detail
                    title="Documento"
                    value={label(
                      billing?.document_type
                    )}
                  />

                  <Detail
                    title="Razón social"
                    value={
                      billing?.legal_name
                    }
                  />

                  <Detail
                    title="Dirección"
                    value={[
                      billing?.address_line,
                      billing?.commune,
                      billing?.city,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        ", "
                      )}
                  />
                </dl>
              </Panel>

              <Panel title="Pago">
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    title="Estado"
                    value={label(
                      payment?.status ||
                        order.payment_status
                    )}
                  />

                  <Detail
                    title="Medio"
                    value={
                      payment?.payment_method_name ||
                      payment?.payment_method_code
                    }
                  />

                  <Detail
                    title="Proveedor"
                    value={
                      payment?.provider_name ||
                      payment?.provider_code
                    }
                  />

                  <Detail
                    title="Monto"
                    value={
                      payment
                        ? money(
                            payment.amount
                          )
                        : "Sin pago registrado"
                    }
                  />

                  <Detail
                    title="Confirmado"
                    value={dateTime(
                      payment?.confirmed_at
                    )}
                  />

                  <Detail
                    title="Referencia"
                    value={
                      payment?.external_reference ||
                      payment?.customer_reference
                    }
                  />
                </dl>
              </Panel>

              <Panel title="Inventario y reservas">
                <div className="space-y-3">
                  {reservations.map(
                    (
                      reservation
                    ) => (
                      <div
                        key={
                          reservation.id
                        }
                        className="rounded-xl border border-neutral-100 p-4 text-sm"
                      >
                        <span className="font-semibold">
                          {label(
                            reservation.status
                          )}
                        </span>

                        <p className="mt-1 text-neutral-500">
                          Cantidad:{" "}
                          {quantity(
                            reservation.quantity
                          )}{" "}
                          · Bodega:{" "}
                          {reservation.warehouse_name ||
                            reservation.relbase_warehouse_id ||
                            "—"}
                        </p>
                      </div>
                    )
                  )}

                  {reservations.length ===
                  0 ? (
                    <p className="text-sm text-neutral-500">
                      Sin reservas asociadas.
                    </p>
                  ) : null}
                </div>
              </Panel>

              <Panel title="Documento tributario">
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    title="Tipo"
                    value={label(
                      document?.document_type ||
                        billing?.document_type
                    )}
                  />

                  <Detail
                    title="Estado"
                    value={label(
                      document?.status ||
                        "No preparado"
                    )}
                  />

                  <Detail
                    title="Folio"
                    value={
                      document?.folio
                    }
                  />

                  <Detail
                    title="Emisión"
                    value={dateTime(
                      document?.issued_at
                    )}
                  />

                  <Detail
                    title="Estado SII"
                    value={
                      document?.sii_status_name ||
                      document?.sii_status
                    }
                  />

                  <Detail
                    title="ID Relbase"
                    value={
                      document?.relbase_document_id
                    }
                  />
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void openPdf()
                    }
                    disabled={
                      !canOpenPdf ||
                      pdfLoading
                    }
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {pdfLoading
                      ? "Cargando PDF…"
                      : "Ver / imprimir"}
                  </button>

                  <Link
                    href="/admin/pagos"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold"
                  >
                    Ver todos
                  </Link>
                </div>

                {!document ? (
                  <p className="mt-4 text-xs text-amber-700">
                    El documento todavía no ha sido preparado. En las nuevas ventas POS este proceso queda en cola automáticamente.
                  </p>
                ) : null}

                {document &&
                !document.relbase_document_id ? (
                  <p className="mt-4 text-xs text-neutral-500">
                    El documento está en proceso y aún no posee un ID Relbase disponible para abrir el PDF.
                  </p>
                ) : null}
              </Panel>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
