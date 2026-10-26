"use client";

import { useState } from "react";

import Link from "next/link";

import { useCartStore } from "@/store/cartStore";

/* =========================================
   FORMATEAR PRECIO CLP
========================================= */

const formatPrice = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "$0";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(number);
};

/* =========================================
   PRODUCT CARD
========================================= */

export default function ProductCard({ product }) {
  const [showSecondaryImage, setShowSecondaryImage] =
    useState(false);

  const items = useCartStore((state) => state.items);

  const addItem = useCartStore((state) => state.addItem);

  const availableStock = Math.max(
    Number(product.available_web) || 0,
    0
  );

  const currentCartItem = items.find(
    (item) => item.product_id === product.id
  );

  const currentQuantity =
    currentCartItem?.quantity || 0;

  /* =========================================
     KISAFIX / ADHESIVOS

     Oculta el SKU solamente para los productos
     Kisafix en la tarjeta pública.
     Los laminados mantienen su SKU visible.
  ========================================= */

  const isKisafixProduct = String(
    product.sku || ""
  )
    .trim()
    .toUpperCase()
    .startsWith("KISAFIX-");

  const canAdd =
    product.in_stock &&
    availableStock > 0 &&
    currentQuantity < availableStock;

  const finalPrice = Number(
    product.final_price ?? product.base_price ?? 0
  );

  const basePrice = Number(
    product.base_price ?? finalPrice
  );

  const hasPromotion =
    Boolean(product.has_promotion) &&
    finalPrice < basePrice;

  /* =========================================
     IMAGEN PRINCIPAL

     Prioridad:
     1. Railway card
     2. image_url anterior
  ========================================= */

  const primaryImageUrl =
    product.primary_image?.card_url ||
    product.primary_image_url ||
    null;

  const primaryImageAlt =
    product.primary_image?.alt_text ||
    product.primary_image_alt ||
    product.name;

  /* =========================================
     IMAGEN SECUNDARIA / HOVER

     Railway:
     secondary_image.card_url
  ========================================= */

  const secondaryImageUrl =
    product.secondary_image?.card_url ||
    product.secondary_image_url ||
    null;

  const secondaryImageAlt =
    product.secondary_image?.alt_text ||
    product.name;

  const hasSecondaryImage =
    Boolean(secondaryImageUrl);

  /* =========================================
     HOVER SOLO PARA DISPOSITIVOS
     CON PUNTERO REAL

     En touch no cambiamos la imagen.
  ========================================= */

  const handlePointerEnter = (event) => {
    if (
      event.pointerType === "mouse" &&
      hasSecondaryImage
    ) {
      setShowSecondaryImage(true);
    }
  };

  const handlePointerLeave = () => {
    setShowSecondaryImage(false);
  };

  /* =========================================
     AGREGAR AL CARRITO
  ========================================= */

  const handleAddToCart = () => {
    if (!canAdd) {
      return;
    }

    addItem({
      product_id: product.id,

      slug: product.slug,

      sku: product.sku,

      name: product.name,

      price: finalPrice,

      base_price: basePrice,

      image_url: primaryImageUrl,

      image_alt: primaryImageAlt,

      available_web: availableStock,

      in_stock: product.in_stock,
    });
  };

  return (
    <article className="group">

      {/* =====================================
          IMAGEN
      ===================================== */}

      <div
        className="relative overflow-hidden rounded-[1.5rem] bg-[#f3f2ee]"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >

        <Link
          href={`/productos/${product.slug}`}
          className="relative block aspect-[4/5] overflow-hidden"
        >

          {primaryImageUrl ? (
            <>
              {/* =================================
                  IMAGEN PRINCIPAL
              ================================= */}

              <img
                src={primaryImageUrl}
                alt={primaryImageAlt}
                loading="lazy"
                className={`
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-all
                  duration-700
                  ease-out
                  ${
                    showSecondaryImage &&
                    hasSecondaryImage
                      ? "scale-[1.02] opacity-0"
                      : "scale-100 opacity-100"
                  }
                `}
              />

              {/* =================================
                  IMAGEN SECUNDARIA
                  HOVER
              ================================= */}

              {hasSecondaryImage && (
                <img
                  src={secondaryImageUrl}
                  alt={secondaryImageAlt}
                  loading="lazy"
                  aria-hidden={
                    !showSecondaryImage
                  }
                  className={`
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    transition-all
                    duration-700
                    ease-out
                    ${
                      showSecondaryImage
                        ? "scale-100 opacity-100"
                        : "scale-[1.02] opacity-0"
                    }
                  `}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">

              <div className="text-center">

                <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400">
                  LAMINATI
                </p>

                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-neutral-300">
                  Imagen próximamente
                </p>

              </div>

            </div>
          )}

        </Link>

        {/* =====================================
            PROMOCIÓN
        ===================================== */}

        {hasPromotion && (
          <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white">

            Oferta

          </span>
        )}

        {/* =====================================
            STOCK
        ===================================== */}

        <div className="absolute right-4 top-4">

          {product.in_stock ? (
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-neutral-700 backdrop-blur">

              Disponible

            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-neutral-500 backdrop-blur">

              Sin stock

            </span>
          )}

        </div>

      </div>

      {/* =====================================
          INFORMACIÓN
      ===================================== */}

      <div className="pt-5">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            {/* =================================
                CATEGORÍA
            ================================= */}

            {product.category && (
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">

                {product.category}

              </p>
            )}

            {/* =================================
                NOMBRE
            ================================= */}

            <Link
              href={`/productos/${product.slug}`}
              className="block"
            >

              <h3 className="text-lg font-medium leading-6 tracking-[-0.02em] text-neutral-950 transition-colors hover:text-neutral-600">

                {product.name}

              </h3>

            </Link>

            {/* =================================
                SKU
            ================================= */}

            {product.sku && !isKisafixProduct && (
              <p className="mt-2 text-xs text-neutral-400">

                SKU {product.sku}

              </p>
            )}

          </div>

          {/* =================================
              PRECIO
          ================================= */}

          <div className="shrink-0 text-right">

            {hasPromotion && (
              <p className="text-xs text-neutral-400 line-through">

                {formatPrice(basePrice)}

              </p>
            )}

            <p className="text-base font-medium text-neutral-950">

              {formatPrice(finalPrice)}

            </p>

          </div>

        </div>

        {/* =====================================
            BOTÓN
        ===================================== */}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-full px-5 text-sm font-medium transition duration-300 ${
            canAdd
              ? "bg-black text-white hover:bg-neutral-800"
              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
          }`}
        >

          {!product.in_stock || availableStock <= 0
            ? "Sin stock"
            : currentQuantity >= availableStock
              ? "Máximo disponible en carrito"
              : "Agregar al carrito"}

        </button>

      </div>

    </article>
  );
}