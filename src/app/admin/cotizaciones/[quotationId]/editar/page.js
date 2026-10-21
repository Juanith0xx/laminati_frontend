"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPosProducts,
  getQuotation,
  updateQuotation,
} from "@/services/showroom.service";

import ProjectQuotationEditor from "@/components/admin/quotations/ProjectQuotationEditor";

import {
  getChileanRutValidation,
} from "@/utils/rut";

const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function money(value) {
  const number = Number(value || 0);

  return moneyFormatter.format(
    Number.isFinite(number)
      ? number
      : 0
  );
}

function dateInputValue(value) {
  if (!value) return "";

  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2})/
  );

  if (match) {
    return match[1];
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
}

function isFexShippingItem(item) {
  return (
    item?.is_fex_shipping === true ||
    item?.allows_price_override === true ||
    String(item?.sku || "")
      .trim()
      .toUpperCase() ===
      "FEX-DESPACHO"
  );
}

function getItemUnitPrice(item) {
  if (isFexShippingItem(item)) {
    const override = Number(
      item?.unit_price_override ??
        item?.unit_price_gross ??
        0
    );

    return Number.isFinite(override)
      ? override
      : 0;
  }

  const value = Number(
    item?.unit_price_gross ??
      item?.base_price ??
      0
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function hasValidFexPrice(item) {
  if (!isFexShippingItem(item)) {
    return true;
  }

  const price = getItemUnitPrice(item);

  return (
    Number.isFinite(price) &&
    price > 0
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim()
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-black";

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();

  const quotationId = String(
    params?.quotationId || ""
  );

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [message, setMessage] =
    useState("");

  const [quotation, setQuotation] =
    useState(null);

  const [documentType, setDocumentType] =
    useState("BOLETA");

  const [customer, setCustomer] =
    useState({
      name: "",
      rut: "",
      email: "",
      phone: "",
      address: "",
    });

  const [billing, setBilling] =
    useState({
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
    });

  const [notes, setNotes] =
    useState("");
  const [validUntil, setValidUntil] =
    useState("");

  const [
    editQuotationType,
    setEditQuotationType,
  ] = useState("STANDARD");

  const [
    projectName,
    setProjectName,
  ] = useState("");

  const [
    projectReference,
    setProjectReference,
  ] = useState("");

  const [
    visibleToItaly,
    setVisibleToItaly,
  ] = useState(false);

  const isConvertingToProject =
    editQuotationType ===
    "PROJECT";

  const [query, setQuery] =
    useState("");
  const [products, setProducts] =
    useState([]);
  const [catalogLoading, setCatalogLoading] =
    useState(false);
  const [catalogError, setCatalogError] =
    useState("");
  const [cart, setCart] =
    useState([]);

  const canEdit =
    quotation &&
    ["DRAFT", "SENT"].includes(
      quotation.status
    );

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          getItemUnitPrice(item) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const taxTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const gross =
          getItemUnitPrice(item) *
          Number(item.quantity || 0);

        const rate = Number(
          item.tax_rate || 0
        );

        if (!rate) {
          return sum;
        }

        return (
          sum +
          (
            gross -
            gross /
              (1 + rate / 100)
          )
        );
      }, 0),
    [cart]
  );

  const netTotal =
    total - taxTotal;

  useEffect(() => {
    if (!quotationId) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getQuotation(
            quotationId
          );

        if (!active) return;

        const data =
          response?.data || null;

        const current =
          data?.quotation || null;

        const items =
          data?.items || [];

        if (!current) {
          throw new Error(
            "Cotización no encontrada."
          );
        }

        setQuotation(current);

        setEditQuotationType(
          String(
            current.quotation_type ||
              "STANDARD"
          )
            .trim()
            .toUpperCase() ===
            "PROJECT"
            ? "PROJECT"
            : "STANDARD"
        );

        setProjectName(
          current.project_name ||
            ""
        );

        setProjectReference(
          current.project_reference ||
            ""
        );

        setVisibleToItaly(
          current.visible_to_italy ===
            true
        );

        setDocumentType(
          current.intended_document_type ||
            "BOLETA"
        );

        setCustomer({
          name:
            current.customer_name ||
            current.legal_name ||
            "",
          rut:
            current.rut || "",
          email:
            current.email || "",
          phone:
            current.phone || "",
          address:
            current.address_line || "",
        });

        setBilling({
          rut:
            current.rut || "",
          legal_name:
            current.legal_name ||
            current.customer_name ||
            "",
          trade_name:
            current.trade_name || "",
          business_activity:
            current.business_activity || "",
          billing_email:
            current.email || "",
          phone:
            current.phone || "",
          address_line:
            current.address_line || "",
          commune:
            current.commune || "",
          city:
            current.city || "",
          region:
            current.region || "",
          country:
            current.country || "Chile",
        });

        setNotes(
          current.notes || ""
        );

        setValidUntil(
          dateInputValue(
            current.valid_until
          )
        );

        setCart(
          items.map((item) => ({
            id:
              item.product_id,
            sku:
              item.sku,
            name:
              item.product_name,
            product_name:
              item.product_name,
            quantity:
              Number(item.quantity),
            unit_price_gross:
              Number(
                item.unit_price_gross
              ),
            base_price:
              Number(
                item.unit_price_gross
              ),
            unit_price_override:
              String(item.sku || "")
                .trim()
                .toUpperCase() ===
              "FEX-DESPACHO"
                ? String(
                    Number(
                      item.unit_price_gross
                    ) || ""
                  )
                : null,
            is_fex_shipping:
              String(item.sku || "")
                .trim()
                .toUpperCase() ===
              "FEX-DESPACHO",
            allows_price_override:
              String(item.sku || "")
                .trim()
                .toUpperCase() ===
              "FEX-DESPACHO",
            tax_rate:
              Number(item.tax_rate || 0),
            available_pos:
              String(item.sku || "")
                .trim()
                .toUpperCase() ===
              "FEX-DESPACHO"
                ? 1
                : 999,
            from_snapshot:
              true,
          }))
        );
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "No fue posible cargar la cotización."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [quotationId]);

  useEffect(() => {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      async () => {
        try {
          setCatalogLoading(true);
          setCatalogError("");

          const response =
            await getPosProducts({
              q: query,
              limit: 30,
              signal:
                controller.signal,
            });

          setProducts(
            response?.products || []
          );
        } catch (err) {
          if (
            err?.name !==
            "AbortError"
          ) {
            setCatalogError(
              err?.message ||
                "No fue posible cargar el catálogo."
            );
          }
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setCatalogLoading(
              false
            );
          }
        }
      },
      250
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (
      products.length === 0
    ) {
      return;
    }

    const byId = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    setCart((current) =>
      current.map((item) => {
        const catalog =
          byId.get(item.id);

        if (!catalog) {
          return item;
        }

        return {
          ...item,
          is_fex_shipping:
            catalog.is_fex_shipping ??
            item.is_fex_shipping,
          allows_price_override:
            catalog.allows_price_override ??
            item.allows_price_override,
          available_pos:
            isFexShippingItem(
              catalog
            )
              ? 1
              : (
                  Number(
                    catalog.available_pos
                  ) ||
                  item.available_pos
                ),
        };
      })
    );
  }, [products]);

  const updateRut = (value) => {
    const nextValue = String(
      value || ""
    )
      .toUpperCase()
      .replace(/[^0-9K.-]/g, "");

    setCustomer((current) => ({
      ...current,
      rut: nextValue,
    }));

    setBilling((current) => ({
      ...current,
      rut: nextValue,
    }));
  };

  const addProduct = (product) => {
    setCart((current) => {
      const existing =
        current.find(
          (item) =>
            item.id === product.id
        );

      const isFex =
        isFexShippingItem(product);

      if (existing) {
        if (isFex) {
          return current;
        }

        return current.map(
          (item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity:
                    Number(
                      item.quantity
                    ) + 1,
                }
              : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
          unit_price_gross:
            isFex
              ? 0
              : Number(
                  product.base_price
                ),
          unit_price_override:
            isFex
              ? ""
              : null,
          is_fex_shipping:
            isFex,
          allows_price_override:
            isFex,
          available_pos:
            isFex
              ? 1
              : product.available_pos,
          from_snapshot: false,
        },
      ];
    });
  };

  const updateQuantity = (
    productId,
    value
  ) => {
    setCart((current) =>
      current.map((item) => {
        if (
          item.id !== productId
        ) {
          return item;
        }

        if (
          isFexShippingItem(item)
        ) {
          return {
            ...item,
            quantity: 1,
          };
        }

        const quantity = Math.min(
          999,
          Math.max(
            1,
            Number(value || 1)
          )
        );

        return {
          ...item,
          quantity,
        };
      })
    );
  };

  const updateFexPrice = (
    productId,
    rawValue
  ) => {
    const normalized =
      String(rawValue ?? "")
        .replace(
          /[^0-9]/g,
          ""
        )
        .slice(0, 9);

    setCart((current) =>
      current.map((item) =>
        item.id === productId &&
        isFexShippingItem(item)
          ? {
              ...item,
              unit_price_override:
                normalized,
              unit_price_gross:
                normalized
                  ? Number(
                      normalized
                    )
                  : 0,
            }
          : item
      )
    );
  };

  const removeProduct = (
    productId
  ) => {
    setCart((current) =>
      current.filter(
        (item) =>
          item.id !== productId
      )
    );
  };

  const save = async () => {
    if (!canEdit) {
      setError(
        "Esta cotización ya no puede editarse."
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "La cotización debe contener al menos un producto."
      );
      return;
    }

    const invalidFex =
      cart.find(
        (item) =>
          isFexShippingItem(item) &&
          !hasValidFexPrice(item)
      );

    if (invalidFex) {
      setError(
        "Ingresa el valor informado por FEX antes de guardar la cotización."
      );
      return;
    }

    const rutValidation =
      getChileanRutValidation(
        documentType === "FACTURA"
          ? billing.rut
          : customer.rut
      );

    if (!rutValidation.valid) {
      setError(
        "El RUT ingresado no es válido."
      );
      return;
    }

    if (
      documentType === "BOLETA"
    ) {
      const required = [
        [
          customer.name,
          "nombre del cliente",
        ],
        [
          customer.email,
          "correo",
        ],
        [
          customer.phone,
          "teléfono",
        ],
        [
          customer.address,
          "dirección",
        ],
      ];

      const missing =
        required.find(
          ([value]) =>
            !String(
              value || ""
            ).trim()
        );

      if (missing) {
        setError(
          `Falta ${missing[1]}.`
        );
        return;
      }

      if (
        !isValidEmail(
          customer.email
        )
      ) {
        setError(
          "El correo del cliente no es válido."
        );
        return;
      }
    } else {
      const required = [
        [
          billing.legal_name,
          "razón social",
        ],
        [
          billing.business_activity,
          "giro",
        ],
        [
          billing.billing_email,
          "correo de facturación",
        ],
        [
          billing.phone,
          "teléfono",
        ],
        [
          billing.address_line,
          "dirección",
        ],
        [
          billing.commune,
          "comuna",
        ],
        [
          billing.city,
          "ciudad",
        ],
      ];

      const missing =
        required.find(
          ([value]) =>
            !String(
              value || ""
            ).trim()
        );

      if (missing) {
        setError(
          `Falta ${missing[1]}.`
        );
        return;
      }

      if (
        !isValidEmail(
          billing.billing_email
        )
      ) {
        setError(
          "El correo de facturación no es válido."
        );
        return;
      }
    }

    if (!validUntil) {
      setError(
        "Selecciona la fecha de vigencia."
      );
      return;
    }

    if (
      isConvertingToProject &&
      !String(
        projectName ||
          ""
      ).trim()
    ) {
      setError(
        "Ingresa el nombre del proyecto antes de convertir la cotización."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await updateQuotation(
          quotationId,
          {
            document_type:
              documentType,
            customer: {
              name:
                documentType ===
                "FACTURA"
                  ? billing.legal_name
                  : customer.name,
              rut:
                rutValidation.formatted,
              email:
                documentType ===
                "FACTURA"
                  ? billing.billing_email
                  : customer.email,
              phone:
                documentType ===
                "FACTURA"
                  ? billing.phone
                  : customer.phone,
              address:
                documentType ===
                "FACTURA"
                  ? billing.address_line
                  : customer.address,
            },
            billing: {
              ...billing,
              rut:
                rutValidation.formatted,
            },
            items:
              cart.map(
                (item) => ({
                  product_id:
                    item.id,
                  quantity:
                    Number(
                      item.quantity
                    ),
                  ...(isFexShippingItem(
                    item
                  )
                    ? {
                        unit_price_override:
                          getItemUnitPrice(
                            item
                          ),
                      }
                    : {}),
                })
              ),
            valid_until:
              validUntil,
            notes:
              String(
                notes || ""
              ).trim() ||
              null,

            quotation_type:
              isConvertingToProject
                ? "PROJECT"
                : "STANDARD",

            project_name:
              isConvertingToProject
                ? String(
                    projectName ||
                      ""
                  ).trim()
                : null,

            project_reference:
              isConvertingToProject
                ? String(
                    projectReference ||
                      ""
                  ).trim() ||
                  null
                : null,

            visible_to_italy:
              isConvertingToProject &&
              visibleToItaly ===
                true,
          }
        );

      const updated =
        response?.data
          ?.quotation || null;

      setMessage(
        isConvertingToProject
          ? "Cotización convertida a Proyecto correctamente."
          : "Cotización actualizada correctamente."
      );

      if (updated) {
        setQuotation(updated);
      }

      window.setTimeout(() => {
        router.push(
          `/admin/cotizaciones/${quotationId}`
        );
        router.refresh();
      }, 650);
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible actualizar la cotización."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f5f2] p-8 text-sm text-neutral-500">
        Cargando cotización...
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="min-h-screen bg-[#f6f5f2] p-8">
        <p className="text-sm text-red-700">
          {error ||
            "Cotización no encontrada."}
        </p>
      </main>
    );
  }

  if (
    quotation.quotation_type ===
    "PROJECT"
  ) {
    return (
      <ProjectQuotationEditor
        quotationId={quotationId}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Cotizaciones
            </p>

            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
              Editar{" "}
              {quotation.quote_number}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Puedes modificar cliente, productos, cantidades, documento, vigencia y observaciones. La edición no reserva stock.
            </p>
          </div>

          <Link
            href={`/admin/cotizaciones/${quotationId}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700"
          >
            Cancelar edición
          </Link>
        </header>

        {!canEdit && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Esta cotización se encuentra en estado{" "}
            <strong>
              {quotation.status}
            </strong>{" "}
            y ya no puede editarse.
          </div>
        )}

        {quotation.status ===
          "SENT" &&
          canEdit && (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
              Esta cotización ya fue enviada. Al guardar cambios volverá a estado <strong>Borrador</strong> y deberá enviarse nuevamente.
            </div>
          )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Tipo de cotización
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
                Puedes mantener esta cotización como Comercial o convertirla a Proyecto. La conversión se realiza únicamente al guardar.
              </p>
            </div>

            {isConvertingToProject ? (
              <span className="inline-flex w-fit rounded-full bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                Proyecto
              </span>
            ) : (
              <span className="inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                Comercial
              </span>
            )}
          </div>

          <div className="mt-5 grid rounded-2xl bg-neutral-100 p-1 sm:max-w-xl sm:grid-cols-2">
            <button
              type="button"
              disabled={
                !canEdit
              }
              onClick={() => {
                setEditQuotationType(
                  "STANDARD"
                );

                setVisibleToItaly(
                  false
                );

                setError(
                  ""
                );
              }}
              className={`h-11 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                !isConvertingToProject
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              Comercial
            </button>

            <button
              type="button"
              disabled={
                !canEdit
              }
              onClick={() => {
                setEditQuotationType(
                  "PROJECT"
                );

                setError(
                  ""
                );
              }}
              className={`h-11 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isConvertingToProject
                  ? "bg-black text-white shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              Convertir a Proyecto
            </button>
          </div>

          {isConvertingToProject ? (
            <div className="mt-5 rounded-2xl border border-black/10 bg-neutral-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del proyecto *">
                  <input
                    type="text"
                    maxLength={255}
                    value={
                      projectName
                    }
                    disabled={
                      !canEdit
                    }
                    onChange={(
                      event
                    ) => {
                      setProjectName(
                        event.target.value
                      );

                      setError(
                        ""
                      );
                    }}
                    placeholder="Ej. Hotel Milano"
                    className={`${inputClass} disabled:bg-neutral-100 disabled:text-neutral-400`}
                  />
                </Field>

                <Field label="Referencia del proyecto (opcional)">
                  <input
                    type="text"
                    maxLength={255}
                    value={
                      projectReference
                    }
                    disabled={
                      !canEdit
                    }
                    onChange={(
                      event
                    ) =>
                      setProjectReference(
                        event.target.value
                      )
                    }
                    placeholder="Ej. PROY-2026-041"
                    className={`${inputClass} disabled:bg-neutral-100 disabled:text-neutral-400`}
                  />
                </Field>
              </div>

              <label
                className={`mt-4 flex items-start gap-3 rounded-2xl border border-black/10 bg-white p-4 ${
                  canEdit
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    visibleToItaly
                  }
                  disabled={
                    !canEdit
                  }
                  onChange={(
                    event
                  ) =>
                    setVisibleToItaly(
                      event.target.checked
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-black"
                />

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-950">
                    Mostrar esta cotización a Gerencia Italia
                  </span>

                  <span className="mt-1 block text-[11px] leading-4 text-neutral-500">
                    Gerencia Italia verá únicamente los productos ABET LAMINATI, las cantidades y la valorización con Precio Italia (USD).
                  </span>

                  {visibleToItaly ? (
                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Visible para Gerencia Italia
                    </span>
                  ) : null}
                </span>
              </label>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] leading-5 text-amber-800">
                  Al guardar, esta cotización dejará de ser STANDARD y pasará a PROJECT conservando el mismo número de cotización. Los productos actuales serán migrados a líneas de proyecto.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-neutral-50 px-4 py-4">
              <p className="text-xs leading-5 text-neutral-500">
                Una cotización Comercial no puede mostrarse a Gerencia Italia. Para habilitar esa opción, conviértela primero a Proyecto.
              </p>
            </div>
          )}
        </section>

        <div className="mt-6 flex flex-col gap-5">
          <section className="order-2 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-neutral-950">
              Catálogo
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              Agrega productos adicionales a la cotización.
            </p>

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Buscar por nombre o SKU"
              className="mt-4 h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
            />

            {catalogError && (
              <p className="mt-3 text-xs text-red-600">
                {catalogError}
              </p>
            )}

            <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {catalogLoading ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  Cargando productos...
                </p>
              ) : products.length ===
                0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  No hay productos para mostrar.
                </p>
              ) : (
                products.map(
                  (product) => {
                    const exists =
                      cart.some(
                        (item) =>
                          item.id ===
                          product.id
                      );

                    const isFex =
                      isFexShippingItem(
                        product
                      );

                    return (
                      <div
                        key={
                          product.id
                        }
                        className="rounded-2xl border border-black/5 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-950">
                              {
                                product.name
                              }
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              {
                                product.sku
                              }
                            </p>
                            <p className={`mt-2 text-sm font-semibold ${
                              isFex
                                ? "text-sky-700"
                                : "text-neutral-950"
                            }`}>
                              {isFex
                                ? "Precio según FEX"
                                : money(
                                    product.base_price
                                  )}
                            </p>

                            {isFex && (
                              <p className="mt-1 text-[11px] text-neutral-400">
                                Sin stock · valor editable por cotización
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              addProduct(
                                product
                              )
                            }
                            disabled={
                              isFex &&
                              exists
                            }
                            className="shrink-0 rounded-full border border-black/10 px-3 py-2 text-xs font-medium transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                          >
                            {isFex
                              ? (
                                  exists
                                    ? "Despacho agregado"
                                    : "Agregar despacho"
                                )
                              : (
                                  exists
                                    ? "+1"
                                    : "Agregar"
                                )}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </section>

          <section className="order-1 space-y-5">
            <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-neutral-950">
                  Cliente y documento
                </h2>

                <div className="flex rounded-xl bg-neutral-100 p-1">
                  {[
                    "BOLETA",
                    "FACTURA",
                  ].map(
                    (type) => (
                      <button
                        key={
                          type
                        }
                        type="button"
                        onClick={() =>
                          setDocumentType(
                            type
                          )
                        }
                        className={`h-9 rounded-lg px-4 text-xs font-medium transition ${
                          documentType ===
                          type
                            ? "bg-black text-white"
                            : "text-neutral-500"
                        }`}
                      >
                        {type ===
                        "BOLETA"
                          ? "Boleta"
                          : "Factura"}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="RUT">
                  <input
                    value={
                      documentType ===
                      "FACTURA"
                        ? billing.rut
                        : customer.rut
                    }
                    onChange={(
                      event
                    ) =>
                      updateRut(
                        event
                          .target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {documentType ===
                "BOLETA" ? (
                  <>
                    <Field label="Nombre del cliente">
                      <input
                        value={
                          customer.name
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomer(
                            (
                              current
                            ) => ({
                              ...current,
                              name:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Correo">
                      <input
                        type="email"
                        value={
                          customer.email
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomer(
                            (
                              current
                            ) => ({
                              ...current,
                              email:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Teléfono">
                      <input
                        value={
                          customer.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomer(
                            (
                              current
                            ) => ({
                              ...current,
                              phone:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Dirección">
                        <input
                          value={
                            customer.address
                          }
                          onChange={(
                            event
                          ) =>
                            setCustomer(
                              (
                                current
                              ) => ({
                                ...current,
                                address:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Razón social">
                      <input
                        value={
                          billing.legal_name
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              legal_name:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Nombre de fantasía">
                      <input
                        value={
                          billing.trade_name
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              trade_name:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Giro">
                      <input
                        value={
                          billing.business_activity
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              business_activity:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Correo de facturación">
                      <input
                        type="email"
                        value={
                          billing.billing_email
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              billing_email:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Teléfono">
                      <input
                        value={
                          billing.phone
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              phone:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Dirección">
                      <input
                        value={
                          billing.address_line
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              address_line:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Comuna">
                      <input
                        value={
                          billing.commune
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              commune:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Ciudad">
                      <input
                        value={
                          billing.city
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              city:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>

                    <Field label="Región">
                      <input
                        value={
                          billing.region
                        }
                        onChange={(
                          event
                        ) =>
                          setBilling(
                            (
                              current
                            ) => ({
                              ...current,
                              region:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-950">
                    Productos cotizados
                  </h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Los productos existentes conservan su precio unitario original.
                  </p>
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                  {cart.length} producto
                  {cart.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>

              <div className="mt-4 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5">
                {cart.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="grid gap-3 p-4 sm:grid-cols-[1fr_115px_100px_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
                          {
                            item.sku
                          }
                        </p>
                        <p className="mt-1 text-sm font-medium text-neutral-950">
                          {item.name ||
                            item.product_name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {isFexShippingItem(
                            item
                          )
                            ? "Despacho · valor informado por FEX"
                            : (
                                <>
                                  {money(
                                    item.unit_price_gross ??
                                      item.base_price
                                  )}{" "}
                                  c/u
                                  {item.from_snapshot
                                    ? " · precio guardado"
                                    : " · precio actual"}
                                </>
                              )}
                        </p>
                      </div>

                      {isFexShippingItem(
                        item
                      ) ? (
                        <div className="flex h-10 items-center rounded-xl border border-sky-200 bg-sky-50/40 px-3 focus-within:border-sky-500">
                          <span className="text-xs text-neutral-400">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.unit_price_override ??
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateFexPrice(
                                item.id,
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Valor FEX"
                            className="h-full min-w-0 flex-1 bg-transparent px-1 text-right text-sm font-medium outline-none"
                          />
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          max="999"
                          step="1"
                          value={
                            item.quantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateQuantity(
                              item.id,
                              event
                                .target
                                .value
                            )
                          }
                          className="h-10 rounded-xl border border-black/10 px-3 text-center text-sm outline-none focus:border-black"
                        />
                      )}

                      <p className={`text-right text-sm font-semibold ${
                        isFexShippingItem(
                          item
                        ) &&
                        !hasValidFexPrice(
                          item
                        )
                          ? "text-sky-700"
                          : "text-neutral-950"
                      }`}>
                        {isFexShippingItem(
                          item
                        ) &&
                        !hasValidFexPrice(
                          item
                        )
                          ? "Ingresa valor"
                          : money(
                              getItemUnitPrice(
                                item
                              ) *
                                Number(
                                  item.quantity
                                )
                            )}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          removeProduct(
                            item.id
                          )
                        }
                        className="h-9 rounded-full px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  )
                )}

                {cart.length === 0 && (
                  <div className="p-8 text-center text-sm text-neutral-400">
                    Agrega al menos un producto.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="order-3 space-y-5">
            <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-neutral-950">
                Resumen
              </h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Neto aprox.</span>
                  <span>
                    {money(
                      netTotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-500">
                  <span>IVA incluido</span>
                  <span>
                    {money(
                      taxTotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-t border-black/5 pt-3 text-lg font-semibold text-neutral-950">
                  <span>Total</span>
                  <span>
                    {money(total)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <Field label="Válida hasta">
                <input
                  type="date"
                  value={
                    validUntil
                  }
                  onChange={(
                    event
                  ) =>
                    setValidUntil(
                      event
                        .target
                        .value
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Field>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Observaciones
                </span>

                <textarea
                  value={notes}
                  onChange={(
                    event
                  ) =>
                    setNotes(
                      event
                        .target
                        .value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-black"
                  placeholder="Condiciones u observaciones de la cotización"
                />
              </label>

              <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-xs leading-5 text-neutral-500">
                Guardar cambios no crea una venta, no reserva stock y no emite ningún DTE.
              </div>

              <button
                type="button"
                onClick={save}
                disabled={
                  saving ||
                  !canEdit ||
                  cart.length === 0
                }
                className="mt-5 h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
              >
                {saving
                  ? "Guardando..."
                  : isConvertingToProject
                    ? "Guardar y convertir a Proyecto"
                    : "Guardar cambios"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
