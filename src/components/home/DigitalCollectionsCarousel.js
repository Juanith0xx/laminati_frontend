"use client";



import Image from "next/image";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, useReducedMotion } from "framer-motion";

import { useRef, useState } from "react";



const COLLECTIONS = [

  {

    id: "digital_circus",

    title: "Digital Circus",

    description: "Transparencias y profundidad visual.",

    image: "/images/home/digital-collections/digital-circus.webp",

    href: "/productos?collection=digital-circus-ettore-sottsass",

  },

  {

    id: "serigrafia",

    title: "Serigrafía",

    description: "Texturas naturales con realismo y carácter.",

    image: "/images/home/digital-collections/serigrafia.webp",

    href: "/productos/laminados/serigrafia-karim-rashid",

  },

  {

    id: "parade",

    title: "Parade",

    description: "Diseño gráfico de alto impacto.",

    image: "/images/home/digital-collections/parade.webp",

    href: "/productos?collection=parade-giulio-iacchetti",

  },

  {

    id: "colours",

    title: "Colours",

    description: "Diseño Colours de Rosso.",

    image: "/images/home/digital-collections/de_rosso.webp",

    href: "/productos?collection=colours-mate",

  },

];



const POSES = {

  left: {

    x: "-122%",

    y: "-47%",

    scale: 0.78,

    opacity: 0.9,

  },

  center: {

    x: "-50%",

    y: "-50%",

    scale: 1,

    opacity: 1,

  },

  right: {

    x: "22%",

    y: "-47%",

    scale: 0.78,

    opacity: 0.9,

  },

};



const HIDDEN_POSES = {

  left: {

    x: "-162%",

    y: "-43%",

    scale: 0.6,

    opacity: 0,

  },

  right: {

    x: "76%",

    y: "-43%",

    scale: 0.6,

    opacity: 0,

  },

};



function ArrowIcon({ direction = "right" }) {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="none"

      className={`h-5 w-5 ${direction === "left" ? "rotate-180" : ""}`}

      aria-hidden="true"

    >

      <path

        d="M5 12h14M14 7l5 5-5 5"

        stroke="currentColor"

        strokeWidth="1.7"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}



function normalizeIndex(index) {

  const total = COLLECTIONS.length;



  if (total === 0) {

    return 0;

  }



  return ((index % total) + total) % total;

}



function getRole(index, activeIndex) {

  const total = COLLECTIONS.length;



  if (total === 0) {

    return "hidden";

  }



  if (index === activeIndex) {

    return "center";

  }



  if (total === 1) {

    return "hidden";

  }



  const previousIndex = normalizeIndex(activeIndex - 1);

  const nextIndex = normalizeIndex(activeIndex + 1);



  if (index === previousIndex) {

    return "left";

  }



  if (index === nextIndex) {

    return "right";

  }



  return "hidden";

}



export default function DigitalCollectionsCarousel() {

  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(

    COLLECTIONS.length > 1 ? 1 : 0,

  );

  const [direction, setDirection] = useState(1);

  const previousActiveIndexRef = useRef(activeIndex);

  const reduceMotion = useReducedMotion();



  const moveTo = (nextIndex, nextDirection) => {

    if (COLLECTIONS.length <= 1) {

      return;

    }



    previousActiveIndexRef.current = activeIndex;

    setDirection(nextDirection);

    setActiveIndex(normalizeIndex(nextIndex));

  };



  const goNext = () => {

    moveTo(activeIndex + 1, 1);

  };



  const goPrevious = () => {

    moveTo(activeIndex - 1, -1);

  };



  const goTo = (index) => {

    if (index === activeIndex || COLLECTIONS.length <= 1) {

      return;

    }



    const total = COLLECTIONS.length;

    const forwardDistance = normalizeIndex(index - activeIndex);

    const backwardDistance = normalizeIndex(activeIndex - index);

    const nextDirection = forwardDistance <= backwardDistance ? 1 : -1;



    moveTo(index, nextDirection);

  };



  const getCardAnimation = (index) => {

    const previousRole = getRole(index, previousActiveIndexRef.current);

    const nextRole = getRole(index, activeIndex);



    /**
     * Con tres colecciones, la tarjeta de un extremo puede reaparecer
     * directamente en el extremo opuesto. Conservamos el efecto original
     * pasando por detrás de la tarjeta central.
     */

    const travelsBehind =

      COLLECTIONS.length === 3 &&

      ((direction === 1 && previousRole === "left" && nextRole === "right") ||

        (direction === -1 &&

          previousRole === "right" &&

          nextRole === "left"));



    if (travelsBehind && !reduceMotion) {

      if (direction === 1) {

        return {

          animation: {

            x: [POSES.left.x, "-155%", "72%", POSES.right.x],

            y: [POSES.left.y, "-43%", "-43%", POSES.right.y],

            scale: [0.78, 0.62, 0.62, 0.78],

            opacity: [0.9, 0.18, 0.18, 0.9],

          },

          behind: true,

          visible: true,

        };

      }



      return {

        animation: {

          x: [POSES.right.x, "72%", "-155%", POSES.left.x],

          y: [POSES.right.y, "-43%", "-43%", POSES.left.y],

          scale: [0.78, 0.62, 0.62, 0.78],

          opacity: [0.9, 0.18, 0.18, 0.9],

        },

        behind: true,

        visible: true,

      };

    }



    if (nextRole === "hidden") {

      const hiddenSide =

        previousRole === "right"

          ? "right"

          : previousRole === "left"

            ? "left"

            : direction === 1

              ? "left"

              : "right";



      return {

        animation: HIDDEN_POSES[hiddenSide],

        behind: true,

        visible: false,

      };

    }



    if (previousRole === "hidden") {

      const hiddenSide = nextRole === "left" ? "left" : "right";



      if (reduceMotion) {

        return {

          animation: POSES[nextRole],

          behind: false,

          visible: true,

        };

      }



      return {

        animation: {

          x: [HIDDEN_POSES[hiddenSide].x, POSES[nextRole].x],

          y: [HIDDEN_POSES[hiddenSide].y, POSES[nextRole].y],

          scale: [HIDDEN_POSES[hiddenSide].scale, POSES[nextRole].scale],

          opacity: [0, POSES[nextRole].opacity],

        },

        behind: true,

        visible: true,

      };

    }



    return {

      animation: POSES[nextRole],

      behind: false,

      visible: true,

    };

  };



  if (COLLECTIONS.length === 0) {

    return null;

  }



  return (

    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">

    <div

        className="pointer-events-none absolute inset-0 brightness-[0.85]"

        style={{

          backgroundImage:

            "url('/images/home/digital-collections/background.webp')",

          backgroundRepeat: "repeat",

          backgroundPosition: "center",

          backgroundSize: "600px auto",

        }}

        aria-hidden="true"

      />    



      <div

        className="pointer-events-none absolute inset-0 bg-white/60"

        aria-hidden="true"

      />



      <div className="relative z-10 mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-10">

        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.8fr_auto] lg:items-end">

          <div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400">

              Colecciones

            </p>



            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl lg:text-5xl">

              Colecciones Digitales

            </h2>

          </div>



          <p className="max-w-md border-l border-black/10 pl-5 text-sm leading-6 text-neutral-500">

            Diseños contemporáneos con tecnología digital de alta definición para

            espacios únicos.

          </p>



          <Link

            href="/productos/laminados"

            className="group inline-flex items-center gap-3 text-sm font-semibold text-black"

          >

            Ver todas las colecciones



            <span className="transition-transform duration-300 group-hover:translate-x-1">

              →

            </span>

          </Link>

        </div>



        <motion.div

          drag={COLLECTIONS.length > 1 ? "x" : false}

          dragConstraints={{ left: 0, right: 0 }}

          dragElastic={0.08}

          onDragEnd={(_, info) => {

            if (COLLECTIONS.length <= 1) {

              return;

            }



            if (info.offset.x < -55) {

              goNext();

            }



            if (info.offset.x > 55) {

              goPrevious();

            }

          }}

          style={{ touchAction: "pan-y" }}

          className="relative h-[330px] cursor-grab active:cursor-grabbing sm:h-[410px] lg:h-[500px]"

        >

          {COLLECTIONS.map((collection, index) => {

            const role = getRole(index, activeIndex);

            const isActive = role === "center";

            const { animation, behind, visible } = getCardAnimation(index);



            return (

              <motion.article

                key={collection.id}

                initial={false}

                animate={animation}

                transition={

                  reduceMotion

                    ? { duration: 0 }

                    : behind

                      ? {

                          duration: 0.68,

                          times:

                            Array.isArray(animation.x) && animation.x.length === 4

                              ? [0, 0.3, 0.72, 1]

                              : undefined,

                          ease: [0.22, 1, 0.36, 1],

                        }

                      : {

                          type: "spring",

                          stiffness: 145,

                          damping: 22,

                          mass: 0.9,

                        }

                }

                style={{

                  zIndex: isActive ? 30 : visible ? 20 : 0,

                  pointerEvents: visible ? "auto" : "none",

                }}

                onClick={() => {

                  if (!visible) {

                    return;

                  }

                  if (isActive) {

                    router.push(collection.href);

                    return;

                  }

                  goTo(index);

                }}

                aria-hidden={!visible}

                aria-label={visible ? `Colección ${collection.title}` : undefined}

                className={`absolute left-1/2 top-1/2 h-[255px] w-[82%] overflow-hidden rounded-[26px] bg-neutral-900 shadow-[0_24px_60px_rgba(0,0,0,0.14)] sm:h-[325px] sm:w-[68%] sm:rounded-[32px] lg:h-[390px] lg:w-[52%] lg:rounded-[38px] ${

                  visible ? "cursor-pointer" : ""

                }`}

              >

                <Image

                  src={collection.image}

                  alt={collection.title}

                  fill

                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 68vw, 52vw"

                  className="object-cover"

                />



                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />



                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:p-8 lg:p-10">

                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/70 sm:text-[10px]">

                    Colección

                  </p>



                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">

                    {collection.title}

                  </h3>



                  <p

                    className={`mt-3 max-w-[250px] text-sm leading-5 text-white/80 transition-opacity ${

                      isActive ? "opacity-100" : "opacity-80"

                    }`}

                  >

                    {collection.description}

                  </p>



                  {isActive ? (

                    <Link

                      href={collection.href}

                      onClick={(event) => event.stopPropagation()}

                      className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 sm:h-14 sm:w-14"

                      aria-label={`Ver colección ${collection.title}`}

                    >

                      <ArrowIcon />

                    </Link>

                  ) : (

                    <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white">

                      <ArrowIcon />

                    </div>

                  )}

                </div>

              </motion.article>

            );

          })}



          {COLLECTIONS.length > 1 ? (

            <>

              <button

                type="button"

                onClick={goPrevious}

                className="absolute left-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:scale-105 sm:h-12 sm:w-12 lg:-left-3"

                aria-label="Colección anterior"

              >

                <ArrowIcon direction="left" />

              </button>



              <button

                type="button"

                onClick={goNext}

                className="absolute right-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:scale-105 sm:h-12 sm:w-12 lg:-right-3"

                aria-label="Colección siguiente"

              >

                <ArrowIcon />

              </button>

            </>

          ) : null}

        </motion.div>



        <div className="mt-2 flex justify-center gap-2">

          {COLLECTIONS.map((collection, index) => (

            <button

              key={collection.id}

              type="button"

              onClick={() => goTo(index)}

              aria-label={`Ir a ${collection.title}`}

              className={`h-2 rounded-full transition-all duration-300 ${

                activeIndex === index

                  ? "w-7 bg-black"

                  : "w-2 bg-black/15 hover:bg-black/30"

              }`}

            />

          ))}

        </div>

      </div>

    </section>

  );

}
