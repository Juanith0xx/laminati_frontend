"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 cursor-default"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-[28px] border border-black/5 bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Confirmación
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-black">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {message}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-full px-5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
