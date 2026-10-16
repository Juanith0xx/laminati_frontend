"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createAdminPriceListRule,
  updateAdminPriceListRule,
} from "@/services/adminPriceLists.service";

const DISCOUNT_OPTIONS = [
  { value: "PERCENTAGE", label: "% Porcentaje" },
  { value: "FIXED_AMOUNT", label: "$ Monto fijo" },
];

const money = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function PriceListRuleModal({
  open,
  mode = "create",
  scope = "PRODUCT",
  priceListId,
  rule = null,
  products = [],
  collections = [],
  existingRules = [],
  onClose,
  onSaved,
}) {
  const [search, setSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [collectionId, setCollectionId] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("20");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setError("");

    if (mode === "edit" && rule) {
      setSelectedProductIds(rule.product_id ? [rule.product_id] : []);
      setCollectionId(rule.collection_id || "");
      setDiscountType(rule.discount_type || "PERCENTAGE");
      setDiscountValue(String(rule.discount_value ?? ""));
      setIsActive(Boolean(rule.is_active));
      return;
    }

    setSelectedProductIds([]);
    setCollectionId("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("20");
    setIsActive(true);
  }, [open, mode, rule, scope]);

  const existingProductIds = useMemo(
    () =>
      new Set(
        existingRules
          .filter((item) => item.scope_type === "PRODUCT" && item.id !== rule?.id)
          .map((item) => String(item.product_id))
      ),
    [existingRules, rule?.id]
  );

  const existingCollectionIds = useMemo(
    () =>
      new Set(
        existingRules
          .filter(
            (item) => item.scope_type === "COLLECTION" && item.id !== rule?.id
          )
          .map((item) => String(item.collection_id))
      ),
    [existingRules, rule?.id]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) => {
        if (existingProductIds.has(String(product.id))) return false;
        if (!term) return true;

        return [
          product.sku,
          product.name,
          product.internal_code,
          product.collection,
        ].some((value) => String(value || "").toLowerCase().includes(term));
      })
      .slice(0, 60);
  }, [products, search, existingProductIds]);

  if (!open) return null;

  const normalizedScope = mode === "edit" ? rule?.scope_type || scope : scope;
  const isProduct = normalizedScope === "PRODUCT";

  const toggleProduct = (productId) => {
    if (mode === "edit") return;

    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const validate = () => {
    const discount = Number(discountValue);

    if (!Number.isFinite(discount) || discount <= 0) {
      return "El descuento debe ser mayor que 0.";
    }

    if (discountType === "PERCENTAGE" && discount > 100) {
      return "El descuento porcentual no puede superar 100%.";
    }

    if (isProduct && selectedProductIds.length === 0) {
      return "Selecciona al menos un producto.";
    }

    if (!isProduct && !collectionId) {
      return "Selecciona una colección.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const basePayload = {
      discount_type: discountType,
      discount_value: Number(discountValue),
      is_active: Boolean(isActive),
    };

    try {
      setSaving(true);

      if (mode === "edit" && rule?.id) {
        await updateAdminPriceListRule(priceListId, rule.id, {
          ...basePayload,
          scope_type: normalizedScope,
          ...(isProduct
            ? { product_id: selectedProductIds[0] }
            : { collection_id: collectionId }),
        });
      } else if (isProduct) {
        for (const productId of selectedProductIds) {
          await createAdminPriceListRule(priceListId, {
            ...basePayload,
            scope_type: "PRODUCT",
            product_id: productId,
          });
        }
      } else {
        await createAdminPriceListRule(priceListId, {
          ...basePayload,
          scope_type: "COLLECTION",
          collection_id: collectionId,
        });
      }

      await onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "No fue posible guardar la regla de descuento.");
    } finally {
      setSaving(false);
    }
  };

  const currentTargetLabel = isProduct
    ? `${rule?.product_sku || ""} · ${rule?.product_name || "Producto"}`
    : rule?.collection_name || "Colección";

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-5">
      <button
        type="button"
        aria-label="Cerrar regla"
        className="absolute inset-0 cursor-default"
        onClick={saving ? undefined : onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-black/5 bg-[#f7f6f3] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/5 bg-white px-6 py-5 sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Regla de descuento
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black">
              {mode === "edit"
                ? "Editar regla"
                : isProduct
                  ? "Agregar productos"
                  : "Agregar colección"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-xl text-neutral-500 transition hover:bg-neutral-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-7">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === "edit" ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                {isProduct ? "Producto" : "Colección"}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {currentTargetLabel}
              </p>
            </div>
          ) : isProduct ? (
            <div>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-neutral-700">
                  Buscar producto
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="SKU, nombre, código interno o colección..."
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                />
              </label>

              <div className="mt-3 max-h-[310px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2">
                {filteredProducts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-neutral-500">
                    No hay productos disponibles para agregar.
                  </p>
                ) : (
                  filteredProducts.map((product) => {
                    const checked = selectedProductIds.includes(product.id);

                    return (
                      <button
                        type="button"
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          checked ? "bg-black text-white" : "hover:bg-neutral-50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                            checked
                              ? "border-white bg-white text-black"
                              : "border-neutral-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {product.sku} · {product.name}
                          </span>
                          <span
                            className={`mt-0.5 block truncate text-xs ${
                              checked ? "text-white/65" : "text-neutral-400"
                            }`}
                          >
                            {product.collection || "Sin colección"} · Precio base {money(product.base_price)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedProductIds.length > 0 && (
                <p className="mt-2 text-xs font-medium text-neutral-500">
                  {selectedProductIds.length} producto(s) seleccionado(s)
                </p>
              )}
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-neutral-700">
                Colección
              </span>
              <select
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              >
                <option value="">Seleccionar colección</option>
                {collections
                  .filter(
                    (collection) =>
                      !existingCollectionIds.has(String(collection.id))
                  )
                  .map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                      {collection.brand_name ? ` · ${collection.brand_name}` : ""}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-neutral-700">
                Tipo de descuento
              </span>
              <select
                value={discountType}
                onChange={(event) => setDiscountType(event.target.value)}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              >
                {DISCOUNT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-neutral-700">
                Descuento
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max={discountType === "PERCENTAGE" ? "100" : undefined}
                  step={discountType === "PERCENTAGE" ? "0.01" : "1"}
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-black"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                  {discountType === "PERCENTAGE" ? "%" : "$"}
                </span>
              </div>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Regla activa</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Una regla desactivada se conserva pero no se aplicará al precio.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((current) => !current)}
              className={`relative inline-flex h-8 w-[54px] shrink-0 items-center rounded-full border transition ${
                isActive
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-neutral-300 bg-neutral-300"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  isActive ? "translate-x-[26px]" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-black/5 bg-white px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving
              ? "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : isProduct && selectedProductIds.length > 1
                  ? `Agregar ${selectedProductIds.length} productos`
                  : "Agregar regla"}
          </button>
        </footer>
      </form>
    </div>
  );
}
