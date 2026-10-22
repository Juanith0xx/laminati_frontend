"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/services/api";

const usdFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 0,
});

const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "short",
});

const formatUsd = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? usdFormatter.format(number) : "US$ 0,00";
};

const formatQuantity = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? quantityFormatter.format(number) : "0";
};

const formatInteger = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? integerFormatter.format(number) : "0";
};

const formatMonth = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const label = monthFormatter.format(date).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function CardIcon({ type }) {
  if (type === "sales") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
        <path d="M5 20V10h3v10H5Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z" />
      </svg>
    );
  }

  if (type === "quotes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
        <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4M8 12h8M8 16h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" />
      <path d="m4.8 7.7 7.2 4.2 7.2-4.2M12 12v8.4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M20 6v5h-5" />
      <path d="M19 11a7 7 0 1 0 1 5" />
    </svg>
  );
}

function MetricCard({ label, primary, valueUsd, href, icon, detail, loading }) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
            <CardIcon type={icon} />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-700">{label}</p>

            {loading ? (
              <>
                <div className="mt-3 h-7 w-28 animate-pulse rounded-lg bg-neutral-100" />
                <div className="mt-2 h-4 w-36 animate-pulse rounded-lg bg-neutral-100" />
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">{primary}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-700">{valueUsd}</p>
                <p className="mt-1 text-xs text-neutral-400">{detail}</p>
              </>
            )}
          </div>
        </div>

        <span className="mt-2 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-black">→</span>
      </div>
    </Link>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm ${className}`}>
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">{title}</h2>
        <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-neutral-50 px-6 text-center">
      <p className="max-w-xs text-sm leading-6 text-neutral-400">{message}</p>
    </div>
  );
}

function StockCollectionChart({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const maxUnits = Math.max(...rows.map((row) => Number(row.total_units) || 0), 0);
  const palette = [
    "bg-neutral-950",
    "bg-neutral-700",
    "bg-neutral-500",
    "bg-stone-400",
    "bg-neutral-300",
    "bg-stone-200",
  ];

  if (!rows.length || maxUnits <= 0) {
    return <EmptyChart message="Aún no hay stock ABET disponible para construir el gráfico por colección." />;
  }

  return (
    <div className="flex h-[260px] items-end gap-3 border-b border-neutral-200 px-2 pb-0 sm:gap-4">
      {rows.map((row, index) => {
        const units = Number(row.total_units) || 0;
        const height = Math.max(8, Math.round((units / maxUnits) * 185));

        return (
          <div key={`${row.collection_slug || row.collection}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-2 text-xs font-semibold text-neutral-700">{formatQuantity(units)}</span>
            <div
              className={`w-full max-w-[56px] rounded-t-lg ${palette[index % palette.length]} transition-all duration-500`}
              style={{ height: `${height}px` }}
              title={`${row.collection}: ${formatQuantity(units)} láminas`}
            />
            <span className="mt-3 w-full truncate text-center text-[11px] font-medium text-neutral-500" title={row.collection}>
              {row.collection}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SalesLineChart({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const values = rows.map((row) => Number(row.total_value_usd) || 0);
  const maxValue = Math.max(...values, 0);

  const width = 640;
  const height = 250;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 42;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const scaleMax = maxValue > 0 ? maxValue * 1.15 : 1;

  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? padLeft + chartWidth / 2 : padLeft + (index / (rows.length - 1)) * chartWidth;
    const value = Number(row.total_value_usd) || 0;
    const y = padTop + chartHeight - (value / scaleMax) * chartHeight;
    return { x, y, value, month: row.month };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  if (!rows.length) {
    return <EmptyChart message="Aún no hay ventas suficientes para construir la evolución mensual." />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] min-w-[520px] w-full" role="img" aria-label="Evolución mensual de ventas valorizadas en USD">
        {gridValues.map((ratio) => {
          const y = padTop + chartHeight - ratio * chartHeight;
          const label = scaleMax * ratio;
          return (
            <g key={ratio}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="currentColor" className="text-neutral-100" strokeWidth="1" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" className="text-neutral-400">
                {Math.round(label)}
              </text>
            </g>
          );
        })}

        <polyline points={line} fill="none" stroke="currentColor" className="text-neutral-900" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="4" fill="currentColor" className="text-neutral-950" />
            <text x={point.x} y={Math.max(12, point.y - 10)} textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" className="text-neutral-700">
              {point.value > 0 ? Math.round(point.value) : "0"}
            </text>
            <text x={point.x} y={height - 14} textAnchor="middle" fontSize="11" fill="currentColor" className="text-neutral-500">
              {formatMonth(point.month)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ValuationDonut({ totalUnits, unpricedUnits }) {
  const total = Math.max(Number(totalUnits) || 0, 0);
  const unpriced = Math.min(Math.max(Number(unpricedUnits) || 0, 0), total);
  const priced = Math.max(total - unpriced, 0);
  const pricedPct = total > 0 ? (priced / total) * 100 : 0;
  const unpricedPct = total > 0 ? (unpriced / total) * 100 : 0;

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const pricedLength = (pricedPct / 100) * circumference;

  return (
    <div className="grid min-h-[220px] items-center gap-6 sm:grid-cols-[160px_1fr]">
      <div className="relative mx-auto h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-neutral-200" strokeWidth="16" />
          {total > 0 ? (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-neutral-950"
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={`${pricedLength} ${circumference - pricedLength}`}
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">{formatQuantity(total)}</span>
          <span className="text-xs font-medium text-neutral-500">láminas</span>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-neutral-950" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-neutral-600">Con Precio Italia</p>
              <p className="text-xs font-semibold text-neutral-900">{pricedPct.toFixed(1).replace(".", ",")}%</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-950">{formatQuantity(priced)} láminas</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-neutral-200 ring-1 ring-neutral-300" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-neutral-600">Sin Precio Italia</p>
              <p className="text-xs font-semibold text-neutral-900">{unpricedPct.toFixed(1).replace(".", ",")}%</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-neutral-950">{formatQuantity(unpriced)} láminas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectRanking({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const maxValue = Math.max(...rows.map((row) => Number(row.total_value_usd) || 0), 0);

  if (!rows.length) {
    return <EmptyChart message="Aún no existen proyectos marcados como visibles para Gerencia Italia." />;
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const value = Number(row.total_value_usd) || 0;
        const width = maxValue > 0 ? Math.max(5, (value / maxValue) * 100) : 0;
        return (
          <Link
            key={row.quotation_id}
            href={`/gerencia/cotizaciones-proyectos/${row.quotation_id}`}
            className="group block"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-medium text-neutral-700" title={row.project_name}>
                    {row.project_name}
                  </p>
                  <p className="shrink-0 text-xs font-semibold text-neutral-900">{formatUsd(value)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={index === 0 ? "h-full rounded-full bg-neutral-950" : "h-full rounded-full bg-neutral-300 transition group-hover:bg-neutral-500"}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Indicator({ icon, value, label, detail, href }) {
  const content = (
    <div className="flex min-w-0 items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
        <CardIcon type={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-neutral-700">{label}</p>
        <p className="mt-1 truncate text-[11px] text-neutral-400">{detail}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="group relative block min-w-0 px-1 py-2">
      {content}
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-black">→</span>
    </Link>
  ) : (
    <div className="min-w-0 px-1 py-2">{content}</div>
  );
}

export default function GerenciaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stock: {},
    sales: {},
    project_quotations: {},
    charts: {
      stock_by_collection: [],
      sales_monthly: [],
      project_ranking: [],
    },
  });

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/gerencia/resumen");

      setData({
        stock: response?.stock || {},
        sales: response?.sales || {},
        project_quotations: response?.project_quotations || {},
        charts: {
          stock_by_collection: response?.charts?.stock_by_collection || [],
          sales_monthly: response?.charts?.sales_monthly || [],
          project_ranking: response?.charts?.project_ranking || [],
        },
      });
    } catch (requestError) {
      console.error("Error cargando resumen de Gerencia Italia:", requestError);
      setError(requestError?.message || "No fue posible cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const stock = data.stock || {};
  const sales = data.sales || {};
  const projects = data.project_quotations || {};
  const charts = data.charts || {};

  const pricedStockUnits = useMemo(() => {
    const total = Number(stock.total_units) || 0;
    const unpriced = Number(stock.unpriced_units) || 0;
    return Math.max(total - unpriced, 0);
  }, [stock.total_units, stock.unpriced_units]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1450px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Gerencia Italia</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Resumen</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Stock, ventas y cotizaciones de proyectos de distribución Chile valorizados en USD.
              </p>
            </div>

            <button
              type="button"
              onClick={loadSummary}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-3">
          <MetricCard
            label="Stock Distribución Chile"
            primary={`${formatQuantity(stock.total_units)} láminas`}
            valueUsd={formatUsd(stock.total_value_usd)}
            detail="Valorización actual según Precio Italia"
            href="/gerencia/stock"
            icon="stock"
            loading={loading}
          />

          <MetricCard
            label="Ventas Distribución Chile"
            primary={`${formatQuantity(sales.total_units)} láminas`}
            valueUsd={formatUsd(sales.total_value_usd)}
            detail={`${formatInteger(sales.total_orders)} ventas completadas y pagadas`}
            href="/gerencia/ventas"
            icon="sales"
            loading={loading}
          />

          <MetricCard
            label="Cotizaciones Proyectos Chile"
            primary={`${formatInteger(projects.total_projects)} proyectos`}
            valueUsd={formatUsd(projects.total_value_usd)}
            detail={`${formatQuantity(projects.total_units)} láminas cotizadas`}
            href="/gerencia/cotizaciones-proyectos"
            icon="quotes"
            loading={loading}
          />
        </section>

        {loading ? (
          <section className="mt-5 grid gap-4 xl:grid-cols-12">
            <div className="h-[340px] animate-pulse rounded-[1.5rem] bg-neutral-100 xl:col-span-5" />
            <div className="h-[340px] animate-pulse rounded-[1.5rem] bg-neutral-100 xl:col-span-4" />
            <div className="grid gap-4 xl:col-span-3">
              <div className="h-[165px] animate-pulse rounded-[1.5rem] bg-neutral-100" />
              <div className="h-[165px] animate-pulse rounded-[1.5rem] bg-neutral-100" />
            </div>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-4 xl:grid-cols-12">
              <ChartCard
                title="Stock por colección"
                subtitle="Número de láminas en distribución Chile"
                className="xl:col-span-5"
              >
                <StockCollectionChart data={charts.stock_by_collection} />
              </ChartCard>

              <ChartCard
                title="Ventas valorizadas en USD"
                subtitle="Evolución mensual de los últimos 6 meses"
                className="xl:col-span-4"
              >
                <SalesLineChart data={charts.sales_monthly} />
              </ChartCard>

              <div className="grid gap-4 xl:col-span-3">
                <ChartCard
                  title="Estado valorización"
                  subtitle="Láminas en stock según Precio Italia"
                >
                  <ValuationDonut
                    totalUnits={stock.total_units}
                    unpricedUnits={stock.unpriced_units}
                  />
                </ChartCard>

                <ChartCard
                  title="Cotizaciones de proyectos"
                  subtitle="Proyectos visibles a Italia y valorización USD"
                >
                  <ProjectRanking data={charts.project_ranking} />
                </ChartCard>
              </div>
            </section>

            <section className="mt-5 rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Indicadores principales</p>
                <span className="inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  ABET LAMINATI · USD
                </span>
              </div>

              <div className="mt-5 grid gap-5 divide-y divide-neutral-100 md:grid-cols-2 md:divide-y-0 xl:grid-cols-4 xl:divide-x">
                <Indicator
                  icon="stock"
                  value={formatInteger(stock.products_with_italy_price)}
                  label="Productos con Precio Italia"
                  detail={`${formatQuantity(pricedStockUnits)} láminas valorizadas`}
                  href="/gerencia/stock"
                />

                <Indicator
                  icon="stock"
                  value={formatInteger(stock.products_with_stock)}
                  label="Productos con stock"
                  detail={`${formatInteger(stock.total_products)} productos ABET totales`}
                  href="/gerencia/stock"
                />

                <Indicator
                  icon="sales"
                  value={formatInteger(sales.total_orders)}
                  label="Ventas consideradas"
                  detail={`${formatQuantity(sales.total_units)} láminas ABET`}
                  href="/gerencia/ventas"
                />

                <Indicator
                  icon="quotes"
                  value={formatInteger(projects.total_projects)}
                  label="Proyectos visibles a Italia"
                  detail={`${formatQuantity(projects.total_units)} láminas cotizadas`}
                  href="/gerencia/cotizaciones-proyectos"
                />
              </div>

              {Number(stock.unpriced_units) > 0 || Number(sales.orders_with_unpriced_items) > 0 || Number(projects.projects_with_unpriced_items) > 0 ? (
                <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-800">
                  Hay información pendiente de Precio Italia: {formatQuantity(stock.unpriced_units)} láminas de stock sin valorización, {formatInteger(sales.orders_with_unpriced_items)} ventas con líneas sin precio y {formatInteger(projects.projects_with_unpriced_items)} proyectos con líneas sin precio.
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
