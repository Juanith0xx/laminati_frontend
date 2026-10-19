"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/services/api";

const formatStock = (n) => Number(n || 0).toLocaleString("es-CL", { maximumFractionDigits: 3 });
const makeRequestId = () => globalThis.crypto?.randomUUID?.() ?? null;
const OPTIONS = [
  { id: "RECEIPT", title: "Ingreso", description: "Suma unidades recibidas en Relbase." },
  { id: "CONSUMPTION", title: "Salida", description: "Descuenta unidades, protegiendo reservas." },
  { id: "COUNT", title: "Toma física", description: "Fija la existencia total contada en la bodega." },
];

export default function StockMovementModal({ product, onClose, onSuccess }) {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [preview, setPreview] = useState(null);
  const [operation, setOperation] = useState("RECEIPT");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reference, setReference] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [requestId, setRequestId] = useState(() => makeRequestId());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiRequest(`/admin/products/${product.id}/inventory`);
        if (!active) return;
        const rows = (response.inventory || []).filter((row) => row.relbase_warehouse_id != null);
        setWarehouses(rows);
        const defaultRow = rows.find((row) => Number(row.relbase_warehouse_id) === 956) || rows[0];
        setWarehouseId(defaultRow ? String(defaultRow.relbase_warehouse_id) : "");
        if (!rows.length) setError("No hay bodegas vinculadas a Relbase. Sincroniza primero este producto.");
      } catch (e) {
        if (active) setError(e?.message || "No fue posible cargar las bodegas.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [product.id]);

  const refreshPreview = useCallback(async () => {
    if (!warehouseId) return;
    setRefreshing(true);
    setError("");
    setPreview(null);
    try {
      const data = await apiRequest(`/admin/products/${product.id}/stock-movements/preview?warehouse_id=${encodeURIComponent(warehouseId)}`);
      setPreview(data);

      const relbaseStock =
        Number(
          data?.warehouse?.relbase_stock
        );

      if (
        Number.isFinite(
          relbaseStock
        ) &&
        relbaseStock < 0
      ) {
        setOperation(
          "COUNT"
        );

        setConfirmed(
          false
        );
      }
    } catch (e) {
      setError(e?.message || "No fue posible verificar las existencias actuales de Relbase.");
    } finally { setRefreshing(false); }
  }, [product.id, warehouseId]);

  useEffect(() => {
    setConfirmed(false);
    if (!warehouseId) { setPreview(null); return; }
    refreshPreview();
  }, [warehouseId, refreshPreview]);

  const q = Number(quantity);
  const validQty = quantity !== "" && Number.isSafeInteger(q) && q >= (operation === "COUNT" ? 0 : 1) && q <= 100000;
  const validCost = operation !== "RECEIPT" || (unitCost !== "" && Number.isFinite(Number(unitCost)) && Number(unitCost) >= 0);
  const reserved = Number(preview?.warehouse?.reserved || 0);
  const safety = Number(preview?.warehouse?.safety_stock || 0);
  const before = Number(preview?.warehouse?.relbase_stock || 0);

  const requiresPhysicalCount =
    Boolean(
      preview?.warehouse
        ?.requires_physical_count
    ) ||
    (
      preview &&
      Number.isFinite(before) &&
      before < 0
    );

  const after =
    operation === "RECEIPT"
      ? before + q
      : operation === "CONSUMPTION"
        ? before - q
        : q;

  const safeAfter =
    operation === "RECEIPT"
      ? !requiresPhysicalCount
      : after >=
        reserved + safety;

  const writeAvailable =
    Boolean(
      preview?.permissions?.can_write
    );

  const operationAllowed =
    !requiresPhysicalCount ||
    operation === "COUNT";

  const canSubmit = Boolean(
    requestId &&
    preview &&
    writeAvailable &&
    operationAllowed &&
    validQty &&
    validCost &&
    reference.trim().length >= 4 &&
    reference.trim().length <= 120 &&
    safeAfter &&
    confirmed &&
    !submitting &&
    !refreshing &&
    !result
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await apiRequest(`/admin/products/${product.id}/stock-movements`, {
        method: "POST", body: {
          request_id: requestId,
          warehouse_id: Number(warehouseId),
          operation,
          quantity: q,
          document_reference: reference.trim(),
          ...(operation === "RECEIPT" ? { unit_cost: Number(unitCost) } : {}),
        },
      });
      setResult(response.movement);
      if (response.movement?.status === "SUCCEEDED") onSuccess?.();
    } catch (e) {
      const message = e?.message || "No fue posible confirmar el movimiento.";
      setError(`${message} Si hubo un problema de red, NO crees otra operación: consulta el ID ${requestId} en el historial.`);
      // Nunca reintentar automáticamente ni generar una idempotency key distinta tras un error.
      setResult({ status: "CHECK_STATUS", request_id: requestId });
    } finally { setSubmitting(false); }
  };

  const checkMovement = async () => {
    if (!result?.request_id || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await apiRequest(`/admin/products/${product.id}/stock-movements/${encodeURIComponent(result.request_id)}`);
      setResult(response.movement);
      if (response.movement?.status === "SUCCEEDED") onSuccess?.();
    } catch (e) { setError(e?.message || "No fue posible consultar el estado. Revísalo en la base de datos y en Relbase."); }
    finally { setSubmitting(false); }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="stock-modal-title" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-[#f7f6f3] p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Inventario · Relbase</p>
            <h2 id="stock-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Gestionar stock</h2>
            <p className="mt-2 text-sm text-neutral-500">{product.name} · SKU {product.sku}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Cerrar" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 disabled:opacity-50">Cerrar</button>
        </div>
        {error && <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {result ? (
          <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">Estado: {result.status}</p>
            <p className="break-all text-xs text-neutral-500">ID del movimiento: {result.request_id}</p>
            {result.status === "SUCCEEDED" ? <p className="text-sm text-emerald-700">Relbase confirmó el movimiento y Laminatiword sincronizó el producto.</p> : <p className="text-sm text-amber-700">No repitas este movimiento. Revisa su ID y concilia el resultado con Relbase antes de una nueva operación.</p>}
            {result.status !== "SUCCEEDED" && <button type="button" onClick={checkMovement} disabled={submitting} className="mr-2 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm text-neutral-800 disabled:opacity-50">{submitting ? "Consultando..." : "Consultar estado (solo lectura)"}</button>}
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-full bg-black px-6 py-3 text-sm text-white disabled:opacity-50">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="stock-warehouse" className="text-sm font-semibold text-neutral-800">Bodega</label>
              <select id="stock-warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} disabled={loading || submitting} className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm">
                <option value="">Seleccionar bodega</option>
                {warehouses.map((w) => <option key={w.id} value={w.relbase_warehouse_id}>{w.warehouse_name || w.warehouse_code} · #{w.relbase_warehouse_id}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Relbase", preview?.warehouse?.relbase_stock],
                ["Local", preview?.warehouse?.local_stock],
                ["Reservas", preview?.warehouse?.reserved],
                ["Seguridad", preview?.warehouse?.safety_stock],
              ].map(([title, val]) => <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-3"><p className="text-[10px] uppercase text-neutral-400">{title}</p><p className="mt-1 text-xl font-semibold">{preview ? formatStock(val) : "—"}</p></div>)}
            </div>
            <button type="button" disabled={refreshing || !warehouseId} onClick={refreshPreview} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700 disabled:opacity-50">{refreshing ? "Consultando Relbase..." : "Actualizar existencia real"}</button>
            {preview && before !== Number(preview.warehouse.local_stock) && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">La copia local difiere de Relbase; la operación usa la existencia real y sincronizará el producto después.</p>}
            {preview &&
              !writeAvailable && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Escritura deshabilitada. Verifica RELBASE_INVENTORY_WRITE_ENABLED=true y que la conexión OAuth tenga inventory:write. No es posible confirmar aún.
                </p>
              )}

            {preview &&
              requiresPhysicalCount && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p className="font-semibold">
                    Relbase registra una existencia negativa de {formatStock(before)} unidades.
                  </p>

                  <p className="mt-1 text-xs leading-5">
                    Para corregir este descuadre debes usar <strong>Toma física</strong> e ingresar la cantidad realmente contada en bodega. Mientras Relbase siga negativo, Ingreso y Salida quedan bloqueados.
                  </p>
                </div>
              )}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-neutral-800">
                Operación
              </legend>

              <div className="grid gap-2 sm:grid-cols-3">
                {OPTIONS.map(
                  (option) => {
                    const disabled =
                      requiresPhysicalCount &&
                      option.id !== "COUNT";

                    return (
                      <label
                        key={
                          option.id
                        }
                        className={`rounded-2xl border p-3 ${
                          disabled
                            ? "cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-45"
                            : operation === option.id
                              ? "cursor-pointer border-black bg-white"
                              : "cursor-pointer border-neutral-200 bg-neutral-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="stock-operation"
                          value={
                            option.id
                          }
                          checked={
                            operation === option.id
                          }
                          disabled={
                            disabled
                          }
                          onChange={() => {
                            setOperation(
                              option.id
                            );
                            setConfirmed(
                              false
                            );
                          }}
                          className="mr-2"
                        />

                        <span className="text-sm font-semibold">
                          {
                            option.title
                          }
                        </span>

                        <p className="mt-1 text-xs text-neutral-500">
                          {
                            option.description
                          }
                        </p>
                      </label>
                    );
                  }
                )}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-neutral-800">{operation === "COUNT" ? "Total contado" : "Unidades"}<input type="number" step="1" min={operation === "COUNT" ? "0" : "1"} max="100000" value={quantity} onChange={(event) => { setQuantity(event.target.value); setConfirmed(false); }} required className="block w-full rounded-xl border border-neutral-200 bg-white p-3 font-normal"/></label>
              {operation === "RECEIPT" && <label className="space-y-1 text-sm font-semibold text-neutral-800">Costo unitario (CLP)<input type="number" step="0.01" min="0" value={unitCost} onChange={(event) => { setUnitCost(event.target.value); setConfirmed(false); }} required className="block w-full rounded-xl border border-neutral-200 bg-white p-3 font-normal"/></label>}
            </div>
            <label className="block space-y-1 text-sm font-semibold text-neutral-800">Documento o motivo <input type="text" maxLength={120} minLength={4} value={reference} onChange={(event) => { setReference(event.target.value); setConfirmed(false); }} placeholder="Ej.: Recepción OC-123 / Ajuste por conteo" required className="block w-full rounded-xl border border-neutral-200 bg-white p-3 font-normal"/></label>
            {preview &&
              validQty && (
                <div
                  className={`rounded-2xl p-4 text-sm ${
                    safeAfter &&
                    operationAllowed
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  Relbase:{" "}
                  <strong>
                    {
                      formatStock(
                        before
                      )
                    }
                  </strong>{" "}
                  → Resultado estimado:{" "}
                  <strong>
                    {
                      formatStock(
                        after
                      )
                    }
                  </strong>
                  . Reservas + seguridad:{" "}
                  {
                    formatStock(
                      reserved +
                        safety
                    )
                  }
                  .

                  {requiresPhysicalCount &&
                    operation ===
                      "COUNT" && (
                      <span>
                        {" "}
                        Esta toma física reemplazará la existencia negativa por el conteo real indicado.
                      </span>
                    )}

                  {!operationAllowed && (
                    <span>
                      {" "}
                      Debes regularizar primero mediante una toma física.
                    </span>
                  )}

                  {operationAllowed &&
                    !safeAfter && (
                      <span>
                        {" "}
                        No se permite dejar existencias por debajo de reservas + stock de seguridad.
                      </span>
                    )}
                </div>
              )}
            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1"/>Confirmo que el producto, la bodega, las cantidades y el motivo son correctos. Este movimiento modificará inventario REAL en Relbase.</label>
            <button type="submit" disabled={!canSubmit} className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35">{submitting ? "Registrando movimiento..." : "Confirmar movimiento en Relbase"}</button>
            <p className="break-all text-[10px] text-neutral-400">Identificador único: {requestId || "No disponible (requiere HTTPS o localhost)"}. Si aparece un error tras confirmar, no ejecutes otra vez hasta verificar el movimiento.</p>
          </form>
        )}
      </section>
    </div>
  );
}