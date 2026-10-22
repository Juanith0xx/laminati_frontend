"use client";

import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import {

  useRouter,

} from "next/navigation";

import {

  apiRequest,

} from "@/services/api";

import StockMovementModal from "@/components/admin/StockMovementModal";

/* =========================================
   ICONOS
========================================= */

function InventoryIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3.5 7.5 8.5-4.5 8.5 4.5-8.5 4.5-8.5-4.5Z" />
      <path d="M3.5 7.5v9L12 21l8.5-4.5v-9" />
      <path d="M12 12v9" />
      <path d="m7.7 5.3 8.6 4.5" />
    </svg>
  );
}


function EditIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function OfferIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.6 13.1 11 22l-9-9 9.6-9.6A2 2 0 0 1 13 2.8h5.2a3 3 0 0 1 3 3V11a2 2 0 0 1-.6 1.4Z" />
      <path d="M16.5 7.5h.01" />
    </svg>
  );
}


function TrashIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6 18 20H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function WarningIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.3 3.8 2.5 17.3A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.7L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/* =========================================
   HELPERS
========================================= */

function formatPrice(

  value

) {

  const number =

    Number(value);

  if (

    !Number.isFinite(

      number

    )

  ) {

    return "$0";

  }

  return new Intl.NumberFormat(

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

    number

  );

}

function getProductPromotionCount(
  product
) {
  const count =
    Number(
      product?.promotion_count
    );

  if (
    !Number.isFinite(
      count
    ) ||
    count <= 0
  ) {
    return 0;
  }

  return Math.trunc(
    count
  );
}

function cleanOptionalText(

  value

) {

  const text =

    String(

      value ??

      ""

    ).trim();

  return (

    text ||

    null

  );

}

function toOptionalNumber(

  value

) {

  if (

    value ===

      "" ||

    value ===

      null ||

    value ===

      undefined

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


const EMPTY_PROMOTION_FORM = {
  name: "",
  promotion_type: "FIXED_PRICE",
  promotional_price: "",
  tiers: [
    {
      min_quantity: "",
      unit_price: "",
    },
  ],
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function getPromotionTiers(
  promotion
) {
  let rawTiers =
    promotion?.tiers ??
    promotion?.quantity_tiers ??
    [];

  if (
    typeof rawTiers ===
    "string"
  ) {
    try {
      rawTiers =
        JSON.parse(
          rawTiers
        );
    } catch {
      rawTiers = [];
    }
  }

  if (
    !Array.isArray(
      rawTiers
    )
  ) {
    return [];
  }

  return rawTiers
    .map(
      (
        tier
      ) => ({
        min_quantity:
          tier?.min_quantity,
        unit_price:
          tier?.unit_price,
      })
    )
    .filter(
      (
        tier
      ) =>
        tier.min_quantity !==
          null &&
        tier.min_quantity !==
          undefined &&
        tier.unit_price !==
          null &&
        tier.unit_price !==
          undefined
    )
    .sort(
      (
        a,
        b
      ) =>
        Number(
          a.min_quantity
        ) -
        Number(
          b.min_quantity
        )
    );
}

function toDateTimeLocalValue(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    date.getTime() -
      offset
  )
    .toISOString()
    .slice(
      0,
      16
    );
}

function toIsoDateTimeOrNull(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function promotionToForm(
  promotion
) {
  const tiers =
    getPromotionTiers(
      promotion
    );

  const isQuantityTier =
    promotion?.promotion_type ===
      "QUANTITY_TIER" ||
    tiers.length > 0;

  return {
    name:
      valueToFormString(
        promotion?.name
      ),

    promotion_type:
      isQuantityTier
        ? "QUANTITY_TIER"
        : "FIXED_PRICE",

    promotional_price:
      valueToFormString(
        promotion?.promotional_price
      ),

    tiers:
      tiers.length > 0
        ? tiers.map(
            (
              tier
            ) => ({
              min_quantity:
                valueToFormString(
                  tier.min_quantity
                ),
              unit_price:
                valueToFormString(
                  tier.unit_price
                ),
            })
          )
        : [
            {
              min_quantity:
                "",
              unit_price:
                "",
            },
          ],

    starts_at:
      toDateTimeLocalValue(
        promotion?.starts_at
      ),

    ends_at:
      toDateTimeLocalValue(
        promotion?.ends_at
      ),

    is_active:
      Boolean(
        promotion?.is_active
      ),
  };
}

function getPromotionStatus(
  promotion
) {
  if (
    promotion?.is_current
  ) {
    return {
      label:
        "Vigente",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    !promotion?.is_active
  ) {
    return {
      label:
        "Desactivada",
      className:
        "border-neutral-200 bg-neutral-50 text-neutral-500",
    };
  }

  const now =
    Date.now();

  const startsAt =
    promotion?.starts_at
      ? new Date(
          promotion.starts_at
        ).getTime()
      : null;

  const endsAt =
    promotion?.ends_at
      ? new Date(
          promotion.ends_at
        ).getTime()
      : null;

  if (
    Number.isFinite(
      startsAt
    ) &&
    startsAt > now
  ) {
    return {
      label:
        "Programada",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (
    Number.isFinite(
      endsAt
    ) &&
    endsAt <= now
  ) {
    return {
      label:
        "Finalizada",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label:
      "Activa",
    className:
      "border-black/10 bg-black text-white",
  };
}

function formatPromotionDate(
  value
) {
  if (!value) {
    return "Sin límite";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(date);
}


const ACCEPTED_PRODUCT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const PRODUCT_IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";

function getProductImageUrl(
  image
) {
  return (
    image?.card_url ||
    image?.detail_url ||
    image?.thumbnail_url ||
    image?.image_url ||
    null
  );
}

function getProductImageType(
  fileName = ""
) {
  const normalized =
    String(fileName)
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  if (
    normalized.includes("sample") ||
    normalized.includes("muestra") ||
    normalized.includes("swatch")
  ) {
    return "sample";
  }

  if (
    normalized.includes("panel")
  ) {
    return "panel";
  }

  return "gallery";
}

function createPendingImage(
  file,
  isPrimary = false
) {
  return {
    id: [
      file.name,
      file.size,
      file.lastModified,
      Math.random()
        .toString(36)
        .slice(2),
    ].join("-"),
    file,
    previewUrl:
      URL.createObjectURL(
        file
      ),
    image_type:
      getProductImageType(
        file.name
      ),
    is_primary:
      isPrimary,
    status:
      "ready",
    error:
      "",
  };
}

const KARIKAL_FINISHES = [

  "Mate",

  "Brillante",

];

const ABET_LAMINATI_FINISHES = [

  "66",

  "Aquarama",

  "Bark",

  "Bigline",

  "Climb",

  "Climb 3",

  "Cross",

  "Dharma",

  "Geo",

  "Grainwood",

  "Grana 2",

  "Holz",

  "Longline",

  "Luc-2",

  "Lucida",

  "Magma",

  "Mandarin",

  "Microline",

  "Millerighe",

  "Millerighe 2",

  "Morbida",

  "Nutshell",

  "Ostuni",

  "Papier",

  "Pluriball",

  "Polaris",

  "Polaris Contemporary",

  "Root",

  "Satin",

  "Satinata",

  "Sei",

  "Sei Due",

  "Sei Tre",

  "Skin",

  "Soft",

  "Surfline",

  "Velwood",

  "Zodia",

  "Zodia 3",

];

const EMPTY_FORM = {

  sku:

    "",

  internal_code:

    "",

  relbase_product_id:

    "",

  name:

    "",

  category_id:

    "",

  brand_id:

    "",

  collection_id:

    "",

  short_description:

    "",

  description:

    "",

  base_price:

    "",

  italy_price_usd:

    "",

  tax_rate:

    "19",

  width_mm:

    "",

  height_mm:

    "",

  thickness_mm:

    "",

  weight_kg:

    "",

  color:

    "",

  finish:

    "",

  is_active:

    true,

  is_published:

    false,

  is_featured:

    false,

  allow_sale:

    true,

  sort_order:

    "0",

};


function valueToFormString(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  );
}

function productToForm(
  product
) {
  return {
    sku:
      valueToFormString(
        product?.sku
      ),

    internal_code:
      valueToFormString(
        product?.internal_code
      ),

    relbase_product_id:
      valueToFormString(
        product?.relbase_product_id
      ),

    name:
      valueToFormString(
        product?.name
      ),

    category_id:
      valueToFormString(
        product?.category_id
      ),

    brand_id:
      valueToFormString(
        product?.brand_id
      ),

    collection_id:
      valueToFormString(
        product?.collection_id
      ),

    short_description:
      valueToFormString(
        product?.short_description
      ),

    description:
      valueToFormString(
        product?.description
      ),

    base_price:
      valueToFormString(
        product?.base_price
      ),

    italy_price_usd:
      valueToFormString(
        product?.italy_price_usd
      ),

    tax_rate:
      valueToFormString(
        product?.tax_rate ??
          19
      ),

    width_mm:
      valueToFormString(
        product?.width_mm
      ),

    height_mm:
      valueToFormString(
        product?.height_mm
      ),

    thickness_mm:
      valueToFormString(
        product?.thickness_mm
      ),

    weight_kg:
      valueToFormString(
        product?.weight_kg
      ),

    color:
      valueToFormString(
        product?.color
      ),

    finish:
      valueToFormString(
        product?.finish
      ),

    is_active:
      Boolean(
        product?.is_active
      ),

    is_published:
      Boolean(
        product?.is_published
      ),

    is_featured:
      Boolean(
        product?.is_featured
      ),

    allow_sale:
      Boolean(
        product?.allow_sale
      ),

    sort_order:
      valueToFormString(
        product?.sort_order ??
          0
      ),
  };
}

/* =========================================
   UI ATOMS
========================================= */

function FieldLabel({

  children,

  required =

    false,

}) {

  return (

    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

      {children}

      {required && (

        <span className="ml-1 text-red-500">

          *

        </span>

      )}

    </span>

  );

}

function Input({

  value,

  onChange,

  placeholder,

  type =

    "text",

  min,

  step,

  disabled =

    false,

}) {

  return (

    <input

      type={type}

      value={value}

      onChange={onChange}

      placeholder={

        placeholder

      }

      min={min}

      step={step}

      disabled={

        disabled

      }

      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"

    />

  );

}

function Toggle({

  checked,

  onChange,

  label,

  description,

}) {

  return (

    <button

      type="button"

      onClick={() =>

        onChange(

          !checked

        )

      }

      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300"

    >

      <div>

        <p className="text-sm font-medium text-neutral-900">

          {label}

        </p>

        <p className="mt-1 text-xs leading-5 text-neutral-400">

          {

            description

          }

        </p>

      </div>

      <span

        className={`relative h-7 w-12 shrink-0 rounded-full transition ${

          checked

            ? "bg-black"

            : "bg-neutral-200"

        }`}

      >

        <span

          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${

            checked

              ? "left-6"

              : "left-1"

          }`}

        />

      </span>

    </button>

  );

}

/* =========================================
   PAGE
========================================= */

export default function AdminProductsPage() {

  const router =

    useRouter();

  const [

    authLoading,

    setAuthLoading,

  ] =

    useState(true);

  const [

    loading,

    setLoading,

  ] =

    useState(true);

  const [

    saving,

    setSaving,

  ] =

    useState(false);

  const [

    publishingProductId,

    setPublishingProductId,

  ] =

    useState(null);

  const [

    modalOpen,

    setModalOpen,

  ] =

    useState(false);

  const [

    products,

    setProducts,

  ] =

    useState([]);

  const [

    categories,

    setCategories,

  ] =

    useState([]);

  const [

    brands,

    setBrands,

  ] =

    useState([]);

  const [

    collections,

    setCollections,

  ] =

    useState([]);

  const [

    search,

    setSearch,

  ] =

    useState("");

  const [

    form,

    setForm,

  ] =

    useState(

      EMPTY_FORM

    );

  const [

    pageError,

    setPageError,

  ] =

    useState("");

  const [

    pageMessage,

    setPageMessage,

  ] =

    useState("");

  const [

    formError,

    setFormError,

  ] =

    useState("");

  const [stockProduct, setStockProduct] = useState(null);

  const [
    editingProduct,
    setEditingProduct,
  ] =
    useState(null);

  const [
    deleteProduct,
    setDeleteProduct,
  ] =
    useState(null);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    promotionProduct,
    setPromotionProduct,
  ] =
    useState(null);

  const [
    promotions,
    setPromotions,
  ] =
    useState([]);

  const [
    promotionsLoading,
    setPromotionsLoading,
  ] =
    useState(false);

  const [
    promotionForm,
    setPromotionForm,
  ] =
    useState(
      EMPTY_PROMOTION_FORM
    );

  const [
    editingPromotion,
    setEditingPromotion,
  ] =
    useState(null);

  const [
    promotionSaving,
    setPromotionSaving,
  ] =
    useState(false);

  const [
    promotionActionId,
    setPromotionActionId,
  ] =
    useState(null);

  const [
    promotionError,
    setPromotionError,
  ] =
    useState("");

  const [
    promotionMessage,
    setPromotionMessage,
  ] =
    useState("");

  const [
    promotionDeleteTarget,
    setPromotionDeleteTarget,
  ] =
    useState(null);

  const [
    deleteError,
    setDeleteError,
  ] =
    useState("");

  const imageInputRef =
    useRef(null);

  const imagePreviewUrlsRef =
    useRef(new Set());

  const [
    pendingImages,
    setPendingImages,
  ] =
    useState([]);

  const [
    savedImages,
    setSavedImages,
  ] =
    useState([]);

  const [
    imagesLoading,
    setImagesLoading,
  ] =
    useState(false);

  const [
    imageActionId,
    setImageActionId,
  ] =
    useState(null);

  const [
    imageManagerMessage,
    setImageManagerMessage,
  ] =
    useState("");

  const relbaseLookupSequenceRef =
    useRef(0);

  const [
    relbaseLookup,
    setRelbaseLookup,
  ] =
    useState({
      status:
        "idle",
      query:
        "",
      exactMatch:
        null,
      matches:
        [],
      stock:
        null,
      localProduct:
        null,
      warning:
        null,
      verified:
        false,
    });


  /* =========================================
     AUTH ADMIN
  ========================================= */

  useEffect(

    () => {

      let active =

        true;

      const validate =

        async () => {

          try {
            const response =

              await apiRequest(

                "/auth/me",

                {

                }

              );

            if (

              !response

                ?.success ||

              response

                ?.user

                ?.role !==

                "ADMIN"

            ) {

              throw new Error(

                "Acceso administrativo requerido"

              );

            }

          } catch (

            error

          ) {

            console.error(

              "Error validando ADMIN:",

              error

            );

            router.replace(

              "/login"

            );

          } finally {

            if (

              active

            ) {

              setAuthLoading(

                false

              );

            }

          }

        };

      validate();

      return () => {

        active =

          false;

      };

    },

    [

      router,

    ]

  );

  /* =========================================
     CARGAR CATÁLOGO
  ========================================= */

  const loadData =

    useCallback(

      async () => {

        if (

          authLoading

        ) {

          return;

        }
        try {

          setLoading(

            true

          );

          setPageError(

            ""

          );

          const [

            productResponse,

            categoryResponse,

            brandResponse,

            collectionResponse,

          ] =

            await Promise.all([

              apiRequest(

                "/admin/products",

                {

                }

              ),

              apiRequest(

                "/admin/categories",

                {

                }

              ),

              apiRequest(

                "/admin/brands",

                {

                }

              ),

              apiRequest(

                "/admin/collections",

                {

                }

              ),

            ]);

          setProducts(

            Array.isArray(

              productResponse

                ?.products

            )

              ? productResponse

                  .products

              : []

          );

          setCategories(

            Array.isArray(

              categoryResponse

                ?.categories

            )

              ? categoryResponse

                  .categories

              : []

          );

          setBrands(

            Array.isArray(

              brandResponse

                ?.brands

            )

              ? brandResponse

                  .brands

              : []

          );

          setCollections(

            Array.isArray(

              collectionResponse

                ?.collections

            )

              ? collectionResponse

                  .collections

              : []

          );

        } catch (

          error

        ) {

          console.error(

            "Error cargando productos:",

            error

          );

          if (

            error

              ?.status ===

              401 ||

            error

              ?.status ===

              403

          ) {

            router.replace(

              "/login"

            );

            return;

          }

          setPageError(

            error?.message ||

              "No fue posible cargar los productos."

          );

        } finally {

          setLoading(

            false

          );

        }

      },

      [

        authLoading,

        router,

      ]

    );

  useEffect(

    () => {

      loadData();

    },

    [

      loadData,

    ]

  );

  /* =========================================
     COLECCIONES SEGÚN MARCA
  ========================================= */

  const availableCollections =

    useMemo(

      () => {

        if (

          !form

            .brand_id

        ) {

          return collections;

        }

        return collections.filter(

          (

            collection

          ) =>

            !collection

              .brand_id ||

            String(

              collection

                .brand_id

            ) ===

              String(

                form

                  .brand_id

              )

        );

      },

      [

        collections,

        form.brand_id,

      ]

    );



  const selectedBrand =

    useMemo(

      () =>

        brands.find(

          (

            brand

          ) =>

            String(

              brand.id

            ) ===

            String(

              form

                .brand_id

            )

        ) ||

        null,

      [

        brands,

        form.brand_id,

      ]

    );

  const isAbetLaminati =

    String(

      selectedBrand

        ?.name ||

      ""

    )

      .trim()

      .toLowerCase() ===

    "abet laminati";



  const isKarikal =

    String(

      selectedBrand

        ?.name ||

      ""

    )

      .trim()

      .toLowerCase() ===

    "karikal";

  /* =========================================
     FILTRO PRODUCTOS
  ========================================= */

  const filteredProducts =

    useMemo(

      () => {

        const term =

          search

            .trim()

            .toLowerCase();

        if (!term) {

          return products;

        }

        return products.filter(

          (

            product

          ) =>

            [

              product

                .name,

              product

                .sku,

              product

                .internal_code,

              product

                .brand,

              product

                .collection,

              product

                .category,

            ]

              .filter(

                Boolean

              )

              .some(

                (

                  value

                ) =>

                  String(

                    value

                  )

                    .toLowerCase()

                    .includes(

                      term

                    )

              )

        );

      },

      [

        products,

        search,

      ]

    );

  /* =========================================
     FORM FIELD
  ========================================= */

  const setField =

    (

      key,

      value

    ) => {

      setForm(

        (

          current

        ) => ({

          ...current,

          [key]:

            value,

        })

      );

    };

  /* =========================================
     VALIDACIÓN RELBASE POR SKU
  ========================================= */

  const resetRelbaseLookup =
    (
      product = null
    ) => {
      relbaseLookupSequenceRef
        .current += 1;

      if (
        product
          ?.relbase_product_id
      ) {
        setRelbaseLookup({
          status:
            "found",
          query:
            String(
              product.sku ||
              ""
            ),
          exactMatch: {
            id:
              String(
                product
                  .relbase_product_id
              ),
            code:
              String(
                product.sku ||
                ""
              ),
            name:
              String(
                product.name ||
                ""
              ),
            source:
              "LAMINATIWORD",
          },
          matches:
            [],
          stock:
            null,
          localProduct:
            product,
          warning:
            null,
          verified:
            true,
        });

        return;
      }

      setRelbaseLookup({
        status:
          "idle",
        query:
          "",
        exactMatch:
          null,
        matches:
          [],
        stock:
          null,
        localProduct:
          null,
        warning:
          null,
        verified:
          false,
      });
    };

  useEffect(
    () => {
      if (
        !modalOpen ||
        editingProduct?.id
      ) {
        return undefined;
      }

      const query =
        String(
          form.sku ||
          ""
        ).trim();

      if (
        query.length < 2
      ) {
        setRelbaseLookup({
          status:
            "idle",
          query,
          exactMatch:
            null,
          matches:
            [],
          stock:
            null,
          localProduct:
            null,
          warning:
            null,
          verified:
            false,
        });

        setForm(
          (
            current
          ) =>
            current
              .relbase_product_id
              ? {
                  ...current,
                  relbase_product_id:
                    "",
                }
              : current
        );

        return undefined;
      }

      const requestSequence =
        relbaseLookupSequenceRef
          .current + 1;

      relbaseLookupSequenceRef
        .current =
        requestSequence;

      const timer =
        window.setTimeout(
          async () => {
            setRelbaseLookup(
              (
                current
              ) => ({
                ...current,
                status:
                  "loading",
                query,
                warning:
                  null,
              })
            );

            try {
              const response =
                await apiRequest(
                  `/admin/integrations/relbase/products/lookup?sku=${encodeURIComponent(
                    query
                  )}`,
                  {
                  }
                );

              if (
                relbaseLookupSequenceRef
                  .current !==
                requestSequence
              ) {
                return;
              }

              const exactMatch =
                response
                  ?.exact_match ||
                null;

              const matches =
                Array.isArray(
                  response?.matches
                )
                  ? response.matches
                  : [];

              const localProduct =
                response
                  ?.local_product ||
                null;

              setRelbaseLookup({
                status:
                  localProduct
                    ? "local-exists"
                    : exactMatch
                      ? "found"
                      : response
                          ?.verified_against_relbase
                        ? "not-found"
                        : "warning",
                query,
                exactMatch,
                matches,
                stock:
                  response?.stock ||
                  null,
                localProduct,
                warning:
                  response?.warning ||
                  null,
                verified:
                  Boolean(
                    response
                      ?.verified_against_relbase
                  ),
              });

              setForm(
                (
                  current
                ) => {
                  if (
                    String(
                      current
                        .sku ||
                        ""
                    )
                      .trim()
                      .toUpperCase() !==
                    query
                      .toUpperCase()
                  ) {
                    return current;
                  }

                  return {
                    ...current,
                    relbase_product_id:
                      exactMatch
                        ?.id
                        ? String(
                            exactMatch.id
                          )
                        : "",
                  };
                }
              );
            } catch (error) {
              if (
                relbaseLookupSequenceRef
                  .current !==
                requestSequence
              ) {
                return;
              }

              setRelbaseLookup({
                status:
                  "error",
                query,
                exactMatch:
                  null,
                matches:
                  [],
                stock:
                  null,
                localProduct:
                  null,
                warning: {
                  message:
                    error?.message ||
                    "No fue posible validar el SKU en Relbase.",
                },
                verified:
                  false,
              });

              setForm(
                (
                  current
                ) => ({
                  ...current,
                  relbase_product_id:
                    "",
                })
              );
            }
          },
          450
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      modalOpen,
      editingProduct?.id,
      form.sku,
      router,
    ]
  );

  const selectRelbaseProduct =
    (
      product
    ) => {
      const code =
        String(
          product?.code ||
          ""
        ).trim();

      if (!code) {
        return;
      }

      setForm(
        (
          current
        ) => ({
          ...current,
          sku:
            code,
          relbase_product_id:
            product?.id
              ? String(
                  product.id
                )
              : "",
          name:
            current
              .name
              .trim()
              ? current.name
              : String(
                  product?.name ||
                  ""
                ),
        })
      );

      setRelbaseLookup(
        (
          current
        ) => ({
          ...current,
          status:
            "loading",
          query:
            code,
          exactMatch:
            product,
          matches:
            [],
        })
      );
    };

  const getRelbaseStockLabel =
    () => {
      const warehouse =
        relbaseLookup
          .stock
          ?.warehouse;

      if (!warehouse) {
        return null;
      }

      const quantity =
        Number(
          warehouse.stock
        );

      const formatted =
        Number.isInteger(
          quantity
        )
          ? String(
              quantity
            )
          : quantity
              .toLocaleString(
                "es-CL",
                {
                  maximumFractionDigits:
                    3,
                }
              );

      return {
        quantity:
          formatted,
        warehouseName:
          warehouse
            .warehouse_name ||
          `Bodega ${warehouse.warehouse_id}`,
      };
    };

  /* =========================================
     IMÁGENES DEL PRODUCTO
  ========================================= */

  const clearPendingImages =
    () => {
      pendingImages.forEach(
        (entry) => {
          if (
            entry.previewUrl
          ) {
            URL.revokeObjectURL(
              entry.previewUrl
            );

            imagePreviewUrlsRef
              .current
              .delete(
                entry.previewUrl
              );
          }
        }
      );

      setPendingImages(
        []
      );
    };

  const resetImageManager =
    () => {
      clearPendingImages();

      setSavedImages(
        []
      );

      setImagesLoading(
        false
      );

      setImageActionId(
        null
      );

      setImageManagerMessage(
        ""
      );

      if (
        imageInputRef.current
      ) {
        imageInputRef.current.value =
          "";
      }
    };

  useEffect(
    () => {
      return () => {
        imagePreviewUrlsRef
          .current
          .forEach(
            (url) =>
              URL.revokeObjectURL(
                url
              )
          );

        imagePreviewUrlsRef
          .current
          .clear();
      };
    },
    []
  );

  const loadProductImages =
    async (
      productId
    ) => {
      if (!productId) {
        setSavedImages(
          []
        );

        return [];
      }
      try {
        setImagesLoading(
          true
        );

        setImageManagerMessage(
          ""
        );

        const response =
          await apiRequest(
            `/admin/products/${productId}/images`,
            {
            }
          );

        const images =
          Array.isArray(
            response?.images
          )
            ? response.images
            : [];

        setSavedImages(
          images
        );

        return images;
      } catch (error) {
        console.error(
          "Error cargando imágenes del producto:",
          error
        );

        if (
          error?.status === 401 ||
          error?.status === 403
        ) {
          router.replace(
            "/login"
          );

          return [];
        }

        setImageManagerMessage(
          error?.message ||
            "No fue posible cargar las imágenes del producto."
        );

        return [];
      } finally {
        setImagesLoading(
          false
        );
      }
    };

  const handleSelectProductImages =
    (
      event
    ) => {
      const files =
        Array.from(
          event.target.files ||
            []
        );

      if (
        files.length ===
        0
      ) {
        return;
      }

      const accepted =
        files.filter(
          (file) =>
            ACCEPTED_PRODUCT_IMAGE_TYPES.has(
              file.type
            )
        );

      if (
        accepted.length !==
        files.length
      ) {
        setImageManagerMessage(
          "Se omitieron archivos no compatibles. Usa JPG, PNG, WEBP o AVIF."
        );
      } else {
        setImageManagerMessage(
          ""
        );
      }

      if (
        accepted.length ===
        0
      ) {
        event.target.value =
          "";

        return;
      }

      setPendingImages(
        (
          current
        ) => {
          const hasPrimary =
            savedImages.some(
              (image) =>
                image.is_primary
            ) ||
            current.some(
              (image) =>
                image.is_primary
            );

          const next =
            accepted.map(
              (
                file,
                index
              ) => {
                const entry =
                  createPendingImage(
                    file,
                    !hasPrimary &&
                      index === 0
                  );

                imagePreviewUrlsRef
                  .current
                  .add(
                    entry.previewUrl
                  );

                return entry;
              }
            );

          return [
            ...current,
            ...next,
          ];
        }
      );

      event.target.value =
        "";
    };

  const removePendingImage =
    (
      imageId
    ) => {
      setPendingImages(
        (
          current
        ) => {
          const target =
            current.find(
              (entry) =>
                entry.id ===
                imageId
            );

          if (
            target?.previewUrl
          ) {
            URL.revokeObjectURL(
              target.previewUrl
            );

            imagePreviewUrlsRef
              .current
              .delete(
                target.previewUrl
              );
          }

          const next =
            current.filter(
              (entry) =>
                entry.id !==
                imageId
            );

          const hasSavedPrimary =
            savedImages.some(
              (image) =>
                image.is_primary
            );

          if (
            !hasSavedPrimary &&
            next.length > 0 &&
            !next.some(
              (entry) =>
                entry.is_primary
            )
          ) {
            next[0] = {
              ...next[0],
              is_primary:
                true,
            };
          }

          return next;
        }
      );
    };

  const setPendingPrimary =
    (
      imageId
    ) => {
      setPendingImages(
        (
          current
        ) =>
          current.map(
            (entry) => ({
              ...entry,
              is_primary:
                entry.id ===
                imageId,
            })
          )
      );
    };

  const uploadPendingImages =
    async ({
      productId,
    }) => {
      if (
        pendingImages.length ===
        0
      ) {
        return {
          success:
            true,
          failed:
            [],
        };
      }

      const failed =
        [];

      for (
        let index = 0;
        index <
        pendingImages.length;
        index += 1
      ) {
        const entry =
          pendingImages[index];

        setPendingImages(
          (
            current
          ) =>
            current.map(
              (item) =>
                item.id ===
                entry.id
                  ? {
                      ...item,
                      status:
                        "uploading",
                      error:
                        "",
                    }
                  : item
            )
        );

        try {
          const formData =
            new FormData();

          formData.append(
            "image",
            entry.file
          );

          formData.append(
            "image_type",
            entry.image_type ||
              "gallery"
          );

          formData.append(
            "alt_text",
            String(
              form.name ||
                form.sku ||
                "Producto Laminati"
            ).trim()
          );

          formData.append(
            "is_primary",
            entry.is_primary
              ? "true"
              : "false"
          );

          formData.append(
            "sort_order",
            String(index)
          );

          await apiRequest(
            `/admin/products/${productId}/images`,
            {
              method:
                "POST",
              body:
                formData,
            }
          );

          setPendingImages(
            (
              current
            ) =>
              current.map(
                (item) =>
                  item.id ===
                  entry.id
                    ? {
                        ...item,
                        status:
                          "success",
                        error:
                          "",
                      }
                    : item
              )
          );
        } catch (error) {
          console.error(
            `Error subiendo imagen ${entry.file.name}:`,
            error
          );

          const failedEntry = {
            ...entry,
            status:
              "error",
            error:
              error?.message ||
              "No fue posible subir la imagen.",
          };

          failed.push(
            failedEntry
          );

          setPendingImages(
            (
              current
            ) =>
              current.map(
                (item) =>
                  item.id ===
                  entry.id
                    ? failedEntry
                    : item
              )
          );
        }
      }

      return {
        success:
          failed.length ===
          0,
        failed,
      };
    };

  const handleSetSavedPrimary =
    async (
      image
    ) => {
      if (
        !editingProduct?.id ||
        !image?.id ||
        image.is_primary
      ) {
        return;
      }
      try {
        setImageActionId(
          image.id
        );

        setImageManagerMessage(
          ""
        );

        await apiRequest(
          `/admin/products/${editingProduct.id}/images/${image.id}`,
          {
            method:
              "PATCH",
            body: {
              is_primary:
                true,
            },
          }
        );

        await loadProductImages(
          editingProduct.id
        );

        await loadData();

        setImageManagerMessage(
          "Imagen principal actualizada."
        );
      } catch (error) {
        console.error(
          "Error actualizando imagen principal:",
          error
        );

        setImageManagerMessage(
          error?.message ||
            "No fue posible actualizar la imagen principal."
        );
      } finally {
        setImageActionId(
          null
        );
      }
    };

  const handleDeleteSavedImage =
    async (
      image
    ) => {
      if (
        !editingProduct?.id ||
        !image?.id
      ) {
        return;
      }
      try {
        setImageActionId(
          image.id
        );

        setImageManagerMessage(
          ""
        );

        await apiRequest(
          `/admin/products/${editingProduct.id}/images/${image.id}`,
          {
            method:
              "DELETE",
          }
        );

        await loadProductImages(
          editingProduct.id
        );

        await loadData();

        setImageManagerMessage(
          "Imagen eliminada correctamente."
        );
      } catch (error) {
        console.error(
          "Error eliminando imagen:",
          error
        );

        setImageManagerMessage(
          error?.message ||
            "No fue posible eliminar la imagen."
        );
      } finally {
        setImageActionId(
          null
        );
      }
    };

  /* =========================================
     PROMOCIONES / OFERTAS
  ========================================= */

  const loadPromotions =
    async (
      productId
    ) => {
      if (!productId) {
        setPromotions(
          []
        );

        return [];
      }
      try {
        setPromotionsLoading(
          true
        );

        setPromotionError(
          ""
        );

        const response =
          await apiRequest(
            `/admin/products/${productId}/promotions`,
            {
            }
          );

        const nextPromotions =
          Array.isArray(
            response?.promotions
          )
            ? response.promotions
            : [];

        setPromotions(
          nextPromotions
        );

        return nextPromotions;
      } catch (error) {
        console.error(
          "Error cargando promociones:",
          error
        );

        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );

          return [];
        }

        setPromotionError(
          error?.message ||
            "No fue posible cargar las promociones del producto."
        );

        return [];
      } finally {
        setPromotionsLoading(
          false
        );
      }
    };

  const resetPromotionForm =
    () => {
      setEditingPromotion(
        null
      );

      setPromotionForm(
        EMPTY_PROMOTION_FORM
      );

      setPromotionError(
        ""
      );

      setPromotionMessage(
        ""
      );
    };

  const openPromotionModal =
    async (
      product
    ) => {
      if (!product?.id) {
        return;
      }

      setPromotionProduct(
        product
      );

      resetPromotionForm();

      const loaded =
        await loadPromotions(
          product.id
        );

      const currentPromotion =
        loaded.find(
          (
            promotion
          ) =>
            promotion
              ?.is_current
        ) ||
        null;

      if (
        currentPromotion
      ) {
        setEditingPromotion(
          currentPromotion
        );

        setPromotionForm(
          promotionToForm(
            currentPromotion
          )
        );
      }
    };

  const closePromotionModal =
    () => {
      if (
        promotionSaving ||
        promotionActionId
      ) {
        return;
      }

      setPromotionProduct(
        null
      );

      setPromotions(
        []
      );

      resetPromotionForm();

      setPromotionDeleteTarget(
        null
      );
    };

  const setPromotionField =
    (
      key,
      value
    ) => {
      setPromotionForm(
        (
          current
        ) => ({
          ...current,
          [key]:
            value,
        })
      );
    };

  const setPromotionTierField =
    (
      index,
      key,
      value
    ) => {
      setPromotionForm(
        (
          current
        ) => ({
          ...current,
          tiers:
            current.tiers.map(
              (
                tier,
                tierIndex
              ) =>
                tierIndex ===
                index
                  ? {
                      ...tier,
                      [key]:
                        value,
                    }
                  : tier
            ),
        })
      );
    };

  const addPromotionTier =
    () => {
      setPromotionForm(
        (
          current
        ) => ({
          ...current,
          tiers: [
            ...current.tiers,
            {
              min_quantity:
                "",
              unit_price:
                "",
            },
          ],
        })
      );
    };

  const removePromotionTier =
    (
      index
    ) => {
      setPromotionForm(
        (
          current
        ) => ({
          ...current,
          tiers:
            current.tiers.length <=
            1
              ? current.tiers
              : current.tiers.filter(
                  (
                    _,
                    tierIndex
                  ) =>
                    tierIndex !==
                    index
                ),
        })
      );
    };

  const editPromotion =
    (
      promotion
    ) => {
      setEditingPromotion(
        promotion
      );

      setPromotionForm(
        promotionToForm(
          promotion
        )
      );

      setPromotionError(
        ""
      );

      setPromotionMessage(
        ""
      );
    };

  const promotionPreviewPrice =
    useMemo(
      () => {
        if (
          promotionForm
            .promotion_type ===
          "QUANTITY_TIER"
        ) {
          const prices =
            promotionForm.tiers
              .filter(
                (
                  tier
                ) =>
                  tier.unit_price !==
                    "" &&
                  tier.unit_price !==
                    null &&
                  tier.unit_price !==
                    undefined
              )
              .map(
                (
                  tier
                ) =>
                  Number(
                    tier.unit_price
                  )
              )
              .filter(
                (
                  price
                ) =>
                  Number.isFinite(
                    price
                  ) &&
                  price >= 0
              );

          if (
            prices.length ===
            0
          ) {
            return null;
          }

          return Math.min(
            ...prices
          );
        }

        if (
          promotionForm
            .promotional_price ===
            "" ||
          promotionForm
            .promotional_price ===
            null ||
          promotionForm
            .promotional_price ===
            undefined
        ) {
          return null;
        }

        const offerPrice =
          Number(
            promotionForm
              .promotional_price
          );

        return Number.isFinite(
          offerPrice
        ) &&
          offerPrice >= 0
          ? offerPrice
          : null;
      },
      [
        promotionForm
          .promotion_type,
        promotionForm
          .promotional_price,
        promotionForm.tiers,
      ]
    );

  const promotionDiscountPercent =
    useMemo(
      () => {
        const basePrice =
          Number(
            promotionProduct
              ?.base_price
          );

        const offerPrice =
          Number(
            promotionPreviewPrice
          );

        if (
          !Number.isFinite(
            basePrice
          ) ||
          basePrice <= 0 ||
          !Number.isFinite(
            offerPrice
          ) ||
          offerPrice < 0 ||
          offerPrice >=
            basePrice
        ) {
          return null;
        }

        return (
          (
            1 -
            offerPrice /
              basePrice
          ) *
          100
        );
      },
      [
        promotionPreviewPrice,
        promotionProduct,
      ]
    );

  const handleSavePromotion =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !promotionProduct
          ?.id ||
        promotionSaving
      ) {
        return;
      }
      const basePrice =
        Number(
          promotionProduct
            .base_price
        );

      const isQuantityTier =
        promotionForm
          .promotion_type ===
        "QUANTITY_TIER";

      let promotionalPrice =
        null;

      let tiers = [];

      if (
        isQuantityTier
      ) {
        if (
          !Array.isArray(
            promotionForm.tiers
          ) ||
          promotionForm.tiers.length ===
            0
        ) {
          setPromotionError(
            "Agrega al menos un tramo de precio por cantidad."
          );

          return;
        }

        const hasIncompleteTier =
          promotionForm.tiers.some(
            (
              tier
            ) =>
              tier.min_quantity ===
                "" ||
              tier.min_quantity ===
                null ||
              tier.min_quantity ===
                undefined ||
              tier.unit_price ===
                "" ||
              tier.unit_price ===
                null ||
              tier.unit_price ===
                undefined
          );

        if (
          hasIncompleteTier
        ) {
          setPromotionError(
            "Completa la cantidad mínima y el precio de todos los tramos."
          );

          return;
        }

        tiers =
          promotionForm.tiers.map(
            (
              tier
            ) => ({
              min_quantity:
                Number(
                  tier.min_quantity
                ),
              unit_price:
                Number(
                  tier.unit_price
                ),
            })
          );

        const invalidTier =
          tiers.find(
            (
              tier
            ) =>
              !Number.isInteger(
                tier.min_quantity
              ) ||
              tier.min_quantity <
                1 ||
              !Number.isFinite(
                tier.unit_price
              ) ||
              tier.unit_price <
                0
          );

        if (
          invalidTier
        ) {
          setPromotionError(
            "Cada tramo debe tener una cantidad mínima entera mayor o igual a 1 y un precio válido."
          );

          return;
        }

        const uniqueQuantities =
          new Set(
            tiers.map(
              (
                tier
              ) =>
                tier.min_quantity
            )
          );

        if (
          uniqueQuantities.size !==
          tiers.length
        ) {
          setPromotionError(
            "No puedes repetir la misma cantidad mínima en dos tramos."
          );

          return;
        }

        if (
          Number.isFinite(
            basePrice
          ) &&
          tiers.some(
            (
              tier
            ) =>
              tier.unit_price >=
              basePrice
          )
        ) {
          setPromotionError(
            "Cada precio por volumen debe ser menor al precio base."
          );

          return;
        }

        tiers.sort(
          (
            a,
            b
          ) =>
            a.min_quantity -
            b.min_quantity
        );
      } else {
        if (
          promotionForm
            .promotional_price ===
            "" ||
          promotionForm
            .promotional_price ===
            null ||
          promotionForm
            .promotional_price ===
            undefined
        ) {
          setPromotionError(
            "Ingresa un precio promocional válido."
          );

          return;
        }

        promotionalPrice =
          Number(
            promotionForm
              .promotional_price
          );

        if (
          !Number.isFinite(
            promotionalPrice
          ) ||
          promotionalPrice < 0
        ) {
          setPromotionError(
            "Ingresa un precio promocional válido."
          );

          return;
        }

        if (
          Number.isFinite(
            basePrice
          ) &&
          promotionalPrice >=
            basePrice
        ) {
          setPromotionError(
            "El precio de oferta debe ser menor al precio base."
          );

          return;
        }
      }

      if (
        promotionForm
          .starts_at &&
        promotionForm
          .ends_at &&
        new Date(
          promotionForm
            .ends_at
        ) <=
          new Date(
            promotionForm
              .starts_at
          )
      ) {
        setPromotionError(
          "La fecha de término debe ser posterior a la fecha de inicio."
        );

        return;
      }

      const payload = {
        name:
          cleanOptionalText(
            promotionForm
              .name
          ),

        promotion_type:
          isQuantityTier
            ? "QUANTITY_TIER"
            : "FIXED_PRICE",

        promotional_price:
          isQuantityTier
            ? null
            : promotionalPrice,

        ...(isQuantityTier
          ? {
              tiers,
            }
          : {}),

        starts_at:
          toIsoDateTimeOrNull(
            promotionForm
              .starts_at
          ),

        ends_at:
          toIsoDateTimeOrNull(
            promotionForm
              .ends_at
          ),

        is_active:
          Boolean(
            promotionForm
              .is_active
          ),
      };

      try {
        setPromotionSaving(
          true
        );

        setPromotionError(
          ""
        );

        setPromotionMessage(
          ""
        );

        const isEditing =
          Boolean(
            editingPromotion
              ?.id
          );

        const response =
          await apiRequest(
            isEditing
              ? `/admin/products/${promotionProduct.id}/promotions/${editingPromotion.id}`
              : `/admin/products/${promotionProduct.id}/promotions`,
            {
              method:
                isEditing
                  ? "PATCH"
                  : "POST",
              body:
                payload,
            }
          );

        setPromotionMessage(
          response?.message ||
            (
              isEditing
                ? "Oferta actualizada correctamente."
                : "Oferta creada correctamente."
            )
        );

        await Promise.all([
          loadPromotions(
            promotionProduct.id
          ),
          loadData(),
        ]);

        if (!isEditing) {
          setPromotionForm(
            EMPTY_PROMOTION_FORM
          );
        }
      } catch (error) {
        console.error(
          "Error guardando promoción:",
          error
        );

        setPromotionError(
          error?.message ||
            "No fue posible guardar la oferta."
        );
      } finally {
        setPromotionSaving(
          false
        );
      }
    };

  const togglePromotionActive =
    async (
      promotion
    ) => {
      if (
        !promotionProduct
          ?.id ||
        !promotion?.id ||
        promotionActionId
      ) {
        return;
      }
      try {
        setPromotionActionId(
          promotion.id
        );

        setPromotionError(
          ""
        );

        setPromotionMessage(
          ""
        );

        const response =
          await apiRequest(
            `/admin/products/${promotionProduct.id}/promotions/${promotion.id}`,
            {
              method:
                "PATCH",
              body: {
                is_active:
                  !Boolean(
                    promotion
                      .is_active
                  ),
              },
            }
          );

        setPromotionMessage(
          response?.message ||
            "Estado de la oferta actualizado."
        );

        await Promise.all([
          loadPromotions(
            promotionProduct.id
          ),
          loadData(),
        ]);
      } catch (error) {
        console.error(
          "Error actualizando estado de la promoción:",
          error
        );

        setPromotionError(
          error?.message ||
            "No fue posible actualizar la oferta."
        );
      } finally {
        setPromotionActionId(
          null
        );
      }
    };

  const handleDeletePromotion =
    async () => {
      if (
        !promotionProduct
          ?.id ||
        !promotionDeleteTarget
          ?.id ||
        promotionActionId
      ) {
        return;
      }
      try {
        setPromotionActionId(
          promotionDeleteTarget
            .id
        );

        setPromotionError(
          ""
        );

        setPromotionMessage(
          ""
        );

        const response =
          await apiRequest(
            `/admin/products/${promotionProduct.id}/promotions/${promotionDeleteTarget.id}`,
            {
              method:
                "DELETE",
            }
          );

        if (
          editingPromotion
            ?.id ===
          promotionDeleteTarget
            .id
        ) {
          resetPromotionForm();
        }

        setPromotionDeleteTarget(
          null
        );

        setPromotionMessage(
          response?.message ||
            "Oferta eliminada correctamente."
        );

        await Promise.all([
          loadPromotions(
            promotionProduct.id
          ),
          loadData(),
        ]);
      } catch (error) {
        console.error(
          "Error eliminando promoción:",
          error
        );

        setPromotionError(
          error?.message ||
            "No fue posible eliminar la oferta."
        );
      } finally {
        setPromotionActionId(
          null
        );
      }
    };

  /* =========================================
     ABRIR / CERRAR
  ========================================= */

  const openCreateModal =

    () => {

      resetImageManager();

      resetRelbaseLookup();

      setEditingProduct(

        null

      );

      setForm(

        EMPTY_FORM

      );

      setFormError(

        ""

      );

      setPageMessage(

        ""

      );

      setModalOpen(

        true

      );

    };

  const openEditModal =

    async (

      product

    ) => {

      if (

        !product?.id

      ) {

        return;

      }

      resetImageManager();

      resetRelbaseLookup(
        product
      );

      setEditingProduct(

        product

      );

      setForm(

        productToForm(

          product

        )

      );

      setFormError(

        ""

      );

      setPageMessage(

        ""

      );

      setModalOpen(

        true

      );

      await loadProductImages(

        product.id

      );

    };

  const closeProductModal =

    () => {

      if (

        saving

      ) {

        return;

      }

      setModalOpen(

        false

      );

      setEditingProduct(

        null

      );

      setForm(

        EMPTY_FORM

      );

      setFormError(

        ""

      );

      resetImageManager();

      resetRelbaseLookup();

    };

  const openDeleteModal =

    (

      product

    ) => {

      if (

        !product?.id

      ) {

        return;

      }

      setDeleteProduct(

        product

      );

      setDeleteError(

        ""

      );

      setPageError(

        ""

      );

      setPageMessage(

        ""

      );

    };

  const closeDeleteModal =

    () => {

      if (

        deleting

      ) {

        return;

      }

      setDeleteProduct(

        null

      );

      setDeleteError(

        ""

      );

    };

  /* =========================================
     CREAR PRODUCTO
  ========================================= */

  const handleSaveProduct =

    async (

      event

    ) => {

      event.preventDefault();
      const sku =

        form.sku

          .trim();

      const name =

        form.name

          .trim();

      if (!sku) {

        setFormError(

          "El SKU es obligatorio."

        );

        return;

      }

      if (!name) {

        setFormError(

          "El nombre del producto es obligatorio."

        );

        return;

      }

      if (

        !form

          .category_id

      ) {

        setFormError(

          "Debes seleccionar una categoría."

        );

        return;

      }

      const taxRate =

        Number(

          form.tax_rate

        );

      if (

        !Number.isFinite(

          taxRate

        ) ||

        taxRate <

          0

      ) {

        setFormError(

          "La tasa de IVA no es válida."

        );

        return;

      }

      const italyPriceUsd =

        toOptionalNumber(

          form

            .italy_price_usd

        );

      if (

        form

          .italy_price_usd !==

          "" &&

        (

          italyPriceUsd ===

            null ||

          italyPriceUsd <

            0

        )

      ) {

        setFormError(

          "El Precio Italia (USD) no es válido."

        );

        return;

      }

      const sortOrder =

        Number.parseInt(

          form

            .sort_order,

          10

        );

      const isEditing =

        Boolean(

          editingProduct

            ?.id

        );

      if (

        !isEditing &&

        relbaseLookup

          .localProduct

      ) {

        setFormError(

          `El SKU ${sku} ya existe en Laminatiword.`

        );

        return;

      }

      const payload = {

        category_id:

          form

            .category_id,

        brand_id:

          form

            .brand_id ||

          null,

        collection_id:

          form

            .collection_id ||

          null,

        sku,

        internal_code:

          cleanOptionalText(

            form

              .internal_code

          ),

        relbase_product_id:

          isEditing

            ? cleanOptionalText(

                form

                  .relbase_product_id

              )

            : null,

        name,

        short_description:

          cleanOptionalText(

            form

              .short_description

          ),

        description:

          cleanOptionalText(

            form

              .description

          ),

        base_price:

          toOptionalNumber(

            form

              .base_price

          ),

        italy_price_usd:

          italyPriceUsd,

        tax_rate:

          taxRate,

        width_mm:

          toOptionalNumber(

            form

              .width_mm

          ),

        height_mm:

          toOptionalNumber(

            form

              .height_mm

          ),

        thickness_mm:

          toOptionalNumber(

            form

              .thickness_mm

          ),

        weight_kg:

          toOptionalNumber(

            form

              .weight_kg

          ),

        color:

          cleanOptionalText(

            form

              .color

          ),

        finish:

          cleanOptionalText(

            form

              .finish

          ),

        is_active:

          Boolean(

            form

              .is_active

          ),

        is_published:

          Boolean(

            form

              .is_published

          ),

        is_featured:

          Boolean(

            form

              .is_featured

          ),

        allow_sale:

          Boolean(

            form

              .allow_sale

          ),

        sort_order:

          Number.isFinite(

            sortOrder

          )

            ? sortOrder

            : 0,

      };

      try {

        setSaving(

          true

        );

        setFormError(

          ""

        );

        setPageError(

          ""

        );

        const response =

          await apiRequest(

            isEditing

              ? `/admin/products/${editingProduct.id}`

              : "/admin/products",

            {

              method:

                isEditing

                  ? "PATCH"

                  : "POST",

              body:

                payload,

            }

          );

        const savedProductId =
          isEditing
            ? editingProduct.id
            : response
                ?.product
                ?.id;

        if (
          pendingImages.length >
            0 &&
          !savedProductId
        ) {
          throw new Error(
            "El producto se guardó, pero no fue posible identificarlo para subir sus imágenes."
          );
        }

        let imageUploadResult = {
          success:
            true,
          failed:
            [],
        };

        if (
          pendingImages.length >
            0
        ) {
          imageUploadResult =
            await uploadPendingImages({
              productId:
                savedProductId,
            });
        }

        await loadData();

        if (
          !imageUploadResult.success
        ) {
          if (
            !isEditing &&
            response?.product?.id
          ) {
            setEditingProduct(
              response.product
            );

            await loadProductImages(
              response.product.id
            );
          } else if (
            isEditing
          ) {
            await loadProductImages(
              editingProduct.id
            );
          }

          setPendingImages(
            imageUploadResult.failed
          );

          const failedCount =
            imageUploadResult
              .failed
              .length;

          setFormError(
            `El producto se guardó correctamente, pero ${failedCount} imagen${failedCount === 1 ? "" : "es"} no ${failedCount === 1 ? "pudo" : "pudieron"} subirse. Puedes reintentarlo sin volver a crear el producto.`
          );

          return;
        }

        setModalOpen(

          false

        );

        setEditingProduct(

          null

        );

        setPageMessage(

          pendingImages.length >
            0
            ? (
                isEditing
                  ? "Producto e imágenes actualizados correctamente."
                  : "Producto e imágenes creados correctamente."
              )
            : (
                response
                  ?.message ||
                (
                  isEditing
                    ? "Producto actualizado correctamente."
                    : "Producto creado correctamente."
                )
              )

        );

        setForm(

          EMPTY_FORM

        );

        resetImageManager();

      } catch (

        error

      ) {

        console.error(

          editingProduct?.id
            ? "Error actualizando producto:"
            : "Error creando producto:",

          error

        );

        if (

          error

            ?.status ===

            401 ||

          error

            ?.status ===

            403

        ) {

          router.replace(

            "/login"

          );

          return;

        }

        const issue =

          Array.isArray(

            error

              ?.data

              ?.errors

          )

            ? error

                .data

                .errors[0]

            : null;

        setFormError(

          issue

            ?.message ||

            error

              ?.message ||

            (

              editingProduct?.id

                ? "No fue posible actualizar el producto."

                : "No fue posible crear el producto."

            )

        );

      } finally {

        setSaving(

          false

        );

      }

    };

  /* =========================================
     ELIMINAR / ARCHIVAR PRODUCTO
  ========================================= */

  const handleDeleteProduct =

    async () => {

      if (

        !deleteProduct

          ?.id ||

        deleting

      ) {

        return;

      }
      try {

        setDeleting(

          true

        );

        setDeleteError(

          ""

        );

        setPageError(

          ""

        );

        const response =

          await apiRequest(

            `/admin/products/${deleteProduct.id}`,

            {

              method:

                "DELETE",

            }

          );

        setDeleteProduct(

          null

        );

        setPageMessage(

          response

            ?.message ||

            (

              response

                ?.action ===

                "ARCHIVED"

                ? "Producto archivado correctamente."

                : "Producto eliminado correctamente."

            )

        );

        await loadData();

      } catch (

        error

      ) {

        console.error(

          "Error eliminando producto:",

          error

        );

        if (

          error

              ?.status ===

              401 ||

          error

              ?.status ===

              403

        ) {

          router.replace(

            "/login"

          );

          return;

        }

        setDeleteError(

          error

            ?.message ||

            "No fue posible eliminar el producto."

        );

      } finally {

        setDeleting(

          false

        );

      }

    };

  /* =========================================
     PUBLICAR / DESPUBLICAR PRODUCTO
  ========================================= */

  const handleTogglePublished =

    async (

      product

    ) => {

      if (

        !product?.id ||

        publishingProductId !==

          null

      ) {

        return;

      }
      const previousPublished =

        Boolean(

          product.is_published

        );

      const nextPublished =

        !previousPublished;

      try {

        setPublishingProductId(

          product.id

        );

        setPageError(

          ""

        );

        setPageMessage(

          ""

        );

        /*
         * Actualización optimista:
         * el switch responde inmediatamente.
         */
        setProducts(

          (

            currentProducts

          ) =>

            currentProducts.map(

              (

                currentProduct

              ) =>

                currentProduct.id ===

                  product.id

                  ? {

                      ...currentProduct,

                      is_published:

                        nextPublished,

                    }

                  : currentProduct

            )

        );

        const response =

          await apiRequest(

            `/admin/products/${product.id}`,

            {

              method:

                "PATCH",

              body: {

                is_published:

                  nextPublished,

              },

            }

          );

        /*
         * Sincronizamos la fila con la
         * respuesta real del backend.
         */
        setProducts(

          (

            currentProducts

          ) =>

            currentProducts.map(

              (

                currentProduct

              ) => {

                if (

                  currentProduct.id !==

                    product.id

                ) {

                  return currentProduct;

                }

                const updatedProduct =

                  response?.product;

                return {

                  ...currentProduct,

                  ...(updatedProduct ||

                    {}),

                  is_published:

                    updatedProduct

                      ?.is_published ??

                    nextPublished,

                };

              }

            )

        );

        setPageMessage(

          nextPublished

            ? "Producto publicado correctamente en la web."

            : "Producto retirado de la publicación web correctamente."

        );

      } catch (

        error

      ) {

        console.error(

          "Error actualizando publicación del producto:",

          error

        );

        /*
         * Rollback visual si la petición falla.
         */
        setProducts(

          (

            currentProducts

          ) =>

            currentProducts.map(

              (

                currentProduct

              ) =>

                currentProduct.id ===

                  product.id

                  ? {

                      ...currentProduct,

                      is_published:

                        previousPublished,

                    }

                  : currentProduct

            )

        );

        if (

          error

              ?.status ===

              401 ||

          error

              ?.status ===

              403

        ) {

          router.replace(

            "/login"

          );

          return;

        }

        setPageError(

          error?.message ||

            "No fue posible actualizar la publicación del producto."

        );

      } finally {

        setPublishingProductId(

          null

        );

      }

    };

  if (

    authLoading

  ) {

    return (

      <main className="min-h-[calc(100vh-72px)] px-5 py-10">

        <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-20 text-center shadow-sm">

          <p className="text-sm text-neutral-500">

            Validando acceso administrativo...

          </p>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      <div className="mx-auto max-w-[1500px] space-y-6">

        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">

                Catálogo

              </p>

              <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">

                Productos

              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">

                Crea productos del catálogo y revisa su estado de publicación, precio y stock web.

              </p>

            </div>

            <button

              type="button"

              onClick={

                openCreateModal

              }

              className="h-12 rounded-full bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800"

            >

              Crear producto

            </button>

          </div>

        </section>

        {pageError && (

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

            {

              pageError

            }

          </div>

        )}

        {pageMessage && (

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">

            {

              pageMessage

            }

          </div>

        )}

        <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                Catálogo registrado

              </p>

              <p className="mt-1 text-sm text-neutral-500">

                <strong className="font-semibold text-neutral-950">

                  {

                    products.length

                  }

                </strong>{" "}

                productos

              </p>

            </div>

            <div className="flex w-full gap-2 md:w-auto">

              <input

                type="search"

                value={

                  search

                }

                onChange={(

                  event

                ) =>

                  setSearch(

                    event

                      .target

                      .value

                  )

                }

                placeholder="Buscar por SKU, nombre, marca..."

                className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-5 text-sm outline-none transition placeholder:text-neutral-300 focus:border-black md:w-[340px]"

              />

              <button

                type="button"

                onClick={

                  loadData

                }

                disabled={

                  loading

                }

                className="h-11 shrink-0 rounded-full border border-black/10 px-5 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-40"

              >

                {loading

                  ? "Actualizando..."

                  : "Actualizar"}

              </button>

            </div>

          </div>

        </section>

        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">

          {loading ? (

            <div className="px-6 py-20 text-center text-sm text-neutral-400">

              Cargando productos...

            </div>

          ) : filteredProducts.length ===

            0 ? (

            <div className="px-6 py-20 text-center">

              <p className="text-sm font-medium text-neutral-700">

                No hay productos para mostrar.

              </p>

              <p className="mt-2 text-xs text-neutral-400">

                Puedes crear el primer producto desde el botón superior.

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-[1180px] w-full">

                <thead>

                  <tr className="border-b border-neutral-100 text-left">

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Producto

                    </th>

                    <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Marca / Colección

                    </th>

                    <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Precio

                    </th>

                    <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Disponible web

                    </th>

                    <th className="px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Publicación

                    </th>

                    <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Estado

                    </th>


                    <th className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">

                      Acciones

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredProducts.map(

                    (

                      product

                    ) => (

                      <tr

                        key={

                          product.id

                        }

                        className="border-b border-neutral-100 last:border-b-0"

                      >

                        <td className="px-6 py-5">

                          <p className="font-medium text-neutral-950">

                            {

                              product.name

                            }

                          </p>

                          <p className="mt-1 text-xs text-neutral-400">

                            SKU{" "}

                            {

                              product.sku

                            }

                            {product.internal_code

                              ? ` · Código ${product.internal_code}`

                              : ""}

                          </p>

                        </td>

                        <td className="px-5 py-5">

                          <p className="text-sm font-medium text-neutral-800">

                            {

                              product.brand ||

                              "Sin marca"

                            }

                          </p>

                          <p className="mt-1 text-xs text-neutral-400">

                            {

                              product.collection ||

                              product.category ||

                              "Sin colección"

                            }

                          </p>

                        </td>

                        <td className="px-5 py-5">

                          {product.has_promotion ? (
                            <>
                              <p className="text-[11px] text-neutral-400 line-through">
                                {formatPrice(
                                  product.base_price
                                )}
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                                {formatPrice(
                                  product.final_price ??
                                    product.base_price
                                )}
                              </p>

                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                                Oferta activa
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-neutral-950">
                              {formatPrice(
                                product.base_price
                              )}
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            <p className="min-w-8 text-sm font-medium text-neutral-950">

                              {Number(

                                product.available_web ||

                                  0

                              ).toLocaleString(

                                "es-CL",

                                {

                                  maximumFractionDigits:

                                    3,

                                }

                              )}

                            </p>

                            <button
                              type="button"
                              onClick={() => setStockProduct(product)}
                              aria-label={`Gestionar stock de ${product.name}`}
                              title="Gestionar stock"
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-black hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black/15"
                            >
                              <InventoryIcon className="h-5 w-5" />
                            </button>

                          </div>

                        </td>

                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            <button

                              type="button"

                              role="switch"

                              aria-checked={

                                Boolean(

                                  product.is_published

                                )

                              }

                              aria-label={

                                product.is_published

                                  ? `Despublicar ${product.name}`

                                  : `Publicar ${product.name}`

                              }

                              onClick={() =>

                                handleTogglePublished(

                                  product

                                )

                              }

                              disabled={

                                publishingProductId !==

                                  null

                              }

                              className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-wait disabled:opacity-50 ${

                                product.is_published

                                  ? "bg-emerald-500"

                                  : "bg-neutral-200"

                              }`}

                            >

                              <span

                                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${

                                  product.is_published

                                    ? "left-6"

                                    : "left-1"

                                }`}

                              />

                            </button>

                            <span

                              className={`whitespace-nowrap text-xs font-medium ${

                                product.is_published

                                  ? "text-neutral-950"

                                  : "text-neutral-400"

                              }`}

                            >

                              {publishingProductId ===

                              product.id

                                ? "Guardando..."

                                : product.is_published

                                  ? "Publicado"

                                  : "No publicado"}

                            </span>

                          </div>

                        </td>

                        <td className="px-6 py-5">

                          <span

                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold ${

                              product.is_active

                                ? "border-black/10 bg-black text-white"

                                : "border-neutral-200 bg-neutral-50 text-neutral-500"

                            }`}

                          >

                            {product.is_active

                              ? "Activo"

                              : "Inactivo"}

                          </span>

                        </td>


                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openPromotionModal(
                                  product
                                )
                              }
                              aria-label={
                                getProductPromotionCount(
                                  product
                                ) > 0
                                  ? `Gestionar ofertas de ${product.name}. ${getProductPromotionCount(
                                      product
                                    )} ${
                                      getProductPromotionCount(
                                        product
                                      ) === 1
                                        ? "oferta"
                                        : "ofertas"
                                    }`
                                  : `Crear oferta para ${product.name}`
                              }
                              title={
                                getProductPromotionCount(
                                  product
                                ) > 0
                                  ? `Gestionar ofertas · ${getProductPromotionCount(
                                      product
                                    )} ${
                                      getProductPromotionCount(
                                        product
                                      ) === 1
                                        ? "oferta"
                                        : "ofertas"
                                    }`
                                  : "Crear oferta"
                              }
                              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus:outline-none focus:ring-2 ${
                                getProductPromotionCount(
                                  product
                                ) > 0
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white focus:ring-emerald-500/15"
                                  : "border-neutral-200 bg-white text-neutral-600 hover:border-black hover:bg-black hover:text-white focus:ring-black/15"
                              }`}
                            >
                              <OfferIcon className="h-[18px] w-[18px]" />

                              {getProductPromotionCount(
                                product
                              ) > 0 && (
                                <span
                                  className="
                                    absolute
                                    -right-2
                                    -top-2
                                    inline-flex
                                    h-5
                                    min-w-5
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-black
                                    px-1
                                    text-[10px]
                                    font-bold
                                    leading-none
                                    text-white
                                    shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                                    ring-2
                                    ring-white
                                  "
                                  aria-hidden="true"
                                >
                                  {getProductPromotionCount(
                                    product
                                  ) > 99
                                    ? "99+"
                                    : getProductPromotionCount(
                                        product
                                      )}
                                </span>
                              )}
                            </button>

                            <button

                              type="button"

                              onClick={() =>

                                openEditModal(

                                  product

                                )

                              }

                              aria-label={`Editar ${product.name}`}

                              title="Editar producto"

                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:border-black hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black/15"

                            >

                              <EditIcon className="h-[18px] w-[18px]" />

                            </button>

                            <button

                              type="button"

                              onClick={() =>

                                openDeleteModal(

                                  product

                                )

                              }

                              aria-label={`Eliminar ${product.name}`}

                              title="Eliminar producto"

                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:border-red-500 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/15"

                            >

                              <TrashIcon className="h-[18px] w-[18px]" />

                            </button>

                          </div>

                        </td>

                      </tr>

                    )

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {stockProduct && (
        <StockMovementModal
          key={stockProduct.id}
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSuccess={() => {
            setPageMessage("Movimiento confirmado en Relbase. Inventario sincronizado.");
            loadData();
          }}
        />
      )}

      {promotionProduct && (

        <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5">

          <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-[#f7f6f3] shadow-2xl">

            <div className="sticky top-0 z-20 flex items-start justify-between gap-5 border-b border-black/5 bg-white px-6 py-6 sm:px-8">

              <div className="min-w-0">

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Ofertas y promociones
                </p>

                <h2 className="mt-2 truncate text-2xl font-medium tracking-[-0.035em] text-neutral-950">
                  {promotionProduct.name}
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  SKU {promotionProduct.sku} · Precio base{" "}
                  <span className="font-semibold text-neutral-700">
                    {formatPrice(
                      promotionProduct.base_price
                    )}
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={closePromotionModal}
                disabled={
                  promotionSaving ||
                  Boolean(
                    promotionActionId
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-lg text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-40"
                aria-label="Cerrar promociones"
              >
                ×
              </button>

            </div>

            <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr]">

              <form
                onSubmit={
                  handleSavePromotion
                }
                className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6"
              >

                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      {editingPromotion
                        ? "Editar oferta"
                        : "Nueva oferta"}
                    </p>

                    <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                      {editingPromotion
                        ? "Actualizar promoción"
                        : "Crear promoción"}
                    </h3>

                  </div>

                  {editingPromotion ? (
                    <button
                      type="button"
                      onClick={
                        resetPromotionForm
                      }
                      className="h-9 rounded-full border border-black/10 px-4 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black"
                    >
                      Nueva oferta
                    </button>
                  ) : null}

                </div>

                <div className="mt-6 grid gap-4">

                  <label>

                    <FieldLabel>
                      Nombre de la oferta
                    </FieldLabel>

                    <Input
                      value={
                        promotionForm.name
                      }
                      onChange={(event) =>
                        setPromotionField(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Ej. Oferta octubre"
                    />

                  </label>

                  <div>

                    <FieldLabel required>
                      Tipo de oferta
                    </FieldLabel>

                    <div className="grid gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-1 sm:grid-cols-2">

                      <button
                        type="button"
                        onClick={() =>
                          setPromotionField(
                            "promotion_type",
                            "FIXED_PRICE"
                          )
                        }
                        className={`rounded-xl px-4 py-3 text-left text-sm transition ${
                          promotionForm.promotion_type ===
                          "FIXED_PRICE"
                            ? "bg-white font-medium text-neutral-950 shadow-sm"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        <span className="block">
                          Precio fijo
                        </span>
                        <span className="mt-1 block text-[11px] font-normal leading-4 text-neutral-400">
                          Se aplica sin mínimo de láminas.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPromotionField(
                            "promotion_type",
                            "QUANTITY_TIER"
                          )
                        }
                        className={`rounded-xl px-4 py-3 text-left text-sm transition ${
                          promotionForm.promotion_type ===
                          "QUANTITY_TIER"
                            ? "bg-white font-medium text-neutral-950 shadow-sm"
                            : "text-neutral-500 hover:text-neutral-800"
                        }`}
                      >
                        <span className="block">
                          Por cantidad
                        </span>
                        <span className="mt-1 block text-[11px] font-normal leading-4 text-neutral-400">
                          Define desde cuántas láminas aplica cada precio.
                        </span>
                      </button>

                    </div>

                  </div>

                  {promotionForm.promotion_type ===
                  "QUANTITY_TIER" ? (

                    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 sm:p-5">

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>

                          <p className="text-xs font-semibold text-neutral-800">
                            Precios por volumen
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-neutral-400">
                            El sistema aplicará automáticamente el tramo correspondiente según la cantidad de láminas.
                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={
                            addPromotionTier
                          }
                          className="h-9 rounded-full border border-black/10 bg-white px-4 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black"
                        >
                          + Agregar tramo
                        </button>

                      </div>

                      <div className="mt-4 space-y-3">

                        {promotionForm.tiers.map(
                          (
                            tier,
                            index
                          ) => (
                            <div
                              key={`promotion-tier-${index}`}
                              className="rounded-2xl border border-neutral-100 bg-white p-4"
                            >

                              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">

                                <label>

                                  <FieldLabel required>
                                    Mínimo de láminas
                                  </FieldLabel>

                                  <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                      tier.min_quantity
                                    }
                                    onChange={(event) =>
                                      setPromotionTierField(
                                        index,
                                        "min_quantity",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Ej. 5"
                                  />

                                </label>

                                <label>

                                  <FieldLabel required>
                                    Precio por lámina
                                  </FieldLabel>

                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      tier.unit_price
                                    }
                                    onChange={(event) =>
                                      setPromotionTierField(
                                        index,
                                        "unit_price",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Ej. 45000"
                                  />

                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removePromotionTier(
                                      index
                                    )
                                  }
                                  disabled={
                                    promotionForm.tiers.length <=
                                    1
                                  }
                                  className="h-11 rounded-full border border-red-100 px-4 text-xs font-medium text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  Eliminar
                                </button>

                              </div>

                              <p className="mt-3 text-[11px] text-neutral-400">
                                {tier.min_quantity &&
                                tier.unit_price !== ""
                                  ? `Desde ${tier.min_quantity} ${Number(tier.min_quantity) === 1 ? "lámina" : "láminas"}: ${formatPrice(tier.unit_price)} c/u`
                                  : "Completa la cantidad mínima y el precio de este tramo."}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                    </div>

                  ) : (

                    <label>

                      <FieldLabel required>
                        Precio oferta
                      </FieldLabel>

                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          promotionForm.promotional_price
                        }
                        onChange={(event) =>
                          setPromotionField(
                            "promotional_price",
                            event.target.value
                          )
                        }
                        placeholder="Ej. 49990"
                      />

                    </label>

                  )}

                  <div className="grid gap-3 sm:grid-cols-3">

                    <div className="rounded-2xl border border-neutral-100 bg-[#f7f6f3] p-4">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Precio normal
                      </p>

                      <p className="mt-2 text-lg font-semibold text-neutral-950">
                        {formatPrice(
                          promotionProduct.base_price
                        )}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                        {promotionForm.promotion_type ===
                        "QUANTITY_TIER"
                          ? "Mejor precio"
                          : "Precio oferta"}
                      </p>

                      <p className="mt-2 text-lg font-semibold text-emerald-700">
                        {promotionPreviewPrice !==
                        null
                          ? formatPrice(
                              promotionPreviewPrice
                            )
                          : "—"}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-neutral-100 bg-white p-4">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        {promotionForm.promotion_type ===
                        "QUANTITY_TIER"
                          ? "Descuento máx."
                          : "Descuento"}
                      </p>

                      <p className="mt-2 text-lg font-semibold text-neutral-950">
                        {promotionDiscountPercent !== null
                          ? `${promotionDiscountPercent.toLocaleString(
                              "es-CL",
                              {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              }
                            )}%`
                          : "—"}
                      </p>

                    </div>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <label>

                      <FieldLabel>
                        Inicio
                      </FieldLabel>

                      <Input
                        type="datetime-local"
                        value={
                          promotionForm.starts_at
                        }
                        onChange={(event) =>
                          setPromotionField(
                            "starts_at",
                            event.target.value
                          )
                        }
                      />

                    </label>

                    <label>

                      <FieldLabel>
                        Término
                      </FieldLabel>

                      <Input
                        type="datetime-local"
                        value={
                          promotionForm.ends_at
                        }
                        onChange={(event) =>
                          setPromotionField(
                            "ends_at",
                            event.target.value
                          )
                        }
                      />

                    </label>

                  </div>

                  <p className="-mt-1 text-[11px] leading-5 text-neutral-400">
                    Puedes dejar las fechas vacías para una oferta sin límite de inicio o término.
                  </p>

                  <Toggle
                    checked={
                      promotionForm.is_active
                    }
                    onChange={(value) =>
                      setPromotionField(
                        "is_active",
                        value
                      )
                    }
                    label="Oferta activa"
                    description="Al activarla, el catálogo utilizará automáticamente el precio promocional durante su vigencia."
                  />

                  {promotionError ? (

                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

                      <p className="text-sm leading-5 text-red-700">
                        {promotionError}
                      </p>

                    </div>

                  ) : null}

                  {promotionMessage ? (

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">

                      <p className="text-sm leading-5 text-emerald-700">
                        {promotionMessage}
                      </p>

                    </div>

                  ) : null}

                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      closePromotionModal
                    }
                    disabled={
                      promotionSaving
                    }
                    className="h-11 rounded-full border border-black/10 px-6 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      promotionSaving
                    }
                    className="h-11 rounded-full bg-black px-7 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {promotionSaving
                      ? "Guardando..."
                      : editingPromotion
                        ? "Guardar cambios"
                        : "Crear oferta"}
                  </button>

                </div>

              </form>

              <section className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Historial
                    </p>

                    <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                      Promociones del producto
                    </h3>

                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
                    {promotions.length}
                  </span>

                </div>

                {promotionsLoading ? (

                  <div className="py-16 text-center text-sm text-neutral-400">
                    Cargando promociones...
                  </div>

                ) : promotions.length === 0 ? (

                  <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-10 text-center">

                    <p className="text-sm font-medium text-neutral-700">
                      Este producto todavía no tiene ofertas.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-neutral-400">
                      Crea la primera promoción utilizando el formulario.
                    </p>

                  </div>

                ) : (

                  <div className="mt-5 space-y-3">

                    {promotions.map(
                      (
                        promotion
                      ) => {
                        const status =
                          getPromotionStatus(
                            promotion
                          );

                        const isBusy =
                          promotionActionId ===
                          promotion.id;

                        return (

                          <article
                            key={
                              promotion.id
                            }
                            className={`rounded-2xl border p-4 transition ${
                              editingPromotion?.id ===
                              promotion.id
                                ? "border-black bg-neutral-50"
                                : "border-neutral-100 bg-white"
                            }`}
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-neutral-950">
                                  {promotion.name ||
                                    "Oferta"}
                                </p>

                                {promotion.promotion_type ===
                                  "QUANTITY_TIER" ||
                                getPromotionTiers(
                                  promotion
                                ).length > 0 ? (

                                  <div className="mt-2 space-y-1.5">

                                    {getPromotionTiers(
                                      promotion
                                    ).map(
                                      (
                                        tier
                                      ) => (
                                        <div
                                          key={`${promotion.id}-${tier.min_quantity}`}
                                          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
                                        >
                                          <span className="font-medium text-neutral-600">
                                            Desde {tier.min_quantity} {Number(tier.min_quantity) === 1 ? "lámina" : "láminas"}
                                          </span>
                                          <span className="font-semibold text-emerald-700">
                                            {formatPrice(
                                              tier.unit_price
                                            )} c/u
                                          </span>
                                        </div>
                                      )
                                    )}

                                  </div>

                                ) : (

                                  <p className="mt-1 text-lg font-semibold text-emerald-700">
                                    {formatPrice(
                                      promotion.promotional_price
                                    )}
                                  </p>

                                )}

                              </div>

                              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${status.className}`}>
                                {status.label}
                              </span>

                            </div>

                            <div className="mt-3 grid gap-2 text-[11px] text-neutral-500 sm:grid-cols-2">

                              <p>
                                <span className="font-medium text-neutral-700">
                                  Inicio:
                                </span>{" "}
                                {formatPromotionDate(
                                  promotion.starts_at
                                )}
                              </p>

                              <p>
                                <span className="font-medium text-neutral-700">
                                  Término:
                                </span>{" "}
                                {formatPromotionDate(
                                  promotion.ends_at
                                )}
                              </p>

                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  editPromotion(
                                    promotion
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                                className="h-9 rounded-full border border-black/10 px-4 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-40"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  togglePromotionActive(
                                    promotion
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                                className="h-9 rounded-full border border-black/10 px-4 text-xs font-medium text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-40"
                              >
                                {isBusy
                                  ? "Guardando..."
                                  : promotion.is_active
                                    ? "Desactivar"
                                    : "Activar"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setPromotionDeleteTarget(
                                    promotion
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                                className="h-9 rounded-full border border-red-100 px-4 text-xs font-medium text-red-600 transition hover:border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40"
                              >
                                Eliminar
                              </button>

                            </div>

                          </article>

                        );
                      }
                    )}

                  </div>

                )}

              </section>

            </div>

          </div>

        </div>

      )}

      {promotionDeleteTarget && promotionProduct && (

        <div className="fixed inset-0 z-[155] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-7">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <WarningIcon className="h-6 w-6" />
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">
              Eliminar oferta
            </p>

            <h3 className="mt-2 text-xl font-medium tracking-[-0.03em] text-neutral-950">
              {promotionDeleteTarget.name ||
                "Oferta"}
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Se eliminará esta promoción del producto{" "}
              <span className="font-semibold text-neutral-900">
                {promotionProduct.name}
              </span>
              . Esta acción no modifica el precio base.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setPromotionDeleteTarget(
                    null
                  )
                }
                disabled={
                  Boolean(
                    promotionActionId
                  )
                }
                className="h-11 rounded-full border border-black/10 px-5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleDeletePromotion
                }
                disabled={
                  Boolean(
                    promotionActionId
                  )
                }
                className="h-11 rounded-full bg-red-600 px-6 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {promotionActionId ===
                promotionDeleteTarget.id
                  ? "Eliminando..."
                  : "Eliminar oferta"}
              </button>

            </div>

          </div>

        </div>

      )}

      {modalOpen && (

        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm sm:p-5">

          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#f7f6f3] shadow-2xl">

            <form

              onSubmit={

                handleSaveProduct

              }

            >

              <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-black/5 bg-white px-6 py-6 sm:px-8">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    {editingProduct

                      ? "Editar producto"

                      : "Nuevo producto"}

                  </p>

                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neutral-950">

                    {editingProduct

                      ? "Actualizar producto"

                      : "Crear producto"}

                  </h2>

                  <p className="mt-2 text-xs leading-6 text-neutral-400">

                    {editingProduct

                      ? "Modifica los datos comerciales y de publicación del producto."

                      : "El slug se generará automáticamente a partir del nombre."}

                  </p>

                </div>

                <button

                  type="button"

                  onClick={

                    closeProductModal

                  }

                  disabled={

                    saving

                  }

                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-lg text-neutral-500 transition hover:bg-neutral-50 disabled:opacity-40"

                  aria-label="Cerrar"

                >

                  ×

                </button>

              </div>

              <div className="space-y-6 p-5 sm:p-8">

                {formError && (

                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

                    {

                      formError

                    }

                  </div>

                )}

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    Identificación

                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    <label>

                      <FieldLabel

                        required

                      >

                        SKU

                      </FieldLabel>

                      <div className="relative">

                        <input

                          type="text"

                          value={

                            form.sku

                          }

                          onChange={(

                            event

                          ) => {

                            const value =

                              event

                                .target

                                .value

                                .toUpperCase();

                            setField(

                              "sku",

                              value

                            );

                            if (

                              !editingProduct

                                ?.id

                            ) {

                              setField(

                                "relbase_product_id",

                                ""

                              );

                            }

                          }}

                          placeholder="Ej. A5520M"

                          disabled={

                            saving

                          }

                          autoComplete="off"

                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"

                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">

                          {relbaseLookup.status ===
                          "loading" ? (

                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

                          ) : relbaseLookup.status ===
                              "found" ? (

                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                              ✓
                            </span>

                          ) : (

                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4 text-neutral-300"
                              aria-hidden="true"
                            >
                              <circle cx="11" cy="11" r="7" />
                              <path d="m20 20-3.5-3.5" />
                            </svg>

                          )}

                        </span>

                      </div>

                    </label>

                    <label>

                      <FieldLabel>

                        Código interno

                      </FieldLabel>

                      <Input

                        value={

                          form.internal_code

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "internal_code",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Código comercial"

                      />

                    </label>

                    <div>

                      <FieldLabel>

                        Relbase

                      </FieldLabel>

                      <div
                        className={`flex h-12 items-center gap-3 rounded-2xl border px-4 ${
                          form
                            .relbase_product_id
                            ? "border-emerald-200 bg-emerald-50"
                            : relbaseLookup.status ===
                                "not-found"
                              ? "border-amber-200 bg-amber-50"
                              : "border-neutral-200 bg-neutral-50"
                        }`}
                      >

                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            form
                              .relbase_product_id
                              ? "bg-emerald-500"
                              : relbaseLookup.status ===
                                  "loading"
                                ? "animate-pulse bg-neutral-400"
                                : relbaseLookup.status ===
                                    "not-found"
                                  ? "bg-amber-400"
                                  : "bg-neutral-300"
                          }`}
                        />

                        <div className="min-w-0">

                          <p className="truncate text-xs font-medium text-neutral-800">

                            {form
                              .relbase_product_id
                              ? "Producto encontrado"
                              : relbaseLookup.status ===
                                  "not-found"
                                ? "Producto nuevo"
                                : relbaseLookup.status ===
                                    "loading"
                                  ? "Validando SKU..."
                                  : "Pendiente de validar"}

                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-neutral-400">

                            {form
                              .relbase_product_id
                              ? `ID ${form.relbase_product_id}`
                              : relbaseLookup.status ===
                                  "not-found"
                                ? "Se creará en Relbase"
                                : "Automático"}

                          </p>

                        </div>

                      </div>

                    </div>

                    {!editingProduct?.id &&
                      form.sku
                        .trim()
                        .length >=
                        2 && (

                      <div className="sm:col-span-2 lg:col-span-3">

                        {relbaseLookup.status ===
                          "loading" && (

                          <div className="rounded-2xl border border-black/5 bg-neutral-50 px-5 py-4">

                            <div className="flex items-center gap-3">

                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

                              <div>

                                <p className="text-xs font-medium text-neutral-800">
                                  Validando producto en Relbase
                                </p>

                                <p className="mt-1 text-[11px] text-neutral-400">
                                  Buscando SKU {form.sku.trim()}...
                                </p>

                              </div>

                            </div>

                          </div>

                        )}

                        {relbaseLookup.status ===
                          "local-exists" && (

                          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

                            <p className="text-xs font-semibold text-red-700">
                              Este SKU ya existe en Laminatiword
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-red-600/80">
                              {relbaseLookup.localProduct?.name ||
                                form.sku} · No se puede crear un producto duplicado.
                            </p>

                          </div>

                        )}

                        {relbaseLookup.status ===
                          "found" &&
                          relbaseLookup
                            .exactMatch && (() => {

                          const stockLabel =
                            getRelbaseStockLabel();

                          return (

                            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">

                              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                <div className="min-w-0">

                                  <div className="flex items-center gap-2">

                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                                      ✓
                                    </span>

                                    <p className="text-xs font-semibold text-emerald-800">
                                      Encontrado en Relbase
                                    </p>

                                  </div>

                                  <p className="mt-2 truncate text-sm font-medium text-neutral-900">
                                    {relbaseLookup.exactMatch.name ||
                                      "Producto Relbase"}
                                  </p>

                                  <p className="mt-1 text-[11px] text-neutral-500">
                                    SKU {relbaseLookup.exactMatch.code} · ID {relbaseLookup.exactMatch.id}
                                  </p>

                                </div>

                                {stockLabel && (

                                  <div className="shrink-0 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-right">

                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                      Stock Relbase
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                                      {stockLabel.quantity}
                                    </p>

                                    <p className="mt-0.5 text-[9px] text-neutral-400">
                                      {stockLabel.warehouseName}
                                    </p>

                                  </div>

                                )}

                              </div>

                            </div>

                          );

                        })()}

                        {relbaseLookup.status ===
                          "not-found" && (

                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">

                            <div className="flex gap-3">

                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-white">
                                +
                              </span>

                              <div>

                                <p className="text-xs font-semibold text-amber-800">
                                  No existe un producto con este SKU en Relbase
                                </p>

                                <p className="mt-1 text-[11px] leading-5 text-amber-700/80">
                                  Al presionar Crear producto, Laminatiword lo creará automáticamente en Relbase y guardará su nuevo ID.
                                </p>

                              </div>

                            </div>

                          </div>

                        )}

                        {(relbaseLookup.status ===
                          "warning" ||
                          relbaseLookup.status ===
                            "error") && (

                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">

                            <p className="text-xs font-semibold text-amber-800">
                              No fue posible confirmar el SKU en Relbase
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-amber-700/80">
                              {relbaseLookup.warning?.message ||
                                "La validación se reintentará al crear el producto."}
                            </p>

                          </div>

                        )}

                        {!relbaseLookup
                          .exactMatch &&
                          relbaseLookup
                            .matches
                            .length >
                            0 &&
                          relbaseLookup.status !==
                            "local-exists" && (

                          <div className="mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">

                            <div className="border-b border-black/5 px-5 py-3">

                              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                                Coincidencias Relbase
                              </p>

                            </div>

                            {relbaseLookup.matches.map(
                              (
                                product
                              ) => (

                                <button
                                  key={
                                    `${product.id}-${product.code}`
                                  }
                                  type="button"
                                  onClick={() =>
                                    selectRelbaseProduct(
                                      product
                                    )
                                  }
                                  className="flex w-full items-center justify-between gap-4 border-b border-black/5 px-5 py-3.5 text-left transition last:border-b-0 hover:bg-neutral-50"
                                >

                                  <div className="min-w-0">

                                    <p className="truncate text-xs font-semibold text-neutral-900">
                                      {product.name ||
                                        "Producto Relbase"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-neutral-400">
                                      SKU {product.code || "—"} · ID {product.id || "—"}
                                    </p>

                                  </div>

                                  <span className="shrink-0 text-[10px] font-medium text-neutral-400">
                                    Seleccionar
                                  </span>

                                </button>

                              )
                            )}

                          </div>

                        )}

                      </div>

                    )}

                    <label className="sm:col-span-2 lg:col-span-3">

                      <FieldLabel

                        required

                      >

                        Nombre

                      </FieldLabel>

                      <Input

                        value={

                          form.name

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "name",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. Apple Tree 668 | acabado Root"

                      />

                    </label>

                  </div>

                </section>

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    Clasificación

                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">

                    <label>

                      <FieldLabel

                        required

                      >

                        Categoría

                      </FieldLabel>

                      <select

                        value={

                          form.category_id

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "category_id",

                            event

                              .target

                              .value

                          )

                        }

                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"

                      >

                        <option value="">

                          Seleccionar

                        </option>

                        {categories.map(

                          (

                            category

                          ) => (

                            <option

                              key={

                                category.id

                              }

                              value={

                                category.id

                              }

                            >

                              {

                                category.name

                              }

                            </option>

                          )

                        )}

                      </select>

                    </label>

                    <label>

                      <FieldLabel>

                        Marca

                      </FieldLabel>

                      <select

                        value={

                          form.brand_id

                        }

                        onChange={(

                          event

                        ) => {

                          setField(

                            "brand_id",

                            event

                              .target

                              .value

                          );

                          setField(

                            "collection_id",

                            ""

                          );

                          setField(

                            "finish",

                            ""

                          );

                        }}

                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"

                      >

                        <option value="">

                          Sin marca

                        </option>

                        {brands.map(

                          (

                            brand

                          ) => (

                            <option

                              key={

                                brand.id

                              }

                              value={

                                brand.id

                              }

                            >

                              {

                                brand.name

                              }

                            </option>

                          )

                        )}

                      </select>

                    </label>

                    <label>

                      <FieldLabel>

                        Colección

                      </FieldLabel>

                      <select

                        value={

                          form.collection_id

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "collection_id",

                            event

                              .target

                              .value

                          )

                        }

                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"

                      >

                        <option value="">

                          Sin colección

                        </option>

                        {availableCollections.map(

                          (

                            collection

                          ) => (

                            <option

                              key={

                                collection.id

                              }

                              value={

                                collection.id

                              }

                            >

                              {

                                collection.name

                              }

                            </option>

                          )

                        )}

                      </select>

                    </label>

                  </div>

                </section>

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    Información comercial

                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    <label>

                      <FieldLabel>

                        Precio base

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="1"

                        value={

                          form.base_price

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "base_price",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. 51500"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Precio Italia (USD)

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.01"

                        value={

                          form.italy_price_usd

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "italy_price_usd",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. 32.50"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        IVA %

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.01"

                        value={

                          form.tax_rate

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "tax_rate",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="19"

                      />

                    </label>

                    <label className="sm:col-span-2 lg:col-span-3">

                      <FieldLabel>

                        Descripción corta

                      </FieldLabel>

                      <textarea

                        value={

                          form.short_description

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "short_description",

                            event

                              .target

                              .value

                          )

                        }

                        rows={3}

                        placeholder="Resumen visible en el catálogo."

                        className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-300 focus:border-black"

                      />

                    </label>

                    <label className="sm:col-span-2 lg:col-span-3">

                      <FieldLabel>

                        Descripción completa

                      </FieldLabel>

                      <textarea

                        value={

                          form.description

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "description",

                            event

                              .target

                              .value

                          )

                        }

                        rows={5}

                        placeholder="Características, aplicaciones y detalles del producto."

                        className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-300 focus:border-black"

                      />

                    </label>

                  </div>

                </section>

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    Características

                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    <label>

                      <FieldLabel>

                        Ancho mm

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.01"

                        value={

                          form.width_mm

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "width_mm",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. 1300"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Alto mm

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.01"

                        value={

                          form.height_mm

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "height_mm",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. 3050"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Espesor mm

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.01"

                        value={

                          form.thickness_mm

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "thickness_mm",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. 0.8"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Peso kg

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="0.001"

                        value={

                          form.weight_kg

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "weight_kg",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Opcional"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Color

                      </FieldLabel>

                      <Input

                        value={

                          form.color

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "color",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="Ej. Verde"

                      />

                    </label>

                    <label>

                      <FieldLabel>

                        Acabado

                      </FieldLabel>

                      {isAbetLaminati ? (

                        <select

                          value={

                            form.finish

                          }

                          onChange={(

                            event

                          ) =>

                            setField(

                              "finish",

                              event

                                .target

                                .value

                            )

                          }

                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"

                        >

                          <option value="">

                            Seleccionar acabado

                          </option>

                          {ABET_LAMINATI_FINISHES.map(

                            (

                              finish

                            ) => (

                              <option

                                key={

                                  finish

                                }

                                value={

                                  finish

                                }

                              >

                                {

                                  finish

                                }

                              </option>

                            )

                          )}

                        </select>

                      ) : isKarikal ? (

                        <select

                          value={

                            form.finish

                          }

                          onChange={(

                            event

                          ) =>

                            setField(

                              "finish",

                              event

                                .target

                                .value

                            )

                          }

                          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"

                        >

                          <option value="">

                            Seleccionar acabado

                          </option>

                          {KARIKAL_FINISHES.map(

                            (

                              finish

                            ) => (

                              <option

                                key={

                                  finish

                                }

                                value={

                                  finish

                                }

                              >

                                {

                                  finish

                                }

                              </option>

                            )

                          )}

                        </select>

                      ) : (

                        <Input

                          value={

                            form.finish

                          }

                          onChange={(

                            event

                          ) =>

                            setField(

                              "finish",

                              event

                                .target

                                .value

                            )

                          }

                          placeholder="Ej. Mate, Brillante..."

                        />

                      )}

                      {isAbetLaminati && (

                        <p className="mt-2 text-[11px] leading-5 text-neutral-400">

                          Acabados oficiales de Abet Laminati.

                        </p>

                      )}

                      {isKarikal && (

                        <p className="mt-2 text-[11px] leading-5 text-neutral-400">

                          Acabados disponibles para Karikal.

                        </p>

                      )}

                    </label>

                    <label>

                      <FieldLabel>

                        Orden

                      </FieldLabel>

                      <Input

                        type="number"

                        min="0"

                        step="1"

                        value={

                          form.sort_order

                        }

                        onChange={(

                          event

                        ) =>

                          setField(

                            "sort_order",

                            event

                              .target

                              .value

                          )

                        }

                        placeholder="0"

                      />

                    </label>

                  </div>

                </section>

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                        Imágenes del producto

                      </p>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-400">

                        Agrega la imagen principal y las imágenes de galería directamente junto al producto. La primera imagen de un producto nuevo quedará como principal automáticamente.

                      </p>

                    </div>

                    <input
                      ref={
                        imageInputRef
                      }
                      type="file"
                      multiple
                      accept={
                        PRODUCT_IMAGE_ACCEPT
                      }
                      className="hidden"
                      onChange={
                        handleSelectProductImages
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        imageInputRef
                          .current
                          ?.click()
                      }
                      disabled={
                        saving
                      }
                      className="h-11 shrink-0 rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-40"
                    >
                      + Agregar imagen
                    </button>

                  </div>

                  {imageManagerMessage && (

                    <div className="mt-4 rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-600">

                      {
                        imageManagerMessage
                      }

                    </div>

                  )}

                  {editingProduct &&
                    imagesLoading && (

                    <div className="mt-5 rounded-2xl border border-dashed border-black/10 px-5 py-8 text-center text-xs text-neutral-400">

                      Cargando imágenes guardadas...

                    </div>

                  )}

                  {!imagesLoading &&
                    savedImages.length ===
                      0 &&
                    pendingImages.length ===
                      0 && (

                    <button
                      type="button"
                      onClick={() =>
                        imageInputRef
                          .current
                          ?.click()
                      }
                      className="mt-5 flex min-h-[170px] w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-black/15 bg-[#faf9f7] px-6 text-center transition hover:border-black/30 hover:bg-white"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-xl text-neutral-500 shadow-sm">
                        +
                      </span>

                      <span className="mt-4 text-sm font-medium text-neutral-800">
                        Agregar imágenes
                      </span>

                      <span className="mt-2 text-xs leading-5 text-neutral-400">
                        JPG, PNG, WEBP o AVIF
                      </span>
                    </button>

                  )}

                  {(savedImages.length >
                    0 ||
                    pendingImages.length >
                      0) && (

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                      {savedImages.map(
                        (
                          image
                        ) => {

                          const imageUrl =
                            getProductImageUrl(
                              image
                            );

                          return (

                            <article
                              key={
                                image.id
                              }
                              className={`overflow-hidden rounded-[1.35rem] border bg-white ${
                                image.is_primary
                                  ? "border-black"
                                  : "border-black/5"
                              }`}
                            >

                              <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f2ee]">

                                {imageUrl ? (

                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      image.alt_text ||
                                      form.name ||
                                      "Imagen del producto"
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                ) : (

                                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                    Imagen guardada
                                  </div>

                                )}

                                {image.is_primary && (

                                  <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                                    Principal
                                  </span>

                                )}

                              </div>

                              <div className="flex items-center gap-2 p-3">

                                {!image.is_primary ? (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSetSavedPrimary(
                                        image
                                      )
                                    }
                                    disabled={
                                      imageActionId ===
                                      image.id
                                    }
                                    className="min-h-9 flex-1 rounded-xl border border-black/10 px-3 text-[10px] font-medium text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-40"
                                  >
                                    Hacer principal
                                  </button>

                                ) : (

                                  <span className="flex min-h-9 flex-1 items-center px-2 text-[10px] font-medium text-neutral-400">
                                    Imagen principal
                                  </span>

                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSavedImage(
                                      image
                                    )
                                  }
                                  disabled={
                                    imageActionId ===
                                    image.id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                                  aria-label="Eliminar imagen"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>

                              </div>

                            </article>

                          );

                        }
                      )}

                      {pendingImages.map(
                        (
                          entry
                        ) => (

                          <article
                            key={
                              entry.id
                            }
                            className={`overflow-hidden rounded-[1.35rem] border bg-white ${
                              entry.is_primary
                                ? "border-black"
                                : "border-black/5"
                            }`}
                          >

                            <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f2ee]">

                              <img
                                src={
                                  entry.previewUrl
                                }
                                alt={
                                  entry.file.name
                                }
                                className="h-full w-full object-cover"
                              />

                              <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-600 shadow-sm">
                                Nueva
                              </span>

                              {entry.is_primary && (

                                <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                                  Principal
                                </span>

                              )}

                              {entry.status ===
                                "uploading" && (

                                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-medium text-white">
                                  Subiendo...
                                </div>

                              )}

                              {entry.status ===
                                "error" && (

                                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-red-600 px-3 py-2 text-[10px] text-white">
                                  {entry.error ||
                                    "Error al subir"}
                                </div>

                              )}

                            </div>

                            <div className="flex items-center gap-2 p-3">

                              {!entry.is_primary ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingPrimary(
                                      entry.id
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="min-h-9 flex-1 rounded-xl border border-black/10 px-3 text-[10px] font-medium text-neutral-600 transition hover:border-black hover:text-black disabled:opacity-40"
                                >
                                  Hacer principal
                                </button>

                              ) : (

                                <span className="flex min-h-9 flex-1 items-center px-2 text-[10px] font-medium text-neutral-400">
                                  Se guardará como principal
                                </span>

                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  removePendingImage(
                                    entry.id
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                                aria-label="Quitar imagen seleccionada"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>

                            </div>

                          </article>

                        )
                      )}

                    </div>

                  )}

                </section>

                <section className="rounded-[1.6rem] border border-black/5 bg-white p-5 sm:p-6">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">

                    Visibilidad

                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    <Toggle

                      checked={

                        form.is_active

                      }

                      onChange={(

                        value

                      ) =>

                        setField(

                          "is_active",

                          value

                        )

                      }

                      label="Producto activo"

                      description="Mantiene el producto habilitado administrativamente."

                    />

                    <Toggle

                      checked={

                        form.allow_sale

                      }

                      onChange={(

                        value

                      ) =>

                        setField(

                          "allow_sale",

                          value

                        )

                      }

                      label="Permitir venta"

                      description="Autoriza que el producto pueda venderse cuando tenga stock."

                    />

                    <Toggle

                      checked={

                        form.is_published

                      }

                      onChange={(

                        value

                      ) =>

                        setField(

                          "is_published",

                          value

                        )

                      }

                      label="Publicar inmediatamente"

                      description="Si está desactivado quedará como borrador."

                    />

                    <Toggle

                      checked={

                        form.is_featured

                      }

                      onChange={(

                        value

                      ) =>

                        setField(

                          "is_featured",

                          value

                        )

                      }

                      label="Producto destacado"

                      description="Permite priorizarlo en secciones destacadas del ecommerce."

                    />

                  </div>

                </section>

              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-black/5 bg-white px-6 py-5 sm:flex-row sm:justify-end sm:px-8">

                <button

                  type="button"

                  onClick={

                    closeProductModal

                  }

                  disabled={

                    saving

                  }

                  className="h-12 rounded-full border border-black/10 px-7 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  disabled={

                    saving

                  }

                  className="h-12 rounded-full bg-black px-8 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"

                >

                  {saving

                    ? (

                        editingProduct

                          ? "Guardando cambios..."

                          : "Creando producto..."

                      )

                    : (

                        editingProduct

                          ? "Guardar cambios"

                          : "Crear producto"

                      )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {deleteProduct && (

        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">

            <div className="p-6 sm:p-8">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">

                <WarningIcon className="h-6 w-6" />

              </div>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">

                Gestión de producto

              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-neutral-950">

                Eliminar producto

              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">

                ¿Deseas eliminar{" "}

                <span className="font-semibold text-neutral-900">

                  {deleteProduct.name}

                </span>

                ?

              </p>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">

                <p className="text-xs leading-5 text-amber-800">

                  Laminatiword protege la trazabilidad comercial: si el producto tiene historial de pedidos o está asociado a Relbase, será archivado en lugar de eliminarse físicamente.

                </p>

              </div>

              {deleteError && (

                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm leading-5 text-red-700">

                    {deleteError}

                  </p>

                </div>

              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={

                    closeDeleteModal

                  }

                  disabled={

                    deleting

                  }

                  className="h-11 rounded-full border border-black/10 px-6 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"

                >

                  Cancelar

                </button>

                <button

                  type="button"

                  onClick={

                    handleDeleteProduct

                  }

                  disabled={

                    deleting

                  }

                  className="h-11 rounded-full bg-red-600 px-6 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  {deleting

                    ? "Procesando..."

                    : "Eliminar producto"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}