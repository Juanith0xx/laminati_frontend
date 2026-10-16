"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "@/services/api";
import {
  getSalesDashboard,
  getDashboardFilterOptions,
} from "@/services/dashboard.service";

const ONLINE_COLOR = "#e45e59";
const SHOWROOM_COLOR = "#6953af";
const PRESETS = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];
const CHANNELS = [
  { value: "ALL", label: "Todos" },
  { value: "WEB", label: "Online" },
  { value: "STORE", label: "Showroom" },
];
const GRANULARITIES = [
  { value: "auto", label: "Automática" },
  { value: "day", label: "Diaria" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensual" },
];
const fmtMoney = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const fmtCount = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 2,
});
const fmtCompact = new Intl.NumberFormat("es-CL", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const money = (value) => fmtMoney.format(Number(value) || 0);
const number = (value) => fmtCount.format(Number(value) || 0);
const monthNames = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sept", "oct", "nov", "dic",
];

function bucketLabel(value, granularity, long = false) {
  const [year, month, day] = String(value || "").split("-");
  if (!year || !month || !day) return value || "";
  if (granularity === "month") {
    return `${monthNames[Number(month) - 1]} ${year}`;
  }
  if (granularity === "week") {
    return long ? `Semana del ${day}/${month}/${year}` : `${day}/${month}`;
  }
  return long ? `${day}/${month}/${year}` : `${day}/${month}`;
}

function MetricCard({ title, value, meta, tone = "neutral" }) {
  const accent = {
    neutral: "bg-neutral-900",
    online: "bg-[#e45e59]",
    showroom: "bg-[#6953af]",
  }[tone];
  return (
    <div className="rounded-[22px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        {title}
      </div>
      <p className="mt-4 break-words text-[27px] font-semibold tracking-tight text-neutral-950 sm:text-[30px]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{meta}</p>
    </div>
  );
}

function CardHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-5 py-5 sm:px-7">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-black sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}

const inputStyle =
  "h-11 min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/5";

export default function AdminSalesDashboardPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [channel, setChannel] = useState("ALL");
  const [collection, setCollection] = useState("ALL");
  const [segment, setSegment] = useState("ALL");
  const [catalogOptions, setCatalogOptions] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [granularity, setGranularity] = useState("auto");
  const [top, setTop] = useState(10);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [applied, setApplied] = useState({
    preset: "30d", channel: "ALL", collection: "ALL", segment: "ALL", granularity: "auto", top: 10,
  });
  const [revision, setRevision] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const validate = async () => {
      try {
        const response = await apiRequest("/auth/me");
        const role = String(
          response?.user?.role || ""
        )
          .trim()
          .toUpperCase();

        if (
          !response?.success ||
          !["ADMIN", "VENDEDOR"].includes(role)
        ) {
          throw new Error(
            "Acceso al backoffice requerido"
          );
        }
        if (active) setAuthLoading(false);
      } catch {
        if (active) router.replace("/login");
      }
    };
    validate();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    const controller = new AbortController();
    const loadOptions = async () => {
      try {
        const result = await getDashboardFilterOptions({ signal: controller.signal });
        if (!result?.success || !Array.isArray(result?.collections) || !Array.isArray(result?.segments)) {
          throw new Error(result?.message || "Opciones de filtros no disponibles");
        }
        if (active) { setCatalogOptions(result); setCatalogError(""); }
      } catch (requestError) {
        if (active && !controller.signal.aborted) {
          setCatalogError(requestError?.message || "No se pudieron cargar los filtros de catálogo.");
        }
      }
    };
    loadOptions();
    return () => { active = false; controller.abort(); };
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      setDashboard(null);
      try {
        const response = await getSalesDashboard({
          ...applied,
          signal: controller.signal,
        });
        if (!response?.success || !response?.summary || !Array.isArray(response?.timeline) || !Array.isArray(response?.top_products)) {
          throw new Error(response?.message || "La respuesta del Dashboard no tiene el formato esperado.");
        }
        if (active) setDashboard(response);
      } catch (requestError) {
        if (active && !controller.signal.aborted) {
          setError(requestError?.message || "No fue posible cargar las estadísticas.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, applied, revision]);

  const onPeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    setError("");
    if (nextPeriod === "custom") {
      setDraftFrom((prev) => prev || dashboard?.filters?.from || "");
      setDraftTo((prev) => prev || dashboard?.filters?.to || "");
      return;
    }
    setApplied({ preset: nextPeriod, channel, collection, segment, granularity, top });
  };

  const onChannelChange = (nextChannel) => {
    setChannel(nextChannel);
    // Un rango personalizado sólo se aplica al pulsar «Aplicar rango».
    // Cambiar otros filtros no debe aplicar fechas aún en edición.
    if (period === "custom" && applied.preset !== "custom") return;
    setApplied({
      preset: period,
      from: period === "custom" ? applied.from : undefined,
      to: period === "custom" ? applied.to : undefined,
      channel: nextChannel, collection, segment, granularity, top,
    });
  };

  const onGranularityChange = (value) => {
    setGranularity(value);
    // Un rango personalizado sólo se aplica al pulsar «Aplicar rango».
    // Cambiar otros filtros no debe aplicar fechas aún en edición.
    if (period === "custom" && applied.preset !== "custom") return;
    setApplied({
      preset: period,
      from: period === "custom" ? applied.from : undefined,
      to: period === "custom" ? applied.to : undefined,
      channel, collection, segment, granularity: value, top,
    });
  };

  const onTopChange = (value) => {
    const nextTop = Number(value);
    setTop(nextTop);
    // Un rango personalizado sólo se aplica al pulsar «Aplicar rango».
    // Cambiar otros filtros no debe aplicar fechas aún en edición.
    if (period === "custom" && applied.preset !== "custom") return;
    setApplied({
      preset: period,
      from: period === "custom" ? applied.from : undefined,
      to: period === "custom" ? applied.to : undefined,
      channel, collection, segment, granularity, top: nextTop,
    });
  };

  const applyCustomRange = (event) => {
    event.preventDefault();
    if (!draftFrom || !draftTo) {
      setError("Selecciona la fecha inicial y final.");
      return;
    }
    if (draftFrom > draftTo) {
      setError("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    setError("");
    setApplied({
      preset: "custom", from: draftFrom, to: draftTo,
      channel, collection, segment, granularity, top,
    });
  };

  const onProductFilterChange = (field, value) => {
    const nextCollection = field === "collection" ? value : collection;
    const nextSegment = field === "segment" ? value : segment;
    setCollection(nextCollection);
    setSegment(nextSegment);
    if (period === "custom" && applied.preset !== "custom") return;
    setApplied({
      preset: period,
      from: period === "custom" ? applied.from : undefined,
      to: period === "custom" ? applied.to : undefined,
      channel, collection: nextCollection, segment: nextSegment, granularity, top,
    });
  };

  const filters = dashboard?.filters;
  const summary = dashboard?.summary;
  const timeline = dashboard?.timeline || [];
  const products = dashboard?.top_products || [];
  const hasSales = Number(summary?.orders || 0) > 0;
  const chartData = useMemo(() => timeline.map((row) => ({
    ...row,
    label: bucketLabel(row.date, filters?.granularity),
  })), [timeline, filters?.granularity]);
  const rangeDescription = filters
    ? `${bucketLabel(filters.from, "day", true)} — ${bucketLabel(filters.to, "day", true)}`
    : "Cargando período…";
  const selectedChannel = CHANNELS.find((item) => item.value === filters?.channel)?.label || "Todos";
  const selectedCollection = filters?.collection === "NONE"
    ? "Sin colección"
    : catalogOptions?.collections?.find((item) => item.id === filters?.collection)?.name || "Todas";
  const selectedSegment = filters?.segment === "UNCLASSIFIED"
    ? "Sin clasificar"
    : catalogOptions?.segments?.find((item) => item.slug === filters?.segment)?.name || "Todos";
  const hasProductFilter = filters?.collection !== "ALL" || filters?.segment !== "ALL";

  if (authLoading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-4 text-sm text-neutral-500">
        Validando acceso administrativo…
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[#171717] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-[#e45e59] via-[#b65d9e] to-[#6953af]" />
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8 sm:py-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-neutral-400">
                Laminati · Backoffice
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Dashboard comercial
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Rendimiento de ventas Online y Showroom en un solo lugar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRevision((value) => value + 1)}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 text-sm font-semibold transition hover:border-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Actualizando…" : "Actualizar datos"}
            </button>
          </div>
        </header>

        <section aria-label="Filtros comerciales" className="rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-black">Filtros comerciales</h2>
            <span className="text-xs text-neutral-400">Zona horaria: Chile</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-600">Período</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    aria-pressed={period === item.value}
                    onClick={() => onPeriodChange(item.value)}
                    className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                      period === item.value
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-500"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {period === "custom" && (
                <form onSubmit={applyCustomRange} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="block text-xs font-medium text-neutral-600">
                    Desde
                    <input className={`${inputStyle} mt-1.5`} type="date" required value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
                  </label>
                  <label className="block text-xs font-medium text-neutral-600">
                    Hasta
                    <input className={`${inputStyle} mt-1.5`} type="date" required min={draftFrom || undefined} value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
                  </label>
                  <button type="submit" className="h-11 rounded-xl bg-neutral-950 px-5 text-xs font-semibold text-white hover:bg-neutral-800">
                    Aplicar rango
                  </button>
                </form>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-600">Canal de venta</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    aria-pressed={channel === item.value}
                    onClick={() => onChannelChange(item.value)}
                    className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                      channel === item.value
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-500"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block text-xs font-medium text-neutral-600">
              Colección de productos
              <select
                value={collection}
                onChange={(event) => onProductFilterChange("collection", event.target.value)}
                disabled={!catalogOptions}
                className={`${inputStyle} mt-1.5 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="ALL">Todas las colecciones</option>
                <option value="NONE">Sin colección</option>
                {(catalogOptions?.collections || []).map((item) => (
                  <option value={item.id} key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-neutral-600">
              Clasificación comercial
              <select
                value={segment}
                onChange={(event) => onProductFilterChange("segment", event.target.value)}
                disabled={!catalogOptions}
                className={`${inputStyle} mt-1.5 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="ALL">Todas las clasificaciones</option>
                <option value="UNCLASSIFIED">Sin clasificar</option>
                {(catalogOptions?.segments || []).map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={collection === "ALL" && segment === "ALL"}
                onClick={() => {
                  const next = { collection: "ALL", segment: "ALL" };
                  setCollection(next.collection);
                  setSegment(next.segment);
                  if (period === "custom" && applied.preset !== "custom") return;
                  setApplied({
                    ...applied, channel, collection: next.collection, segment: next.segment,
                    granularity, top,
                  });
                }}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Limpiar filtros de productos
              </button>
            </div>
          </div>
          {catalogError && (
            <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              {catalogError}. Verifica que instalaste la migración SQL y el backend actualizado.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-neutral-500">
            Comodín y Commodity caros se habilitan al asignar productos en PostgreSQL;
            no se deducen automáticamente por precio.
          </p>
          <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr]">
            <label className="block text-xs font-medium text-neutral-600">
              Agrupación temporal
              <select value={granularity} onChange={(e) => onGranularityChange(e.target.value)} className={`${inputStyle} mt-1.5`}>
                {GRANULARITIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-neutral-600">
              Productos destacados
              <select value={top} onChange={(e) => onTopChange(e.target.value)} className={`${inputStyle} mt-1.5`}>
                {[5, 10, 20].map((value) => <option value={value} key={value}>Top {value}</option>)}
              </select>
            </label>
            <div className="flex items-end text-xs leading-5 text-neutral-400">
              Los filtros se aplican a todos los gráficos. En rango personalizado, presiona «Aplicar rango».
            </div>
          </div>
        </section>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => setRevision((value) => value + 1)} className="rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100">
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div role="status" className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 text-sm text-neutral-500">
            Consultando ventas confirmadas en PostgreSQL…
          </div>
        )}

        {dashboard && !loading && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs font-medium text-neutral-500">
                Período: {rangeDescription} · Canal: {selectedChannel} · Colección: {selectedCollection} · Clasificación: {selectedSegment}
              </p>
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-500">
                Importes brutos · IVA incluido
              </span>
            </div>

            {hasProductFilter && (
              <div role="note" className="rounded-xl border border-violet-100 bg-violet-50 px-5 py-3 text-xs leading-5 text-violet-900">
                Vista por productos: los importes se asignan proporcionalmente a las líneas que coinciden.
                «Operaciones» cuenta los pedidos con al menos un artículo coincidente; un pedido mixto puede aparecer en varios filtros.
                Clasificación y colección corresponden al catálogo actual.
              </div>
            )}

            <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard title="Ventas totales" value={money(summary.gross_sales)} meta={hasProductFilter ? "Importe bruto asignado a productos filtrados" : "Facturación bruta pagada"} />
              <MetricCard title="Online" value={money(summary.channels?.WEB?.gross_sales)} meta={`${number(summary.channels?.WEB?.orders)} pedidos pagados`} tone="online" />
              <MetricCard title="Showroom" value={money(summary.channels?.STORE?.gross_sales)} meta={`${number(summary.channels?.STORE?.orders)} ventas pagadas`} tone="showroom" />
              <MetricCard title="Operaciones" value={number(summary.orders)} meta={hasProductFilter ? "Pedidos con productos del filtro" : "Pedidos pagados en el período"} />
              <MetricCard title="Ticket promedio" value={money(summary.average_order_value)} meta={hasProductFilter ? "Importe filtrado por pedido incluido" : "Venta bruta por operación"} />
            </section>

            <section aria-label="Evolución de ventas" className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-sm">
              <CardHeader
                eyebrow="01 · Ventas por canal"
                title="Evolución de ventas"
                description="Comparación de facturación bruta confirmada, agrupada según el período seleccionado."
                action={<span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500">{filters.granularity === "day" ? "Diaria" : filters.granularity === "week" ? "Semanal" : "Mensual"}</span>}
              />
              <div className="p-4 sm:p-7">
                {!hasSales ? (
                  <EmptyChart text="No se registran ventas pagadas para este canal y período." />
                ) : (
                  <div className="h-[330px] w-full sm:h-[390px]" aria-label="Gráfico de líneas de ventas Online y Showroom">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 5 }}>
                        <CartesianGrid stroke="#eeeae6" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(value) => bucketLabel(value, filters.granularity)} tick={{ fontSize: 11, fill: "#858585" }} tickLine={false} axisLine={false} minTickGap={26} />
                        <YAxis tickFormatter={(value) => fmtCompact.format(Number(value) || 0)} tick={{ fontSize: 11, fill: "#858585" }} tickLine={false} axisLine={false} width={52} domain={[0, "auto"]} />
                        <Tooltip
                          labelFormatter={(value) => bucketLabel(value, filters.granularity, true)}
                          formatter={(value, name) => [money(value), name]}
                          contentStyle={{ borderRadius: 14, border: "1px solid #e5e5e5", fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />
                        {filters.channel !== "STORE" && <Line type="monotone" dataKey="online" name="Online" stroke={ONLINE_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />}
                        {filters.channel !== "WEB" && <Line type="monotone" dataKey="showroom" name="Showroom" stroke={SHOWROOM_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            <section aria-label="Productos más vendidos" className="overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white shadow-sm">
              <CardHeader
                eyebrow="02 · Rendimiento del catálogo"
                title="Productos más vendidos"
                description="Ranking por unidades vendidas. Cada barra representa un SKU en el período y canal seleccionados."
                action={<span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500">Top {filters.top}</span>}
              />
              <div className="p-4 sm:p-7">
                {products.length === 0 ? (
                  <EmptyChart text="Aún no existen productos vendidos para este filtro." />
                ) : (
                  <div className="w-full" style={{ height: Math.max(240, products.length * 58) }} aria-label="Gráfico de barras de unidades vendidas por SKU">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={products} layout="vertical" margin={{ top: 8, right: 35, bottom: 8, left: 2 }} barCategoryGap="25%">
                        <CartesianGrid stroke="#eeeae6" strokeDasharray="3 5" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#858585" }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="sku" type="category" width={98} tick={{ fontSize: 12, fontWeight: 600, fill: "#404040" }} tickLine={false} axisLine={false} />
                        <Tooltip
                          labelFormatter={(sku) => products.find((product) => product.sku === sku)?.product_name || sku}
                          formatter={(value) => [number(value), "Unidades"]}
                          contentStyle={{ borderRadius: 14, border: "1px solid #e5e5e5", fontSize: 12 }}
                        />
                        <Bar dataKey="units_sold" name="Unidades" fill="#171717" radius={[0, 7, 7, 0]} maxBarSize={26} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {products.length > 0 && (
                <div className="overflow-x-auto border-t border-neutral-100">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-[#faf9f7] text-[10px] uppercase tracking-wider text-neutral-500">
                      <tr>
                        <th scope="col" className="px-5 py-4 font-semibold sm:px-7"># / Producto</th>
                        <th scope="col" className="px-4 py-4 font-semibold">SKU</th>
                        <th scope="col" className="px-4 py-4 text-right font-semibold">Unidades</th>
                        <th scope="col" className="px-4 py-4 text-right font-semibold">Pedidos</th>
                        <th scope="col" className="px-5 py-4 text-right font-semibold sm:px-7">Venta bruta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {products.map((product, index) => (
                        <tr key={`${product.sku}-${index}`} className="hover:bg-neutral-50">
                          <td className="px-5 py-4 sm:px-7">
                            <span className="mr-3 text-xs font-semibold text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
                            <span className="font-medium text-neutral-900">{product.product_name || "Producto sin nombre"}</span>
                          </td>
                          <td className="px-4 py-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{product.sku}</span></td>
                          <td className="px-4 py-4 text-right font-semibold">{number(product.units_sold)}</td>
                          <td className="px-4 py-4 text-right">{number(product.orders)}</td>
                          <td className="px-5 py-4 text-right font-semibold sm:px-7">{money(product.gross_sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="rounded-[22px] border border-neutral-200 bg-white p-5 text-xs leading-6 text-neutral-500 sm:p-6">
              <p className="font-semibold text-neutral-800">Sobre estas cifras</p>
              <p>Se consideran órdenes pagadas WEB y STORE por fecha de confirmación en America/Santiago. Los importes son brutos con IVA; no representan utilidad ni ingresos contables netos. Las cotizaciones no se suman. Los reembolsos parciales requieren conciliación independiente. Al filtrar productos, el importe de cada pedido se prorratea según sus líneas. Las clasificaciones se obtienen del catálogo actual, no de una foto histórica al momento de la venta.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/admin/showroom" className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-black hover:bg-neutral-50">Ir a Showroom →</Link>
                <Link href="/admin/pagos" className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-black hover:bg-neutral-50">Revisar pagos →</Link>
              </div>
            </aside>
          </>
        )}
      </div>
    </main>
  );
}
