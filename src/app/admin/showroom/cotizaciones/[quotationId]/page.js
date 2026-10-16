"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  cancelQuotation,
  convertQuotation,
  getQuotation,
  getQuotationPdfBlob,
  getRelbaseDteEmissionPreflight,
  prepareOrderTaxDocument,
  sendQuotationEmail,
} from "@/services/showroom.service";

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

const statusLabel = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  CONVERTED: "Convertida",
  CANCELLED: "Cancelada",
};

const paymentOptions = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT_CARD", label: "Débito" },
  { value: "CREDIT_CARD", label: "Crédito" },
  { value: "MANUAL_BANK_TRANSFER", label: "Transferencia" },
];

function getPreflightBlockingIssues(preflight) {
  if (!preflight) return [];

  const candidates = [
    preflight.blocking_issues,
    preflight.blockers,
    preflight.issues,
  ];

  for (const value of candidates) {
    if (!Array.isArray(value)) continue;

    return value
      .map((issue) => {
        if (typeof issue === "string") {
          return issue.trim();
        }

        return String(
          issue?.message ||
            issue?.code ||
            issue?.reason ||
            ""
        ).trim();
      })
      .filter(Boolean);
  }

  return [];
}

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = String(params?.quotationId || "");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [dteValidation, setDteValidation] = useState(null);

  const quotation = data?.quotation || null;
  const items = data?.items || [];
  const projectLines =
    data?.project_lines || [];

  const isProject =
    quotation?.quotation_type ===
    "PROJECT";

  const productSkus = [
    ...new Set(
      (
        isProject
          ? projectLines
              .filter(
                (line) =>
                  line.line_type ===
                  "PRODUCT"
              )
              .map(
                (line) =>
                  String(
                    line.code || ""
                  ).trim()
              )
          : items.map(
              (item) =>
                String(
                  item.sku || ""
                ).trim()
            )
      ).filter(Boolean)
    ),
  ];

  const canConvert = useMemo(
    () =>
      quotation &&
      !isProject &&
      ["DRAFT", "SENT", "ACCEPTED"].includes(
        quotation.status
      ),
    [quotation, isProject]
  );

  const canEdit = useMemo(
    () =>
      quotation &&
      ["DRAFT", "SENT"].includes(
        quotation.status
      ),
    [quotation]
  );

  const canCancel = useMemo(
    () =>
      quotation &&
      ["DRAFT", "SENT", "ACCEPTED"].includes(
        quotation.status
      ),
    [quotation]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getQuotation(quotationId);
      setData(response?.data || null);
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible cargar la cotización."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) load();
  }, [quotationId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const openPdf = async () => {
    try {
      setActionLoading("pdf");
      setError("");
      const blob = await getQuotationPdfBlob(quotationId);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err?.message || "No fue posible abrir el PDF.");
    } finally {
      setActionLoading("");
    }
  };

  const sendEmail = async () => {
    try {
      setActionLoading("email");
      setError("");
      setMessage("");
      const response = await sendQuotationEmail(quotationId);
      setMessage(
        response?.message ||
          "Cotización enviada correctamente."
      );
      await load();
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible enviar la cotización."
      );
    } finally {
      setActionLoading("");
    }
  };

  const cancel = async () => {
    if (!window.confirm("¿Cancelar esta cotización?")) {
      return;
    }

    try {
      setActionLoading("cancel");
      setError("");
      setMessage("");
      await cancelQuotation(quotationId);
      setMessage("Cotización cancelada correctamente.");
      await load();
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible cancelar la cotización."
      );
    } finally {
      setActionLoading("");
    }
  };

  const runTaxDocumentValidation = async ({
    orderId,
    orderNumber,
    documentType,
  }) => {
    if (!orderId) {
      throw new Error(
        "La venta fue creada, pero no fue posible obtener el order_id necesario para preparar el documento tributario."
      );
    }

    const prepareResponse =
      await prepareOrderTaxDocument(orderId);

    const preparedData =
      prepareResponse?.data ||
      prepareResponse ||
      null;

    const taxDocument =
      preparedData?.tax_document ||
      null;

    const taxDocumentId = String(
      taxDocument?.id || ""
    ).trim();

    if (!taxDocumentId) {
      throw new Error(
        "El backend preparó la venta, pero no devolvió el identificador del documento tributario."
      );
    }

    const preflightResponse =
      await getRelbaseDteEmissionPreflight(
        taxDocumentId,
        { maxPages: 100 }
      );

    const preflightData =
      preflightResponse?.data ||
      preflightResponse ||
      null;

    const preflight =
      preflightData?.preflight ||
      null;

    if (!preflight) {
      throw new Error(
        "El documento fue preparado, pero el backend no devolvió el resultado del preflight tributario."
      );
    }

    const blockingIssues =
      getPreflightBlockingIssues(preflight);

    const readyForEmission =
      preflight.ready_for_emission === true;

    const result = {
      orderId,
      orderNumber: orderNumber || null,
      documentType,
      taxDocumentId,
      alreadyPrepared:
        preparedData?.already_prepared === true,
      preflightExecuted: true,
      readyForEmission,
      blockingIssues,
    };

    setDteValidation(result);

    return result;
  };

  const retryTaxDocumentValidation = async () => {
    if (!quotation?.converted_order_id) {
      setError(
        "La cotización no posee una venta convertida asociada."
      );
      return;
    }

    try {
      setActionLoading("dte-validation");
      setError("");
      setMessage("");
      setDteValidation(null);

      const result =
        await runTaxDocumentValidation({
          orderId:
            quotation.converted_order_id,
          orderNumber:
            quotation.converted_order_number ||
            null,
          documentType:
            quotation.intended_document_type,
        });

      if (result.readyForEmission) {
        setMessage(
          `${quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"} preparada y preflight tributario aprobado. La emisión real continúa deshabilitada.`
        );
      } else {
        setMessage(
          `${quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"} preparada. El preflight detectó validaciones pendientes; no se realizó ninguna emisión.`
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible ejecutar la validación tributaria."
      );
    } finally {
      setActionLoading("");
    }
  };

  const convert = async () => {
    if (!quotation) return;

    if (
      paymentMethod === "CASH" &&
      Number(amountReceived) < Number(quotation.total)
    ) {
      setError(
        "El efectivo recibido debe cubrir el total cotizado."
      );
      return;
    }

    if (
      paymentMethod !== "CASH" &&
      !String(externalReference || "").trim()
    ) {
      setError(
        paymentMethod === "MANUAL_BANK_TRANSFER"
          ? "Ingresa el número de operación o referencia de la transferencia."
          : "Ingresa el número de voucher/autorización."
      );
      return;
    }

    let createdOrderId = null;
    let createdOrderNumber = null;

    try {
      setActionLoading("convert");
      setError("");
      setMessage("");
      setDteValidation(null);

      const response = await convertQuotation(
        quotationId,
        {
          payment: {
            method: paymentMethod,
            amount_received:
              paymentMethod === "CASH"
                ? Number(amountReceived)
                : undefined,
            external_reference:
              paymentMethod === "CASH"
                ? undefined
                : String(
                    externalReference
                  ).trim(),
          },
        }
      );

      const conversionData =
        response?.data || {};

      createdOrderId = String(
        conversionData?.sale?.order?.id ||
          conversionData?.order_id ||
          conversionData?.quotation
            ?.converted_order_id ||
          ""
      ).trim();

      createdOrderNumber =
        conversionData?.sale?.order
          ?.order_number ||
        conversionData?.order_number ||
        conversionData?.quotation
          ?.converted_order_number ||
        "pedido creado";

      setConvertOpen(false);

      try {
        const validation =
          await runTaxDocumentValidation({
            orderId: createdOrderId,
            orderNumber:
              createdOrderNumber,
            documentType:
              quotation.intended_document_type,
          });

        if (validation.readyForEmission) {
          setMessage(
            `Venta ${createdOrderNumber} creada. ${quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"} preparada y preflight tributario aprobado. La emisión real continúa deshabilitada.`
          );
        } else {
          setMessage(
            `Venta ${createdOrderNumber} creada. El documento tributario fue preparado, pero el preflight detectó validaciones pendientes. No se realizó ninguna emisión.`
          );
        }
      } catch (taxError) {
        setError(
          `La venta ${createdOrderNumber} fue creada correctamente, pero no fue posible completar la preparación/preflight tributario: ${
            taxError?.message ||
            "error tributario no identificado"
          }`
        );
      }

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible convertir la cotización en venta."
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f5f2] p-8 text-sm text-neutral-500">
        Cargando cotización...
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="min-h-screen bg-[#f6f5f2] p-8">
        <p className="text-sm text-red-700">
          {error || "Cotización no encontrada."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Cotización
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
              {quotation.quote_number}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span>{quotation.intended_document_type}</span>
              <span>·</span>
              <span>
                {isProject
                  ? "Proyecto"
                  : "Estándar"}
              </span>
              <span>·</span>
              <span>{statusLabel[quotation.status] || quotation.status}</span>
              <span>·</span>
              <span>
                Válida hasta {formatDate(quotation.valid_until)}
              </span>
            </div>
            {isProject && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
                <span>
                  <strong className="text-neutral-900">Proyecto:</strong>{" "}
                  {quotation.project_name || "—"}
                </span>
                {quotation.project_reference && (
                  <span>
                    <strong className="text-neutral-900">Referencia:</strong>{" "}
                    {quotation.project_reference}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Códigos de productos en la cotización">
              <span className="text-xs font-medium text-neutral-500">Códigos:</span>
              {productSkus.length > 0 ? (
                productSkus.map((sku) => (
                  <span key={sku} className="inline-flex max-w-full break-all rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900">
                    {sku}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-500">Sin productos registrados</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/cotizaciones"
              className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700"
            >
              Volver
            </Link>
            <Link
              href="/admin/showroom"
              className="inline-flex h-11 items-center rounded-full bg-black px-5 text-xs font-medium text-white"
            >
              Showroom
            </Link>
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {message}
          </div>
        )}

        {dteValidation && (
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 ${
              dteValidation.readyForEmission
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Validación tributaria
                </p>
                <h2 className="mt-1 text-base font-semibold text-neutral-950">
                  {dteValidation.readyForEmission
                    ? "Preflight aprobado"
                    : "Preflight con observaciones"}
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  dteValidation.readyForEmission
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                SIN EMISIÓN
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-neutral-500">Venta</span>
                <p className="mt-1 font-medium text-neutral-950">
                  {dteValidation.orderNumber || dteValidation.orderId}
                </p>
              </div>

              <div>
                <span className="text-neutral-500">Documento</span>
                <p className="mt-1 font-medium text-neutral-950">
                  {dteValidation.documentType}
                </p>
              </div>
            </div>

            {dteValidation.blockingIssues.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-4">
                <p className="text-xs font-semibold text-amber-900">
                  Validaciones pendientes
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                  {dteValidation.blockingIssues.map(
                    (issue, index) => (
                      <li key={`${issue}-${index}`}>
                        • {issue}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Este paso sólo prepara el documento y ejecuta el preflight. No se llama al endpoint de emisión y no se genera un DTE real en Relbase.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-neutral-950">
              Cliente
            </h2>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><span className="text-neutral-400">Nombre</span><p className="mt-1 text-neutral-950">{quotation.legal_name || quotation.customer_name}</p></div>
              <div><span className="text-neutral-400">RUT</span><p className="mt-1 text-neutral-950">{quotation.rut}</p></div>
              <div><span className="text-neutral-400">Correo</span><p className="mt-1 text-neutral-950">{quotation.email}</p></div>
              <div><span className="text-neutral-400">Teléfono</span><p className="mt-1 text-neutral-950">{quotation.phone}</p></div>
              <div className="sm:col-span-2"><span className="text-neutral-400">Dirección</span><p className="mt-1 text-neutral-950">{[quotation.address_line, quotation.commune, quotation.city].filter(Boolean).join(", ")}</p></div>
              {quotation.business_activity && (
                <div className="sm:col-span-2"><span className="text-neutral-400">Giro</span><p className="mt-1 text-neutral-950">{quotation.business_activity}</p></div>
              )}
            </div>

            {isProject ? (
              <>
                <h2 className="mt-7 text-base font-semibold text-neutral-950">
                  Productos de proyecto
                </h2>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5">
                  <table className="min-w-[980px] w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-[10px] uppercase tracking-[0.08em] text-neutral-500">
                      <tr>
                        <th className="px-3 py-3">Producto</th>
                        <th className="px-3 py-3">Código</th>
                        <th className="px-3 py-3">Acabado</th>
                        <th className="px-3 py-3 text-right">Espesor</th>
                        <th className="px-3 py-3 text-right">Cantidad</th>
                        <th className="px-3 py-3">Formato</th>
                        <th className="px-3 py-3 text-right">Valor m²</th>
                        <th className="px-3 py-3 text-right">Valor unitario</th>
                        <th className="px-3 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {projectLines
                        .filter((line) => line.line_type === "PRODUCT")
                        .map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-3 font-medium text-neutral-900">
                              {line.description}
                            </td>
                            <td className="px-3 py-3 text-neutral-600">
                              {line.code || "—"}
                            </td>
                            <td className="px-3 py-3 text-neutral-600">
                              {line.finish || "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-neutral-600">
                              {line.thickness_mm
                                ? `${Number(line.thickness_mm)} mm`
                                : "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-neutral-600">
                              {Number(line.quantity)}
                            </td>
                            <td className="px-3 py-3 text-neutral-600">
                              {[line.unit, line.format_label]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-neutral-600">
                              {line.price_m2_gross
                                ? money(line.price_m2_gross)
                                : "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-neutral-600">
                              {money(line.unit_price_gross)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-neutral-950">
                              {money(line.line_total_gross)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <h2 className="mt-7 text-base font-semibold text-neutral-950">
                  Servicios y otros
                </h2>

                <div className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5">
                  {projectLines
                    .filter((line) => line.line_type !== "PRODUCT")
                    .map((line) => (
                      <div
                        key={line.id}
                        className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                      >
                        <div>
                          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                            {line.line_type === "SERVICE"
                              ? "Servicio"
                              : "Otro"}
                          </span>
                          <p className="mt-1.5 text-sm font-medium text-neutral-950">
                            {line.description}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {Number(line.quantity)} {line.unit}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {money(line.unit_price_gross)}
                        </p>
                        <p className="text-sm font-semibold text-neutral-950">
                          {money(line.line_total_gross)}
                        </p>
                      </div>
                    ))}

                  {projectLines.filter((line) => line.line_type !== "PRODUCT").length === 0 && (
                    <p className="p-4 text-sm text-neutral-500">
                      Sin servicios ni conceptos adicionales.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-7 text-base font-semibold text-neutral-950">
                  Productos
                </h2>
                <div className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5">
                  {items.map((item) => (
                    <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="inline-flex max-w-full break-all rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-800">
                          SKU: {item.sku || "Sin código"}
                        </p>
                        <p className="mt-1 text-sm text-neutral-950">{item.product_name}</p>
                        <p className="mt-1 text-xs text-neutral-500">{item.quantity} × {money(item.unit_price_gross)}</p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-950">{money(item.line_total)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-neutral-950">Resumen</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500"><span>Neto</span><span>{money(quotation.net_total)}</span></div>
                <div className="flex justify-between text-neutral-500"><span>IVA</span><span>{money(quotation.tax_total)}</span></div>
                <div className="flex justify-between border-t border-black/5 pt-3 text-lg font-semibold text-neutral-950"><span>Total</span><span>{money(quotation.total)}</span></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-2">
                {canEdit && (
                  <Link
                    href={`/admin/cotizaciones/${quotation.id}/editar`}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Editar cotización
                  </Link>
                )}

                <button type="button" onClick={openPdf} disabled={actionLoading === "pdf"} className="h-11 rounded-xl border border-black/10 text-sm font-medium text-neutral-800">
                  {actionLoading === "pdf" ? "Abriendo..." : "Previsualizar / descargar PDF"}
                </button>

                <button type="button" onClick={sendEmail} disabled={Boolean(actionLoading) || ["CANCELLED", "CONVERTED"].includes(quotation.status)} className="h-11 rounded-xl border border-black/10 text-sm font-medium text-neutral-800 disabled:opacity-40">
                  {actionLoading === "email" ? "Enviando..." : "Enviar por correo"}
                </button>

                {canConvert && (
                  <button type="button" onClick={() => setConvertOpen(true)} className="h-12 rounded-xl bg-black text-sm font-semibold text-white">
                    Generar {quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"}
                  </button>
                )}

                {quotation.status === "CONVERTED" && (
                  <>
                    <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                      Convertida en venta{quotation.converted_order_number ? ` ${quotation.converted_order_number}` : ""}.
                    </div>

                    <button
                      type="button"
                      onClick={retryTaxDocumentValidation}
                      disabled={Boolean(actionLoading)}
                      className="h-11 rounded-xl border border-black/10 text-sm font-medium text-neutral-800 disabled:opacity-40"
                    >
                      {actionLoading === "dte-validation"
                        ? "Validando documento..."
                        : "Validar documento tributario"}
                    </button>
                  </>
                )}

                {canCancel && (
                  <button type="button" onClick={cancel} disabled={actionLoading === "cancel"} className="h-10 rounded-xl text-sm font-medium text-red-700">
                    Cancelar cotización
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {pdfUrl && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div>
                <p className="text-xs text-neutral-400">Cotización</p>
                <h2 className="text-lg font-semibold text-neutral-950">{quotation.quote_number}</h2>
              </div>
              <div className="flex gap-2">
                <a href={pdfUrl} download={`${quotation.quote_number}.pdf`} className="inline-flex h-10 items-center rounded-full border border-black/10 px-4 text-xs font-medium">Descargar PDF</a>
                <button type="button" onClick={() => { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }} className="h-10 rounded-full bg-black px-5 text-xs font-medium text-white">Cerrar</button>
              </div>
            </div>
            <iframe src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`} title={quotation.quote_number} className="min-h-0 flex-1 border-0 bg-neutral-100" />
          </div>
        </div>
      )}

      {convertOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Convertir cotización</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-neutral-950">
              Generar {quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Se validará nuevamente el stock y se creará una venta STORE por {money(quotation.total)} usando los precios guardados en la cotización. Después se preparará el documento tributario y se ejecutará únicamente el preflight de seguridad. La emisión DTE real permanece deshabilitada.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
                Medio de pago
              </label>

              <select
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setAmountReceived("");
                  setExternalReference("");
                }}
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-neutral-800 outline-none focus:border-black"
              >
                {paymentOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              {paymentMethod === "CASH" ? (
                <input
                  type="number"
                  min="0"
                  value={amountReceived}
                  onChange={(event) =>
                    setAmountReceived(event.target.value)
                  }
                  placeholder={`Efectivo recibido · mínimo ${Math.round(Number(quotation.total))}`}
                  className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                />
              ) : (
                <input
                  value={externalReference}
                  onChange={(event) =>
                    setExternalReference(event.target.value)
                  }
                  placeholder={
                    paymentMethod === "MANUAL_BANK_TRANSFER"
                      ? "N.º operación / referencia"
                      : "Voucher / autorización"
                  }
                  className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                />
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConvertOpen(false)} className="h-11 rounded-xl border border-black/10 text-sm font-medium">Cancelar</button>
              <button type="button" onClick={convert} disabled={actionLoading === "convert"} className="h-11 rounded-xl bg-black text-sm font-semibold text-white disabled:bg-neutral-300">
                {actionLoading === "convert" ? "Procesando..." : `Generar ${quotation.intended_document_type === "FACTURA" ? "Factura" : "Boleta"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
