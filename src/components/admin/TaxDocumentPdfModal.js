"use client";

export default function TaxDocumentPdfModal({
  preview,
  url,
  onClose,
}) {
  if (!preview || !url) {
    return null;
  }

  const documentType =
    String(
      preview.documentType ||
        ""
    )
      .trim()
      .toUpperCase();

  const isFactura =
    documentType ===
    "FACTURA";

  const normalizedStatus =
    String(
      preview.status ||
        ""
    )
      .trim()
      .toUpperCase();

  const statusLabel =
    normalizedStatus ===
      "ACCEPTED" ||
    String(
      preview.siiStatus ||
        ""
    )
      .trim()
      .toLowerCase() ===
      "aceptado"
      ? "Aceptada"
      : "Emitida";

  const filename = `${
    isFactura
      ? "factura"
      : "boleta"
  }-${
    preview.folio ||
    preview.orderNumber ||
    "laminati"
  }.pdf`;

  return (
    <div className="fixed inset-0 z-[160] bg-black/55 p-2 backdrop-blur-sm sm:p-4 lg:p-6">
      <div className="mx-auto flex h-full max-w-[1450px] flex-col overflow-hidden rounded-[1.75rem] bg-[#f5f4f1] shadow-2xl sm:rounded-[2rem]">
        <div className="shrink-0 border-b border-black/5 bg-white px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Laminati · Documento tributario
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-3xl">
                  {isFactura
                    ? "Factura electrónica"
                    : "Boleta electrónica"}
                </h2>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                  {statusLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
                {preview.folio ? (
                  <span>
                    Folio{" "}
                    <strong className="font-semibold text-neutral-800">
                      N.º {preview.folio}
                    </strong>
                  </span>
                ) : null}

                {preview.orderNumber ? (
                  <span>
                    Pedido{" "}
                    <strong className="font-semibold text-neutral-800">
                      {preview.orderNumber}
                    </strong>
                  </span>
                ) : null}

                {preview.siiStatus ? (
                  <span>
                    SII{" "}
                    <strong className="font-semibold text-neutral-800">
                      {preview.siiStatus}
                    </strong>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={url}
                download={filename}
                className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black"
              >
                Descargar PDF
              </a>

              <button
                type="button"
                onClick={onClose}
                className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3 sm:p-4 lg:p-5">
          <div className="h-full overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-sm">
            <iframe
              src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              title={`${
                isFactura
                  ? "Factura"
                  : "Boleta"
              } ${
                preview.folio ||
                ""
              }`}
              className="h-full min-h-[520px] w-full border-0 bg-neutral-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
