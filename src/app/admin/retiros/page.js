"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  apiRequest,
} from "@/services/api";

/* =========================================
   HELPERS
========================================= */
function normalizeStatus(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toUpperCase();
}


function getStoredToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const raw =
    localStorage.getItem(
      "token"
    );

  if (
    !raw ||
    raw ===
      "null" ||
    raw ===
      "undefined"
  ) {
    return null;
  }

  return raw
    .replace(
      /^"|"$/g,
      ""
    )
    .replace(
      /^Bearer\s+/i,
      ""
    )
    .trim();
}

function requireAdminToken(
  router
) {
  const token =
    getStoredToken();

  if (!token) {
    router.replace(
      "/login"
    );

    return null;
  }

  return token;
}

function formatPrice(
  value
) {
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
}

function getPickupLabel(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  if (
    normalized ===
    "ACTIVE"
  ) {
    return {
      label:
        "Listo para retiro",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    normalized ===
    "USED"
  ) {
    return {
      label:
        "Entregado",
      className:
        "border-neutral-200 bg-neutral-100 text-neutral-600",
    };
  }

  if (
    normalized ===
    "REVOKED"
  ) {
    return {
      label:
        "Revocado",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (
    normalized ===
    "EXPIRED"
  ) {
    return {
      label:
        "Vencido",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label:
      "Preparando pedido",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function getFulfillmentLabel(
  status
) {
  const normalized =
    normalizeStatus(
      status
    );

  const labels = {
    PENDING:
      "Pendiente",
    PREPARING:
      "Preparando",
    READY_FOR_PICKUP:
      "Listo para retiro",
    DELIVERED:
      "Entregado",
    CANCELLED:
      "Cancelado",
  };

  return (
    labels[
      normalized
    ] ||
    normalized ||
    "—"
  );
}

/* =========================================
   PAGE
========================================= */
export default function AdminRetirosPage() {
  const router =
    useRouter();

  const videoRef =
    useRef(null);

  const scannerControlsRef =
    useRef(null);

  const scannerLockRef =
    useRef(false);

  const [
    authLoading,
    setAuthLoading,
  ] =
    useState(true);

  const [
    currentRole,
    setCurrentRole,
  ] =
    useState("");

  const isAdmin =
    normalizeStatus(
      currentRole
    ) === "ADMIN";

  const isSeller =
    normalizeStatus(
      currentRole
    ) === "VENDEDOR";

  const canOperatePickup =
    isAdmin ||
    isSeller;

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    orders,
    setOrders,
  ] =
    useState([]);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] =
    useState("");

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "ORDERS"
    );

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const [
    pageMessage,
    setPageMessage,
  ] =
    useState("");

  const [
    activatingOrderId,
    setActivatingOrderId,
  ] =
    useState(null);

  const [
    scannerActive,
    setScannerActive,
  ] =
    useState(false);

  const [
    scannerStarting,
    setScannerStarting,
  ] =
    useState(false);

  const [
    scannerError,
    setScannerError,
  ] =
    useState("");

  const [
    detectedToken,
    setDetectedToken,
  ] =
    useState("");

  const [
    manualToken,
    setManualToken,
  ] =
    useState("");

  const [
    confirmingDelivery,
    setConfirmingDelivery,
  ] =
    useState(false);

  const [
    deliveryResult,
    setDeliveryResult,
  ] =
    useState(null);

  /* =========================================
     AUTH ADMIN
  ========================================= */
  useEffect(
    () => {
      let active =
        true;

      const validate =
        async () => {
          try {
            const token =
              requireAdminToken(
                router
              );

            if (!token) {
              return;
            }

            const response =
              await apiRequest(
                "/auth/me",
                {
                  token,
                }
              );

            const role =
              normalizeStatus(
                response
                  ?.user
                  ?.role
              );

            if (
              !response
                ?.success ||
              ![
                "ADMIN",
                "VENDEDOR",
              ].includes(
                role
              )
            ) {
              throw new Error(
                "Acceso al módulo de retiros requerido"
              );
            }

            if (
              active
            ) {
              setCurrentRole(
                role
              );
            }
          } catch {
            if (
              typeof window !==
              "undefined"
            ) {
              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );
            }

            router.replace(
              "/login"
            );
          } finally {
            if (
              active
            ) {
              setAuthLoading(
                false
              );
            }
          }
        };

      validate();

      return () => {
        active =
          false;
      };
    },
    [
      router,
    ]
  );

  /* =========================================
     DETENER CÁMARA
  ========================================= */
  const stopScanner =
    useCallback(
      () => {
        try {
          scannerControlsRef
            .current
            ?.stop?.();
        } catch {
          // La cámara puede haberse detenido antes.
        }

        scannerControlsRef.current =
          null;

        scannerLockRef.current =
          false;

        setScannerActive(
          false
        );

        if (
          videoRef.current
            ?.srcObject
        ) {
          try {
            const tracks =
              videoRef.current
                .srcObject
                .getTracks?.() ||
              [];

            tracks.forEach(
              (
                track
              ) =>
                track.stop()
            );
          } catch {
            // Sin acción.
          }

          videoRef.current.srcObject =
            null;
        }
      },
      []
    );

  useEffect(
    () => {
      return () => {
        stopScanner();
      };
    },
    [
      stopScanner,
    ]
  );

  /* =========================================
     CARGAR PEDIDOS APROBADOS + PICKUP
  ========================================= */
  const loadOrders =
    useCallback(
      async () => {
        if (
          authLoading
        ) {
          return;
        }

        try {
          setLoading(
            true
          );

          setPageError(
            ""
          );

          const token =
            requireAdminToken(
              router
            );

          if (!token) {
            return;
          }

          const response =
            await apiRequest(
              "/payments/admin/bank-transfer-proofs?status=APPROVED&limit=100&offset=0",
              {
                token,
              }
            );

          const proofs =
            Array.isArray(
              response
                ?.data
                ?.proofs
            )
              ? response
                  .data
                  .proofs
              : [];

          const unique =
            new Map();

          proofs.forEach(
            (
              proof
            ) => {
              if (
                !proof
                  ?.order_id
              ) {
                return;
              }

              if (
                normalizeStatus(
                  proof
                    .payment_status
                ) !==
                "PAID"
              ) {
                return;
              }

              if (
                !unique.has(
                  proof
                    .order_id
                )
              ) {
                unique.set(
                  proof
                    .order_id,
                  proof
                );
              }
            }
          );

          const enriched =
            await Promise.all(
              Array.from(
                unique.values()
              ).map(
                async (
                  proof
                ) => {
                  try {
                    const pickupResponse =
                      await apiRequest(
                        `/pickups/orders/${encodeURIComponent(
                          proof
                            .order_id
                        )}`,
                        {
                          token,
                        }
                      );

                    return {
                      ...proof,

                      pickup_data:
                        pickupResponse
                          ?.data ||
                        null,
                    };
                  } catch (
                    error
                  ) {
                    return {
                      ...proof,

                      pickup_data:
                        null,

                      pickup_error:
                        error
                          ?.message ||
                        "No fue posible cargar el retiro.",
                    };
                  }
                }
              )
            );

          enriched.sort(
            (
              a,
              b
            ) => {
              const aDelivered =
                normalizeStatus(
                  a
                    ?.pickup_data
                    ?.order
                    ?.fulfillment_status
                ) ===
                "DELIVERED";

              const bDelivered =
                normalizeStatus(
                  b
                    ?.pickup_data
                    ?.order
                    ?.fulfillment_status
                ) ===
                "DELIVERED";

              if (
                aDelivered !==
                bDelivered
              ) {
                return aDelivered
                  ? 1
                  : -1;
              }

              return String(
                b
                  .order_number ||
                ""
              ).localeCompare(
                String(
                  a
                    .order_number ||
                  ""
                )
              );
            }
          );

          setOrders(
            enriched
          );

          setSelectedOrderId(
            (
              current
            ) => {
              if (
                current &&
                enriched.some(
                  (
                    item
                  ) =>
                    item
                      .order_id ===
                    current
                )
              ) {
                return current;
              }

              const firstOpen =
                enriched.find(
                  (
                    item
                  ) =>
                    normalizeStatus(
                      item
                        ?.pickup_data
                        ?.order
                        ?.fulfillment_status
                    ) !==
                    "DELIVERED"
                );

              return (
                firstOpen
                  ?.order_id ||
                enriched[0]
                  ?.order_id ||
                ""
              );
            }
          );
        } catch (
          error
        ) {
          if (
            error?.status ===
              401 ||
            error?.status ===
              403
          ) {
            router.replace(
              "/login"
            );

            return;
          }

          setPageError(
            error?.message ||
              "No fue posible cargar los retiros."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        authLoading,
        router,
      ]
    );

  useEffect(
    () => {
      loadOrders();
    },
    [
      loadOrders,
    ]
  );

  const selectedOrder =
    useMemo(
      () =>
        orders.find(
          (
            item
          ) =>
            item
              .order_id ===
            selectedOrderId
        ) ||
        null,
      [
        orders,
        selectedOrderId,
      ]
    );

  const selectedPickup =
    selectedOrder
      ?.pickup_data
      ?.pickup ||
    null;

  const selectedPickupStatus =
    normalizeStatus(
      selectedPickup
        ?.status
    );

  const selectedFulfillmentStatus =
    normalizeStatus(
      selectedOrder
        ?.pickup_data
        ?.order
        ?.fulfillment_status
    );

  const selectedQrValue =
    selectedPickup
      ?.qr
      ?.value ||
    selectedPickup
      ?.qr
      ?.token ||
    null;

  /* =========================================
     MARCAR LISTO PARA RETIRO
  ========================================= */
  const activatePickup =
    async (
      orderId
    ) => {
      if (!canOperatePickup) {
        setPageError(
          "No tienes permisos para marcar este pedido como listo para retiro."
        );
        return;
      }

      try {
        setActivatingOrderId(
          orderId
        );

        setPageError(
          ""
        );

        setPageMessage(
          ""
        );

        const token =
          requireAdminToken(
            router
          );

        if (!token) {
          return;
        }

        const response =
          await apiRequest(
            `/pickups/admin/orders/${encodeURIComponent(
              orderId
            )}/activate`,
            {
              method:
                "POST",
              token,
            }
          );

        setPageMessage(
          response?.message ||
            "Pedido marcado como listo para retiro."
        );

        await loadOrders();
      } catch (
        error
      ) {
        setPageError(
          error?.message ||
            "No fue posible activar el retiro."
        );
      } finally {
        setActivatingOrderId(
          null
        );
      }
    };

  /* =========================================
     INICIAR LECTOR QR
  ========================================= */
  const startScanner =
    async () => {
      try {
        stopScanner();

        setScannerStarting(
          true
        );

        setScannerError(
          ""
        );

        setDetectedToken(
          ""
        );

        setDeliveryResult(
          null
        );

        scannerLockRef.current =
          false;

        const {
          BrowserQRCodeReader,
        } =
          await import(
            "@zxing/browser"
          );

        const reader =
          new BrowserQRCodeReader();

        const controls =
          await reader
            .decodeFromConstraints(
              {
                audio:
                  false,

                video: {
                  facingMode: {
                    ideal:
                      "environment",
                  },
                },
              },
              videoRef.current,
              (
                result
              ) => {
                if (
                  !result ||
                  scannerLockRef
                    .current
                ) {
                  return;
                }

                const text =
                  String(
                    result
                      .getText?.() ||
                    ""
                  ).trim();

                if (!text) {
                  return;
                }

                scannerLockRef.current =
                  true;

                setDetectedToken(
                  text
                );

                setManualToken(
                  text
                );

                stopScanner();
              }
            );

        scannerControlsRef.current =
          controls;

        setScannerActive(
          true
        );
      } catch (
        error
      ) {
        stopScanner();

        setScannerError(
          error?.message ||
            "No fue posible acceder a la cámara. Revisa los permisos del navegador."
        );
      } finally {
        setScannerStarting(
          false
        );
      }
    };

  /* =========================================
     CONFIRMAR ENTREGA

     El escaneo por cámara NO consume el QR.
     Sólo este botón llama POST /pickups/scan.
  ========================================= */
  const confirmDelivery =
    async () => {
      const token =
        String(
          detectedToken ||
          manualToken ||
          ""
        ).trim();

      if (!token) {
        setScannerError(
          "Escanea un QR o ingresa el código manualmente."
        );

        return;
      }

      try {
        setConfirmingDelivery(
          true
        );

        setScannerError(
          ""
        );

        setPageMessage(
          ""
        );

        const authToken =
          requireAdminToken(
            router
          );

        if (!authToken) {
          return;
        }

        const response =
          await apiRequest(
            "/pickups/scan",
            {
              method:
                "POST",

              token:
                authToken,

              body: {
                token,
              },
            }
          );

        setDeliveryResult(
          response
            ?.data ||
          null
        );

        setPageMessage(
          response?.message ||
            "Retiro confirmado correctamente."
        );

        setDetectedToken(
          ""
        );

        setManualToken(
          ""
        );

        stopScanner();

        await loadOrders();
      } catch (
        error
      ) {
        setScannerError(
          error?.message ||
            "No fue posible confirmar la entrega."
        );
      } finally {
        setConfirmingDelivery(
          false
        );
      }
    };

  /* =========================================
     LOGOUT
  ========================================= */
  const handleLogout =
    () => {
      stopScanner();

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      router.replace(
        "/login"
      );
    };

  if (
    authLoading
  ) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-20 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              Validando acceso al módulo de retiros...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-7">
        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Backoffice Laminati
              </p>

              <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                Retiros y lector QR
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
                Prepara los pedidos, visualiza el QR asociado a la compra
                y valida la entrega con la cámara del equipo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
                >
                  Carga de imágenes
                </Link>
              ) : null}

              <Link
                href="/admin/pagos"
                className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
              >
                Pagos
              </Link>

              <Link
                href="/"
                className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
              >
                Ver tienda
              </Link>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="flex h-11 items-center justify-center rounded-full bg-black px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </section>

        {(pageError ||
          pageMessage) && (
          <section
            className={`rounded-2xl border px-5 py-4 text-sm ${
              pageError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {
              pageError ||
              pageMessage
            }
          </section>
        )}

        <section className="rounded-[2rem] border border-black/5 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                stopScanner();
                setActiveTab(
                  "ORDERS"
                );
              }}
              className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                activeTab ===
                "ORDERS"
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white text-neutral-700"
              }`}
            >
              Pedidos y QR
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab(
                  "SCANNER"
                );
              }}
              className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                activeTab ===
                "SCANNER"
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white text-neutral-700"
              }`}
            >
              Lector QR
            </button>

            <button
              type="button"
              onClick={
                loadOrders
              }
              className="ml-auto rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Actualizar
            </button>
          </div>
        </section>

        {activeTab ===
        "ORDERS" ? (
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Pedidos pagados
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {
                    orders.length
                  }{" "}
                  pedidos disponibles
                </p>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-sm text-neutral-400">
                  Cargando pedidos...
                </div>
              ) : orders.length ===
                0 ? (
                <div className="px-6 py-16 text-center text-sm text-neutral-400">
                  No hay pedidos pagados para mostrar.
                </div>
              ) : (
                <div className="max-h-[680px] overflow-y-auto p-3">
                  {orders.map(
                    (
                      item
                    ) => {
                      const pickup =
                        item
                          ?.pickup_data
                          ?.pickup;

                      const order =
                        item
                          ?.pickup_data
                          ?.order;

                      const pickupStyle =
                        getPickupLabel(
                          pickup
                            ?.status
                        );

                      const selected =
                        item
                          .order_id ===
                        selectedOrderId;

                      return (
                        <button
                          key={
                            item.order_id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedOrderId(
                              item.order_id
                            )
                          }
                          className={`mb-2 w-full rounded-[1.4rem] border p-5 text-left transition ${
                            selected
                              ? "border-black bg-black text-white"
                              : "border-neutral-100 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                selected
                                  ? "text-white/45"
                                  : "text-neutral-400"
                              }`}>
                                Pedido
                              </p>

                              <p className="mt-1 text-lg font-medium">
                                {
                                  item.order_number
                                }
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
                                selected
                                  ? "border-white/20 bg-white/10 text-white"
                                  : pickupStyle.className
                              }`}
                            >
                              {
                                pickupStyle.label
                              }
                            </span>
                          </div>

                          <div className={`mt-4 flex items-center justify-between border-t pt-4 text-xs ${
                            selected
                              ? "border-white/10 text-white/65"
                              : "border-neutral-100 text-neutral-500"
                          }`}>
                            <span>
                              {getFulfillmentLabel(
                                order
                                  ?.fulfillment_status
                              )}
                            </span>

                            <span className="font-medium">
                              {formatPrice(
                                item
                                  .order_total
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
              {!selectedOrder ? (
                <div className="flex min-h-[420px] items-center justify-center text-center">
                  <p className="text-sm text-neutral-400">
                    Selecciona un pedido para ver su retiro.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        Compra
                      </p>

                      <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neutral-950">
                        {
                          selectedOrder
                            .order_number
                        }
                      </h2>

                      <p className="mt-2 text-sm text-neutral-500">
                        {
                          selectedOrder
                            .customer_name ||
                          "Cliente"
                        }
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {
                          selectedOrder
                            .email ||
                          ""
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black px-5 py-4 text-white">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
                        Total
                      </p>

                      <p className="mt-1 text-2xl font-medium">
                        {formatPrice(
                          selectedOrder
                            .order_total
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            Pago
                          </p>

                          <p className="mt-2 text-lg font-medium text-emerald-700">
                            {
                              selectedOrder
                                .payment_status
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            Retiro
                          </p>

                          <p className="mt-2 text-lg font-medium text-neutral-950">
                            {getFulfillmentLabel(
                              selectedFulfillmentStatus
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedOrder
                        .pickup_error && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          {
                            selectedOrder
                              .pickup_error
                          }
                        </div>
                      )}

                      {selectedPickup &&
                        selectedPickupStatus ===
                          "PENDING" && (
                          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                            <p className="text-sm font-medium text-amber-900">
                              El QR ya existe, pero el pedido todavía no está habilitado para entrega.
                            </p>

                            <p className="mt-2 text-xs leading-6 text-amber-700">
                              Cuando el producto esté físicamente preparado, marca el pedido como listo para retiro.
                            </p>

                            {canOperatePickup ? (
                              <button
                                type="button"
                                disabled={
                                  activatingOrderId ===
                                  selectedOrder
                                    .order_id
                                }
                                onClick={() =>
                                  activatePickup(
                                    selectedOrder
                                      .order_id
                                  )
                                }
                                className="mt-4 h-11 rounded-full bg-black px-6 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {activatingOrderId ===
                                selectedOrder
                                  .order_id
                                  ? "Activando..."
                                  : "Marcar listo para retiro"}
                              </button>
                            ) : null}
                          </div>
                        )}

                      {selectedPickupStatus ===
                        "ACTIVE" && (
                        <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                          <p className="text-sm font-medium text-emerald-900">
                            Pedido listo para retiro.
                          </p>

                          <p className="mt-2 text-xs leading-6 text-emerald-700">
                            El cliente puede presentar el QR. Abre la pestaña Lector QR para validar la entrega.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab(
                                "SCANNER"
                              )
                            }
                            className="mt-4 h-11 rounded-full bg-black px-6 text-xs font-medium text-white transition hover:bg-neutral-800"
                          >
                            Abrir lector QR
                          </button>
                        </div>
                      )}

                      {selectedPickupStatus ===
                        "USED" && (
                        <div className="mt-6 rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-5">
                          <p className="text-sm font-medium text-neutral-800">
                            Este pedido ya fue entregado.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mx-auto">
                      {selectedQrValue ? (
                        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
                          <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            QR de la compra
                          </p>

                          <div className="flex h-[230px] w-[230px] items-center justify-center bg-white">
                            <QRCodeSVG
                              value={
                                selectedQrValue
                              }
                              size={
                                210
                              }
                              level="M"
                              includeMargin={
                                false
                              }
                            />
                          </div>

                          <p className="mt-4 max-w-[230px] text-center text-xs font-medium text-neutral-700">
                            {
                              selectedOrder
                                .order_number
                            }
                          </p>

                          <p className="mt-1 max-w-[230px] text-center text-[10px] text-neutral-400">
                            {
                              getPickupLabel(
                                selectedPickupStatus
                              ).label
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="flex h-[280px] w-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                          <div>
                            <p className="text-xs leading-6 text-neutral-500">
                              {isSeller &&
                              selectedPickupStatus ===
                                "ACTIVE"
                                ? "Solicita al cliente su QR y utiliza la pestaña Lector QR para confirmar la entrega."
                                : "Este pedido todavía no tiene un QR disponible."}
                            </p>

                            {isSeller &&
                            selectedPickupStatus ===
                              "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveTab(
                                    "SCANNER"
                                  )
                                }
                                className="mt-4 rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800"
                              >
                                Abrir lector QR
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-black p-5 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Cámara
                  </p>

                  <h2 className="mt-2 text-2xl font-medium text-white">
                    Lector QR
                  </h2>
                </div>

                {scannerActive ? (
                  <button
                    type="button"
                    onClick={
                      stopScanner
                    }
                    className="rounded-full border border-white/15 px-5 py-3 text-xs font-medium text-white transition hover:bg-white/10"
                  >
                    Detener cámara
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      scannerStarting
                    }
                    onClick={
                      startScanner
                    }
                    className="rounded-full bg-white px-5 py-3 text-xs font-medium text-black transition hover:bg-neutral-100 disabled:opacity-50"
                  >
                    {scannerStarting
                      ? "Iniciando..."
                      : "Activar cámara"}
                  </button>
                )}
              </div>

              <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
                <video
                  ref={
                    videoRef
                  }
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />

                {!scannerActive &&
                  !scannerStarting && (
                    <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                      <div>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="h-8 w-8 text-white/60"
                            aria-hidden="true"
                          >
                            <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
                            <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" />
                          </svg>
                        </div>

                        <p className="mt-4 text-sm text-white/60">
                          Activa la cámara y apunta al QR del cliente.
                        </p>
                      </div>
                    </div>
                  )}

                {scannerActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[58%] w-[58%] rounded-3xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs leading-6 text-white/45">
                La cámara sólo detecta el código. La entrega no se registra hasta presionar
                <span className="font-medium text-white/70">
                  {" "}
                  Confirmar entrega
                </span>
                .
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Validación
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neutral-950">
                Confirmar entrega
              </h2>

              {scannerError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {
                    scannerError
                  }
                </div>
              )}

              {deliveryResult ? (
                <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Entrega registrada
                  </p>

                  <p className="mt-2 text-xl font-medium text-emerald-950">
                    {
                      deliveryResult
                        ?.order
                        ?.order_number ||
                      "Pedido entregado"
                    }
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/70 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-700/70">
                        Orden
                      </p>

                      <p className="mt-1 font-medium text-emerald-950">
                        {
                          deliveryResult
                            ?.order
                            ?.status ||
                          "COMPLETED"
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/70 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-700/70">
                        Retiro
                      </p>

                      <p className="mt-1 font-medium text-emerald-950">
                        {
                          deliveryResult
                            ?.order
                            ?.fulfillment_status ||
                          "DELIVERED"
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryResult(
                        null
                      );
                      setScannerError(
                        ""
                      );
                    }}
                    className="mt-5 h-11 rounded-full border border-emerald-300 bg-white px-6 text-xs font-medium text-emerald-800"
                  >
                    Escanear otro pedido
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-6">
                    <label
                      htmlFor="pickup-token"
                      className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Código detectado
                    </label>

                    <textarea
                      id="pickup-token"
                      value={
                        manualToken
                      }
                      onChange={(
                        event
                      ) => {
                        setManualToken(
                          event
                            .target
                            .value
                        );

                        setDetectedToken(
                          ""
                        );
                      }}
                      placeholder="Escanea el QR o pega aquí el código de retiro"
                      rows={5}
                      className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 font-mono text-xs leading-6 text-neutral-700 outline-none transition focus:border-black"
                    />
                  </div>

                  {(detectedToken ||
                    manualToken) && (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-xs font-medium text-neutral-800">
                        QR detectado
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-neutral-400">
                        Verifica que el cliente esté retirando físicamente el pedido antes de confirmar.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={
                      confirmingDelivery ||
                      !String(
                        detectedToken ||
                        manualToken ||
                        ""
                      ).trim()
                    }
                    onClick={
                      confirmDelivery
                    }
                    className="mt-6 h-12 w-full rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {confirmingDelivery
                      ? "Confirmando entrega..."
                      : "Confirmar entrega"}
                  </button>

                  <p className="mt-4 text-center text-[11px] leading-5 text-neutral-400">
                    Al confirmar, el QR queda utilizado y la orden pasa a entregada.
                  </p>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
