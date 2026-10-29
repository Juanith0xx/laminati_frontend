"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createProjectQuotation,
  getProjectQuotationProducts,
  getQuotation,
  searchRelbaseCustomers,
  updateProjectQuotation,
} from "@/services/showroom.service";

const INPUT =
  "h-11 w-full rounded-2xl border border-black/10 bg-white px-3.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black/20 focus:ring-4 focus:ring-black/[.04]";

const LABEL =
  "mb-2 block text-xs font-semibold text-neutral-700";

const ABET_BRAND =
  "ABET LAMINATI";

const EMPTY_CUSTOMER = {
  relbase_customer_id: "",
  rut: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  legal_name: "",
  trade_name: "",
  business_activity: "",
  billing_email: "",
  billing_phone: "",
  address_line: "",
  commune: "",
  city: "",
  region: "",
  country: "Chile",
};

const emptyLine = (
  lineType = "PRODUCT"
) => ({
  local_id:
    `${Date.now()}-${Math.random()}`,
  line_type:
    lineType,
  product_id:
    null,
  description:
    "",
  code:
    "",
  brand:
    lineType === "PRODUCT"
      ? ""
      : null,
  collection:
    lineType === "PRODUCT"
      ? ""
      : null,
  italy_price_usd:
    "",
  finish:
    "",
  thickness_mm:
    "",
  quantity:
    "1",
  unit:
    "UN",
  format_label:
    "",
  width_cm:
    "",
  height_cm:
    "",
  pricing_mode:
    "UNIT",
  price_m2_gross:
    "",
  unit_price_gross:
    "",
  line_total_gross:
    "",
  tax_rate:
    "19",
});

const clean = (
  value
) =>
  String(
    value ?? ""
  ).trim();

const numberOrNull = (
  value
) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};

const money = (
  value
) =>
  new Intl.NumberFormat(
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
    Number(value || 0)
  );

const usd = (
  value
) =>
  new Intl.NumberFormat(
    "es-CL",
    {
      style:
        "currency",
      currency:
        "USD",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        4,
    }
  ).format(
    Number(value || 0)
  );

const extractProducts = (
  response
) => {
  if (
    Array.isArray(
      response?.products
    )
  ) {
    return response.products;
  }

  if (
    Array.isArray(
      response?.data?.products
    )
  ) {
    return response.data.products;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
};

const extractCustomers = (
  response
) => {
  if (
    Array.isArray(
      response?.customers
    )
  ) {
    return response.customers;
  }

  if (
    Array.isArray(
      response?.data?.customers
    )
  ) {
    return response.data.customers;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
};

const mapCustomer = (
  source = {}
) => {
  const relbaseId =
    source.relbase_customer_id ??
    source.customer_id ??
    source.id ??
    "";

  const name =
    source.name ??
    source.customer_name ??
    source.legal_name ??
    source.business_name ??
    "";

  const email =
    source.email ??
    source.email_commercial ??
    source.billing_email ??
    "";

  const phone =
    source.phone ??
    source.mobile ??
    source.billing_phone ??
    "";

  const address =
    source.address ??
    source.address_line ??
    source.street ??
    "";

  return {
    relbase_customer_id:
      clean(
        relbaseId
      ),
    rut:
      clean(
        source.rut
      ),
    name:
      clean(
        name
      ),
    email:
      clean(
        email
      ),
    phone:
      clean(
        phone
      ),
    address:
      clean(
        address
      ),
    legal_name:
      clean(
        source.legal_name ??
        source.business_name ??
        name
      ),
    trade_name:
      clean(
        source.trade_name ??
        source.name_fantasy
      ),
    business_activity:
      clean(
        source.business_activity ??
        source.activity ??
        source.giro
      ),
    billing_email:
      clean(
        source.billing_email ??
        email
      ),
    billing_phone:
      clean(
        source.billing_phone ??
        phone
      ),
    address_line:
      clean(
        source.address_line ??
        address
      ),
    commune:
      clean(
        source.commune ??
        source.comuna
      ),
    city:
      clean(
        source.city ??
        source.ciudad
      ),
    region:
      clean(
        source.region
      ),
    country:
      clean(
        source.country ??
        "Chile"
      ) ||
      "Chile",
  };
};

const mapProductToLine = (
  product
) => ({
  ...emptyLine(
    "PRODUCT"
  ),
  product_id:
    product?.id ||
    product?.product_id ||
    null,
  description:
    clean(
      product?.name
    ),
  code:
    clean(
      product?.internal_code ||
      product?.sku
    ),
  brand:
    clean(
      product?.brand
    ),
  collection:
    clean(
      product?.collection
    ),
  finish:
    clean(
      product?.finish
    ),
  thickness_mm:
    product?.thickness_mm ??
    "",
  width_cm:
    product?.width_mm !==
      undefined &&
    product?.width_mm !==
      null
      ? String(
          Number(
            product.width_mm
          ) /
            10
        )
      : "",
  height_cm:
    product?.height_mm !==
      undefined &&
    product?.height_mm !==
      null
      ? String(
          Number(
            product.height_mm
          ) /
            10
        )
      : "",
  format_label:
    product?.width_mm &&
    product?.height_mm
      ? `${Number(
          product.width_mm
        ) /
          10} × ${Number(
          product.height_mm
        ) /
          10} cm`
      : "",
  unit_price_gross:
    product?.base_price ??
    "",
  italy_price_usd:
    product?.italy_price_usd ??
    product?.price_usd ??
    "",
});

const mapExistingLine = (
  line
) => ({
  local_id:
    line.id ||
    `${Date.now()}-${Math.random()}`,
  line_type:
    line.line_type ||
    "PRODUCT",
  product_id:
    line.product_id ||
    null,
  description:
    line.description ||
    "",
  code:
    line.code ||
    "",
  brand:
    line.brand ||
    "",
  collection:
    line.collection ||
    "",
  italy_price_usd:
    line.italy_price_usd ??
    "",
  finish:
    line.finish ||
    "",
  thickness_mm:
    line.thickness_mm ??
    "",
  quantity:
    line.quantity ??
    "1",
  unit:
    line.unit ||
    "UN",
  format_label:
    line.format_label ||
    "",
  width_cm:
    line.width_cm ??
    "",
  height_cm:
    line.height_cm ??
    "",
  pricing_mode:
    line.pricing_mode ||
    "UNIT",
  price_m2_gross:
    line.price_m2_gross ??
    "",
  unit_price_gross:
    line.unit_price_gross ??
    "",
  line_total_gross:
    line.line_total_gross ??
    "",
  tax_rate:
    line.tax_rate ??
    "19",
});

const calculateLineTotal = (
  line
) => {
  const quantity =
    Number(
      line.quantity ||
        0
    );

  if (
    line.pricing_mode ===
    "TOTAL"
  ) {
    return Number(
      line.line_total_gross ||
        0
    );
  }

  if (
    line.pricing_mode ===
    "AREA"
  ) {
    const width =
      Number(
        line.width_cm ||
          0
      );

    const height =
      Number(
        line.height_cm ||
          0
      );

    const m2 =
      Number(
        line.price_m2_gross ||
          0
      );

    return (
      quantity *
      (width / 100) *
      (height / 100) *
      m2
    );
  }

  return (
    quantity *
    Number(
      line.unit_price_gross ||
        0
    )
  );
};

function Section({
  title,
  eyebrow,
  children,
  action,
}) {
  return (
    <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-1 text-lg font-semibold text-neutral-950">
            {title}
          </h2>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
  hint,
}) {
  return (
    <label className="block">
      <span className={LABEL}>
        {label}
      </span>

      {children}

      {hint ? (
        <span className="mt-1 block text-[11px] leading-4 text-neutral-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function LineEditor({
  line,
  index,
  onChange,
  onRemove,
}) {
  const isProduct =
    line.line_type ===
    "PRODUCT";

  const total =
    calculateLineTotal(
      line
    );

  const update =
    (
      key,
      value
    ) => {
      onChange({
        ...line,
        [key]:
          value,
      });
    };

  return (
    <article className="rounded-[22px] border border-black/5 bg-neutral-50/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
            {index + 1}
          </span>

          <select
            className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            value={
              line.line_type
            }
            onChange={(
              event
            ) => {
              const type =
                event.target
                  .value;

              onChange({
                ...emptyLine(
                  type
                ),
                local_id:
                  line.local_id,
              });
            }}
          >
            <option value="PRODUCT">
              Producto
            </option>
            <option value="SERVICE">
              Servicio
            </option>
            <option value="OTHER">
              Otro
            </option>
          </select>

          {line.product_id ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Catálogo
            </span>
          ) : isProduct ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Manual
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="text-sm font-medium text-red-400 hover:text-red-600"
          onClick={
            onRemove
          }
        >
          Quitar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Field
          label={
            isProduct
              ? "Producto"
              : "Descripción"
          }
        >
          <input
            className={`${INPUT} lg:col-span-2`}
            value={
              line.description
            }
            onChange={(
              event
            ) =>
              update(
                "description",
                event.target
                  .value
              )
            }
            placeholder={
              isProduct
                ? "Nombre del producto"
                : "Descripción del concepto"
            }
          />
        </Field>

        {isProduct ? (
          <>
            <Field label="Código">
              <input
                className={INPUT}
                value={
                  line.code
                }
                onChange={(
                  event
                ) =>
                  update(
                    "code",
                    event.target
                      .value
                  )
                }
                placeholder="Ej. 668R"
              />
            </Field>

            <Field label="Marca">
              <input
                className={INPUT}
                list={`brands-${line.local_id}`}
                value={
                  line.brand
                }
                onChange={(
                  event
                ) =>
                  update(
                    "brand",
                    event.target
                      .value
                  )
                }
                placeholder="ABET LAMINATI"
              />

              <datalist
                id={`brands-${line.local_id}`}
              >
                <option value="ABET LAMINATI" />
                <option value="KARIKAL" />
              </datalist>
            </Field>

            <Field label="Colección">
              <input
                className={INPUT}
                value={
                  line.collection
                }
                onChange={(
                  event
                ) =>
                  update(
                    "collection",
                    event.target
                      .value
                  )
                }
                placeholder="Ej. Colours / Italia"
              />
            </Field>

            <Field label="Acabado">
              <input
                className={INPUT}
                value={
                  line.finish
                }
                onChange={(
                  event
                ) =>
                  update(
                    "finish",
                    event.target
                      .value
                  )
                }
              />
            </Field>

            <Field label="Espesor mm">
              <input
                className={INPUT}
                type="number"
                step="0.01"
                min="0"
                value={
                  line.thickness_mm
                }
                onChange={(
                  event
                ) =>
                  update(
                    "thickness_mm",
                    event.target
                      .value
                  )
                }
              />
            </Field>
          </>
        ) : null}

        <Field label="Cantidad">
          <input
            className={INPUT}
            type="number"
            min="0.001"
            step="0.001"
            value={
              line.quantity
            }
            onChange={(
              event
            ) =>
              update(
                "quantity",
                event.target
                  .value
              )
            }
          />
        </Field>

        <Field label="Unidad">
          <input
            className={INPUT}
            value={
              line.unit
            }
            onChange={(
              event
            ) =>
              update(
                "unit",
                event.target
                  .value
              )
            }
          />
        </Field>

        {isProduct ? (
          <>
            <Field label="Formato">
              <input
                className={INPUT}
                value={
                  line.format_label
                }
                onChange={(
                  event
                ) =>
                  update(
                    "format_label",
                    event.target
                      .value
                  )
                }
                placeholder="Ej. 130 × 305 cm"
              />
            </Field>

            <Field label="Ancho cm">
              <input
                className={INPUT}
                type="number"
                step="0.01"
                min="0"
                value={
                  line.width_cm
                }
                onChange={(
                  event
                ) =>
                  update(
                    "width_cm",
                    event.target
                      .value
                  )
                }
              />
            </Field>

            <Field label="Alto cm">
              <input
                className={INPUT}
                type="number"
                step="0.01"
                min="0"
                value={
                  line.height_cm
                }
                onChange={(
                  event
                ) =>
                  update(
                    "height_cm",
                    event.target
                      .value
                  )
                }
              />
            </Field>
          </>
        ) : null}

        <Field label="Modo de precio">
          <select
            className={INPUT}
            value={
              line.pricing_mode
            }
            onChange={(
              event
            ) =>
              update(
                "pricing_mode",
                event.target
                  .value
              )
            }
          >
            <option value="UNIT">
              Unitario
            </option>

            {isProduct ? (
              <option value="AREA">
                Por m²
              </option>
            ) : null}

            <option value="TOTAL">
              Total manual
            </option>
          </select>
        </Field>

        {line.pricing_mode ===
        "AREA" ? (
          <Field label="Valor m²">
            <input
              className={INPUT}
              type="number"
              step="1"
              min="0"
              value={
                line.price_m2_gross
              }
              onChange={(
                event
              ) =>
                update(
                  "price_m2_gross",
                  event.target
                    .value
                )
              }
            />
          </Field>
        ) : null}

        {line.pricing_mode ===
        "UNIT" ? (
          <Field label="Valor unitario">
            <input
              className={INPUT}
              type="number"
              step="1"
              min="0"
              value={
                line.unit_price_gross
              }
              onChange={(
                event
              ) =>
                update(
                  "unit_price_gross",
                  event.target
                    .value
                )
              }
            />
          </Field>
        ) : null}

        {line.pricing_mode ===
        "TOTAL" ? (
          <Field label="Total manual">
            <input
              className={INPUT}
              type="number"
              step="1"
              min="0"
              value={
                line.line_total_gross
              }
              onChange={(
                event
              ) =>
                update(
                  "line_total_gross",
                  event.target
                    .value
                )
              }
            />
          </Field>
        ) : null}

        <Field
          label={
            isProduct
              ? "Precio Italia USD"
              : "Valor Italia USD"
          }
          hint={
            isProduct
              ? (
                  line.product_id
                    ? "Opcional. Si queda vacío, el backend usa el Precio Italia activo del catálogo."
                    : "Opcional. Para productos manuales se guarda como snapshot privado de esta cotización."
                )
              : "Opcional. Para fletes, servicios u otros conceptos ingresa el valor unitario USD que verá Gerencia Italia. Queda congelado en esta cotización."
          }
        >
          <input
            className={INPUT}
            type="number"
            step="0.0001"
            min="0"
            value={
              line.italy_price_usd
            }
            onChange={(
              event
            ) =>
              update(
                "italy_price_usd",
                event.target
                  .value
              )
            }
            placeholder={
              isProduct
                ? "Ej. 32.5000"
                : "Ej. 750.0000"
            }
          />
        </Field>

        <Field label="Total línea">
          <div className="flex min-h-11 items-center rounded-2xl border border-black/10 bg-white px-3.5 text-sm font-semibold text-neutral-900">
            {money(
              total
            )}
          </div>
        </Field>
      </div>

      {(
        (
          isProduct &&
          clean(
            line.brand
          ).toUpperCase() ===
            ABET_BRAND
        ) ||
        !isProduct
      ) &&
      line.italy_price_usd ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">
          {isProduct
            ? "Valor Italia de esta línea: "
            : "Valor Italia de este concepto: "}
          <strong>
            {usd(
              Number(
                line.italy_price_usd
              ) *
                Number(
                  line.quantity ||
                    0
                )
            )}
          </strong>
        </div>
      ) : null}
    </article>
  );
}

export default function ProjectQuotationEditor({
  quotationId = null,
}) {
  const router =
    useRouter();

  const editing =
    Boolean(
      quotationId
    );

  const [
    projectName,
    setProjectName,
  ] = useState(
    ""
  );

  const [
    projectReference,
    setProjectReference,
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
    validDays,
    setValidDays,
  ] = useState(
    "7"
  );

  const [
    validUntil,
    setValidUntil,
  ] = useState(
    ""
  );

  const [
    visibleToItaly,
    setVisibleToItaly,
  ] = useState(
    false
  );

  const [
    notes,
    setNotes,
  ] = useState(
    ""
  );

  const [
    customer,
    setCustomer,
  ] = useState(
    EMPTY_CUSTOMER
  );

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState(
    ""
  );

  const [
    customerResults,
    setCustomerResults,
  ] = useState(
    []
  );

  const [
    customerLoading,
    setCustomerLoading,
  ] = useState(
    false
  );

  const [
    productSearch,
    setProductSearch,
  ] = useState(
    ""
  );

  const [
    productResults,
    setProductResults,
  ] = useState(
    []
  );

  const [
    productLoading,
    setProductLoading,
  ] = useState(
    false
  );

  const [
    lines,
    setLines,
  ] = useState([
    emptyLine(
      "PRODUCT"
    ),
  ]);

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    loading,
    setLoading,
  ] = useState(
    editing
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const grossTotal =
    useMemo(
      () =>
        lines.reduce(
          (
            total,
            line
          ) =>
            total +
            calculateLineTotal(
              line
            ),
          0
        ),
      [
        lines,
      ]
    );

  const italyTotal =
    useMemo(
      () =>
        lines.reduce(
          (
            total,
            line
          ) => {
            const isItalyProduct =
              line.line_type ===
                "PRODUCT" &&
              clean(
                line.brand
              ).toUpperCase() ===
                ABET_BRAND;

            const isItalyConcept =
              line.line_type ===
                "SERVICE" ||
              line.line_type ===
                "OTHER";

            if (
              !isItalyProduct &&
              !isItalyConcept
            ) {
              return total;
            }

            const price =
              numberOrNull(
                line.italy_price_usd
              );

            if (
              price ===
              null
            ) {
              return total;
            }

            return (
              total +
              price *
                Number(
                  line.quantity ||
                    0
                )
            );
          },
          0
        ),
      [
        lines,
      ]
    );

  useEffect(
    () => {
      if (
        !editing
      ) {
        return;
      }

      let active =
        true;

      const load =
        async () => {
          try {
            setLoading(
              true
            );

            const response =
              await getQuotation(
                quotationId
              );

            const data =
              response?.data ||
              {};

            const quote =
              data.quotation ||
              {};

            if (
              !active
            ) {
              return;
            }

            setProjectName(
              quote.project_name ||
                ""
            );

            setProjectReference(
              quote.project_reference ||
                ""
            );

            setDocumentType(
              quote.intended_document_type ||
                "BOLETA"
            );

            setValidUntil(
              String(
                quote.valid_until ||
                  ""
              ).slice(
                0,
                10
              )
            );

            setVisibleToItaly(
              Boolean(
                quote.visible_to_italy
              )
            );

            setNotes(
              quote.notes ||
                ""
            );

            setCustomer({
              relbase_customer_id:
                quote.relbase_customer_id ||
                "",
              rut:
                quote.rut ||
                "",
              name:
                quote.customer_name ||
                "",
              email:
                quote.email ||
                "",
              phone:
                quote.phone ||
                "",
              address:
                quote.address_line ||
                "",
              legal_name:
                quote.legal_name ||
                quote.customer_name ||
                "",
              trade_name:
                quote.trade_name ||
                "",
              business_activity:
                quote.business_activity ||
                "",
              billing_email:
                quote.email ||
                "",
              billing_phone:
                quote.phone ||
                "",
              address_line:
                quote.address_line ||
                "",
              commune:
                quote.commune ||
                "",
              city:
                quote.city ||
                "",
              region:
                quote.region ||
                "",
              country:
                quote.country ||
                "Chile",
            });

            const existingLines =
              Array.isArray(
                data.project_lines
              )
                ? data.project_lines
                : [];

            setLines(
              existingLines.length
                ? existingLines.map(
                    mapExistingLine
                  )
                : [
                    emptyLine(
                      "PRODUCT"
                    ),
                  ]
            );
          } catch (
            loadError
          ) {
            setError(
              loadError?.message ||
                "No fue posible cargar la cotización."
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

      load();

      return () => {
        active =
          false;
      };
    },
    [
      editing,
      quotationId,
    ]
  );

  useEffect(
    () => {
      const query =
        clean(
          customerSearch
        );

      if (
        query.length <
        2
      ) {
        setCustomerResults(
          []
        );

        return;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            try {
              setCustomerLoading(
                true
              );

              const response =
                await searchRelbaseCustomers({
                  q:
                    query,
                  limit:
                    8,
                  signal:
                    controller.signal,
                });

              setCustomerResults(
                extractCustomers(
                  response
                )
              );
            } catch (
              searchError
            ) {
              if (
                searchError?.name !==
                "AbortError"
              ) {
                console.error(
                  searchError
                );
              }
            } finally {
              setCustomerLoading(
                false
              );
            }
          },
          300
        );

      return () => {
        controller.abort();
        window.clearTimeout(
          timer
        );
      };
    },
    [
      customerSearch,
    ]
  );

  useEffect(
    () => {
      const query =
        clean(
          productSearch
        );

      if (
        query.length <
        2
      ) {
        setProductResults(
          []
        );

        return;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            try {
              setProductLoading(
                true
              );

              const response =
                await getProjectQuotationProducts({
                  q:
                    query,
                  limit:
                    12,
                  signal:
                    controller.signal,
                });

              setProductResults(
                extractProducts(
                  response
                )
              );
            } catch (
              searchError
            ) {
              if (
                searchError?.name !==
                "AbortError"
              ) {
                console.error(
                  searchError
                );
              }
            } finally {
              setProductLoading(
                false
              );
            }
          },
          300
        );

      return () => {
        controller.abort();
        window.clearTimeout(
          timer
        );
      };
    },
    [
      productSearch,
    ]
  );

  const selectCustomer =
    (
      selected
    ) => {
      setCustomer(
        mapCustomer(
          selected
        )
      );

      setCustomerSearch(
        ""
      );

      setCustomerResults(
        []
      );
    };

  const updateCustomer =
    (
      key,
      value
    ) =>
      setCustomer(
        (
          current
        ) => ({
          ...current,
          [key]:
            value,
        })
      );

  const addCatalogProduct =
    (
      product
    ) => {
      setLines(
        (
          current
        ) => [
          ...current,
          mapProductToLine(
            product
          ),
        ]
      );

      setProductSearch(
        ""
      );

      setProductResults(
        []
      );
    };

  const addLine =
    (
      type
    ) =>
      setLines(
        (
          current
        ) => [
          ...current,
          emptyLine(
            type
          ),
        ]
      );

  const updateLine =
    (
      index,
      next
    ) =>
      setLines(
        (
          current
        ) =>
          current.map(
            (
              line,
              lineIndex
            ) =>
              lineIndex ===
              index
                ? next
                : line
          )
      );

  const removeLine =
    (
      index
    ) =>
      setLines(
        (
          current
        ) =>
          current.filter(
            (
              _,
              lineIndex
            ) =>
              lineIndex !==
              index
          )
      );

  const validate =
    () => {
      if (
        !clean(
          projectName
        )
      ) {
        return "Ingresa el nombre del proyecto.";
      }

      if (
        !clean(
          customer.rut
        ) ||
        !clean(
          customer.name
        ) ||
        !clean(
          customer.email
        ) ||
        !clean(
          customer.phone
        ) ||
        !clean(
          customer.address
        )
      ) {
        return "Completa RUT, nombre, correo, teléfono y dirección del cliente.";
      }

      if (
        documentType ===
          "FACTURA" &&
        (
          !clean(
            customer.legal_name
          ) ||
          !clean(
            customer.business_activity
          ) ||
          !clean(
            customer.commune
          ) ||
          !clean(
            customer.city
          )
        )
      ) {
        return "Para Factura completa razón social, giro, comuna y ciudad.";
      }

      if (
        lines.length ===
        0
      ) {
        return "Agrega al menos una línea al proyecto.";
      }

      for (
        let index = 0;
        index <
        lines.length;
        index += 1
      ) {
        const line =
          lines[index];

        if (
          !clean(
            line.description
          )
        ) {
          return `Completa la descripción de la línea ${index + 1}.`;
        }

        if (
          Number(
            line.quantity
          ) <=
          0
        ) {
          return `La cantidad de la línea ${index + 1} debe ser mayor a 0.`;
        }

        if (
          line.line_type ===
            "PRODUCT" &&
          !line.product_id &&
          !clean(
            line.code
          )
        ) {
          return `Ingresa el código del producto manual en la línea ${index + 1}.`;
        }

        if (
          line.line_type ===
            "PRODUCT" &&
          !clean(
            line.brand
          )
        ) {
          return `Selecciona o ingresa la marca del producto en la línea ${index + 1}.`;
        }

      }

      return "";
    };

  const buildPayload =
    () => ({
      quotation_type:
        "PROJECT",
      project_name:
        clean(
          projectName
        ),
      project_reference:
        clean(
          projectReference
        ) ||
        null,
      visible_to_italy:
        visibleToItaly,
      document_type:
        documentType,
      ...(editing
        ? {
            valid_until:
              validUntil,
          }
        : {
            valid_days:
              Number(
                validDays
              ),
          }),
      notes:
        clean(
          notes
        ) ||
        null,
      customer: {
        rut:
          clean(
            customer.rut
          ),
        name:
          clean(
            customer.name
          ),
        email:
          clean(
            customer.email
          ),
        phone:
          clean(
            customer.phone
          ),
        address:
          clean(
            customer.address
          ),
      },
      billing: {
        rut:
          clean(
            customer.rut
          ),
        legal_name:
          clean(
            customer.legal_name ||
            customer.name
          ),
        trade_name:
          clean(
            customer.trade_name
          ) ||
          null,
        business_activity:
          clean(
            customer.business_activity
          ),
        billing_email:
          clean(
            customer.billing_email ||
            customer.email
          ),
        phone:
          clean(
            customer.billing_phone ||
            customer.phone
          ),
        address_line:
          clean(
            customer.address_line ||
            customer.address
          ),
        commune:
          clean(
            customer.commune
          ),
        city:
          clean(
            customer.city
          ),
        region:
          clean(
            customer.region
          ),
        country:
          clean(
            customer.country ||
            "Chile"
          ),
        relbase_customer_id:
          clean(
            customer.relbase_customer_id
          ) ||
          null,
      },
      lines:
        lines.map(
          (
            line,
            index
          ) => ({
            line_type:
              line.line_type,
            product_id:
              line.product_id ||
              null,
            description:
              clean(
                line.description
              ),
            code:
              clean(
                line.code
              ) ||
              null,
            brand:
              line.line_type ===
                "PRODUCT"
                ? clean(
                    line.brand
                  ) ||
                  null
                : null,
            collection:
              line.line_type ===
                "PRODUCT"
                ? clean(
                    line.collection
                  ) ||
                  null
                : null,
            italy_price_usd:
              numberOrNull(
                line.italy_price_usd
              ),
            finish:
              clean(
                line.finish
              ) ||
              null,
            thickness_mm:
              numberOrNull(
                line.thickness_mm
              ),
            quantity:
              Number(
                line.quantity
              ),
            unit:
              clean(
                line.unit ||
                "UN"
              ),
            format_label:
              clean(
                line.format_label
              ) ||
              null,
            width_cm:
              numberOrNull(
                line.width_cm
              ),
            height_cm:
              numberOrNull(
                line.height_cm
              ),
            price_m2_gross:
              line.pricing_mode ===
                "AREA"
                ? numberOrNull(
                    line.price_m2_gross
                  )
                : null,
            unit_price_gross:
              line.pricing_mode ===
                "UNIT"
                ? numberOrNull(
                    line.unit_price_gross
                  )
                : null,
            line_total_gross:
              line.pricing_mode ===
                "TOTAL"
                ? numberOrNull(
                    line.line_total_gross
                  )
                : null,
            tax_rate:
              numberOrNull(
                line.tax_rate
              ) ??
              19,
            pricing_mode:
              line.pricing_mode,
            sort_order:
              index,
          })
        ),
    });

  const save =
    async () => {
      const validationError =
        validate();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        const payload =
          buildPayload();

        const response =
          editing
            ? await updateProjectQuotation(
                quotationId,
                payload
              )
            : await createProjectQuotation(
                payload
              );

        const savedId =
          response?.data
            ?.quotation
            ?.id ||
          quotationId;

        if (
          savedId
        ) {
          router.push(
            `/admin/showroom/cotizaciones/${savedId}`
          );

          return;
        }

        router.push(
          "/admin/showroom/cotizaciones"
        );
      } catch (
        saveError
      ) {
        console.error(
          "Error guardando cotización de proyecto:",
          saveError
        );

        setError(
          saveError?.message ||
            "No fue posible guardar la cotización de proyecto."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  if (
    loading
  ) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[26px] border border-black/5 bg-white p-6 text-sm text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          Cargando cotización de proyecto...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
        <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
        <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Laminati · Backoffice
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
              {editing
                ? "Editar cotización de proyecto"
                : "Nueva cotización de proyecto"}
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
              Los productos pueden venir del catálogo o ingresarse manualmente. El Precio Italia se guarda como snapshot privado para Gerencia Italia.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="h-11 rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                save
              }
              className="h-11 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear cotización"}
            </button>
          </div>
        </div>
      </section>

        {error ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            {error}
          </div>
        ) : null}

      <div className="space-y-5">
          <Section
            eyebrow="Proyecto"
            title="Datos de la cotización"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Nombre del proyecto">
                <input
                  className={INPUT}
                  value={
                    projectName
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectName(
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              <Field label="Referencia">
                <input
                  className={INPUT}
                  value={
                    projectReference
                  }
                  onChange={(
                    event
                  ) =>
                    setProjectReference(
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              {editing ? (
                <Field label="Válida hasta">
                  <input
                    className={INPUT}
                    type="date"
                    value={
                      validUntil
                    }
                    onChange={(
                      event
                    ) =>
                      setValidUntil(
                        event.target
                          .value
                      )
                    }
                  />
                </Field>
              ) : (
                <Field label="Vigencia">
                  <select
                    className={INPUT}
                    value={
                      validDays
                    }
                    onChange={(
                      event
                    ) =>
                      setValidDays(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="7">
                      7 días
                    </option>
                    <option value="15">
                      15 días
                    </option>
                    <option value="30">
                      30 días
                    </option>
                  </select>
                </Field>
              )}
            </div>

            <div className="mt-4">
              <span className={LABEL}>
                Tipo de documento
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "BOLETA",
                  "FACTURA",
                ].map(
                  (
                    type
                  ) => (
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
                      className={`h-11 rounded-2xl border px-4 text-sm font-semibold transition ${
                        documentType ===
                        type
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-neutral-700 hover:bg-neutral-50"
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

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[22px] border border-black/5 bg-neutral-50/70 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={
                  visibleToItaly
                }
                onChange={(
                  event
                ) =>
                  setVisibleToItaly(
                    event.target
                      .checked
                  )
                }
              />

              <span>
                <strong className="block text-sm text-neutral-900">
                  Mostrar esta cotización a Gerencia Italia
                </strong>

                <span className="mt-1 block text-xs leading-5 text-neutral-500">
                  Gerencia verá sólo líneas PRODUCT de ABET LAMINATI y únicamente su valorización en USD. No verá precios comerciales de Chile.
                </span>
              </span>
            </label>
          </Section>

          <Section
            eyebrow="Cliente"
            title="Datos del cliente"
          >
            <div className="relative">
              <Field label="Buscar cliente en Relbase por nombre o RUT">
                <input
                  className={INPUT}
                  value={
                    customerSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ej. Juan Estay o 18.083.379-K"
                />
              </Field>

              {customerLoading ? (
                <p className="mt-2 text-xs text-neutral-400">
                  Buscando...
                </p>
              ) : null}

              {customerResults.length >
              0 ? (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-[22px] border border-black/10 bg-white p-2 shadow-xl">
                  {customerResults.map(
                    (
                      item,
                      index
                    ) => (
                      <button
                        key={
                          item.id ||
                          item.customer_id ||
                          `${item.rut}-${index}`
                        }
                        type="button"
                        onClick={() =>
                          selectCustomer(
                            item
                          )
                        }
                        className="block w-full rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-50"
                      >
                        <strong className="block text-sm text-neutral-900">
                          {item.name ||
                            item.legal_name ||
                            item.business_name ||
                            "Cliente"}
                        </strong>

                        <span className="mt-1 block text-xs text-neutral-500">
                          {item.rut ||
                            "Sin RUT"}
                        </span>
                      </button>
                    )
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="RUT cliente">
                <input
                  className={INPUT}
                  value={
                    customer.rut
                  }
                  onChange={(
                    event
                  ) =>
                    updateCustomer(
                      "rut",
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              <Field label="Nombre">
                <input
                  className={INPUT}
                  value={
                    customer.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateCustomer(
                      "name",
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              <Field label="Correo">
                <input
                  className={INPUT}
                  type="email"
                  value={
                    customer.email
                  }
                  onChange={(
                    event
                  ) =>
                    updateCustomer(
                      "email",
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              <Field label="Teléfono">
                <input
                  className={INPUT}
                  value={
                    customer.phone
                  }
                  onChange={(
                    event
                  ) =>
                    updateCustomer(
                      "phone",
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              <Field label="Dirección">
                <input
                  className={INPUT}
                  value={
                    customer.address
                  }
                  onChange={(
                    event
                  ) =>
                    updateCustomer(
                      "address",
                      event.target
                        .value
                    )
                  }
                />
              </Field>

              {documentType ===
              "FACTURA" ? (
                <>
                  <Field label="Razón social">
                    <input
                      className={INPUT}
                      value={
                        customer.legal_name
                      }
                      onChange={(
                        event
                      ) =>
                        updateCustomer(
                          "legal_name",
                          event.target
                            .value
                        )
                      }
                    />
                  </Field>

                  <Field label="Giro">
                    <input
                      className={INPUT}
                      value={
                        customer.business_activity
                      }
                      onChange={(
                        event
                      ) =>
                        updateCustomer(
                          "business_activity",
                          event.target
                            .value
                        )
                      }
                    />
                  </Field>

                  <Field label="Comuna">
                    <input
                      className={INPUT}
                      value={
                        customer.commune
                      }
                      onChange={(
                        event
                      ) =>
                        updateCustomer(
                          "commune",
                          event.target
                            .value
                        )
                      }
                    />
                  </Field>

                  <Field label="Ciudad">
                    <input
                      className={INPUT}
                      value={
                        customer.city
                      }
                      onChange={(
                        event
                      ) =>
                        updateCustomer(
                          "city",
                          event.target
                            .value
                        )
                      }
                    />
                  </Field>
                </>
              ) : null}
            </div>
          </Section>

          <Section
            eyebrow="Catálogo"
            title="Agregar producto existente"
          >
            <div className="relative">
              <input
                className={INPUT}
                value={
                  productSearch
                }
                onChange={(
                  event
                ) =>
                  setProductSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar por nombre, SKU o código..."
              />

              {productLoading ? (
                <p className="mt-2 text-xs text-neutral-400">
                  Buscando productos...
                </p>
              ) : null}

              {productResults.length >
              0 ? (
                <div className="mt-3 space-y-2">
                  {productResults.map(
                    (
                      product
                    ) => (
                      <div
                        key={
                          product.id ||
                          product.product_id
                        }
                        className="flex items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-neutral-50/70 px-4 py-3"
                      >
                        <div>
                          <strong className="block text-sm text-neutral-900">
                            {product.name}
                          </strong>

                          <span className="mt-1 block text-xs text-neutral-500">
                            {product.internal_code ||
                              product.sku ||
                              "Sin código"}
                            {product.brand
                              ? ` · ${product.brand}`
                              : ""}
                            {product.collection
                              ? ` · ${product.collection}`
                              : ""}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addCatalogProduct(
                              product
                            )
                          }
                          className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                        >
                          Agregar
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            eyebrow="Detalle del proyecto"
            title="Productos, servicios y otros conceptos"
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    addLine(
                      "PRODUCT"
                    )
                  }
                  className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  + Producto manual
                </button>

                <button
                  type="button"
                  onClick={() =>
                    addLine(
                      "SERVICE"
                    )
                  }
                  className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  + Servicio
                </button>

                <button
                  type="button"
                  onClick={() =>
                    addLine(
                      "OTHER"
                    )
                  }
                  className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  + Otro
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              {lines.map(
                (
                  line,
                  index
                ) => (
                  <LineEditor
                    key={
                      line.local_id
                    }
                    line={
                      line
                    }
                    index={
                      index
                    }
                    onChange={(
                      next
                    ) =>
                      updateLine(
                        index,
                        next
                      )
                    }
                    onRemove={() =>
                      removeLine(
                        index
                      )
                    }
                  />
                )
              )}
            </div>
          </Section>

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <Section
              title="Observaciones"
            >
              <textarea
                className={`${INPUT} min-h-32 resize-y`}
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                placeholder="Condiciones, notas o información del proyecto..."
              />
            </Section>

            <Section
              eyebrow="Resumen"
              title="Totales"
            >
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-neutral-500">
                    Total bruto cotización
                  </span>

                  <strong className="mt-1 block text-2xl text-neutral-950">
                    {money(
                      grossTotal
                    )}
                  </strong>
                </div>

                <div className="border-t border-neutral-100 pt-4">
                  <span className="text-xs text-neutral-500">
                    Valorización Italia ingresada
                  </span>

                  <strong className="mt-1 block text-lg text-neutral-950">
                    {usd(
                      italyTotal
                    )}
                  </strong>

                  <p className="mt-2 text-[11px] leading-4 text-neutral-400">
                    Incluye productos ABET valorizados en USD y los fletes, servicios u otros conceptos que tengan un Valor Italia USD. El backend completará automáticamente el Precio Italia de productos de catálogo cuando exista un valor activo.
                  </p>
                </div>
              </div>
            </Section>
          </div>
      </div>
    </main>
  );
}
