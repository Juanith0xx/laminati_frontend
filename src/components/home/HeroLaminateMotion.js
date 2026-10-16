"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  animate,
  createScope,
  stagger,
  utils,
} from "animejs";

const FALLBACK_PANELS = [
  {
    name:
      "Natural Oak",
    fallback:
      "linear-gradient(105deg,#d8b88d,#b88d62 48%,#8f6645)",
  },
  {
    name:
      "Dark Wood",
    fallback:
      "linear-gradient(105deg,#5b3925,#2f1c14 55%,#160d09)",
  },
  {
    name:
      "Stone",
    fallback:
      "linear-gradient(120deg,#dedbd4,#bcb8b0 55%,#938e86)",
  },
  {
    name:
      "Deep Timber",
    fallback:
      "linear-gradient(105deg,#55473b,#2b2520 58%,#181512)",
  },
];

function buildPanels(
  textures
) {
  return FALLBACK_PANELS.map(
    (
      fallback,
      index
    ) => ({
      ...fallback,
      ...(
        textures?.[
          index
        ] ||
        {}
      ),
    })
  );
}

export default function HeroLaminateMotion({
  textures = [],
}) {
  const root =
    useRef(null);

  const panels =
    useMemo(
      () =>
        buildPanels(
          textures
        ),
      [
        textures,
      ]
    );

  useEffect(
    () => {
      const scope =
        createScope({
          root,
          mediaQueries: {
            reduceMotion:
              "(prefers-reduced-motion: reduce)",
            small:
              "(max-width: 767px)",
          },
        }).add(
          (
            self
          ) => {
            const {
              reduceMotion,
              small,
            } =
              self.matches;

            if (
              reduceMotion
            ) {
              utils.set(
                ".laminate-panel",
                {
                  opacity: 1,
                  scale: 1,
                  translateX: 0,
                  translateY: 0,
                }
              );

              return;
            }

            /*
             * Entrada tipo abanico de muestrarios HPL.
             * Se anima solo el transform interno para mantener
             * la posición/rotación base de cada placa.
             */
            animate(
              ".laminate-panel-inner",
              {
                opacity: [
                  0,
                  1,
                ],
                scale: [
                  0.86,
                  1,
                ],
                translateY:
                  small
                    ? [
                        18,
                        0,
                      ]
                    : [
                        42,
                        0,
                      ],
                delay:
                  stagger(
                    135
                  ),
                duration:
                  1150,
                ease:
                  "out(4)",
              }
            );

            /*
             * Respiración sutil: las placas parecen suspendidas.
             */
            animate(
              ".laminate-float",
              {
                translateY:
                  stagger(
                    small
                      ? [
                          -2,
                          2,
                        ]
                      : [
                          -7,
                          7,
                        ]
                  ),
                delay:
                  stagger(
                    360
                  ),
                duration:
                  5200,
                loop: true,
                alternate:
                  true,
                ease:
                  "inOutSine",
              }
            );

            /*
             * Reflejo sobre texturas reales.
             */
            animate(
              ".laminate-sheen",
              {
                translateX:
                  "520%",
                delay:
                  stagger(
                    1100,
                    {
                      start:
                        1000,
                    }
                  ),
                duration:
                  5200,
                loop: true,
                ease:
                  "inOutSine",
              }
            );

            /*
             * Sombra de piso levemente pulsante.
             */
            animate(
              ".laminate-ground-shadow",
              {
                scaleX: [
                  0.94,
                  1.03,
                ],
                opacity: [
                  0.16,
                  0.23,
                ],
                duration:
                  5200,
                loop: true,
                alternate:
                  true,
                ease:
                  "inOutSine",
              }
            );
          }
        );

      return () =>
        scope.revert();
    },
    []
  );

  const configs = [
    {
      className:
        "left-[5%] top-[18%] h-[65%] w-[36%] -rotate-[8deg] z-[4]",
    },
    {
      className:
        "left-[29%] top-[13%] h-[69%] w-[33%] -rotate-[2deg] z-[3]",
    },
    {
      className:
        "left-[52%] top-[17%] h-[63%] w-[31%] rotate-[6deg] z-[2]",
    },
    {
      className:
        "right-[0%] top-[24%] h-[57%] w-[28%] rotate-[11deg] z-[1]",
    },
  ];

  return (
    <div
      ref={
        root
      }
      className="relative min-h-[460px] w-full sm:min-h-[560px] lg:min-h-[650px]"
      aria-hidden="true"
    >

      {/* halo de fondo */}
      <div className="absolute inset-x-[5%] bottom-[12%] top-[8%] rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(207,197,182,.30),rgba(245,244,240,0)_70%)] blur-2xl" />

      {/* sombra de piso */}
      <div className="laminate-ground-shadow absolute bottom-[10%] left-[18%] h-[7%] w-[74%] rounded-[50%] bg-black/15 blur-2xl" />

      {panels.map(
        (
          panel,
          index
        ) => {

          const config =
            configs[index];

          return (
            <div
              key={
                panel.id ||
                `${panel.name}-${index}`
              }
              className={`laminate-panel absolute ${config.className}`}
            >

              <div className="laminate-panel-inner h-full w-full">

                <div className="laminate-float relative h-full w-full">

                  {/* cara de lámina */}
                  <div className="relative z-10 h-full w-full overflow-hidden rounded-[1.8rem] border border-black/[0.05] bg-[#d3cabf] shadow-[0_18px_45px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.08)] sm:rounded-[2.2rem]">

                    {panel.imageUrl ? (
                      <img
                        src={
                          panel.imageUrl
                        }
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            panel.fallback,
                        }}
                      />
                    )}

                    {/* realce de textura */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10" />

                    {/* borde interior muy sutil para definir la muestra sin simular espesor */}
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />

                    {/* barrido de luz */}
                    <div className="laminate-sheen absolute -left-[55%] top-[-12%] h-[125%] w-[27%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/32 to-transparent blur-[1px]" />

                    {/* pequeña leyenda solo en desktop */}
                    <div className="absolute bottom-4 left-4 hidden max-w-[75%] rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md xl:block">
                      {panel.name}
                    </div>

                  </div>

                </div>

              </div>

            </div>
          );
        }
      )}

      {/* etiqueta materialidad */}
      <div className="absolute bottom-[4%] left-[7%] z-[9] hidden max-w-[220px] rounded-2xl border border-black/[0.05] bg-white/92 p-4 shadow-[0_15px_38px_rgba(0,0,0,0.08)] backdrop-blur sm:block">

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Materialidad
        </p>

        <p className="mt-2 text-sm font-medium leading-5 text-neutral-800">
          Superficies reales de nuestro catálogo.
        </p>

      </div>

    </div>
  );
}
