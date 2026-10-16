"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  createPosSale,
  createQuotation,
  ensurePosInvoiceCustomer,
  findRelbaseCustomerByRut,
  getLaminatiCustomerPriceList,
  getPosProducts,
  getPriceListDetail,
  searchLaminatiCustomers,
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

const MANUAL_SERVICE_TAX_RATE = 19;
const MANUAL_SERVICE_SKU = "SERV-HPL";
const MANUAL_SUPPLY_SKU = "INS-HPL";

function roundMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return (
    Math.round(
      (number + Number.EPSILON) * 100
    ) / 100
  );
}

function getGrossFromNet(
  netValue,
  taxRate = MANUAL_SERVICE_TAX_RATE
) {
  const net = Number(netValue);
  const rate = Number(taxRate);

  if (
    !Number.isFinite(net) ||
    !Number.isFinite(rate)
  ) {
    return 0;
  }

  return roundMoney(
    net * (1 + rate / 100)
  );
}

function getNetFromGross(
  grossValue,
  taxRate = MANUAL_SERVICE_TAX_RATE
) {
  const gross = Number(grossValue);
  const rate = Number(taxRate);

  if (
    !Number.isFinite(gross) ||
    !Number.isFinite(rate) ||
    rate < 0
  ) {
    return 0;
  }

  return roundMoney(
    gross / (1 + rate / 100)
  );
}

function getManualServiceNetUnitPrice(item) {
  const storedNet = Number(
    item?.manual_service_net_unit_price
  );

  if (Number.isFinite(storedNet)) {
    return storedNet;
  }

  return getNetFromGross(
    item?.unit_price_override,
    Number(
      item?.tax_rate ??
        MANUAL_SERVICE_TAX_RATE
    )
  );
}

function getTaxBreakdownFromGross(
  grossValue,
  taxRate = MANUAL_SERVICE_TAX_RATE
) {
  const gross = roundMoney(grossValue);
  const net = getNetFromGross(
    gross,
    taxRate
  );

  return {
    net,
    tax: roundMoney(gross - net),
    gross,
  };
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

function isManualServiceItem(item) {
  return (
    item?.is_manual_service === true ||
    String(item?.item_type || "")
      .trim()
      .toUpperCase() ===
      "SERVICE"
  );
}

function createEmptyManualServiceForm() {
  return {
    manual_kind: "SERVICE",
    service_name: "",
    service_detail: "",
    reference_code: "",
    quantity: "1",
    unit_price_net: "",
  };
}

function getCatalogUnitPrice(item) {
  const price = Number(
    item?.base_price
  );

  return Number.isFinite(price)
    ? price
    : 0;
}

function parseQuantityTiers(
  value
) {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(
        parsed
      )
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getQuantityPromotionTiers(
  item
) {
  if (
    String(
      item?.promotion_type ||
        ""
    )
      .trim()
      .toUpperCase() !==
      "QUANTITY_TIER" ||
    item?.has_quantity_promotion !==
      true
  ) {
    return [];
  }

  return parseQuantityTiers(
    item?.quantity_tiers
  )
    .map(
      (
        tier
      ) => ({
        id:
          tier?.id ||
          null,

        min_quantity:
          Number(
            tier?.min_quantity
          ),

        unit_price:
          Number(
            tier?.unit_price
          ),
      })
    )
    .filter(
      (
        tier
      ) =>
        Number.isFinite(
          tier.min_quantity
        ) &&
        tier.min_quantity >
          0 &&
        Number.isFinite(
          tier.unit_price
        ) &&
        tier.unit_price >=
          0
    )
    .sort(
      (
        left,
        right
      ) =>
        left.min_quantity -
        right.min_quantity
    );
}

function resolvePublicPromotionPrice(
  item,
  quantity = 1
) {
  if (
    !item?.id ||
    isFexShippingItem(item) ||
    isManualServiceItem(item)
  ) {
    return null;
  }

  const basePrice =
    Number(
      item?.base_price
    );

  if (
    !Number.isFinite(
      basePrice
    ) ||
    basePrice <= 0
  ) {
    return null;
  }

  const normalizedType =
    String(
      item?.promotion_type ||
        ""
    )
      .trim()
      .toUpperCase();

  if (
    normalizedType ===
      "FIXED_PRICE" &&
    item?.has_promotion ===
      true
  ) {
    const finalPrice =
      Number(
        item?.final_price ??
          item?.promotional_price
      );

    if (
      Number.isFinite(
        finalPrice
      ) &&
      finalPrice > 0 &&
      finalPrice < basePrice
    ) {
      return {
        source:
          "PROMOTION",

        promotion_id:
          item?.promotion_id ||
          null,

        promotion_name:
          item?.promotion_name ||
          "Oferta",

        promotion_type:
          "FIXED_PRICE",

        base_price:
          basePrice,

        final_price:
          finalPrice,

        discount_per_unit:
          roundMoney(
            basePrice -
              finalPrice
          ),

        discount_percentage:
          roundMoney(
            (
              (
                basePrice -
                finalPrice
              ) /
              basePrice
            ) *
              100
          ),

        tier:
          null,
      };
    }

    return null;
  }

  if (
    normalizedType !==
      "QUANTITY_TIER" ||
    item?.has_quantity_promotion !==
      true
  ) {
    return null;
  }

  const normalizedQuantity =
    Math.max(
      Number(
        quantity ||
          1
      ),
      1
    );

  const tiers =
    getQuantityPromotionTiers(
      item
    );

  let matchedTier =
    null;

  for (
    const tier of tiers
  ) {
    if (
      normalizedQuantity >=
      tier.min_quantity
    ) {
      matchedTier =
        tier;
    } else {
      break;
    }
  }

  if (!matchedTier) {
    return null;
  }

  if (
    matchedTier.unit_price <=
      0 ||
    matchedTier.unit_price >=
      basePrice
  ) {
    return null;
  }

  return {
    source:
      "PROMOTION",

    promotion_id:
      item?.promotion_id ||
      null,

    promotion_name:
      item?.promotion_name ||
      "Precio por volumen",

    promotion_type:
      "QUANTITY_TIER",

    base_price:
      basePrice,

    final_price:
      matchedTier.unit_price,

    discount_per_unit:
      roundMoney(
        basePrice -
          matchedTier.unit_price
      ),

    discount_percentage:
      roundMoney(
        (
          (
            basePrice -
            matchedTier.unit_price
          ) /
          basePrice
        ) *
          100
      ),

    tier:
      matchedTier,
  };
}

function getNextQuantityPromotionTier(
  item,
  quantity = 1
) {
  const currentQuantity =
    Math.max(
      Number(
        quantity ||
          1
      ),
      1
    );

  return (
    getQuantityPromotionTiers(
      item
    ).find(
      (
        tier
      ) =>
        tier.min_quantity >
        currentQuantity
    ) ||
    null
  );
}

function getPromotionTierCompactLabel(
  item
) {
  const tiers =
    getQuantityPromotionTiers(
      item
    );

  if (
    tiers.length ===
    0
  ) {
    return "";
  }

  return tiers
    .slice(
      0,
      3
    )
    .map(
      (
        tier
      ) =>
        `${Number(
          tier.min_quantity
        )}+ ${money(
          tier.unit_price
        )}`
    )
    .join(
      " · "
    );
}

function getCartUnitPrice(
  item,
  allowCustomPricing = true
) {
  const rawOverride =
    item?.unit_price_override;

  const hasOverride =
    rawOverride !== undefined &&
    rawOverride !== null &&
    String(rawOverride).trim() !== "";

  if (
    isFexShippingItem(item) ||
    isManualServiceItem(item) ||
    (
      allowCustomPricing &&
      hasOverride
    )
  ) {
    const override = Number(
      rawOverride
    );

    return Number.isFinite(override)
      ? override
      : 0;
  }

  return getCatalogUnitPrice(item);
}

function getCartLineSubtotal(
  item,
  allowCustomPricing = true
) {
  return (
    getCartUnitPrice(
      item,
      allowCustomPricing
    ) *
    Number(item?.quantity || 0)
  );
}

function getCartDiscountAmount(
  item,
  allowDiscount = true,
  allowCustomPricing = true
) {
  if (!allowDiscount) {
    return 0;
  }

  const subtotal =
    getCartLineSubtotal(
      item,
      allowCustomPricing
    );

  const rawValue =
    Number(item?.discount_value || 0);

  if (
    !Number.isFinite(rawValue) ||
    rawValue <= 0 ||
    subtotal <= 0
  ) {
    return 0;
  }

  const type =
    String(
      item?.discount_type ||
      "PERCENT"
    )
      .trim()
      .toUpperCase();

  const discount =
    type === "AMOUNT"
      ? rawValue
      : subtotal *
        rawValue /
        100;

  return Math.min(
    Math.max(discount, 0),
    subtotal
  );
}

function getCartLineTotal(
  item,
  allowDiscount = true,
  allowCustomPricing = true
) {
  const subtotal =
    getCartLineSubtotal(
      item,
      allowCustomPricing
    );

  const discount =
    getCartDiscountAmount(
      item,
      allowDiscount,
      allowCustomPricing
    );

  return Math.max(
    subtotal - discount,
    0
  );
}


function allocateMoneyProportionally(
  amount,
  weights
) {
  const safeWeights = weights.map(
    (value) =>
      Math.max(
        Math.round(
          Number(value || 0) * 100
        ),
        0
      )
  );

  const totalWeight = safeWeights.reduce(
    (sum, value) => sum + value,
    0
  );

  const target = Math.max(
    Math.round(
      Number(amount || 0) * 100
    ),
    0
  );

  if (
    target <= 0 ||
    totalWeight <= 0
  ) {
    return safeWeights.map(() => 0);
  }

  const baseAllocations =
    safeWeights.map(
      (weight, index) => {
        const exact =
          target *
          weight /
          totalWeight;

        const cents =
          Math.floor(exact);

        return {
          index,
          cents,
          remainder:
            exact - cents,
          capacity:
            Math.max(
              weight - cents,
              0
            ),
        };
      }
    );

  let remaining =
    target -
    baseAllocations.reduce(
      (sum, item) =>
        sum + item.cents,
      0
    );

  const ranked = [
    ...baseAllocations,
  ].sort(
    (a, b) =>
      b.remainder -
        a.remainder ||
      b.capacity -
        a.capacity ||
      a.index -
        b.index
  );

  let cursor = 0;

  while (
    remaining > 0 &&
    ranked.length > 0
  ) {
    const current =
      ranked[
        cursor %
          ranked.length
      ];

    if (
      current.cents <
      safeWeights[current.index]
    ) {
      current.cents += 1;
      remaining -= 1;
    }

    cursor += 1;

    if (
      cursor >
      ranked.length *
        4 &&
      !ranked.some(
        (item) =>
          item.cents <
          safeWeights[item.index]
      )
    ) {
      break;
    }
  }

  const byIndex = new Array(
    safeWeights.length
  ).fill(0);

  for (const item of ranked) {
    byIndex[item.index] =
      item.cents / 100;
  }

  return byIndex;
}

function resolveOperationDiscount({
  type,
  value,
  baseTotal,
}) {
  const normalizedType =
    String(type || "PERCENT")
      .trim()
      .toUpperCase();

  const rawValue =
    String(value ?? "").trim();

  if (!rawValue) {
    return {
      type: normalizedType,
      value: 0,
      amount: 0,
      error: "",
    };
  }

  const numericValue =
    Number(rawValue);

  if (
    ![
      "PERCENT",
      "AMOUNT",
    ].includes(normalizedType)
  ) {
    return {
      type: normalizedType,
      value: numericValue,
      amount: 0,
      error:
        "El tipo de descuento de la factura no es válido.",
    };
  }

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0
  ) {
    return {
      type: normalizedType,
      value: numericValue,
      amount: 0,
      error:
        "El descuento de la factura no es válido.",
    };
  }

  if (numericValue === 0) {
    return {
      type: normalizedType,
      value: 0,
      amount: 0,
      error: "",
    };
  }

  if (
    normalizedType ===
      "PERCENT" &&
    numericValue >= 100
  ) {
    return {
      type: normalizedType,
      value: numericValue,
      amount: 0,
      error:
        "El descuento porcentual de la factura debe ser menor a 100%.",
    };
  }

  const safeBaseTotal =
    roundMoney(baseTotal);

  const amount =
    normalizedType === "AMOUNT"
      ? roundMoney(numericValue)
      : roundMoney(
          safeBaseTotal *
            numericValue /
            100
        );

  if (
    safeBaseTotal <= 0 ||
    amount >= safeBaseTotal
  ) {
    return {
      type: normalizedType,
      value: numericValue,
      amount: 0,
      error:
        "El descuento de la factura debe ser menor al total de la operación.",
    };
  }

  return {
    type: normalizedType,
    value: numericValue,
    amount,
    error: "",
  };
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

function getPricingValidationError(
  cart,
  {
    allowCustomPricing = true,
    allowDiscount = true,
  } = {}
) {
  for (const item of cart) {
    const unitPrice =
      getCartUnitPrice(
        item,
        allowCustomPricing
      );

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      return `El precio de ${item?.sku || "un producto"} debe ser mayor a cero.`;
    }

    if (!allowDiscount) {
      continue;
    }

    const discountType =
      String(
        item?.discount_type ||
        "PERCENT"
      )
        .trim()
        .toUpperCase();

    const discountValue =
      Number(
        item?.discount_value ||
        0
      );

    if (
      ![
        "PERCENT",
        "AMOUNT",
      ].includes(
        discountType
      )
    ) {
      return `El tipo de descuento de ${item?.sku || "un producto"} no es válido.`;
    }

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue < 0
    ) {
      return `El descuento de ${item?.sku || "un producto"} no es válido.`;
    }

    const lineSubtotal =
      getCartLineSubtotal(
        item,
        allowCustomPricing
      );

    if (
      discountType ===
        "PERCENT" &&
      discountValue >= 100
    ) {
      return `El descuento porcentual de ${item?.sku || "un producto"} debe ser menor a 100%.`;
    }

    if (
      discountType ===
        "AMOUNT" &&
      discountValue >=
        lineSubtotal &&
      discountValue > 0
    ) {
      return `El descuento de ${item?.sku || "un producto"} debe ser menor al subtotal de la línea.`;
    }
  }

  return "";
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


function mapLaminatiCustomer(user) {
  const item = user || {};
  const fullName = [
    firstText(item.first_name),
    firstText(item.last_name),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: firstText(item.id),
    name: fullName || firstText(item.email) || "Cliente LaminatiWord",
    rut: firstText(item.rut),
    email: firstEmail(item.email),
    phone: firstText(item.phone),
    role: firstText(item.role).toUpperCase(),
    company_id: firstText(item.company_id),
    company_name: firstText(item.company_name),
  };
}

function isPriceListCurrentlyValid(priceList) {
  if (!priceList || priceList.is_active !== true) {
    return false;
  }

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (priceList.valid_from) {
    const from = new Date(
      `${String(priceList.valid_from).slice(0, 10)}T00:00:00`
    );

    if (!Number.isNaN(from.getTime()) && today < from) {
      return false;
    }
  }

  if (priceList.valid_until) {
    const until = new Date(
      `${String(priceList.valid_until).slice(0, 10)}T23:59:59`
    );

    if (!Number.isNaN(until.getTime()) && today > until) {
      return false;
    }
  }

  return true;
}

function resolveExclusiveCustomerPrice(product, priceList) {
  if (
    !product?.id ||
    !isPriceListCurrentlyValid(priceList) ||
    !Array.isArray(priceList?.rules)
  ) {
    return null;
  }

  const basePrice = Number(product.base_price || 0);

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return null;
  }

  const activeRules = priceList.rules.filter(
    (rule) => rule?.is_active === true
  );

  const productRule = activeRules.find(
    (rule) =>
      String(rule?.scope_type || "").toUpperCase() === "PRODUCT" &&
      String(rule?.product_id || "") === String(product.id)
  );

  const collectionRule = activeRules.find(
    (rule) =>
      String(rule?.scope_type || "").toUpperCase() === "COLLECTION" &&
      product?.collection_id &&
      String(rule?.collection_id || "") === String(product.collection_id)
  );

  const rule = productRule || collectionRule || null;

  if (!rule) {
    return null;
  }

  const discountValue = Number(rule.discount_value || 0);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return null;
  }

  const discountType = String(
    rule.discount_type || "PERCENTAGE"
  ).toUpperCase();

  let discountPerUnit = 0;

  if (discountType === "PERCENTAGE") {
    if (discountValue >= 100) {
      return null;
    }

    discountPerUnit = basePrice * discountValue / 100;
  } else if (discountType === "FIXED_AMOUNT") {
    if (discountValue >= basePrice) {
      return null;
    }

    discountPerUnit = discountValue;
  } else {
    return null;
  }

  discountPerUnit = Math.round(discountPerUnit);
  const finalPrice = Math.max(
    Math.round(basePrice - discountPerUnit),
    1
  );

  const effectivePercentage =
    basePrice > 0
      ? Math.round((discountPerUnit / basePrice) * 10000) / 100
      : 0;

  return {
    price_list_id: priceList.id,
    rule_id: rule.id,
    rule_scope: rule.scope_type,
    discount_type: discountType,
    discount_value: discountValue,
    base_price: Math.round(basePrice),
    final_price: finalPrice,
    discount_per_unit: discountPerUnit,
    discount_percentage:
      discountType === "PERCENTAGE"
        ? discountValue
        : effectivePercentage,
  };
}

function resolveBestAutomaticPricing(
  item,
  quantity,
  priceList
) {
  const publicPromotion =
    resolvePublicPromotionPrice(
      item,
      quantity
    );

  const exclusivePricing =
    resolveExclusiveCustomerPrice(
      item,
      priceList
    );

  if (
    publicPromotion &&
    exclusivePricing
  ) {
    return Number(
      exclusivePricing.final_price
    ) <
      Number(
        publicPromotion.final_price
      )
      ? {
          source:
            "PRICE_LIST",
          pricing:
            exclusivePricing,
        }
      : {
          source:
            "PROMOTION",
          pricing:
            publicPromotion,
        };
  }

  if (exclusivePricing) {
    return {
      source:
        "PRICE_LIST",
      pricing:
        exclusivePricing,
    };
  }

  if (publicPromotion) {
    return {
      source:
        "PROMOTION",
      pricing:
        publicPromotion,
    };
  }

  return null;
}

function getCartAppliedUnitPrice(
  item,
  allowAutomaticPricing = true
) {
  if (
    allowAutomaticPricing &&
    item?.automatic_pricing_auto ===
      true
  ) {
    const automaticPrice =
      Number(
        item
          ?.automatic_pricing_final_price
      );

    if (
      Number.isFinite(
        automaticPrice
      ) &&
      automaticPrice >= 0
    ) {
      return automaticPrice;
    }
  }

  return getCartUnitPrice(
    item,
    allowAutomaticPricing
  );
}

function getExclusiveDiscountLabel(pricing) {
  if (!pricing) {
    return "";
  }

  if (pricing.discount_type === "PERCENTAGE") {
    return `${Number(pricing.discount_value)}% dto.`;
  }

  return `${money(pricing.discount_per_unit)} dto.`;
}

function applyAutomaticPricingToCartItem(
  item,
  priceList
) {
  if (
    isFexShippingItem(item) ||
    isManualServiceItem(item)
  ) {
    return item;
  }

  const quantity =
    Math.max(
      Number(
        item?.quantity ||
          1
      ),
      1
    );

  const automatic =
    resolveBestAutomaticPricing(
      item,
      quantity,
      priceList
    );

  if (!automatic) {
    if (
      item?.automatic_pricing_auto !==
        true &&
      item?.customer_pricing_auto !==
        true &&
      item?.promotion_pricing_auto !==
        true
    ) {
      return item;
    }

    return {
      ...item,

      unit_price_override:
        String(
          Math.round(
            getCatalogUnitPrice(
              item
            )
          )
        ),

      discount_type:
        "PERCENT",

      discount_value:
        "",

      automatic_pricing_auto:
        false,

      automatic_pricing_source:
        null,

      automatic_pricing_base_price:
        null,

      automatic_pricing_final_price:
        null,

      automatic_pricing_discount_per_unit:
        null,

      customer_pricing_auto:
        false,

      customer_pricing_base_price:
        null,

      customer_pricing_final_price:
        null,

      customer_pricing_discount_per_unit:
        null,

      customer_pricing_discount_percentage:
        null,

      customer_pricing_price_list_id:
        null,

      customer_pricing_rule_id:
        null,

      customer_pricing_rule_scope:
        null,

      customer_pricing_rule_discount_type:
        null,

      customer_pricing_rule_discount_value:
        null,

      promotion_pricing_auto:
        false,

      promotion_pricing_id:
        null,

      promotion_pricing_name:
        null,

      promotion_pricing_type:
        null,

      promotion_pricing_tier:
        null,

      promotion_pricing_discount_per_unit:
        null,

      promotion_pricing_discount_percentage:
        null,
    };
  }

  if (
    automatic.source ===
    "PRICE_LIST"
  ) {
    const pricing =
      automatic.pricing;

    return {
      ...item,

      unit_price_override:
        String(
          pricing.base_price
        ),

      discount_type:
        pricing.discount_type ===
        "FIXED_AMOUNT"
          ? "AMOUNT"
          : "PERCENT",

      discount_value:
        pricing.discount_type ===
        "FIXED_AMOUNT"
          ? String(
              pricing.discount_per_unit *
                quantity
            )
          : String(
              pricing.discount_value
            ),

      automatic_pricing_auto:
        true,

      automatic_pricing_source:
        "PRICE_LIST",

      automatic_pricing_base_price:
        pricing.base_price,

      automatic_pricing_final_price:
        pricing.final_price,

      automatic_pricing_discount_per_unit:
        pricing.discount_per_unit,

      customer_pricing_auto:
        true,

      customer_pricing_base_price:
        pricing.base_price,

      customer_pricing_final_price:
        pricing.final_price,

      customer_pricing_discount_per_unit:
        pricing.discount_per_unit,

      customer_pricing_discount_percentage:
        pricing.discount_percentage,

      customer_pricing_price_list_id:
        pricing.price_list_id,

      customer_pricing_rule_id:
        pricing.rule_id,

      customer_pricing_rule_scope:
        pricing.rule_scope,

      customer_pricing_rule_discount_type:
        pricing.discount_type,

      customer_pricing_rule_discount_value:
        pricing.discount_value,

      promotion_pricing_auto:
        false,

      promotion_pricing_id:
        null,

      promotion_pricing_name:
        null,

      promotion_pricing_type:
        null,

      promotion_pricing_tier:
        null,

      promotion_pricing_discount_per_unit:
        null,

      promotion_pricing_discount_percentage:
        null,
    };
  }

  const promotion =
    automatic.pricing;

  return {
    ...item,

    unit_price_override:
      String(
        Math.round(
          promotion.base_price
        )
      ),

    discount_type:
      "AMOUNT",

    discount_value:
      String(
        roundMoney(
          promotion.discount_per_unit *
            quantity
        )
      ),

    automatic_pricing_auto:
      true,

    automatic_pricing_source:
      "PROMOTION",

    automatic_pricing_base_price:
      promotion.base_price,

    automatic_pricing_final_price:
      promotion.final_price,

    automatic_pricing_discount_per_unit:
      promotion.discount_per_unit,

    customer_pricing_auto:
      false,

    customer_pricing_base_price:
      null,

    customer_pricing_final_price:
      null,

    customer_pricing_discount_per_unit:
      null,

    customer_pricing_discount_percentage:
      null,

    customer_pricing_price_list_id:
      null,

    customer_pricing_rule_id:
      null,

    customer_pricing_rule_scope:
      null,

    customer_pricing_rule_discount_type:
      null,

    customer_pricing_rule_discount_value:
      null,

    promotion_pricing_auto:
      true,

    promotion_pricing_id:
      promotion.promotion_id,

    promotion_pricing_name:
      promotion.promotion_name,

    promotion_pricing_type:
      promotion.promotion_type,

    promotion_pricing_tier:
      promotion.tier,

    promotion_pricing_discount_per_unit:
      promotion.discount_per_unit,

    promotion_pricing_discount_percentage:
      promotion.discount_percentage,
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

export default function ShowroomPage() {
  return (
    <Suspense fallback={<p className="p-6">Cargando Showroom...</p>}>
      <ShowroomContent />
    </Suspense>
  );
}

function ShowroomContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [catalogError, setCatalogError] =
    useState("");

  const [cart, setCart] = useState([]);
  const [manualServiceOpen, setManualServiceOpen] =
    useState(false);
  const [manualServiceForm, setManualServiceForm] =
    useState(createEmptyManualServiceForm);

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
  const [laminatiCustomerSearchResults, setLaminatiCustomerSearchResults] =
    useState([]);
  const [selectedLaminatiCustomer, setSelectedLaminatiCustomer] =
    useState(null);
  const [customerPriceList, setCustomerPriceList] =
    useState(null);
  const [customerPriceListLoading, setCustomerPriceListLoading] =
    useState(false);
  const [customerPriceListError, setCustomerPriceListError] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [notes, setNotes] = useState("");
  const [
    operationDiscountType,
    setOperationDiscountType,
  ] = useState("PERCENT");
  const [
    operationDiscountValue,
    setOperationDiscountValue,
  ] = useState("");
  const [validDays, setValidDays] = useState(7);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [quotationResult, setQuotationResult] = useState(null);
  const [closingMode, setClosingMode] = useState(() =>
    searchParams.get("mode") === "quotation" ? "QUOTE" : "SALE"
  );
  const quotationMode = closingMode === "QUOTE";
  const [submitting, setSubmitting] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [saleResult, setSaleResult] = useState(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] =
    useState(false);
  const [pendingIdempotencyKey, setPendingIdempotencyKey] =
    useState(null);

  const changeClosingMode = (mode) => {
    setClosingMode(mode);
    setSaleError("");
    setDocumentPreviewOpen(false);
  };

  // Commercial conditions change with the customer, never as a side effect
  // of switching between sale and quotation.
  const updateCustomerPriceList = (priceList) => {
    setCustomerPriceList(priceList);
    setCart((current) => current.map((item) =>
      applyAutomaticPricingToCartItem(item, priceList)
    ));
  };

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
    setSelectedLaminatiCustomer(null);
    updateCustomerPriceList(null);
    setCustomerPriceListError("");

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
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setCustomerSearchLoading(true);
        setCustomerSearchError("");

        const [localResult, relbaseResult] =
          await Promise.allSettled([
            searchLaminatiCustomers({
              q: normalizedQuery,
              limit: 12,
              signal: controller.signal,
            }),
            searchRelbaseCustomers({
              q: normalizedQuery,
              limit: 10,
              signal: controller.signal,
            }),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        const localCustomers =
          localResult.status === "fulfilled" &&
          Array.isArray(localResult.value?.customers)
            ? localResult.value.customers
            : [];

        const relbaseResponse =
          relbaseResult.status === "fulfilled"
            ? relbaseResult.value
            : null;

        const relbaseCustomers = Array.isArray(relbaseResponse?.customers)
          ? relbaseResponse.customers
          : Array.isArray(relbaseResponse?.data?.customers)
            ? relbaseResponse.data.customers
            : [];

        setLaminatiCustomerSearchResults(localCustomers);
        setCustomerSearchResults(relbaseCustomers);
        setCustomerSearchOpen(true);

        if (
          localResult.status === "rejected" &&
          relbaseResult.status === "rejected"
        ) {
          setCustomerSearchError(
            "No fue posible buscar clientes en LaminatiWord ni en Relbase."
          );
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setCustomerSearchResults([]);
        setLaminatiCustomerSearchResults([]);
        setCustomerSearchOpen(true);
        setCustomerSearchError(
          error?.message ||
            "No fue posible buscar clientes."
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

  const loadCustomerCommercialCondition = async (
    userId
  ) => {
    if (!userId) {
      updateCustomerPriceList(null);
      setCustomerPriceListError("");
      return null;
    }

    try {
      setCustomerPriceListLoading(true);
      setCustomerPriceListError("");

      const assignmentResponse =
        await getLaminatiCustomerPriceList(userId);

      const assignment =
        assignmentResponse?.data || null;

      if (!assignment?.price_list_id) {
        updateCustomerPriceList(null);
        return null;
      }

      const detailResponse =
        await getPriceListDetail(
          assignment.price_list_id
        );

      const detail = detailResponse?.data || null;
      updateCustomerPriceList(detail);
      return detail;
    } catch (error) {
      updateCustomerPriceList(null);
      setCustomerPriceListError(
        error?.message ||
          "No fue posible cargar la condición comercial del cliente."
      );
      return null;
    } finally {
      setCustomerPriceListLoading(false);
    }
  };

  const handleSelectLaminatiCustomer = async (user) => {
    const mapped = mapLaminatiCustomer(user);

    if (!mapped.id) {
      setCustomerSearchError(
        "El cliente LaminatiWord seleccionado no posee un identificador válido."
      );
      return;
    }

    invalidatePendingSale();
    setSelectedLaminatiCustomer(user);
    setSelectedRelbaseCustomer(null);
    setCustomerSearch("");
    setCustomerSearchResults([]);
    setLaminatiCustomerSearchResults([]);
    setCustomerSearchOpen(false);
    setCustomerSearchError("");

    setCustomer((current) => ({
      ...current,
      name: mapped.name || current.name,
      rut: mapped.rut || current.rut,
      email: mapped.email || current.email,
      phone: mapped.phone || current.phone,
    }));

    setBilling((current) => ({
      ...current,
      rut: mapped.rut || current.rut,
      legal_name:
        mapped.name || current.legal_name,
      billing_email:
        mapped.email || current.billing_email,
      phone:
        mapped.phone || current.phone,
      relbase_customer_id: null,
    }));

    await loadCustomerCommercialCondition(
      mapped.id
    );

    if (mapped.rut) {
      await validateAndLookupRut(mapped.rut);
    } else {
      resetRutLookup();
    }
  };

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

    invalidatePendingSale();
    setSelectedRelbaseCustomer(relbaseCustomer);
    setSelectedLaminatiCustomer(null);
    updateCustomerPriceList(null);
    setCustomerPriceListError("");
    setCustomerSearch("");
    setCustomerSearchResults([]);
    setLaminatiCustomerSearchResults([]);
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

  const customPricingEnabled =
    !quotationMode;

  const grossSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          getCartLineSubtotal(
            item,
            customPricingEnabled
          ),
        0
      ),
    [
      cart,
      customPricingEnabled,
    ]
  );

  const lineDiscountTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          getCartDiscountAmount(
            item,
            customPricingEnabled,
            customPricingEnabled
          ),
        0
      ),
    [
      cart,
      customPricingEnabled,
    ]
  );

  const exclusiveCustomerDiscountTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item?.customer_pricing_auto === true
            ? getCartDiscountAmount(
                item,
                customPricingEnabled,
                customPricingEnabled
              )
            : 0),
        0
      ),
    [cart, customPricingEnabled]
  );

  const promotionDiscountTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item?.promotion_pricing_auto === true
            ? getCartDiscountAmount(
                item,
                customPricingEnabled,
                customPricingEnabled
              )
            : 0),
        0
      ),
    [cart, customPricingEnabled]
  );

  const otherDiscountTotal = Math.max(
    lineDiscountTotal -
      exclusiveCustomerDiscountTotal -
      promotionDiscountTotal,
    0
  );

  const totalBeforeOperationDiscount =
    useMemo(
      () =>
        cart.reduce(
          (sum, item) =>
            sum +
            getCartLineTotal(
              item,
              customPricingEnabled,
              customPricingEnabled
            ),
          0
        ),
      [
        cart,
        customPricingEnabled,
      ]
    );

  const operationDiscount =
    useMemo(
      () =>
        resolveOperationDiscount({
          type:
            operationDiscountType,
          value:
            operationDiscountValue,
          baseTotal:
            totalBeforeOperationDiscount,
        }),
      [
        operationDiscountType,
        operationDiscountValue,
        totalBeforeOperationDiscount,
      ]
    );

  const operationDiscountEnabled =
    !quotationMode &&
    documentType === "FACTURA";

  const operationDiscountAmount =
    operationDiscountEnabled &&
    !operationDiscount.error
      ? operationDiscount.amount
      : 0;

  const operationDiscountAllocations =
    useMemo(
      () =>
        allocateMoneyProportionally(
          operationDiscountAmount,
          cart.map((item) =>
            getCartLineTotal(
              item,
              customPricingEnabled,
              customPricingEnabled
            )
          )
        ),
      [
        operationDiscountAmount,
        cart,
        customPricingEnabled,
      ]
    );

  const total = roundMoney(
    totalBeforeOperationDiscount -
      operationDiscountAmount
  );

  const quotationPreviewTotal =
    useMemo(
      () =>
        roundMoney(
          cart.reduce(
            (sum, item) =>
              sum +
              getCartLineSubtotal(
                item,
                false
              ),
            0
          )
        ),
      [cart]
    );

  const taxTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item, index) => {
          const gross =
            roundMoney(
              getCartLineTotal(
                item,
                customPricingEnabled,
                customPricingEnabled
              ) -
                Number(
                  operationDiscountAllocations[
                    index
                  ] || 0
                )
            );

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
    [
      cart,
      customPricingEnabled,
      operationDiscountAllocations,
    ]
  );

  const manualServicePreview =
    useMemo(() => {
      const quantity = Math.max(
        Number(
          manualServiceForm.quantity ||
            1
        ),
        1
      );

      const unitNet = Number(
        String(
          manualServiceForm.unit_price_net ||
            ""
        ).replace(/[^0-9]/g, "")
      );

      const safeUnitNet =
        Number.isFinite(unitNet)
          ? unitNet
          : 0;

      const net = roundMoney(
        safeUnitNet * quantity
      );

      const gross = getGrossFromNet(
        net,
        MANUAL_SERVICE_TAX_RATE
      );

      return {
        quantity,
        unit_net:
          roundMoney(safeUnitNet),
        unit_tax:
          roundMoney(
            getGrossFromNet(
              safeUnitNet,
              MANUAL_SERVICE_TAX_RATE
            ) - safeUnitNet
          ),
        unit_gross:
          getGrossFromNet(
            safeUnitNet,
            MANUAL_SERVICE_TAX_RATE
          ),
        net,
        tax:
          roundMoney(gross - net),
        gross,
      };
    }, [
      manualServiceForm.quantity,
      manualServiceForm.unit_price_net,
    ]);

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

        return current.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          const updated = {
            ...item,
            quantity: nextQuantity,
          };

          return applyAutomaticPricingToCartItem(
            updated,
            selectedLaminatiCustomer
              ? customerPriceList
              : null
          );
        });
      }

      const created = {
        ...product,
        quantity: 1,
        unit_price_override:
          isFexShipping
            ? ""
            : String(
                Math.round(
                  getCatalogUnitPrice(product)
                )
              ),
        discount_type: "PERCENT",
        discount_value: "",
      };

      return [
        ...current,
        applyAutomaticPricingToCartItem(
          created,
          selectedLaminatiCustomer
            ? customerPriceList
            : null
        ),
      ];
    });
  };

  const openManualService = () => {
    invalidatePendingSale();
    setManualServiceForm(
      createEmptyManualServiceForm()
    );
    setManualServiceOpen(true);
  };

  const closeManualService = () => {
    setManualServiceOpen(false);
    setManualServiceForm(
      createEmptyManualServiceForm()
    );
  };

  const updateManualServiceField = (
    field,
    value
  ) => {
    setManualServiceForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addManualService = () => {
    invalidatePendingSale();

    const manualKind =
      String(
        manualServiceForm.manual_kind ||
          "SERVICE"
      )
        .trim()
        .toUpperCase() === "SUPPLY"
        ? "SUPPLY"
        : "SERVICE";

    const serviceName = String(
      manualServiceForm.service_name || ""
    ).trim();
    const serviceDetail = String(
      manualServiceForm.service_detail || ""
    ).trim();
    const referenceCode = String(
      manualServiceForm.reference_code || ""
    ).trim();
    const quantity = Number(
      manualServiceForm.quantity
    );
    const unitPriceNet = Number(
      String(
        manualServiceForm.unit_price_net || ""
      ).replace(/[^0-9]/g, "")
    );

    if (!serviceName) {
      setSaleError(
        manualKind === "SUPPLY"
          ? "Ingresa el nombre o descripción del insumo."
          : "Ingresa el nombre del servicio."
      );
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setSaleError(
        "La cantidad de la línea debe ser mayor a cero."
      );
      return;
    }

    if (
      !Number.isFinite(unitPriceNet) ||
      unitPriceNet <= 0
    ) {
      setSaleError(
        "Ingresa un valor neto válido para la línea."
      );
      return;
    }

    const unitPriceGross =
      getGrossFromNet(
        unitPriceNet,
        MANUAL_SERVICE_TAX_RATE
      );

    const fullName = [
      serviceName,
      serviceDetail || null,
      referenceCode
        ? `Correspondiente a ${referenceCode}`
        : null,
    ]
      .filter(Boolean)
      .join(" - ");

    const manualId =
      `manual-service-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    setCart((current) => [
      ...current,
      {
        id: manualId,
        item_type: "SERVICE",
        manual_kind:
          manualKind,
        is_manual_service: true,
        sku:
          manualKind === "SUPPLY"
            ? MANUAL_SUPPLY_SKU
            : MANUAL_SERVICE_SKU,
        name: fullName,
        service_name: serviceName,
        service_detail:
          serviceDetail || null,
        reference_code:
          referenceCode || null,
        quantity,
        base_price: 0,
        manual_service_net_unit_price:
          String(roundMoney(unitPriceNet)),
        unit_price_override:
          String(unitPriceGross),
        discount_type: "PERCENT",
        discount_value: "",
        tax_rate:
          MANUAL_SERVICE_TAX_RATE,
        available_pos: null,
        requires_inventory: false,
      },
    ]);

    setSaleError("");
    closeManualService();
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

          if (isManualServiceItem(item)) {
            const serviceQuantity = Math.max(
              1,
              Number(rawQuantity || 1)
            );

            return {
              ...item,
              quantity: serviceQuantity,
            };
          }

          const quantity = Math.max(
            1,
            Math.min(
              Number(rawQuantity || 1),
              Number(item.available_pos)
            )
          );

          const updated = {
            ...item,
            quantity,
          };

          return applyAutomaticPricingToCartItem(
            updated,
            selectedLaminatiCustomer
              ? customerPriceList
              : null
          );
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const updatePriceOverride = (
    productId,
    rawValue
  ) => {
    if (
      cart.find(
        (item) =>
          item.id === productId &&
          item.automatic_pricing_auto === true
      )
    ) {
      return;
    }
    invalidatePendingSale();

    const normalized = String(
      rawValue ?? ""
    )
      .replace(/[^0-9]/g, "")
      .slice(0, 10);

    setCart((current) =>
      current.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (isManualServiceItem(item)) {
          const netUnitPrice =
            Number(normalized || 0);

          return {
            ...item,
            manual_service_net_unit_price:
              normalized,
            unit_price_override:
              normalized
                ? String(
                    getGrossFromNet(
                      netUnitPrice,
                      Number(
                        item.tax_rate ??
                          MANUAL_SERVICE_TAX_RATE
                      )
                    )
                  )
                : "",
          };
        }

        return {
          ...item,
          unit_price_override:
            normalized,
        };
      })
    );
  };

  const updateDiscountType = (
    productId,
    nextType
  ) => {
    if (
      cart.find(
        (item) =>
          item.id === productId &&
          item.automatic_pricing_auto === true
      )
    ) {
      return;
    }
    invalidatePendingSale();

    const normalizedType =
      String(nextType || "")
        .trim()
        .toUpperCase() ===
      "AMOUNT"
        ? "AMOUNT"
        : "PERCENT";

    setCart((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              discount_type:
                normalizedType,
              discount_value:
                "",
            }
          : item
      )
    );
  };

  const updateDiscountValue = (
    productId,
    rawValue
  ) => {
    if (
      cart.find(
        (item) =>
          item.id === productId &&
          item.automatic_pricing_auto === true
      )
    ) {
      return;
    }
    invalidatePendingSale();

    const normalized = String(
      rawValue ?? ""
    )
      .replace(/[^0-9]/g, "")
      .slice(0, 9);

    setCart((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              discount_value:
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

  const decreaseCatalogProduct = (productId) => {
    invalidatePendingSale();

    setCart((current) =>
      current.flatMap((item) => {
        if (item.id !== productId) {
          return [item];
        }

        if (isFexShippingItem(item)) {
          return [];
        }

        const currentQuantity =
          Number(item.quantity || 1);

        if (currentQuantity <= 1) {
          return [];
        }

        const updatedItem = {
          ...item,
          quantity:
            currentQuantity - 1,
        };

        return [
          applyAutomaticPricingToCartItem(
            updatedItem,
            selectedLaminatiCustomer
              ? customerPriceList
              : null
          ),
        ];
      })
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
    setLaminatiCustomerSearchResults([]);
    setSelectedLaminatiCustomer(null);
    updateCustomerPriceList(null);
    setCustomerPriceListLoading(false);
    setCustomerPriceListError("");
    setPaymentMethod("CASH");
    setNotes("");
    setOperationDiscountType(
      "PERCENT"
    );
    setOperationDiscountValue("");
    setValidDays(7);
    setQuotationResult(null);
    setSaleError("");
    setSaleResult(null);
    setDocumentPreviewOpen(false);
    setPendingIdempotencyKey(null);
  };

  const hasQuotationGlobalDiscount =
    String(operationDiscountValue).trim() !== "" &&
    Number(operationDiscountValue) !== 0;
  const hasQuotationManualLines = cart.some(isManualServiceItem);
  const hasQuotationSalePricing = cart.some((item) =>
    !isFexShippingItem(item) && !isManualServiceItem(item) && (
      Number(item.discount_value || 0) !== 0 ||
      getCartUnitPrice(item, true) !== getCatalogUnitPrice(item)
    )
  );
  const quotationBlocked = hasQuotationGlobalDiscount || hasQuotationManualLines;

  const handleSaveQuotation = async () => {
    if (!quotationMode || quotationSaving || submitting) return;
    if (hasQuotationGlobalDiscount) {
      setSaleError(
        "El descuento global de factura se aplica únicamente a la venta. Para generar una cotización, quita primero el descuento global."
      );
      return;
    }

    if (cart.length === 0) {
      setSaleError("Agrega al menos un producto o servicio a la operación.");
      return;
    }

    if (
      cart.some((item) =>
        isManualServiceItem(item)
      )
    ) {
      setSaleError(
        "Los servicios manuales están habilitados para venta Showroom. Para cotizaciones de proyecto usa las líneas de servicio del módulo de Cotizaciones."
      );
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
    if (quotationMode || submitting || quotationSaving) return;
    if (cart.length === 0) {
      setSaleError("Agrega al menos un producto o servicio a la operación.");
      return;
    }

    if (
      operationDiscountEnabled &&
      operationDiscount.error
    ) {
      setSaleError(
        operationDiscount.error
      );
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

    const pricingError =
      getPricingValidationError(
        cart,
        {
          allowCustomPricing: true,
          allowDiscount: true,
        }
      );

    if (pricingError) {
      setSaleError(
        pricingError
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
      customer_user_id:
        selectedLaminatiCustomer?.id || null,
      company_id:
        selectedLaminatiCustomer?.company_id || null,
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
      },
      items: cart.map((item) => {
        const commonPricing = {
          quantity: Number(item.quantity),
          unit_price_override:
            Number(
              getCartUnitPrice(
                item,
                true
              )
            ),
          discount_type:
            String(
              item.discount_type ||
              "PERCENT"
            )
              .trim()
              .toUpperCase(),
          discount_value:
            Number(
              item.discount_value ||
              0
            ),
        };

        if (isManualServiceItem(item)) {
          return {
            item_type: "SERVICE",
            manual_kind:
              item.manual_kind ||
              (
                String(item.sku || "")
                  .trim()
                  .toUpperCase() ===
                MANUAL_SUPPLY_SKU
                  ? "SUPPLY"
                  : "SERVICE"
              ),
            service_name:
              item.service_name,
            service_detail:
              item.service_detail || null,
            reference_code:
              item.reference_code || null,
            ...commonPricing,
          };
        }

        return {
          item_type: "PRODUCT",
          product_id: item.id,
          ...commonPricing,
        };
      }),
      operation_discount:
        operationDiscountEnabled
          ? {
              type:
                operationDiscountType,
              value:
                Number(
                  operationDiscountValue ||
                    0
                ),
            }
          : null,
      notes:
        String(notes || "").trim() ||
        null,
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
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              {quotationMode ? "Cotizaciones comerciales" : "Ventas presenciales"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              {quotationMode ? "Nueva cotización" : "Showroom"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
              {quotationMode
                ? "Completa el cliente, selecciona los productos y genera una cotización sin reservar inventario."
                : "Flujo de venta presencial ordenado de principio a fin, sincronizado con la bodega principal Relbase 956."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/cotizaciones"
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black"
            >
              Ver cotizaciones
            </Link>

            <button
              type="button"
              disabled={submitting || quotationSaving}
              onClick={() => changeClosingMode(quotationMode ? "SALE" : "QUOTE")}
              className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              {quotationMode ? "Volver a venta" : "Nueva cotización"}
            </button>
          </div>
        </div>

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
          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
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

            <div className="mt-6 rounded-2xl border border-black/5 bg-[#faf9f7] p-4 sm:p-5">
              <Field label="Buscar cliente por nombre, RUT o correo">
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(event) => {
                      setCustomerSearch(event.target.value);
                      if (event.target.value.trim().length < 2) {
                        setCustomerSearchResults([]);
                        setLaminatiCustomerSearchResults([]);
                        setCustomerSearchError("");
                        setCustomerSearchLoading(false);
                        setCustomerSearchOpen(false);
                      }
                      setCustomerSearchOpen(true);
                      setCustomerSearchError("");
                    }}
                    onFocus={() => {
                      if (
                        customerSearchResults.length > 0 ||
                        laminatiCustomerSearchResults.length > 0
                      ) {
                        setCustomerSearchOpen(true);
                      }
                    }}
                    placeholder="Ej. Cliente Prueba, 11.111.111-1 o correo@cliente.cl"
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
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-96 overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                        {customerSearchLoading ? (
                          <div className="px-3 py-5 text-center text-xs text-neutral-500">
                            Buscando clientes en LaminatiWord y Relbase...
                          </div>
                        ) : customerSearchError &&
                          laminatiCustomerSearchResults.length === 0 &&
                          customerSearchResults.length === 0 ? (
                          <div className="rounded-xl bg-red-50 px-3 py-3 text-xs font-medium text-red-700">
                            {customerSearchError}
                          </div>
                        ) : laminatiCustomerSearchResults.length === 0 &&
                          customerSearchResults.length === 0 ? (
                          <div className="px-3 py-5 text-center text-xs text-neutral-500">
                            No encontramos clientes para esta búsqueda.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {laminatiCustomerSearchResults.length > 0 && (
                              <div>
                                <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                                  Clientes LaminatiWord
                                </p>
                                {laminatiCustomerSearchResults.map((localUser) => {
                                  const mapped = mapLaminatiCustomer(localUser);

                                  return (
                                    <button
                                      key={mapped.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectLaminatiCustomer(localUser)
                                      }
                                      className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-violet-50/60"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="truncate text-sm font-semibold text-neutral-900">
                                            {mapped.name}
                                          </p>
                                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700">
                                            LaminatiWord
                                          </span>
                                        </div>
                                        <p className="mt-1 text-xs text-neutral-500">
                                          {mapped.rut || "Sin RUT"}
                                          {mapped.email ? ` · ${mapped.email}` : ""}
                                        </p>
                                      </div>
                                      <span className="shrink-0 text-[10px] font-medium text-violet-600">
                                        Ver condición
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {customerSearchResults.length > 0 && (
                              <div className="border-t border-black/5 pt-2">
                                <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                  Clientes Relbase
                                </p>
                                {customerSearchResults.map((relbaseCustomer) => {
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
                                      </div>
                                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-medium text-neutral-500">
                                        Relbase
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </Field>

              {selectedLaminatiCustomer ? (
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-950">
                          {mapLaminatiCustomer(selectedLaminatiCustomer).name}
                        </p>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
                          Cliente LaminatiWord
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {mapLaminatiCustomer(selectedLaminatiCustomer).rut || "Sin RUT"}
                        {mapLaminatiCustomer(selectedLaminatiCustomer).email
                          ? ` · ${mapLaminatiCustomer(selectedLaminatiCustomer).email}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        invalidatePendingSale();
                        setSelectedLaminatiCustomer(null);
                        updateCustomerPriceList(null);
                        setCustomerPriceListError("");
                        resetRutLookup();
                      }}
                      className="text-left text-xs font-semibold text-neutral-600 underline underline-offset-2 sm:text-right"
                    >
                      Cambiar cliente
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                      <p className="text-xs font-semibold text-emerald-800">
                        ✓ Cliente LaminatiWord encontrado
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">
                        Se usarán sus datos y condición comercial registrada.
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-3.5 ${
                      customerPriceList && isPriceListCurrentlyValid(customerPriceList)
                        ? "border-violet-100 bg-violet-50/70"
                        : "border-neutral-200 bg-neutral-50"
                    }`}>
                      <p className={`text-xs font-semibold ${
                        customerPriceList && isPriceListCurrentlyValid(customerPriceList)
                          ? "text-violet-800"
                          : "text-neutral-700"
                      }`}>
                        {customerPriceListLoading
                          ? "Consultando condición comercial..."
                          : customerPriceList && isPriceListCurrentlyValid(customerPriceList)
                            ? "◆ Precio exclusivo cliente activo"
                            : "Precio general"}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                        {customerPriceListLoading
                          ? "Estamos revisando la lista asignada."
                          : customerPriceList && isPriceListCurrentlyValid(customerPriceList)
                            ? `${Number(customerPriceList.rules_count || customerPriceList.rules?.length || 0)} regla(s) de descuento configurada(s).`
                            : "Este cliente no posee una lista exclusiva activa."}
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-3.5 ${
                      rutLookup.status === "FOUND"
                        ? "border-emerald-100 bg-emerald-50/70"
                        : rutLookup.status === "NOT_FOUND"
                          ? "border-amber-100 bg-amber-50/80"
                          : "border-neutral-200 bg-neutral-50"
                    }`}>
                      <p className={`text-xs font-semibold ${
                        rutLookup.status === "FOUND"
                          ? "text-emerald-800"
                          : rutLookup.status === "NOT_FOUND"
                            ? "text-amber-800"
                            : "text-neutral-700"
                      }`}>
                        {rutLookup.status === "FOUND"
                          ? "✓ Cliente registrado en Relbase"
                          : rutLookup.status === "NOT_FOUND"
                            ? "⚠ Cliente aún no registrado en Relbase"
                            : rutLookup.status === "CHECKING"
                              ? "Consultando Relbase..."
                              : "Estado Relbase pendiente"}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                        {rutLookup.status === "FOUND"
                          ? "Se utilizará su identidad Relbase cuando corresponda."
                          : rutLookup.status === "NOT_FOUND"
                            ? "La condición comercial igual se aplica desde LaminatiWord."
                            : "La existencia en Relbase es independiente del precio exclusivo."}
                      </p>
                    </div>
                  </div>

                  {customerPriceListError && (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                      {customerPriceListError}
                    </div>
                  )}
                </div>
              ) : selectedRelbaseCustomer ? (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                      Cliente Relbase seleccionado
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      {mapRelbaseCustomer(selectedRelbaseCustomer).name || "Cliente Relbase"}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {mapRelbaseCustomer(selectedRelbaseCustomer).rut || "—"} · Precio general
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
              ) : null}
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

          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  02
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">
                    Productos y servicios
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Busca productos del catálogo o agrega una línea manual de insumo/material o servicio.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!quotationMode && (
                  <button
                    type="button"
                    onClick={openManualService}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-neutral-800 transition hover:border-black hover:bg-black hover:text-white"
                  >
                    + Agregar línea manual
                  </button>
                )}
                <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  {products.length} resultados
                </span>
              </div>
            </div>

            <div className="relative mt-5">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-neutral-400">
                ⌕
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. 668, Apple Tree, 1678M..."
                className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            {catalogError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {catalogError}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-[#faf9f7]">
              {loadingProducts ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  Cargando catálogo POS...
                </div>
              ) : products.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No se encontraron productos para esta búsqueda.
                </div>
              ) : (
                <>
                  {/* =========================================
                      VISTA HORIZONTAL · ESCRITORIO
                     ========================================= */}
                  <div className="hidden overflow-x-auto lg:block">
                    <div className="min-w-[1120px]">
                      <div className="grid grid-cols-[72px_112px_minmax(260px,1fr)_120px_140px_150px_132px] items-center gap-4 border-b border-black/5 bg-white/70 px-4 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Imagen
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          SKU
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Producto / servicio
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Stock
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Precio
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          IVA
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          Acción
                        </p>
                      </div>

                      {products.map((product) => {
                        const inCart = cart.find(
                          (item) => item.id === product.id
                        );
                        const isFexShipping =
                          isFexShippingItem(product);

                        const quantityForPricing =
                          Math.max(
                            Number(
                              inCart?.quantity ||
                                1
                            ),
                            1
                          );

                        const quantityTiers =
                          !quotationMode
                            ? getQuantityPromotionTiers(
                                product
                              )
                            : [];

                        const automaticPricing =
                          !quotationMode
                            ? resolveBestAutomaticPricing(
                                product,
                                quantityForPricing,
                                selectedLaminatiCustomer
                                  ? customerPriceList
                                  : null
                              )
                            : null;

                        const exclusivePricing =
                          automaticPricing?.source ===
                          "PRICE_LIST"
                            ? automaticPricing.pricing
                            : null;

                        const promotionPricing =
                          automaticPricing?.source ===
                          "PROMOTION"
                            ? automaticPricing.pricing
                            : null;

                        const nextQuantityTier =
                          !promotionPricing
                            ? getNextQuantityPromotionTier(
                                product,
                                quantityForPricing
                              )
                            : null;

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

                        const disabled =
                          isFexShipping
                            ? Boolean(inCart)
                            : (
                                available <= 0 ||
                                Number(inCart?.quantity || 0) >= available
                              );

                        return (
                          <article
                            key={product.id}
                            className="group grid grid-cols-[72px_112px_minmax(260px,1fr)_120px_140px_150px_132px] items-center gap-4 border-b border-black/5 px-4 py-3 transition last:border-b-0 hover:bg-white"
                          >
                            <div className="h-12 w-[72px] overflow-hidden rounded-lg border border-black/5 bg-white">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={imageAlt}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-lg text-neutral-300">
                                  ◇
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-neutral-500">
                                {product.sku}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-neutral-900">
                                {product.name}
                              </h3>
                              <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                                {isFexShipping
                                  ? "Servicio de despacho externo."
                                  : "Producto de catálogo · Bodega principal"}
                              </p>
                            </div>

                            <div>
                              <span
                                className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${
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
                                    ? `Stock ${Math.trunc(available)}`
                                    : "Sin stock"}
                              </span>
                            </div>

                            <div className="min-w-0">
                              {isFexShipping ? (
                                <p className="text-sm font-semibold text-neutral-950">
                                  Precio según FEX
                                </p>
                              ) : exclusivePricing ? (
                                <>
                                  <p className="text-[10px] text-neutral-400 line-through">
                                    {money(exclusivePricing.base_price)}
                                  </p>
                                  <p className="text-sm font-semibold text-violet-700">
                                    {money(exclusivePricing.final_price)}
                                  </p>
                                  <p className="mt-0.5 truncate text-[10px] font-medium text-violet-700">
                                    {getExclusiveDiscountLabel(exclusivePricing)}
                                  </p>
                                </>
                              ) : promotionPricing ? (
                                <>
                                  <p className="text-[10px] text-neutral-400 line-through">
                                    {money(promotionPricing.base_price)}
                                  </p>
                                  <p className="text-sm font-semibold text-emerald-700">
                                    {money(promotionPricing.final_price)}
                                  </p>
                                  <p className="mt-0.5 truncate text-[10px] font-medium text-emerald-700">
                                    {promotionPricing.promotion_type === "QUANTITY_TIER"
                                      ? `${Number(promotionPricing.tier?.min_quantity || 0)}+ unidades`
                                      : "Oferta activa"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-neutral-950">
                                    {money(product.base_price)}
                                  </p>
                                  {nextQuantityTier ? (
                                    <p className="mt-0.5 truncate text-[10px] font-medium text-emerald-700">
                                      {Number(nextQuantityTier.min_quantity)}+ desde {money(nextQuantityTier.unit_price)}
                                    </p>
                                  ) : null}
                                </>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-medium text-neutral-700">
                                IVA incluido
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                                {isFexShipping
                                  ? "Valor editable por operación"
                                  : exclusivePricing
                                    ? `Ahorras ${money(exclusivePricing.discount_per_unit)} por unidad`
                                    : promotionPricing
                                      ? `Ahorras ${money(promotionPricing.discount_per_unit)} por unidad`
                                      : quantityTiers.length > 0
                                        ? getPromotionTierCompactLabel(product)
                                        : "Bodega principal"}
                              </p>
                            </div>

                            {isFexShipping ? (
                              <button
                                type="button"
                                onClick={() =>
                                  addProduct(
                                    product
                                  )
                                }
                                disabled={
                                  disabled
                                }
                                className="h-9 rounded-xl bg-black px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                              >
                                {inCart
                                  ? "Agregado"
                                  : "Agregar"}
                              </button>
                            ) : available <= 0 ? (
                              <button
                                type="button"
                                disabled
                                className="h-9 rounded-xl bg-neutral-300 px-3 text-xs font-semibold text-white"
                              >
                                Sin stock
                              </button>
                            ) : inCart ? (
                              <div className="grid h-9 grid-cols-[36px_1fr_36px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseCatalogProduct(
                                      product.id
                                    )
                                  }
                                  className="flex items-center justify-center text-lg font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
                                  aria-label={`Disminuir cantidad de ${product.name}`}
                                  title="Disminuir"
                                >
                                  −
                                </button>

                                <div className="flex items-center justify-center border-x border-black/10 px-1 text-xs font-semibold text-neutral-900">
                                  {Math.trunc(
                                    Number(
                                      inCart.quantity ||
                                        1
                                    )
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
                                    Number(
                                      inCart.quantity ||
                                        0
                                    ) >=
                                    available
                                  }
                                  className="flex items-center justify-center text-lg font-medium text-white transition bg-black hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                                  aria-label={`Aumentar cantidad de ${product.name}`}
                                  title="Aumentar"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  addProduct(
                                    product
                                  )
                                }
                                className="h-9 rounded-xl bg-black px-3 text-xs font-semibold text-white transition hover:bg-neutral-800"
                              >
                                Agregar
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  {/* =========================================
                      VISTA COMPACTA · MÓVIL / TABLET
                     ========================================= */}
                  <div className="divide-y divide-black/5 lg:hidden">
                    {products.map((product) => {
                      const inCart = cart.find(
                        (item) => item.id === product.id
                      );
                      const isFexShipping =
                        isFexShippingItem(product);

                      const quantityForPricing =
                        Math.max(
                          Number(
                            inCart?.quantity ||
                              1
                          ),
                          1
                        );

                      const quantityTiers =
                        !quotationMode
                          ? getQuantityPromotionTiers(
                              product
                            )
                          : [];

                      const automaticPricing =
                        !quotationMode
                          ? resolveBestAutomaticPricing(
                              product,
                              quantityForPricing,
                              selectedLaminatiCustomer
                                ? customerPriceList
                                : null
                            )
                          : null;

                      const exclusivePricing =
                        automaticPricing?.source ===
                        "PRICE_LIST"
                          ? automaticPricing.pricing
                          : null;

                      const promotionPricing =
                        automaticPricing?.source ===
                        "PROMOTION"
                          ? automaticPricing.pricing
                          : null;

                      const nextQuantityTier =
                        !promotionPricing
                          ? getNextQuantityPromotionTier(
                              product,
                              quantityForPricing
                            )
                          : null;

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

                      const disabled =
                        isFexShipping
                          ? Boolean(inCart)
                          : (
                              available <= 0 ||
                              Number(inCart?.quantity || 0) >= available
                            );

                      return (
                        <article
                          key={product.id}
                          className="p-3 transition hover:bg-white"
                        >
                          <div className="flex gap-3">
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-white">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={imageAlt}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-lg text-neutral-300">
                                  ◇
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                                    {product.sku}
                                  </p>
                                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900">
                                    {product.name}
                                  </h3>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                                    isFexShipping
                                      ? "bg-sky-50 text-sky-700"
                                      : available > 0
                                        ? "bg-white text-neutral-600"
                                        : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {isFexShipping
                                    ? "FEX"
                                    : available > 0
                                      ? `Stock ${Math.trunc(available)}`
                                      : "Sin stock"}
                                </span>
                              </div>

                              <div className="mt-2 flex items-end justify-between gap-3">
                                <div className="min-w-0">
                                  {isFexShipping ? (
                                    <p className="text-sm font-semibold text-neutral-950">
                                      Precio según FEX
                                    </p>
                                  ) : exclusivePricing ? (
                                    <>
                                      <p className="text-[10px] text-neutral-400 line-through">
                                        {money(exclusivePricing.base_price)}
                                      </p>
                                      <p className="text-sm font-semibold text-violet-700">
                                        {money(exclusivePricing.final_price)}
                                      </p>
                                    </>
                                  ) : promotionPricing ? (
                                    <>
                                      <p className="text-[10px] text-neutral-400 line-through">
                                        {money(promotionPricing.base_price)}
                                      </p>
                                      <p className="text-sm font-semibold text-emerald-700">
                                        {money(promotionPricing.final_price)}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm font-semibold text-neutral-950">
                                      {money(product.base_price)}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-neutral-400">
                                    {promotionPricing?.promotion_type === "QUANTITY_TIER"
                                      ? `Volumen desde ${Number(promotionPricing.tier?.min_quantity || 0)} unidades`
                                      : nextQuantityTier
                                        ? `${Number(nextQuantityTier.min_quantity)}+ desde ${money(nextQuantityTier.unit_price)}`
                                        : quantityTiers.length > 0
                                          ? getPromotionTierCompactLabel(product)
                                          : "IVA incluido"}
                                  </p>
                                </div>

                                {isFexShipping ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addProduct(
                                        product
                                      )
                                    }
                                    disabled={
                                      disabled
                                    }
                                    className="h-9 shrink-0 rounded-xl bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                                  >
                                    {inCart
                                      ? "Agregado"
                                      : "Agregar"}
                                  </button>
                                ) : available <= 0 ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="h-9 shrink-0 rounded-xl bg-neutral-300 px-4 text-xs font-semibold text-white"
                                  >
                                    Sin stock
                                  </button>
                                ) : inCart ? (
                                  <div className="grid h-9 w-[116px] shrink-0 grid-cols-[36px_1fr_36px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        decreaseCatalogProduct(
                                          product.id
                                        )
                                      }
                                      className="flex items-center justify-center text-lg font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
                                      aria-label={`Disminuir cantidad de ${product.name}`}
                                      title="Disminuir"
                                    >
                                      −
                                    </button>

                                    <div className="flex items-center justify-center border-x border-black/10 text-xs font-semibold text-neutral-900">
                                      {Math.trunc(
                                        Number(
                                          inCart.quantity ||
                                            1
                                        )
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
                                        Number(
                                          inCart.quantity ||
                                            0
                                        ) >=
                                        available
                                      }
                                      className="flex items-center justify-center bg-black text-lg font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                                      aria-label={`Aumentar cantidad de ${product.name}`}
                                      title="Aumentar"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addProduct(
                                        product
                                      )
                                    }
                                    className="h-9 shrink-0 rounded-xl bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
                                  >
                                    Agregar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          <section id="showroom-step-03" className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
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
                {cart.length} ítem{cart.length === 1 ? "" : "s"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">
                Agrega productos o servicios desde el paso anterior.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                  {cart.map((item) => {
                    const lineSubtotal =
                      getCartLineSubtotal(
                        item,
                        customPricingEnabled
                      );

                    const lineDiscount =
                      getCartDiscountAmount(
                        item,
                        customPricingEnabled,
                        customPricingEnabled
                      );

                    const lineTotal =
                      getCartLineTotal(
                        item,
                        customPricingEnabled,
                        customPricingEnabled
                      );

                    const catalogUnitPrice =
                      getCatalogUnitPrice(
                        item
                      );

                    const saleUnitPrice =
                      getCartUnitPrice(
                        item,
                        customPricingEnabled
                      );

                    const appliedUnitPrice =
                      getCartAppliedUnitPrice(
                        item,
                        customPricingEnabled
                      );

                    const promotionPricingActive =
                      !quotationMode &&
                      item?.promotion_pricing_auto ===
                        true;

                    const promotionTier =
                      item?.promotion_pricing_tier ||
                      null;

                    const nextPromotionTier =
                      !quotationMode
                        ? getNextQuantityPromotionTier(
                            item,
                            item.quantity
                          )
                        : null;

                    const manualServiceNetUnitPrice =
                      isManualServiceItem(item)
                        ? getManualServiceNetUnitPrice(
                            item
                          )
                        : 0;

                    const manualServiceBreakdown =
                      isManualServiceItem(item)
                        ? getTaxBreakdownFromGross(
                            lineTotal,
                            Number(
                              item.tax_rate ??
                                MANUAL_SERVICE_TAX_RATE
                            )
                          )
                        : null;

                    const hasPriceChange =
                      !quotationMode &&
                      !isFexShippingItem(item) &&
                      !isManualServiceItem(item) &&
                      Number(
                        saleUnitPrice
                      ) !==
                        Number(
                          catalogUnitPrice
                        );

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-black/5 bg-[#faf9f7] p-4"
                      >
                        <div
                          className={`grid min-w-0 grid-cols-1 gap-4 [&>*]:min-w-0 ${
                            quotationMode
                              ? "sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                              : "sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_80px_120px_160px_100px] 2xl:items-end"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                              {item.sku}
                            </p>
                            <p className="mt-1 text-sm font-medium text-neutral-900">
                              {item.name}
                            </p>

                            {isManualServiceItem(item) ? (
                              <p className="mt-1 text-[11px] font-medium text-neutral-500">
                                {String(
                                  item.manual_kind ||
                                    ""
                                )
                                  .trim()
                                  .toUpperCase() ===
                                "SUPPLY"
                                  ? "Insumo manual"
                                  : "Servicio manual"}{" "}
                                · no afecta stock ni reservas.
                              </p>
                            ) : isFexShippingItem(item) ? (
                              <p className="mt-1 text-[11px] font-medium text-sky-700">
                                Despacho · valor informado directamente por FEX.
                              </p>
                            ) : promotionPricingActive ? (
                              <div className="mt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
                                    {item.promotion_pricing_type === "QUANTITY_TIER"
                                      ? `Precio volumen · ${Number(promotionTier?.min_quantity || 0)}+ unidades`
                                      : "Oferta activa"}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-neutral-400">
                                  Precio normal {money(catalogUnitPrice)} · Precio aplicado {money(appliedUnitPrice)}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-emerald-700">
                                  Ahorras {money(item.promotion_pricing_discount_per_unit)} por unidad
                                </p>
                              </div>
                            ) : !quotationMode && item.customer_pricing_auto === true ? (
                              <div className="mt-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[9px] font-semibold text-violet-700">
                                    Precio exclusivo cliente · {item.customer_pricing_rule_discount_type === "PERCENTAGE"
                                      ? `${Number(item.customer_pricing_rule_discount_value)}% dto.`
                                      : `${money(item.customer_pricing_discount_per_unit)} dto.`}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-neutral-400">
                                  Precio normal {money(catalogUnitPrice)} · Precio aplicado {money(item.customer_pricing_final_price)}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-emerald-700">
                                  Ahorras {money(item.customer_pricing_discount_per_unit)} por unidad
                                </p>
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-neutral-400">
                                Precio lista {money(catalogUnitPrice)}
                                {!quotationMode && hasPriceChange
                                  ? ` · Precio aplicado ${money(appliedUnitPrice)}`
                                  : nextPromotionTier
                                    ? ` · ${Number(nextPromotionTier.min_quantity)}+ desde ${money(nextPromotionTier.unit_price)}`
                                    : ""}
                              </p>
                            )}
                          </div>

                          {!isFexShippingItem(item) ? (
                            <label className="block">
                              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                Cantidad
                              </span>
                              <input
                                type="number"
                                min="1"
                                max={
                                  isManualServiceItem(item)
                                    ? undefined
                                    : Number(item.available_pos)
                                }
                                value={item.quantity}
                                onChange={(event) =>
                                  updateQuantity(
                                    item.id,
                                    event.target.value
                                  )
                                }
                                className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-center text-sm outline-none transition focus:border-black"
                              />
                            </label>
                          ) : (
                            <div>
                              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                Cantidad
                              </span>
                              <div className="flex h-10 items-center justify-center rounded-xl border border-black/5 bg-white px-3 text-sm font-medium text-neutral-700">
                                1
                              </div>
                            </div>
                          )}

                          {quotationMode ? (
                            isFexShippingItem(item) ? (
                              <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Valor FEX
                                </span>
                                <div className="flex h-10 items-center rounded-xl border border-sky-200 bg-white px-3 focus-within:border-sky-500">
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
                                    className="h-full min-w-0 flex-1 bg-transparent px-1 text-right text-sm font-medium outline-none"
                                  />
                                </div>
                              </label>
                            ) : (
                              <div className="text-right">
                                <p className="text-sm font-semibold text-neutral-950">
                                  {money(lineSubtotal)}
                                </p>
                              </div>
                            )
                          ) : promotionPricingActive ? (
                            <>
                              <div>
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Precio normal
                                </span>
                                <div className="flex h-10 items-center justify-end rounded-xl border border-black/5 bg-white px-3 text-sm font-medium text-neutral-500 line-through">
                                  {money(catalogUnitPrice)}
                                </div>
                              </div>

                              <div>
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                                  {item.promotion_pricing_type === "QUANTITY_TIER"
                                    ? "Precio volumen"
                                    : "Precio oferta"}
                                </span>
                                <div className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                                  <span className="text-[10px] font-semibold text-emerald-700">
                                    {item.promotion_pricing_type === "QUANTITY_TIER"
                                      ? `${Number(promotionTier?.min_quantity || 0)}+ unidades`
                                      : "Promoción"}
                                  </span>
                                  <span className="text-xs font-semibold text-emerald-800">
                                    {money(appliedUnitPrice)}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : !quotationMode && item.customer_pricing_auto === true ? (
                            <>
                              <div>
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Precio normal
                                </span>
                                <div className="flex h-10 items-center justify-end rounded-xl border border-black/5 bg-white px-3 text-sm font-medium text-neutral-500 line-through">
                                  {money(catalogUnitPrice)}
                                </div>
                              </div>

                              <div>
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-500">
                                  Condición comercial
                                </span>
                                <div className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2">
                                  <span className="text-[10px] font-semibold text-violet-700">
                                    Precio exclusivo
                                  </span>
                                  <span className="text-xs font-semibold text-violet-800">
                                    -{money(lineDiscount)}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  {isManualServiceItem(item)
                                    ? "Valor neto"
                                    : isFexShippingItem(item)
                                      ? "Valor FEX"
                                      : "Precio venta"}
                                </span>
                                <div
                                  className={`flex h-10 items-center rounded-xl bg-white px-3 focus-within:border-black ${
                                    isFexShippingItem(item)
                                      ? "border border-sky-200"
                                      : "border border-black/10"
                                  }`}
                                >
                                  <span className="text-xs text-neutral-400">
                                    $
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      isManualServiceItem(item)
                                        ? item.manual_service_net_unit_price ??
                                          String(
                                            Math.round(
                                              manualServiceNetUnitPrice
                                            )
                                          )
                                        : item.unit_price_override ??
                                          ""
                                    }
                                    onChange={(event) =>
                                      updatePriceOverride(
                                        item.id,
                                        event.target.value
                                      )
                                    }
                                    placeholder="0"
                                    className="h-full min-w-0 flex-1 bg-transparent px-1 text-right text-sm font-medium outline-none"
                                  />
                                </div>
                              </label>

                              <div>
                                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Descuento
                                </span>
                                <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-2">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      item.discount_value ??
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateDiscountValue(
                                        item.id,
                                        event.target.value
                                      )
                                    }
                                    placeholder="0"
                                    className="h-10 min-w-0 rounded-xl border border-black/10 bg-white px-3 text-right text-sm font-medium outline-none transition focus:border-black"
                                  />
                                  <select
                                    value={
                                      item.discount_type ||
                                      "PERCENT"
                                    }
                                    onChange={(event) =>
                                      updateDiscountType(
                                        item.id,
                                        event.target.value
                                      )
                                    }
                                    className="h-10 rounded-xl border border-black/10 bg-white px-2 text-xs font-medium text-neutral-700 outline-none transition focus:border-black"
                                  >
                                    <option value="PERCENT">
                                      %
                                    </option>
                                    <option value="AMOUNT">
                                      $
                                    </option>
                                  </select>
                                </div>
                                {lineDiscount > 0 && (
                                  <p className="mt-1 text-right text-[10px] font-medium text-emerald-700">
                                    -{money(lineDiscount)}
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          <div className="flex items-end justify-between gap-3 xl:flex-col xl:items-end">
                            <div className="text-right">
                              {!quotationMode &&
                                lineDiscount > 0 && (
                                  <p className="text-[10px] text-neutral-400 line-through">
                                    {money(lineSubtotal)}
                                  </p>
                                )}

                              {isManualServiceItem(item) &&
                              manualServiceBreakdown ? (
                                <div className="min-w-[145px] space-y-1 rounded-xl border border-black/5 bg-white px-3 py-2">
                                  <div className="flex items-center justify-between gap-3 text-[10px] text-neutral-500">
                                    <span>Neto</span>
                                    <span>
                                      {money(
                                        manualServiceBreakdown.net
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 text-[10px] text-neutral-500">
                                    <span>
                                      IVA {Number(
                                        item.tax_rate ??
                                          MANUAL_SERVICE_TAX_RATE
                                      )}%
                                    </span>
                                    <span>
                                      {money(
                                        manualServiceBreakdown.tax
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-1 text-xs font-semibold text-neutral-950">
                                    <span>Total</span>
                                    <span>
                                      {money(
                                        manualServiceBreakdown.gross
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className={`text-sm font-semibold ${
                                    isFexShippingItem(item) &&
                                    !hasValidFexPrice(item)
                                      ? "text-sky-700"
                                      : "text-neutral-950"
                                  }`}
                                >
                                  {isFexShippingItem(item) &&
                                  !hasValidFexPrice(item)
                                    ? "Ingresa valor"
                                    : money(lineTotal)}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(
                                  item.id
                                )
                              }
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-fit rounded-2xl bg-neutral-950 p-5 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Total operación
                  </p>
                  <div className="mt-5 space-y-2 text-sm">
                    {!quotationMode && (
                      <>
                        <div className="flex justify-between text-white/60">
                          <span>Subtotal</span>
                          <span>{money(grossSubtotal)}</span>
                        </div>
                        {exclusiveCustomerDiscountTotal > 0 && (
                          <div className="flex justify-between text-violet-300">
                            <span>Descuento exclusivo cliente</span>
                            <span>
                              -{money(exclusiveCustomerDiscountTotal)}
                            </span>
                          </div>
                        )}
                        {promotionDiscountTotal > 0 && (
                          <div className="flex justify-between text-emerald-300">
                            <span>Descuento promoción / volumen</span>
                            <span>
                              -{money(promotionDiscountTotal)}
                            </span>
                          </div>
                        )}
                        {otherDiscountTotal > 0 && (
                          <div className="flex justify-between text-emerald-300/90">
                            <span>Otros descuentos</span>
                            <span>
                              -{money(otherDiscountTotal)}
                            </span>
                          </div>
                        )}

                        {documentType === "FACTURA" && (
                          <div className="my-4 border-y border-white/10 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-medium text-white/80">
                                  Descuento factura
                                </p>
                                <p className="mt-0.5 text-[10px] leading-4 text-white/40">
                                  Se aplica después de los descuentos por ítem.
                                </p>
                              </div>

                              {operationDiscountAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    invalidatePendingSale();
                                    setOperationDiscountValue("");
                                  }}
                                  className="text-[10px] font-medium text-white/55 transition hover:text-white"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>

                            <div className="mt-3 grid grid-cols-[1fr_84px] gap-2">
                              <input
                                type="number"
                                min="0"
                                step={
                                  operationDiscountType === "PERCENT"
                                    ? "0.01"
                                    : "1"
                                }
                                value={operationDiscountValue}
                                onChange={(event) => {
                                  invalidatePendingSale();
                                  setOperationDiscountValue(
                                    event.target.value
                                  );
                                }}
                                placeholder="0"
                                className="h-10 min-w-0 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-medium text-white outline-none placeholder:text-white/30 focus:border-white/40"
                              />

                              <select
                                value={operationDiscountType}
                                onChange={(event) => {
                                  invalidatePendingSale();
                                  setOperationDiscountType(
                                    event.target.value
                                  );
                                }}
                                className="h-10 rounded-xl border border-white/15 bg-neutral-900 px-3 text-sm font-medium text-white outline-none focus:border-white/40"
                              >
                                <option value="PERCENT">
                                  %
                                </option>
                                <option value="AMOUNT">
                                  $
                                </option>
                              </select>
                            </div>

                            {operationDiscount.error ? (
                              <p className="mt-2 text-[10px] leading-4 text-red-300">
                                {operationDiscount.error}
                              </p>
                            ) : operationDiscountAmount > 0 ? (
                              <div className="mt-3 flex justify-between text-amber-300">
                                <span>Descuento aplicado</span>
                                <span>
                                  -{money(operationDiscountAmount)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
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

          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Paso 04
                </p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-[28px]">
                  Pago y finalización
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-neutral-500">
                  {quotationMode
                    ? "Define la vigencia, revisa el resumen y genera la cotización."
                    : "Selecciona el medio de pago, revisa el documento y confirma la venta."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 rounded-2xl border border-black/10 bg-neutral-50 p-1">
                  <button
                    type="button"
                    disabled={submitting || quotationSaving}
                    aria-pressed={!quotationMode}
                    onClick={() => {
                      changeClosingMode("SALE");
                    }}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs sm:gap-2 sm:px-3 font-semibold transition ${
                      !quotationMode
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-500 hover:bg-white hover:text-black"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3.75 6.75h2l1.25 8.5h10.75l1.5-6.25H6.25" />
                      <circle cx="9" cy="18.25" r="1" />
                      <circle cx="17" cy="18.25" r="1" />
                    </svg>
                    <span className="text-[11px] font-semibold leading-tight sm:text-xs">Finalizar venta</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting || quotationSaving}
                    aria-pressed={quotationMode}
                    onClick={() => {
                      changeClosingMode("QUOTE");
                    }}
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs sm:gap-2 sm:px-3 font-semibold transition ${
                      quotationMode
                        ? "bg-black text-white shadow-sm"
                        : "text-neutral-500 hover:bg-white hover:text-black"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M6 3.75h8.5L18 7.25V20.25H6z" />
                      <path d="M14 3.75v4h4" />
                      <path d="M9 12h6M9 15.5h6" />
                    </svg>
                    <span className="text-[11px] font-semibold leading-tight sm:text-xs">Generar cotización</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-300 text-[10px] font-bold text-blue-600">
                      i
                    </span>
                    <p className="text-[11px] leading-4 text-blue-800">
                      {quotationMode
                        ? "Estás en el flujo de cotización. No se registrará el pago ni se finalizará la venta."
                        : 'Estás en el flujo de venta. Si necesitas generar una cotización, utiliza la pestaña "Generar cotización".'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {quotationMode && (quotationBlocked || hasQuotationSalePricing) && (
              <div role="status" className="mt-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Conservamos los datos de tu venta al cambiar de modo.</p>
                {hasQuotationManualLines && <p>Los insumos y servicios manuales no se pueden cotizar desde Showroom. Elimínalos del carrito o usa el módulo de Cotizaciones para un proyecto.</p>}
                {hasQuotationGlobalDiscount && <p>El descuento global es exclusivo de venta. Vuelve a “Finalizar venta” y quítalo para generar la cotización.</p>}
                {hasQuotationSalePricing && <p>La cotización usa precios de catálogo, sin los precios personalizados ni descuentos de venta. Esos valores se conservan al volver a “Finalizar venta”. El precio de FEX sí se incluye.</p>}
              </div>
            )}

            {!quotationMode ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">
                      1. Medio de pago
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                      Selecciona cómo realizará el pago el cliente.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 2xl:grid-cols-4">
                    {[
                      {
                        code: "CASH",
                        label: "Efectivo",
                        icon: "cash",
                      },
                      {
                        code: "DEBIT_CARD",
                        label: "Débito",
                        icon: "card",
                      },
                      {
                        code: "CREDIT_CARD",
                        label: "Crédito",
                        icon: "card",
                      },
                      {
                        code: "MANUAL_BANK_TRANSFER",
                        label: "Transferencia",
                        icon: "bank",
                      },
                    ].map((method) => {
                      const active =
                        paymentMethod ===
                        method.code;

                      return (
                        <button
                          key={method.code}
                          type="button"
                          onClick={() => {
                            invalidatePendingSale();
                            setPaymentMethod(
                              method.code
                            );
                          }}
                          aria-pressed={active}
                          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center transition ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-white hover:border-black/25 hover:bg-neutral-50"
                          }`}
                        >
                          {method.icon ===
                          "cash" ? (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect
                                x="3.5"
                                y="6.5"
                                width="17"
                                height="11"
                                rx="1.5"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="2.25"
                              />
                              <path d="M6.5 9.5h.01M17.5 14.5h.01" />
                            </svg>
                          ) : method.icon ===
                            "bank" ? (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path d="M3.75 9h16.5M5.5 9v8.5M9.75 9v8.5M14.25 9v8.5M18.5 9v8.5M3 19h18M12 3.75 20 8H4z" />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect
                                x="3.5"
                                y="5.5"
                                width="17"
                                height="13"
                                rx="2"
                              />
                              <path d="M3.5 9.5h17M7 14h4" />
                            </svg>
                          )}

                          <span className="text-xs font-semibold">
                            {method.label}
                          </span>

                        </button>
                      );
                    })}
                  </div>

                  <div className="my-5 h-px bg-black/5" />

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">
                      2. Notas de la venta{" "}
                      <span className="font-normal text-neutral-500">
                        (opcional)
                      </span>
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                      Puedes agregar información adicional para este documento.
                    </p>

                    <div className="relative mt-3">
                      <textarea
                        rows="4"
                        maxLength={500}
                        value={notes}
                        onChange={(event) => {
                          invalidatePendingSale();
                          setNotes(
                            event.target.value
                          );
                        }}
                        placeholder="Ej. Detalles de la entrega, observaciones del cliente, etc."
                        className="min-h-[122px] w-full resize-none rounded-2xl border border-black/10 px-4 py-3 pr-16 text-sm outline-none transition focus:border-black"
                      />
                      <span className="pointer-events-none absolute bottom-3 right-4 text-[10px] text-neutral-400">
                        {String(notes || "").length}/500
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Resumen de la venta
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          typeof document !==
                          "undefined"
                        ) {
                          document
                            .getElementById(
                              "showroom-step-03"
                            )
                            ?.scrollIntoView({
                              behavior:
                                "smooth",
                              block:
                                "start",
                            });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 transition hover:text-black"
                    >
                      Editar
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="m14.5 5.5 4 4M5 19l2.75-.5L18.5 7.75l-2.25-2.25L5.5 16.25z" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cart
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          item
                        ) => {
                          const imageUrl =
                            item.primary_image_url ||
                            item.primary_image
                              ?.card_url ||
                            item.image_url ||
                            null;

                          const lineTotal =
                            getCartLineTotal(
                              item,
                              customPricingEnabled,
                              customPricingEnabled
                            );

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="grid grid-cols-[40px_minmax(0,1fr)_36px_auto] items-center gap-2.5"
                            >
                              <div className="h-10 w-10 overflow-hidden rounded-xl border border-black/5 bg-neutral-100">
                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      item.name ||
                                      item.sku ||
                                      "Producto"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-300">
                                    {isManualServiceItem(
                                      item
                                    )
                                      ? "S"
                                      : "—"}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-neutral-900">
                                  {
                                    item.name
                                  }
                                </p>
                                <p className="mt-0.5 truncate text-[9px] text-neutral-400">
                                  {isManualServiceItem(
                                    item
                                  )
                                    ? String(
                                        item.manual_kind ||
                                          ""
                                      )
                                        .trim()
                                        .toUpperCase() ===
                                      "SUPPLY"
                                      ? "Insumo manual"
                                      : "Servicio manual"
                                    : item.sku ||
                                      "Producto"}
                                </p>
                              </div>

                              <span className="text-center text-[11px] font-medium text-neutral-600">
                                {
                                  item.quantity
                                }
                              </span>

                              <span className="text-right text-[11px] font-semibold text-neutral-900">
                                {money(
                                  lineTotal
                                )}
                              </span>
                            </div>
                          );
                        }
                      )}

                    {cart.length > 4 ? (
                      <p className="text-[10px] text-neutral-400">
                        +{" "}
                        {cart.length -
                          4}{" "}
                        ítem
                        {cart.length -
                          4 ===
                        1
                          ? ""
                          : "s"}{" "}
                        adicional
                        {cart.length -
                          4 ===
                        1
                          ? ""
                          : "es"}
                      </p>
                    ) : null}
                  </div>

                  <div className="my-4 h-px bg-black/5" />

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-4 text-neutral-500">
                      <span>
                        Subtotal
                      </span>
                      <span className="font-medium text-neutral-800">
                        {money(
                          grossSubtotal
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-neutral-500">
                      <span>
                        Descuentos
                      </span>
                      <span className="font-medium text-neutral-800">
                        {money(
                          lineDiscountTotal +
                            operationDiscountAmount
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2 text-[11px]">
                    <div className="flex justify-between gap-4 text-neutral-500">
                      <span>Neto</span>
                      <span className="font-medium text-neutral-800">{money(total - roundMoney(taxTotal))}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-neutral-500">
                      <span>IVA</span>
                      <span className="font-medium text-neutral-800">{money(taxTotal)}</span>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-black/5" />

                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-semibold text-neutral-950">
                      Total
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-neutral-950">
                      {money(total)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDocumentPreviewOpen(
                          true
                        )
                      }
                      disabled={
                        cart.length ===
                        0
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-xs font-semibold text-neutral-700 transition hover:border-black/25 hover:bg-neutral-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M2.75 12s3.4-5.25 9.25-5.25S21.25 12 21.25 12 17.85 17.25 12 17.25 2.75 12 2.75 12Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.25"
                        />
                      </svg>
                      Previsualizar{" "}
                      {documentType ===
                      "FACTURA"
                        ? "factura"
                        : "boleta"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSubmit
                      }
                      disabled={
                        submitting ||
                        cart.length === 0
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3.75 6.75h2l1.25 8.5h10.75l1.5-6.25H6.25" />
                        <circle
                          cx="9"
                          cy="18.25"
                          r="1"
                        />
                        <circle
                          cx="17"
                          cy="18.25"
                          r="1"
                        />
                      </svg>
                      {submitting
                        ? "Registrando..."
                        : "Confirmar venta"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950">
                      1. Datos de la cotización
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                      Define las condiciones de vigencia y agrega una nota si corresponde.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
                    <Field label="Vigencia de cotización">
                      <select
                        value={
                          validDays
                        }
                        onChange={(
                          event
                        ) =>
                          setValidDays(
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm outline-none transition focus:border-black"
                      >
                        <option
                          value={7}
                        >
                          7 días
                        </option>
                        <option
                          value={15}
                        >
                          15 días
                        </option>
                        <option
                          value={30}
                        >
                          30 días
                        </option>
                      </select>
                    </Field>

                    <Field label="Nota interna (opcional)">
                      <textarea
                        rows="3"
                        maxLength={500}
                        value={notes}
                        onChange={(
                          event
                        ) => {
                          invalidatePendingSale();
                          setNotes(
                            event.target.value
                          );
                        }}
                        placeholder="Agrega condiciones, referencias u observaciones para la cotización..."
                        className="w-full resize-none rounded-xl border border-black/10 px-3.5 py-3 text-sm outline-none transition focus:border-black"
                      />
                    </Field>
                  </div>

                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">
                    <p className="text-[11px] leading-4 text-blue-800">
                      La cotización no registra pago ni finaliza la venta. Podrás revisarla y gestionarla desde el módulo de Cotizaciones.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Resumen de la cotización
                    </h3>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold text-neutral-500">
                      {cart.length} ítem
                      {cart.length ===
                      1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cart
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          item
                        ) => {
                          const imageUrl =
                            item.primary_image_url ||
                            item.primary_image
                              ?.card_url ||
                            item.image_url ||
                            null;

                          const lineTotal =
                            getCartLineSubtotal(
                              item,
                              false
                            );

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="grid grid-cols-[40px_minmax(0,1fr)_36px_auto] items-center gap-2.5"
                            >
                              <div className="h-10 w-10 overflow-hidden rounded-xl border border-black/5 bg-neutral-100">
                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      item.name ||
                                      item.sku ||
                                      "Producto"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-300">
                                    —
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-neutral-900">
                                  {
                                    item.name
                                  }
                                </p>
                                <p className="mt-0.5 truncate text-[9px] text-neutral-400">
                                  {item.sku ||
                                    "Producto"}
                                </p>
                              </div>

                              <span className="text-center text-[11px] font-medium text-neutral-600">
                                {
                                  item.quantity
                                }
                              </span>

                              <span className="text-right text-[11px] font-semibold text-neutral-900">
                                {money(
                                  lineTotal
                                )}
                              </span>
                            </div>
                          );
                        }
                      )}
                    {cart.length > 4 && (
                      <p className="text-[10px] text-neutral-400">
                        + {cart.length - 4} {cart.length === 5 ? "ítem adicional" : "ítems adicionales"}
                      </p>
                    )}
                  </div>

                  <div className="my-4 h-px bg-black/5" />

                  <div className="flex items-end justify-between gap-4">
                    <span className="text-sm font-semibold text-neutral-950">
                      Total referencial
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-neutral-950">
                      {money(
                        quotationPreviewTotal
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleSaveQuotation
                    }
                    disabled={
                      quotationSaving ||
                      quotationBlocked ||
                      cart.length === 0
                    }
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M6 3.75h8.5L18 7.25V20.25H6z" />
                      <path d="M14 3.75v4h4" />
                      <path d="M9 12h6M9 15.5h6" />
                    </svg>
                    {quotationSaving
                      ? "Generando..."
                      : "Generar cotización"}
                  </button>
                </div>
              </div>
            )}

            {quotationResult?.quotation && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-emerald-800">
                  Cotización{" "}
                  <strong>
                    {
                      quotationResult
                        .quotation
                        .quote_number
                    }
                  </strong>{" "}
                  guardada correctamente.
                </p>

                <Link
                  href={`/admin/cotizaciones/${quotationResult.quotation.id}`}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
          </section>
        </div>
      </div>

      {manualServiceOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                  Showroom · Línea manual
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                  Agregar línea manual
                </h2>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Define si la línea corresponde a un insumo/material o a un servicio. Ingresa el valor neto y el sistema calculará automáticamente el IVA 19%.
                </p>
              </div>

              <button
                type="button"
                onClick={closeManualService}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-lg text-neutral-500 transition hover:border-black hover:text-black"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <Field label="Tipo de línea">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
                  {[
                    {
                      value: "SUPPLY",
                      label: "Insumo / material",
                    },
                    {
                      value: "SERVICE",
                      label: "Servicio",
                    },
                  ].map((option) => {
                    const active =
                      String(
                        manualServiceForm.manual_kind ||
                          "SERVICE"
                      ).toUpperCase() ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateManualServiceField(
                            "manual_kind",
                            option.value
                          )
                        }
                        className={`h-10 rounded-lg text-xs font-semibold transition ${
                          active
                            ? "bg-black text-white shadow-sm"
                            : "text-neutral-500 hover:text-black"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label={
                  String(
                    manualServiceForm.manual_kind ||
                      "SERVICE"
                  ).toUpperCase() ===
                  "SUPPLY"
                    ? "Insumo / material"
                    : "Servicio"
                }
              >
                <input
                  value={manualServiceForm.service_name}
                  onChange={(event) =>
                    updateManualServiceField(
                      "service_name",
                      event.target.value
                    )
                  }
                  placeholder={
                    String(
                      manualServiceForm.manual_kind ||
                        "SERVICE"
                    ).toUpperCase() ===
                    "SUPPLY"
                      ? "Ej. Stratificato BK Nero Polaris Graphite 2909 Polaris 6 mm"
                      : "Ej. Servicio instalación HPL muros"
                  }
                  autoFocus
                  className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none transition focus:border-black"
                />
              </Field>

              <Field label="Detalle adicional (opcional)">
                <input
                  value={manualServiceForm.service_detail}
                  onChange={(event) =>
                    updateManualServiceField(
                      "service_detail",
                      event.target.value
                    )
                  }
                  placeholder="Ej. sector, terminación o detalle del trabajo"
                  className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none transition focus:border-black"
                />
              </Field>

              <Field label="OC / Referencia">
                <input
                  value={manualServiceForm.reference_code}
                  onChange={(event) =>
                    updateManualServiceField(
                      "reference_code",
                      event.target.value
                    )
                  }
                  placeholder="Ej. OC 4587"
                  className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none transition focus:border-black"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cantidad">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={manualServiceForm.quantity}
                    onChange={(event) =>
                      updateManualServiceField(
                        "quantity",
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-black/10 px-3.5 text-sm outline-none transition focus:border-black"
                  />
                </Field>

                <Field label="Valor neto unitario">
                  <div className="flex h-11 items-center rounded-xl border border-black/10 px-3.5 focus-within:border-black">
                    <span className="text-sm text-neutral-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={manualServiceForm.unit_price_net}
                      onChange={(event) =>
                        updateManualServiceField(
                          "unit_price_net",
                          event.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 10)
                        )
                      }
                      placeholder="0"
                      className="h-full min-w-0 flex-1 bg-transparent px-2 text-right text-sm font-medium outline-none"
                    />
                  </div>
                </Field>
              </div>

              <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4 text-neutral-600">
                    <span>
                      Neto
                      {manualServicePreview.quantity > 1
                        ? ` (${manualServicePreview.quantity} unidades)`
                        : ""}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {money(manualServicePreview.net)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-neutral-600">
                    <span>IVA 19%</span>
                    <span className="font-medium text-neutral-900">
                      {money(manualServicePreview.tax)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-black/5 pt-2">
                    <span className="font-semibold text-neutral-800">
                      Total línea
                    </span>
                    <span className="text-sm font-semibold text-neutral-950">
                      {money(manualServicePreview.gross)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 text-xs leading-5 text-neutral-600">
                La descripción enviada a la factura combinará el concepto, el detalle y la OC/Referencia. Los insumos se identificarán como INS-HPL y los servicios como SERV-HPL; Relbase reutilizará esos registros técnicos sin controlar stock para estas líneas manuales.
              </div>
            </div>

            <div className="grid gap-2 border-t border-black/5 bg-neutral-50 px-6 py-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeManualService}
                className="h-11 rounded-xl border border-black/10 bg-white text-sm font-medium text-neutral-700 transition hover:border-black"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={addManualService}
                className="h-11 rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Agregar línea
              </button>
            </div>
          </div>
        </div>
      )}

      {documentPreviewOpen && !quotationMode && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-[#f6f5f2] shadow-2xl">
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
                        {cart.length} ítem{cart.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-4 divide-y divide-black/5">
                      {cart.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-400">
                          No hay productos en el carrito.
                        </div>
                      ) : (
                        cart.map((item) => {
                          const previewUnitPrice =
                            getCartAppliedUnitPrice(
                              item,
                              customPricingEnabled
                            );

                          const previewDiscount =
                            getCartDiscountAmount(
                              item,
                              customPricingEnabled,
                              customPricingEnabled
                            );

                          const previewLineTotal =
                            getCartLineTotal(
                              item,
                              customPricingEnabled,
                              customPricingEnabled
                            );

                          return (
                            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0 last:pb-0">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  {item.sku}
                                </p>
                                <p className="mt-1 text-sm font-medium text-neutral-900">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-neutral-500">
                                  {item.quantity} × {money(previewUnitPrice)}
                                </p>
                                {!quotationMode &&
                                  previewDiscount > 0 && (
                                    <p className="mt-1 text-xs font-medium text-emerald-700">
                                      Descuento -{money(previewDiscount)}
                                    </p>
                                  )}
                              </div>
                              <p className="self-end text-sm font-semibold text-neutral-950">
                                {money(previewLineTotal)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-[1.4rem] border border-black/5 bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Resumen</p>
                    <div className="mt-4 space-y-3 text-sm">
                      {!quotationMode && (
                        <>
                          <div className="flex justify-between gap-4 text-neutral-500">
                            <span>Subtotal</span>
                            <span>{money(grossSubtotal)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-700">
                            <span>Descuentos por ítem</span>
                            <span>-{money(lineDiscountTotal)}</span>
                          </div>
                          {operationDiscountAmount > 0 && (
                            <div className="flex justify-between gap-4 text-amber-700">
                              <span>Descuento factura</span>
                              <span>
                                -{money(operationDiscountAmount)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
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
                      <div className="mt-2 flex justify-between gap-4">
                        <span className="text-neutral-500">Monto</span>
                        <span className="font-medium text-neutral-900">
                          {money(total)}
                        </span>
                      </div>
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
              {saleResult?.dte_emission?.completed
                ? "La venta quedó registrada y el documento tributario ya se encuentra emitido."
                : saleResult?.dte_emission?.queued
                  ? "La venta quedó registrada y el documento tributario se está emitiendo en segundo plano. Puedes continuar trabajando sin esperar a Relbase."
                  : "La venta quedó registrada, pero la emisión tributaria requiere revisión. Revisa Documentos tributarios antes de volver a intentar cualquier emisión."}
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
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-neutral-500">Documento</span>
                <span
                  className={`font-medium ${
                    saleResult?.dte_emission?.completed
                      ? "text-emerald-700"
                      : saleResult?.dte_emission?.queued
                        ? "text-amber-700"
                        : "text-rose-700"
                  }`}
                >
                  {saleResult?.dte_emission?.completed
                    ? "Emitido"
                    : saleResult?.dte_emission?.queued
                      ? "En emisión"
                      : "Revisar emisión"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Link
                href={`/admin/pedidos/${saleResult?.order?.id || ""}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 text-sm font-medium text-neutral-700"
              >
                Ver pedido
              </Link>

              <Link
                href="/admin/documentos-tributarios"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 text-sm font-medium text-neutral-700"
              >
                Documentos
              </Link>

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
