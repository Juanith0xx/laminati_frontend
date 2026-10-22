"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  createProjectQuotation,
  findRelbaseCustomerByRut,
  getProjectQuotationProducts,
  getQuotation,
  searchRelbaseCustomers,
  updateProjectQuotation,
} from "@/services/showroom.service";

import {
  getChileanRutValidation,
} from "@/utils/rut";


const moneyFormatter =
  new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  );


function money(
  value
) {
  const number =
    Number(value || 0);

  return moneyFormatter.format(
    Number.isFinite(
      number
    )
      ? number
      : 0
  );
}


function dateInputValue(
  value
) {
  if (!value) {
    return "";
  }

  const raw =
    String(value);

  const match =
    raw.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  if (match) {
    return match[1];
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? ""
    : date
        .toISOString()
        .slice(0, 10);
}


function numberValue(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


function optionalNumber(
  value
) {
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
}


function isValidEmail(
  value
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(
      value || ""
    ).trim()
  );
}


function Field({
  label,
  children,
  hint = "",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-600">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10px] leading-4 text-neutral-400">
          {hint}
        </span>
      )}
    </label>
  );
}


const inputClass =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-black";



function firstText(
  ...values
) {
  for (
    const value
    of values
  ) {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      continue;
    }

    if (
      typeof value ===
      "object"
    ) {
      continue;
    }

    const text =
      String(
        value
      ).trim();

    if (
      text
    ) {
      return text;
    }
  }

  return "";
}


function firstEmail(
  ...values
) {
  for (
    const value
    of values
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      const email =
        value
          .map(
            (
              item
            ) =>
              String(
                item ||
                  ""
              ).trim()
          )
          .find(
            Boolean
          );

      if (
        email
      ) {
        return email;
      }

      continue;
    }

    const email =
      firstText(
        value
      );

    if (
      email
    ) {
      return email;
    }
  }

  return "";
}


function nestedName(
  value
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return "";
  }

  return firstText(
    value.name,
    value.label,
    value.description
  );
}


function mapRelbaseCustomer(
  relbaseCustomer,
  formattedRut
) {
  const item =
    relbaseCustomer ||
    {};

  return {
    id:
      firstText(
        item.id,
        item.customer_id,
        item.client_id,
        item.relbase_customer_id
      ),

    rut:
      formattedRut ||
      firstText(
        item.rut
      ),

    name:
      firstText(
        item.name,
        item.legal_name,
        item.name_fantasy
      ),

    trade_name:
      firstText(
        item.name_fantasy,
        item.trade_name
      ),

    business_activity:
      firstText(
        item.business_activity,
        item.giro
      ),

    email:
      firstEmail(
        item.email,
        item.email_commercial,
        item.email_payment
      ),

    phone:
      firstText(
        item.mobile,
        item.phone,
        item.phone_payment
      ),

    address:
      firstText(
        item.address,
        item.address_line,
        item.full_address
      ),

    commune:
      firstText(
        item.commune_name,
        nestedName(
          item.commune
        ),
        typeof item.commune ===
          "string"
          ? item.commune
          : ""
      ),

    city:
      firstText(
        item.city_name,
        nestedName(
          item.city
        ),
        typeof item.city ===
          "string"
          ? item.city
          : ""
      ),

    region:
      firstText(
        item.region_name,
        nestedName(
          item.region
        ),
        typeof item.region ===
          "string"
          ? item.region
          : ""
      ),

    type:
      firstText(
        item.type_customer,
        item.customer_type,
        item.type
      ).toLowerCase(),
  };
}


function RutStatusIcon({
  status,
}) {
  if (
    status ===
    "CHECKING"
  ) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50"
        title="Buscando cliente en Relbase"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </span>
    );
  }

  if (
    status ===
    "FOUND"
  ) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
        title="Cliente encontrado en Relbase"
      >
        ✓
      </span>
    );
  }

  if (
    status ===
    "NOT_FOUND"
  ) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
        title="Cliente no encontrado en Relbase"
      >
        !
      </span>
    );
  }

  if (
    status ===
      "INVALID" ||
    status ===
      "ERROR"
  ) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600"
        title="RUT inválido o no verificable"
      >
        ×
      </span>
    );
  }

  return null;
}


/* =========================================
   OPCIONES COMERCIALES MEG
   Fuente: Abet Laminati (formatos actuales MEG).
   Se mantienen sólo como metadata de cotización:
   no afectan inventario ni catálogo POS.
========================================= */
const MEG_PROJECT_FORMATS = Object.freeze([
  {
    value: "130x305 cm",
    label: "130 × 305 cm",
    width_cm: 130,
    height_cm: 305,
  },
  {
    value: "130x420 cm",
    label: "130 × 420 cm",
    width_cm: 130,
    height_cm: 420,
  },
  {
    value: "161x420 cm",
    label: "161 × 420 cm",
    width_cm: 161,
    height_cm: 420,
  },
]);

const MEG_PROJECT_THICKNESSES = Object.freeze([
  6,
  8,
  10,
  12,
]);

/* =========================================
   OPCIONES COMERCIALES LABGRADE
   LAB-* corresponde a Labgrade estándar.
   LABP-* (Labgrade Plus) se mantiene separado
   porque posee una matriz de formato distinta.
========================================= */
const LAB_PROJECT_FORMATS = Object.freeze([
  {
    value: "130x305 cm",
    label: "130 × 305 cm",
    width_cm: 130,
    height_cm: 305,
  },
  {
    value: "161x366 cm",
    label: "161 × 366 cm",
    width_cm: 161,
    height_cm: 366,
  },
  {
    value: "161x420 cm",
    label: "161 × 420 cm",
    width_cm: 161,
    height_cm: 420,
  },
  {
    value: "186x420 cm",
    label: "186 × 420 cm",
    width_cm: 186,
    height_cm: 420,
  },
]);

const LAB_PROJECT_THICKNESSES = Object.freeze([
  6,
  8,
  10,
  12,
  13,
  16,
]);

function isMegProduct(value) {
  return String(
    value?.sku ||
      value?.code ||
      ""
  )
    .trim()
    .toUpperCase()
    .startsWith("MEG-");
}

function isLabProduct(value) {
  return String(
    value?.sku ||
      value?.code ||
      ""
  )
    .trim()
    .toUpperCase()
    .startsWith("LAB-");
}

function getLineFormatOptions(line) {
  if (
    Array.isArray(
      line?.catalog_formats
    ) &&
    line.catalog_formats.length > 0
  ) {
    return line.catalog_formats;
  }

  if (isMegProduct(line)) {
    return MEG_PROJECT_FORMATS;
  }

  if (isLabProduct(line)) {
    return LAB_PROJECT_FORMATS;
  }

  return [];
}

function getLineThicknessOptions(line) {
  if (
    Array.isArray(
      line?.catalog_thicknesses
    ) &&
    line.catalog_thicknesses.length > 0
  ) {
    return line.catalog_thicknesses;
  }

  if (isMegProduct(line)) {
    return MEG_PROJECT_THICKNESSES;
  }

  if (isLabProduct(line)) {
    return LAB_PROJECT_THICKNESSES;
  }

  return [];
}


function createEmptyLine(
  lineType = "PRODUCT",
  sortOrder = 0
) {
  return {
    local_id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    line_type:
      lineType,

    product_id:
      null,

    description:
      "",

    code:
      "",

    finish:
      "",

    thickness_mm:
      "",

    quantity:
      1,

    unit:
      lineType ===
      "SERVICE"
        ? "m2"
        : "UN",

    format_label:
      "",

    width_cm:
      "",

    height_cm:
      "",

    price_m2_gross:
      "",

    unit_price_gross:
      "",

    line_total_gross:
      "",

    tax_rate:
      19,

    pricing_mode:
      lineType ===
      "OTHER"
        ? "TOTAL"
        : "UNIT",

    // Metadata UI; no se envía al backend de cotización.
    catalog_formats:
      [],

    catalog_thicknesses:
      [],

    sort_order:
      sortOrder,
  };
}


function normalizeLoadedLine(
  line,
  index
) {
  return {
    ...createEmptyLine(
      line?.line_type ||
        "PRODUCT",
      index
    ),

    ...line,

    local_id:
      line?.id ||
      `${Date.now()}-${index}`,

    thickness_mm:
      line?.thickness_mm ??
      "",

    quantity:
      line?.quantity ??
      1,

    width_cm:
      line?.width_cm ??
      "",

    height_cm:
      line?.height_cm ??
      "",

    price_m2_gross:
      line?.price_m2_gross ??
      "",

    unit_price_gross:
      line?.unit_price_gross ??
      "",

    line_total_gross:
      line?.line_total_gross ??
      "",

    tax_rate:
      line?.tax_rate ??
      19,
  };
}


function recalculateLine(
  line,
  changedField
) {
  const next = {
    ...line,
  };

  if (
    next.pricing_mode ===
      "AREA" &&
    [
      "pricing_mode",
      "width_cm",
      "height_cm",
      "price_m2_gross",
    ].includes(
      changedField
    )
  ) {
    const width =
      numberValue(
        next.width_cm
      );

    const height =
      numberValue(
        next.height_cm
      );

    const priceM2 =
      numberValue(
        next
          .price_m2_gross
      );

    if (
      width > 0 &&
      height > 0 &&
      priceM2 >= 0
    ) {
      next.unit_price_gross =
        Math.round(
          (
            width /
            100
          ) *
            (
              height /
              100
            ) *
            priceM2
        );
    }
  }

  if (
    next.pricing_mode !==
      "TOTAL" &&
    [
      "pricing_mode",
      "quantity",
      "unit_price_gross",
      "width_cm",
      "height_cm",
      "price_m2_gross",
    ].includes(
      changedField
    )
  ) {
    next.line_total_gross =
      Math.round(
        numberValue(
          next.quantity
        ) *
          numberValue(
            next
              .unit_price_gross
          )
      );
  }

  return next;
}


export default function ProjectQuotationEditor({
  quotationId = null,
}) {
  const router =
    useRouter();

  const isEdit =
    Boolean(
      quotationId
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      isEdit
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    documentType,
    setDocumentType,
  ] =
    useState(
      "FACTURA"
    );

  const [
    customer,
    setCustomer,
  ] =
    useState({
      name: "",
      rut: "",
      email: "",
      phone: "",
      address: "",
    });

  const [
    billing,
    setBilling,
  ] =
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
      relbase_customer_id: null,
    });


  const rutLookupRequestRef =
    useRef(0);

  const [
    rutLookup,
    setRutLookup,
  ] =
    useState({
      status:
        "IDLE",
      searchedRut:
        null,
      customer:
        null,
      message:
        "",
    });

  const [
    customerSearch,
    setCustomerSearch,
  ] =
    useState("");

  const [
    customerSearchResults,
    setCustomerSearchResults,
  ] =
    useState([]);

  const [
    customerSearchLoading,
    setCustomerSearchLoading,
  ] =
    useState(false);

  const [
    customerSearchError,
    setCustomerSearchError,
  ] =
    useState("");

  const [
    customerSearchOpen,
    setCustomerSearchOpen,
  ] =
    useState(false);

  const [
    selectedRelbaseCustomer,
    setSelectedRelbaseCustomer,
  ] =
    useState(null);

  const [
    visibleToItaly,
    setVisibleToItaly,
  ] =
    useState(false);


  const [
    projectName,
    setProjectName,
  ] =
    useState("");

  const [
    projectReference,
    setProjectReference,
  ] =
    useState("");

  const [
    validDays,
    setValidDays,
  ] =
    useState(7);

  const [
    validUntil,
    setValidUntil,
  ] =
    useState("");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    quotation,
    setQuotation,
  ] =
    useState(null);

  const [
    lines,
    setLines,
  ] =
    useState([
      createEmptyLine(
        "PRODUCT",
        0
      ),
    ]);

  const [
    catalogQuery,
    setCatalogQuery,
  ] =
    useState("");

  const [
    products,
    setProducts,
  ] =
    useState([]);

  const [
    catalogLoading,
    setCatalogLoading,
  ] =
    useState(false);

  const [
    catalogError,
    setCatalogError,
  ] =
    useState("");


  useEffect(
    () => {
      if (
        !isEdit
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
            setError("");

            const response =
              await getQuotation(
                quotationId
              );

            if (
              !active
            ) {
              return;
            }

            const data =
              response?.data ||
              null;

            const current =
              data?.quotation ||
              null;

            if (
              !current
            ) {
              throw new Error(
                "Cotización no encontrada."
              );
            }

            if (
              current
                .quotation_type !==
              "PROJECT"
            ) {
              throw new Error(
                "Esta cotización no es de proyecto."
              );
            }

            setQuotation(
              current
            );

            setVisibleToItaly(
              current
                .visible_to_italy ===
                true
            );

            setDocumentType(
              current
                .intended_document_type ||
                "FACTURA"
            );

            setCustomer({
              name:
                current
                  .customer_name ||
                current
                  .legal_name ||
                "",
              rut:
                current.rut ||
                "",
              email:
                current.email ||
                "",
              phone:
                current.phone ||
                "",
              address:
                current
                  .address_line ||
                "",
            });

            setBilling({
              rut:
                current.rut ||
                "",
              legal_name:
                current
                  .legal_name ||
                current
                  .customer_name ||
                "",
              trade_name:
                current
                  .trade_name ||
                "",
              business_activity:
                current
                  .business_activity ||
                "",
              billing_email:
                current.email ||
                "",
              phone:
                current.phone ||
                "",
              address_line:
                current
                  .address_line ||
                "",
              commune:
                current
                  .commune ||
                "",
              city:
                current.city ||
                "",
              region:
                current
                  .region ||
                "",
              country:
                current
                  .country ||
                "Chile",
              relbase_customer_id:
                current
                  .relbase_customer_id ||
                null,
            });

            const loadedRut =
              getChileanRutValidation(
                current.rut ||
                ""
              );

            setRutLookup(
              current
                .relbase_customer_id &&
              loadedRut.valid
                ? {
                    status:
                      "FOUND",
                    searchedRut:
                      loadedRut.cleaned,
                    customer:
                      null,
                    message:
                      "Cliente vinculado a Relbase en esta cotización.",
                  }
                : {
                    status:
                      "IDLE",
                    searchedRut:
                      null,
                    customer:
                      null,
                    message:
                      "",
                  }
            );

            setProjectName(
              current
                .project_name ||
                ""
            );

            setProjectReference(
              current
                .project_reference ||
                ""
            );

            setValidUntil(
              dateInputValue(
                current
                  .valid_until
              )
            );

            setNotes(
              current.notes ||
                ""
            );

            const loadedLines =
              Array.isArray(
                data
                  ?.project_lines
              )
                ? data
                    .project_lines
                    .map(
                      normalizeLoadedLine
                    )
                : [];

            setLines(
              loadedLines.length
                ? loadedLines
                : [
                    createEmptyLine(
                      "PRODUCT",
                      0
                    ),
                  ]
            );
          } catch (
            err
          ) {
            if (
              active
            ) {
              setError(
                err?.message ||
                  "No fue posible cargar la cotización de proyecto."
              );
            }
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
      isEdit,
      quotationId,
    ]
  );



  const resetRutLookup =
    () => {
      rutLookupRequestRef
        .current +=
        1;

      setRutLookup({
        status:
          "IDLE",
        searchedRut:
          null,
        customer:
          null,
        message:
          "",
      });
    };


  const handleRutChange =
    (
      value
    ) => {
      resetRutLookup();

      setSelectedRelbaseCustomer(
        null
      );

      const nextValue =
        String(
          value ||
            ""
        )
          .toUpperCase()
          .replace(
            /[^0-9K.-]/g,
            ""
          );

      setCustomer(
        (
          current
        ) => ({
          ...current,
          rut:
            nextValue,
        })
      );

      setBilling(
        (
          current
        ) => ({
          ...current,
          rut:
            nextValue,
          relbase_customer_id:
            null,
        })
      );
    };


  const applyRelbaseCustomer =
    (
      relbaseCustomer,
      formattedRut
    ) => {
      const mapped =
        mapRelbaseCustomer(
          relbaseCustomer,
          formattedRut
        );

      setCustomer(
        (
          current
        ) => ({
          ...current,
          rut:
            formattedRut,
          name:
            mapped.name ||
            current.name,
          email:
            mapped.email ||
            current.email,
          phone:
            mapped.phone ||
            current.phone,
          address:
            mapped.address ||
            current.address,
        })
      );

      setBilling(
        (
          current
        ) => ({
          ...current,
          rut:
            formattedRut,
          legal_name:
            mapped.name ||
            current
              .legal_name,
          trade_name:
            mapped
              .trade_name ||
            current
              .trade_name,
          business_activity:
            mapped
              .business_activity ||
            current
              .business_activity,
          billing_email:
            mapped.email ||
            current
              .billing_email,
          phone:
            mapped.phone ||
            current.phone,
          address_line:
            mapped.address ||
            current
              .address_line,
          commune:
            mapped.commune ||
            current.commune,
          city:
            mapped.city ||
            current.city,
          region:
            mapped.region ||
            current.region,
          country:
            current.country ||
            "Chile",
          relbase_customer_id:
            mapped.id ||
            null,
        })
      );
    };


  const validateAndLookupRut =
    async (
      rawRut
    ) => {
      const validation =
        getChileanRutValidation(
          rawRut
        );

      const requestId =
        rutLookupRequestRef
          .current +
        1;

      rutLookupRequestRef
        .current =
        requestId;

      if (
        !validation.cleaned
      ) {
        setRutLookup({
          status:
            "IDLE",
          searchedRut:
            null,
          customer:
            null,
          message:
            "",
        });

        return;
      }

      setCustomer(
        (
          current
        ) => ({
          ...current,
          rut:
            validation
              .formatted,
        })
      );

      setBilling(
        (
          current
        ) => ({
          ...current,
          rut:
            validation
              .formatted,
          relbase_customer_id:
            null,
        })
      );

      if (
        !validation.valid
      ) {
        setRutLookup({
          status:
            "INVALID",
          searchedRut:
            validation
              .cleaned,
          customer:
            null,
          message:
            "El RUT ingresado no es válido.",
        });

        return;
      }

      setRutLookup({
        status:
          "CHECKING",
        searchedRut:
          validation
            .cleaned,
        customer:
          null,
        message:
          "Buscando cliente en Relbase...",
      });

      try {
        const response =
          await findRelbaseCustomerByRut(
            validation
              .formatted
          );

        if (
          rutLookupRequestRef
            .current !==
          requestId
        ) {
          return;
        }

        if (
          response
            ?.found ===
          true
        ) {
          const relbaseCustomer =
            response
              ?.customer ||
            null;

          const mappedCustomer =
            mapRelbaseCustomer(
              relbaseCustomer,
              validation
                .formatted
            );

          if (
            documentType ===
              "FACTURA" &&
            mappedCustomer
              .type &&
            mappedCustomer
              .type !==
              "company"
          ) {
            setRutLookup({
              status:
                "ERROR",
              searchedRut:
                validation
                  .cleaned,
              customer:
                relbaseCustomer,
              message:
                "El RUT existe en Relbase, pero corresponde a una persona y no puede utilizarse para Factura.",
            });

            return;
          }

          applyRelbaseCustomer(
            relbaseCustomer,
            validation
              .formatted
          );

          setRutLookup({
            status:
              "FOUND",
            searchedRut:
              validation
                .cleaned,
            customer:
              relbaseCustomer,
            message:
              "Cliente encontrado en Relbase. Datos cargados automáticamente.",
          });

          return;
        }

        setRutLookup({
          status:
            "NOT_FOUND",
          searchedRut:
            validation
              .cleaned,
          customer:
            null,
          message:
            "RUT válido, pero el cliente no existe actualmente en Relbase.",
        });
      } catch (
        err
      ) {
        if (
          rutLookupRequestRef
            .current !==
          requestId
        ) {
          return;
        }

        const code =
          String(
            err?.code ||
              ""
          ).toUpperCase();

        if (
          code ===
          "INVALID_RUT"
        ) {
          setRutLookup({
            status:
              "INVALID",
            searchedRut:
              validation
                .cleaned,
            customer:
              null,
            message:
              err?.message ||
              "El RUT ingresado no es válido.",
          });

          return;
        }

        setRutLookup({
          status:
            "ERROR",
          searchedRut:
            validation
              .cleaned,
          customer:
            null,
          message:
            err?.message ||
            "No fue posible consultar el cliente en Relbase.",
        });
      }
    };


  const handleRutBlur =
    async (
      event
    ) => {
      await validateAndLookupRut(
        event
          ?.target
          ?.value ??
        (
          documentType ===
          "FACTURA"
            ? billing.rut
            : customer.rut
        )
      );
    };


  useEffect(
    () => {
      const normalizedQuery =
        String(
          customerSearch ||
            ""
        ).trim();

      if (
        normalizedQuery
          .length <
        2
      ) {
        setCustomerSearchResults(
          []
        );
        setCustomerSearchError(
          ""
        );
        setCustomerSearchLoading(
          false
        );
        setCustomerSearchOpen(
          false
        );

        return undefined;
      }

      const controller =
        new AbortController();

      const timeout =
        window.setTimeout(
          async () => {
            try {
              setCustomerSearchLoading(
                true
              );
              setCustomerSearchError(
                ""
              );

              const response =
                await searchRelbaseCustomers({
                  q:
                    normalizedQuery,
                  limit:
                    10,
                  signal:
                    controller
                      .signal,
                });

              if (
                controller
                  .signal
                  .aborted
              ) {
                return;
              }

              const customers =
                Array.isArray(
                  response
                    ?.customers
                )
                  ? response
                      .customers
                  : Array.isArray(
                      response
                        ?.data
                        ?.customers
                    )
                    ? response
                        .data
                        .customers
                    : [];

              setCustomerSearchResults(
                customers
              );
              setCustomerSearchOpen(
                true
              );
            } catch (
              err
            ) {
              if (
                err?.name ===
                "AbortError"
              ) {
                return;
              }

              setCustomerSearchResults(
                []
              );
              setCustomerSearchOpen(
                true
              );
              setCustomerSearchError(
                err?.message ||
                "No fue posible buscar clientes en Relbase."
              );
            } finally {
              if (
                !controller
                  .signal
                  .aborted
              ) {
                setCustomerSearchLoading(
                  false
                );
              }
            }
          },
          300
        );

      return () => {
        window.clearTimeout(
          timeout
        );
        controller.abort();
      };
    },
    [
      customerSearch,
    ]
  );


  const handleSelectRelbaseCustomer =
    async (
      relbaseCustomer
    ) => {
      const mapped =
        mapRelbaseCustomer(
          relbaseCustomer
        );

      const rut =
        String(
          mapped.rut ||
            ""
        ).trim();

      if (
        !rut
      ) {
        setCustomerSearchError(
          "El cliente seleccionado no posee un RUT utilizable."
        );

        return;
      }

      if (
        documentType ===
          "FACTURA" &&
        mapped.type &&
        mapped.type !==
          "company"
      ) {
        setCustomerSearchError(
          "Para Factura debes seleccionar un cliente empresa."
        );

        return;
      }

      setSelectedRelbaseCustomer(
        relbaseCustomer
      );
      setCustomerSearch(
        ""
      );
      setCustomerSearchResults(
        []
      );
      setCustomerSearchOpen(
        false
      );
      setCustomerSearchError(
        ""
      );

      await validateAndLookupRut(
        rut
      );
    };


  useEffect(
    () => {
      const controller =
        new AbortController();

      const timeout =
        window.setTimeout(
          async () => {
            try {
              setCatalogLoading(
                true
              );
              setCatalogError("");

              const response =
                await getProjectQuotationProducts({
                  q:
                    catalogQuery,
                  limit:
                    20,
                  signal:
                    controller
                      .signal,
                });

              setProducts(
                response
                  ?.products ||
                  []
              );
            } catch (
              err
            ) {
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
                !controller
                  .signal
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
        window.clearTimeout(
          timeout
        );
        controller.abort();
      };
    },
    [
      catalogQuery,
    ]
  );


  const total =
    useMemo(
      () =>
        lines.reduce(
          (
            sum,
            line
          ) =>
            sum +
            numberValue(
              line
                .line_total_gross
            ),
          0
        ),
      [
        lines,
      ]
    );


  const updateLine =
    (
      localId,
      field,
      value
    ) => {
      setLines(
        (
          current
        ) =>
          current.map(
            (
              line
            ) => {
              if (
                line.local_id !==
                localId
              ) {
                return line;
              }

              const next =
                recalculateLine(
                  {
                    ...line,
                    [
                      field
                    ]:
                      value,
                  },
                  field
                );

              return next;
            }
          )
      );
    };


  const updateLineFormat =
    (
      localId,
      formatValue
    ) => {
      setLines(
        (current) =>
          current.map(
            (line) => {
              if (
                line.local_id !==
                localId
              ) {
                return line;
              }

              const options =
                getLineFormatOptions(
                  line
                );

              const selected =
                options.find(
                  (option) =>
                    option.value ===
                    formatValue
                );

              if (!selected) {
                return recalculateLine(
                  {
                    ...line,
                    format_label:
                      "",
                    width_cm:
                      "",
                    height_cm:
                      "",
                  },
                  "width_cm"
                );
              }

              return recalculateLine(
                {
                  ...line,
                  format_label:
                    selected.value,
                  width_cm:
                    selected.width_cm,
                  height_cm:
                    selected.height_cm,
                },
                "width_cm"
              );
            }
          )
      );
    };


  const removeLine =
    (
      localId
    ) => {
      setLines(
        (
          current
        ) =>
          current
            .filter(
              (
                line
              ) =>
                line.local_id !==
                localId
            )
            .map(
              (
                line,
                index
              ) => ({
                ...line,
                sort_order:
                  index,
              })
            )
      );
    };


  const appendLine =
    (
      lineType
    ) => {
      setLines(
        (
          current
        ) => [
          ...current,
          createEmptyLine(
            lineType,
            current.length
          ),
        ]
      );
    };


  const addCatalogProduct =
    (
      product
    ) => {
      const megProduct =
        isMegProduct(
          product
        );

      const labProduct =
        isLabProduct(
          product
        );

      const selectableFormatProduct =
        megProduct ||
        labProduct;

      const widthCm =
        !selectableFormatProduct &&
        product
          ?.width_mm
          ? Number(
              product
                .width_mm
            ) /
            10
          : "";

      const heightCm =
        !selectableFormatProduct &&
        product
          ?.height_mm
          ? Number(
              product
                .height_mm
            ) /
            10
          : "";

      const basePrice =
        numberValue(
          product
            ?.base_price
        );

      const line = {
        ...createEmptyLine(
          "PRODUCT",
          lines.length
        ),

        product_id:
          product.id,

        description:
          product.name ||
          "",

        code:
          product
            .internal_code ||
          product.sku ||
          "",

        finish:
          product.finish ||
          "",

        thickness_mm:
          selectableFormatProduct
            ? ""
            : product
                .thickness_mm ||
              "",

        width_cm:
          widthCm,

        height_cm:
          heightCm,

        format_label:
          widthCm &&
          heightCm
            ? `${widthCm}x${heightCm} cm`
            : "",

        catalog_formats:
          megProduct
            ? MEG_PROJECT_FORMATS
            : labProduct
              ? LAB_PROJECT_FORMATS
              : [],

        catalog_thicknesses:
          megProduct
            ? MEG_PROJECT_THICKNESSES
            : labProduct
              ? LAB_PROJECT_THICKNESSES
              : [],

        unit_price_gross:
          basePrice,

        line_total_gross:
          basePrice,

        tax_rate:
          numberValue(
            product
              .tax_rate ||
              19
          ),

        pricing_mode:
          "UNIT",
      };

      setLines(
        (
          current
        ) => [
          ...current,
          line,
        ]
      );
    };


  const validate =
    () => {
      if (
        !String(
          projectName ||
          ""
        ).trim()
      ) {
        return "Ingresa el nombre del proyecto.";
      }

      if (
        lines.length ===
        0
      ) {
        return "Agrega al menos una línea a la cotización.";
      }

      const invalidLine =
        lines.find(
          (
            line
          ) =>
            !String(
              line
                .description ||
              ""
            ).trim() ||
            numberValue(
              line.quantity
            ) <= 0
        );

      if (
        invalidLine
      ) {
        return "Todas las líneas deben tener descripción y cantidad mayor a cero.";
      }

      const rutValidation =
        getChileanRutValidation(
          documentType ===
          "FACTURA"
            ? billing.rut
            : customer.rut
        );

      if (
        !rutValidation
          .valid
      ) {
        return "El RUT ingresado no es válido.";
      }

      const lookupMatchesCurrentRut =
        rutLookup
          .searchedRut ===
        rutValidation
          .cleaned;

      if (
        !lookupMatchesCurrentRut ||
        ![
          "FOUND",
          "NOT_FOUND",
        ].includes(
          rutLookup.status
        )
      ) {
        return "Espera la validación del RUT en Relbase antes de guardar la cotización.";
      }

      if (
        documentType ===
        "FACTURA"
      ) {
        const required =
          [
            [
              billing
                .legal_name,
              "razón social",
            ],
            [
              billing
                .business_activity,
              "giro",
            ],
            [
              billing
                .billing_email,
              "correo de facturación",
            ],
            [
              billing.phone,
              "teléfono",
            ],
            [
              billing
                .address_line,
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
            (
              [
                value,
              ]
            ) =>
              !String(
                value ||
                ""
              ).trim()
          );

        if (
          missing
        ) {
          return `Falta ${missing[1]}.`;
        }

        if (
          !isValidEmail(
            billing
              .billing_email
          )
        ) {
          return "El correo de facturación no es válido.";
        }
      } else {
        const required =
          [
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
            (
              [
                value,
              ]
            ) =>
              !String(
                value ||
                ""
              ).trim()
          );

        if (
          missing
        ) {
          return `Falta ${missing[1]}.`;
        }

        if (
          !isValidEmail(
            customer.email
          )
        ) {
          return "El correo del cliente no es válido.";
        }
      }

      if (
        isEdit &&
        !validUntil
      ) {
        return "Selecciona la fecha de vigencia.";
      }

      return "";
    };


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

      const rutValidation =
        getChileanRutValidation(
          documentType ===
          "FACTURA"
            ? billing.rut
            : customer.rut
        );

      const payload = {
        document_type:
          documentType,

        customer: {
          name:
            documentType ===
            "FACTURA"
              ? billing
                  .legal_name
              : customer.name,

          rut:
            rutValidation
              .formatted,

          email:
            documentType ===
            "FACTURA"
              ? billing
                  .billing_email
              : customer.email,

          phone:
            documentType ===
            "FACTURA"
              ? billing.phone
              : customer.phone,

          address:
            documentType ===
            "FACTURA"
              ? billing
                  .address_line
              : customer.address,
        },

        billing: {
          ...billing,
          rut:
            rutValidation
              .formatted,
        },

        project_name:
          String(
            projectName
          ).trim(),

        project_reference:
          String(
            projectReference ||
            ""
          ).trim() ||
          null,

        visible_to_italy:
          Boolean(
            visibleToItaly
          ),

        notes:
          String(
            notes ||
            ""
          ).trim() ||
          null,

        lines:
          lines.map(
            (
              line,
              index
            ) => ({
              line_type:
                line
                  .line_type,

              product_id:
                line
                  .product_id ||
                null,

              description:
                String(
                  line
                    .description ||
                  ""
                ).trim(),

              code:
                String(
                  line.code ||
                  ""
                ).trim() ||
                null,

              finish:
                String(
                  line.finish ||
                  ""
                ).trim() ||
                null,

              thickness_mm:
                optionalNumber(
                  line
                    .thickness_mm
                ),

              quantity:
                numberValue(
                  line.quantity
                ),

              unit:
                String(
                  line.unit ||
                  "UN"
                ).trim() ||
                "UN",

              format_label:
                String(
                  line
                    .format_label ||
                  ""
                ).trim() ||
                null,

              width_cm:
                optionalNumber(
                  line.width_cm
                ),

              height_cm:
                optionalNumber(
                  line.height_cm
                ),

              price_m2_gross:
                optionalNumber(
                  line
                    .price_m2_gross
                ),

              unit_price_gross:
                numberValue(
                  line
                    .unit_price_gross
                ),

              line_total_gross:
                numberValue(
                  line
                    .line_total_gross
                ),

              tax_rate:
                numberValue(
                  line.tax_rate ||
                    19
                ),

              pricing_mode:
                line
                  .pricing_mode,

              sort_order:
                index,
            })
          ),
      };

      if (
        isEdit
      ) {
        payload.valid_until =
          validUntil;
      } else {
        payload.valid_days =
          Number(
            validDays
          );
      }

      try {
        setSaving(
          true
        );
        setError("");
        setMessage("");

        const response =
          isEdit
            ? await updateProjectQuotation(
                quotationId,
                payload
              )
            : await createProjectQuotation(
                payload
              );

        const saved =
          response?.data
            ?.quotation ||
          null;

        setMessage(
          isEdit
            ? "Cotización de proyecto actualizada correctamente."
            : "Cotización de proyecto creada correctamente."
        );

        if (
          saved
        ) {
          window.setTimeout(
            () => {
              router.push(
                `/admin/cotizaciones/${saved.id}`
              );
              router.refresh();
            },
            500
          );
        }
      } catch (
        err
      ) {
        setError(
          err?.message ||
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
      <main className="min-h-screen bg-[#f6f5f2] p-8 text-sm text-neutral-500">
        Cargando cotización de proyecto...
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Cotizaciones · Proyecto
            </p>

            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
              {isEdit
                ? `Editar ${quotation?.quote_number || "cotización"}`
                : "Nueva cotización de proyecto"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              Productos, formatos, valores por m², valores unitarios, servicios y otros conceptos quedan como un snapshot editable antes del envío.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={
                isEdit
                  ? `/admin/cotizaciones/${quotationId}`
                  : "/admin/cotizaciones"
              }
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:border-black"
            >
              Cancelar
            </Link>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear cotización"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {quotation?.status === "SENT" && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Esta cotización ya fue enviada. Al guardar cambios, el backend volverá a estado Borrador para que puedas revisarla antes de reenviarla.
          </div>
        )}

        <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <Field label="Nombre del proyecto">
              <input
                value={projectName}
                onChange={(event) =>
                  setProjectName(
                    event.target.value
                  )
                }
                placeholder="Ej. Remodelación Hotel"
                className={inputClass}
              />
            </Field>

            <Field label="Referencia">
              <input
                value={projectReference}
                onChange={(event) =>
                  setProjectReference(
                    event.target.value
                  )
                }
                placeholder="Ej. OBRA-2026-001"
                className={inputClass}
              />
            </Field>

            {isEdit ? (
              <Field label="Vigencia">
                <input
                  type="date"
                  value={validUntil}
                  onChange={(event) =>
                    setValidUntil(
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>
            ) : (
              <Field label="Vigencia">
                <select
                  value={validDays}
                  onChange={(event) =>
                    setValidDays(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass}
                >
                  <option value={7}>
                    7 días
                  </option>
                  <option value={15}>
                    15 días
                  </option>
                  <option value={30}>
                    30 días
                  </option>
                </select>
              </Field>
            )}
          </div>

          <div className="mt-5">
            <Field label="Tipo de documento">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  [
                    "BOLETA",
                    "Boleta",
                  ],
                  [
                    "FACTURA",
                    "Factura",
                  ],
                ].map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDocumentType(
                          value
                        );
                        setCustomerSearchError(
                          ""
                        );
                        resetRutLookup();
                        setSelectedRelbaseCustomer(
                          null
                        );
                      }}
                      className={`h-11 rounded-xl border text-sm font-medium transition ${
                        documentType ===
                        value
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-neutral-700 hover:border-black"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </Field>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Cliente
          </h2>

          <div className="mt-5 rounded-2xl border border-black/5 bg-[#faf9f7] p-4 sm:p-5">
            <Field label="Buscar cliente en Relbase por nombre o RUT">
              <div className="relative">
                <input
                  value={customerSearch}
                  onChange={(event) => {
                    setCustomerSearch(
                      event.target.value
                    );
                    setCustomerSearchOpen(
                      true
                    );
                    setCustomerSearchError(
                      ""
                    );
                  }}
                  onFocus={() => {
                    if (
                      customerSearchResults.length >
                      0
                    ) {
                      setCustomerSearchOpen(
                        true
                      );
                    }
                  }}
                  placeholder="Ej. Juan Estay o 18.083.379-K"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
                />

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {customerSearchLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
                  ) : (
                    <span className="text-neutral-400">
                      ⌕
                    </span>
                  )}
                </div>

                {customerSearchOpen &&
                  String(
                    customerSearch ||
                      ""
                  ).trim().length >=
                    2 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                      {customerSearchLoading ? (
                        <div className="px-3 py-5 text-center text-xs text-neutral-500">
                          Buscando clientes en Relbase...
                        </div>
                      ) : customerSearchError ? (
                        <div className="rounded-xl bg-red-50 px-3 py-3 text-xs font-medium text-red-700">
                          {customerSearchError}
                        </div>
                      ) : customerSearchResults.length ===
                        0 ? (
                        <div className="px-3 py-5 text-center text-xs text-neutral-500">
                          No encontramos clientes para esta búsqueda.
                        </div>
                      ) : (
                        customerSearchResults.map(
                          (
                            relbaseCustomer
                          ) => {
                            const mapped =
                              mapRelbaseCustomer(
                                relbaseCustomer
                              );

                            const incompatibleInvoice =
                              documentType ===
                                "FACTURA" &&
                              mapped.type &&
                              mapped.type !==
                                "company";

                            return (
                              <button
                                key={
                                  mapped.id ||
                                  `${mapped.rut}-${mapped.name}`
                                }
                                type="button"
                                disabled={
                                  incompatibleInvoice
                                }
                                onClick={() =>
                                  handleSelectRelbaseCustomer(
                                    relbaseCustomer
                                  )
                                }
                                className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-neutral-900">
                                    {mapped.name ||
                                      mapped.trade_name ||
                                      "Cliente Relbase"}
                                  </p>

                                  <p className="mt-1 text-xs text-neutral-500">
                                    {mapped.rut ||
                                      "Sin RUT"}

                                    {mapped.type
                                      ? ` · ${
                                          mapped.type ===
                                          "company"
                                            ? "Empresa"
                                            : "Persona"
                                        }`
                                      : ""}
                                  </p>

                                  {mapped.address && (
                                    <p className="mt-1 truncate text-[11px] text-neutral-400">
                                      {mapped.address}
                                    </p>
                                  )}
                                </div>

                                {incompatibleInvoice && (
                                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-medium text-neutral-500">
                                    Solo persona
                                  </span>
                                )}
                              </button>
                            );
                          }
                        )
                      )}
                    </div>
                  )}
              </div>
            </Field>

            {selectedRelbaseCustomer && (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                    Cliente seleccionado
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-950">
                    {mapRelbaseCustomer(
                      selectedRelbaseCustomer
                    ).name ||
                      "Cliente Relbase"}
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-700">
                    {mapRelbaseCustomer(
                      selectedRelbaseCustomer
                    ).rut ||
                      "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedRelbaseCustomer(
                      null
                    )
                  }
                  className="text-left text-xs font-semibold text-emerald-800 underline underline-offset-2 sm:text-right"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <Field
              label={
                documentType ===
                "FACTURA"
                  ? "RUT empresa"
                  : "RUT cliente"
              }
            >
              <div className="relative">
                <input
                  value={
                    documentType ===
                      "FACTURA"
                      ? billing.rut
                      : customer.rut
                  }
                  onChange={(event) =>
                    handleRutChange(
                      event.target.value
                    )
                  }
                  onBlur={
                    handleRutBlur
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="12.345.678-5"
                  inputMode="text"
                  autoComplete="off"
                  className={`h-11 w-full rounded-xl border px-3.5 pr-12 text-sm outline-none transition ${
                    rutLookup.status ===
                      "INVALID" ||
                    rutLookup.status ===
                      "ERROR"
                      ? "border-red-300 focus:border-red-500"
                      : rutLookup.status ===
                          "FOUND"
                        ? "border-emerald-300 focus:border-emerald-500"
                        : rutLookup.status ===
                            "NOT_FOUND"
                          ? "border-amber-300 focus:border-amber-500"
                          : rutLookup.status ===
                              "CHECKING"
                            ? "border-emerald-200 focus:border-emerald-400"
                            : "border-black/10 focus:border-black"
                  }`}
                />

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <RutStatusIcon
                    status={
                      rutLookup.status
                    }
                  />
                </div>
              </div>

              <p className="mt-1.5 text-[11px] text-neutral-400">
                También puedes escribir el RUT directamente y presionar Tab.
              </p>
            </Field>

            <div>
              {rutLookup.message ? (
                <div
                  className={`min-h-11 rounded-xl px-3.5 py-3 text-xs font-medium ${
                    rutLookup.status ===
                      "FOUND"
                      ? "bg-emerald-50 text-emerald-700"
                      : rutLookup.status ===
                          "NOT_FOUND"
                        ? "bg-amber-50 text-amber-800"
                        : rutLookup.status ===
                            "CHECKING"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                  }`}
                >
                  {
                    rutLookup.message
                  }
                </div>
              ) : (
                <div className="min-h-11 rounded-xl bg-neutral-50 px-3.5 py-3 text-xs text-neutral-400">
                  La validación exacta del RUT aparecerá aquí.
                </div>
              )}
            </div>
          </div>

          {documentType === "FACTURA" ? (
            <div className="mt-5">
              {rutLookup.status !==
                "FOUND" && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {rutLookup.status ===
                  "NOT_FOUND"
                    ? "El RUT empresa es válido, pero no existe actualmente en Relbase. Puedes completar los datos tributarios manualmente para la cotización."
                    : "Busca o ingresa el RUT empresa. Si existe en Relbase cargaremos sus datos tributarios automáticamente."}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Razón social">
                  <input
                    value={
                      billing.legal_name
                    }
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          legal_name:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          trade_name:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          business_activity:
                            event.target.value,
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
                      billing.billing_email
                    }
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          billing_email:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          phone:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          address_line:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          commune:
                            event.target.value,
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
                    onChange={(event) =>
                      setBilling(
                        (
                          current
                        ) => ({
                          ...current,
                          city:
                            event.target.value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nombre">
                <input
                  value={
                    customer.name
                  }
                  onChange={(event) =>
                    setCustomer(
                      (
                        current
                      ) => ({
                        ...current,
                        name:
                          event.target.value,
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
                  onChange={(event) =>
                    setCustomer(
                      (
                        current
                      ) => ({
                        ...current,
                        email:
                          event.target.value,
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
                  onChange={(event) =>
                    setCustomer(
                      (
                        current
                      ) => ({
                        ...current,
                        phone:
                          event.target.value,
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
                    customer.address
                  }
                  onChange={(event) =>
                    setCustomer(
                      (
                        current
                      ) => ({
                        ...current,
                        address:
                          event.target.value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Field>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-black/5 bg-neutral-50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Visibilidad internacional
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-950">
                  Mostrar a Gerencia Italia
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
                  Al activarlo, esta cotización de proyecto podrá ser consultada por el perfil Gerencia Italia.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={visibleToItaly}
                onClick={() =>
                  setVisibleToItaly(
                    (current) =>
                      !current
                  )
                }
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition ${
                  visibleToItaly
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-black/10 bg-neutral-200"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                    visibleToItaly
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Catálogo
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                Agregar producto
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                El producto sólo precarga información. Después puedes modificar todos los campos de la línea.
              </p>
            </div>

            <input
              value={catalogQuery}
              onChange={(event) =>
                setCatalogQuery(
                  event.target.value
                )
              }
              placeholder="Buscar por SKU o nombre"
              className="h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-black xl:max-w-md"
            />
          </div>

          <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-black/5">
            {catalogLoading ? (
              <p className="p-4 text-sm text-neutral-500">
                Cargando productos...
              </p>
            ) : catalogError ? (
              <p className="p-4 text-sm text-red-600">
                {catalogError}
              </p>
            ) : products.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">
                Sin productos para mostrar.
              </p>
            ) : (
              <div className="divide-y divide-black/5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-950">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {product.sku}
                        {product.finish
                          ? ` · ${product.finish}`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addCatalogProduct(
                          product
                        )
                      }
                      className="h-9 shrink-0 rounded-full border border-black/10 px-4 text-xs font-semibold text-neutral-800 transition hover:border-black"
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Detalle del proyecto
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                Productos, servicios y otros conceptos
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  appendLine(
                    "PRODUCT"
                  )
                }
                className="h-9 rounded-full border border-black/10 px-4 text-xs font-semibold text-neutral-700 hover:border-black"
              >
                + Producto manual
              </button>

              <button
                type="button"
                onClick={() =>
                  appendLine(
                    "SERVICE"
                  )
                }
                className="h-9 rounded-full border border-black/10 px-4 text-xs font-semibold text-neutral-700 hover:border-black"
              >
                + Servicio
              </button>

              <button
                type="button"
                onClick={() =>
                  appendLine(
                    "OTHER"
                  )
                }
                className="h-9 rounded-full border border-black/10 px-4 text-xs font-semibold text-neutral-700 hover:border-black"
              >
                + Otro
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {lines.map(
              (
                line,
                index
              ) => (
                <div
                  key={line.local_id}
                  className="rounded-2xl border border-black/5 bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>

                      <select
                        value={line.line_type}
                        onChange={(event) =>
                          updateLine(
                            line.local_id,
                            "line_type",
                            event.target.value
                          )
                        }
                        className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs font-semibold text-neutral-700"
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
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeLine(
                          line.local_id
                        )
                      }
                      disabled={
                        lines.length ===
                        1
                      }
                      className="text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Quitar
                    </button>
                  </div>

                  {line.line_type === "PRODUCT" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="xl:col-span-2">
                        <Field label="Producto">
                          <input
                            value={line.description}
                            onChange={(event) =>
                              updateLine(
                                line.local_id,
                                "description",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="Código">
                        <input
                          value={line.code || ""}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "code",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Acabado">
                        <input
                          value={line.finish || ""}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "finish",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Espesor mm">
                        {getLineThicknessOptions(
                          line
                        ).length > 0 ? (
                          <select
                            value={line.thickness_mm || ""}
                            onChange={(event) =>
                              updateLine(
                                line.local_id,
                                "thickness_mm",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">
                              Seleccionar espesor
                            </option>
                            {getLineThicknessOptions(
                              line
                            ).map((thickness) => (
                              <option
                                key={thickness}
                                value={thickness}
                              >
                                {thickness} mm
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={line.thickness_mm}
                            onChange={(event) =>
                              updateLine(
                                line.local_id,
                                "thickness_mm",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        )}
                      </Field>

                      <Field label="Cantidad">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "quantity",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Unidad">
                        <input
                          value={line.unit}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "unit",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field
                        label="Formato"
                        hint={
                          getLineFormatOptions(
                            line
                          ).length > 0
                            ? "Al seleccionar un formato se completan Ancho y Alto automáticamente."
                            : undefined
                        }
                      >
                        {getLineFormatOptions(
                          line
                        ).length > 0 ? (
                          <select
                            value={line.format_label || ""}
                            onChange={(event) =>
                              updateLineFormat(
                                line.local_id,
                                event.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">
                              Seleccionar formato
                            </option>
                            {getLineFormatOptions(
                              line
                            ).map((format) => (
                              <option
                                key={format.value}
                                value={format.value}
                              >
                                {format.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={line.format_label || ""}
                            onChange={(event) =>
                              updateLine(
                                line.local_id,
                                "format_label",
                                event.target.value
                              )
                            }
                            placeholder="130x305 cm"
                            className={inputClass}
                          />
                        )}
                      </Field>

                      <Field label="Ancho cm">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.width_cm}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "width_cm",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Alto cm">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.height_cm}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "height_cm",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field
                        label="Modo de precio"
                        hint="Área puede sugerir el valor unitario desde formato × valor m²."
                      >
                        <select
                          value={line.pricing_mode}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "pricing_mode",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option value="AREA">
                            Área / m²
                          </option>
                          <option value="UNIT">
                            Unitario
                          </option>
                          <option value="TOTAL">
                            Total manual
                          </option>
                        </select>
                      </Field>

                      <Field label="Valor m²">
                        <input
                          type="number"
                          min="0"
                          value={line.price_m2_gross}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "price_m2_gross",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Valor unitario">
                        <input
                          type="number"
                          min="0"
                          value={line.unit_price_gross}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "unit_price_gross",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Total">
                        <input
                          type="number"
                          min="0"
                          value={line.line_total_gross}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "line_total_gross",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <div className="xl:col-span-2">
                        <Field label="Descripción">
                          <input
                            value={line.description}
                            onChange={(event) =>
                              updateLine(
                                line.local_id,
                                "description",
                                event.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="Cantidad">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "quantity",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Unidad">
                        <input
                          value={line.unit}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "unit",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Modo de precio">
                        <select
                          value={line.pricing_mode}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "pricing_mode",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option value="UNIT">
                            Unitario
                          </option>
                          <option value="TOTAL">
                            Total manual
                          </option>
                        </select>
                      </Field>

                      <Field label="Valor unitario">
                        <input
                          type="number"
                          min="0"
                          value={line.unit_price_gross}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "unit_price_gross",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Total">
                        <input
                          type="number"
                          min="0"
                          value={line.line_total_gross}
                          onChange={(event) =>
                            updateLine(
                              line.local_id,
                              "line_total_gross",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <Field label="Observaciones">
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={7}
                placeholder="Condiciones comerciales, alcance, forma de pago, observaciones de instalación, etc."
                className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
              />
            </Field>
          </section>

          <aside className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Resumen
            </p>

            <div className="mt-4 flex items-end justify-between gap-4">
              <span className="text-sm text-neutral-500">
                Total bruto
              </span>
              <span className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
                {money(total)}
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-neutral-500">
              El backend recalculará Neto e IVA al guardar usando la tasa definida en cada línea.
            </p>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-5 h-12 w-full rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear cotización de proyecto"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
