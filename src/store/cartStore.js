import { create } from "zustand";

const getItemKey = (item) =>
  item?.product_id ||
  item?.id ||
  item?.slug ||
  item?.sku;

const getAvailableStock = (item) => {
  const stock = Number(item?.available_web);

  if (!Number.isFinite(stock) || stock < 0) {
    return 0;
  }

  return stock;
};

const roundMoney = (value) =>
  Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;

const normalizeTiers = (rawValue) => {
  let value = rawValue;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = [];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tier) => ({
      id: tier?.id || null,
      min_quantity: Number(tier?.min_quantity),
      unit_price: Number(tier?.unit_price),
    }))
    .filter(
      (tier) =>
        Number.isFinite(tier.min_quantity) &&
        tier.min_quantity > 0 &&
        Number.isFinite(tier.unit_price) &&
        tier.unit_price >= 0
    )
    .sort(
      (left, right) =>
        left.min_quantity - right.min_quantity
    );
};

const normalizeActivePromotions = (product) => {
  let rawPromotions = product?.active_promotions;

  if (typeof rawPromotions === "string") {
    try {
      rawPromotions = JSON.parse(rawPromotions);
    } catch {
      rawPromotions = [];
    }
  }

  const promotions = Array.isArray(rawPromotions)
    ? rawPromotions
        .map((promotion) => {
          const promotionType = String(
            promotion?.promotion_type ||
              promotion?.type ||
              ""
          )
            .trim()
            .toUpperCase();

          const rawPrice =
            promotion?.promotional_price;

          const promotionalPrice =
            rawPrice === null ||
            rawPrice === undefined ||
            rawPrice === ""
              ? null
              : Number(rawPrice);

          return {
            id: promotion?.id || null,
            name: promotion?.name || null,
            promotion_type: promotionType,
            promotional_price:
              Number.isFinite(promotionalPrice)
                ? promotionalPrice
                : null,
            starts_at:
              promotion?.starts_at || null,
            ends_at:
              promotion?.ends_at || null,
            tiers: normalizeTiers(
              promotion?.tiers ||
                promotion?.quantity_tiers ||
                []
            ),
          };
        })
        .filter(
          (promotion) =>
            Boolean(promotion.id) &&
            (
              promotion.promotion_type ===
                "FIXED_PRICE" ||
              promotion.promotion_type ===
                "QUANTITY_TIER"
            )
        )
    : [];

  /*
   * Compatibilidad con productos que todavía tengan
   * únicamente los campos legacy de promoción.
   */
  if (promotions.length === 0) {
    const legacyType = String(
      product?.promotion_type || ""
    )
      .trim()
      .toUpperCase();

    if (legacyType === "FIXED_PRICE") {
      const rawLegacyPrice =
        product?.promotional_price;

      const legacyPrice =
        rawLegacyPrice === null ||
        rawLegacyPrice === undefined ||
        rawLegacyPrice === ""
          ? null
          : Number(rawLegacyPrice);

      if (
        Number.isFinite(legacyPrice) &&
        legacyPrice >= 0
      ) {
        promotions.push({
          id:
            product?.promotion_id ||
            "legacy-fixed",
          name:
            product?.promotion_name || null,
          promotion_type: "FIXED_PRICE",
          promotional_price: legacyPrice,
          starts_at:
            product?.promotion_starts_at ||
            null,
          ends_at:
            product?.promotion_ends_at ||
            null,
          tiers: [],
        });
      }
    }

    if (legacyType === "QUANTITY_TIER") {
      const tiers = normalizeTiers(
        product?.quantity_tiers
      );

      if (tiers.length > 0) {
        promotions.push({
          id:
            product?.promotion_id ||
            "legacy-quantity",
          name:
            product?.promotion_name || null,
          promotion_type: "QUANTITY_TIER",
          promotional_price: null,
          starts_at:
            product?.promotion_starts_at ||
            null,
          ends_at:
            product?.promotion_ends_at ||
            null,
          tiers,
        });
      }
    }
  }

  return promotions;
};

const getSafeBasePrice = (product) => {
  const basePrice = Number(product?.base_price);
  const currentPrice = Number(product?.price);

  if (
    Number.isFinite(basePrice) &&
    basePrice > 0
  ) {
    return basePrice;
  }

  if (
    Number.isFinite(currentPrice) &&
    currentPrice >= 0
  ) {
    return currentPrice;
  }

  return 0;
};

const resolvePublicPromotion = (
  product,
  quantity
) => {
  const normalizedQuantity = Math.max(
    Number(quantity) || 1,
    1
  );

  const basePrice =
    getSafeBasePrice(product);

  const activePromotions =
    normalizeActivePromotions(product);

  let bestCandidate = {
    unit_price: basePrice,
    promotion: null,
    tier: null,
  };

  for (const promotion of activePromotions) {
    if (
      promotion.promotion_type ===
      "FIXED_PRICE"
    ) {
      const price = Number(
        promotion.promotional_price
      );

      if (
        Number.isFinite(price) &&
        price >= 0 &&
        price < bestCandidate.unit_price
      ) {
        bestCandidate = {
          unit_price: price,
          promotion,
          tier: null,
        };
      }

      continue;
    }

    if (
      promotion.promotion_type !==
      "QUANTITY_TIER"
    ) {
      continue;
    }

    let matchedTier = null;

    for (const tier of promotion.tiers) {
      if (
        normalizedQuantity >=
        tier.min_quantity
      ) {
        matchedTier = tier;
      } else {
        break;
      }
    }

    if (!matchedTier) {
      continue;
    }

    const price = Number(
      matchedTier.unit_price
    );

    if (
      Number.isFinite(price) &&
      price >= 0 &&
      price < bestCandidate.unit_price
    ) {
      bestCandidate = {
        unit_price: price,
        promotion,
        tier: matchedTier,
      };
    }
  }

  return {
    base_price: basePrice,
    active_promotions: activePromotions,
    ...bestCandidate,
  };
};

const getStoredCustomerPrice = (product) => {
  const explicitPrice =
    product?.customer_price_list_price ??
    product?.price_list_price;

  const parsedExplicit =
    explicitPrice === null ||
    explicitPrice === undefined ||
    explicitPrice === ""
      ? NaN
      : Number(explicitPrice);

  if (
    Number.isFinite(parsedExplicit) &&
    parsedExplicit > 0
  ) {
    return parsedExplicit;
  }

  /*
   * Compatibilidad con carritos creados antes de esta
   * fase: si el precio actual provenía de PRICE_LIST,
   * lo preservamos como precio cliente.
   */
  if (
    product?.customer_price === true ||
    product?.pricing_source === "PRICE_LIST"
  ) {
    const currentPrice = Number(product?.price);

    if (
      Number.isFinite(currentPrice) &&
      currentPrice > 0
    ) {
      return currentPrice;
    }
  }

  return NaN;
};

const applyPricingForQuantity = (
  product,
  quantity
) => {
  const normalizedQuantity = Math.max(
    Number(quantity) || 1,
    1
  );

  const publicPricing =
    resolvePublicPromotion(
      product,
      normalizedQuantity
    );

  const customerPrice =
    getStoredCustomerPrice(product);

  const hasCustomerPrice =
    Number.isFinite(customerPrice) &&
    customerPrice > 0;

  const customerWins =
    hasCustomerPrice &&
    customerPrice <=
      publicPricing.unit_price;

  const finalPrice = roundMoney(
    customerWins
      ? customerPrice
      : publicPricing.unit_price
  );

  const basePrice = roundMoney(
    publicPricing.base_price
  );

  const publicPromotion =
    customerWins
      ? null
      : publicPricing.promotion;

  const appliedTier =
    customerWins
      ? null
      : publicPricing.tier;

  const pricingSource = customerWins
    ? "PRICE_LIST"
    : publicPromotion
      ? publicPromotion.promotion_type ===
        "QUANTITY_TIER"
        ? "QUANTITY_PROMOTION"
        : "PROMOTION"
      : "BASE";

  const discountAmount = Math.max(
    basePrice - finalPrice,
    0
  );

  const discountPercentage =
    basePrice > 0
      ? (discountAmount / basePrice) * 100
      : 0;

  return {
    ...product,

    quantity:
      normalizedQuantity,

    price:
      finalPrice,

    base_price:
      basePrice,

    pricing_source:
      pricingSource,

    customer_price:
      customerWins,

    /*
     * Se preserva siempre el precio de lista disponible,
     * aunque temporalmente gane una promoción pública.
     * Esto permite recalcular correctamente al disminuir
     * nuevamente la cantidad.
     */
    customer_price_list_price:
      hasCustomerPrice
        ? customerPrice
        : null,

    discount_amount:
      discountAmount,

    discount_percentage:
      discountPercentage,

    active_promotions:
      publicPricing.active_promotions,

    promotion_id:
      publicPromotion?.id || null,

    promotion_name:
      publicPromotion?.name || null,

    promotion_type:
      publicPromotion?.promotion_type || null,

    quantity_tiers:
      publicPromotion?.promotion_type ===
      "QUANTITY_TIER"
        ? publicPromotion.tiers
        : [],

    quantity_promotion_min:
      appliedTier
        ? Number(appliedTier.min_quantity)
        : null,

    applied_promotion_tier:
      appliedTier
        ? {
            id:
              appliedTier.id || null,
            min_quantity:
              Number(
                appliedTier.min_quantity
              ),
            unit_price:
              Number(
                appliedTier.unit_price
              ),
          }
        : null,
  };
};

const normalizeCommercialPricing = (
  product
) => {
  const normalizedProduct = {
    ...product,
    active_promotions:
      normalizeActivePromotions(product),
  };

  const customerPrice =
    getStoredCustomerPrice(product);

  if (
    Number.isFinite(customerPrice) &&
    customerPrice > 0
  ) {
    normalizedProduct.customer_price_list_price =
      customerPrice;
  }

  return normalizedProduct;
};

export const useCartStore = create(
  (set, get) => ({
    items: [],

    addItem: (product) => {
      const normalizedProduct =
        normalizeCommercialPricing(product);

      const productKey = getItemKey(
        normalizedProduct
      );

      if (!productKey) {
        return;
      }

      const availableStock =
        getAvailableStock(
          normalizedProduct
        );

      if (
        normalizedProduct?.in_stock === false ||
        availableStock <= 0
      ) {
        return;
      }

      set((state) => {
        const existingItem =
          state.items.find(
            (item) =>
              getItemKey(item) ===
              productKey
          );

        if (existingItem) {
          const currentQuantity = Math.max(
            Number(
              existingItem.quantity
            ) || 1,
            1
          );

          if (
            currentQuantity >=
            availableStock
          ) {
            return state;
          }

          const nextQuantity = Math.min(
            currentQuantity + 1,
            availableStock
          );

          return {
            items: state.items.map(
              (item) => {
                if (
                  getItemKey(item) !==
                  productKey
                ) {
                  return item;
                }

                /*
                 * Conservamos metadata previa del carrito
                 * y refrescamos la información proveniente
                 * de la ficha antes de recalcular.
                 */
                const mergedProduct = {
                  ...item,
                  ...normalizedProduct,

                  customer_price_list_price:
                    item
                      .customer_price_list_price ??
                    normalizedProduct
                      .customer_price_list_price ??
                    null,
                };

                return applyPricingForQuantity(
                  mergedProduct,
                  nextQuantity
                );
              }
            ),
          };
        }

        return {
          items: [
            ...state.items,
            applyPricingForQuantity(
              normalizedProduct,
              1
            ),
          ],
        };
      });
    },

    increaseItem: (productKey) => {
      set((state) => ({
        items: state.items.map(
          (item) => {
            if (
              getItemKey(item) !==
              productKey
            ) {
              return item;
            }

            const availableStock =
              getAvailableStock(item);

            const currentQuantity =
              Math.max(
                Number(
                  item.quantity
                ) || 1,
                1
              );

            if (
              availableStock <= 0 ||
              currentQuantity >=
                availableStock
            ) {
              return item;
            }

            return applyPricingForQuantity(
              item,
              currentQuantity + 1
            );
          }
        ),
      }));
    },

    decreaseItem: (productKey) => {
      set((state) => {
        const targetItem =
          state.items.find(
            (item) =>
              getItemKey(item) ===
              productKey
          );

        if (!targetItem) {
          return state;
        }

        const currentQuantity = Math.max(
          Number(
            targetItem.quantity
          ) || 1,
          1
        );

        if (currentQuantity <= 1) {
          return {
            items: state.items.filter(
              (item) =>
                getItemKey(item) !==
                productKey
            ),
          };
        }

        return {
          items: state.items.map(
            (item) =>
              getItemKey(item) ===
              productKey
                ? applyPricingForQuantity(
                    item,
                    currentQuantity - 1
                  )
                : item
          ),
        };
      });
    },

    removeItem: (productKey) => {
      set((state) => ({
        items: state.items.filter(
          (item) =>
            getItemKey(item) !==
            productKey
        ),
      }));
    },

    clearCart: () => {
      set({
        items: [],
      });
    },

    getTotalItems: () =>
      get().items.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      ),

    getSubtotal: () =>
      get().items.reduce(
        (total, item) =>
          total +
          Number(
            item.price || 0
          ) *
            Number(
              item.quantity || 0
            ),
        0
      ),
  })
);

export {
  applyPricingForQuantity,
  resolvePublicPromotion,
};
