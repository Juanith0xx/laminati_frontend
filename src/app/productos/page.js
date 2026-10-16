import Link from "next/link";
import { getProducts } from "@/services/products.service";

function formatSlugLabel(value = "") {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildPaginationHref(
  params,
  page
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(
    params || {}
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (
        key === "page" ||
        key === "limit" ||
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      if (
        Array.isArray(
          value
        )
      ) {
        value.forEach(
          (item) => {
            if (
              item !==
                undefined &&
              item !==
                null &&
              item !==
                ""
            ) {
              searchParams.append(
                key,
                String(item)
              );
            }
          }
        );

        return;
      }

      searchParams.set(
        key,
        String(value)
      );
    }
  );

  searchParams.set(
    "page",
    String(page)
  );

  const query =
    searchParams.toString();

  return query
    ? `/productos?${query}`
    : "/productos";
}

function getPaginationItems(
  currentPage,
  totalPages
) {
  if (
    totalPages <= 7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index
      ) =>
        index + 1
    );
  }

  const items = [
    1,
  ];

  const start =
    Math.max(
      2,
      currentPage - 1
    );

  const end =
    Math.min(
      totalPages - 1,
      currentPage + 1
    );

  if (
    start > 2
  ) {
    items.push(
      "start-ellipsis"
    );
  }

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    items.push(
      page
    );
  }

  if (
    end <
    totalPages - 1
  ) {
    items.push(
      "end-ellipsis"
    );
  }

  items.push(
    totalPages
  );

  return items;
}

function getProductCode(product) {
  if (product?.internal_code) {
    return String(product.internal_code).trim();
  }

  const sku = String(product?.sku || "").trim();
  const numericCode = sku.match(/\d+/)?.[0];

  return numericCode || sku;
}

function normalizeActivePromotions(product) {
  let promotions = product?.active_promotions;

  if (typeof promotions === "string") {
    try {
      promotions = JSON.parse(promotions);
    } catch {
      promotions = [];
    }
  }

  if (!Array.isArray(promotions)) {
    return [];
  }

  return promotions
    .map((promotion) => {
      let tiers =
        promotion?.tiers ||
        promotion?.quantity_tiers ||
        [];

      if (typeof tiers === "string") {
        try {
          tiers = JSON.parse(tiers);
        } catch {
          tiers = [];
        }
      }

      const normalizedTiers = Array.isArray(tiers)
        ? tiers
            .map((tier) => ({
              id: tier?.id || null,
              min_quantity: Number(
                tier?.min_quantity
              ),
              unit_price: Number(
                tier?.unit_price
              ),
            }))
            .filter(
              (tier) =>
                Number.isFinite(
                  tier.min_quantity
                ) &&
                tier.min_quantity > 0 &&
                Number.isFinite(
                  tier.unit_price
                ) &&
                tier.unit_price >= 0
            )
            .sort(
              (left, right) =>
                left.min_quantity -
                right.min_quantity
            )
        : [];

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
        ...promotion,
        promotion_type: promotionType,
        promotional_price:
          Number.isFinite(promotionalPrice)
            ? promotionalPrice
            : null,
        tiers: normalizedTiers,
      };
    })
    .filter(
      (promotion) =>
        promotion.promotion_type ===
          "FIXED_PRICE" ||
        promotion.promotion_type ===
          "QUANTITY_TIER"
    );
}

function getProductOfferDisplay(product) {
  const promotions =
    normalizeActivePromotions(product);

  if (promotions.length === 0) {
    return {
      hasOffer: false,
      type: null,
      fixedPrice: null,
      quantityTier: null,
    };
  }

  const quantityPromotions =
    promotions.filter(
      (promotion) =>
        promotion.promotion_type ===
        "QUANTITY_TIER"
    );

  /*
   * Regla visual consistente con la ficha:
   * si existe al menos una promoción por cantidad,
   * ocultamos visualmente las promociones fijas.
   *
   * Para la tarjeta mostramos el primer umbral
   * alcanzable. Si varias promociones comparten
   * ese mismo mínimo, gana el menor precio.
   */
  if (quantityPromotions.length > 0) {
    const candidateTiers =
      quantityPromotions
        .flatMap((promotion) =>
          promotion.tiers.map((tier) => ({
            ...tier,
            promotion_id:
              promotion.id || null,
            promotion_name:
              promotion.name || null,
            starts_at:
              promotion.starts_at || null,
            ends_at:
              promotion.ends_at || null,
          }))
        )
        .sort((left, right) => {
          if (
            left.min_quantity !==
            right.min_quantity
          ) {
            return (
              left.min_quantity -
              right.min_quantity
            );
          }

          return (
            left.unit_price -
            right.unit_price
          );
        });

    return {
      hasOffer: true,
      type: "QUANTITY_TIER",
      fixedPrice: null,
      quantityTier:
        candidateTiers[0] || null,
    };
  }

  const fixedPrices = promotions
    .filter(
      (promotion) =>
        promotion.promotion_type ===
          "FIXED_PRICE" &&
        Number.isFinite(
          Number(
            promotion.promotional_price
          )
        )
    )
    .map((promotion) => ({
      ...promotion,
      promotional_price: Number(
        promotion.promotional_price
      ),
    }))
    .sort(
      (left, right) =>
        left.promotional_price -
        right.promotional_price
    );

  return {
    hasOffer:
      fixedPrices.length > 0,
    type:
      fixedPrices.length > 0
        ? "FIXED_PRICE"
        : null,
    fixedPrice:
      fixedPrices[0] || null,
    quantityTier: null,
  };
}

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
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

function formatOfferValidUntil(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const formatted =
    new Intl.DateTimeFormat(
      "es-CL",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);

  return formatted.replace(
    /\./g,
    ""
  );
}

function getCleanProductName(product) {
  const code = getProductCode(product);

  let name = String(product?.name || "")
    .split("|")[0]
    .trim();

  if (code) {
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    name = name
      .replace(new RegExp(`\\b${escapedCode}\\b`, "gi"), "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return name || product?.name || "Producto";
}


function ProductCatalogCard({
  product,
  projectFamilyLabel = "",
}) {

              const code = getProductCode(product);
              const productName = getCleanProductName(product);

              const isProjectOnly =
                product?.commercial_mode ===
                "PROJECT_ONLY";

              const offerDisplay =
                isProjectOnly
                  ? {
                      hasOffer: false,
                      type: null,
                      fixedPrice: null,
                      quantityTier: null,
                    }
                  : getProductOfferDisplay(
                      product
                    );

              const imageUrl =
                product?.primary_image?.card_url ||
                product?.primary_image_url ||
                null;

              const imageAlt =
                product?.primary_image?.alt_text ||
                product?.primary_image_alt ||
                product?.name ||
                "Producto Laminati";

              return (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug}`}
                  className="group block min-w-0"
                >
                  <div
                    className={`relative aspect-[2/3] overflow-hidden rounded-[1.5rem] bg-[#f3f2ee] shadow-[0_5px_14px_rgba(0,0,0,0.08)] transition-shadow duration-300 ${
                      isProjectOnly
                        ? "ring-1 ring-emerald-200 group-hover:ring-emerald-300"
                        : offerDisplay.hasOffer
                          ? "ring-1 ring-emerald-200 group-hover:ring-emerald-300"
                          : ""
                    }`}
                  >
                    {isProjectOnly && (
                      <span
                        className="
                          pointer-events-none
                          absolute
                          right-3
                          top-3
                          z-20
                          inline-flex
                          min-h-7
                          items-center
                          rounded-full
                          border
                          border-emerald-200
                          bg-emerald-50/95
                          px-3
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.08em]
                          text-emerald-700
                          shadow-[0_4px_14px_rgba(0,0,0,0.08)]
                          backdrop-blur-sm
                          sm:right-4
                          sm:top-4
                        "
                      >
                        A pedido
                      </span>
                    )}

                    {offerDisplay.hasOffer && (
                      <span
                        className="
                          pointer-events-none
                          absolute
                          right-3
                          top-3
                          z-20
                          inline-flex
                          min-h-7
                          items-center
                          rounded-full
                          border
                          border-emerald-200
                          bg-emerald-50/95
                          px-3
                          text-[10px]
                          font-semibold
                          tracking-[-0.01em]
                          text-emerald-700
                          shadow-[0_4px_14px_rgba(0,0,0,0.08)]
                          backdrop-blur-sm
                          sm:right-4
                          sm:top-4
                        "
                      >
                        En oferta
                      </span>
                    )}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={imageAlt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-5 text-center">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400">
                            LAMINATI
                          </p>

                          <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-neutral-300">
                            Imagen próximamente
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 ease-out group-hover:bg-black/15 group-hover:opacity-100">
                      <span className="translate-y-3 rounded-full bg-white px-6 py-3 text-xs font-semibold tracking-[0.06em] text-neutral-950 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out group-hover:translate-y-0">
                        {isProjectOnly
                          ? "Ver proyecto"
                          : "Ver Stock"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-sm leading-5 text-neutral-800 sm:text-[15px]">
                    {code && (
                      <span className="font-semibold text-neutral-950">
                        {code}{" "}
                      </span>
                    )}

                    <span>{productName}</span>
                  </p>

                  {isProjectOnly && (
                    <div className="mt-1.5">
                      <p className="text-xs font-semibold text-emerald-700 sm:text-[13px]">
                        A pedido · Para proyectos
                      </p>

                      {(projectFamilyLabel ||
                        product?.project_family_name ||
                        product?.collection) && (
                        <p className="mt-0.5 text-[10px] text-neutral-400 sm:text-[11px]">
                          {projectFamilyLabel ||
                            product?.project_family_name ||
                            product?.collection}
                        </p>
                      )}
                    </div>
                  )}

                  {offerDisplay.type ===
                    "FIXED_PRICE" &&
                    offerDisplay.fixedPrice && (
                      <div className="mt-1.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(
                              product?.base_price
                            )}
                          </span>

                          <span className="text-sm font-semibold text-emerald-700">
                            {formatPrice(
                              offerDisplay
                                .fixedPrice
                                .promotional_price
                            )}
                          </span>
                        </div>

                        {formatOfferValidUntil(
                          offerDisplay
                            .fixedPrice
                            .ends_at
                        ) && (
                          <p className="mt-0.5 text-[10px] font-medium text-neutral-400 sm:text-[11px]">
                            Válido hasta{" "}
                            {formatOfferValidUntil(
                              offerDisplay
                                .fixedPrice
                                .ends_at
                            )}
                          </p>
                        )}
                      </div>
                    )}

                  {offerDisplay.type ===
                    "QUANTITY_TIER" &&
                    offerDisplay.quantityTier && (
                      <div className="mt-1.5">
                        <p className="text-xs font-medium leading-5 text-emerald-700 sm:text-[13px]">
                          Desde{" "}
                          {
                            offerDisplay
                              .quantityTier
                              .min_quantity
                          }{" "}
                          {Number(
                            offerDisplay
                              .quantityTier
                              .min_quantity
                          ) === 1
                            ? "lámina"
                            : "láminas"}
                          {" · "}
                          {formatPrice(
                            offerDisplay
                              .quantityTier
                              .unit_price
                          )}{" "}
                          c/u
                        </p>

                        {formatOfferValidUntil(
                          offerDisplay
                            .quantityTier
                            .ends_at
                        ) && (
                          <p className="mt-0.5 text-[10px] font-medium text-neutral-400 sm:text-[11px]">
                            Válido hasta{" "}
                            {formatOfferValidUntil(
                              offerDisplay
                                .quantityTier
                                .ends_at
                            )}
                          </p>
                        )}
                      </div>
                    )}
                </Link>
              );
            
}

function normalizeProjectFamilyCode(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}

function getLabgradeGroups(
  products
) {
  const definitions = [
    {
      code: "LABGRADE",
      title:
        "Colección Labgrade",
      subtitle:
        "Superficies técnicas para laboratorios",
    },
    {
      code:
        "LABGRADE_PLUS",
      title:
        "Colección Labgrade Plus",
      subtitle:
        "Disponible solo en el formato 3660 × 1590 mm",
    },
  ];

  return definitions
    .map(
      (
        definition
      ) => ({
        ...definition,
        products:
          products.filter(
            (
              product
            ) =>
              normalizeProjectFamilyCode(
                product
                  ?.project_family_code
              ) ===
              definition.code
          ),
      })
    )
    .filter(
      (
        group
      ) =>
        group.products
          .length > 0
    );
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;

  const application =
    params?.application || "";

  const currentPage =
    Math.max(
      Number.parseInt(
        params?.page,
        10
      ) || 1,
      1
    );

  const query = {
    /*
     * En navegación HPL usamos:
     * ?category=hpl&brand=abet-laminati&application=meg
     *
     * El producto está guardado en la subcategoría MEG,
     * por lo que `application` prevalece como categoría
     * efectiva para la consulta pública.
     */
    category:
      application ||
      params?.category ||
      "",
    brand: params?.brand || "",
    collection: params?.collection || "",
    finish: params?.finish || "",
    search: params?.search || "",
    sort: params?.sort || "featured",
    page: currentPage,

    /*
     * 30 productos por página:
     * 6 columnas × 5 filas en escritorio 2xl.
     */
    limit: 30,
  };

  let products = [];
  let pagination = null;
  let errorMessage = "";

  try {
    const response = await getProducts(query);

    if (response?.success) {
      products = Array.isArray(response.products)
        ? response.products
        : [];

      pagination = response.pagination || null;
    } else {
      errorMessage =
        response?.message ||
        "No fue posible cargar los productos.";
    }
  } catch (error) {
    console.error("Error cargando catálogo:", error);

    errorMessage =
      "No fue posible cargar los productos.";
  }

  const firstProduct = products[0] || null;

  const collectionTitle =
    firstProduct?.collection ||
    (query.collection
      ? formatSlugLabel(query.collection)
      : "");

  const brandTitle =
    firstProduct?.brand ||
    (query.brand
      ? formatSlugLabel(query.brand)
      : "");

  const pageTitle = collectionTitle
    ? collectionTitle
    : brandTitle
      ? brandTitle
      : "Productos";

  const totalPages =
    Number(
      pagination
        ?.total_pages
    ) || 0;

  const activePage =
    Number(
      pagination
        ?.page
    ) ||
    currentPage;

  const totalProducts =
    Number(
      pagination
        ?.total
    ) || 0;

  const firstVisibleProduct =
    totalProducts > 0
      ? (
          activePage - 1
        ) *
          30 +
        1
      : 0;

  const lastVisibleProduct =
    totalProducts > 0
      ? Math.min(
          activePage *
            30,
          totalProducts
        )
      : 0;

  const paginationItems =
    getPaginationItems(
      activePage,
      totalPages
    );

  const isLabgradeCollection =
    products.some(
      (
        product
      ) =>
        [
          "LABGRADE",
          "LABGRADE_PLUS",
        ].includes(
          normalizeProjectFamilyCode(
            product
              ?.project_family_code
          )
        )
    ) &&
    (
      query.collection ===
        "cubiertas-de-laboratorio" ||
      firstProduct
        ?.collection_slug ===
        "cubiertas-de-laboratorio" ||
      collectionTitle ===
        "Cubiertas de Laboratorio"
    );

  const labgradeGroups =
    isLabgradeCollection
      ? getLabgradeGroups(
          products
        )
      : [];

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1900px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pb-28 lg:pt-14">
        <div className="mb-8 sm:mb-10">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <Link
              href="/"
              className="transition-colors hover:text-neutral-950"
            >
              Inicio
            </Link>

            <span>/</span>

            <Link
              href="/productos"
              className="transition-colors hover:text-neutral-950"
            >
              Productos
            </Link>

            {brandTitle && (
              <>
                <span>/</span>
                <span>{brandTitle}</span>
              </>
            )}

            {collectionTitle && (
              <>
                <span>/</span>
                <span>{collectionTitle}</span>
              </>
            )}
          </nav>

          {!isLabgradeCollection && (
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Colección
              </p>

              <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                {pageTitle}
              </h1>
            </div>

            {pagination?.total !== undefined && (
              <p className="text-sm text-neutral-400">
                {pagination.total}{" "}
                {pagination.total === 1
                  ? "producto"
                  : "productos"}
              </p>
            )}
          </div>
          )}

        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-5 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-neutral-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No hay productos disponibles en esta colección.
            </p>

            <p className="mt-2 text-xs leading-5 text-neutral-400">
              Los productos deben estar activos y publicados para aparecer
              en el catálogo público.
            </p>
          </div>
        ) : (
          <>
            {isLabgradeCollection ? (

              <div className="space-y-16 sm:space-y-20">

                {labgradeGroups.map(
                  (
                    group
                  ) => (

                    <section
                      key={
                        group.code
                      }
                    >

                      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">

                        <div>

                          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-neutral-950 sm:text-4xl">

                            {group.title}

                          </h2>

                          <p className="mt-2 text-sm italic text-neutral-500 sm:text-base">

                            {group.subtitle}

                          </p>

                        </div>

                        <p className="text-sm text-neutral-400">

                          {
                            group
                              .products
                              .length
                          }{" "}

                          {group
                            .products
                            .length === 1
                            ? "producto"
                            : "productos"}

                        </p>

                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">

                        {group.products.map(
                          (
                            product
                          ) => (

                            <ProductCatalogCard
                              key={
                                product.id
                              }
                              product={
                                product
                              }
                              projectFamilyLabel={
                                product
                                  ?.project_family_name ||
                                (
                                  group.code ===
                                  "LABGRADE_PLUS"
                                    ? "Labgrade Plus"
                                    : "Labgrade"
                                )
                              }
                            />

                          )
                        )}

                      </div>

                    </section>

                  )
                )}

              </div>

            ) : (

              <section className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">

                {products.map(
                  (
                    product
                  ) => (

                    <ProductCatalogCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                    />

                  )
                )}

              </section>

            )}

            {totalPages > 1 && (
              <div className="mt-14 flex flex-col items-center gap-4 sm:mt-16">

                <p className="text-xs font-medium text-neutral-500">
                  Mostrando{" "}
                  <span className="font-medium text-neutral-600">
                    {firstVisibleProduct}
                  </span>
                  {" – "}
                  <span className="font-medium text-neutral-600">
                    {lastVisibleProduct}
                  </span>
                  {" de "}
                  <span className="font-medium text-neutral-600">
                    {totalProducts}
                  </span>
                  {" productos"}
                </p>

                <nav
                  aria-label="Paginación del catálogo"
                  className="flex flex-wrap items-center justify-center gap-2"
                >

                  {pagination
                    ?.has_previous_page ? (

                    <Link
                      href={buildPaginationHref(
                        params,
                        activePage - 1
                      )}
                      className="
                        inline-flex
                        h-10
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-neutral-300
                        bg-white
                        px-4
                        text-xs
                        font-semibold
                        text-neutral-700
                        transition
                        hover:border-emerald-300
                        hover:bg-emerald-50
                        hover:text-emerald-800
                      "
                    >
                      ← Anterior
                    </Link>

                  ) : (

                    <span
                      aria-disabled="true"
                      className="
                        inline-flex
                        h-10
                        cursor-not-allowed
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-neutral-200
                        bg-neutral-100
                        px-4
                        text-xs
                        font-semibold
                        text-neutral-400
                      "
                    >
                      ← Anterior
                    </span>

                  )}

                  {paginationItems.map(
                    (
                      item
                    ) => {

                      if (
                        typeof item !==
                        "number"
                      ) {
                        return (
                          <span
                            key={item}
                            className="flex h-10 min-w-8 items-center justify-center px-1 text-sm font-medium text-neutral-400"
                          >
                            …
                          </span>
                        );
                      }

                      const isActive =
                        item ===
                        activePage;

                      return (
                        <Link
                          key={item}
                          href={buildPaginationHref(
                            params,
                            item
                          )}
                          aria-current={
                            isActive
                              ? "page"
                              : undefined
                          }
                          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${
                            isActive
                              ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                              : "border-neutral-300 bg-white text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                          }`}
                        >
                          {item}
                        </Link>
                      );
                    }
                  )}

                  {pagination
                    ?.has_next_page ? (

                    <Link
                      href={buildPaginationHref(
                        params,
                        activePage + 1
                      )}
                      className="
                        inline-flex
                        h-10
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-neutral-300
                        bg-white
                        px-4
                        text-xs
                        font-semibold
                        text-neutral-700
                        transition
                        hover:border-emerald-300
                        hover:bg-emerald-50
                        hover:text-emerald-800
                      "
                    >
                      Siguiente →
                    </Link>

                  ) : (

                    <span
                      aria-disabled="true"
                      className="
                        inline-flex
                        h-10
                        cursor-not-allowed
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-neutral-200
                        bg-neutral-100
                        px-4
                        text-xs
                        font-semibold
                        text-neutral-400
                      "
                    >
                      Siguiente →
                    </span>

                  )}

                </nav>

                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                  Página {activePage} de {totalPages}
                </p>

              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
