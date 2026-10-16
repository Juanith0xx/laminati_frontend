import Link from "next/link";

import {
  getProducts,
} from "@/services/products.service";

function toNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
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

function formatPrice(
  value
) {
  const number =
    toNumber(value);

  if (
    number === null
  ) {
    return "";
  }

  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  ).format(number);
}

function getImageUrl(
  product
) {
  return (
    product
      ?.primary_image_url ||
    product
      ?.primary_image
      ?.card_url ||
    product
      ?.primary_image
      ?.detail_url ||
    null
  );
}

function getProductCode(
  product
) {
  return (
    product
      ?.internal_code ||
    product
      ?.sku ||
    ""
  );
}

function getDisplayedPrice(
  product
) {
  const basePrice =
    toNumber(
      product
        ?.base_price
    );

  const finalPrice =
    toNumber(
      product
        ?.final_price
    );

  if (
    finalPrice !== null &&
    basePrice !== null &&
    finalPrice > 0 &&
    finalPrice <
      basePrice
  ) {
    return {
      price:
        finalPrice,
      basePrice,
      hasDiscount:
        true,
    };
  }

  return {
    price:
      basePrice,
    basePrice,
    hasDiscount:
      false,
  };
}

function FeaturedCard({
  product,
}) {
  const imageUrl =
    getImageUrl(
      product
    );

  const pricing =
    getDisplayedPrice(
      product
    );

  return (
    <article className="group flex h-full flex-col">

      <Link
        href={`/productos/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-[#f3f2ee] shadow-[0_8px_24px_rgba(0,0,0,0.055)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_42px_rgba(0,0,0,0.09)]"
      >

        {imageUrl ? (
          <img
            src={
              imageUrl
            }
            alt={
              product
                ?.primary_image_alt ||
              product
                ?.name ||
              "Producto Laminati"
            }
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
              Laminati
            </span>
          </div>
        )}

        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm text-neutral-800 shadow-sm backdrop-blur transition group-hover:bg-black group-hover:!text-white">
          ↗
        </span>

      </Link>

      <div className="flex flex-1 flex-col pt-4">

        <div className="min-h-[1rem]">

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {product
              ?.collection ||
              product
                ?.category ||
              "Laminati"}
          </p>

        </div>

        <Link
          href={`/productos/${product.slug}`}
          className="mt-2 block"
        >
          <h3 className="min-h-[3rem] line-clamp-2 text-base font-semibold leading-6 tracking-[-0.02em] text-neutral-950 transition group-hover:text-neutral-600">
            {getProductCode(
              product
            ) && (
              <span>
                {getProductCode(
                  product
                )}{" "}
              </span>
            )}

            {product.name}
          </h3>
        </Link>

        <div className="mt-3 min-h-[3.25rem]">

          {pricing
            .hasDiscount && (
            <p className="text-xs text-neutral-400 line-through">
              {formatPrice(
                pricing
                  .basePrice
              )}
            </p>
          )}

          {pricing.price !==
            null && (
            <p className="mt-0.5 text-lg font-semibold tracking-[-0.025em] text-neutral-950">
              {formatPrice(
                pricing.price
              )}
            </p>
          )}

        </div>

        <Link
          href={`/productos/${product.slug}`}
          style={{
            color:
              "#ffffff",
          }}
          className="mt-auto inline-flex h-11 items-center justify-between rounded-full bg-neutral-950 px-4 text-xs font-semibold !text-white transition duration-300 hover:bg-neutral-800 hover:!text-white"
        >
          <span className="!text-white">
            Ver producto
          </span>

          <span className="!text-white">
            →
          </span>
        </Link>

      </div>

    </article>
  );
}

export default async function FeaturedProductsSection() {
  let products = [];

  try {
    /*
     * Dejamos 4 productos para mantener una composición
     * uniforme de cuatro columnas en escritorio.
     */
    const featuredResponse =
      await getProducts({
        featured: true,
        in_stock: true,
        limit: 4,
      });

    products =
      featuredResponse
        ?.products ||
      [];

    if (
      products.length ===
      0
    ) {
      const fallbackResponse =
        await getProducts({
          in_stock: true,
          limit: 4,
          sort: "newest",
        });

      products =
        fallbackResponse
          ?.products ||
        [];
    }
  } catch (error) {
    console.error(
      "Error cargando productos destacados:",
      error
    );
  }

  if (
    products.length ===
    0
  ) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28">

      <div className="site-container">

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between lg:mb-14">

          <div>

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-neutral-400">
              Selección Laminati
            </p>

            <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Productos destacados
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
              Una selección de superficies pensadas para proyectos que buscan materialidad, diseño y terminaciones cuidadas.
            </p>

          </div>

          <Link
            href="/productos"
            className="group flex w-fit items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-black"
          >
            Ver catálogo completo

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">

          {products.map(
            (
              product
            ) => (
              <FeaturedCard
                key={
                  product.id
                }
                product={
                  product
                }
              />
            )
          )}

        </div>

      </div>

    </section>
  );
}
