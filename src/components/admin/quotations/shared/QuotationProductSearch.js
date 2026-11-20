"use client";

import { useMemo, useState } from "react";

const FAMILY_FILTERS = [
  { code: "ALL", label: "Todos" },
  { code: "HPL", label: "Laminado" },
  { code: "STRATIFICATO", label: "Stratificato" },
  { code: "MEG", label: "MEG" },
  { code: "LABGRADE", label: "Labgrade" },
  { code: "LABGRADE_PLUS", label: "Labgrade Plus" },
];

const FAMILY_BADGE = {
  HPL: "bg-neutral-100 text-neutral-700",
  STRATIFICATO: "bg-violet-50 text-violet-700",
  MEG: "bg-emerald-50 text-emerald-700",
  LABGRADE: "bg-sky-50 text-sky-700",
  LABGRADE_PLUS: "bg-indigo-50 text-indigo-700",
  SERVICE: "bg-amber-50 text-amber-700",
};

function clean(value) {
  return String(value ?? "").trim();
}

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(number);
}

function getFamilyCode(product) {
  const sku = clean(product?.sku).toUpperCase();
  if (sku === "FEX-DESPACHO") return "SERVICE";

  return (
    clean(
      product?.project_family_code ||
        product?.project_family?.code ||
        product?.family?.code
    ).toUpperCase() || "HPL"
  );
}

function getFamilyLabel(product) {
  const code = getFamilyCode(product);
  const explicit = clean(
    product?.project_family_name ||
      product?.project_family?.name ||
      product?.family?.name
  );

  if (explicit && code !== "HPL") return explicit;

  switch (code) {
    case "STRATIFICATO":
      return "Stratificato";
    case "MEG":
      return "MEG";
    case "LABGRADE":
      return "Labgrade";
    case "LABGRADE_PLUS":
      return "Labgrade Plus";
    case "SERVICE":
      return "Servicio";
    default:
      return "Laminado";
  }
}

function getFinishes(product) {
  const projectFinishes = Array.isArray(product?.project_finishes)
    ? product.project_finishes
    : [];

  if (projectFinishes.length > 0) {
    return projectFinishes
      .map((finish) => ({
        name: clean(finish?.name),
        isDefault: finish?.is_default === true,
      }))
      .filter((finish) => Boolean(finish.name));
  }

  const finish = clean(product?.finish);
  return finish ? [{ name: finish, isDefault: true }] : [];
}

function getThicknesses(product) {
  const projectThicknesses = Array.isArray(product?.project_thicknesses)
    ? product.project_thicknesses
    : [];

  const values = projectThicknesses
    .map((item) => {
      if (typeof item === "number" || typeof item === "string") return Number(item);
      return Number(item?.thickness_mm);
    })
    .filter((value) => Number.isFinite(value));

  if (values.length > 0) {
    return [...new Set(values)].sort((a, b) => a - b);
  }

  const productThickness = Number(product?.thickness_mm);
  return Number.isFinite(productThickness) && productThickness > 0
    ? [productThickness]
    : [];
}

function formatThickness(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";

  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number)} mm`;
}

function compactList(values, max = 4) {
  if (!Array.isArray(values) || values.length === 0) return "";
  const shown = values.slice(0, max);
  const remaining = values.length - shown.length;
  return `${shown.join(" / ")}${remaining > 0 ? ` / +${remaining}` : ""}`;
}

function compactNames(values, max = 3) {
  if (!Array.isArray(values) || values.length === 0) return "";
  const shown = values.slice(0, max);
  const remaining = values.length - shown.length;
  return `${shown.join(", ")}${remaining > 0 ? `, +${remaining}` : ""}`;
}

function getImageUrl(product) {
  return (
    clean(product?.primary_image_url) ||
    clean(product?.primary_image?.card_url) ||
    clean(product?.image_url) ||
    null
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 17 8 4 8-4" />
    </svg>
  );
}

function FinishIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 19 19 5M4 13 13 4M11 20l9-9M4 7l3-3M17 20l3-3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function TechnicalPill({ icon, children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-medium text-neutral-700 shadow-[0_1px_1px_rgba(0,0,0,.02)]">
      <span className="shrink-0 text-neutral-500">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

function ProductResult({ product, onSelect, actionLabel, disabled, compact }) {
  const familyCode = getFamilyCode(product);
  const familyLabel = getFamilyLabel(product);
  const finishes = getFinishes(product);
  const thicknesses = getThicknesses(product);
  const imageUrl = getImageUrl(product);
  const sku = clean(product?.sku);
  const internalCode = clean(product?.internal_code);
  const brand = clean(product?.brand);
  const available = Number(product?.available_pos);
  const hasStockInfo = Number.isFinite(available);
  const isFex = sku.toUpperCase() === "FEX-DESPACHO";
  const price = Number(product?.base_price);

  const finishText = compactNames(
    finishes.map((finish) => finish.name),
    compact ? 2 : 3
  );
  const thicknessText = compactList(
    thicknesses.map(formatThickness),
    compact ? 3 : 5
  );

  const hasTechnicalOptions = Boolean(finishText || thicknessText);

  return (
    <article className="group flex flex-col gap-4 rounded-[18px] border border-black/[.07] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,.025)] transition hover:border-black/[.13] hover:shadow-[0_5px_18px_rgba(0,0,0,.045)] lg:flex-row lg:items-center">
      <div className="flex min-w-0 items-center gap-3.5 lg:w-[34%] lg:shrink-0">
        <div className={`shrink-0 overflow-hidden rounded-xl border border-black/[.06] bg-[#f6f4ef] ${compact ? "h-14 w-14" : "h-[68px] w-[68px]"}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product?.primary_image_alt || product?.name || sku || "Producto"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#faf8f1] to-[#efede5]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                FAMILY_BADGE[familyCode] || FAMILY_BADGE.HPL
              }`}
            >
              {familyLabel}
            </span>
            {sku ? <span className="text-[11px] font-semibold text-neutral-500">{sku}</span> : null}
            {internalCode && internalCode !== sku ? (
              <span className="text-[10px] text-neutral-400">Código {internalCode}</span>
            ) : null}
          </div>

          <h3 className={`mt-1.5 truncate font-semibold text-neutral-950 ${compact ? "text-[13px]" : "text-sm"}`}>
            {product?.name || "Producto"}
          </h3>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-neutral-500">
            {brand ? <span>{brand}</span> : null}
            {hasStockInfo ? (
              <span className={available > 0 ? "text-neutral-400" : "font-medium text-red-600"}>
                {available > 0 ? `Stock ${available}` : "Sin stock"}
              </span>
            ) : null}
            {Number.isFinite(price) && price > 0 && !compact ? (
              <span className="font-medium text-neutral-600">{money(price)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden h-12 w-px shrink-0 bg-black/[.08] lg:block" />

      <div className="min-w-0 flex-1">
        {hasTechnicalOptions ? (
          <>
            <div className="mb-1.5 text-[10px] font-semibold text-neutral-800">Opciones técnicas</div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {thicknessText ? (
                <TechnicalPill icon={<LayersIcon />}>
                  Espesores: {thicknessText}
                </TechnicalPill>
              ) : null}
              {finishText ? (
                <TechnicalPill icon={<FinishIcon />}>
                  Acabados: {finishText}
                </TechnicalPill>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isFex ? (
              <span className="rounded-full bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                Precio según FEX
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400">Producto de catálogo</span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end lg:w-[132px]">
        <button
          type="button"
          onClick={() => onSelect?.(product)}
          disabled={disabled}
          className={`rounded-full px-5 font-medium transition ${compact ? "h-9 text-xs" : "h-10 text-sm"} ${
            disabled
              ? "cursor-not-allowed bg-neutral-200 text-neutral-400"
              : "bg-black text-white hover:bg-neutral-800"
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

export default function QuotationProductSearch({
  query,
  onQueryChange,
  products = [],
  loading = false,
  error = "",
  onSelect,
  actionLabel = "Seleccionar",
  placeholder = "Buscar por código, SKU o nombre...",
  emptyMessage = "No se encontraron productos para esta búsqueda.",
  minQueryLength = 0,
  compact = false,
  showFamilyFilters = true,
  getDisabled,
  getActionLabel,
}) {
  const [family, setFamily] = useState("ALL");
  const normalizedQuery = clean(query);

  const visibleProducts = useMemo(() => {
    if (family === "ALL") return products;
    return products.filter((product) => getFamilyCode(product) === family);
  }, [products, family]);

  const hasQuery = normalizedQuery.length >= minQueryLength;

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black/25 focus:ring-4 focus:ring-black/[.035] ${
            compact ? "h-11" : "h-12"
          }`}
        />
      </div>

      {showFamilyFilters ? (
        <div className="mt-2.5 overflow-x-auto border-b border-black/[.07] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-7 px-1">
            {FAMILY_FILTERS.map((item) => {
              const active = family === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setFamily(item.code)}
                  className={`relative h-10 whitespace-nowrap text-xs transition ${
                    active
                      ? "font-semibold text-black"
                      : "font-medium text-neutral-500 hover:text-black"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-black transition-transform ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          Buscando productos...
        </div>
      ) : null}

      {!loading && hasQuery && products.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          {emptyMessage}
        </div>
      ) : null}

      {!loading && visibleProducts.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2.5">
          {visibleProducts.map((product) => (
            <ProductResult
              key={product?.id || product?.product_id || product?.sku}
              product={product}
              onSelect={onSelect}
              actionLabel={
                typeof getActionLabel === "function"
                  ? getActionLabel(product)
                  : actionLabel
              }
              disabled={
                typeof getDisabled === "function"
                  ? Boolean(getDisabled(product))
                  : false
              }
              compact={compact}
            />
          ))}
        </div>
      ) : null}

      {!loading && products.length > 0 && visibleProducts.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-neutral-500">
          No hay resultados de esta familia en la búsqueda actual.
        </div>
      ) : null}
    </div>
  );
}
