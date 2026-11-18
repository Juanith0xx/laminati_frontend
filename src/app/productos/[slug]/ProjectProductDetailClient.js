"use client";

import {
  useEffect,
  useMemo,
  useRef,
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

function getImageType(image) {
  return String(
    image?.image_type || ""
  )
    .trim()
    .toLowerCase();
}

function getImagePriority(image) {
  const type =
    getImageType(image);

  if (type === "sample") {
    return 0;
  }

  if (type === "panel") {
    return 1;
  }

  return 2;
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
    useMemo(() => {
      const sourceImages =
        normalizeArray(
          product?.images
        )
          .filter(
            (image) =>
              Boolean(
                getImageUrl(
                  image
                )
              )
          );

      /*
       * Stratificato:
       * - sample primero
       * - panel segundo
       * - si todavía existe un gallery antiguo,
       *   no se muestra cuando ya existen imágenes oficiales.
       */
      const officialImages =
        sourceImages.filter(
          (image) => {
            const type =
              getImageType(
                image
              );

            return (
              type === "sample" ||
              type === "panel"
            );
          }
        );

      const visibleImages =
        officialImages.length > 0
          ? officialImages
          : sourceImages;

      return visibleImages
        .slice()
        .sort(
          (
            left,
            right
          ) => {
            const priorityDiff =
              getImagePriority(
                left
              ) -
              getImagePriority(
                right
              );

            if (
              priorityDiff !== 0
            ) {
              return priorityDiff;
            }

            return (
              Number(
                left?.sort_order ??
                  999
              ) -
              Number(
                right?.sort_order ??
                  999
              )
            );
          }
        );
    }, [
      product?.images,
    ]);

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
        getImageType(
          image
        ) === "sample"
    ) ||
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

  const mainImageAlt =
    selectedImage
      ?.alt_text ||
    product
      ?.primary_image_alt ||
    product?.name ||
    "Producto Laminati";

  const selectedImageType =
    getImageType(
      selectedImage
    );

  /*
   * Igual que el laminado normal:
   * el zoom se habilita para la imagen PANEL.
   */
  const canZoomSelectedImage =
    selectedImageType ===
    "panel";

  const [
    isZoomOpen,
    setIsZoomOpen,
  ] = useState(false);

  const [
    zoomScale,
    setZoomScale,
  ] = useState(1);

  const mainImageContainerRef =
    useRef(null);

  const mainImageRef =
    useRef(null);

  const [
    isMagnifierVisible,
    setIsMagnifierVisible,
  ] = useState(false);

  const [
    magnifierPosition,
    setMagnifierPosition,
  ] = useState({
    lensLeft: 0,
    lensTop: 0,
    lensSize: 150,
    originX: 50,
    originY: 50,
  });

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

  /* =========================================
     ZOOM / MAGNIFIER DEL PANEL
  ========================================= */

  const handleMagnifierMove = (
    event
  ) => {
    if (
      !canZoomSelectedImage
    ) {
      setIsMagnifierVisible(
        false
      );
      return;
    }

    const container =
      mainImageContainerRef
        .current;

    const image =
      mainImageRef.current;

    if (
      !container ||
      !image ||
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      setIsMagnifierVisible(
        false
      );
      return;
    }

    const rect =
      container
        .getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      setIsMagnifierVisible(
        false
      );
      return;
    }

    const imageRatio =
      image.naturalWidth /
      image.naturalHeight;

    const containerRatio =
      rect.width /
      rect.height;

    let renderedWidth;
    let renderedHeight;
    let offsetX = 0;
    let offsetY = 0;

    /*
     * La imagen principal usa object-contain,
     * por eso calculamos el área realmente renderizada.
     */
    if (
      imageRatio >
      containerRatio
    ) {
      renderedWidth =
        rect.width;

      renderedHeight =
        rect.width /
        imageRatio;

      offsetY =
        (
          rect.height -
          renderedHeight
        ) / 2;
    } else {
      renderedHeight =
        rect.height;

      renderedWidth =
        rect.height *
        imageRatio;

      offsetX =
        (
          rect.width -
          renderedWidth
        ) / 2;
    }

    const pointerX =
      event.clientX -
      rect.left;

    const pointerY =
      event.clientY -
      rect.top;

    const isInsideImage =
      pointerX >= offsetX &&
      pointerX <=
        offsetX +
          renderedWidth &&
      pointerY >= offsetY &&
      pointerY <=
        offsetY +
          renderedHeight;

    if (!isInsideImage) {
      setIsMagnifierVisible(
        false
      );
      return;
    }

    const requestedLensSize =
      150;

    const lensSize =
      Math.max(
        80,
        Math.min(
          requestedLensSize,
          renderedWidth,
          renderedHeight
        )
      );

    const minLeft =
      offsetX;

    const maxLeft =
      offsetX +
      renderedWidth -
      lensSize;

    const minTop =
      offsetY;

    const maxTop =
      offsetY +
      renderedHeight -
      lensSize;

    const lensLeft =
      Math.min(
        Math.max(
          pointerX -
            lensSize / 2,
          minLeft
        ),
        maxLeft
      );

    const lensTop =
      Math.min(
        Math.max(
          pointerY -
            lensSize / 2,
          minTop
        ),
        maxTop
      );

    const originX =
      (
        pointerX /
        rect.width
      ) * 100;

    const originY =
      (
        pointerY /
        rect.height
      ) * 100;

    setMagnifierPosition({
      lensLeft,
      lensTop,
      lensSize,
      originX,
      originY,
    });

    setIsMagnifierVisible(
      true
    );
  };

  const handleMagnifierLeave =
    () => {
      setIsMagnifierVisible(
        false
      );
    };

  const handleOpenZoom = () => {
    if (
      !mainImageUrl ||
      !canZoomSelectedImage
    ) {
      return;
    }

    setZoomScale(1);
    setIsZoomOpen(true);
  };

  const handleCloseZoom = () => {
    setIsZoomOpen(false);
    setZoomScale(1);
  };

  const handleZoomIn = () => {
    setZoomScale(
      (current) =>
        Math.min(
          current + 0.5,
          4
        )
    );
  };

  const handleZoomOut = () => {
    setZoomScale(
      (current) =>
        Math.max(
          current - 0.5,
          1
        )
    );
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  const handleDoubleClickZoom =
    () => {
      setZoomScale(
        (current) =>
          current > 1
            ? 1
            : 2
      );
    };

  useEffect(() => {
    if (!isZoomOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        handleCloseZoom();
      }

      if (
        event.key === "+" ||
        event.key === "="
      ) {
        handleZoomIn();
      }

      if (
        event.key === "-"
      ) {
        handleZoomOut();
      }

      if (
        event.key === "0"
      ) {
        handleResetZoom();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isZoomOpen]);

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

          <section className="relative min-w-0">

            {/* =================================
                IMAGEN PRINCIPAL
                Igual al detalle normal de laminado
            ================================= */}

            <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white">

              <div
                ref={
                  mainImageContainerRef
                }
                className="flex h-[420px] items-center justify-center sm:h-[520px] lg:h-[600px] xl:h-[620px]"
              >

                {mainImageUrl ? (
                  <button
                    type="button"
                    onClick={
                      handleOpenZoom
                    }
                    onMouseEnter={
                      handleMagnifierMove
                    }
                    onMouseMove={
                      handleMagnifierMove
                    }
                    onMouseLeave={
                      handleMagnifierLeave
                    }
                    disabled={
                      !canZoomSelectedImage
                    }
                    className={`group relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-5 lg:p-6 ${
                      canZoomSelectedImage
                        ? "cursor-zoom-in"
                        : "cursor-default"
                    }`}
                    aria-label={
                      canZoomSelectedImage
                        ? `Ampliar ${mainImageAlt}`
                        : mainImageAlt
                    }
                  >

                    <img
                      ref={
                        mainImageRef
                      }
                      key={
                        selectedImage
                          ?.id ||
                        mainImageUrl
                      }
                      src={
                        mainImageUrl
                      }
                      alt={
                        mainImageAlt
                      }
                      draggable="false"
                      className="h-full w-full select-none rounded-[1.75rem] object-contain"
                    />

                    {/* Lente de zoom, sólo escritorio */}
                    {canZoomSelectedImage &&
                      isMagnifierVisible && (
                        <span
                          className="pointer-events-none absolute hidden rounded-xl border-2 border-white/90 bg-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-[1px] xl:block"
                          style={{
                            left:
                              magnifierPosition
                                .lensLeft,
                            top:
                              magnifierPosition
                                .lensTop,
                            width:
                              magnifierPosition
                                .lensSize,
                            height:
                              magnifierPosition
                                .lensSize,
                          }}
                        />
                      )}

                    {/* Indicador de zoom */}
                    {canZoomSelectedImage && (
                      <span className="pointer-events-none absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition duration-300 group-hover:bg-black group-hover:text-white">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                          className="h-5 w-5"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="6"
                          />
                          <path d="m16 16 4 4" />
                          <path d="M11 8v6" />
                          <path d="M8 11h6" />
                        </svg>
                      </span>
                    )}

                  </button>
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-8 text-center">
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

            </div>

            {/* =================================
                ZOOM LATERAL DEL PANEL
                Igual al laminado normal
            ================================= */}

            {mainImageUrl &&
              canZoomSelectedImage && (
                <div
                  className={`pointer-events-none absolute left-[calc(100%+1.25rem)] top-0 z-[80] hidden aspect-[720/620] w-[min(560px,42vw)] overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[#f3f2ee] shadow-2xl transition-all duration-150 xl:block ${
                    isMagnifierVisible
                      ? "visible opacity-100"
                      : "invisible opacity-0"
                  }`}
                  aria-hidden="true"
                >
                  <img
                    src={
                      mainImageUrl
                    }
                    alt=""
                    draggable="false"
                    className="h-full w-full select-none object-contain"
                    style={{
                      transform:
                        "scale(3.2)",
                      transformOrigin:
                        `${magnifierPosition.originX}% ${magnifierPosition.originY}%`,
                      transition:
                        "transform-origin 40ms linear",
                    }}
                  />

                  <div className="absolute left-4 top-4 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-700 shadow-sm backdrop-blur">
                    Zoom detalle
                  </div>
                </div>
              )}

            {/* =================================
                MINIATURAS VERTICALES
                sample primero / panel segundo
            ================================= */}

            {images.length > 1 && (
              <div className="mt-4 flex gap-3">

                {images.map(
                  (image) => {
                    const thumbnail =
                      image
                        ?.thumbnail_url ||
                      image?.card_url ||
                      image?.detail_url ||
                      image?.image_url;

                    if (!thumbnail) {
                      return null;
                    }

                    const active =
                      selectedImage
                        ?.id ===
                      image.id;

                    return (
                      <button
                        key={
                          image.id
                        }
                        type="button"
                        onClick={() => {
                          setSelectedImageId(
                            image.id
                          );

                          setIsMagnifierVisible(
                            false
                          );

                          setIsZoomOpen(
                            false
                          );

                          setZoomScale(
                            1
                          );
                        }}
                        className={`relative h-24 w-20 overflow-hidden rounded-xl border bg-[#f3f2ee] transition sm:h-28 sm:w-24 ${
                          active
                            ? "border-black"
                            : "border-neutral-200 hover:border-neutral-400"
                        }`}
                        aria-label={`Ver ${
                          image
                            ?.alt_text ||
                          product
                            ?.name ||
                          "Producto"
                        }`}
                      >
                        <img
                          src={
                            thumbnail
                          }
                          alt={
                            image
                              ?.alt_text ||
                            product
                              ?.name ||
                            "Producto"
                          }
                          loading="lazy"
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

      {/* =========================================
          VISOR / LIGHTBOX DEL PANEL
      ========================================= */}

      {isZoomOpen &&
        canZoomSelectedImage &&
        mainImageUrl && (
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen ampliada de ${
              product?.name ||
              "producto"
            }`}
            onClick={
              handleCloseZoom
            }
          >

            <div className="relative z-20 flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
              <div className="min-w-0 pr-5">
                <p className="truncate text-sm font-medium text-white">
                  {product?.name}
                </p>

                <p className="mt-1 text-xs text-white/50">
                  {Math.round(
                    zoomScale *
                      100
                  )}
                  % de zoom
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseZoom
                }
                aria-label="Cerrar imagen ampliada"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-light text-white transition hover:bg-white hover:text-black"
              >
                ×
              </button>
            </div>

            <div
              className="relative flex min-h-0 flex-1 overflow-auto p-4 sm:p-8"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="m-auto flex min-h-full min-w-full items-center justify-center">
                <img
                  src={
                    mainImageUrl
                  }
                  alt={
                    mainImageAlt
                  }
                  draggable="false"
                  onDoubleClick={
                    handleDoubleClickZoom
                  }
                  className="max-h-[calc(100vh-11rem)] max-w-[90vw] select-none object-contain"
                  style={{
                    transform:
                      `scale(${zoomScale})`,
                    transformOrigin:
                      "center center",
                    transition:
                      "transform 180ms ease",
                  }}
                />
              </div>
            </div>

            <div
              className="relative z-20 flex shrink-0 items-center justify-center pb-5 pt-3"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/70 p-1.5 shadow-xl backdrop-blur">

                <button
                  type="button"
                  onClick={
                    handleZoomOut
                  }
                  disabled={
                    zoomScale <= 1
                  }
                  aria-label="Reducir zoom"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>

                <button
                  type="button"
                  onClick={
                    handleResetZoom
                  }
                  className="min-w-[72px] rounded-full px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  1:1
                </button>

                <button
                  type="button"
                  onClick={
                    handleZoomIn
                  }
                  disabled={
                    zoomScale >= 4
                  }
                  aria-label="Aumentar zoom"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>

              </div>
            </div>

          </div>
        )}

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
