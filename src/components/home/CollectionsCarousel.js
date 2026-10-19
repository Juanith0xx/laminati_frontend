"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";


const AUTO_PLAY_MS =
  5200;


const fallbackGradients = [
  "from-[#d8cbb8] via-[#aa9276] to-[#594639]",
  "from-[#d1cec7] via-[#8e8a82] to-[#393733]",
  "from-[#899086] via-[#4d554d] to-[#1f241f]",
  "from-[#c2ad95] via-[#806b59] to-[#382d25]",
  "from-[#b99f7d] via-[#78614c] to-[#30251e]",
  "from-[#c8c4bc] via-[#8e8981] to-[#403d39]",
];


function getVisibleCount() {
  if (
    typeof window ===
    "undefined"
  ) {
    return 4;
  }

  if (
    window.innerWidth <
    640
  ) {
    return 1;
  }

  if (
    window.innerWidth <
    1024
  ) {
    return 2;
  }

  return 4;
}


/* =========================================
   VISUAL PREMIUM
   Misma línea visual de /colecciones
========================================= */

function CollectionVisual({
  collection,
  index,
}) {
  const background =
    collection
      ?.visual_background ||
    null;

  const sampleOne =
    collection
      ?.visual_sample_one ||
    null;

  const sampleTwo =
    collection
      ?.visual_sample_two ||
    null;

  const variant =
    index % 6;

  return (
    <>
      {background ? (
        <img
          src={
            background
          }
          alt=""
          aria-hidden="true"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover

            scale-[1.015]

            transition-transform
            duration-700
            ease-out

            group-hover:
            scale-[1.075]
          "
        />
      ) : (
        <div
          className={`
            absolute
            inset-0

            bg-gradient-to-br

            ${
              fallbackGradients[
                index %
                fallbackGradients.length
              ]
            }
          `}
        />
      )}

      <div
        className="
          absolute
          inset-0
          bg-white/[0.02]

          transition
          duration-500

          group-hover:
          bg-transparent
        "
      />

      {/* 01 · DOS PLACAS HORIZONTALES */}
      {sampleOne &&
        variant === 0 && (
          <>
            <div
              className="
                absolute
                left-[10%]
                top-[14%]

                h-[31%]
                w-[76%]

                rotate-[-7deg]
                overflow-hidden
                rounded-[0.75rem]

                border
                border-white/15

                bg-neutral-200

                shadow-[0_28px_55px_rgba(0,0,0,0.32)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-y-2

                group-hover:
                rotate-[-4deg]

                group-hover:
                scale-[1.035]
              "
            >
              <img
                src={
                  sampleOne
                }
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  left-[18%]
                  top-[25%]

                  h-[26%]
                  w-[68%]

                  rotate-[5deg]
                  overflow-hidden
                  rounded-[0.7rem]

                  border
                  border-white/10

                  shadow-[0_20px_42px_rgba(0,0,0,0.30)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  translate-x-2

                  group-hover:
                  rotate-[2deg]
                "
              >
                <img
                  src={
                    sampleTwo
                  }
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        )}

      {/* 02 · PLACAS CRUZADAS */}
      {sampleOne &&
        variant === 1 && (
          <>
            <div
              className="
                absolute
                -right-[8%]
                top-[9%]

                h-[51%]
                w-[67%]

                rotate-[8deg]
                overflow-hidden
                rounded-[1.05rem]

                border
                border-white/10

                shadow-[0_28px_60px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-x-3

                group-hover:
                rotate-[4deg]
              "
            >
              <img
                src={
                  sampleOne
                }
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  -left-[10%]
                  top-[25%]

                  h-[35%]
                  w-[64%]

                  rotate-[-9deg]
                  overflow-hidden
                  rounded-[0.9rem]

                  border
                  border-white/10

                  shadow-[0_22px_45px_rgba(0,0,0,0.28)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  translate-x-4

                  group-hover:
                  rotate-[-5deg]
                "
              >
                <img
                  src={
                    sampleTwo
                  }
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        )}

      {/* 03 · PLACA VERTICAL */}
      {sampleOne &&
        variant === 2 && (
          <div
            className="
              absolute
              left-[17%]
              top-[8%]

              h-[56%]
              w-[68%]

              origin-bottom

              -rotate-[3deg]
              overflow-hidden

              rounded-t-[1.4rem]
              rounded-b-[0.55rem]

              border
              border-white/10

              shadow-[0_30px_65px_rgba(0,0,0,0.35)]

              transition-all
              duration-700
              ease-out

              group-hover:
              -translate-y-3

              group-hover:
              rotate-0

              group-hover:
              scale-[1.035]
            "
          >
            <img
              src={
                sampleOne
              }
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </div>
        )}

      {/* 04 · PLACAS SUPERPUESTAS */}
      {sampleOne &&
        variant === 3 && (
          <>
            <div
              className="
                absolute
                left-[8%]
                top-[17%]

                h-[37%]
                w-[83%]

                rotate-[2deg]
                overflow-hidden
                rounded-[0.6rem]

                border
                border-white/10

                shadow-[0_26px_55px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                -translate-y-2

                group-hover:
                rotate-0
              "
            >
              <img
                src={
                  sampleOne
                }
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  right-[11%]
                  top-[27%]

                  h-[31%]
                  w-[63%]

                  rotate-[-7deg]
                  overflow-hidden
                  rounded-[0.55rem]

                  border
                  border-white/10

                  shadow-[0_18px_40px_rgba(0,0,0,0.26)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  -translate-x-2

                  group-hover:
                  rotate-[-3deg]
                "
              >
                <img
                  src={
                    sampleTwo
                  }
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        )}

      {/* 05 · FORMA CURVA */}
      {sampleOne &&
        variant === 4 && (
          <div
            className="
              absolute
              left-[13%]
              top-[9%]

              h-[55%]
              w-[73%]

              overflow-hidden

              rounded-[40%_40%_1.25rem_1.25rem]

              border
              border-white/10

              shadow-[0_28px_58px_rgba(0,0,0,0.30)]

              transition-all
              duration-700
              ease-out

              group-hover:
              -translate-y-3

              group-hover:
              scale-[1.03]
            "
          >
            <img
              src={
                sampleOne
              }
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </div>
        )}

      {/* 06 · DOS PLACAS VERTICALES */}
      {sampleOne &&
        variant === 5 && (
          <>
            <div
              className="
                absolute
                -left-[3%]
                top-[10%]

                h-[51%]
                w-[53%]

                rotate-[-5deg]
                overflow-hidden
                rounded-[1rem]

                border
                border-white/10

                shadow-[0_25px_50px_rgba(0,0,0,0.30)]

                transition-all
                duration-700
                ease-out

                group-hover:
                translate-x-3

                group-hover:
                rotate-[-2deg]
              "
            >
              <img
                src={
                  sampleOne
                }
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>

            {sampleTwo && (
              <div
                className="
                  absolute
                  right-[4%]
                  top-[17%]

                  h-[43%]
                  w-[54%]

                  rotate-[6deg]
                  overflow-hidden
                  rounded-[1rem]

                  border
                  border-white/10

                  shadow-[0_25px_50px_rgba(0,0,0,0.30)]

                  transition-all
                  duration-700
                  ease-out

                  group-hover:
                  -translate-x-3

                  group-hover:
                  rotate-[2deg]
                "
              >
                <img
                  src={
                    sampleTwo
                  }
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        )}

      {/* LECTURA */}
      <div
        className="
          absolute
          inset-0

          bg-gradient-to-t
          from-black/80
          via-black/10
          to-black/10

          transition
          duration-500

          group-hover:
          from-black/75
        "
      />

      {/* DESTELLO */}
      <div
        className="
          pointer-events-none

          absolute
          -left-[90%]
          top-[-20%]

          h-[145%]
          w-[55%]

          rotate-[18deg]

          bg-gradient-to-r
          from-transparent
          via-white/12
          to-transparent

          transition-transform
          duration-[1100ms]
          ease-out

          group-hover:
          translate-x-[430%]
        "
      />
    </>
  );
}


/* =========================================
   CAROUSEL
========================================= */

export default function CollectionsCarousel({
  collections = [],
}) {
  const viewportRef =
    useRef(null);

  const itemRefs =
    useRef([]);

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  const [
    visibleCount,
    setVisibleCount,
  ] =
    useState(4);

  const [
    paused,
    setPaused,
  ] =
    useState(false);

  const maxStartIndex =
    useMemo(
      () =>
        Math.max(
          0,
          collections.length -
            visibleCount
        ),
      [
        collections.length,
        visibleCount,
      ]
    );

  const canMove =
    collections.length >
    visibleCount;

  const scrollToIndex =
    useCallback(
      (
        nextIndex,
        behavior =
          "smooth"
      ) => {
        const viewport =
          viewportRef.current;

        const item =
          itemRefs
            .current[
            nextIndex
          ];

        if (
          !viewport ||
          !item
        ) {
          return;
        }

        viewport.scrollTo({
          left:
            item.offsetLeft,
          behavior,
        });

        setActiveIndex(
          nextIndex
        );
      },
      []
    );

  const next =
    useCallback(
      () => {
        if (!canMove) {
          return;
        }

        const nextIndex =
          activeIndex >=
          maxStartIndex
            ? 0
            : activeIndex +
              1;

        scrollToIndex(
          nextIndex
        );
      },
      [
        activeIndex,
        canMove,
        maxStartIndex,
        scrollToIndex,
      ]
    );

  const previous =
    useCallback(
      () => {
        if (!canMove) {
          return;
        }

        const nextIndex =
          activeIndex <= 0
            ? maxStartIndex
            : activeIndex -
              1;

        scrollToIndex(
          nextIndex
        );
      },
      [
        activeIndex,
        canMove,
        maxStartIndex,
        scrollToIndex,
      ]
    );

  const handleViewportScroll =
    useCallback(
      () => {
        const viewport =
          viewportRef.current;

        if (!viewport) {
          return;
        }

        const currentLeft =
          viewport.scrollLeft;

        let closestIndex =
          0;

        let closestDistance =
          Number.POSITIVE_INFINITY;

        itemRefs.current.forEach(
          (
            item,
            index
          ) => {
            if (!item) {
              return;
            }

            const distance =
              Math.abs(
                item.offsetLeft -
                  currentLeft
              );

            if (
              distance <
              closestDistance
            ) {
              closestDistance =
                distance;

              closestIndex =
                index;
            }
          }
        );

        const safeIndex =
          Math.min(
            closestIndex,
            maxStartIndex
          );

        setActiveIndex(
          (
            currentIndex
          ) =>
            currentIndex ===
            safeIndex
              ? currentIndex
              : safeIndex
        );
      },
      [
        maxStartIndex,
      ]
    );

  useEffect(
    () => {
      const updateVisibleCount =
        () => {
          const nextCount =
            getVisibleCount();

          setVisibleCount(
            nextCount
          );

          requestAnimationFrame(
            () => {
              const nextMax =
                Math.max(
                  0,
                  collections.length -
                    nextCount
                );

              const safeIndex =
                Math.min(
                  activeIndex,
                  nextMax
                );

              scrollToIndex(
                safeIndex,
                "auto"
              );
            }
          );
        };

      updateVisibleCount();

      window.addEventListener(
        "resize",
        updateVisibleCount
      );

      return () =>
        window.removeEventListener(
          "resize",
          updateVisibleCount
        );
    },
    [
      activeIndex,
      collections.length,
      scrollToIndex,
    ]
  );

  useEffect(
    () => {
      if (
        !canMove ||
        paused
      ) {
        return;
      }

      const interval =
        window.setInterval(
          next,
          AUTO_PLAY_MS
        );

      return () =>
        window.clearInterval(
          interval
        );
    },
    [
      canMove,
      next,
      paused,
    ]
  );

  useEffect(
    () => {
      if (
        activeIndex >
        maxStartIndex
      ) {
        scrollToIndex(
          maxStartIndex,
          "auto"
        );
      }
    },
    [
      activeIndex,
      maxStartIndex,
      scrollToIndex,
    ]
  );

  return (
    <div
      className="relative"
      onMouseEnter={() =>
        setPaused(true)
      }
      onMouseLeave={() =>
        setPaused(false)
      }
      onFocusCapture={() =>
        setPaused(true)
      }
      onBlurCapture={() =>
        setPaused(false)
      }
    >

      {canMove && (
        <div className="mb-5 flex items-center justify-end gap-2">

          <button
            type="button"
            onClick={
              previous
            }
            aria-label="Colección anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-white transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            ←
          </button>

          <button
            type="button"
            onClick={
              next
            }
            aria-label="Siguiente colección"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-white transition hover:border-white/30 hover:bg-white hover:text-black"
          >
            →
          </button>

        </div>
      )}

      <div
        ref={
          viewportRef
        }
        onScroll={
          handleViewportScroll
        }
        className="
          scrollbar-none

          overflow-x-auto
          overscroll-x-contain

          snap-x
          snap-mandatory

          touch-pan-x

          sm:overflow-x-hidden
          sm:snap-none
        "
      >

        <div className="flex gap-4 sm:gap-5 lg:gap-6">

          {collections.map(
            (
              collection,
              index
            ) => {
              return (
                <Link
                  key={
                    collection.id
                  }
                  ref={(
                    node
                  ) => {
                    itemRefs
                      .current[
                      index
                    ] =
                      node;
                  }}
                  href={`/productos?collection=${encodeURIComponent(
                    collection.slug
                  )}`}
                  className={`
                    group
                    relative

                    aspect-[4/5]

                    w-[84%]
                    shrink-0

                    snap-start

                    overflow-hidden

                    rounded-[2rem]

                    !border-0
                    !outline-none
                    !ring-0

                    bg-neutral-900

                    shadow-[0_14px_34px_rgba(0,0,0,0.16)]

                    transition-transform
                    duration-500
                    ease-out

                    hover:
                    -translate-y-1.5

                    hover:
                    shadow-[0_24px_56px_rgba(0,0,0,0.26)]

                    sm:aspect-[3/4]

                    sm:w-[47%]
                    sm:snap-none

                    lg:w-[calc(25%_-_18px)]

                    opacity-100
                    scale-100
                  `}
                  style={{
                    border:
                      "none",
                    outline:
                      "none",
                  }}
                >

                  <CollectionVisual
                    collection={
                      collection
                    }
                    index={
                      index
                    }
                  />

                  {/* NÚMERO */}
                  <div
                    className="
                      absolute
                      left-5
                      top-5

                      z-20

                      text-[10px]
                      font-semibold

                      tracking-[0.2em]

                      text-white/65
                    "
                  >
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  {/* CTA */}
                  <div
                    className="
                      absolute
                      right-5
                      top-5

                      z-20

                      flex
                      h-10
                      w-10

                      items-center
                      justify-center

                      rounded-full

                      border
                      border-white/25

                      bg-white/10

                      text-white

                      backdrop-blur-md

                      transition-all
                      duration-300

                      group-hover:
                      scale-110

                      group-hover:
                      border-white

                      group-hover:
                      bg-white

                      group-hover:
                      text-black
                    "
                  >
                    ↗
                  </div>

                  {/* TEXTO */}
                  <div
                    className="
                      absolute
                      bottom-0
                      left-0
                      right-0

                      z-20

                      p-5
                      sm:p-6
                    "
                  >

                    <p
                      className="
                        text-[10px]
                        font-semibold

                        uppercase

                        tracking-[0.2em]

                        text-white/60
                      "
                    >
                      Colección
                    </p>

                    <h3
                      className="
                        mt-2

                        max-w-[95%]

                        text-[1.35rem]
                        font-medium

                        leading-[1.12]

                        tracking-[-0.04em]

                        text-white

                        sm:text-2xl
                      "
                    >
                      {
                        collection.name
                      }
                    </h3>

                    <div className="mt-3 flex items-center justify-between gap-4">

                      <p
                        className="
                          truncate
                          text-xs
                          text-white/60
                        "
                      >
                        {
                          collection.brand ||
                          "Abet Laminati"
                        }
                      </p>

                      {Number(
                        collection
                          ?.product_count ||
                        0
                      ) >
                        0 && (
                        <span
                          className="
                            shrink-0

                            rounded-full

                            border
                            border-white/15

                            bg-white/[0.08]

                            px-2.5
                            py-1

                            text-[9px]
                            font-medium

                            uppercase

                            tracking-[0.12em]

                            text-white/60

                            backdrop-blur
                          "
                        >
                          {
                            collection
                              .product_count
                          }{" "}
                          {
                            Number(
                              collection
                                .product_count
                            ) ===
                            1
                              ? "producto"
                              : "productos"
                          }
                        </span>
                      )}

                    </div>

                  </div>

                </Link>
              );
            }
          )}

        </div>

      </div>

      {canMove && (
        <div className="mt-6 flex items-center justify-center gap-2">

          {Array.from(
            {
              length:
                maxStartIndex +
                1,
            },
            (
              _,
              index
            ) => (
              <button
                key={
                  index
                }
                type="button"
                onClick={() =>
                  scrollToIndex(
                    index
                  )
                }
                aria-label={`Ir a posición ${
                  index + 1
                }`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex ===
                  index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/25 hover:bg-white/50"
                }`}
              />
            )
          )}

        </div>
      )}

    </div>
  );
}
