import {
  apiRequest,
} from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

/* =========================================
   HEALTH OPTIMIZADOR
========================================= */
export async function getBathroomOptimizerHealth() {
  return apiRequest(
    "/bathroom-projects/optimizer/health"
  );
}

/* =========================================
   OPTIMIZAR PROYECTO DE BAÑOS
========================================= */
export async function optimizeBathroomProject(
  payload
) {
  return apiRequest(
    "/bathroom-projects/optimize",
    {
      method: "POST",
      body: payload,
    }
  );
}

/* =========================================
   CREAR COTIZACIÓN PROJECT REAL
========================================= */
export async function createBathroomQuotation(
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
   PDF DE COTIZACIÓN
========================================= */
export async function getBathroomQuotationPdfBlob(
  quotationId
) {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no está configurado"
    );
  }

  const response =
    await fetch(
      `${API_URL}/admin/pos/quotations/${encodeURIComponent(
        quotationId
      )}/pdf`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

  if (!response.ok) {
    const data =
      await response
        .json()
        .catch(() => null);

    const error =
      new Error(
        data?.message ||
        "No fue posible generar el PDF de la cotización"
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
   HELPERS DE RESULTADO
========================================= */
export function getBathroomOptimizationSummary(
  response
) {
  const data =
    response?.data || null;

  if (!data) {
    return null;
  }

  return {
    optimizerVersion:
      data.optimizerVersion || null,

    sheetsRequired:
      Number(
        data.totals
          ?.sheetsRequired || 0
      ),

    pieces:
      Number(
        data.totals
          ?.pieces || 0
      ),

    materialGroups:
      Number(
        data.totals
          ?.materialGroups || 0
      ),

    materials:
      Array.isArray(
        data.materials
      )
        ? data.materials.map(
            (group) => {
              const material =
                group.material || {};

              const metrics =
                group.optimization
                  ?.metrics || {};

              return {
                code:
                  material.code ||
                  "",

                label:
                  material.label ||
                  material.code ||
                  "Material",

                thickness:
                  Number(
                    material.thickness ||
                      0
                  ),

                sheetsRequired:
                  Number(
                    metrics
                      .sheetsRequired ||
                      0
                  ),

                utilization:
                  Number(
                    metrics
                      .utilization ||
                      0
                  ),

                usableUtilization:
                  Number(
                    metrics
                      .usableUtilization ||
                      0
                  ),

                wastePercentage:
                  Number(
                    metrics
                      .wastePercentage ||
                      0
                  ),

                kerf:
                  Number(
                    metrics.kerf ||
                      0
                  ),

                margins:
                  metrics.margins ||
                  null,

                patterns:
                  group.optimization
                    ?.patterns ||
                  [],

                sheets:
                  group.optimization
                    ?.sheets ||
                  [],
              };
            }
          )
        : [],
  };
}
