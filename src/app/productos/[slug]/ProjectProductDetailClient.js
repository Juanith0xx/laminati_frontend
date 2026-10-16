"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getImageUrl(image) {
  return (
    image?.detail_url ||
    image?.card_url ||
    image?.thumbnail_url ||
    image?.image_url ||
    null
  );
}

function getProductCode(product) {
  if (product?.internal_code) {
    return String(
      product.internal_code
    ).trim();
  }

  const sku =
    String(
      product?.sku || ""
    ).trim();

  const numeric =
    sku.match(/\d+/)?.[0];

  return numeric || sku;
}

function formatThickness(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return String(value || "");
  }

  return Number.isInteger(number)
    ? String(number)
    : String(number)
        .replace(
          /0+$/,
          ""
        )
        .replace(
          /\.$/,
          ""
        );
}

export default function ProjectProductDetailClient({
  product,
}) {
  const images =
    useMemo(
      () =>
        normalizeArray(
          product?.images
        ),
      [product?.images]
    );

  const formats =
    useMemo(
      () =>
        normalizeArray(
          product?.project_formats
        ),
      [product?.project_formats]
    );

  const finishes =
    useMemo(
      () =>
        normalizeArray(
          product?.project_finishes
        ),
      [product?.project_finishes]
    );

  const thicknesses =
    useMemo(
      () =>
        normalizeArray(
          product?.project_thicknesses
        ),
      [product?.project_thicknesses]
    );

  const documents =
    useMemo(
      () =>
        normalizeArray(
          product?.project_documents
        ),
      [product?.project_documents]
    );

  const initialImage =
    images.find(
      (image) =>
        image?.is_primary
    ) ||
    images[0] ||
    null;

  const [
    selectedImageId,
    setSelectedImageId,
  ] =
    useState(
      initialImage?.id ||
        null
    );

  const selectedImage =
    images.find(
      (image) =>
        image.id ===
        selectedImageId
    ) ||
    initialImage;

  const mainImageUrl =
    getImageUrl(
      selectedImage
    ) ||
    product
      ?.primary_image
      ?.detail_url ||
    product
      ?.primary_image
      ?.card_url ||
    product
      ?.primary_image_url ||
    null;

  const technicalSheet =
    documents.find(
      (document) =>
        String(
          document
            ?.document_type ||
            ""
        )
          .toUpperCase() ===
        "TECHNICAL_SHEET"
    ) ||
    documents[0] ||
    null;

  const productCode =
    getProductCode(
      product
    );

  const collectionName =
    product?.collection ||
    product
      ?.project_family_name ||
    "Proyecto";

  const contactHref =
    `/contacto?tipo=proyecto&producto=${encodeURIComponent(
      product?.sku ||
        product?.slug ||
        ""
    )}`;

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1680px] px-5 pb-20 pt-8 sm:px-8 lg:px-10 lg:pb-28 lg:pt-10">

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

          {product?.category && (
            <>
              <span>/</span>
              <span>
                {product.category}
              </span>
            </>
          )}

          <span>/</span>

          <span className="text-neutral-600">
            {product?.name}
          </span>
        </nav>

        <div className="mt-7 grid gap-10 xl:grid-cols-[minmax(0,1.03fr)_minmax(480px,0.97fr)] xl:gap-14">

          <section className="min-w-0">

            <div className="relative aspect-[1.02/1] overflow-hidden rounded-[1.75rem] bg-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.07)]">

              {mainImageUrl ? (
                <img
                  src={
                    mainImageUrl
                  }
                  alt={
                    selectedImage
                      ?.alt_text ||
                    product
                      ?.primary_image_alt ||
                    product?.name ||
                    "Producto Laminati"
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <div>
                    <p className="text-sm font-semibold tracking-[0.2em] text-neutral-400">
                      LAMINATI
                    </p>

                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-300">
                      Imagen próximamente
                    </p>
                  </div>
                </div>
              )}

            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">

                {images
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (image) => {

                      const url =
                        getImageUrl(
                          image
                        );

                      if (!url) {
                        return null;
                      }

                      const active =
                        image.id ===
                        (
                          selectedImage
                            ?.id ||
                          initialImage
                            ?.id
                        );

                      return (
                        <button
                          key={
                            image.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedImageId(
                              image.id
                            )
                          }
                          className={`aspect-[1.45/1] overflow-hidden rounded-2xl border bg-neutral-100 transition ${
                            active
                              ? "border-emerald-700 ring-1 ring-emerald-700"
                              : "border-black/5 hover:border-neutral-300"
                          }`}
                        >
                          <img
                            src={
                              url
                            }
                            alt={
                              image
                                ?.alt_text ||
                              product
                                ?.name ||
                              "Producto"
                            }
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    }
                  )}

              </div>
            )}

          </section>

          <section className="min-w-0 xl:pt-1">

            <div className="mb-4">
              <p className="text-2xl font-semibold tracking-[-0.035em] text-emerald-800 sm:text-3xl">
                {product?.category ||
                  "HPL"}
              </p>

              {product?.project_family_name &&
                product?.project_family_name !==
                  product?.category && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    {product.project_family_name}
                  </p>
                )}
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-neutral-950 sm:text-5xl">
              {product?.name}
            </h1>

            <p className="mt-2 text-xl font-medium tracking-[-0.025em] text-neutral-700 sm:text-2xl">
              {collectionName}
            </p>

            {productCode && (
              <p className="mt-2 text-sm text-neutral-400">
                Código{" "}
                <span className="font-medium text-neutral-600">
                  {productCode}
                </span>
                {product?.sku && (
                  <>
                    {" · "}
                    SKU{" "}
                    <span className="font-medium text-neutral-600">
                      {product.sku}
                    </span>
                  </>
                )}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">

              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
                A pedido
              </span>

              <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-700">
                Para proyectos
              </span>

            </div>

            {(product?.short_description ||
              product?.description) && (
              <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-[15px]">
                {product
                  ?.short_description ||
                  product
                    ?.description}
              </p>
            )}

            <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white">

              <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-neutral-950">
                  Especificaciones técnicas
                </h2>
              </div>

              <div className="divide-y divide-black/[0.06]">

                <SpecRow
                  label="Aplicación"
                  value={
                    product
                      ?.project_application ||
                    "Exterior"
                  }
                />

                <SpecRow
                  label="Núcleo"
                  value={
                    product
                      ?.project_default_core ||
                    "Brown"
                  }
                  swatch={
                    Boolean(
                      product
                        ?.project_default_core
                    )
                  }
                />

                <SpecTagsRow
                  label="Formatos disponibles"
                  items={formats.map(
                    (item) =>
                      item?.label
                  )}
                />

                <SpecTagsRow
                  label="Acabados disponibles"
                  items={finishes.map(
                    (item) =>
                      item?.name
                  )}
                />

                <SpecTagsRow
                  label="Espesores disponibles"
                  items={thicknesses.map(
                    (item) =>
                      `${formatThickness(
                        item
                          ?.thickness_mm
                      )} mm`
                  )}
                />

              </div>

            </div>

            <div className="mt-5 space-y-3">

              <Link
                href={
                  contactHref
                }
                className="
                  group
                  flex
                  min-h-16
                  w-full
                  items-center
                  justify-between
                  gap-4
                  rounded-[1.15rem]
                  bg-emerald-900
                  px-5
                  py-4
                  !text-white
                  shadow-[0_10px_28px_rgba(6,78,59,0.18)]
                  transition
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-emerald-800
                  hover:shadow-[0_14px_34px_rgba(6,78,59,0.24)]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-700
                  focus:ring-offset-2
                "
              >
                <span className="flex min-w-0 items-center gap-3">

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="h-5 w-5 stroke-current !text-white"
                    >
                      <path
                        d="M7 3.75h7.25L18 7.5v12.75H7z"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 3.75V8h4"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 12h5M10 15.5h5"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <span className="min-w-0 text-left">
                    <span className="block text-[15px] font-semibold leading-5 !text-white">
                      Solicitar cotización de proyecto
                    </span>

                    <span className="mt-0.5 block text-[11px] font-medium !text-white/70">
                      Cuéntanos tu proyecto y te ayudamos a especificarlo
                    </span>
                  </span>

                </span>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-4 w-4 stroke-current !text-white"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

              </Link>

              {technicalSheet
                ?.document_url && (
                <a
                  href={
                    technicalSheet
                      .document_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-13 min-h-13 w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  Descargar ficha técnica
                </a>
              )}

            </div>

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <p className="text-xs leading-5 text-emerald-900/80">
                Producto disponible solo a pedido. La configuración final de formato, espesor y acabado se define según los requerimientos del proyecto.
              </p>
            </div>

          </section>

        </div>

      </div>
    </main>
  );
}

function SpecRow({
  label,
  value,
  swatch = false,
}) {
  return (
    <div className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center sm:px-6">
      <p className="text-xs font-medium text-neutral-500">
        {label}
      </p>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-900">
          {value || "—"}
        </p>

        {swatch && (
          <span className="h-6 w-6 shrink-0 rounded-full border border-black/10 bg-[#7a5a39]" />
        )}
      </div>
    </div>
  );
}

function SpecTagsRow({
  label,
  items,
}) {
  const cleanItems =
    items.filter(Boolean);

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-start sm:px-6">
      <p className="text-xs font-medium text-neutral-500 sm:pt-1.5">
        {label}
      </p>

      {cleanItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {cleanItems.map(
            (
              item,
              index
            ) => (
              <span
                key={`${item}-${index}`}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                {item}
              </span>
            )
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">
          Por definir
        </p>
      )}
    </div>
  );
}
