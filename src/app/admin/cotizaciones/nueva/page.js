"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  createPosSale,
  createQuotation,
  ensurePosInvoiceCustomer,
  findRelbaseCustomerByRut,
  getPosProducts,
  searchRelbaseCustomers,
} from "@/services/showroom.service";

import {
  formatChileanRut,
  getChileanRutValidation,
} from "@/utils/rut";

const moneyFormatter = new Intl.NumberFormat(
  "es-CL",
  {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }
);

function money(value) {
  const number = Number(value || 0);
  return moneyFormatter.format(
    Number.isFinite(number) ? number : 0
  );
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

function getCartUnitPrice(item) {
  if (isFexShippingItem(item)) {
    const override = Number(
      item?.unit_price_override
    );

    return Number.isFinite(override)
      ? override
      : 0;
  }

  const price = Number(
    item?.base_price
  );

  return Number.isFinite(price)
    ? price
    : 0;
}

function hasValidFexPrice(item) {
  if (!isFexShippingItem(item)) {
    return true;
  }

  const price = Number(
    item?.unit_price_override
  );

  return (
    Number.isFinite(price) &&
    price > 0
  );
}

function isValidEmail(value) {
  const email = String(value || "").trim();

  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createIdempotencyKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
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

function firstText(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "object") {
      continue;
    }

    const text = String(value).trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function firstEmail(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const email = value
        .map((item) => String(item || "").trim())
        .find(Boolean);

      if (email) {
        return email;
      }

      continue;
    }

    const email = firstText(value);

    if (email) {
      return email;
    }
  }

  return "";
}

function nestedName(value) {
  if (!value || typeof value !== "object") {
    return "";
  }

  return firstText(
    value.name,
    value.label,
    value.description
  );
}

function mapRelbaseCustomer(relbaseCustomer, formattedRut) {
  const item = relbaseCustomer || {};

  return {
    id: firstText(
      item.id,
      item.customer_id,
      item.client_id,
      item.relbase_customer_id
    ),
    rut: formattedRut || firstText(item.rut),
    name: firstText(
      item.name,
      item.legal_name,
      item.name_fantasy
    ),
    trade_name: firstText(
      item.name_fantasy,
      item.trade_name
    ),
    business_activity: firstText(
      item.business_activity,
      item.giro
    ),
    email: firstEmail(
      item.email,
      item.email_commercial,
      item.email_payment
    ),
    phone: firstText(
      item.mobile,
      item.phone,
      item.phone_payment
    ),
    address: firstText(
      item.address,
      item.address_line,
      item.full_address
    ),
    commune: firstText(
      item.commune_name,
      nestedName(item.commune),
      typeof item.commune === "string" ? item.commune : ""
    ),
    city: firstText(
      item.city_name,
      nestedName(item.city),
      typeof item.city === "string" ? item.city : ""
    ),
    region: firstText(
      item.region_name,
      nestedName(item.region),
      typeof item.region === "string" ? item.region : ""
    ),
    type: firstText(
      item.type_customer,
      item.customer_type,
      item.type
    ).toLowerCase(),
  };
}

function RutStatusIcon({ status }) {
  if (status === "CHECKING") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50"
        title="Buscando cliente en Relbase"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </span>
    );
  }

  if (status === "FOUND") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white"
        title="Cliente encontrado en Relbase"
      >
        ✓
      </span>
    );
  }

  if (status === "NOT_FOUND") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
        title="Cliente no encontrado en Relbase"
      >
        !
      </span>
    );
  }

  if (status === "INVALID" || status === "ERROR") {
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

export default function NewQuotationPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [catalogError, setCatalogError] =
    useState("");

  const [cart, setCart] = useState([]);

  const [documentType, setDocumentType] =
    useState("BOLETA");

  const [customer, setCustomer] = useState({
    name: "Cliente presencial",
    rut: "",
    email: "",
    phone: "",
    address: "",
  });

  const [billing, setBilling] = useState({
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

  const rutLookupRequestRef = useRef(0);

  const [rutLookup, setRutLookup] = useState({
    status: "IDLE",
    searchedRut: null,
    customer: null,
    message: "",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] =
    useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] =
    useState(false);
  const [customerSearchError, setCustomerSearchError] =
    useState("");
  const [customerSearchOpen, setCustomerSearchOpen] =
    useState(false);
  const [selectedRelbaseCustomer, setSelectedRelbaseCustomer] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");
  const [amountReceived, setAmountReceived] =
    useState("");
  const [externalReference, setExternalReference] =
    useState("");

  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(7);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationResult, setQuotationResult] = useState(null);
  const quotationMode = true;
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [saleResult, setSaleResult] = useState(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] =
    useState(false);
  const [pendingIdempotencyKey, setPendingIdempotencyKey] =
    useState(null);

  const invalidatePendingSale = () => {
    setPendingIdempotencyKey(null);
    setSaleError("");
  };

  const resetRutLookup = () => {
    rutLookupRequestRef.current += 1;

    setRutLookup({
      status: "IDLE",
      searchedRut: null,
      customer: null,
      message: "",
    });
  };

  const handleRutChange = (value) => {
    invalidatePendingSale();
    resetRutLookup();
    setSelectedRelbaseCustomer(null);

    const nextValue = String(value || "")
      .toUpperCase()
      .replace(/[^0-9K.-]/g, "");

    setCustomer((current) => ({
      ...current,
      rut: nextValue,
    }));

    setBilling((current) => ({
      ...current,
      rut: nextValue,
      relbase_customer_id: null,
    }));
  };

  const applyRelbaseCustomer = (
    relbaseCustomer,
    formattedRut
  ) => {
    const mapped = mapRelbaseCustomer(
      relbaseCustomer,
      formattedRut
    );

    setCustomer((current) => ({
      ...current,
      rut: formattedRut,
      name: mapped.name || current.name,
      email: mapped.email || current.email,
      phone: mapped.phone || current.phone,
      address: mapped.address || current.address,
    }));

    setBilling((current) => ({
      ...current,
      rut: formattedRut,
      legal_name: mapped.name || current.legal_name,
      trade_name: mapped.trade_name || current.trade_name,
      business_activity:
        mapped.business_activity ||
        current.business_activity,
      billing_email:
        mapped.email || current.billing_email,
      phone: mapped.phone || current.phone,
      address_line:
        mapped.address || current.address_line,
      commune: mapped.commune || current.commune,
      city: mapped.city || current.city,
      region: mapped.region || current.region,
      country: current.country || "Chile",
      relbase_customer_id: mapped.id || null,
    }));
  };

  const validateAndLookupRut = async (rawRut) => {
    const validation = getChileanRutValidation(rawRut);
    const requestId =
      rutLookupRequestRef.current + 1;

    rutLookupRequestRef.current = requestId;

    if (!validation.cleaned) {
      setRutLookup({
        status: "IDLE",
        searchedRut: null,
        customer: null,
        message: "",
      });
      return;
    }

    setCustomer((current) => ({
      ...current,
      rut: validation.formatted,
    }));

    setBilling((current) => ({
      ...current,
      rut: validation.formatted,
      relbase_customer_id: null,
    }));

    if (!validation.valid) {
      setRutLookup({
        status: "INVALID",
        searchedRut: validation.cleaned,
        customer: null,
        message: "El RUT ingresado no es válido.",
      });
      return;
    }

    setRutLookup({
      status: "CHECKING",
      searchedRut: validation.cleaned,
      customer: null,
      message: "Buscando cliente en Relbase...",
    });

    try {
      const response = await findRelbaseCustomerByRut(
        validation.formatted
      );

      if (rutLookupRequestRef.current !== requestId) {
        return;
      }

      if (response?.found === true) {
        const relbaseCustomer =
          response?.customer || null;

        const mappedCustomer =
          mapRelbaseCustomer(
            relbaseCustomer,
            validation.formatted
          );

        if (
          documentType === "FACTURA" &&
          mappedCustomer.type &&
          mappedCustomer.type !== "company"
        ) {
          setRutLookup({
            status: "ERROR",
            searchedRut: validation.cleaned,
            customer: relbaseCustomer,
            message:
              "El RUT existe en Relbase, pero corresponde a una persona y no puede utilizarse para Factura.",
          });
          return;
        }

        applyRelbaseCustomer(
          relbaseCustomer,
          validation.formatted
        );

        setRutLookup({
          status: "FOUND",
          searchedRut: validation.cleaned,
          customer: relbaseCustomer,
          message:
            "Cliente encontrado en Relbase. Datos cargados automáticamente.",
        });
        return;
      }

      setRutLookup({
        status: "NOT_FOUND",
        searchedRut: validation.cleaned,
        customer: null,
        message:
          "RUT válido, pero el cliente no existe actualmente en Relbase.",
      });
    } catch (error) {
      if (rutLookupRequestRef.current !== requestId) {
        return;
      }

      const code = String(
        error?.code || ""
      ).toUpperCase();

      if (code === "INVALID_RUT") {
        setRutLookup({
          status: "INVALID",
          searchedRut: validation.cleaned,
          customer: null,
          message:
            error?.message ||
            "El RUT ingresado no es válido.",
        });
        return;
      }

      setRutLookup({
        status: "ERROR",
        searchedRut: validation.cleaned,
        customer: null,
        message:
          error?.message ||
          "No fue posible consultar el cliente en Relbase.",
      });
    }
  };

  const handleRutBlur = async (event) => {
    await validateAndLookupRut(
      event?.target?.value ?? customer.rut
    );
  };

  useEffect(() => {
    const normalizedQuery = String(customerSearch || "").trim();

    if (normalizedQuery.length < 2) {
      setCustomerSearchResults([]);
      setCustomerSearchError("");
      setCustomerSearchLoading(false);
      setCustomerSearchOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setCustomerSearchLoading(true);
        setCustomerSearchError("");

        const response = await searchRelbaseCustomers({
          q: normalizedQuery,
          limit: 10,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const customers = Array.isArray(response?.customers)
          ? response.customers
          : Array.isArray(response?.data?.customers)
            ? response.data.customers
            : [];

        setCustomerSearchResults(customers);
        setCustomerSearchOpen(true);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setCustomerSearchResults([]);
        setCustomerSearchOpen(true);
        setCustomerSearchError(
          error?.message ||
            "No fue posible buscar clientes en Relbase."
        );
      } finally {
        if (!controller.signal.aborted) {
          setCustomerSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [customerSearch]);

  const handleSelectRelbaseCustomer = async (relbaseCustomer) => {
    const mapped = mapRelbaseCustomer(relbaseCustomer);
    const rut = String(mapped.rut || "").trim();

    if (!rut) {
      setCustomerSearchError(
        "El cliente seleccionado no posee un RUT utilizable."
      );
      return;
    }

    if (
      documentType === "FACTURA" &&
      mapped.type &&
      mapped.type !== "company"
    ) {
      setCustomerSearchError(
        "Para Factura debes seleccionar un cliente empresa."
      );
      return;
    }

    setSelectedRelbaseCustomer(relbaseCustomer);
    setCustomerSearch("");
    setCustomerSearchResults([]);
    setCustomerSearchOpen(false);
    setCustomerSearchError("");

    await validateAndLookupRut(rut);
  };

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        setCatalogError("");

        const response = await getPosProducts({
          q: query,
          limit: 50,
          signal: controller.signal,
        });

        setProducts(response?.products || []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setCatalogError(
            error?.message ||
              "No fue posible cargar el catálogo POS"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          getCartUnitPrice(item) *
            Number(item.quantity),
        0
      ),
    [cart]
  );

  const taxTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const gross =
          getCartUnitPrice(item) *
          Number(item.quantity);
        const rate = Number(item.tax_rate || 0);

        if (!rate) {
          return sum;
        }

        return sum + (gross - gross / (1 + rate / 100));
      }, 0),
    [cart]
  );

  const addProduct = (product) => {
    invalidatePendingSale();

    const isFexShipping =
      isFexShippingItem(product);

    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (isFexShipping) {
          return current;
        }

        const nextQuantity = Math.min(
          Number(existing.quantity) + 1,
          Number(product.available_pos)
        );

        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
          ...(isFexShipping
            ? {
                unit_price_override: "",
              }
            : {}),
        },
      ];
    });
  };

  const updateQuantity = (productId, rawQuantity) => {
    invalidatePendingSale();

    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          if (isFexShippingItem(item)) {
            return {
              ...item,
              quantity: 1,
            };
          }

          const quantity = Math.max(
            1,
            Math.min(
              Number(rawQuantity || 1),
              Number(item.available_pos)
            )
          );

          return {
            ...item,
            quantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updatePriceOverride = (
    productId,
    rawValue
  ) => {
    invalidatePendingSale();

    const normalized = String(
      rawValue ?? ""
    )
      .replace(/[^0-9]/g, "")
      .slice(0, 9);

    setCart((current) =>
      current.map((item) =>
        item.id === productId &&
        isFexShippingItem(item)
          ? {
              ...item,
              unit_price_override:
                normalized,
            }
          : item
      )
    );
  };

  const removeProduct = (productId) => {
    invalidatePendingSale();
    setCart((current) =>
      current.filter((item) => item.id !== productId)
    );
  };

  const resetSale = () => {
    setCart([]);
    setCustomer({
      name: "Cliente presencial",
      rut: "",
      email: "",
      phone: "",
      address: "",
    });
    setBilling({
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
    resetRutLookup();
    setCustomerSearch("");
    setCustomerSearchResults([]);
    setCustomerSearchLoading(false);
    setCustomerSearchError("");
    setCustomerSearchOpen(false);
    setSelectedRelbaseCustomer(null);
    setPaymentMethod("CASH");
    setAmountReceived("");
    setExternalReference("");
    setNotes("");
    setValidDays(7);
    setQuotationResult(null);
    setSaleError("");
    setSaleResult(null);
    setDocumentPreviewOpen(false);
    setPendingIdempotencyKey(null);
  };

  const handleSaveQuotation = async () => {
    if (cart.length === 0) {
      setSaleError("Agrega al menos un producto al carrito.");
      return;
    }

    const invalidFexItem =
      cart.find(
        (item) =>
          isFexShippingItem(item) &&
          !hasValidFexPrice(item)
      );

    if (invalidFexItem) {
      setSaleError(
        "Ingresa el valor informado por FEX antes de guardar la cotización."
      );
      return;
    }

    const rutValidation = getChileanRutValidation(
      documentType === "FACTURA"
        ? billing.rut || customer.rut
        : customer.rut
    );

    if (!rutValidation.valid) {
      setSaleError(
        documentType === "FACTURA"
          ? "El RUT empresa no es válido. Corrígelo antes de guardar la cotización."
          : "El RUT del cliente no es válido. Corrígelo antes de guardar la cotización."
      );
      return;
    }

    const lookupMatchesCurrentRut =
      rutLookup.searchedRut === rutValidation.cleaned;

    if (
      !lookupMatchesCurrentRut ||
      !["FOUND", "NOT_FOUND"].includes(rutLookup.status)
    ) {
      setSaleError(
        "Espera la validación del RUT en Relbase antes de guardar la cotización."
      );
      return;
    }

    if (documentType === "BOLETA") {
      const required = [
        [customer.name, "nombre del cliente"],
        [customer.email, "correo"],
        [customer.phone, "teléfono"],
        [customer.address, "dirección"],
      ];
      const missing = required.find(
        ([value]) => !String(value || "").trim()
      );

      if (missing) {
        setSaleError(
          `Falta ${missing[1]} para guardar la cotización.`
        );
        return;
      }

      if (!isValidEmail(customer.email)) {
        setSaleError("El correo del cliente no posee un formato válido.");
        return;
      }
    } else {
      const required = [
        [billing.legal_name, "razón social"],
        [billing.business_activity, "giro"],
        [billing.billing_email, "correo de facturación"],
        [billing.phone, "teléfono"],
        [billing.address_line, "dirección"],
        [billing.commune, "comuna"],
        [billing.city, "ciudad"],
      ];

      const missing = required.find(
        ([value]) => !String(value || "").trim()
      );

      if (missing) {
        setSaleError(
          `Falta ${missing[1]} para guardar la cotización.`
        );
        return;
      }

      if (!isValidEmail(billing.billing_email)) {
        setSaleError("El correo de facturación no posee un formato válido.");
        return;
      }
    }

    try {
      setQuotationSaving(true);
      setSaleError("");
      setQuotationResult(null);

      const response = await createQuotation({
        document_type: documentType,
        customer: {
          name: customer.name,
          rut: rutValidation.formatted,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        billing: {
          ...billing,
          rut: rutValidation.formatted,
        },
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: Number(item.quantity),
          ...(isFexShippingItem(item)
            ? {
                unit_price_override:
                  Number(
                    item.unit_price_override
                  ),
              }
            : {}),
        })),
        valid_days: Number(validDays),
        notes: notes.trim() || null,
      });

      setQuotationResult(response?.data || null);
    } catch (error) {
      setSaleError(
        error?.message ||
          "No fue posible guardar la cotización."
      );
    } finally {
      setQuotationSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setSaleError("Agrega al menos un producto al carrito.");
      return;
    }

    const invalidFexItem =
      cart.find(
        (item) =>
          isFexShippingItem(item) &&
          !hasValidFexPrice(item)
      );

    if (invalidFexItem) {
      setSaleError(
        "Ingresa el valor informado por FEX antes de confirmar la venta."
      );
      return;
    }

    let resolvedRelbaseCustomerId = null;
    let resolvedInvoiceBilling = null;

    if (documentType === "BOLETA") {
      const rutValidation = getChileanRutValidation(
        customer.rut
      );

      if (!rutValidation.cleaned) {
        setSaleError(
          "El RUT del cliente es obligatorio para la venta presencial."
        );
        return;
      }

      if (!rutValidation.valid) {
        setSaleError(
          "El RUT del cliente no es válido. Corrígelo antes de confirmar la venta."
        );
        return;
      }

      const lookupMatchesCurrentRut =
        rutLookup.searchedRut === rutValidation.cleaned;

      if (
        !lookupMatchesCurrentRut ||
        !["FOUND", "NOT_FOUND"].includes(
          rutLookup.status
        )
      ) {
        setSaleError(
          "Espera la validación del RUT en Relbase antes de confirmar la venta."
        );
        return;
      }

      const boletaRequired = [
        [customer.name, "nombre del cliente"],
        [customer.email, "correo"],
        [customer.phone, "teléfono"],
        [customer.address, "dirección"],
      ];

      const missingBoletaField = boletaRequired.find(
        ([value]) => !String(value || "").trim()
      );

      if (missingBoletaField) {
        setSaleError(
          `Falta ${missingBoletaField[1]} para registrar la venta con Boleta.`
        );
        return;
      }

      if (!isValidEmail(customer.email)) {
        setSaleError(
          "El correo del cliente no posee un formato válido."
        );
        return;
      }
    } else {
      const rutValidation = getChileanRutValidation(
        billing.rut || customer.rut
      );

      if (!rutValidation.cleaned) {
        setSaleError(
          "El RUT empresa es obligatorio para una Factura."
        );
        return;
      }

      if (!rutValidation.valid) {
        setSaleError(
          "El RUT empresa no es válido. Corrígelo antes de confirmar la venta."
        );
        return;
      }

      const lookupMatchesCurrentRut =
        rutLookup.searchedRut === rutValidation.cleaned;

      if (
        !lookupMatchesCurrentRut ||
        !["FOUND", "NOT_FOUND"].includes(
          rutLookup.status
        )
      ) {
        setSaleError(
          "Espera la validación del RUT empresa en Relbase antes de confirmar la venta."
        );
        return;
      }

      const invoiceRequired = [
        [billing.legal_name, "razón social"],
        [billing.business_activity, "giro"],
        [billing.address_line, "dirección"],
        [billing.commune, "comuna"],
        [billing.city, "ciudad"],
        [billing.billing_email, "correo de facturación"],
      ];

      const missingInvoiceField =
        invoiceRequired.find(
          ([value]) =>
            !String(value || "").trim()
        );

      if (missingInvoiceField) {
        setSaleError(
          `Falta ${missingInvoiceField[1]} para registrar una venta con Factura.`
        );
        return;
      }

      if (!isValidEmail(billing.billing_email)) {
        setSaleError(
          "El correo de facturación no posee un formato válido."
        );
        return;
      }

      try {
        setSubmitting(true);
        setSaleError("");

        const ensureResponse =
          await ensurePosInvoiceCustomer({
            rut: rutValidation.formatted,
            legal_name:
              String(billing.legal_name || "").trim(),
            trade_name:
              String(
                billing.trade_name ||
                  billing.legal_name ||
                  ""
              ).trim(),
            business_activity:
              String(
                billing.business_activity || ""
              ).trim(),
            billing_email:
              String(
                billing.billing_email || ""
              ).trim(),
            phone:
              String(billing.phone || "").trim() ||
              null,
            address_line:
              String(
                billing.address_line || ""
              ).trim(),
            commune:
              String(billing.commune || "").trim(),
            city:
              String(billing.city || "").trim(),
            region:
              String(billing.region || "").trim() ||
              null,
            country:
              String(billing.country || "Chile").trim() ||
              "Chile",
          });

        const ensured =
          ensureResponse?.data || null;

        const verifiedCustomer =
          ensured?.customer || null;

        resolvedRelbaseCustomerId = String(
          ensured?.relbase_customer_id ||
            verifiedCustomer?.id ||
            verifiedCustomer?.customer_id ||
            verifiedCustomer?.relbase_customer_id ||
            ""
        ).trim();

        if (!resolvedRelbaseCustomerId) {
          throw new Error(
            "Relbase no devolvió el identificador del cliente empresa."
          );
        }

        const mappedVerified =
          mapRelbaseCustomer(
            verifiedCustomer,
            rutValidation.formatted
          );

        if (
          mappedVerified.type &&
          mappedVerified.type !== "company"
        ) {
          throw new Error(
            "El RUT validado en Relbase no corresponde a un cliente empresa."
          );
        }

        applyRelbaseCustomer(
          verifiedCustomer,
          rutValidation.formatted
        );

        setRutLookup({
          status: "FOUND",
          searchedRut: rutValidation.cleaned,
          customer: verifiedCustomer,
          message:
            ensured?.created === true
              ? "Cliente empresa creado y verificado correctamente en Relbase."
              : "Cliente empresa encontrado y verificado correctamente en Relbase.",
        });

        resolvedInvoiceBilling = {
          ...billing,
          rut: rutValidation.formatted,
          relbase_customer_id:
            resolvedRelbaseCustomerId,
        };
      } catch (error) {
        setSaleError(
          error?.message ||
            "No fue posible asegurar el cliente empresa en Relbase."
        );
        setSubmitting(false);
        return;
      }
    }

    if (
      paymentMethod === "CASH" &&
      Number(amountReceived) < total
    ) {
      setSaleError(
        `El efectivo recibido debe ser igual o superior a ${money(total)}.`
      );
      setSubmitting(false);
      return;
    }

    if (
      paymentMethod !== "CASH" &&
      !String(externalReference || "").trim()
    ) {
      setSaleError(
        paymentMethod === "MANUAL_BANK_TRANSFER"
          ? "Ingresa el número de operación o referencia de la transferencia."
          : "Ingresa el número de voucher/autorización de la tarjeta."
      );
      setSubmitting(false);
      return;
    }

    const idempotencyKey =
      pendingIdempotencyKey || createIdempotencyKey();

    if (!pendingIdempotencyKey) {
      setPendingIdempotencyKey(idempotencyKey);
    }

    const invoiceBilling =
      resolvedInvoiceBilling || billing;

    const invoiceCustomer =
      documentType === "FACTURA"
        ? {
            name:
              String(
                invoiceBilling.legal_name || ""
              ).trim(),
            email:
              String(
                invoiceBilling.billing_email || ""
              ).trim(),
            rut:
              String(invoiceBilling.rut || "").trim(),
            phone:
              String(invoiceBilling.phone || "").trim() ||
              null,
          }
        : null;

    const payload = {
      idempotency_key: idempotencyKey,
      document_type: documentType,
      customer:
        documentType === "FACTURA"
          ? invoiceCustomer
          : {
              name:
                String(customer.name || "").trim() ||
                "Cliente presencial",
              email:
                String(customer.email || "").trim() ||
                "pos@laminatiword.local",
              rut:
                String(customer.rut || "").trim() || null,
              phone:
                String(customer.phone || "").trim() || null,
            },
      billing:
        documentType === "FACTURA"
          ? {
              customer_type: "COMPANY",
              rut:
                String(invoiceBilling.rut || "").trim(),
              legal_name:
                String(
                  invoiceBilling.legal_name || ""
                ).trim(),
              trade_name:
                String(
                  invoiceBilling.trade_name || ""
                ).trim() || null,
              business_activity:
                String(
                  invoiceBilling.business_activity || ""
                ).trim(),
              billing_email:
                String(
                  invoiceBilling.billing_email || ""
                ).trim(),
              phone:
                String(invoiceBilling.phone || "").trim() ||
                null,
              address_line:
                String(
                  invoiceBilling.address_line || ""
                ).trim(),
              commune:
                String(invoiceBilling.commune || "").trim(),
              city:
                String(invoiceBilling.city || "").trim(),
              region:
                String(invoiceBilling.region || "").trim() ||
                null,
              country:
                String(
                  invoiceBilling.country || "Chile"
                ).trim() || "Chile",
              relbase_customer_id:
                resolvedRelbaseCustomerId ||
                String(
                  invoiceBilling.relbase_customer_id || ""
                ).trim() ||
                null,
            }
          : {
              customer_type: "PERSON",
              rut:
                String(customer.rut || "").trim() || null,
              legal_name:
                String(customer.name || "").trim() ||
                "Cliente presencial",
              billing_email:
                String(customer.email || "").trim() || null,
              phone:
                String(customer.phone || "").trim() || null,
              address_line:
                String(customer.address || "").trim() || null,
              country: "Chile",
              relbase_customer_id:
                rutLookup.status === "FOUND"
                  ? String(
                      rutLookup.customer?.id ||
                        rutLookup.customer?.customer_id ||
                        rutLookup.customer?.relbase_customer_id ||
                        ""
                    ).trim() || null
                  : null,
            },
      payment: {
        method: paymentMethod,
        ...(paymentMethod === "CASH"
          ? {
              amount_received: Number(amountReceived),
            }
          : {
              external_reference:
                String(externalReference).trim(),
            }),
      },
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity),
        ...(isFexShippingItem(item)
          ? {
              unit_price_override:
                Number(
                  item.unit_price_override
                ),
            }
          : {}),
      })),
      notes:
        String(notes || "").trim() ||
        "Venta presencial Showroom Laminati",
    };

    try {
      setSubmitting(true);
      setSaleError("");
      const response = await createPosSale(payload);
      setSaleResult(response?.data || null);
      setPendingIdempotencyKey(null);
    } catch (error) {
      setSaleError(
        error?.message || "No fue posible registrar la venta"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-5 overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
          <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
          <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Laminati · Backoffice
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
                Nueva cotización
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
                Completa el cliente, selecciona productos del catálogo y genera una cotización estándar sin reservar inventario.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/admin/cotizaciones"
                className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-6 text-sm font-semibold !text-neutral-800 shadow-sm transition-all duration-200 hover:border-black/20 hover:bg-neutral-50 hover:!text-black"
              >
                Ver cotizaciones
              </Link>

              <Link
                href="/admin/showroom"
                className="inline-flex h-11 min-w-[144px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black bg-black px-6 text-sm font-semibold !text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 hover:!text-white"
              >
                Ir al Showroom
              </Link>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-2 sm:grid-cols-4">
          {[
            ["01", "Cliente", rutLookup.status === "FOUND"],
            ["02", "Productos", cart.length > 0],
            ["03", "Resumen", cart.length > 0],
            ["04", quotationMode ? "Cotización" : "Pago", saleResult || quotationResult],
          ].map(([number, label, complete]) => (
            <div
              key={number}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                complete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-black/5 bg-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  complete
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {complete ? "✓" : number}
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Paso {number}
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  01
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    Cliente y documento
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Busca un cliente por nombre o RUT. Al seleccionarlo, el RUT se valida nuevamente de forma exacta en Relbase.
                  </p>
                </div>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1.5 text-[11px] font-medium ${
                  rutLookup.status === "FOUND"
                    ? "bg-emerald-50 text-emerald-700"
                    : rutLookup.status === "NOT_FOUND"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {rutLookup.status === "FOUND"
                  ? "Cliente Relbase validado"
                  : rutLookup.status === "NOT_FOUND"
                    ? "Cliente nuevo"
                    : "Cliente pendiente"}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-neutral-100 p-1.5 sm:max-w-md">
              <button
                type="button"
                onClick={() => {
                  setDocumentType("BOLETA");
                  invalidatePendingSale();
                  setCustomerSearchError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  documentType === "BOLETA"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Boleta
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocumentType("FACTURA");
                  invalidatePendingSale();
                  setCustomerSearchError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  documentType === "FACTURA"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Factura
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-black/5 bg-neutral-50 p-4 sm:p-5">
              <Field label="Buscar cliente en Relbase por nombre o RUT">
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(event.target.value);
                      setCustomerSearchOpen(true);
                      setCustomerSearchError("");
                    }}
                    onFocus={() => {
                      if (customerSearchResults.length > 0) {
                        setCustomerSearchOpen(true);
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
                      <span className="text-neutral-400">⌕</span>
                    )}
                  </div>

                  {customerSearchOpen &&
                    String(customerSearch || "").trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                        {customerSearchLoading ? (
                          <div className="px-3 py-5 text-center text-xs text-neutral-500">
                            Buscando clientes en Relbase...
                          </div>
                        ) : customerSearchError ? (
                          <div className="rounded-xl bg-red-50 px-3 py-3 text-xs font-medium text-red-700">
                            {customerSearchError}
                          </div>
                        ) : customerSearchResults.length === 0 ? (
                          <div className="px-3 py-5 text-center text-xs text-neutral-500">
                            No encontramos clientes para esta búsqueda.
                          </div>
                        ) : (
                          customerSearchResults.map((relbaseCustomer) => {
                            const mapped = mapRelbaseCustomer(relbaseCustomer);
                            const incompatibleInvoice =
                              documentType === "FACTURA" &&
                              mapped.type &&
                              mapped.type !== "company";

                            return (
                              <button
                                key={mapped.id || `${mapped.rut}-${mapped.name}`}
                                type="button"
                                disabled={incompatibleInvoice}
                                onClick={() =>
                                  handleSelectRelbaseCustomer(relbaseCustomer)
                                }
                                className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-neutral-900">
                                    {mapped.name || mapped.trade_name || "Cliente Relbase"}
                                  </p>
                                  <p className="mt-1 text-xs text-neutral-500">
                                    {mapped.rut || "Sin RUT"}
                                    {mapped.type
                                      ? ` · ${mapped.type === "company" ? "Empresa" : "Persona"}`
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
                          })
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
                      {mapRelbaseCustomer(selectedRelbaseCustomer).name || "Cliente Relbase"}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {mapRelbaseCustomer(selectedRelbaseCustomer).rut || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRelbaseCustomer(null)}
                    className="text-left text-xs font-semibold text-emerald-800 underline underline-offset-2 sm:text-right"
                  >
                    Cambiar cliente
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <Field
                label={documentType === "FACTURA" ? "RUT empresa" : "RUT"}
              >
                <div className="relative">
                  <input
                    value={customer.rut}
                    onChange={(event) =>
                      handleRutChange(event.target.value)
                    }
                    onBlur={handleRutBlur}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    placeholder="12.345.678-5"
                    inputMode="text"
                    autoComplete="off"
                    className={`h-11 w-full rounded-xl border px-3.5 pr-12 text-sm outline-none transition ${
                      rutLookup.status === "INVALID" ||
                      rutLookup.status === "ERROR"
                        ? "border-red-300 focus:border-red-500"
                        : rutLookup.status === "FOUND"
                          ? "border-emerald-300 focus:border-emerald-500"
                          : rutLookup.status === "NOT_FOUND"
                            ? "border-amber-300 focus:border-amber-500"
                            : rutLookup.status === "CHECKING"
                              ? "border-emerald-200 focus:border-emerald-400"
                              : "border-black/10 focus:border-black"
                    }`}
                  />

                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <RutStatusIcon status={rutLookup.status} />
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
                      rutLookup.status === "FOUND"
                        ? "bg-emerald-50 text-emerald-700"
                        : rutLookup.status === "NOT_FOUND"
                          ? "bg-amber-50 text-amber-800"
                          : rutLookup.status === "CHECKING"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                    }`}
                  >
                    {rutLookup.message}
                  </div>
                ) : (
                  <div className="min-h-11 rounded-xl bg-neutral-50 px-3.5 py-3 text-xs text-neutral-400">
                    La validación exacta del RUT aparecerá aquí.
                  </div>
                )}
              </div>
            </div>

            {documentType === "BOLETA" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del cliente">
                  <input
                    value={customer.name}
                    onChange={(event) => {
                      invalidatePendingSale();
                      setCustomer((current) => ({
                        ...current,
                        name: event.target.value,
                      }));
                    }}
                    className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                  />
                </Field>

                <Field label="Correo">
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(event) => {
                      invalidatePendingSale();
                      setCustomer((current) => ({
                        ...current,
                        email: event.target.value,
                      }));
                    }}
                    className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    value={customer.phone}
                    onChange={(event) => {
                      invalidatePendingSale();
                      setCustomer((current) => ({
                        ...current,
                        phone: event.target.value,
                      }));
                    }}
                    className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                  />
                </Field>

                <Field label="Dirección">
                  <input
                    value={customer.address}
                    onChange={(event) => {
                      invalidatePendingSale();
                      setCustomer((current) => ({
                        ...current,
                        address: event.target.value,
                      }));
                    }}
                    placeholder="Ej. Quilan 3551, Puente Alto"
                    className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-5">
                {rutLookup.status !== "FOUND" && (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    {rutLookup.status === "NOT_FOUND"
                      ? "El RUT empresa es válido y no existe en Relbase. Completa los datos tributarios; al confirmar la venta se creará y verificará el cliente empresa."
                      : "Busca o ingresa el RUT empresa. Si existe en Relbase cargaremos sus datos tributarios automáticamente."}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Razón social">
                    <input
                      value={billing.legal_name}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          legal_name: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Nombre de fantasía">
                    <input
                      value={billing.trade_name}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          trade_name: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Giro">
                    <input
                      value={billing.business_activity}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          business_activity: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Correo de facturación">
                    <input
                      type="email"
                      value={billing.billing_email}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          billing_email: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Teléfono">
                    <input
                      value={billing.phone}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Dirección">
                    <input
                      value={billing.address_line}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          address_line: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Comuna">
                    <input
                      value={billing.commune}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          commune: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>

                  <Field label="Ciudad">
                    <input
                      value={billing.city}
                      onChange={(event) =>
                        setBilling((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>
                </div>

                {rutLookup.status === "FOUND" && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                    Cliente empresa Relbase vinculado. La venta utilizará este cliente como receptor de la Factura.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  02
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    Productos
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Busca por SKU, nombre, código interno o ID Relbase y agrega los productos a la operación.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {products.length} resultados
              </span>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. 668, Apple Tree, 1678M..."
              className="mt-5 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
            />

            {catalogError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {catalogError}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {loadingProducts ? (
                <div className="col-span-full rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">
                  Cargando catálogo POS...
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">
                  No se encontraron productos para esta búsqueda.
                </div>
              ) : (
                products.map((product) => {
                  const inCart = cart.find(
                    (item) => item.id === product.id
                  );
                  const isFexShipping =
                    isFexShippingItem(product);

                  const available =
                    isFexShipping
                      ? 1
                      : Number(
                          product.available_pos
                        );

                  const imageUrl =
                    product.primary_image_url ||
                    product.primary_image?.card_url ||
                    product.image_url ||
                    null;
                  const imageAlt =
                    product.primary_image_alt ||
                    product.primary_image?.alt_text ||
                    product.name ||
                    product.sku ||
                    "Producto";

                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col justify-between rounded-2xl border border-black/5 bg-neutral-50 p-4"
                    >
                      <div>
                        <div className="mb-4 overflow-hidden rounded-xl border border-black/5 bg-white">
                          {imageUrl ? (
                            <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
                              <img
                                src={imageUrl}
                                alt={imageAlt}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/9] items-center justify-center bg-neutral-100 px-4 text-center">
                              <div>
                                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-neutral-300 shadow-sm">
                                  ◇
                                </span>
                                <p className="mt-2 text-[11px] font-medium text-neutral-400">
                                  Imagen no disponible
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                              {product.sku}
                            </p>
                            <h3 className="mt-1 text-sm font-semibold leading-5 text-neutral-900">
                              {product.name}
                            </h3>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${
                              isFexShipping
                                ? "bg-sky-50 text-sky-700"
                                : available > 0
                                  ? "bg-white text-neutral-600"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isFexShipping
                              ? "Despacho FEX"
                              : available > 0
                                ? `Stock ${product.available_pos}`
                                : "Sin stock"}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-lg font-semibold text-neutral-950">
                            {isFexShipping
                              ? "Precio según FEX"
                              : money(product.base_price)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-400">
                            {isFexShipping
                              ? "Valor editable por operación · IVA incluido"
                              : "IVA incluido · Bodega principal"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addProduct(product)}
                        disabled={
                          isFexShipping
                            ? Boolean(inCart)
                            : (
                                available <= 0 ||
                                Number(inCart?.quantity || 0) >= available
                              )
                        }
                        className="mt-4 h-10 rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        {isFexShipping
                          ? (
                              inCart
                                ? "Despacho agregado"
                                : "Agregar despacho"
                            )
                          : available <= 0
                            ? "Sin stock en Showroom"
                            : inCart
                              ? `Agregar otra (${inCart.quantity}/${product.available_pos})`
                              : "Agregar al carrito"}
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  03
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    Resumen de la operación
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Revisa cantidades y totales antes de continuar al pago o generar la cotización.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {cart.length} producto{cart.length === 1 ? "" : "s"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">
                Agrega productos desde el paso anterior.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-2xl border border-black/5 bg-neutral-50 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          {item.sku}
                        </p>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {item.name}
                        </p>
                        {isFexShippingItem(item) && (
                          <p className="mt-1 text-[11px] font-medium text-sky-700">
                            Despacho · valor informado directamente por FEX.
                          </p>
                        )}
                      </div>

                      {isFexShippingItem(item) ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">
                            Valor FEX
                          </span>
                          <div className="flex h-9 items-center rounded-lg border border-sky-200 bg-white px-2 focus-within:border-sky-500">
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
                              onChange={(event) =>
                                updatePriceOverride(
                                  item.id,
                                  event.target.value
                                )
                              }
                              placeholder="0"
                              className="h-full w-24 bg-transparent px-1 text-right text-sm font-medium outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">
                            Cantidad
                          </span>
                          <input
                            type="number"
                            min="1"
                            max={Number(item.available_pos)}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.id, event.target.value)
                            }
                            className="h-9 w-20 rounded-lg border border-black/10 bg-white px-2 text-center text-sm outline-none focus:border-black"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4 sm:min-w-36 sm:justify-end">
                        <p className={`text-sm font-semibold ${
                          isFexShippingItem(item) &&
                          !hasValidFexPrice(item)
                            ? "text-sky-700"
                            : "text-neutral-950"
                        }`}>
                          {isFexShippingItem(item) &&
                          !hasValidFexPrice(item)
                            ? "Ingresa valor"
                            : money(
                                getCartUnitPrice(item) *
                                  Number(item.quantity)
                              )}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-fit rounded-2xl bg-neutral-950 p-5 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Total operación
                  </p>
                  <div className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Total neto aprox.</span>
                      <span>{money(total - taxTotal)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>IVA incluido</span>
                      <span>{money(taxTotal)}</span>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <span className="text-sm font-medium text-white/70">
                          Total
                        </span>
                        <span className="text-2xl font-semibold tracking-tight">
                          {money(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  04
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    {quotationMode ? "Generar cotización" : "Pago y finalización"}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    {quotationMode
                      ? "Define la vigencia y guarda la cotización. No se registra pago ni se reserva inventario."
                      : "Selecciona el medio de pago, revisa el documento y confirma la venta."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDocumentPreviewOpen(true)}
                disabled={cart.length === 0}
                className="inline-flex h-10 w-fit items-center justify-center rounded-full border border-black/10 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previsualizar {documentType === "FACTURA" ? "factura" : "boleta"}
              </button>
            </div>

            {!quotationMode && (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Field label="Seleccionar medio de pago">
                  <select
                    value={paymentMethod}
                    onChange={(event) => {
                      invalidatePendingSale();
                      setPaymentMethod(event.target.value);
                    }}
                    className="h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-black"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="DEBIT_CARD">Débito</option>
                    <option value="CREDIT_CARD">Crédito</option>
                    <option value="MANUAL_BANK_TRANSFER">Transferencia</option>
                  </select>
                </Field>

                {paymentMethod === "CASH" ? (
                  <Field label="Efectivo recibido">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={amountReceived}
                      onChange={(event) => {
                        invalidatePendingSale();
                        setAmountReceived(event.target.value);
                      }}
                      placeholder={String(Math.round(total || 0))}
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                    {Number(amountReceived) >= total && total > 0 && (
                      <span className="mt-2 block text-xs font-medium text-emerald-700">
                        Vuelto: {money(Number(amountReceived) - total)}
                      </span>
                    )}
                  </Field>
                ) : (
                  <Field
                    label={
                      paymentMethod === "MANUAL_BANK_TRANSFER"
                        ? "N° operación / referencia"
                        : "Voucher / autorización"
                    }
                  >
                    <input
                      value={externalReference}
                      onChange={(event) => {
                        invalidatePendingSale();
                        setExternalReference(event.target.value);
                      }}
                      placeholder={
                        paymentMethod === "MANUAL_BANK_TRANSFER"
                          ? "Ej: transferencia 458921"
                          : "Número entregado por el terminal"
                      }
                      className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-black"
                    />
                  </Field>
                )}
              </div>
            )}

            {quotationMode && (
              <div className="mt-6 rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-600">
                La cotización guarda los precios actuales, pero no crea una venta, no registra pago y no reserva inventario.
              </div>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
              <Field label="Nota interna (opcional)">
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(event) => {
                    invalidatePendingSale();
                    setNotes(event.target.value);
                  }}
                  className="w-full resize-none rounded-xl border border-black/10 px-3.5 py-3 text-sm outline-none focus:border-black"
                />
              </Field>

              <Field label="Vigencia de cotización">
                <select
                  value={validDays}
                  onChange={(event) =>
                    setValidDays(Number(event.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm outline-none focus:border-black"
                >
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                </select>
              </Field>
            </div>

            {quotationResult?.quotation && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-emerald-800">
                  Cotización{" "}
                  <strong>{quotationResult.quotation.quote_number}</strong>{" "}
                  guardada correctamente.
                </p>

                <Link
                  href={`/admin/cotizaciones/${quotationResult.quotation.id}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                >
                  Ver cotización
                </Link>
              </div>
            )}

            {saleError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm leading-5 text-red-700">
                {saleError}
              </div>
            )}

            {quotationMode ? (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/admin/cotizaciones"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:border-black hover:text-black"
                >
                  Volver a cotizaciones
                </Link>
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  disabled={quotationSaving || cart.length === 0}
                  className="h-12 w-full rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {quotationSaving
                    ? "Generando cotización..."
                    : "Generar cotización"}
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  disabled={quotationSaving || cart.length === 0}
                  className="h-12 w-full rounded-2xl border border-black/15 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {quotationSaving
                    ? "Generando cotización..."
                    : "Generar cotización"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className="h-12 w-full rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {submitting
                    ? "Registrando venta..."
                    : "Confirmar venta"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {documentPreviewOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-neutral-50 shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-black/5 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  Laminati · Vista previa tributaria
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-medium tracking-[-0.04em] text-neutral-950">
                    {documentType === "FACTURA"
                      ? "Factura electrónica"
                      : "Boleta electrónica"}
                  </h2>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                    Borrador · No emitido
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Previsualización de los datos que se utilizarán al emitir el documento tributario.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDocumentPreviewOpen(false)}
                className="h-11 shrink-0 rounded-full bg-black px-6 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                Cerrar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <section className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          Receptor
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-neutral-950">
                          {documentType === "FACTURA"
                            ? billing.legal_name || "Sin razón social"
                            : customer.name || "Sin nombre"}
                        </h3>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-medium text-neutral-600">
                        {rutLookup.status === "FOUND"
                          ? "Validado en Relbase"
                          : rutLookup.status === "NOT_FOUND"
                            ? "RUT no registrado"
                            : "Pendiente de validación"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">RUT</p>
                        <p className="mt-1 font-medium text-neutral-900">
                          {(documentType === "FACTURA" ? billing.rut : customer.rut) || "—"}
                        </p>
                      </div>

                      {documentType === "FACTURA" && (
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Giro</p>
                          <p className="mt-1 font-medium text-neutral-900">
                            {billing.business_activity || "—"}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Correo</p>
                        <p className="mt-1 break-all font-medium text-neutral-900">
                          {(documentType === "FACTURA"
                            ? billing.billing_email
                            : customer.email) || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Teléfono</p>
                        <p className="mt-1 font-medium text-neutral-900">
                          {(documentType === "FACTURA" ? billing.phone : customer.phone) || "—"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Dirección</p>
                        <p className="mt-1 font-medium text-neutral-900">
                          {documentType === "FACTURA"
                            ? [billing.address_line, billing.commune, billing.city]
                                .filter(Boolean)
                                .join(", ") || "—"
                            : customer.address || "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Detalle</p>
                        <h3 className="mt-1 text-base font-semibold text-neutral-950">Productos</h3>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {cart.length} producto{cart.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-4 divide-y divide-black/5">
                      {cart.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-400">
                          No hay productos en el carrito.
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                {item.sku}
                              </p>
                              <p className="mt-1 text-sm font-medium text-neutral-900">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {item.quantity} × {money(getCartUnitPrice(item))}
                              </p>
                            </div>
                            <p className="self-end text-sm font-semibold text-neutral-950">
                              {money(getCartUnitPrice(item) * Number(item.quantity))}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Resumen</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4 text-neutral-500">
                        <span>Neto aprox.</span>
                        <span>{money(total - taxTotal)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-neutral-500">
                        <span>IVA incluido</span>
                        <span>{money(taxTotal)}</span>
                      </div>
                      <div className="border-t border-black/5 pt-3">
                        <div className="flex items-end justify-between gap-4">
                          <span className="font-medium text-neutral-700">Total</span>
                          <span className="text-2xl font-semibold tracking-tight text-neutral-950">
                            {money(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Pago</p>
                    <div className="mt-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-neutral-500">Medio</span>
                        <span className="font-medium text-neutral-900">
                          {paymentMethod === "CASH"
                            ? "Efectivo"
                            : paymentMethod === "DEBIT_CARD"
                              ? "Débito"
                              : paymentMethod === "CREDIT_CARD"
                                ? "Crédito"
                                : "Transferencia"}
                        </span>
                      </div>
                      {paymentMethod === "CASH" ? (
                        <>
                          <div className="mt-2 flex justify-between gap-4">
                            <span className="text-neutral-500">Recibido</span>
                            <span className="font-medium text-neutral-900">
                              {amountReceived ? money(amountReceived) : "—"}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between gap-4">
                            <span className="text-neutral-500">Vuelto</span>
                            <span className="font-medium text-neutral-900">
                              {Number(amountReceived) >= total && total > 0
                                ? money(Number(amountReceived) - total)
                                : "—"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="mt-2 flex justify-between gap-4">
                          <span className="text-neutral-500">
                            {paymentMethod === "MANUAL_BANK_TRANSFER"
                              ? "N° operación"
                              : "Voucher"}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {externalReference || "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                    Esta es una vista previa y no corresponde a una Boleta o Factura emitida. No posee folio ni validez tributaria hasta completar el flujo DTE.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {saleResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-semibold text-neutral-950">
              Venta registrada
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              La venta fue registrada en el POS con sus datos tributarios. En este paso no se preparó ni emitió ningún DTE.
            </p>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Pedido</span>
                <span className="font-medium text-neutral-900">
                  {saleResult?.order?.order_number || "—"}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-neutral-500">Total</span>
                <span className="font-semibold text-neutral-950">
                  {money(saleResult?.order?.total)}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-neutral-500">Pago</span>
                <span className="font-medium text-neutral-900">
                  {saleResult?.payment?.method || "—"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSaleResult(null)}
                className="h-11 rounded-xl border border-black/10 text-sm font-medium text-neutral-700"
              >
                Ver venta
              </button>
              <button
                type="button"
                onClick={resetSale}
                className="h-11 rounded-xl bg-black text-sm font-medium text-white"
              >
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
