"use client";

import {
  apiRequest,
} from "@/services/api";

const getToken = () =>
  typeof window !==
  "undefined"
    ? String(
        localStorage.getItem(
          "token"
        ) || ""
      )
        .replace(
          /^"|"$/g,
          ""
        )
        .replace(
          /^Bearer\s+/i,
          ""
        )
        .trim()
    : "";

export async function listTaxDocuments({
  type = "",
  status = "",
  siiStatus = "",
  q = "",
  dateFrom = "",
  dateTo = "",
  limit = 50,
  offset = 0,
  signal,
} = {}) {
  const params =
    new URLSearchParams();

  if (type) {
    params.set(
      "type",
      type
    );
  }

  if (status) {
    params.set(
      "status",
      status
    );
  }

  if (siiStatus) {
    params.set(
      "sii_status",
      siiStatus
    );
  }

  if (q) {
    params.set(
      "q",
      q
    );
  }

  if (dateFrom) {
    params.set(
      "date_from",
      dateFrom
    );
  }

  if (dateTo) {
    params.set(
      "date_to",
      dateTo
    );
  }

  params.set(
    "limit",
    String(limit)
  );

  params.set(
    "offset",
    String(offset)
  );

  return apiRequest(
    `/admin/tax-documents?${params.toString()}`,
    {
      signal,
    }
  );
}

function extractDocumentUrl(
  data
) {
  return String(
    data?.data?.document?.pdf_url ||
      data?.data?.document?.url ||
      data?.data?.document?.pdf_file ||
      data?.data?.document?.print_url ||
      data?.data?.document?.document_url ||
      data?.data?.url ||
      data?.data?.pdf_url ||
      data?.data?.pdf_file ||
      data?.data?.print_url ||
      data?.data?.document_url ||
      data?.data?.printable_url ||
      data?.data?.tax_document?.pdf_url ||
      data?.data?.tax_document?.url ||
      data?.data?.tax_document?.print_url ||
      data?.tax_document?.pdf_url ||
      data?.tax_document?.url ||
      data?.tax_document?.print_url ||
      data?.document?.pdf_url ||
      data?.document?.url ||
      data?.document?.pdf_file ||
      data?.document?.print_url ||
      data?.url ||
      data?.pdf_url ||
      data?.pdf_file ||
      data?.print_url ||
      data?.document_url ||
      ""
  ).trim();
}

function isRelbaseViewerUrl(
  url
) {
  const normalizedUrl =
    String(
      url || ""
    ).trim();

  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsedUrl =
      new URL(
        normalizedUrl
      );

    return (
      parsedUrl.hostname ===
        "app.relbase.cl" &&
      parsedUrl.pathname.startsWith(
        "/dtes/"
      )
    );
  } catch {
    return false;
  }
}

function startsWithPdfMagic(
  buffer
) {
  const bytes =
    new Uint8Array(
      buffer,
      0,
      Math.min(
        5,
        buffer.byteLength
      )
    );

  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function decodeJsonBuffer(
  buffer
) {
  try {
    const text =
      new TextDecoder(
        "utf-8"
      )
        .decode(
          buffer
        )
        .trim();

    if (!text) {
      return null;
    }

    return JSON.parse(
      text
    );
  } catch {
    return null;
  }
}

/**
 * Obtiene una fuente visualizable del DTE.
 *
 * El endpoint backend puede responder de dos formas válidas:
 * 1) PDF binario real.
 * 2) JSON con una URL temporal al PDF generada por Relbase.
 *
 * Nunca convierte JSON a application/pdf. Esa era la causa del
 * mensaje "Se ha producido un error al cargar el documento PDF".
 */
export async function getTaxDocumentPdfSource(
  taxDocumentId
) {
  const API_URL =
    process.env
      .NEXT_PUBLIC_API_URL;

  const token =
    getToken();

  const response =
    await fetch(
      `${API_URL}/admin/integrations/relbase/dtes/${encodeURIComponent(
        taxDocumentId
      )}/pdf`,
      {
        method: "GET",
        cache: "no-store",
        headers:
          token
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

  const contentDisposition =
    String(
      response.headers.get(
        "content-disposition"
      ) || ""
    ).toLowerCase();

  if (!response.ok) {
    const errorBuffer =
      await response
        .arrayBuffer()
        .catch(
          () => null
        );

    const data =
      errorBuffer
        ? decodeJsonBuffer(
            errorBuffer
          )
        : null;

    const error =
      new Error(
        data?.message ||
          "No fue posible obtener el PDF del documento tributario"
      );

    error.status =
      response.status;

    error.code =
      data?.code ||
      null;

    throw error;
  }

  const buffer =
    await response.arrayBuffer();

  if (
    buffer.byteLength <= 0
  ) {
    throw new Error(
      "El documento recibido se encuentra vacío."
    );
  }

  const headerSaysPdf =
    contentType.includes(
      "application/pdf"
    ) ||
    (
      contentType.includes(
        "application/octet-stream"
      ) &&
      contentDisposition.includes(
        ".pdf"
      )
    );

  if (
    headerSaysPdf ||
    startsWithPdfMagic(
      buffer
    )
  ) {
    return {
      kind: "blob",
      blob: new Blob(
        [buffer],
        {
          type: "application/pdf",
        }
      ),
    };
  }

  const data =
    decodeJsonBuffer(
      buffer
    );

  if (!data) {
    throw new Error(
      "El backend respondió correctamente, pero el contenido recibido no corresponde a un PDF válido."
    );
  }

  const resolvedUrl =
    extractDocumentUrl(
      data
    );

  if (
    resolvedUrl &&
    !isRelbaseViewerUrl(
      resolvedUrl
    )
  ) {
    return {
      kind: "url",
      url: resolvedUrl,
      response: data,
    };
  }

  if (
    resolvedUrl &&
    isRelbaseViewerUrl(
      resolvedUrl
    )
  ) {
    throw new Error(
      "Relbase todavía no entregó el archivo PDF directo del documento. Intenta nuevamente en unos segundos."
    );
  }

  throw new Error(
    data?.message ||
      "El PDF todavía no está disponible. Intenta nuevamente en unos segundos."
  );
}

export async function queueTaxDocumentEmission(
  orderId
) {
  return apiRequest(
    `/admin/orders/${encodeURIComponent(
      orderId
    )}/tax-document/queue`,
    {
      method: "POST",
    }
  );
}

export async function sendTaxDocumentEmail({
  taxDocumentId,
  recipientEmail,
  documentFormat = "letter",
}) {
  return apiRequest(
    `/admin/tax-documents/${encodeURIComponent(
      taxDocumentId
    )}/email`,
    {
      method: "POST",
      body: {
        recipient_email:
          recipientEmail,
        document_format:
          documentFormat,
      },
    }
  );
}
