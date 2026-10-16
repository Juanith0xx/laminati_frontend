"use client";

import {

  useEffect,

  useMemo,

  useState,

} from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {

  apiRequest,

} from "@/services/api";

import {

  useCartStore,

} from "@/store/cartStore";

/* =========================================*

*   FORMATEAR PRECIO CLP*

*========================================= */

const formatPrice = (value) => {

  const number = Number(value);

  if (!Number.isFinite(number)) {

    return "$0";

  }

  return new Intl.NumberFormat(

    "es-CL",

    {

      style: "currency",

      currency: "CLP",

      maximumFractionDigits: 0,

    }

  ).format(number);

};

/* =========================================*

*   INPUT BASE*

*========================================= */

const inputClass =

  "h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-300 focus:border-neutral-950";

const labelClass =

  "mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400";

/* =========================================*

*   NORMALIZAR TEXTO*

*========================================= */

const cleanText = (value) =>

  String(

    value ?? ""

  ).trim();

/* =========================================*

*   EMAIL*

*========================================= */

const isValidEmail = (value) =>

  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(

    cleanText(value)

  );

/* =========================================*

*   CLAVE PRODUCTO*

*========================================= */

const getItemKey = (item) =>

  item?.product_id ||

  item?.id ||

  item?.slug ||

  item?.sku;

/* =========================================*

*   NOMBRE PRODUCTO*

*========================================= */

const getDisplayName = (item) => {

  const name = cleanText(

    item?.name

  );

  if (!name) {

    return "Producto";

  }

  return name

    .split("|")[0]

    .trim();

};


const getFinalUnitPrice = (item) => {

  const value = Number(
    item?.price
  );

  return Number.isFinite(value)
    ? value
    : 0;

};

const getBaseUnitPrice = (item) => {

  const base = Number(
    item?.base_price
  );

  const finalPrice =
    getFinalUnitPrice(item);

  return (
    Number.isFinite(base) &&
    base > 0
  )
    ? base
    : finalPrice;

};

const isCustomerExclusivePrice = (item) =>

  item?.customer_price === true ||
  item?.pricing_source ===
    "PRICE_LIST";

const getUnitDiscountAmount = (item) =>

  Math.max(
    getBaseUnitPrice(item) -
      getFinalUnitPrice(item),
    0
  );

const getDiscountPercentage = (item) => {

  const explicit = Number(
    item?.discount_percentage
  );

  if (
    Number.isFinite(explicit) &&
    explicit > 0
  ) {

    return explicit;

  }

  const base =
    getBaseUnitPrice(item);

  const discount =
    getUnitDiscountAmount(item);

  return base > 0
    ? (
        discount /
        base
      ) * 100
    : 0;

};

const formatPercent = (value) => {

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {

    return null;

  }

  return `${Number(
    number.toFixed(2)
  )}%`;

};

/* =========================================*

*   DATOS VACÍOS DE FACTURACIÓN*

*========================================= */

const EMPTY_BILLING = {

  company_id: "",

  rut: "",

  legal_name: "",

  trade_name: "",

  business_activity: "",

  billing_email: "",

  phone: "",

  address_line: "",

  commune: "",

  city: "",

  region: "",

  country: "Chile",

};

/* =========================================*

*   DATOS BOLETA CON RUT*

*   Se mantienen separados de FACTURA para*

*   no mezclar datos personales con datos*

*   de empresa al cambiar el tipo de DTE.*

*========================================= */

const EMPTY_BOLETA_BILLING = {

  address_line: "",

  commune: "",

  city: "",

  region: "",

  country: "Chile",

};

/* =========================================*

*   CHECKOUT PAGE*

*========================================= */

export default function CheckoutPage() {

  const router =

    useRouter();

  const items =

    useCartStore(

      (state) =>

        state.items

    );

  const clearCart =

    useCartStore(

      (state) =>

        state.clearCart

    );

  const [

    authStatus,

    setAuthStatus,

  ] = useState(

    "loading"

  );

  const [

    user,

    setUser,

  ] = useState(

    null

  );

  const [

    loadingError,

    setLoadingError,

  ] = useState(

    ""

  );

  const [

    documentType,

    setDocumentType,

  ] = useState(

    "BOLETA"

  );

  const [

    paymentMethod,

    setPaymentMethod,

  ] = useState(

    "MANUAL_BANK_TRANSFER"

  );

  const [

    contact,

    setContact,

  ] = useState({

    first_name: "",

    last_name: "",

    email: "",

    phone: "",

    rut: "",

  });

  const [

    billing,

    setBilling,

  ] = useState(

    EMPTY_BILLING

  );

  const [

    boletaBilling,

    setBoletaBilling,

  ] = useState(

    EMPTY_BOLETA_BILLING

  );

  const [

    selectedCompanyId,

    setSelectedCompanyId,

  ] = useState(

    ""

  );

  const [

    acceptsTerms,

    setAcceptsTerms,

  ] = useState(

    false

  );

  const [

    formError,

    setFormError,

  ] = useState(

    ""

  );

  const [

    reviewMode,

    setReviewMode,

  ] = useState(

    false

  );

  const [

    developmentMessage,

    setDevelopmentMessage,

  ] = useState(

    ""

  );

  const [

    submittingOrder,

    setSubmittingOrder,

  ] = useState(

    false

  );

  /* =========================================*

*     TOTALES*

*  ========================================= */

  const subtotal =

    useMemo(

      () =>

        items.reduce(

          (

            total,

            item

          ) =>

            total +

            getFinalUnitPrice(
              item
            ) *

              Number(

                item.quantity ||

                  0

              ),

          0

        ),

      [

        items,

      ]

    );

  const baseSubtotal =

    useMemo(

      () =>

        items.reduce(

          (

            total,

            item

          ) =>

            total +

            getBaseUnitPrice(
              item
            ) *

              Number(

                item.quantity ||

                  0

              ),

          0

        ),

      [

        items,

      ]

    );

  const customerDiscountTotal =

    useMemo(

      () =>

        items.reduce(

          (

            total,

            item

          ) => {

            if (
              !isCustomerExclusivePrice(
                item
              )
            ) {

              return total;

            }

            return (

              total +

              getUnitDiscountAmount(
                item
              ) *

                Number(

                  item.quantity ||

                    0

                )

            );

          },

          0

        ),

      [

        items,

      ]

    );

  const otherDiscountTotal =

    Math.max(

      baseSubtotal -

        subtotal -

        customerDiscountTotal,

      0

    );

  const hasAnyDiscount =

    baseSubtotal >
    subtotal;

  const totalUnits =

    useMemo(

      () =>

        items.reduce(

          (

            total,

            item

          ) =>

            total +

            Number(

              item.quantity ||

                0

            ),

          0

        ),

      [

        items,

      ]

    );

  /* =========================================*

*     CARGAR USUARIO OPCIONAL*

*     - Si existe sesión: precarga datos.*

*     - Si no existe sesión: continúa como invitado.*

*  ========================================= */

  useEffect(

    () => {

      let active =

        true;

      const loadUser =

        async () => {

          try {

            setAuthStatus(

              "loading"

            );

            setLoadingError(

              ""

            );

            const response =

              await apiRequest(

                "/auth/me"

              );

            if (!active) {

              return;

            }

            const currentUser =

              response?.user ||

              null;

            if (!currentUser) {

              setUser(

                null

              );

              setAuthStatus(

                "guest"

              );

              return;

            }

            setUser(

              currentUser

            );

            setContact({

              first_name:

                currentUser

                  .first_name ||

                "",

              last_name:

                currentUser

                  .last_name ||

                "",

              email:

                currentUser

                  .email ||

                "",

              phone:

                currentUser

                  .phone ||

                "",

              rut:

                currentUser

                  .rut ||

                "",

            });

            const primaryCompany =

              Array.isArray(

                currentUser

                  .companies

              )

                ? currentUser

                    .companies[0] ||

                  null

                : null;

            if (

              primaryCompany

            ) {

              setSelectedCompanyId(

                primaryCompany.id

              );

              setBilling({

                company_id:

                  primaryCompany.id ||

                  "",

                rut:

                  primaryCompany.rut ||

                  "",

                legal_name:

                  primaryCompany

                    .legal_name ||

                  "",

                trade_name:

                  primaryCompany

                    .trade_name ||

                  "",

                business_activity:

                  primaryCompany

                    .business_activity ||

                  "",

                billing_email:

                  primaryCompany

                    .billing_email ||

                  currentUser.email ||

                  "",

                phone:

                  primaryCompany

                    .phone ||

                  currentUser.phone ||

                  "",

                address_line:

                  primaryCompany

                    .address_line ||

                  "",

                commune:

                  primaryCompany

                    .commune ||

                  "",

                city:

                  primaryCompany

                    .city ||

                  "",

                region:

                  primaryCompany

                    .region ||

                  "",

                country:

                  primaryCompany

                    .country ||

                  "Chile",

              });

            }

            setAuthStatus(

              "authenticated"

            );

          } catch (error) {

            if (!active) {

              return;

            }

            if (

              error?.status ===

                401 ||

              error?.status ===

                403

            ) {

              setUser(

                null

              );

              setAuthStatus(

                "guest"

              );

              return;

            }

            console.error(

              "No fue posible cargar una sesión en checkout. Se continuará como invitado:",

              error

            );

            setUser(

              null

            );

            setLoadingError(

              "No pudimos recuperar una sesión iniciada. Puedes continuar la compra como invitado."

            );

            setAuthStatus(

              "guest"

            );

          }

        };

      loadUser();

      return () => {

        active =

          false;

      };

    },

    []

  );

  /* =========================================*

*     EMPRESAS DEL USUARIO*

*  ========================================= */

  const companies =

    Array.isArray(

      user?.companies

    )

      ? user.companies

      : [];

  /* =========================================*

*     CAMBIAR CONTACTO*

*  ========================================= */

  const handleContactChange =

    (field) =>

    (event) => {

      setContact(

        (current) => ({

          ...current,

          [field]:

            event.target

              .value,

        })

      );

      setReviewMode(

        false

      );

      setDevelopmentMessage(

        ""

      );

    };

  /* =========================================*

*     CAMBIAR FACTURACIÓN*

*  ========================================= */

  const handleBillingChange =

    (field) =>

    (event) => {

      setBilling(

        (current) => ({

          ...current,

          [field]:

            event.target

              .value,

        })

      );

      setReviewMode(

        false

      );

      setDevelopmentMessage(

        ""

      );

    };

  /* =========================================*

*     CAMBIAR DATOS BOLETA CON RUT*

*  ========================================= */

  const handleBoletaBillingChange =

    (field) =>

    (event) => {

      setBoletaBilling(

        (current) => ({

          ...current,

          [field]:

            event.target

              .value,

        })

      );

      setReviewMode(

        false

      );

      setDevelopmentMessage(

        ""

      );

    };

  /* =========================================*

*     SELECCIONAR EMPRESA*

*  ========================================= */

  const handleCompanyChange =

    (event) => {

      const companyId =

        event.target.value;

      setSelectedCompanyId(

        companyId

      );

      setReviewMode(

        false

      );

      setDevelopmentMessage(

        ""

      );

      if (!companyId) {

        setBilling({

          ...EMPTY_BILLING,

          billing_email:

            contact.email,

          phone:

            contact.phone,

        });

        return;

      }

      const company =

        companies.find(

          (entry) =>

            entry.id ===

            companyId

        );

      if (!company) {

        return;

      }

      setBilling({

        company_id:

          company.id ||

          "",

        rut:

          company.rut ||

          "",

        legal_name:

          company

            .legal_name ||

          "",

        trade_name:

          company

            .trade_name ||

          "",

        business_activity:

          company

            .business_activity ||

          "",

        billing_email:

          company

            .billing_email ||

          contact.email ||

          "",

        phone:

          company.phone ||

          contact.phone ||

          "",

        address_line:

          company

            .address_line ||

          "",

        commune:

          company.commune ||

          "",

        city:

          company.city ||

          "",

        region:

          company.region ||

          "",

        country:

          company.country ||

          "Chile",

      });

    };

  /* =========================================*

*     VALIDACIÓN*

*  ========================================= */

  const validateCheckout =

    () => {

      const requiredContact =

        [

          [

            "Nombre",

            contact.first_name,

          ],

          [

            "Apellido",

            contact.last_name,

          ],

          [

            "Correo electrónico",

            contact.email,

          ],

          [

            "Teléfono",

            contact.phone,

          ],

        ];

      for (

        const [

          label,

          value,

        ] of requiredContact

      ) {

        if (

          !cleanText(value)

        ) {

          return `Completa el campo ${label}.`;

        }

      }

      if (

        !isValidEmail(

          contact.email

        )

      ) {

        return "Ingresa un correo electrónico válido.";

      }

      if (

        documentType ===

          "BOLETA" &&

        cleanText(

          contact.rut

        )

      ) {

        const requiredBoletaBilling =

          [

            [

              "Dirección",

              boletaBilling.address_line,

            ],

            [

              "Región",

              boletaBilling.region,

            ],

            [

              "Ciudad",

              boletaBilling.city,

            ],

            [

              "Comuna",

              boletaBilling.commune,

            ],

          ];

        for (

          const [

            label,

            value,

          ] of requiredBoletaBilling

        ) {

          if (

            !cleanText(

              value

            )

          ) {

            return `Completa el campo ${label} para asociar la boleta al RUT ingresado.`;

          }

        }

      }

      if (

        documentType ===

        "FACTURA"

      ) {

        const requiredBilling =

          [

            [

              "RUT empresa",

              billing.rut,

            ],

            [

              "Razón social",

              billing.legal_name,

            ],

            [

              "Giro",

              billing.business_activity,

            ],

            [

              "Correo de facturación",

              billing.billing_email,

            ],

            [

              "Dirección",

              billing.address_line,

            ],

            [

              "Comuna",

              billing.commune,

            ],

            [

              "Ciudad",

              billing.city,

            ],

          ];

        for (

          const [

            label,

            value,

          ] of requiredBilling

        ) {

          if (

            !cleanText(

              value

            )

          ) {

            return `Completa el campo ${label}.`;

          }

        }

        if (

          !isValidEmail(

            billing.billing_email

          )

        ) {

          return "Ingresa un correo de facturación válido.";

        }

      }

      if (

        paymentMethod !==

        "MANUAL_BANK_TRANSFER"

      ) {

        return "El método de pago seleccionado todavía no está disponible.";

      }

      if (!acceptsTerms) {

        return "Debes aceptar los términos y condiciones para continuar.";

      }

      return null;

    };

  /* =========================================*

*     REVISAR PEDIDO*

*  ========================================= */

  const handleReview =

    () => {

      const error =

        validateCheckout();

      if (error) {

        setFormError(

          error

        );

        setReviewMode(

          false

        );

        return;

      }

      setFormError(

        ""

      );

      setDevelopmentMessage(

        ""

      );

      setReviewMode(

        true

      );

      window.scrollTo({

        top: 0,

        behavior:

          "smooth",

      });

    };

  /* =========================================*

*     CONFIRMAR PEDIDO REAL*

*  ========================================= */

  const handleConfirmOrder =

    async () => {

      const validationError =

        validateCheckout();

      if (

        validationError

      ) {

        setFormError(

          validationError

        );

        setReviewMode(

          false

        );

        return;

      }

      try {

        setSubmittingOrder(

          true

        );

        setFormError(

          ""

        );

        setDevelopmentMessage(

          ""

        );

        const payload = {

          contact: {

            first_name:

              contact.first_name,

            last_name:

              contact.last_name,

            email:

              contact.email,

            phone:

              contact.phone,

            rut:

              contact.rut,

          },

          document_type:

            documentType,

          billing:

            documentType ===

            "FACTURA"

              ? {

                  rut:

                    billing.rut,

                  legal_name:

                    billing.legal_name,

                  trade_name:

                    billing.trade_name,

                  business_activity:

                    billing.business_activity,

                  billing_email:

                    billing.billing_email,

                  phone:

                    billing.phone,

                  address_line:

                    billing.address_line,

                  commune:

                    billing.commune,

                  city:

                    billing.city,

                  region:

                    billing.region,

                  country:

                    billing.country,

                }

              : cleanText(

                    contact.rut

                  )

                ? {

                    rut:

                      contact.rut,

                    legal_name:

                      `${cleanText(

                        contact.first_name

                      )} ${cleanText(

                        contact.last_name

                      )}`.trim(),

                    trade_name:

                      "",

                    business_activity:

                      "",

                    billing_email:

                      contact.email,

                    phone:

                      contact.phone,

                    address_line:

                      boletaBilling.address_line,

                    commune:

                      boletaBilling.commune,

                    city:

                      boletaBilling.city,

                    region:

                      boletaBilling.region,

                    country:

                      boletaBilling.country,

                  }

                : {},

          items:

            items.map(

              (item) => ({

                product_id:

                  item.product_id ||

                  item.id,

                quantity:

                  Number(

                    item.quantity

                  ),

              })

            ),

          payment_method:

            paymentMethod,

        };

        const response =

          await apiRequest(

            "/checkout/orders",

            {

              method:

                "POST",

              body:

                payload,

            }

          );

        const data =

          response?.data;

        const orderId =

          data?.order?.id;

        const guestToken =

          data

            ?.guest_access

            ?.token;

        if (

          !orderId ||

          !guestToken

        ) {

          throw new Error(

            "El backend creó el pedido, pero no devolvió el acceso privado requerido."

          );

        }

        if (

          typeof window !==

          "undefined"

        ) {

          sessionStorage.setItem(

            `laminatiword_guest_order_${orderId}`,

            guestToken

          );

        }

        clearCart();

        router.push(

          `/pago/transferencia?order=${encodeURIComponent(

            orderId

          )}`

        );

      } catch (error) {

        console.error(

          "Error confirmando pedido:",

          error

        );

        setFormError(

          error?.message ||

            "No fue posible crear el pedido. Intenta nuevamente."

        );

        setSubmittingOrder(

          false

        );

      }

    };

  /* =========================================*

*     CARRITO VACÍO*

*  ========================================= */

  if (

    items.length ===

    0

  ) {

    return (

      <main className="min-h-screen bg-white">

        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">

          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">

            Checkout

          </p>

          <h1 className="mt-4 text-4xl font-medium tracking-[-0.05em] text-neutral-950">

            No hay productos para procesar

          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-500">

            Tu carrito está vacío.

            Agrega productos antes de

            continuar al checkout.

          </p>

          <Link

            href="/productos"

            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800"

          >

            Ver productos

          </Link>

        </div>

      </main>

    );

  }

  /* =========================================*

*     CARGANDO AUTENTICACIÓN*

*  ========================================= */

  if (

    authStatus ===

    "loading"

  ) {

    return (

      <main className="min-h-screen bg-white">

        <div className="mx-auto flex min-h-[620px] max-w-3xl items-center justify-center px-4">

          <div className="text-center">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

            <p className="mt-4 text-sm text-neutral-500">

              Preparando checkout...

            </p>

          </div>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-white">

      <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">

        {/* =====================================*

*            BREADCRUMB*

*        ===================================== */}

        <nav

          aria-label="Breadcrumb"

          className="mb-8 flex items-center gap-2 text-xs text-neutral-400"

        >

          <Link

            href="/"

            className="transition hover:text-black"

          >

            Inicio

          </Link>

          <span>/</span>

          <Link

            href="/carrito"

            className="transition hover:text-black"

          >

            Carrito

          </Link>

          <span>/</span>

          <span className="text-neutral-700">

            Checkout

          </span>

        </nav>

        {/* =====================================*

*            CABECERA*

*        ===================================== */}

        <div className="mb-10 border-b border-neutral-200 pb-8">

          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">

            Finalizar compra

          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-5xl">

            Checkout

          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-500">

            Revisa tus datos,

            selecciona el documento

            tributario y confirma cómo

            realizarás el pago.

          </p>

        </div>

        {authStatus ===

          "guest" && (

          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-[#fafafa] p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <svg

                  width="17"

                  height="17"

                  viewBox="0 0 24 24"

                  fill="none"

                  aria-hidden="true"

                >

                  <circle

                    cx="12"

                    cy="8"

                    r="4"

                    stroke="currentColor"

                    strokeWidth="1.5"

                  />

                  <path

                    d="M4 20c.8-4 3.47-6 8-6s7.2 2 8 6"

                    stroke="currentColor"

                    strokeWidth="1.5"

                    strokeLinecap="round"

                  />

                </svg>

                <p className="text-sm font-medium text-neutral-950">

                  Estás comprando como invitado

                </p>

              </div>

              <p className="mt-2 text-xs leading-5 text-neutral-500">

                No necesitas crear una cuenta

                para finalizar tu compra.

                Ingresa tus datos a continuación.

              </p>

              {loadingError && (

                <p className="mt-2 text-xs text-amber-700">

                  {

                    loadingError

                  }

                </p>

              )}

            </div>

            <Link

              href="/login?redirect=/checkout"

              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black"

            >

              Ya tengo una cuenta

            </Link>

          </div>

        )}

        {authStatus ===

          "authenticated" &&

          user && (

          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">

              <svg

                width="16"

                height="16"

                viewBox="0 0 24 24"

                fill="none"

                aria-hidden="true"

              >

                <path

                  d="m6 12 4 4 8-8"

                  stroke="currentColor"

                  strokeWidth="1.8"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

              </svg>

            </span>

            <div>

              <p className="text-sm font-medium text-neutral-950">

                Sesión iniciada

              </p>

              <p className="mt-0.5 text-xs text-neutral-500">

                Tus datos guardados fueron

                precargados automáticamente.

              </p>

            </div>

          </div>

        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_410px] xl:gap-14">

          {/* =====================================*

*              FORMULARIO*

*          ===================================== */}

          <div className="space-y-7">

            {/* =================================*

*                1. CONTACTO*

*            ================================= */}

            <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">

                  1

                </div>

                <div>

                  <h2 className="text-xl font-medium tracking-[-0.03em] text-neutral-950">

                    Datos de contacto

                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">

                    {authStatus ===

                    "guest"

                      ? "Completa tus datos para realizar la compra como invitado."

                      : "Utilizaremos estos datos para identificar la compra y contactarte si es necesario."}

                  </p>

                </div>

              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">

                <div>

                  <label className={labelClass}>

                    Nombre

                  </label>

                  <input

                    type="text"

                    value={

                      contact.first_name

                    }

                    onChange={

                      handleContactChange(

                        "first_name"

                      )

                    }

                    className={

                      inputClass

                    }

                    autoComplete="given-name"

                  />

                </div>

                <div>

                  <label className={labelClass}>

                    Apellido

                  </label>

                  <input

                    type="text"

                    value={

                      contact.last_name

                    }

                    onChange={

                      handleContactChange(

                        "last_name"

                      )

                    }

                    className={

                      inputClass

                    }

                    autoComplete="family-name"

                  />

                </div>

                <div>

                  <label className={labelClass}>

                    Correo electrónico

                  </label>

                  <input

                    type="email"

                    value={

                      contact.email

                    }

                    onChange={

                      handleContactChange(

                        "email"

                      )

                    }

                    className={

                      inputClass

                    }

                    autoComplete="email"

                  />

                </div>

                <div>

                  <label className={labelClass}>

                    Teléfono

                  </label>

                  <input

                    type="tel"

                    value={

                      contact.phone

                    }

                    onChange={

                      handleContactChange(

                        "phone"

                      )

                    }

                    className={

                      inputClass

                    }

                    autoComplete="tel"

                  />

                </div>

                <div className="sm:col-span-2">

                  <label className={labelClass}>

                    RUT{" "}

                    <span className="normal-case tracking-normal text-neutral-300">

                      (opcional para boleta)

                    </span>

                  </label>

                  <input

                    type="text"

                    value={

                      contact.rut

                    }

                    onChange={

                      handleContactChange(

                        "rut"

                      )

                    }

                    placeholder="12.345.678-9"

                    className={

                      inputClass

                    }

                  />

                  <p className="mt-2 text-[11px] leading-5 text-neutral-400">

                    Si ingresas RUT para boleta, solicitaremos dirección, región, ciudad y comuna en el paso de documento tributario.

                  </p>

                </div>

              </div>

            </section>

            {/* =================================*

*                2. DOCUMENTO TRIBUTARIO*

*            ================================= */}

            <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">

                  2

                </div>

                <div>

                  <h2 className="text-xl font-medium tracking-[-0.03em] text-neutral-950">

                    Documento tributario

                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">

                    Selecciona si necesitas

                    boleta o factura.

                  </p>

                </div>

              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">

                <button

                  type="button"

                  onClick={() => {

                    setDocumentType(

                      "BOLETA"

                    );

                    setReviewMode(

                      false

                    );

                    setDevelopmentMessage(

                      ""

                    );

                  }}

                  className={`rounded-2xl border p-5 text-left transition ${

                    documentType ===

                    "BOLETA"

                      ? "border-black bg-black text-white"

                      : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400"

                  }`}

                >

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-sm font-medium">

                      Boleta

                    </span>

                    <span

                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${

                        documentType ===

                        "BOLETA"

                          ? "border-white"

                          : "border-neutral-300"

                      }`}

                    >

                      {documentType ===

                        "BOLETA" && (

                        <span className="h-2.5 w-2.5 rounded-full bg-white" />

                      )}

                    </span>

                  </div>

                  <p

                    className={`mt-2 text-xs leading-5 ${

                      documentType ===

                      "BOLETA"

                        ? "text-white/65"

                        : "text-neutral-400"

                    }`}

                  >

                    Documento para compra

                    personal.

                  </p>

                </button>

                <button

                  type="button"

                  onClick={() => {

                    setDocumentType(

                      "FACTURA"

                    );

                    setReviewMode(

                      false

                    );

                    setDevelopmentMessage(

                      ""

                    );

                  }}

                  className={`rounded-2xl border p-5 text-left transition ${

                    documentType ===

                    "FACTURA"

                      ? "border-black bg-black text-white"

                      : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400"

                  }`}

                >

                  <div className="flex items-center justify-between gap-4">

                    <span className="text-sm font-medium">

                      Factura

                    </span>

                    <span

                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${

                        documentType ===

                        "FACTURA"

                          ? "border-white"

                          : "border-neutral-300"

                      }`}

                    >

                      {documentType ===

                        "FACTURA" && (

                        <span className="h-2.5 w-2.5 rounded-full bg-white" />

                      )}

                    </span>

                  </div>

                  <p

                    className={`mt-2 text-xs leading-5 ${

                      documentType ===

                      "FACTURA"

                        ? "text-white/65"

                        : "text-neutral-400"

                    }`}

                  >

                    Documento para empresa

                    o actividad comercial.

                  </p>

                </button>

              </div>

              {documentType ===

                "BOLETA" &&

                !cleanText(

                  contact.rut

                ) && (

                <div className="mt-5 rounded-2xl border border-neutral-200 bg-[#fafafa] p-4">

                  <p className="text-xs leading-5 text-neutral-500">

                    El RUT es opcional para boleta. Si lo dejas vacío, el documento se emitirá utilizando el receptor genérico configurado para este flujo.

                  </p>

                </div>

              )}

              {/* =================================*

*                  DATOS BOLETA CON RUT*

*              ================================= */}

              {documentType ===

                "BOLETA" &&

                cleanText(

                  contact.rut

                ) && (

                <div className="mt-7 border-t border-neutral-200 pt-7">

                  <div className="mb-6 rounded-2xl border border-neutral-200 bg-[#fafafa] p-5">

                    <p className="text-sm font-medium text-neutral-950">

                      Datos para asociar tu boleta

                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">

                      Al ingresar tu RUT necesitamos estos datos para registrar correctamente el receptor del documento tributario.

                    </p>

                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div className="sm:col-span-2">

                      <label className={labelClass}>

                        Dirección

                      </label>

                      <input

                        type="text"

                        value={

                          boletaBilling

                            .address_line

                        }

                        onChange={

                          handleBoletaBillingChange(

                            "address_line"

                          )

                        }

                        placeholder="Av. Santa Rosa 5415"

                        className={

                          inputClass

                        }

                        autoComplete="street-address"

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Región

                      </label>

                      <input

                        type="text"

                        value={

                          boletaBilling.region

                        }

                        onChange={

                          handleBoletaBillingChange(

                            "region"

                          )

                        }

                        placeholder="Región Metropolitana"

                        className={

                          inputClass

                        }

                        autoComplete="address-level1"

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Ciudad

                      </label>

                      <input

                        type="text"

                        value={

                          boletaBilling.city

                        }

                        onChange={

                          handleBoletaBillingChange(

                            "city"

                          )

                        }

                        placeholder="Santiago"

                        className={

                          inputClass

                        }

                        autoComplete="address-level2"

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Comuna

                      </label>

                      <input

                        type="text"

                        value={

                          boletaBilling.commune

                        }

                        onChange={

                          handleBoletaBillingChange(

                            "commune"

                          )

                        }

                        placeholder="San Miguel"

                        className={

                          inputClass

                        }

                        autoComplete="address-level3"

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        País

                      </label>

                      <input

                        type="text"

                        value={

                          boletaBilling.country

                        }

                        readOnly

                        className={`${inputClass} cursor-default bg-neutral-50 text-neutral-500`}

                        autoComplete="country-name"

                      />

                    </div>

                  </div>

                </div>

              )}

              {/* =================================*

*                  DATOS FACTURA*

*              ================================= */}

              {documentType ===

                "FACTURA" && (

                <div className="mt-7 border-t border-neutral-200 pt-7">

                  {companies.length >

                    0 && (

                    <div className="mb-6">

                      <label className={labelClass}>

                        Empresa guardada

                      </label>

                      <select

                        value={

                          selectedCompanyId

                        }

                        onChange={

                          handleCompanyChange

                        }

                        className={

                          inputClass

                        }

                      >

                        <option value="">

                          Ingresar otra empresa

                        </option>

                        {companies.map(

                          (

                            company

                          ) => (

                            <option

                              key={

                                company.id

                              }

                              value={

                                company.id

                              }

                            >

                              {company

                                .legal_name ||

                                company

                                  .trade_name ||

                                company.rut}

                            </option>

                          )

                        )}

                      </select>

                    </div>

                  )}

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <label className={labelClass}>

                        RUT empresa

                      </label>

                      <input

                        type="text"

                        value={

                          billing.rut

                        }

                        onChange={

                          handleBillingChange(

                            "rut"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Razón social

                      </label>

                      <input

                        type="text"

                        value={

                          billing

                            .legal_name

                        }

                        onChange={

                          handleBillingChange(

                            "legal_name"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Nombre de fantasía

                      </label>

                      <input

                        type="text"

                        value={

                          billing

                            .trade_name

                        }

                        onChange={

                          handleBillingChange(

                            "trade_name"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Giro

                      </label>

                      <input

                        type="text"

                        value={

                          billing

                            .business_activity

                        }

                        onChange={

                          handleBillingChange(

                            "business_activity"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Correo facturación

                      </label>

                      <input

                        type="email"

                        value={

                          billing

                            .billing_email

                        }

                        onChange={

                          handleBillingChange(

                            "billing_email"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Teléfono empresa

                      </label>

                      <input

                        type="tel"

                        value={

                          billing.phone

                        }

                        onChange={

                          handleBillingChange(

                            "phone"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div className="sm:col-span-2">

                      <label className={labelClass}>

                        Dirección

                      </label>

                      <input

                        type="text"

                        value={

                          billing

                            .address_line

                        }

                        onChange={

                          handleBillingChange(

                            "address_line"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Comuna

                      </label>

                      <input

                        type="text"

                        value={

                          billing.commune

                        }

                        onChange={

                          handleBillingChange(

                            "commune"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Ciudad

                      </label>

                      <input

                        type="text"

                        value={

                          billing.city

                        }

                        onChange={

                          handleBillingChange(

                            "city"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        Región

                      </label>

                      <input

                        type="text"

                        value={

                          billing.region

                        }

                        onChange={

                          handleBillingChange(

                            "region"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                    <div>

                      <label className={labelClass}>

                        País

                      </label>

                      <input

                        type="text"

                        value={

                          billing.country

                        }

                        onChange={

                          handleBillingChange(

                            "country"

                          )

                        }

                        className={

                          inputClass

                        }

                      />

                    </div>

                  </div>

                </div>

              )}

            </section>

            {/* =================================*

*                3. ENTREGA*

*            ================================= */}

            <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">

                  3

                </div>

                <div>

                  <h2 className="text-xl font-medium tracking-[-0.03em] text-neutral-950">

                    Entrega

                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">

                    Actualmente las compras

                    online se entregan

                    mediante retiro en tienda.

                  </p>

                </div>

              </div>

              <div className="mt-7 rounded-2xl border border-black bg-[#fafafa] p-5">

                <div className="flex items-start gap-4">

                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-black">

                    <span className="h-3 w-3 rounded-full bg-black" />

                  </span>

                  <div>

                    <p className="text-sm font-medium text-neutral-950">

                      Retiro en tienda

                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">

                      Sin costo de despacho.

                      Te avisaremos cuando

                      el pedido esté listo

                      para retirar.

                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================*

*                4. PAGO*

*            ================================= */}

            <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">

                  4

                </div>

                <div>

                  <h2 className="text-xl font-medium tracking-[-0.03em] text-neutral-950">

                    Método de pago

                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">

                    Selecciona cómo deseas

                    pagar tu compra.

                  </p>

                </div>

              </div>

              <div className="mt-7 space-y-4">

                <button

                  type="button"

                  onClick={() => {

                    setPaymentMethod(

                      "MANUAL_BANK_TRANSFER"

                    );

                    setReviewMode(

                      false

                    );

                    setDevelopmentMessage(

                      ""

                    );

                  }}

                  className="w-full rounded-2xl border border-black bg-[#fafafa] p-5 text-left"

                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-sm font-medium text-neutral-950">

                        Transferencia bancaria

                      </p>

                      <p className="mt-1 text-xs leading-5 text-neutral-500">

                        Al crear el pedido

                        recibirás los datos

                        bancarios y podrás

                        adjuntar tu comprobante.

                      </p>

                    </div>

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black">

                      <span className="h-3 w-3 rounded-full bg-black" />

                    </span>

                  </div>

                </button>

                <div className="w-full cursor-not-allowed rounded-2xl border border-neutral-200 bg-neutral-50 p-5 opacity-55">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-sm font-medium text-neutral-700">

                          Pago online

                        </p>

                        <span className="rounded-full bg-neutral-200 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-500">

                          Próximamente

                        </span>

                      </div>

                      <p className="mt-1 text-xs leading-5 text-neutral-400">

                        Integración de pago

                        electrónico disponible

                        en una siguiente etapa.

                      </p>

                    </div>

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300" />

                  </div>

                </div>

              </div>

            </section>

            {/* =================================*

*                TÉRMINOS*

*            ================================= */}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-[#fafafa] p-5">

              <input

                type="checkbox"

                checked={

                  acceptsTerms

                }

                onChange={(

                  event

                ) => {

                  setAcceptsTerms(

                    event.target

                      .checked

                  );

                  setReviewMode(

                    false

                  );

                  setDevelopmentMessage(

                    ""

                  );

                }}

                className="mt-0.5 h-4 w-4 accent-black"

              />

              <span className="text-xs leading-6 text-neutral-500">

                Confirmo que los datos

                ingresados son correctos y

                acepto los términos y

                condiciones de compra.

              </span>

            </label>

            {/* =================================*

*                ERROR*

*            ================================= */}

            {formError && (

              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">

                {

                  formError

                }

              </div>

            )}

            {/* =================================*

*                REVISIÓN*

*            ================================= */}

            {reviewMode && (

              <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 sm:p-8">

                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">

                  Datos revisados

                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">

                  Pedido listo para confirmar

                </h2>

                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">

                  <div>

                    <p className="text-xs text-neutral-500">

                      Cliente

                    </p>

                    <p className="mt-1 font-medium text-neutral-950">

                      {contact.first_name}{" "}

                      {

                        contact.last_name

                      }

                    </p>

                    {authStatus ===

                      "guest" && (

                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-700">

                        Compra como invitado

                      </p>

                    )}

                  </div>

                  <div>

                    <p className="text-xs text-neutral-500">

                      Documento

                    </p>

                    <p className="mt-1 font-medium text-neutral-950">

                      {

                        documentType

                      }

                    </p>

                  </div>

                  {documentType ===

                    "BOLETA" &&

                    cleanText(

                      contact.rut

                    ) && (

                    <>

                      <div>

                        <p className="text-xs text-neutral-500">

                          RUT receptor

                        </p>

                        <p className="mt-1 font-medium text-neutral-950">

                          {contact.rut}

                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-neutral-500">

                          Dirección tributaria

                        </p>

                        <p className="mt-1 font-medium text-neutral-950">

                          {boletaBilling.address_line}

                          {boletaBilling.commune

                            ? `, ${boletaBilling.commune}`

                            : ""}

                        </p>

                      </div>

                    </>

                  )}

                  <div>

                    <p className="text-xs text-neutral-500">

                      Entrega

                    </p>

                    <p className="mt-1 font-medium text-neutral-950">

                      Retiro en tienda

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-neutral-500">

                      Pago

                    </p>

                    <p className="mt-1 font-medium text-neutral-950">

                      Transferencia bancaria

                    </p>

                  </div>

                </div>

              </section>

            )}

            {developmentMessage && (

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-800">

                {

                  developmentMessage

                }

              </div>

            )}

          </div>

          {/* =====================================*

*              RESUMEN*

*          ===================================== */}

          <aside className="lg:self-start">

            <div className="rounded-[1.75rem] border border-neutral-200 bg-[#fafafa] p-6 shadow-sm sm:p-8 lg:sticky lg:top-28">

              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

                Resumen

              </p>

              <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">

                Tu pedido

              </h2>

              <div className="mt-7 max-h-[340px] space-y-5 overflow-y-auto pr-1">

                {items.map(

                  (item) => {

                    const quantity =

                      Number(

                        item.quantity ||

                          0

                      );

                    const finalUnitPrice =

                      getFinalUnitPrice(
                        item
                      );

                    const baseUnitPrice =

                      getBaseUnitPrice(
                        item
                      );

                    const customerExclusive =

                      isCustomerExclusivePrice(
                        item
                      ) &&

                      baseUnitPrice >
                        finalUnitPrice;

                    const discountPercent =

                      formatPercent(

                        getDiscountPercentage(
                          item
                        )

                      );

                    const lineTotal =

                      finalUnitPrice *

                      quantity;

                    const baseLineTotal =

                      baseUnitPrice *

                      quantity;

                    const lineDiscount =

                      Math.max(

                        baseLineTotal -
                          lineTotal,

                        0

                      );

                    return (

                      <div

                        key={

                          getItemKey(

                            item

                          )

                        }

                        className="flex gap-4"

                      >

                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-[#f3f2ee]">

                          {item.image_url ? (

                            <img

                              src={

                                item.image_url

                              }

                              alt={

                                item.image_alt ||

                                getDisplayName(

                                  item

                                )

                              }

                              className="h-full w-full object-cover"

                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center text-[8px] font-medium tracking-[0.1em] text-neutral-300">

                              LAMINATI

                            </div>

                          )}

                          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[9px] font-medium text-white">

                            {

                              quantity

                            }

                          </span>

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-medium text-neutral-950">

                            {getDisplayName(

                              item

                            )}

                          </p>

                          {item.sku && (

                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-neutral-400">

                              SKU{" "}

                              {

                                item.sku

                              }

                            </p>

                          )}

                          {customerExclusive && (

                            <p className="mt-2 text-[11px] text-neutral-400 line-through">

                              {formatPrice(
                                baseLineTotal
                              )}

                            </p>

                          )}

                          <p className={`${customerExclusive ? "mt-0.5" : "mt-2"} text-sm font-medium text-neutral-950`}>

                            {formatPrice(
                              lineTotal
                            )}

                          </p>

                          {customerExclusive && (

                            <div className="mt-1.5">

                              <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-medium text-violet-700">

                                Precio exclusivo cliente
                                {discountPercent
                                  ? ` · ${discountPercent} dto.`
                                  : ""}

                              </span>

                              {lineDiscount > 0 && (

                                <p className="mt-1 text-[10px] font-medium text-emerald-700">

                                  Ahorras {formatPrice(
                                    lineDiscount
                                  )}

                                </p>

                              )}

                            </div>

                          )}

                        </div>

                      </div>

                    );

                  }

                )}

              </div>

              <dl className="mt-7 space-y-4 border-y border-neutral-200 py-6">

                <div className="flex items-center justify-between gap-4">

                  <dt className="text-sm text-neutral-500">

                    Productos

                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">

                    {items.length}

                  </dd>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <dt className="text-sm text-neutral-500">

                    Unidades

                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">

                    {

                      totalUnits

                    }

                  </dd>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <dt className="text-sm text-neutral-500">

                    {hasAnyDiscount
                      ? "Subtotal precio normal"
                      : "Subtotal"}

                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">

                    {formatPrice(

                      hasAnyDiscount
                        ? baseSubtotal
                        : subtotal

                    )}

                  </dd>

                </div>

                {customerDiscountTotal > 0 && (

                  <div className="flex items-center justify-between gap-4">

                    <dt className="text-sm font-medium text-violet-700">

                      Descuento exclusivo cliente

                    </dt>

                    <dd className="text-sm font-medium text-violet-700">

                      -{formatPrice(
                        customerDiscountTotal
                      )}

                    </dd>

                  </div>

                )}

                {otherDiscountTotal > 0 && (

                  <div className="flex items-center justify-between gap-4">

                    <dt className="text-sm text-neutral-500">

                      Ofertas y promociones

                    </dt>

                    <dd className="text-sm font-medium text-emerald-700">

                      -{formatPrice(
                        otherDiscountTotal
                      )}

                    </dd>

                  </div>

                )}

                <div className="flex items-center justify-between gap-4">

                  <dt className="text-sm text-neutral-500">

                    Entrega

                  </dt>

                  <dd className="text-sm font-medium text-neutral-950">

                    Retiro en tienda

                  </dd>

                </div>

              </dl>

              <div className="flex items-end justify-between gap-5 py-6">

                <div>

                  <p className="text-sm font-medium text-neutral-950">

                    Total

                  </p>

                  <p className="mt-1 text-xs text-neutral-400">

                    IVA incluido

                  </p>

                </div>

                <p className="text-3xl font-medium tracking-[-0.04em] text-neutral-950">

                  {formatPrice(

                    subtotal

                  )}

                </p>

              </div>

              {!reviewMode ? (

                <button

                  type="button"

                  onClick={

                    handleReview

                  }

                  className="flex min-h-13 w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"

                >

                  Revisar pedido

                </button>

              ) : (

                <button

                  type="button"

                  onClick={

                    handleConfirmOrder

                  }

                  disabled={

                    submittingOrder

                  }

                  className="flex min-h-13 w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"

                >

                  {submittingOrder

                    ? "Creando pedido..."

                    : "Confirmar pedido"}

                </button>

              )}

              <Link

                href="/carrito"

                className="mt-4 flex min-h-11 w-full items-center justify-center text-sm font-medium text-neutral-500 transition hover:text-black"

              >

                Volver al carrito

              </Link>

              <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">

                El backend volverá a validar

                precios y stock al momento de

                crear la orden.

              </p>

            </div>

          </aside>

        </div>

      </div>

    </main>

  );

}