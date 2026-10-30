import { redirect } from "next/navigation";

/**
 * Ruta legacy del detalle de una cotización de Showroom.
 *
 * Cualquier enlace antiguo que todavía apunte a
 * /admin/showroom/cotizaciones/:quotationId se redirige a la vista
 * canónica /admin/cotizaciones/:quotationId, que contiene el layout
 * actual de Resumen + Acciones de la cotización.
 */
export default async function LegacyShowroomQuotationDetailPage({ params }) {
  const resolvedParams = await params;
  const quotationId = String(
    resolvedParams?.quotationId || ""
  ).trim();

  if (!quotationId) {
    redirect("/admin/cotizaciones");
  }

  redirect(
    `/admin/cotizaciones/${encodeURIComponent(quotationId)}`
  );
}