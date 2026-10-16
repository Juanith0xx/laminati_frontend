"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProducts,
} from "@/services/products.service";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

/* =========================================
   SKU MANUALES DEL REGISTRO

   Igual que en el Hero:
   cambia solamente estos SKU para cambiar
   las 4 texturas mostradas en el registro.

   Ejemplo:
   "668R" -> usa automáticamente la imagen
   real del producto 668R desde el catálogo.
========================================= */

export const REGISTER_TEXTURE_SKUS = [
  "1239S",   // placa 1
  "619S",   // placa 2
  "548C",  // placa 3
  "F2808PO",   // placa 4
];

/*
 * Se usan solamente si un SKU no existe,
 * no está publicado o no tiene imagen.
 */
const REGISTER_FALLBACKS = [
  {
    name: "Laminado 01",
    fallback:
      "linear-gradient(90deg, #9b6d48 0%, #6d452e 46%, #b1845f 100%)",
  },
  {
    name: "Laminado 02",
    fallback:
      "linear-gradient(145deg, #353638 0%, #18191a 48%, #48494a 100%)",
  },
  {
    name: "Laminado 03",
    fallback:
      "linear-gradient(155deg, #3c5f65 0%, #55777a 48%, #294348 100%)",
  },
  {
    name: "Laminado 04",
    fallback:
      "linear-gradient(145deg, #eee9e1 0%, #cfc5b9 54%, #f8f5ef 100%)",
  },
];

function getProductImage(
  product
) {
  return (
    product
      ?.primary_image_url ||
    product
      ?.primary_image
      ?.detail_url ||
    product
      ?.primary_image
      ?.card_url ||
    null
  );
}

function getProductsFromResponse(
  response
) {
  if (
    Array.isArray(
      response?.products
    )
  ) {
    return response.products;
  }

  if (
    Array.isArray(
      response?.data?.products
    )
  ) {
    return response.data.products;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  return [];
}

function normalizeSku(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}

async function loadProductBySku(
  sku
) {
  try {
    const response =
      await getProducts({
        search:
          sku,
        limit:
          12,
        sort:
          "featured",
      });

    const products =
      getProductsFromResponse(
        response
      );

    const normalizedSku =
      normalizeSku(
        sku
      );

    return (
      products.find(
        (
          product
        ) =>
          normalizeSku(
            product?.sku
          ) ===
            normalizedSku &&
          product
            ?.commercial_mode !==
            "PROJECT_ONLY" &&
          getProductImage(
            product
          )
      ) ||
      null
    );
  } catch (error) {
    console.error(
      `Error cargando SKU ${sku} para el registro:`,
      error
    );

    return null;
  }
}

function buildInitialLaminate(
  sku,
  index
) {
  const fallback =
    REGISTER_FALLBACKS[
      index
    ] ||
    REGISTER_FALLBACKS[0];

  return {
    id:
      `register-${sku}-${index}`,
    code:
      normalizeSku(
        sku
      ) ||
      String(
        index + 1
      ).padStart(
        2,
        "0"
      ),
    sku:
      normalizeSku(
        sku
      ),
    name:
      fallback.name,
    imageUrl:
      null,
    fallback:
      fallback.fallback,
    position:
      "center",
    slug:
      null,
  };
}

async function loadRegisterTextures() {
  const products =
    await Promise.all(
      REGISTER_TEXTURE_SKUS.map(
        (
          sku
        ) =>
          loadProductBySku(
            sku
          )
      )
    );

  return REGISTER_TEXTURE_SKUS.map(
    (
      sku,
      index
    ) => {
      const fallback =
        buildInitialLaminate(
          sku,
          index
        );

      const product =
        products[
          index
        ];

      if (!product) {
        console.warn(
          `No se encontró el SKU ${sku} con imagen para la placa ${index + 1} del registro.`
        );

        return fallback;
      }

      return {
        ...fallback,
        id:
          product.id ||
          fallback.id,
        code:
          product.sku ||
          fallback.code,
        sku:
          product.sku ||
          fallback.sku,
        name:
          product.name ||
          fallback.name,
        imageUrl:
          getProductImage(
            product
          ),
        slug:
          product.slug ||
          null,
      };
    }
  );
}

/* =========================================
   AJUSTES DE ANIMACIÓN

   Cambiar estos valores modifica el efecto
   sin tocar las texturas.
========================================= */

const AUTOPLAY_MS = 3200;

const FAN_SLOTS = [
  {
    x: -128,
    y: 30,
    rotate: -8,
    scale: 0.88,
  },
  {
    x: -68,
    y: 12,
    rotate: -4,
    scale: 0.94,
  },
  {
    x: 72,
    y: 14,
    rotate: 4,
    scale: 0.94,
  },
  {
    x: 132,
    y: 32,
    rotate: 8,
    scale: 0.88,
  },
];

/* =========================================
   ICONOS
========================================= */

function FeatureIcon({
  type,
}) {
  if (type === "collection") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
        />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    );
  }

  if (type === "quote") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.8 6.7 3.5 3.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* =========================================
   HELPERS
========================================= */

const getRelativeIndex = (
  index,
  activeIndex,
  total
) => {
  let value =
    index - activeIndex;

  if (
    value >
    total / 2
  ) {
    value -= total;
  }

  if (
    value <
    -total / 2
  ) {
    value += total;
  }

  return value;
};

const getInactiveSlot = (
  relative,
  index
) => {
  if (relative <= -2) {
    return FAN_SLOTS[0];
  }

  if (relative === -1) {
    return FAN_SLOTS[1];
  }

  if (relative === 1) {
    return FAN_SLOTS[2];
  }

  if (relative >= 2) {
    return FAN_SLOTS[3];
  }

  return FAN_SLOTS[
    index %
      FAN_SLOTS.length
  ];
};

/* =========================================
   PLACA
========================================= */

function LaminateCard({
  laminate,
  index,
  activeIndex,
  total,
  reduceMotion,
  onSelect,
}) {
  const relative =
    getRelativeIndex(
      index,
      activeIndex,
      total
    );

  const isActive =
    index ===
    activeIndex;

  const slot =
    getInactiveSlot(
      relative,
      index
    );

  const target =
    isActive
      ? {
          x: 18,
          y: -18,
          rotate: 0,
          scale: 1.08,
        }
      : slot;

  return (
    <motion.button
      type="button"
      onClick={() =>
        onSelect(index)
      }
      aria-label={`Mostrar ${laminate.name}`}
      className="absolute left-1/2 top-1/2 h-[360px] w-[172px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[5px] border border-white/25 text-left shadow-[0_30px_80px_rgba(40,27,18,0.30)] outline-none focus-visible:ring-2 focus-visible:ring-[#e3ba7c]"
      style={{
        zIndex:
          isActive
            ? 40
            : 20 -
              Math.abs(
                relative
              ),
        transformStyle:
          "preserve-3d",
        backgroundImage:
          laminate.imageUrl
            ? `url("${laminate.imageUrl}"), ${laminate.fallback}`
            : laminate.fallback,
        backgroundSize:
          laminate.imageUrl
            ? "cover, cover"
            : "cover",
        backgroundPosition:
          laminate.position ||
          "center",
      }}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              x: 0,
              y: 65,
              rotate: 0,
              scale: 0.82,
            }
      }
      animate={{
        opacity: 1,
        x:
          target.x,
        y:
          target.y,
        rotate:
          target.rotate,
        scale:
          target.scale,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y:
                target.y -
                8,
              scale:
                target.scale +
                0.025,
          }
      }
      transition={{
        opacity: {
          duration:
            0.45,
          delay:
            index *
            0.07,
        },
        x: {
          type:
            "spring",
          stiffness:
            155,
          damping:
            21,
        },
        y: {
          type:
            "spring",
          stiffness:
            155,
          damping:
            21,
        },
        rotate: {
          type:
            "spring",
          stiffness:
            150,
          damping:
            22,
        },
        scale: {
          type:
            "spring",
          stiffness:
            175,
          damping:
            22,
        },
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,.20),transparent_30%,rgba(255,255,255,.03)_62%,transparent)]" />

      {isActive && (
        <motion.div
          className="absolute -left-[48%] top-[-10%] h-[120%] w-[34%] rotate-[10deg] bg-white/20 blur-lg"
          initial={{
            x: "-30%",
          }}
          animate={
            reduceMotion
              ? {
                  x:
                    "270%",
                }
              : {
                  x: [
                    "-30%",
                    "430%",
                  ],
                }
          }
          transition={{
            duration: 2.2,
            repeat:
              reduceMotion
                ? 0
                : Infinity,
            repeatDelay:
              2.3,
            ease:
              "easeInOut",
          }}
        />
      )}

      <div
        className={`absolute inset-x-0 bottom-0 p-4 transition ${
          isActive
            ? "bg-gradient-to-t from-black/55 via-black/16 to-transparent"
            : "bg-gradient-to-t from-black/35 to-transparent"
        }`}
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.23em] text-white/70">
          {
            laminate.sku ||
            laminate.code
          }
        </p>

        <p className="mt-1 text-[12px] font-semibold text-white">
          {
            laminate.name
          }
        </p>
      </div>
    </motion.button>
  );
}

/* =========================================
   SHOWCASE
========================================= */

export default function RegisterLaminateShowcase() {
  const reduceMotion =
    useReducedMotion();

  const [
    laminates,
    setLaminates,
  ] = useState(
    () =>
      REGISTER_TEXTURE_SKUS.map(
        (
          sku,
          index
        ) =>
          buildInitialLaminate(
            sku,
            index
          )
      )
  );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    paused,
    setPaused,
  ] = useState(false);

  const mouseX =
    useMotionValue(0);

  const mouseY =
    useMotionValue(0);

  const smoothX =
    useSpring(
      mouseX,
      {
        stiffness: 90,
        damping: 20,
        mass: 0.7,
      }
    );

  const smoothY =
    useSpring(
      mouseY,
      {
        stiffness: 90,
        damping: 20,
        mass: 0.7,
      }
    );

  const rotateY =
    useTransform(
      smoothX,
      [-1, 1],
      [-2.2, 2.2]
    );

  const rotateX =
    useTransform(
      smoothY,
      [-1, 1],
      [1.6, -1.6]
    );

  const translateX =
    useTransform(
      smoothX,
      [-1, 1],
      [-8, 8]
    );

  const translateY =
    useTransform(
      smoothY,
      [-1, 1],
      [-5, 5]
    );

  const activeLaminate =
    useMemo(
      () =>
        laminates[
          activeIndex
        ] ||
        null,
      [
        activeIndex,
        laminates,
      ]
    );

  useEffect(() => {
    let active = true;

    const loadTextures =
      async () => {
        const next =
          await loadRegisterTextures();

        if (!active) {
          return;
        }

        setLaminates(
          next
        );

        setActiveIndex(
          (
            current
          ) =>
            current <
            next.length
              ? current
              : 0
        );
      };

    void loadTextures();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      reduceMotion ||
      paused
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(
        () => {
          setActiveIndex(
            (
              current
            ) =>
              (
                current +
                1
              ) %
              laminates.length
          );
        },
        AUTOPLAY_MS
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    paused,
    reduceMotion,
    laminates.length,
  ]);

  const handlePointerMove =
    (event) => {
      if (
        reduceMotion
      ) {
        return;
      }

      const rect =
        event.currentTarget.getBoundingClientRect();

      const normalizedX =
        (
          event.clientX -
          rect.left
        ) /
          rect.width *
          2 -
        1;

      const normalizedY =
        (
          event.clientY -
          rect.top
        ) /
          rect.height *
          2 -
        1;

      mouseX.set(
        normalizedX
      );

      mouseY.set(
        normalizedY
      );
    };

  const resetPointer =
    () => {
      mouseX.set(0);
      mouseY.set(0);
      setPaused(
        false
      );
    };

  const features = [
    {
      type:
        "collection",
      text:
        "Explora nuestras colecciones y soluciones HPL.",
    },
    {
      type:
        "quote",
      text:
        "Centraliza tus cotizaciones y compras.",
    },
    {
      type:
        "secure",
      text:
        "Gestiona tu cuenta de forma rápida y segura.",
    },
  ];

  return (
    <section className="relative hidden min-h-[760px] overflow-hidden rounded-[28px] bg-[#ddd2c5] lg:block">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 14% 13%, rgba(255,255,255,.72), transparent 28%), linear-gradient(135deg, #eee7df 0%, #d8cabb 47%, #b9a08b 100%)",
        }}
      />

      <div className="absolute inset-y-0 right-0 w-[43%] bg-[linear-gradient(90deg,#785943_0%,#50382b_47%,#73523f_100%)] opacity-95" />

      <motion.div
        className="absolute right-[6%] top-[8%] h-[3px] w-[29%] bg-[#efc67f] shadow-[0_0_26px_6px_rgba(239,198,127,0.35)]"
        animate={
          reduceMotion
            ? false
            : {
                opacity: [
                  0.55,
                  1,
                  0.55,
                ],
              }
        }
        transition={{
          duration: 4,
          repeat:
            reduceMotion
              ? 0
              : Infinity,
          ease:
            "easeInOut",
        }}
      />

      {/* =====================================
          TEXTO EDITORIAL
      ===================================== */}
      <div className="relative z-30 max-w-[410px] px-12 py-16 xl:px-16 xl:py-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#80634e]">
          Más que superficies
        </p>

        <h1 className="mt-6 text-[42px] font-semibold leading-[1.06] tracking-[-0.035em] text-[#181512] xl:text-[49px]">
          Crea tu cuenta y descubre colecciones, proyectos e inspiración para tus espacios.
        </h1>

        <p className="mt-7 max-w-[365px] text-[13px] leading-6 text-[#5e554e]">
          Sé parte de Laminatiword y accede a una experiencia más simple para cotizar, comprar y gestionar tus proyectos.
        </p>

        <div className="mt-7 h-px w-12 bg-[#8b6d52]" />

        <div className="mt-7 space-y-4">
          {features.map(
            (
              feature
            ) => (
              <div
                key={
                  feature.text
                }
                className="flex max-w-[340px] items-center gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#8b6d52]/30 bg-white/35 text-[#765943] backdrop-blur">
                  <FeatureIcon
                    type={
                      feature.type
                    }
                  />
                </span>

                <span className="text-[12px] leading-5 text-[#554d47]">
                  {
                    feature.text
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================
          MUESTRARIO HPL
      ===================================== */}
      <div
        className="absolute bottom-[7%] right-[1%] top-[12%] z-20 w-[58%]"
        onPointerMove={
          handlePointerMove
        }
        onPointerEnter={() =>
          setPaused(true)
        }
        onPointerLeave={
          resetPointer
        }
      >
        <motion.div
          className="absolute inset-0"
          style={
            reduceMotion
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  x:
                    translateX,
                  y:
                    translateY,
                  transformPerspective:
                    1200,
                  transformStyle:
                    "preserve-3d",
                }
          }
        >
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/[0.06] blur-3xl" />

          {laminates.map(
            (
              laminate,
              index
            ) => (
              <LaminateCard
                key={
                  laminate.id
                }
                laminate={
                  laminate
                }
                index={
                  index
                }
                activeIndex={
                  activeIndex
                }
                total={
                  laminates.length
                }
                reduceMotion={
                  reduceMotion
                }
                onSelect={
                  setActiveIndex
                }
              />
            )
          )}
        </motion.div>

        {/* Selector / estado */}
        <div className="absolute bottom-1 right-8 z-50 w-[220px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#f2d4a6]">
                Colecciones
              </p>

              <p className="mt-1 text-[11px] font-medium text-white/90">
                {
                  activeLaminate
                    ?.name ||
                  "Laminado"
                }
              </p>
            </div>

            <p className="font-mono text-[10px] tracking-[0.12em] text-white/55">
              {String(
                activeIndex +
                  1
              ).padStart(
                2,
                "0"
              )}
              {" / "}
              {String(
                laminates.length
              ).padStart(
                2,
                "0"
              )}
            </p>
          </div>

          <div className="mt-3 flex gap-1.5">
            {laminates.map(
              (
                laminate,
                index
              ) => (
                <button
                  key={
                    laminate.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  aria-label={`Ver ${laminate.name}`}
                  className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20"
                >
                  {index ===
                    activeIndex && (
                    <motion.span
                      key={`progress-${activeIndex}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-[#f0c782]"
                      initial={{
                        width:
                          reduceMotion
                            ? "100%"
                            : "0%",
                      }}
                      animate={{
                        width:
                          "100%",
                      }}
                      transition={{
                        duration:
                          reduceMotion ||
                          paused
                            ? 0
                            : AUTOPLAY_MS /
                              1000,
                        ease:
                          "linear",
                      }}
                    />
                  )}
                </button>
              )
            )}
          </div>

          <p className="mt-3 text-[10px] leading-4 text-white/55">
            Selecciona una muestra o mueve el cursor para explorar el material.
          </p>
        </div>
      </div>
    </section>
  );
}
