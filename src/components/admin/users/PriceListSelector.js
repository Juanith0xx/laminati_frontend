"use client";

import { useMemo } from "react";

export default function PriceListSelector({
  priceLists = [],
  value = "",
  onChange,
  disabled = false,
  loading = false,
}) {
  const selected = useMemo(
    () =>
      priceLists.find(
        (item) => String(item.id) === String(value)
      ) || null,
    [priceLists, value]
  );

  return (
    <div className="space-y-2">
      <label className="block space-y-2">
        <span className="text-xs font-semibold text-neutral-700">
          Lista de precios
        </span>

        <select
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          <option value="">
            {loading ? "Cargando lista asignada..." : "Sin lista de precios"}
          </option>

          {priceLists.map((priceList) => {
            const isCurrent =
              String(priceList.id) === String(value);

            return (
              <option
                key={priceList.id}
                value={priceList.id}
                disabled={!priceList.is_active && !isCurrent}
              >
                {priceList.name}
                {!priceList.is_active ? " · Inactiva" : ""}
              </option>
            );
          })}
        </select>
      </label>

      {selected ? (
        <div className="rounded-xl border border-violet-100 bg-white px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                selected.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {selected.is_active ? "Activa" : "Inactiva"}
            </span>

            <span className="text-[11px] text-neutral-500">
              {Number(selected.rules_count || 0)} regla
              {Number(selected.rules_count || 0) === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-neutral-600">
            {selected.description ||
              "Lista comercial sin descripción."}
          </p>

          {!selected.is_active && (
            <p className="mt-2 text-[11px] font-medium text-amber-700">
              Esta lista está inactiva. Puedes conservarla en el usuario,
              pero no asignarla nuevamente.
            </p>
          )}
        </div>
      ) : (
        <p className="text-[11px] leading-5 text-neutral-400">
          Sin una lista asignada, el cliente utilizará las condiciones
          generales de precio.
        </p>
      )}
    </div>
  );
}
