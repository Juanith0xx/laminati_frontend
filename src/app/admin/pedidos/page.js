"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders } from "@/services/orderManagement.service";

const EMPTY = {
  search: "", source: "ALL", status: "ALL", payment_status: "ALL",
  fulfillment_status: "ALL", from: "", to: "", page: 1, limit: 20,
};
const OPTIONS = {
  source: [{ value: "ALL", label: "Todos los canales" }, { value: "WEB", label: "Online" }, { value: "STORE", label: "Showroom" }],
  status: ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"].map((v) => ({ value: v, label: ({ ALL: "Todos los estados", PENDING: "Pendiente", CONFIRMED: "Confirmado", PROCESSING: "En proceso", COMPLETED: "Completado", CANCELLED: "Cancelado" })[v] })),
  payment_status: ["ALL", "PENDING", "AWAITING_CONFIRMATION", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CANCELLED"].map((v) => ({ value: v, label: ({ ALL: "Todos los pagos", PENDING: "Pendiente", AWAITING_CONFIRMATION: "Esperando confirmación", AUTHORIZED: "Autorizado", PAID: "Pagado", FAILED: "Fallido", REFUNDED: "Reembolsado", CANCELLED: "Cancelado" })[v] })),
  fulfillment_status: ["ALL", "PENDING", "PREPARING", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED"].map((v) => ({ value: v, label: ({ ALL: "Todos los retiros", PENDING: "Pendiente", PREPARING: "Preparando", READY_FOR_PICKUP: "Listo para retiro", DELIVERED: "Entregado", CANCELLED: "Cancelado" })[v] })),
};
const money = (amount) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(Number(amount) || 0);
const dateTime = (value) => value
  ? new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(value))
  : "—";
const human = (value) => ({
  PENDING: "Pendiente", CONFIRMED: "Confirmado", PROCESSING: "En proceso",
  COMPLETED: "Completado", CANCELLED: "Cancelado", PAID: "Pagado",
  AWAITING_CONFIRMATION: "Por confirmar", AUTHORIZED: "Autorizado",
  FAILED: "Fallido", REFUNDED: "Reembolsado", PREPARING: "Preparando",
  READY_FOR_PICKUP: "Listo para retiro", DELIVERED: "Entregado",
})[value] || value || "—";
function Pill({ value, type = "status" }) {
  const good = value === "PAID" || value === "COMPLETED" || value === "DELIVERED";
  const bad = value === "CANCELLED" || value === "FAILED" || value === "REFUNDED";
  const color = good ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : bad ? "border-rose-200 bg-rose-50 text-rose-700"
      : type === "channel" ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${color}`}>{type === "channel" ? value === "WEB" ? "Online" : "Showroom" : human(value)}</span>;
}
function Field({ label, children }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>{children}</label>;
}
const controlClass = "h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900";

export default function AdminPedidosPage() {
  const [form, setForm] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    getAdminOrders({ ...applied, signal: controller.signal })
      .then((data) => { if (active) setResult(data); })
      .catch((err) => {
        if (active && err?.name !== "AbortError") {
          setError(err?.message || "No fue posible consultar los pedidos");
          setResult(null);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [applied, reload]);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (form.from && form.to && form.from > form.to) {
      setError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }
    setApplied({ ...form, page: 1 });
  };
  const reset = () => { setForm({ ...EMPTY }); setApplied({ ...EMPTY }); setError(""); };
  const pagination = result?.pagination;
  const orders = Array.isArray(result?.orders) ? result.orders : [];

  return (
    <main className="min-h-screen bg-[#f7f6f4] px-4 py-7 text-neutral-950 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e45e59] via-[#c56b9e] to-[#6953af]" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">LAMINATI · BACKOFFICE</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Gestión de pedidos</h1>
              <p className="mt-1 text-sm text-neutral-500">Pedidos online y del Showroom · búsqueda por número, cliente o SKU.</p></div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/dashboard" className="inline-flex h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-medium hover:bg-neutral-50">Dashboard</Link>
              <button type="button" onClick={() => setReload((n) => n + 1)} disabled={loading} className="h-11 rounded-full bg-black px-5 text-sm font-medium text-white disabled:opacity-50">Actualizar</button>
            </div>
          </div>
        </header>

        <form onSubmit={submit} className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-base font-semibold">Buscar y filtrar</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2"><Field label="Número, cliente, RUT o código de laminado"><input value={form.search} onChange={(e) => setField("search", e.target.value)} maxLength={120} placeholder="Ej. LMT-..., 668R, Apple Tree..." className={controlClass} /></Field></div>
            <Field label="Canal"><select value={form.source} onChange={(e) => setField("source", e.target.value)} className={controlClass}>{OPTIONS.source.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></Field>
            <Field label="Estado del pedido"><select value={form.status} onChange={(e) => setField("status", e.target.value)} className={controlClass}>{OPTIONS.status.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></Field>
            <Field label="Estado del pago"><select value={form.payment_status} onChange={(e) => setField("payment_status", e.target.value)} className={controlClass}>{OPTIONS.payment_status.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></Field>
            <Field label="Retiro / preparación"><select value={form.fulfillment_status} onChange={(e) => setField("fulfillment_status", e.target.value)} className={controlClass}>{OPTIONS.fulfillment_status.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></Field>
            <Field label="Desde"><input type="date" value={form.from} onChange={(e) => setField("from", e.target.value)} className={controlClass} /></Field>
            <Field label="Hasta"><input type="date" value={form.to} onChange={(e) => setField("to", e.target.value)} className={controlClass} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" className="h-11 rounded-xl bg-black px-7 text-sm font-semibold text-white hover:bg-neutral-800">Aplicar filtros</button>
            <button type="button" onClick={reset} className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium hover:bg-neutral-50">Limpiar filtros</button>
            <span className="text-xs text-neutral-400">Fechas según creación del pedido · horario de Chile.</span>
          </div>
        </form>

        <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-semibold">Pedidos registrados</h2>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">{loading ? "Consultando..." : `${pagination?.total ?? 0} resultados`}</span>
          </div>
          {error && <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={() => setReload((n) => n + 1)} className="ml-2 font-semibold underline">Reintentar</button></div>}
          {loading && <p role="status" className="p-10 text-center text-sm text-neutral-500">Cargando pedidos...</p>}
          {!loading && !error && orders.length === 0 && <p className="p-10 text-center text-sm text-neutral-500">No se encontraron pedidos con estos filtros.</p>}
          {!loading && !error && orders.length > 0 && <>
            <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500"><tr><th className="px-6 py-4">Pedido / laminados</th><th className="px-4 py-4">Cliente</th><th className="px-4 py-4">Canal</th><th className="px-4 py-4">Pago</th><th className="px-4 py-4">Preparación</th><th className="px-4 py-4 text-right">Total</th><th className="px-6 py-4 text-right">Acción</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">{orders.map((order) => <tr key={order.id} className="hover:bg-neutral-50/70">
                <td className="px-6 py-4"><p className="font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-neutral-400">{dateTime(order.created_at)}</p><div className="mt-2 flex max-w-[260px] flex-wrap gap-1">{(order.product_skus || []).slice(0, 3).map((sku) => <span key={sku} className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold">{sku}</span>)}{(order.product_skus || []).length > 3 && <span className="text-xs text-neutral-500">+{order.product_skus.length - 3}</span>}</div></td>
                <td className="px-4 py-4"><p className="max-w-[180px] truncate font-medium">{order.customer_name}</p><p className="text-xs text-neutral-400">{order.customer_rut || "Sin RUT"}</p></td>
                <td className="px-4 py-4"><Pill value={order.source} type="channel" /></td>
                <td className="px-4 py-4"><Pill value={order.payment_status} /></td>
                <td className="px-4 py-4"><Pill value={order.fulfillment_status} /></td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">{money(order.total)}</td>
                <td className="px-6 py-4 text-right"><Link href={`/admin/pedidos/${order.id}`} className="inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold hover:border-black hover:bg-black hover:text-white">Ver detalle</Link></td>
              </tr>)}</tbody>
            </table></div>
            <div className="divide-y divide-neutral-100 lg:hidden">{orders.map((order) => <article key={order.id} className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{order.order_number}</p><Pill value={order.source} type="channel" /></div>
              <p className="text-sm text-neutral-600">{order.customer_name} · {dateTime(order.created_at)}</p>
              <div className="flex flex-wrap gap-1">{(order.product_skus || []).map((sku) => <span key={sku} className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-semibold">{sku}</span>)}</div>
              <div className="flex flex-wrap gap-2"><Pill value={order.payment_status} /><Pill value={order.fulfillment_status} /></div>
              <div className="flex items-center justify-between gap-3"><span className="font-semibold">{money(order.total)}</span><Link href={`/admin/pedidos/${order.id}`} className="rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white">Ver detalle</Link></div>
            </article>)}</div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
              <span className="text-xs text-neutral-500">Página {pagination?.page ?? 1} de {pagination?.total_pages ?? 1}</span>
              <div className="flex gap-2"><button type="button" disabled={!pagination?.has_previous_page} onClick={() => setApplied((current) => ({ ...current, page: current.page - 1 }))} className="h-10 rounded-xl border border-neutral-200 px-4 text-sm disabled:opacity-40">Anterior</button><button type="button" disabled={!pagination?.has_next_page} onClick={() => setApplied((current) => ({ ...current, page: current.page + 1 }))} className="h-10 rounded-xl border border-neutral-200 px-4 text-sm disabled:opacity-40">Siguiente</button></div>
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
