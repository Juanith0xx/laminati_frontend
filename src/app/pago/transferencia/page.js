"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import {
  QRCodeSVG,
} from "qrcode.react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  apiRequest,
} from "@/services/api";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]);

/* =========================================
   PRECIO CLP
========================================= */
const formatPrice = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "$0";
  }

  return new Intl.NumberFormat(
    "es-CL",
    {
      style:
        "currency",
      currency:
        "CLP",
      maximumFractionDigits:
        0,
    }
  ).format(
    number
  );
};

/* =========================================
   FECHA
========================================= */
const formatDateTime = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(
    date
  );
};

/* =========================================
   DATETIME LOCAL
========================================= */
const toLocalDateTimeInput =
  (
    value =
      new Date()
  ) => {
    const date =
      value instanceof Date
        ? value
        : new Date(
            value
          );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const local =
      new Date(
        date.getTime() -
          date.getTimezoneOffset() *
            60000
      );

    return local
      .toISOString()
      .slice(
        0,
        16
      );
  };

/* =========================================
   ESTADO PAGO
========================================= */
const getPaymentStatusLabel =
  (
    status
  ) => {
    const value =
      String(
        status || ""
      )
        .trim()
        .toUpperCase();

    if (
      value ===
      "PENDING"
    ) {
      return "Pendiente de transferencia";
    }

    if (
      value ===
      "AWAITING_CONFIRMATION"
    ) {
      return "Comprobante en revisión";
    }

    if (
      value ===
      "PAID"
    ) {
      return "Pago confirmado";
    }

    if (
      value ===
      "REJECTED"
    ) {
      return "Comprobante rechazado";
    }

    return value ||
      "Pendiente";
  };

/* =========================================
   FILA DATO BANCARIO
========================================= */
function BankDataRow({
  label,
  value,
  onCopy,
  copied,
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-neutral-200 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          {
            label
          }
        </p>

        <p className="mt-1 break-all text-sm font-medium text-neutral-950">
          {
            value ||
            "—"
          }
        </p>
      </div>

      {value && (
        <button
          type="button"
          onClick={
            onCopy
          }
          className="w-fit rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black"
        >
          {copied
            ? "Copiado"
            : "Copiar"}
        </button>
      )}
    </div>
  );
}

/* =========================================
   PÁGINA
========================================= */
export default function TransferPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const orderId =
    searchParams.get(
      "order"
    );

  const tokenFromUrl =
    searchParams.get(
      "token"
    );

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    checkout,
    setCheckout,
  ] = useState(
    null
  );

  const [
    copiedField,
    setCopiedField,
  ] = useState(
    ""
  );

  const [
    showProofForm,
    setShowProofForm,
  ] = useState(
    false
  );

  const [
    proofFile,
    setProofFile,
  ] = useState(
    null
  );

  const [
    proofForm,
    setProofForm,
  ] = useState({
    submitted_amount:
      "",
    submitted_bank:
      "",
    submitted_reference:
      "",
    transfer_date:
      toLocalDateTimeInput(),
  });

  const [
    proofError,
    setProofError,
  ] = useState(
    ""
  );

  const [
    submittingProof,
    setSubmittingProof,
  ] = useState(
    false
  );

  const [
    proofSubmitted,
    setProofSubmitted,
  ] = useState(
    false
  );

  const storageKey =
    useMemo(
      () =>
        orderId
          ? `laminatiword_guest_order_${orderId}`
          : null,
      [
        orderId,
      ]
    );

  /* =========================================
     TOKEN
  ========================================= */
  const getGuestToken =
    useCallback(
      () => {
        let token =
          tokenFromUrl;

        if (
          typeof window ===
          "undefined"
        ) {
          return token;
        }

        if (
          token &&
          storageKey
        ) {
          sessionStorage.setItem(
            storageKey,
            token
          );
        }

        if (
          !token &&
          storageKey
        ) {
          token =
            sessionStorage.getItem(
              storageKey
            );
        }

        return token;
      },
      [
        storageKey,
        tokenFromUrl,
      ]
    );

  /* =========================================
     CARGAR PEDIDO
  ========================================= */
  const loadOrder =
    useCallback(
      async ({
        removeTokenFromUrl =
          false,
      } = {}) => {
        if (
          !orderId
        ) {
          throw new Error(
            "No se indicó el pedido que deseas consultar."
          );
        }

        const guestToken =
          getGuestToken();

        if (
          !guestToken
        ) {
          throw new Error(
            "No encontramos el acceso privado de este pedido. Vuelve al checkout o utiliza el enlace original del pedido."
          );
        }

        const response =
          await apiRequest(
            `/checkout/orders/${encodeURIComponent(
              orderId
            )}/guest`,
            {
              headers: {
                "X-Guest-Order-Token":
                  guestToken,
              },
            }
          );

        const data =
          response?.data ||
          null;

        setCheckout(
          data
        );

        if (
          data?.order?.total &&
          !proofForm
            .submitted_amount
        ) {
          setProofForm(
            (
              current
            ) => ({
              ...current,
              submitted_amount:
                String(
                  Number(
                    data
                      .order
                      .total
                  )
                ),
            })
          );
        }

        if (
          removeTokenFromUrl &&
          tokenFromUrl
        ) {
          router.replace(
            `/pago/transferencia?order=${encodeURIComponent(
              orderId
            )}`
          );
        }

        return data;
      },
      [
        getGuestToken,
        orderId,
        proofForm
          .submitted_amount,
        router,
        tokenFromUrl,
      ]
    );

  useEffect(
    () => {
      let active =
        true;

      const run =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            await loadOrder({
              removeTokenFromUrl:
                true,
            });
          } catch (
            requestError
          ) {
            if (!active) {
              return;
            }

            console.error(
              "Error cargando pedido invitado:",
              requestError
            );

            setError(
              requestError
                ?.message ||
                "No fue posible consultar el pedido."
            );
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      run();

      return () => {
        active =
          false;
      };
    },
    [
      loadOrder,
    ]
  );

  /* =========================================
     ACTUALIZACIÓN AUTOMÁTICA
     Mantiene sincronizado el estado del pago
     y del retiro sin recargar la página.
  ========================================= */
  useEffect(
    () => {
      if (
        !checkout ||
        !orderId ||
        typeof window ===
          "undefined"
      ) {
        return;
      }

      const currentPaymentStatus =
        String(
          checkout
            ?.payment
            ?.status ||
            ""
        )
          .trim()
          .toUpperCase();

      const currentPickupStatus =
        String(
          checkout
            ?.pickup
            ?.status ||
            ""
        )
          .trim()
          .toUpperCase();

      const pickupIsTerminal =
        [
          "USED",
          "REVOKED",
          "EXPIRED",
        ].includes(
          currentPickupStatus
        );

      const shouldRefresh =
        currentPaymentStatus ===
          "AWAITING_CONFIRMATION" ||
        (
          currentPaymentStatus ===
            "PAID" &&
          !pickupIsTerminal
        );

      if (!shouldRefresh) {
        return;
      }

      const intervalId =
        window.setInterval(
          () => {
            loadOrder().catch(
              (requestError) => {
                console.error(
                  "Error actualizando estado del pedido:",
                  requestError
                );
              }
            );
          },
          10000
        );

      return () => {
        window.clearInterval(
          intervalId
        );
      };
    },
    [
      checkout,
      loadOrder,
      orderId,
    ]
  );

  /* =========================================
     CAMBIOS FORM
  ========================================= */
  const handleProofChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      setProofForm(
        (
          current
        ) => ({
          ...current,
          [name]:
            value,
        })
      );

      setProofError(
        ""
      );
    };

  /* =========================================
     ARCHIVO
  ========================================= */
  const handleProofFile =
    (
      event
    ) => {
      const file =
        event
          .target
          .files?.[0] ||
        null;

      if (!file) {
        setProofFile(
          null
        );

        return;
      }

      if (
        !ALLOWED_FILE_TYPES.has(
          file.type
        )
      ) {
        setProofFile(
          null
        );

        setProofError(
          "El comprobante debe ser PDF, JPG, JPEG o PNG."
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setProofFile(
          null
        );

        setProofError(
          "El comprobante supera el máximo permitido de 10 MB."
        );

        event.target.value =
          "";

        return;
      }

      setProofFile(
        file
      );

      setProofError(
        ""
      );
    };

  /* =========================================
     ENVIAR COMPROBANTE
  ========================================= */
  const submitProof =
    async (
      event
    ) => {
      event.preventDefault();

      if (!proofFile) {
        setProofError(
          "Adjunta el comprobante de la transferencia."
        );

        return;
      }

      const amount =
        Number(
          proofForm
            .submitted_amount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        setProofError(
          "Ingresa un monto transferido válido."
        );

        return;
      }

      if (
        !proofForm
          .submitted_bank
          .trim()
      ) {
        setProofError(
          "Indica el banco desde el cual realizaste la transferencia."
        );

        return;
      }

      if (
        !proofForm
          .submitted_reference
          .trim()
      ) {
        setProofError(
          "Ingresa el número de operación o referencia de tu transferencia."
        );

        return;
      }

      if (
        !proofForm
          .transfer_date
      ) {
        setProofError(
          "Indica la fecha y hora de la transferencia."
        );

        return;
      }

      const transferDate =
        new Date(
          proofForm
            .transfer_date
        );

      if (
        Number.isNaN(
          transferDate
            .getTime()
        )
      ) {
        setProofError(
          "La fecha de transferencia no es válida."
        );

        return;
      }

      const guestToken =
        getGuestToken();

      if (
        !guestToken
      ) {
        setProofError(
          "No encontramos el acceso privado del pedido."
        );

        return;
      }

      try {
        setSubmittingProof(
          true
        );

        setProofError(
          ""
        );

        const formData =
          new FormData();

        formData.append(
          "proof_file",
          proofFile
        );

        formData.append(
          "submitted_amount",
          String(
            amount
          )
        );

        formData.append(
          "submitted_bank",
          proofForm
            .submitted_bank
            .trim()
        );

        formData.append(
          "submitted_reference",
          proofForm
            .submitted_reference
            .trim()
        );

        formData.append(
          "transfer_date",
          transferDate
            .toISOString()
        );

        await apiRequest(
          `/checkout/orders/${encodeURIComponent(
            orderId
          )}/guest/bank-transfer-proof`,
          {
            method:
              "POST",
            body:
              formData,
            headers: {
              "X-Guest-Order-Token":
                guestToken,
            },
          }
        );

        setProofSubmitted(
          true
        );

        setShowProofForm(
          false
        );

        setProofFile(
          null
        );

        await loadOrder();
      } catch (
        submitError
      ) {
        console.error(
          "Error enviando comprobante:",
          submitError
        );

        setProofError(
          submitError
            ?.message ||
            "No fue posible enviar el comprobante."
        );
      } finally {
        setSubmittingProof(
          false
        );
      }
    };

  /* =========================================
     COPIAR
  ========================================= */
  const copyValue =
    async (
      field,
      value
    ) => {
      if (
        !value ||
        typeof navigator ===
          "undefined" ||
        !navigator.clipboard
      ) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            String(value)
          );

        setCopiedField(
          field
        );

        window.setTimeout(
          () => {
            setCopiedField(
              ""
            );
          },
          1400
        );
      } catch {
        setCopiedField(
          ""
        );
      }
    };

  /* =========================================
     ESTADOS
  ========================================= */
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[650px] max-w-3xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

            <p className="mt-4 text-sm text-neutral-500">
              Cargando datos de transferencia...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !checkout
  ) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <section className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-center sm:p-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-red-500">
              Acceso al pedido
            </p>

            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
              No pudimos abrir este pedido
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-red-700">
              {
                error
              }
            </p>

            <Link
              href="/productos"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Volver a productos
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const order =
    checkout.order;

  const payment =
    checkout.payment;

  const bank =
    payment
      ?.bank_account ||
    {};

  const items =
    Array.isArray(
      checkout.items
    )
      ? checkout.items
      : [];

  const paymentStatus =
    String(
      payment?.status ||
      ""
    )
      .trim()
      .toUpperCase();

  const awaitingReview =
    paymentStatus ===
    "AWAITING_CONFIRMATION";

  const paid =
    paymentStatus ===
    "PAID";

  const rejected =
    paymentStatus ===
    "REJECTED";

  const pickup =
    checkout.pickup ||
    null;

  const pickupStatus =
    String(
      pickup?.status ||
      ""
    )
      .trim()
      .toUpperCase();

  const pickupLabel =
    pickupStatus ===
    "ACTIVE"
      ? "Listo para retiro"
      : pickupStatus ===
          "USED"
        ? "Pedido entregado"
        : pickupStatus ===
            "REVOKED"
          ? "Retiro revocado"
          : pickupStatus ===
              "EXPIRED"
            ? "QR vencido"
            : "Preparando pedido";

  const pickupQrValue =
    pickup
      ?.qr
      ?.value ||
    null;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1300px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <nav className="mb-8 flex items-center gap-2 text-xs text-neutral-400">
          <Link
            href="/"
            className="transition hover:text-black"
          >
            Inicio
          </Link>

          <span>/</span>

          <span className="text-neutral-700">
            Transferencia
          </span>
        </nav>

        <div className="mb-10 border-b border-neutral-200 pb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
            Pedido creado
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-5xl">
            {paid
              ? "Pago confirmado"
              : awaitingReview
                ? "Comprobante en revisión"
                : "Realiza tu transferencia"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-500">
            {paid
              ? "La transferencia ya fue validada por Laminati."
              : awaitingReview
                ? "Recibimos tu comprobante. El equipo de Laminati revisará la transferencia antes de confirmar el pago."
                : "Realiza la transferencia desde el banco que prefieras utilizando los datos de Laminati que aparecen a continuación."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-12">
          <div className="space-y-7">
            <section className="rounded-[1.75rem] border border-neutral-200 bg-[#fafafa] p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Pedido
                  </p>

                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                    {
                      order.order_number
                    }
                  </h2>

                  <p className="mt-2 text-xs text-neutral-400">
                    Creado{" "}
                    {formatDateTime(
                      order.created_at
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-black px-6 py-5 text-white sm:text-right">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
                    {paid
                      ? "Total pagado"
                      : "Total a transferir"}
                  </p>

                  <p className="mt-2 text-3xl font-medium tracking-[-0.04em]">
                    {formatPrice(
                      order.total
                    )}
                  </p>
                </div>
              </div>

              {!paid &&
                !awaitingReview && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Transfiere exactamente{" "}
                    {formatPrice(
                      order.total
                    )}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    En el comentario o referencia de tu
                    banco utiliza el número de pedido{" "}
                    <strong>
                      {
                        order.order_number
                      }
                    </strong>
                    .
                  </p>
                </div>
              )}
            </section>

            {!paid && (
              <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Cuenta de destino
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                  Datos para transferir
                </h2>

                <div className="mt-6">
                  <BankDataRow
                    label="Banco"
                    value={
                      bank.bank_name
                    }
                    copied={
                      copiedField ===
                      "bank"
                    }
                    onCopy={() =>
                      copyValue(
                        "bank",
                        bank.bank_name
                      )
                    }
                  />

                  <BankDataRow
                    label="Tipo de cuenta"
                    value={
                      bank.account_type
                    }
                    copied={
                      copiedField ===
                      "type"
                    }
                    onCopy={() =>
                      copyValue(
                        "type",
                        bank.account_type
                      )
                    }
                  />

                  <BankDataRow
                    label="Número de cuenta"
                    value={
                      bank.account_number
                    }
                    copied={
                      copiedField ===
                      "number"
                    }
                    onCopy={() =>
                      copyValue(
                        "number",
                        bank.account_number
                      )
                    }
                  />

                  <BankDataRow
                    label="Titular"
                    value={
                      bank.account_holder
                    }
                    copied={
                      copiedField ===
                      "holder"
                    }
                    onCopy={() =>
                      copyValue(
                        "holder",
                        bank.account_holder
                      )
                    }
                  />

                  <BankDataRow
                    label="RUT"
                    value={
                      bank.rut
                    }
                    copied={
                      copiedField ===
                      "rut"
                    }
                    onCopy={() =>
                      copyValue(
                        "rut",
                        bank.rut
                      )
                    }
                  />

                  <BankDataRow
                    label="Correo"
                    value={
                      bank.email
                    }
                    copied={
                      copiedField ===
                      "email"
                    }
                    onCopy={() =>
                      copyValue(
                        "email",
                        bank.email
                      )
                    }
                  />

                  <BankDataRow
                    label="Referencia"
                    value={
                      order.order_number
                    }
                    copied={
                      copiedField ===
                      "reference"
                    }
                    onCopy={() =>
                      copyValue(
                        "reference",
                        order.order_number
                      )
                    }
                  />
                </div>
              </section>
            )}

            {awaitingReview && (
              <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Comprobante recibido
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                  Pago pendiente de validación
                </h2>

                <p className="mt-3 text-sm leading-7 text-emerald-800">
                  Tu comprobante fue almacenado correctamente.
                  La transferencia todavía no se considera pagada:
                  un administrador de Laminati debe revisarla y aprobarla.
                </p>
              </section>
            )}

            {paid && (
              <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                  Pago confirmado
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                  Transferencia aprobada
                </h2>

                <p className="mt-3 text-sm leading-7 text-emerald-800">
                  Laminati confirmó la recepción de tu transferencia.
                  El pedido se encuentra pagado.
                </p>
              </section>
            )}

            {paid && !pickup && (
              <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                  Retiro en tienda
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                  Preparando tu QR de retiro
                </h2>

                <p className="mt-3 text-sm leading-7 text-amber-800">
                  El pago ya está confirmado. Estamos sincronizando el
                  código de retiro de tu pedido. Esta página se actualiza
                  automáticamente.
                </p>
              </section>
            )}

            {paid && pickup && (
              <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                      Retiro en tienda
                    </p>

                    <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                      Presenta este QR al retirar
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-neutral-500">
                      Guarda este código y preséntalo en Laminati.
                      El personal de tienda lo escaneará para validar
                      y registrar la entrega de tu pedido.
                    </p>

                    <div className={`mt-5 inline-flex rounded-full border px-4 py-2 text-xs font-medium ${
                      pickupStatus === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : pickupStatus === "USED"
                          ? "border-neutral-200 bg-neutral-100 text-neutral-600"
                          : pickupStatus === "REVOKED" ||
                              pickupStatus === "EXPIRED"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {pickupLabel}
                    </div>

                    {pickupStatus === "PENDING" && (
                      <p className="mt-4 text-xs leading-6 text-neutral-500">
                        Tu QR ya fue generado. El pedido todavía está
                        en preparación y sólo podrá entregarse cuando
                        Laminati lo marque como listo para retiro.
                      </p>
                    )}

                    {pickupStatus === "ACTIVE" && (
                      <p className="mt-4 text-xs leading-6 text-emerald-700">
                        Tu pedido está listo para retirar. Presenta este
                        QR al personal de Laminati.
                      </p>
                    )}

                    {pickupStatus === "USED" && (
                      <p className="mt-4 text-xs leading-6 text-neutral-500">
                        Este QR ya fue utilizado y la entrega del pedido
                        quedó registrada.
                      </p>
                    )}

                    {pickupStatus === "REVOKED" && (
                      <p className="mt-4 text-xs leading-6 text-red-700">
                        Este QR fue revocado. Contacta a Laminati antes
                        de dirigirte a retirar el pedido.
                      </p>
                    )}

                    {pickupStatus === "EXPIRED" && (
                      <p className="mt-4 text-xs leading-6 text-red-700">
                        Este QR venció. Contacta a Laminati para obtener
                        una nueva credencial de retiro.
                      </p>
                    )}
                  </div>

                  {pickupQrValue && (
                    <div className="mx-auto shrink-0 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm sm:mx-0">
                      <div className="flex h-[210px] w-[210px] items-center justify-center rounded-xl bg-white">
                        <QRCodeSVG
                          value={
                            pickupQrValue
                          }
                          size={190}
                          level="M"
                          includeMargin={
                            false
                          }
                          aria-label={`QR de retiro ${order.order_number}`}
                        />
                      </div>

                      <p className="mt-3 max-w-[210px] text-center text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                        {
                          order.order_number
                        }
                      </p>

                      <p className="mt-1 max-w-[210px] text-center text-[10px] leading-4 text-neutral-400">
                        Código de un solo uso
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {rejected && (
              <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-600">
                  Revisión de pago
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                  El comprobante fue rechazado
                </h2>

                <p className="mt-3 text-sm leading-7 text-red-700">
                  {payment
                    ?.rejection_reason ||
                    "Puedes revisar los datos y enviar un nuevo comprobante."}
                </p>
              </section>
            )}

            {!paid &&
              !awaitingReview && (
                <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Después de transferir
                  </p>

                  <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                    Envía tu comprobante
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-neutral-500">
                    Cuando hayas realizado la transferencia,
                    completa los datos y adjunta el comprobante.
                    El pago quedará en revisión hasta que Laminati
                    lo valide desde el backoffice.
                  </p>

                  {!showProofForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProofForm(
                          true
                        );
                        setProofSubmitted(
                          false
                        );
                        setProofError(
                          ""
                        );
                      }}
                      className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      {rejected
                        ? "Enviar nuevo comprobante"
                        : "Ya realicé la transferencia"}
                    </button>
                  ) : (
                    <form
                      onSubmit={
                        submitProof
                      }
                      className="mt-7 space-y-5"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                            Banco de origen
                          </span>

                          <input
                            type="text"
                            name="submitted_bank"
                            value={
                              proofForm.submitted_bank
                            }
                            onChange={
                              handleProofChange
                            }
                            placeholder="Ej. Banco de Chile"
                            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                            Monto transferido
                          </span>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            name="submitted_amount"
                            value={
                              proofForm.submitted_amount
                            }
                            onChange={
                              handleProofChange
                            }
                            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                          />
                        </label>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                            N° operación / referencia
                          </span>

                          <input
                            type="text"
                            name="submitted_reference"
                            value={
                              proofForm.submitted_reference
                            }
                            onChange={
                              handleProofChange
                            }
                            placeholder="Ej. 123456789"
                            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                            Fecha y hora
                          </span>

                          <input
                            type="datetime-local"
                            name="transfer_date"
                            value={
                              proofForm.transfer_date
                            }
                            onChange={
                              handleProofChange
                            }
                            className="mt-2 min-h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                          />
                        </label>
                      </div>

                      <label className="block rounded-2xl border border-dashed border-neutral-300 bg-[#fafafa] p-5">
                        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                          Comprobante
                        </span>

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={
                            handleProofFile
                          }
                          className="mt-3 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2.5 file:text-xs file:font-medium file:text-white"
                        />

                        <p className="mt-3 text-xs leading-5 text-neutral-400">
                          PDF, JPG, JPEG o PNG. Máximo 10 MB.
                        </p>

                        {proofFile && (
                          <p className="mt-3 text-xs font-medium text-neutral-700">
                            {proofFile.name} ·{" "}
                            {(
                              proofFile.size /
                              1024 /
                              1024
                            ).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        )}
                      </label>

                      {proofError && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                          {
                            proofError
                          }
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProofForm(
                              false
                            );
                            setProofError(
                              ""
                            );
                          }}
                          disabled={
                            submittingProof
                          }
                          className="min-h-12 flex-1 rounded-full border border-neutral-200 bg-white px-6 text-sm font-medium text-neutral-700 transition hover:border-black disabled:opacity-50"
                        >
                          Volver
                        </button>

                        <button
                          type="submit"
                          disabled={
                            submittingProof
                          }
                          className="min-h-12 flex-1 rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
                        >
                          {submittingProof
                            ? "Enviando..."
                            : "Enviar comprobante"}
                        </button>
                      </div>
                    </form>
                  )}

                  {proofSubmitted &&
                    !awaitingReview && (
                      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                        Comprobante enviado correctamente.
                      </div>
                    )}
                </section>
              )}
          </div>

          <aside className="lg:self-start">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-[#fafafa] p-6 shadow-sm sm:p-8 lg:sticky lg:top-28">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Resumen
              </p>

              <h2 className="mt-3 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                {
                  items.length
                }{" "}
                {items.length ===
                1
                  ? "producto"
                  : "productos"}
              </h2>

              <div className="mt-6 space-y-5">
                {items.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className="border-b border-neutral-200 pb-5 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-medium text-neutral-950">
                        {
                          item.product_name
                        }
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-4">
                        <p className="text-xs text-neutral-400">
                          {Number(
                            item.quantity
                          )}{" "}
                          ×{" "}
                          {formatPrice(
                            item.unit_price
                          )}
                        </p>

                        <p className="text-sm font-medium text-neutral-950">
                          {formatPrice(
                            item.line_total
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <dl className="mt-7 space-y-4 border-t border-neutral-200 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-neutral-500">
                    Subtotal
                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">
                    {formatPrice(
                      order.subtotal
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-neutral-500">
                    Entrega
                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">
                    Retiro en tienda
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex items-end justify-between gap-4 border-t border-neutral-200 pt-6">
                <div>
                  <p className="text-sm font-medium text-neutral-950">
                    Total
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-400">
                    IVA incluido
                  </p>
                </div>

                <p className="text-2xl font-medium tracking-[-0.04em] text-neutral-950">
                  {formatPrice(
                    order.total
                  )}
                </p>
              </div>

              <div className={`mt-6 rounded-2xl border p-4 ${
                paid
                  ? "border-emerald-200 bg-emerald-50"
                  : awaitingReview
                    ? "border-amber-200 bg-amber-50"
                    : rejected
                      ? "border-red-200 bg-red-50"
                      : "border-neutral-200 bg-white"
              }`}>
                <p className="text-xs font-medium text-neutral-950">
                  Estado del pago
                </p>

                <p className="mt-1 text-xs text-neutral-600">
                  {getPaymentStatusLabel(
                    payment.status
                  )}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
