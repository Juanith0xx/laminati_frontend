"use client";

import { useEffect, useState } from "react";

import {
  createAdminPriceList,
  updateAdminPriceList,
} from "@/services/adminPriceLists.service";

const EMPTY_FORM = {
  name: "",
  description: "",
  is_active: true,
  valid_from: "",
  valid_until: "",
};

export default function PriceListFormModal({
  open,
  mode = "create",
  priceList = null,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && priceList) {
      setForm({
        name: priceList.name || "",
        description: priceList.description || "",
        is_active: Boolean(priceList.is_active),
        valid_from: priceList.valid_from
          ? String(priceList.valid_from).slice(0, 10)
          : "",
        valid_until: priceList.valid_until
          ? String(priceList.valid_until).slice(0, 10)
          : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");
  }, [open, mode, priceList]);

  if (!open) return null;

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre de la lista es obligatorio.");
      return;
    }

    if (
      form.valid_from &&
      form.valid_until &&
      form.valid_until < form.valid_from
    ) {
      setError("La fecha de término no puede ser anterior a la fecha de inicio.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: Boolean(form.is_active),
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
    };

    try {
      setSaving(true);

      const response =
        mode === "edit" && priceList?.id
          ? await updateAdminPriceList(priceList.id, payload)
          : await createAdminPriceList(payload);

      await onSaved?.(response?.data || null);
      onClose?.();
    } catch (err) {
      setError(
        err?.message ||
          (mode === "edit"
            ? "No fue posible actualizar la lista."
            : "No fue posible crear la lista.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-5">
      <button
        type="button"
        aria-label="Cerrar formulario"
        className="absolute inset-0 cursor-default"
        onClick={saving ? undefined : onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-black/5 bg-[#f7f6f3] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/5 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Condiciones comerciales
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-black">
              {mode === "edit" ? "Editar lista" : "Nueva lista de precios"}
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

        <div className="space-y-5 p-6 sm:p-7">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-neutral-700">
              Nombre de la lista
            </span>
            <input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              maxLength={120}
              placeholder="Ej. COMODÍN, PREMIUM, ARQUITECTOS"
              className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-neutral-700">
              Descripción
            </span>
            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={3}
              placeholder="Describe a qué clientes o condiciones corresponde esta lista."
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-neutral-700">
                Vigencia desde
              </span>
              <input
                type="date"
                value={form.valid_from}
                onChange={(event) => setField("valid_from", event.target.value)}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-neutral-700">
                Vigencia hasta
              </span>
              <input
                type="date"
                value={form.valid_until}
                min={form.valid_from || undefined}
                onChange={(event) => setField("valid_until", event.target.value)}
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Lista activa</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Solo las listas activas podrán asignarse a usuarios.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setField("is_active", !form.is_active)}
              className={`relative inline-flex h-8 w-[54px] shrink-0 items-center rounded-full border transition ${
                form.is_active
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-neutral-300 bg-neutral-300"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  form.is_active ? "translate-x-[26px]" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-black/5 bg-white/95 px-6 py-5 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
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
                : "Crear lista"}
          </button>
        </footer>
      </form>
    </div>
  );
}
