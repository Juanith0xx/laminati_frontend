"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

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

const getItemKey = (item) =>
  item?.product_id ||
  item?.id ||
  item?.slug ||
  item?.sku;

const getDisplayName = (item) => {
  const name = String(item?.name || "").trim();

  if (!name) {
    return "Producto";
  }

  return name.split("|")[0].trim();
};

const getFinish = (item) => {
  const name = String(item?.name || "");

  if (!name.includes("|")) {
    return null;
  }

  const finish = name
    .split("|")
    .slice(1)
    .join("|")
    .trim();

  return finish || null;
};


const getFinalUnitPrice = (item) => {
  const value = Number(item?.price);

  return Number.isFinite(value)
    ? value
    : 0;
};

const getBaseUnitPrice = (item) => {
  const base = Number(item?.base_price);
  const finalPrice = getFinalUnitPrice(item);

  return Number.isFinite(base) && base > 0
    ? base
    : finalPrice;
};

const isCustomerExclusivePrice = (item) =>
  item?.customer_price === true ||
  item?.pricing_source === "PRICE_LIST";

const isPublicPromotionPrice = (item) =>
  item?.pricing_source === "PROMOTION" ||
  item?.pricing_source === "QUANTITY_PROMOTION";

const getPromotionLabel = (item) =>
  item?.pricing_source === "QUANTITY_PROMOTION"
    ? "Oferta por cantidad"
    : "Oferta";

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

  const base = getBaseUnitPrice(item);
  const discount = getUnitDiscountAmount(item);

  return base > 0
    ? (discount / base) * 100
    : 0;
};

const formatPercent = (value) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return `${Number(number.toFixed(2))}%`;
};

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = items.reduce(
    (total, item) =>
      total +
      getFinalUnitPrice(item) *
        Number(item.quantity || 0),
    0
  );

  const baseSubtotal = items.reduce(
    (total, item) =>
      total +
      getBaseUnitPrice(item) *
        Number(item.quantity || 0),
    0
  );

  const customerDiscountTotal = items.reduce(
    (total, item) => {
      if (!isCustomerExclusivePrice(item)) {
        return total;
      }

      return (
        total +
        getUnitDiscountAmount(item) *
          Number(item.quantity || 0)
      );
    },
    0
  );

  const otherDiscountTotal = Math.max(
    baseSubtotal -
      subtotal -
      customerDiscountTotal,
    0
  );

  const hasAnyDiscount =
    baseSubtotal > subtotal;

  const totalUnits = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const totalProducts = items.length;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
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

            <span className="text-neutral-700">
              Carrito
            </span>
          </nav>

          <section className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-neutral-200 bg-[#fafafa] px-6 py-16 text-center sm:px-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 4h2l2.2 10.2a2 2 0 0 0 1.95 1.58h7.88a2 2 0 0 0 1.95-1.56L21 7H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
            </div>

            <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
              Tu compra
            </p>

            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              Tu carrito está vacío
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-500 sm:text-base">
              Explora nuestros productos y agrega los laminados,
              complementos y accesorios que necesitas para tu proyecto.
            </p>

            <Link
              href="/productos"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Ver productos
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
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

          <span className="text-neutral-700">
            Carrito
          </span>
        </nav>

        <div className="mb-10 flex flex-col gap-5 border-b border-neutral-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
              Tu compra
            </p>

            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-5xl">
              Carrito
            </h1>

            <p className="mt-4 text-sm text-neutral-500">
              {totalProducts === 1
                ? "1 producto"
                : `${totalProducts} productos`}
              {" · "}
              {totalUnits === 1
                ? "1 unidad"
                : `${totalUnits} unidades`}
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="w-fit text-sm font-medium text-neutral-400 underline-offset-4 transition hover:text-black hover:underline"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-14">
          <section>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {items.map((item) => {
                const itemKey = getItemKey(item);
                const quantity = Math.max(
                  Number(item.quantity) || 1,
                  1
                );
                const availableStock = Math.max(
                  Number(item.available_web) || 0,
                  0
                );
                const canIncrease = availableStock > quantity;
                const finalUnitPrice =
                  getFinalUnitPrice(item);
                const baseUnitPrice =
                  getBaseUnitPrice(item);
                const itemSubtotal =
                  finalUnitPrice * quantity;
                const baseItemSubtotal =
                  baseUnitPrice * quantity;
                const unitDiscount =
                  getUnitDiscountAmount(item);
                const itemDiscount =
                  unitDiscount * quantity;
                const customerExclusive =
                  isCustomerExclusivePrice(item) &&
                  unitDiscount > 0;
                const publicPromotion =
                  isPublicPromotionPrice(item) &&
                  unitDiscount > 0;
                const hasItemDiscount =
                  unitDiscount > 0;
                const discountPercent =
                  formatPercent(
                    getDiscountPercentage(item)
                  );
                const displayName = getDisplayName(item);
                const finish = getFinish(item);

                return (
                  <article
                    key={itemKey}
                    className="grid gap-5 py-7 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7 lg:grid-cols-[170px_minmax(0,1fr)]"
                  >
                    <Link
                      href={
                        item.slug
                          ? `/productos/${item.slug}`
                          : "/productos"
                      }
                      className="group relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-neutral-200 bg-[#f3f2ee]"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.image_alt || displayName}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-5 text-center">
                          <div>
                            <p className="text-sm font-semibold tracking-[0.16em] text-neutral-400">
                              LAMINATI
                            </p>
                            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-300">
                              Imagen próximamente
                            </p>
                          </div>
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-col justify-between">
                      <div className="flex gap-5">
                        <div className="min-w-0 flex-1">
                          {item.sku && (
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                              SKU {item.sku}
                            </p>
                          )}

                          <Link
                            href={
                              item.slug
                                ? `/productos/${item.slug}`
                                : "/productos"
                            }
                            className="mt-2 block w-fit"
                          >
                            <h2 className="text-xl font-medium tracking-[-0.03em] text-neutral-950 transition hover:text-neutral-600 sm:text-2xl">
                              {displayName}
                            </h2>
                          </Link>

                          {finish && (
                            <p className="mt-2 text-sm text-neutral-500">
                              {finish}
                            </p>
                          )}

                          {hasItemDiscount ? (
                            <div className="mt-4">
                              <p className="text-xs text-neutral-400 line-through">
                                {formatPrice(baseUnitPrice)}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <p className="text-base font-medium text-neutral-950">
                                  {formatPrice(finalUnitPrice)}
                                </p>

                                {customerExclusive && (
                                  <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">
                                    Precio exclusivo cliente
                                    {discountPercent
                                      ? ` · ${discountPercent} dto.`
                                      : ""}
                                  </span>
                                )}

                                {publicPromotion && (
                                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                                    {getPromotionLabel(item)}
                                    {item?.quantity_promotion_min
                                      ? ` · desde ${Number(
                                          item.quantity_promotion_min
                                        )} láminas`
                                      : ""}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1.5 text-xs text-emerald-700">
                                Ahorras {formatPrice(unitDiscount)} por unidad
                              </p>
                            </div>
                          ) : (
                            <p className="mt-4 text-base font-medium text-neutral-950">
                              {formatPrice(finalUnitPrice)}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-neutral-400">
                            IVA incluido · precio unitario
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(itemKey)}
                          aria-label={`Eliminar ${displayName} del carrito`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                            Cantidad
                          </p>

                          <div className="inline-flex h-11 items-center rounded-full border border-neutral-200 bg-white">
                            <button
                              type="button"
                              onClick={() => decreaseItem(itemKey)}
                              aria-label={`Disminuir cantidad de ${displayName}`}
                              className="flex h-full w-11 items-center justify-center rounded-l-full text-lg text-neutral-700 transition hover:bg-neutral-100"
                            >
                              −
                            </button>

                            <span className="flex min-w-10 items-center justify-center px-1 text-sm font-medium text-neutral-950">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseItem(itemKey)}
                              disabled={!canIncrease}
                              aria-label={`Aumentar cantidad de ${displayName}`}
                              className="flex h-full w-11 items-center justify-center rounded-r-full text-lg text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                              +
                            </button>
                          </div>

                          <p
                            className={`mt-2 text-xs ${
                              canIncrease
                                ? "text-neutral-400"
                                : "font-medium text-amber-700"
                            }`}
                          >
                            {availableStock > 0
                              ? canIncrease
                                ? `${availableStock} unidades disponibles`
                                : "Máximo disponible en carrito"
                              : "Sin stock disponible"}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                            Subtotal
                          </p>

                          {hasItemDiscount && (
                            <p className="mt-2 text-xs text-neutral-400 line-through">
                              {formatPrice(baseItemSubtotal)}
                            </p>
                          )}

                          <p className={`${hasItemDiscount ? "mt-1" : "mt-2"} text-xl font-medium tracking-[-0.03em] text-neutral-950`}>
                            {formatPrice(itemSubtotal)}
                          </p>

                          {itemDiscount > 0 && (
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              -{formatPrice(itemDiscount)} descuento
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <Link
              href="/productos"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              <span aria-hidden="true">←</span>
              Seguir comprando
            </Link>
          </section>

          <aside className="lg:self-start">
            <div className="rounded-[1.75rem] border border-neutral-200 bg-[#fafafa] p-6 shadow-sm sm:p-8 lg:sticky lg:top-28">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                Resumen
              </p>

              <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                Resumen de compra
              </h2>

              <dl className="mt-8 space-y-4 border-b border-neutral-200 pb-6">
                <div className="flex items-center justify-between gap-5">
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
                  <div className="flex items-center justify-between gap-5">
                    <dt className="text-sm font-medium text-violet-700">
                      Descuento exclusivo cliente
                    </dt>
                    <dd className="text-sm font-medium text-violet-700">
                      -{formatPrice(customerDiscountTotal)}
                    </dd>
                  </div>
                )}

                {otherDiscountTotal > 0 && (
                  <div className="flex items-center justify-between gap-5">
                    <dt className="text-sm text-neutral-500">
                      Ofertas y promociones
                    </dt>
                    <dd className="text-sm font-medium text-emerald-700">
                      -{formatPrice(otherDiscountTotal)}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between gap-5">
                  <dt className="text-sm text-neutral-500">
                    Entrega
                  </dt>
                  <dd className="text-right text-sm font-medium text-neutral-950">
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
                  {formatPrice(subtotal)}
                </p>
              </div>

              <Link
                href="/checkout"
                className="flex min-h-13 w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Continuar con la compra
              </Link>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex gap-3">
                  <svg
                    className="mt-0.5 shrink-0"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7h12v10H3V7Zm12 3h3l3 3v4h-6v-7Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>

                  <div>
                    <p className="text-sm font-medium text-neutral-950">
                      Retiro en tienda
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      La compra se preparará para retiro una vez confirmado el pago.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
                El stock y los precios serán validados nuevamente antes de confirmar la orden.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
