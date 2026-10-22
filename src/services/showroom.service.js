import { apiRequest } from "@/services/api";

/* =========================================
   UTILIDADES BÚSQUEDA CLIENTES RELBASE
========================================= */

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeRutValue(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
}

function isValidChileanRut(value) {
  const normalized = normalizeRutValue(value);

  if (normalized.length < 2) {
    return false;
  }

  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);

  if (!/^\d+$/.test(body)) {
    return false;
  }

  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;

    multiplier =
      multiplier === 7
        ? 2
        : multiplier + 1;
  }

  const result = 11 - (sum % 11);

  const expectedDv =
    result === 11
      ? "0"
      : result === 10
        ? "K"
        : String(result);

  return dv === expectedDv;
}

function customerMatchesQuery(customer, query) {
  const normalizedQuery =
    normalizeSearchValue(query);

  const normalizedRutQuery =
    normalizeRutValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const textValues = [
    customer?.name,
    customer?.name_fantasy,
    customer?.legal_name,
    customer?.business_name,
    customer?.business_activity,
    customer?.email,
    customer?.email_commercial,
    customer?.phone,
    customer?.mobile,
    customer?.rut,
  ]
    .filter(Boolean)
    .map((value) =>
      normalizeSearchValue(value)
    );

  const rutValue =
    normalizeRutValue(
      customer?.rut
    );

  const matchesText =
    textValues.some((value) =>
      value.includes(normalizedQuery)
    );

  const matchesRut =
    Boolean(normalizedRutQuery) &&
    Boolean(rutValue) &&
    rutValue.includes(
      normalizedRutQuery
    );

  return (
    matchesText ||
    matchesRut
  );
}

/* =========================================
   PRODUCTOS POS
========================================= */

export async function getPosProducts({
  q = "",
  limit = 50,
  signal,
} = {}) {
  const params = new URLSearchParams();

  const normalizedQuery =
    String(q || "").trim();

  if (normalizedQuery) {
    params.set(
      "q",
      normalizedQuery
    );
  }

  params.set(
    "limit",
    String(limit)
  );

  return apiRequest(
    `/admin/pos/products?${params.toString()}`,
    {
      signal,
    }
  );
}

/* =========================================
   PRODUCTOS PARA COTIZACIÓN PROJECT
   - No depende de stock POS.
   - Permite productos a pedido como MEG.
========================================= */

export async function getProjectQuotationProducts({
  q = "",
  limit = 20,
  signal,
} = {}) {
  const params = new URLSearchParams();

  const normalizedQuery =
    String(q || "").trim();

  if (normalizedQuery) {
    params.set(
      "q",
      normalizedQuery
    );
  }

  params.set(
    "limit",
    String(limit)
  );

  return apiRequest(
    `/admin/pos/project-products?${params.toString()}`,
    {
      signal,
    }
  );
}

/* =========================================
   CLIENTES LAMINATIWORD

   La condición comercial pertenece a
   LaminatiWord, no a Relbase.
========================================= */

export async function searchLaminatiCustomers({
  q = "",
  limit = 12,
  signal,
} = {}) {
  const normalizedQuery =
    String(q || "").trim();

  const safeLimit = Math.min(
    Math.max(Number(limit) || 12, 1),
    50
  );

  if (normalizedQuery.length < 2) {
    return {
      success: true,
      customers: [],
    };
  }

  const params = new URLSearchParams();
  params.set("search", normalizedQuery);
  params.set("status", "ACTIVE");
  params.set("page", "1");
  params.set("limit", String(safeLimit));

  const response = await apiRequest(
    `/admin/users?${params.toString()}`,
    { signal }
  );

  const rows = Array.isArray(response?.data)
    ? response.data
    : [];

  return {
    ...response,
    customers: rows.filter((item) =>
      ["CLIENTE", "USUARIO_EMPRESA"].includes(
        String(item?.role || "").trim().toUpperCase()
      )
    ),
  };
}

export async function getLaminatiCustomerPriceList(
  userId,
  { signal } = {}
) {
  return apiRequest(
    `/admin/users/${encodeURIComponent(userId)}/price-list`,
    { signal }
  );
}

export async function getPriceListDetail(
  priceListId,
  { signal } = {}
) {
  return apiRequest(
    `/admin/price-lists/${encodeURIComponent(priceListId)}`,
    { signal }
  );
}

/* =========================================
   CLIENTE RELBASE POR RUT EXACTO
========================================= */

export async function findRelbaseCustomerByRut(
  rut
) {
  const normalizedRut =
    String(rut || "").trim();

  return apiRequest(
    `/admin/integrations/relbase/customers/search?rut=${encodeURIComponent(
      normalizedRut
    )}`
  );
}

/* =========================================
   BUSCADOR CLIENTES RELBASE

   Mantiene búsqueda por:
   - RUT parcial
   - RUT completo
   - Nombre / razón social
   - Nombre fantasía
   - Email
   - Teléfono

   IMPORTANTE:
   Utiliza el endpoint optimizado:
   /customers/lookup?q=&limit=

   El backend delega la búsqueda a Relbase
   mediante query, evitando recorrer páginas
   completas de clientes en el navegador.
========================================= */

export async function searchRelbaseCustomers({
  q = "",
  limit = 10,
  signal,
} = {}) {
  const normalizedQuery =
    String(q || "").trim();

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 10,
        1
      ),
      20
    );

  if (normalizedQuery.length < 2) {
    return {
      success: true,
      source: "RELBASE",
      query: normalizedQuery,
      count: 0,
      customers: [],
      meta: null,
      rate_limit: null,
    };
  }

  const params =
    new URLSearchParams();

  params.set(
    "q",
    normalizedQuery
  );

  params.set(
    "limit",
    String(safeLimit)
  );

  return apiRequest(
    `/admin/integrations/relbase/customers/lookup?${params.toString()}`,
    {
      signal,
    }
  );
}

export async function ensurePosInvoiceCustomer(
  payload
) {
  return apiRequest(
    "/admin/pos/customers/ensure",
    {
      method: "POST",
      body: payload,
    }
  );
}

/* =========================================
   CREAR VENTA POS
========================================= */

export async function createPosSale(
  payload
) {
  return apiRequest(
    "/admin/pos/sales",
    {
      method: "POST",
      body: payload,
    }
  );
}

/* =========================================
   CREAR COTIZACIÓN
========================================= */

export async function createQuotation(
  payload
) {
  return apiRequest(
    "/admin/pos/quotations",
    {
      method: "POST",
      body: payload,
    }
  );
}


/* =========================================
   CREAR COTIZACIÓN DE PROYECTO
========================================= */

export async function createProjectQuotation(
  payload
) {
  return apiRequest(
    "/admin/pos/quotations/project",
    {
      method: "POST",
      body: payload,
    }
  );
}

/* =========================================
   LISTAR COTIZACIONES
========================================= */

export async function listQuotations({
  search = "",
  status = "",
  type = "",
  page = 1,
  limit = 20,
} = {}) {
  const params =
    new URLSearchParams();

  if (
    String(
      search || ""
    ).trim()
  ) {
    params.set(
      "search",
      String(search).trim()
    );
  }

  if (
    String(
      status || ""
    ).trim()
  ) {
    params.set(
      "status",
      String(status).trim()
    );
  }

  if (
    String(
      type || ""
    ).trim()
  ) {
    params.set(
      "type",
      String(type)
        .trim()
        .toUpperCase()
    );
  }

  params.set(
    "page",
    String(page)
  );

  params.set(
    "limit",
    String(limit)
  );

  return apiRequest(
    `/admin/pos/quotations?${params.toString()}`
  );
}

/* =========================================
   OBTENER COTIZACIÓN
========================================= */

export async function getQuotation(
  quotationId
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}`
  );
}

/* =========================================
   ACTUALIZAR COTIZACIÓN
========================================= */

export async function updateQuotation(
  quotationId,
  payload
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}


/* =========================================
   ACTUALIZAR COTIZACIÓN DE PROYECTO
========================================= */

export async function updateProjectQuotation(
  quotationId,
  payload
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}/project`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}

/* =========================================
   ELIMINAR COTIZACIÓN
========================================= */

export async function deleteQuotation(
  quotationId
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================
   ENVIAR COTIZACIÓN POR EMAIL
========================================= */

export async function sendQuotationEmail(
  quotationId
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}/email`,
    {
      method: "POST",
    }
  );
}

/* =========================================
   CANCELAR COTIZACIÓN
========================================= */

export async function cancelQuotation(
  quotationId
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}/cancel`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================
   CONVERTIR COTIZACIÓN EN VENTA
========================================= */

export async function convertQuotation(
  quotationId,
  payload
) {
  return apiRequest(
    `/admin/pos/quotations/${encodeURIComponent(
      quotationId
    )}/convert`,
    {
      method: "POST",
      body: payload,
    }
  );
}

/* =========================================
   PDF COTIZACIÓN
========================================= */

export async function getQuotationPdfBlob(
  quotationId
) {
  const API_URL =
    process.env
      .NEXT_PUBLIC_API_URL;


  const response =
    await fetch(
      `${API_URL}/admin/pos/quotations/${encodeURIComponent(
        quotationId
      )}/pdf`,
      {
        method: "GET",

        cache:
          "no-store",

        credentials: "include",
      }
    );

  if (
    !response.ok
  ) {
    const data =
      await response
        .json()
        .catch(
          () => null
        );

    const error =
      new Error(
        data?.message ||
          "No fue posible obtener el PDF de la cotización"
      );

    error.status =
      response.status;

    error.code =
      data?.code;

    throw error;
  }

  return response.blob();
}

/* =========================================
   PREPARAR DOCUMENTO TRIBUTARIO
========================================= */

export async function prepareOrderTaxDocument(
  orderId
) {
  return apiRequest(
    `/admin/orders/${encodeURIComponent(
      orderId
    )}/tax-document/prepare`,
    {
      method: "POST",
    }
  );
}

/* =========================================
   PREFLIGHT EMISIÓN DTE RELBASE
========================================= */

export async function getRelbaseDteEmissionPreflight(
  taxDocumentId,
  {
    maxPages = 100,
  } = {}
) {
  const safeMaxPages =
    Math.min(
      Math.max(
        Number(
          maxPages
        ) || 100,
        1
      ),
      500
    );

  return apiRequest(
    `/admin/integrations/relbase/dtes/${encodeURIComponent(
      taxDocumentId
    )}/emission-preflight?max_pages=${safeMaxPages}`
  );
}