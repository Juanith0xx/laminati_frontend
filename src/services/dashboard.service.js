import { apiRequest } from "@/services/api";

/**
 * Estadísticas comerciales de sólo lectura.
 * Reutiliza apiRequest para la autenticación JWT existente.
 */
export async function getSalesDashboard({
  preset = "30d",
  from = "",
  to = "",
  channel = "ALL",
  collection = "ALL",
  segment = "ALL",
  granularity = "auto",
  top = 10,
  signal,
} = {}) {
  const params = new URLSearchParams();

  if (preset === "custom") {
    if (!from || !to) {
      throw new Error("Selecciona ambas fechas del rango personalizado.");
    }
    params.set("from", from);
    params.set("to", to);
  } else {
    params.set("preset", preset);
  }

  params.set("channel", channel);
  params.set("collection", collection);
  params.set("segment", segment);
  params.set("granularity", granularity);
  params.set("top", String(top));

  return apiRequest(`/admin/dashboard/sales?${params.toString()}`, {
    signal,
  });
}

/** Opciones de catálogo configuradas en PostgreSQL (ADMIN). */
export async function getDashboardFilterOptions({ signal } = {}) {
  return apiRequest("/admin/dashboard/filter-options", { signal });
}
