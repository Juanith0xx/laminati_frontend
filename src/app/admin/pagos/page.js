"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import TaxDocumentPdfModal from "@/components/admin/TaxDocumentPdfModal";

import { apiRequest } from "@/services/api";

import {
  getTaxDocumentPdfSource,
  listTaxDocuments,
  queueTaxDocumentEmission,
  sendTaxDocumentEmail,
} from "@/services/taxDocuments.service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

const PAGE_SIZE = 8;

function money(value) {
  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  ).format(Number(value) || 0);
}

function dateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Santiago",
    }
  ).format(date);
}

function formatFileSize(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "—";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return String(
    localStorage.getItem("token") || ""
  )
    .replace(/^"|"$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function getStoredRole() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const rawUser =
      localStorage.getItem("user");

    if (!rawUser) {
      return "";
    }

    const user =
      JSON.parse(rawUser);

    return normalize(
      user?.role
    );
  } catch {
    return "";
  }
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeChannel(value) {
  const source = normalize(value);

  if (
    [
      "STORE",
      "SHOWROOM",
      "POS",
      "LOCAL",
    ].includes(source)
  ) {
    return "SHOWROOM";
  }

  if (
    [
      "ONLINE",
      "WEB",
      "ECOMMERCE",
      "CHECKOUT",
    ].includes(source)
  ) {
    return "ONLINE";
  }

  return source || "ONLINE";
}

function channelLabel(value) {
  return normalizeChannel(value) ===
    "SHOWROOM"
    ? "Showroom"
    : "Online";
}

function documentLabel(value) {
  const type = normalize(value);

  if (type === "FACTURA") {
    return "Factura electrónica";
  }

  if (type === "BOLETA") {
    return "Boleta electrónica";
  }

  return "Sin documento";
}

function paymentLabel(value) {
  const status = normalize(value);

  if (
    [
      "PAID",
      "APPROVED",
      "CONFIRMED",
    ].includes(status)
  ) {
    return "Pagado";
  }

  if (
    [
      "REJECTED",
      "FAILED",
      "CANCELLED",
    ].includes(status)
  ) {
    return "Rechazado";
  }

  return "Pendiente";
}

function dteLabel(row) {
  const sii = normalize(
    row?.sii_status
  );
  const status = normalize(
    row?.tax_status
  );
  const job = normalize(
    row?.emission_job_status
  );

  if (
    ["ACCEPTED", "ACEPTADO"].includes(
      sii
    ) ||
    status === "ACCEPTED"
  ) {
    return "Aceptado";
  }

  if (sii === "SENT_SII") {
    return "Enviado SII";
  }

  if (status === "ISSUED") {
    return "Emitido";
  }

  if (
    [
      "PENDING",
      "PROCESSING",
      "QUEUED",
    ].includes(status) ||
    ["QUEUED", "PROCESSING"].includes(
      job
    )
  ) {
    return "En emisión";
  }

  if (
    [
      "ERROR",
      "REJECTED",
      "FAILED",
      "BLOCKED",
      "REQUIRES_RECONCILIATION",
    ].includes(status) ||
    [
      "FAILED",
      "BLOCKED",
      "REQUIRES_RECONCILIATION",
    ].includes(job)
  ) {
    return "Incidencia";
  }

  return row?.tax_document_id
    ? "Pendiente"
    : "No emitido";
}

function paymentMethodLabel(row) {
  const raw = normalize(
    row?.payment_method_name ||
      row?.payment_method_code ||
      row?.proof?.payment_method_name ||
      row?.proof?.payment_method_code
  );

  if (
    raw.includes("TRANSFER") ||
    row?.proof
  ) {
    return "Transferencia";
  }

  if (raw.includes("CASH")) {
    return "Efectivo";
  }

  if (
    raw.includes("CARD") ||
    raw.includes("DEBIT") ||
    raw.includes("CREDIT")
  ) {
    return "Tarjeta";
  }

  if (raw.includes("WEBPAY")) {
    return "Webpay";
  }

  return (
    row?.payment_method_name ||
    row?.payment_method_code ||
    row?.proof?.payment_method_name ||
    row?.proof?.payment_method_code ||
    "—"
  );
}

function StatusPill({
  kind = "neutral",
  children,
}) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700",
    info:
      "border-blue-200 bg-blue-50 text-blue-700",
    neutral:
      "border-neutral-200 bg-neutral-50 text-neutral-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        styles[kind] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}

function Icon({
  name,
  className = "h-4 w-4",
}) {
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

  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M4 10v10h16V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M8 20v-6h8v6" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg {...common}>
        <path d="M3 4h2l2 11h10l2-7H7" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </svg>
    );
  }

  if (name === "document") {
    return (
      <svg {...common}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5" />
        <path d="M10 13h5M10 17h5" />
      </svg>
    );
  }

  if (name === "bank") {
    return (
      <svg {...common}>
        <path d="m3 9 9-5 9 5" />
        <path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (name === "mail") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (name === "print") {
    return (
      <svg {...common}>
        <path d="M7 8V3h10v5" />
        <rect x="6" y="14" width="12" height="7" rx="1" />
        <path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      </svg>
    );
  }

  if (name === "pos-print") {
    return (
      <svg {...common}>
        <path d="M7 7V3h10v4" />
        <rect x="4" y="7" width="16" height="8" rx="2" />
        <path d="M7 12h10v9l-2-1.5L13 21l-2-1.5L9 21l-2-1.5Z" />
        <path d="M16.5 10h.01" />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M4 21h16" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 17h.01" />
      </svg>
    );
  }

  return null;
}

function SummaryCard({
  icon,
  iconClass,
  title,
  value,
  helper,
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
        >
          <Icon name={icon} />
        </div>

        <div>
          <p className="text-xs text-neutral-500">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            {value}
          </p>
          {helper ? (
            <p className="mt-1 text-xs text-neutral-400">
              {helper}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProofPreviewModal({
  preview,
  onClose,
}) {
  if (!preview?.url) return null;

  const isImage = String(
    preview.mime || ""
  ).startsWith("image/");

  return (
    <div className="fixed inset-0 z-[170] bg-black/55 p-2 backdrop-blur-sm sm:p-4 lg:p-6">
      <div className="mx-auto flex h-full max-w-[1350px] flex-col overflow-hidden rounded-[1.75rem] bg-[#f5f4f1] shadow-2xl">
        <div className="flex shrink-0 flex-col gap-4 border-b border-black/5 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Laminati · Comprobante de pago
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-neutral-950">
              {preview.filename ||
                "Comprobante"}
            </h2>
          </div>

          <div className="flex gap-2">
            <a
              href={preview.url}
              download={
                preview.filename ||
                "comprobante"
              }
              className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700"
            >
              Descargar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full bg-black px-6 text-xs font-medium text-white"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3 sm:p-5">
          <div className="flex h-full items-center justify-center overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-sm">
            {isImage ? (
              <img
                src={preview.url}
                alt={
                  preview.filename ||
                  "Comprobante"
                }
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={preview.url}
                title="Comprobante de pago"
                className="h-full min-h-[520px] w-full border-0"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dialog({
  open,
  title,
  eyebrow,
  children,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em] text-neutral-950">
          {title}
        </h2>
        <div className="mt-6">
          {children}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-11 w-full rounded-full border border-neutral-200 text-xs font-medium text-neutral-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function mergeRows(documents, proofs) {
  const proofByOrder = new Map();

  for (const proof of proofs) {
    const key = String(
      proof?.order_id || ""
    );

    if (!key) continue;

    const existing =
      proofByOrder.get(key);

    if (
      !existing ||
      new Date(
        proof?.submitted_at ||
          proof?.created_at ||
          0
      ).getTime() >
        new Date(
          existing?.submitted_at ||
            existing?.created_at ||
            0
        ).getTime()
    ) {
      proofByOrder.set(key, proof);
    }
  }

  const rows = [];
  const usedOrders = new Set();

  for (const doc of documents) {
    const orderId = String(
      doc?.order_id || ""
    );
    const proof =
      proofByOrder.get(orderId) ||
      null;

    if (orderId) {
      usedOrders.add(orderId);
    }

    rows.push({
      key:
        orderId ||
        `dte-${doc.id}`,
      order_id: orderId,
      order_number:
        doc.order_number ||
        proof?.order_number ||
        "—",
      customer_name:
        doc.trade_name ||
        doc.legal_name ||
        doc.customer_name ||
        proof?.customer_name ||
        "Cliente",
      customer_rut:
        doc.customer_rut ||
        proof?.customer_rut ||
        "",
      email:
        doc.billing_email ||
        doc.email ||
        proof?.email ||
        "",
      phone:
        doc.customer_phone ||
        proof?.customer_phone ||
        "",
      source:
        doc.order_source ||
        proof?.order_source ||
        proof?.source ||
        "ONLINE",
      order_status:
        doc.order_status ||
        proof?.order_status ||
        "",
      payment_status:
        doc.payment_status ||
        doc.order_payment_status ||
        proof?.payment_status ||
        proof?.order_payment_status ||
        proof?.status ||
        "",
      payment_method_code:
        doc.payment_method_code ||
        proof?.payment_method_code ||
        "",
      payment_method_name:
        doc.payment_method_name ||
        proof?.payment_method_name ||
        "",
      payment_confirmed_at:
        doc.payment_confirmed_at ||
        proof?.reviewed_at ||
        null,
      total:
        doc.total_amount ||
        doc.order_total ||
        proof?.order_total ||
        proof?.submitted_amount ||
        0,
      document_type:
        doc.document_type ||
        proof?.billing_document_type ||
        proof?.tax_document_type ||
        "",
      tax_document_id:
        doc.id ||
        proof?.tax_document_id ||
        null,
      tax_status:
        doc.status ||
        proof?.tax_document_status ||
        "",
      folio:
        doc.folio ||
        proof?.tax_document_folio ||
        null,
      relbase_document_id:
        doc.relbase_document_id ||
        proof?.tax_document_relbase_document_id ||
        null,
      sii_status:
        doc.sii_status ||
        proof?.tax_document_sii_status ||
        "",
      sii_status_name:
        doc.sii_status_name ||
        proof?.tax_document_sii_status_name ||
        "",
      issued_at:
        doc.issued_at ||
        null,
      emission_job_status:
        doc.emission_job_status ||
        "",
      emission_last_error:
        doc.emission_last_error ||
        doc.error_message ||
        "",
      created_at:
        doc.created_at ||
        doc.order_created_at ||
        proof?.submitted_at ||
        proof?.created_at ||
        null,
      proof,
    });
  }

  for (const proof of proofs) {
    const orderId = String(
      proof?.order_id || ""
    );

    if (
      !orderId ||
      usedOrders.has(orderId)
    ) {
      continue;
    }

    rows.push({
      key: orderId,
      order_id: orderId,
      order_number:
        proof.order_number ||
        "—",
      customer_name:
        proof.customer_name ||
        "Cliente",
      customer_rut:
        proof.customer_rut ||
        "",
      email:
        proof.email ||
        "",
      phone:
        proof.customer_phone ||
        "",
      source:
        proof.order_source ||
        proof.source ||
        "ONLINE",
      order_status:
        proof.order_status ||
        "",
      payment_status:
        proof.payment_status ||
        proof.order_payment_status ||
        proof.status ||
        "",
      payment_method_code:
        proof.payment_method_code ||
        "TRANSFER",
      payment_method_name:
        proof.payment_method_name ||
        "Transferencia bancaria",
      payment_confirmed_at:
        proof.reviewed_at ||
        null,
      total:
        proof.order_total ||
        proof.submitted_amount ||
        0,
      document_type:
        proof.billing_document_type ||
        proof.tax_document_type ||
        "",
      tax_document_id:
        proof.tax_document_id ||
        null,
      tax_status:
        proof.tax_document_status ||
        "",
      folio:
        proof.tax_document_folio ||
        null,
      relbase_document_id:
        proof.tax_document_relbase_document_id ||
        null,
      sii_status:
        proof.tax_document_sii_status ||
        "",
      sii_status_name:
        proof.tax_document_sii_status_name ||
        "",
      issued_at: null,
      emission_job_status: "",
      emission_last_error: "",
      created_at:
        proof.submitted_at ||
        proof.created_at ||
        null,
      proof,
    });
  }

  return rows.sort(
    (a, b) =>
      new Date(
        b.created_at || 0
      ).getTime() -
      new Date(
        a.created_at || 0
      ).getTime()
  );
}

export default function AdminPaymentsDocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] =
    useState([]);
  const [proofs, setProofs] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [message, setMessage] =
    useState("");

  const [currentRole, setCurrentRole] =
    useState("");

  const isAdmin =
    normalize(currentRole) === "ADMIN";

  const isSeller =
    normalize(currentRole) === "VENDEDOR";

  const [channel, setChannel] =
    useState("ALL");
  const [query, setQuery] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [documentFilter, setDocumentFilter] =
    useState("ALL");
  const [requestedPage, setPage] =
    useState(1);

  const [requestedSelectedKey, setSelectedKey] =
    useState(null);

  const [taxPreview, setTaxPreview] =
    useState(null);
  const [taxPreviewUrl, setTaxPreviewUrl] =
    useState(null);
  const [taxActionLoading, setTaxActionLoading] =
    useState("");

  const [proofPreview, setProofPreview] =
    useState(null);
  const [proofLoadingId, setProofLoadingId] =
    useState(null);

  const [approveTarget, setApproveTarget] =
    useState(null);
  const [approveNotes, setApproveNotes] =
    useState("");
  const [rejectTarget, setRejectTarget] =
    useState(null);
  const [rejectReason, setRejectReason] =
    useState("");
  const [rejectNotes, setRejectNotes] =
    useState("");
  const [paymentActionLoading, setPaymentActionLoading] =
    useState(false);

  const [emailTarget, setEmailTarget] =
    useState(null);
  const [emailAddress, setEmailAddress] =
    useState("");
  const [emailFormat, setEmailFormat] =
    useState("letter");
  const [emailLoading, setEmailLoading] =
    useState(false);

  useEffect(() => {
    setCurrentRole(
      getStoredRole()
    );
  }, []);

  const loadData = useCallback(
    ({ silent = false } = {}) => {
      return Promise.all([
          listTaxDocuments({
            limit: 100,
            offset: 0,
          }),
          apiRequest(
            "/payments/admin/bank-transfer-proofs?status=PENDING&limit=100&offset=0"
          ),
          apiRequest(
            "/payments/admin/bank-transfer-proofs?status=APPROVED&limit=100&offset=0"
          ),
          apiRequest(
            "/payments/admin/bank-transfer-proofs?status=REJECTED&limit=100&offset=0"
          ),
        ]).then(([
          documentResponse,
          pendingResponse,
          approvedResponse,
          rejectedResponse,
        ]) => {
        const documentData =
          documentResponse?.data ||
          documentResponse ||
          {};

        const allProofs = [
          ...(pendingResponse?.data?.proofs || []),
          ...(approvedResponse?.data?.proofs || []),
          ...(rejectedResponse?.data?.proofs || []),
        ];

        const uniqueProofs = Array.from(
          new Map(
            allProofs.map((item) => [
              item.id,
              item,
            ])
          ).values()
        );

        setDocuments(
          Array.isArray(
            documentData.documents
          )
            ? documentData.documents
            : []
        );
        setProofs(uniqueProofs);
        setError("");
      }).catch((loadError) => {
        console.error(
          "Error cargando pagos y documentos:",
          loadError
        );

        if (
          loadError?.status === 401 ||
          loadError?.status === 403
        ) {
          router.replace("/login");
          return;
        }

        if (!silent) {
          setError(
            loadError?.message ||
              "No fue posible cargar pagos y documentos."
          );
        }
      }).finally(() => {
        if (!silent) {
          setLoading(false);
        }
      });
    },
    [router]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadData({
            silent: true,
          });
        }
      },
      5000
    );

    return () =>
      window.clearInterval(interval);
  }, [loadData]);

  const mergedRows = useMemo(
    () => mergeRows(documents, proofs),
    [documents, proofs]
  );

  const channelRows = useMemo(
    () =>
      mergedRows.filter((row) => {
        if (channel === "ALL") {
          return true;
        }

        return (
          normalizeChannel(row.source) ===
          channel
        );
      }),
    [mergedRows, channel]
  );

  const filteredRows = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return channelRows.filter((row) => {
      if (search) {
        const searchable = [
          row.order_number,
          row.customer_name,
          row.customer_rut,
          row.email,
          row.folio,
          row.relbase_document_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(search)) {
          return false;
        }
      }

      if (statusFilter !== "ALL") {
        if (
          statusFilter === "PAID" &&
          paymentLabel(
            row.payment_status
          ) !== "Pagado"
        ) {
          return false;
        }

        if (
          statusFilter === "PENDING" &&
          paymentLabel(
            row.payment_status
          ) !== "Pendiente"
        ) {
          return false;
        }

        if (
          statusFilter === "INCIDENT" &&
          paymentLabel(
            row.payment_status
          ) !== "Rechazado" &&
          dteLabel(row) !==
            "Incidencia"
        ) {
          return false;
        }
      }

      if (documentFilter !== "ALL") {
        if (
          documentFilter === "NONE" &&
          row.tax_document_id
        ) {
          return false;
        }

        if (
          ["FACTURA", "BOLETA"].includes(
            documentFilter
          ) &&
          normalize(
            row.document_type
          ) !== documentFilter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    channelRows,
    query,
    statusFilter,
    documentFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
        PAGE_SIZE
    )
  );

  const page = Math.min(requestedPage, totalPages);

  const paginatedRows =
    filteredRows.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );

  const selected = paginatedRows.find(
    (row) => row.key === requestedSelectedKey
  ) || paginatedRows[0] || null;
  const selectedKey = selected?.key || null;

  const summary = useMemo(() => {
    const base = channelRows;

    const pending = base.filter(
      (row) =>
        paymentLabel(
          row.payment_status
        ) === "Pendiente"
    );

    const paid = base.filter(
      (row) =>
        paymentLabel(
          row.payment_status
        ) === "Pagado"
    );

    const dtes = base.filter(
      (row) =>
        [
          "Emitido",
          "Enviado SII",
          "Aceptado",
        ].includes(dteLabel(row))
    );

    const incidents = base.filter(
      (row) =>
        paymentLabel(
          row.payment_status
        ) === "Rechazado" ||
        dteLabel(row) ===
          "Incidencia"
    );

    return {
      pending: pending.length,
      pendingAmount: pending.reduce(
        (sum, row) =>
          sum + Number(row.total || 0),
        0
      ),
      paid: paid.length,
      paidAmount: paid.reduce(
        (sum, row) =>
          sum + Number(row.total || 0),
        0
      ),
      dtes: dtes.length,
      incidents: incidents.length,
      incidentAmount: incidents.reduce(
        (sum, row) =>
          sum + Number(row.total || 0),
        0
      ),
    };
  }, [channelRows]);

  const closeTaxPreview =
    useCallback(() => {
      if (
        taxPreviewUrl?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          taxPreviewUrl
        );
      }

      setTaxPreview(null);
      setTaxPreviewUrl(null);
    }, [taxPreviewUrl]);

  const preferredTaxDocumentFormat =
    (row) =>
      normalize(
        row?.document_type
      ) === "FACTURA"
        ? "letter"
        : "original";

  const extractTaxDocumentPdfUrl =
    (payload) =>
      payload?.data?.document
        ?.pdf_url ||
      payload?.data?.pdf_url ||
      payload?.document?.pdf_url ||
      payload?.pdf_url ||
      null;

  const resolveTaxUrl =
    async (
      row,
      format = null
    ) => {
      if (!row?.tax_document_id) {
        throw new Error(
          "El documento tributario todavía no posee un identificador local."
        );
      }

      /*
       * Cuando necesitamos un formato concreto usamos
       * directamente el endpoint del backend porque
       * taxDocuments.service mantiene compatibilidad con
       * el flujo anterior sin query string.
       *
       * FACTURA:
       * - letter  -> representación A4 Laminatiword
       * - original -> PDF original Relbase / POS 80 mm
       */
      if (format) {
        if (!API_URL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL no se encuentra configurado."
          );
        }

        const token =
          getStoredToken();

        const response =
          await fetch(
            `${API_URL}/admin/integrations/relbase/dtes/${encodeURIComponent(
              row.tax_document_id
            )}/pdf?format=${encodeURIComponent(
              format
            )}`,
            {
              cache: "no-store",
              headers: token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {},
            }
          );

        const contentType =
          String(
            response.headers.get(
              "content-type"
            ) || ""
          ).toLowerCase();

        if (!response.ok) {
          const data =
            contentType.includes(
              "application/json"
            )
              ? await response
                  .json()
                  .catch(() => null)
              : null;

          const requestError =
            new Error(
              data?.message ||
                "No fue posible obtener el documento tributario."
            );

          requestError.status =
            response.status;

          throw requestError;
        }

        if (
          contentType.includes(
            "application/pdf"
          ) ||
          contentType.includes(
            "application/octet-stream"
          )
        ) {
          const blob =
            await response.blob();

          if (blob.size <= 0) {
            throw new Error(
              "El PDF recibido se encuentra vacío."
            );
          }

          const pdfBlob =
            blob.type ===
            "application/pdf"
              ? blob
              : new Blob(
                  [blob],
                  {
                    type:
                      "application/pdf",
                  }
                );

          return {
            url:
              URL.createObjectURL(
                pdfBlob
              ),
            temporary: true,
            blob: pdfBlob,
          };
        }

        const data =
          await response
            .json()
            .catch(() => null);

        const pdfUrl =
          extractTaxDocumentPdfUrl(
            data
          );

        if (pdfUrl) {
          return {
            url: pdfUrl,
            temporary: false,
            blob: null,
          };
        }

        throw new Error(
          "El backend respondió correctamente, pero no entregó un PDF utilizable."
        );
      }

      const source =
        await getTaxDocumentPdfSource(
          row.tax_document_id
        );

      if (
        source?.kind === "blob" &&
        source?.blob
      ) {
        return {
          url: URL.createObjectURL(
            source.blob
          ),
          temporary: true,
          blob: source.blob,
        };
      }

      if (
        source?.kind === "url" &&
        source?.url
      ) {
        return {
          url: source.url,
          temporary: false,
          blob: null,
        };
      }

      throw new Error(
        "No fue posible resolver el PDF del documento tributario."
      );
    };

  const openTaxDocument =
    async (row) => {
      try {
        setTaxActionLoading("open");
        setError("");

        const source =
          await resolveTaxUrl(
            row,
            preferredTaxDocumentFormat(
              row
            )
          );

        if (
          taxPreviewUrl?.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            taxPreviewUrl
          );
        }

        setTaxPreviewUrl(source.url);
        setTaxPreview({
          taxDocumentId:
            row.tax_document_id,
          orderNumber:
            row.order_number,
          documentType:
            row.document_type,
          folio: row.folio,
          status:
            row.tax_status,
          siiStatus:
            row.sii_status_name ||
            dteLabel(row),
        });
      } catch (openError) {
        setError(
          openError?.message ||
            "No fue posible abrir el documento tributario."
        );
      } finally {
        setTaxActionLoading("");
      }
    };

  const downloadTaxDocument =
    async (row) => {
      let temporaryUrl = null;

      try {
        setTaxActionLoading(
          "download"
        );
        const source =
          await resolveTaxUrl(
            row,
            preferredTaxDocumentFormat(
              row
            )
          );
        temporaryUrl = source.temporary
          ? source.url
          : null;

        const link =
          document.createElement("a");
        link.href = source.url;
        link.download = `${
          normalize(
            row.document_type
          ) === "FACTURA"
            ? "factura"
            : "boleta"
        }-${
          row.folio ||
          row.order_number ||
          "laminati"
        }.pdf`;
        link.target = "_blank";
        link.rel =
          "noopener noreferrer";
        document.body.appendChild(
          link
        );
        link.click();
        link.remove();
      } catch (downloadError) {
        setError(
          downloadError?.message ||
            "No fue posible descargar el documento."
        );
      } finally {
        setTaxActionLoading("");

        if (temporaryUrl) {
          window.setTimeout(
            () =>
              URL.revokeObjectURL(
                temporaryUrl
              ),
            30000
          );
        }
      }
    };

  const printTaxDocument =
    async (
      row,
      format =
        preferredTaxDocumentFormat(
          row
        ),
      actionKey =
        "print-letter"
    ) => {
      let temporaryUrl = null;

      try {
        setTaxActionLoading(
          actionKey
        );
        setError(
          ""
        );

        const source =
          await resolveTaxUrl(
            row,
            format
          );

        temporaryUrl =
          source.temporary
            ? source.url
            : null;

        const printWindow =
          window.open(
            source.url,
            "_blank"
          );

        if (!printWindow) {
          throw new Error(
            "El navegador bloqueó la ventana de impresión."
          );
        }

        /*
         * Intentamos abrir el diálogo de impresión
         * tanto para Blob A4 como para el PDF original
         * de Relbase. Si el visor del navegador aún no
         * está listo, el documento permanece abierto y
         * se puede imprimir manualmente.
         */
        window.setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {
            // El visor PDF seguirá abierto para impresión manual.
          }
        }, 1400);
      } catch (printError) {
        setError(
          printError?.message ||
            "No fue posible abrir la impresión."
        );
      } finally {
        setTaxActionLoading(
          ""
        );

        if (temporaryUrl) {
          window.setTimeout(
            () =>
              URL.revokeObjectURL(
                temporaryUrl
              ),
            60000
          );
        }
      }
    };

  const openProof = async (row) => {
    const proof = row?.proof;

    if (!proof?.id || !API_URL) {
      return;
    }

    try {
      setProofLoadingId(proof.id);
      setError("");

      const token =
        getStoredToken();

      const response = await fetch(
        `${API_URL}/payments/admin/bank-transfer-proofs/${encodeURIComponent(
          proof.id
        )}/file`,
        {
          cache: "no-store",
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);
        throw new Error(
          data?.message ||
            "No fue posible abrir el comprobante."
        );
      }

      const blob =
        await response.blob();
      const url =
        URL.createObjectURL(blob);

      if (
        proofPreview?.url?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          proofPreview.url
        );
      }

      setProofPreview({
        url,
        mime: blob.type,
        filename:
          proof.original_filename ||
          "comprobante",
      });
    } catch (proofError) {
      setError(
        proofError?.message ||
          "No fue posible abrir el comprobante."
      );
    } finally {
      setProofLoadingId(null);
    }
  };

  const closeProofPreview = () => {
    if (
      proofPreview?.url?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        proofPreview.url
      );
    }

    setProofPreview(null);
  };

  const approvePayment = async () => {
    if (!isAdmin) {
      setError(
        "Sólo un administrador puede aprobar pagos por transferencia."
      );
      return;
    }

    if (!approveTarget?.proof?.id) {
      return;
    }

    try {
      setPaymentActionLoading(true);
      setError("");
      setMessage("");

      const response =
        await apiRequest(
          `/payments/admin/bank-transfer-proofs/${approveTarget.proof.id}/approve`,
          {
            method: "PATCH",
            body: {
              review_notes:
                approveNotes.trim() ||
                null,
            },
          }
        );

      let queueMessage = "";

      if (approveTarget.order_id) {
        try {
          await queueTaxDocumentEmission(
            approveTarget.order_id
          );
          queueMessage =
            " Documento tributario enviado a emisión.";
        } catch (queueError) {
          console.error(
            "Pago aprobado, pero DTE no pudo encolarse:",
            queueError
          );
          queueMessage =
            " El pago quedó aprobado, pero revisa la emisión tributaria.";
        }
      }

      setMessage(
        `${
          response?.message ||
          "Transferencia aprobada correctamente."
        }${queueMessage}`
      );
      setApproveTarget(null);
      setApproveNotes("");
      setLoading(true);
      await loadData();
    } catch (approveError) {
      setError(
        approveError?.message ||
          "No fue posible aprobar la transferencia."
      );
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const rejectPayment = async () => {
    if (!isAdmin) {
      setError(
        "Sólo un administrador puede rechazar comprobantes."
      );
      return;
    }

    if (!rejectTarget?.proof?.id) {
      return;
    }

    if (!rejectReason.trim()) {
      setError(
        "Debes indicar el motivo del rechazo."
      );
      return;
    }

    try {
      setPaymentActionLoading(true);
      setError("");
      setMessage("");

      const response =
        await apiRequest(
          `/payments/admin/bank-transfer-proofs/${rejectTarget.proof.id}/reject`,
          {
            method: "PATCH",
            body: {
              reason:
                rejectReason.trim(),
              review_notes:
                rejectNotes.trim() ||
                null,
            },
          }
        );

      setMessage(
        response?.message ||
          "Comprobante rechazado correctamente."
      );
      setRejectTarget(null);
      setRejectReason("");
      setRejectNotes("");
      setLoading(true);
      await loadData();
    } catch (rejectError) {
      setError(
        rejectError?.message ||
          "No fue posible rechazar el comprobante."
      );
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const emitDocument = async (row) => {
    if (!isAdmin) {
      setError(
        "La emisión manual de documentos tributarios está reservada al administrador."
      );
      return;
    }

    if (!row?.order_id) return;

    try {
      setTaxActionLoading("emit");
      setError("");
      setMessage("");

      const response =
        await queueTaxDocumentEmission(
          row.order_id
        );

      setMessage(
        response?.message ||
          "Documento tributario enviado a emisión."
      );

      setLoading(true);
      await loadData();
    } catch (emitError) {
      setError(
        emitError?.message ||
          "No fue posible encolar la emisión tributaria."
      );
    } finally {
      setTaxActionLoading("");
    }
  };

  const openEmailDialog = (row) => {
    setEmailTarget(row);
    setEmailAddress(
      row?.email || ""
    );

    setEmailFormat(
      normalize(
        row?.document_type
      ) === "FACTURA"
        ? "letter"
        : "original"
    );
  };

  const confirmEmail = async () => {
    if (!emailTarget?.tax_document_id) {
      return;
    }

    if (!emailAddress.trim()) {
      setError(
        "Debes indicar un correo destinatario."
      );
      return;
    }

    try {
      setEmailLoading(true);
      setError("");
      setMessage("");

      const response =
        await sendTaxDocumentEmail({
          taxDocumentId:
            emailTarget.tax_document_id,
          recipientEmail:
            emailAddress.trim(),
          documentFormat:
            normalize(
              emailTarget.document_type
            ) === "FACTURA"
              ? emailFormat
              : "original",
        });

      setMessage(
        response?.message ||
          "Documento encolado para envío por correo."
      );
      setEmailTarget(null);
      setEmailAddress("");
      setEmailFormat("letter");
    } catch (emailError) {
      setError(
        emailError?.message ||
          "No fue posible enviar el documento por correo."
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const selectedPaymentLabel =
    selected
      ? paymentLabel(
          selected.payment_status
        )
      : "";

  const selectedDteLabel =
    selected
      ? dteLabel(selected)
      : "";

  const selectedAccepted =
    selected
      ? selectedDteLabel ===
        "Aceptado"
      : false;

  const selectedCanViewDte =
    Boolean(
      selected?.tax_document_id &&
        [
          "Emitido",
          "Enviado SII",
          "Aceptado",
        ].includes(
          selectedDteLabel
        )
    );

  return (
    <main className="min-h-screen bg-[#f7f6f4] px-4 py-7 text-neutral-950 sm:px-7 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <header className="rounded-[28px] border border-neutral-200 bg-white px-6 py-6 shadow-sm sm:px-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {isSeller
                  ? "Laminati · Ventas"
                  : "Laminati · Administración"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
                Pagos y documentos
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Unifica transferencias, pagos online y documentos tributarios en una sola vista.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["ALL", "Todos", null],
                  ["SHOWROOM", "Showroom", "store"],
                  ["ONLINE", "Online", "cart"],
                ].map(
                  ([id, label, icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setChannel(id);
                        setPage(1);
                        setSelectedKey(null);
                      }}
                      className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-medium transition ${
                        channel === id
                          ? "bg-black text-white"
                          : "border border-neutral-200 bg-white text-neutral-700 hover:border-black"
                      }`}
                    >
                      {icon ? (
                        <Icon name={icon} />
                      ) : null}
                      {label}
                    </button>
                  )
                )}
              </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon="clock"
                iconClass="bg-orange-50 text-orange-600"
                title="Pendientes"
                value={summary.pending}
                helper={money(
                  summary.pendingAmount
                )}
              />
              <SummaryCard
                icon="check"
                iconClass="bg-emerald-50 text-emerald-600"
                title="Pagados"
                value={summary.paid}
                helper={money(
                  summary.paidAmount
                )}
              />
              <SummaryCard
                icon="document"
                iconClass="bg-blue-50 text-blue-600"
                title="DTE emitidos"
                value={summary.dtes}
                helper="Facturas y boletas"
              />
              <SummaryCard
                icon="alert"
                iconClass="bg-rose-50 text-rose-600"
                title="Con incidencia"
                value={summary.incidents}
                helper={money(
                  summary.incidentAmount
                )}
              />
            </section>

            <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
              <div className="grid gap-3 border-b border-neutral-100 p-4 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
                <label className="relative block">
                  <Icon
                    name="search"
                    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                      setSelectedKey(null);
                    }}
                    placeholder="Buscar por número de pedido, cliente, RUT o folio..."
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                      setSelectedKey(null);
                    }}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
                >
                  <option value="ALL">
                    Todos los estados
                  </option>
                  <option value="PAID">
                    Pagados
                  </option>
                  <option value="PENDING">
                    Pendientes
                  </option>
                  <option value="INCIDENT">
                    Con incidencia
                  </option>
                </select>

                <select
                  value={documentFilter}
                  onChange={(event) => {
                      setDocumentFilter(event.target.value);
                      setPage(1);
                      setSelectedKey(null);
                    }}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
                >
                  <option value="ALL">
                    Todos los documentos
                  </option>
                  <option value="FACTURA">
                    Facturas
                  </option>
                  <option value="BOLETA">
                    Boletas
                  </option>
                  <option value="NONE">
                    Sin DTE
                  </option>
                </select>
              </div>

              {message ? (
                <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="p-10 text-center text-sm text-neutral-400">
                  Cargando pagos y documentos...
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-10 text-center text-sm text-neutral-400">
                  No hay resultados para los filtros seleccionados.
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[980px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/60 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          <th className="px-4 py-3">Pedido</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Origen</th>
                          <th className="px-4 py-3">Medio de pago</th>
                          <th className="px-4 py-3">Estado pago</th>
                          <th className="px-4 py-3">Documento</th>
                          <th className="px-4 py-3">Estado DTE</th>
                          <th className="px-4 py-3 text-right">Monto</th>
                          <th className="w-10 px-2 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map(
                          (row) => {
                            const payment =
                              paymentLabel(
                                row.payment_status
                              );
                            const dte =
                              dteLabel(row);
                            const channelValue =
                              normalizeChannel(
                                row.source
                              );

                            return (
                              <tr
                                key={row.key}
                                onClick={() =>
                                  setSelectedKey(
                                    row.key
                                  )
                                }
                                className={`cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 ${
                                  selectedKey ===
                                  row.key
                                    ? "bg-neutral-100/80"
                                    : "bg-white"
                                }`}
                              >
                                <td className="px-4 py-3 align-top">
                                  <p className="text-xs font-semibold text-neutral-950">
                                    {row.order_number}
                                  </p>
                                  <p className="mt-1 text-[10px] text-neutral-400">
                                    {dateTime(
                                      row.created_at
                                    )}
                                  </p>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <p className="text-xs font-medium text-neutral-900">
                                    {row.customer_name}
                                  </p>
                                  <p className="mt-1 max-w-[180px] truncate text-[10px] text-neutral-400">
                                    {row.email ||
                                      row.customer_rut ||
                                      "—"}
                                  </p>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <StatusPill
                                    kind={
                                      channelValue ===
                                      "SHOWROOM"
                                        ? "neutral"
                                        : "info"
                                    }
                                  >
                                    <span className="mr-1.5">
                                      <Icon
                                        name={
                                          channelValue ===
                                          "SHOWROOM"
                                            ? "store"
                                            : "cart"
                                        }
                                        className="h-3.5 w-3.5"
                                      />
                                    </span>
                                    {channelLabel(
                                      row.source
                                    )}
                                  </StatusPill>
                                </td>
                                <td className="px-4 py-3 text-xs text-neutral-700">
                                  {paymentMethodLabel(
                                    row
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusPill
                                    kind={
                                      payment ===
                                      "Pagado"
                                        ? "success"
                                        : payment ===
                                          "Rechazado"
                                        ? "danger"
                                        : "warning"
                                    }
                                  >
                                    {payment}
                                  </StatusPill>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <p className="text-xs font-medium text-neutral-900">
                                    {normalize(
                                      row.document_type
                                    ) ===
                                    "FACTURA"
                                      ? "Factura"
                                      : normalize(
                                          row.document_type
                                        ) ===
                                        "BOLETA"
                                      ? "Boleta"
                                      : "—"}
                                  </p>
                                  <p className="mt-1 text-[10px] text-neutral-400">
                                    {row.folio
                                      ? `N.º ${row.folio}`
                                      : "N.º —"}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <StatusPill
                                    kind={
                                      dte ===
                                        "Aceptado" ||
                                      dte ===
                                        "Emitido" ||
                                      dte ===
                                        "Enviado SII"
                                        ? "success"
                                        : dte ===
                                          "Incidencia"
                                        ? "danger"
                                        : dte ===
                                          "En emisión"
                                        ? "warning"
                                        : "neutral"
                                    }
                                  >
                                    {dte}
                                  </StatusPill>
                                </td>
                                <td className="px-4 py-3 text-right text-xs font-semibold text-neutral-950">
                                  {money(row.total)}
                                </td>
                                <td className="px-2 py-3 text-center text-neutral-400">
                                  ›
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-neutral-100 md:hidden">
                    {paginatedRows.map(
                      (row) => (
                        <button
                          key={row.key}
                          type="button"
                          onClick={() =>
                            setSelectedKey(
                              row.key
                            )
                          }
                          className="block w-full p-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold">
                                {row.order_number}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {row.customer_name}
                              </p>
                            </div>
                            <p className="text-sm font-semibold">
                              {money(row.total)}
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill
                              kind="neutral"
                            >
                              {channelLabel(
                                row.source
                              )}
                            </StatusPill>
                            <StatusPill
                              kind={
                                paymentLabel(
                                  row.payment_status
                                ) ===
                                "Pagado"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {paymentLabel(
                                row.payment_status
                              )}
                            </StatusPill>
                            <StatusPill
                              kind="neutral"
                            >
                              {dteLabel(row)}
                            </StatusPill>
                          </div>
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-neutral-400">
                      Mostrando {Math.min(
                        (page - 1) *
                          PAGE_SIZE +
                          1,
                        filteredRows.length
                      )} a {Math.min(
                        page * PAGE_SIZE,
                        filteredRows.length
                      )} de {filteredRows.length} resultados
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() =>
                          setPage(Math.max(1, page - 1))
                        }
                        className="h-9 w-9 rounded-xl border border-neutral-200 text-sm disabled:opacity-30"
                      >
                        ‹
                      </button>
                      <span className="min-w-20 text-center text-xs text-neutral-500">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={
                          page >= totalPages
                        }
                        onClick={() =>
                          setPage(Math.min(totalPages, page + 1))
                        }
                        className="h-9 w-9 rounded-xl border border-neutral-200 text-sm disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              {!selected ? (
                <div className="py-16 text-center text-sm text-neutral-400">
                  Selecciona un pedido para ver su detalle.
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                          Pedido
                        </p>
                        <StatusPill
                          kind={
                            selectedPaymentLabel ===
                            "Pagado"
                              ? "success"
                              : selectedPaymentLabel ===
                                "Rechazado"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {selectedPaymentLabel}
                        </StatusPill>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-950">
                        {selected.order_number}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-400">
                        Creado {dateTime(
                          selected.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[20px] border border-neutral-200 p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Información general
                    </h3>

                    <dl className="mt-4 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-neutral-400">
                          Cliente
                        </dt>
                        <dd className="max-w-[220px] text-right font-medium text-neutral-900">
                          {selected.customer_name}
                          {selected.email ? (
                            <span className="mt-1 block font-normal text-neutral-400">
                              {selected.email}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-neutral-400">
                          Origen
                        </dt>
                        <dd>
                          <StatusPill
                            kind={
                              normalizeChannel(
                                selected.source
                              ) ===
                              "SHOWROOM"
                                ? "neutral"
                                : "info"
                            }
                          >
                            {channelLabel(
                              selected.source
                            )}
                          </StatusPill>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-neutral-400">
                          Estado de pago
                        </dt>
                        <dd>
                          <StatusPill
                            kind={
                              selectedPaymentLabel ===
                              "Pagado"
                                ? "success"
                                : selectedPaymentLabel ===
                                  "Rechazado"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {selectedPaymentLabel}
                          </StatusPill>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-neutral-400">
                          Monto
                        </dt>
                        <dd className="font-semibold text-neutral-950">
                          {money(selected.total)}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-neutral-400">
                          Medio de pago
                        </dt>
                        <dd className="text-right font-medium text-neutral-800">
                          {paymentMethodLabel(
                            selected
                          )}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-neutral-400">
                          Fecha de pago
                        </dt>
                        <dd className="text-right font-medium text-neutral-800">
                          {dateTime(
                            selected.payment_confirmed_at
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {selected.proof ? (
                    <div className="mt-4 rounded-[20px] border border-neutral-200 p-4">
                      <h3 className="text-sm font-semibold text-neutral-950">
                        Comprobante de pago
                      </h3>

                      <div className="mt-4 rounded-xl bg-emerald-50 p-3">
                        <p className="break-all text-xs font-medium text-neutral-900">
                          {selected.proof.original_filename ||
                            "Comprobante"}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {formatFileSize(
                            selected.proof.file_size_bytes
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          proofLoadingId ===
                          selected.proof.id
                        }
                        onClick={() =>
                          void openProof(
                            selected
                          )
                        }
                        className="mt-3 h-10 w-full rounded-full border border-neutral-200 text-xs font-medium text-neutral-700 transition hover:border-black disabled:opacity-40"
                      >
                        {proofLoadingId ===
                        selected.proof.id
                          ? "Abriendo..."
                          : "Ver comprobante"}
                      </button>

                      {selected.proof.review_notes ? (
                        <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                          {selected.proof.review_notes}
                        </div>
                      ) : null}

                      {normalize(
                        selected.proof.status
                      ) === "PENDING" &&
                      isAdmin ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRejectTarget(
                                selected
                              )
                            }
                            className="h-10 rounded-full border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setApproveTarget(
                                selected
                              )
                            }
                            className="h-10 rounded-full bg-black text-xs font-medium text-white"
                          >
                            Aprobar pago
                          </button>
                        </div>
                      ) : normalize(
                          selected.proof.status
                        ) === "PENDING" &&
                        isSeller ? (
                        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
                          Comprobante pendiente de revisión administrativa.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-[20px] border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-neutral-950">
                        Documento tributario
                      </h3>
                      <StatusPill
                        kind={
                          selectedDteLabel ===
                            "Aceptado" ||
                          selectedDteLabel ===
                            "Enviado SII" ||
                          selectedDteLabel ===
                            "Emitido"
                            ? "success"
                            : selectedDteLabel ===
                              "Incidencia"
                            ? "danger"
                            : selectedDteLabel ===
                              "En emisión"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {selectedDteLabel}
                      </StatusPill>
                    </div>

                    <div className="mt-4 rounded-xl bg-neutral-50 p-3">
                      <p className="text-xs font-medium text-neutral-950">
                        {documentLabel(
                          selected.document_type
                        )}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-400">
                        {selected.folio
                          ? `N.º ${selected.folio}`
                          : "Folio pendiente"}
                      </p>
                    </div>

                    {selectedCanViewDte ? (
                      <>
                        <button
                          type="button"
                          disabled={
                            taxActionLoading ===
                            "open"
                          }
                          onClick={() =>
                            void openTaxDocument(
                              selected
                            )
                          }
                          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-black"
                        >
                          <Icon
                            name="eye"
                            className="h-4 w-4"
                          />
                          {taxActionLoading ===
                          "open"
                            ? "Abriendo..."
                            : "Ver documento"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            taxActionLoading ===
                            "download"
                          }
                          onClick={() =>
                            void downloadTaxDocument(
                              selected
                            )
                          }
                          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-medium text-white"
                        >
                          <Icon
                            name="download"
                            className="h-4 w-4"
                          />
                          Descargar PDF
                        </button>

                        <div
                          className={`mt-3 grid gap-2 ${
                            normalize(
                              selected.document_type
                            ) === "FACTURA"
                              ? "grid-cols-3"
                              : "grid-cols-2"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={
                              !selectedAccepted ||
                              emailLoading
                            }
                            title={
                              selectedAccepted
                                ? "Enviar documento por correo"
                                : "Disponible cuando el SII acepte el documento"
                            }
                            aria-label="Enviar documento por correo"
                            onClick={() =>
                              openEmailDialog(
                                selected
                              )
                            }
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 text-[10px] font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon
                              name="mail"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span className="truncate">
                              Enviar
                            </span>
                          </button>

                          {normalize(
                            selected.document_type
                          ) === "FACTURA" ? (
                            <button
                              type="button"
                              disabled={
                                taxActionLoading ===
                                "print-letter"
                              }
                              title="Imprimir Carta / A4"
                              aria-label="Imprimir Carta / A4"
                              onClick={() =>
                                void printTaxDocument(
                                  selected,
                                  "letter",
                                  "print-letter"
                                )
                              }
                              className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 text-[10px] font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon
                                name="print"
                                className="h-3.5 w-3.5 shrink-0"
                              />
                              <span className="truncate">
                                Imprimir Carta
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            disabled={
                              taxActionLoading ===
                              "print-pos"
                            }
                            title="Imprimir POS 80 mm"
                            aria-label="Imprimir POS 80 mm"
                            onClick={() =>
                              void printTaxDocument(
                                selected,
                                "original",
                                "print-pos"
                              )
                            }
                            className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 text-[10px] font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon
                              name="pos-print"
                              className="h-3.5 w-3.5 shrink-0"
                            />
                            <span className="truncate">
                              Imprimir POS
                            </span>
                          </button>
                        </div>

                        <div
                          className={`mt-3 rounded-xl px-3 py-2 text-[11px] ${
                            selectedAccepted
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {selectedAccepted
                            ? "Documento aceptado por el SII"
                            : selected.sii_status_name
                            ? `SII: ${selected.sii_status_name}`
                            : `Estado: ${selectedDteLabel}`}
                        </div>
                      </>
                    ) : selectedPaymentLabel ===
                        "Pagado" &&
                      [
                        "No emitido",
                        "Pendiente",
                        "En emisión",
                      ].includes(
                        selectedDteLabel
                      ) &&
                      [
                        "FACTURA",
                        "BOLETA",
                      ].includes(
                        normalize(
                          selected.document_type
                        )
                      ) ? (
                      isAdmin ? (
                        <button
                          type="button"
                          disabled={
                            taxActionLoading ===
                            "emit" ||
                            selectedDteLabel ===
                              "En emisión"
                          }
                          onClick={() =>
                            void emitDocument(
                              selected
                            )
                          }
                          className="mt-3 h-10 w-full rounded-full bg-black text-xs font-medium text-white disabled:opacity-40"
                        >
                          {selectedDteLabel ===
                          "En emisión"
                            ? "Documento en emisión..."
                            : taxActionLoading ===
                              "emit"
                            ? "Encolando..."
                            : "Emitir documento"}
                        </button>
                      ) : (
                        <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-[11px] leading-4 text-blue-700">
                          {selectedDteLabel ===
                          "En emisión"
                            ? "Documento tributario en proceso de emisión."
                            : "Documento pendiente de emisión administrativa."}
                        </div>
                      )
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-neutral-400">
                        El documento tributario estará disponible cuando el pago quede confirmado.
                      </p>
                    )}

                    {selected.emission_last_error &&
                    !selectedAccepted ? (
                      <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {isAdmin
                          ? selected.emission_last_error
                          : "El documento presenta una incidencia y requiere revisión administrativa."}
                      </div>
                    ) : null}

                    {selected.issued_at ? (
                      <p className="mt-3 text-[10px] text-neutral-400">
                        Emitido {dateTime(
                          selected.issued_at
                        )}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      <TaxDocumentPdfModal
        preview={taxPreview}
        url={taxPreviewUrl}
        onClose={closeTaxPreview}
      />

      <ProofPreviewModal
        preview={proofPreview}
        onClose={closeProofPreview}
      />

      <Dialog
        open={isAdmin && Boolean(approveTarget)}
        eyebrow="Confirmar transferencia"
        title="Aprobar pago"
        onClose={() => {
          setApproveTarget(null);
          setApproveNotes("");
        }}
      >
        <p className="text-sm leading-6 text-neutral-500">
          Confirmarás como pagado el pedido <strong className="text-neutral-950">{approveTarget?.order_number}</strong> por <strong className="text-neutral-950">{money(approveTarget?.total)}</strong>.
        </p>
        <textarea
          value={approveNotes}
          onChange={(event) =>
            setApproveNotes(
              event.target.value
            )
          }
          placeholder="Notas de revisión (opcional)"
          className="mt-5 min-h-24 w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-black"
        />
        <button
          type="button"
          disabled={paymentActionLoading}
          onClick={() =>
            void approvePayment()
          }
          className="mt-4 h-11 w-full rounded-full bg-black text-xs font-medium text-white disabled:opacity-40"
        >
          {paymentActionLoading
            ? "Aprobando..."
            : "Aprobar transferencia"}
        </button>
      </Dialog>

      <Dialog
        open={isAdmin && Boolean(rejectTarget)}
        eyebrow="Rechazar transferencia"
        title="Rechazar comprobante"
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
          setRejectNotes("");
        }}
      >
        <input
          value={rejectReason}
          onChange={(event) =>
            setRejectReason(
              event.target.value
            )
          }
          placeholder="Motivo del rechazo"
          className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
        />
        <textarea
          value={rejectNotes}
          onChange={(event) =>
            setRejectNotes(
              event.target.value
            )
          }
          placeholder="Notas de revisión (opcional)"
          className="mt-3 min-h-24 w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-black"
        />
        <button
          type="button"
          disabled={paymentActionLoading}
          onClick={() =>
            void rejectPayment()
          }
          className="mt-4 h-11 w-full rounded-full bg-rose-600 text-xs font-medium text-white disabled:opacity-40"
        >
          {paymentActionLoading
            ? "Rechazando..."
            : "Rechazar comprobante"}
        </button>
      </Dialog>

      <Dialog
        open={Boolean(emailTarget)}
        eyebrow="Documento tributario"
        title="Enviar por correo"
        onClose={() => {
          setEmailTarget(null);
          setEmailAddress("");
          setEmailFormat("letter");
        }}
      >
        <p className="text-sm leading-6 text-neutral-500">
          Se enviará {documentLabel(emailTarget?.document_type).toLowerCase()} {emailTarget?.folio ? `N.º ${emailTarget.folio}` : ""} usando la cola de correos de LaminatiWord.
        </p>
        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-semibold text-neutral-500">
            Destinatario
          </span>
          <input
            type="email"
            value={emailAddress}
            onChange={(event) =>
              setEmailAddress(
                event.target.value
              )
            }
            placeholder="cliente@correo.cl"
            className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-black"
          />
        </label>
        {normalize(
          emailTarget?.document_type
        ) === "FACTURA" ? (
          <div className="mt-5">
            <span className="mb-2 block text-xs font-semibold text-neutral-500">
              Formato de la factura
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setEmailFormat(
                    "letter"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  emailFormat ===
                  "letter"
                    ? "border-black bg-neutral-950 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name="print"
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-semibold">
                    Carta / A4
                  </span>
                </div>
                <p
                  className={`mt-2 text-[10px] leading-4 ${
                    emailFormat ===
                    "letter"
                      ? "text-neutral-300"
                      : "text-neutral-400"
                  }`}
                >
                  Página completa, ideal para correo y archivo.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEmailFormat(
                    "original"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  emailFormat ===
                  "original"
                    ? "border-black bg-neutral-950 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name="pos-print"
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-semibold">
                    POS / 80 mm
                  </span>
                </div>
                <p
                  className={`mt-2 text-[10px] leading-4 ${
                    emailFormat ===
                    "original"
                      ? "text-neutral-300"
                      : "text-neutral-400"
                  }`}
                >
                  Representación original de Relbase para impresora térmica.
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-neutral-700">
              <Icon
                name="pos-print"
                className="h-4 w-4"
              />
              <span className="text-xs font-semibold">
                Formato POS / original
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-neutral-400">
              Las boletas se enviarán usando su representación original.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={emailLoading}
          onClick={() =>
            void confirmEmail()
          }
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-medium text-white disabled:opacity-40"
        >
          <Icon
            name="mail"
            className="h-4 w-4"
          />
          {emailLoading
            ? "Encolando envío..."
            : "Enviar documento"}
        </button>
      </Dialog>
    </main>
  );
}
