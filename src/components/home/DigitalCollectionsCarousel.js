"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  return total === 0
    ? 0
    : ((index % total) + total) % total;
}

function getRole(index, activeIndex) {
  if (index === activeIndex) return "center";
  if (index === normalizeIndex(activeIndex - 1)) return "left";
  if (index === normalizeIndex(activeIndex + 1)) return "right";
  return "hidden";
}

const ROLE_STYLE = {
  left: {
    transform: "translate(-122%, -47%) scale(.78)",
    opacity: 0.9,
    zIndex: 20,
  },
  center: {
    transform: "translate(-50%, -50%) scale(1)",
    opacity: 1,
    zIndex: 30,
  },
  right: {
    transform: "translate(22%, -47%) scale(.78)",
    opacity: 0.9,
    zIndex: 20,
  },
};

function CardContent({ collection, active }) {
  return (
    <>
      <Image
        src={collection.image}
        alt={collection.title}
        fill
        sizes="(max-width: 640px) 82vw, (max-width: 1024px) 68vw, 52vw"
        loading="lazy"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 text-left text-white sm:p-8 lg:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
          Colección
        </p>

        <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
          {collection.title}
        </h3>

        <p className="mt-3 max-w-[250px] text-sm leading-5 text-white">
          {collection.description}
        </p>

        <span
          className={`mt-6 flex items-center justify-center rounded-full transition-transform duration-300 ${
            active
              ? "h-12 w-12 bg-white text-black sm:h-14 sm:w-14"
              : "h-10 w-10 border border-white text-white"
          }`}
          aria-hidden="true"
        >
          <ArrowIcon />
        </span>
      </div>
    </>
  );
}

export default function DigitalCollectionsCarousel() {
  const [activeIndex, setActiveIndex] = useState(
    COLLECTIONS.length > 1 ? 1 : 0
  );

  const goNext = () => {
    setActiveIndex((current) =>
      normalizeIndex(current + 1)
    );
  };

  const goPrevious = () => {
    setActiveIndex((current) =>
      normalizeIndex(current - 1)
    );
  };

  if (COLLECTIONS.length === 0) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "760px",
      }}
    >
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-700">
              Colecciones
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl lg:text-5xl">
              Colecciones Digitales
            </h2>
          </div>

          <p className="max-w-md border-l border-black/15 pl-5 text-sm leading-6 text-neutral-700">
            Diseños contemporáneos con tecnología digital de alta definición para espacios únicos.
          </p>

          <Link
            href="/productos/laminados"
            prefetch={false}
            className="group inline-flex items-center gap-3 text-sm font-semibold text-black underline decoration-transparent underline-offset-4 transition hover:decoration-black focus-visible:decoration-black"
          >
            Ver todas las colecciones
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        <div className="relative h-[330px] sm:h-[410px] lg:h-[500px]">
          {COLLECTIONS.map((collection, index) => {
            const role = getRole(index, activeIndex);

            if (role === "hidden") {
              return null;
            }

            const commonClass =
              "absolute left-1/2 top-1/2 h-[255px] w-[82%] overflow-hidden rounded-[26px] bg-neutral-900 shadow-[0_24px_60px_rgba(0,0,0,0.14)] transition-[transform,opacity] duration-500 ease-out sm:h-[325px] sm:w-[68%] sm:rounded-[32px] lg:h-[390px] lg:w-[52%] lg:rounded-[38px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/30";

            if (role === "center") {
              return (
                <Link
                  key={collection.id}
                  href={collection.href}
                  prefetch={false}
                  aria-label={`Ver colección ${collection.title}`}
                  className={commonClass}
                  style={ROLE_STYLE.center}
                >
                  <CardContent
                    collection={collection}
                    active
                  />
                </Link>
              );
            }

            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Mostrar colección ${collection.title}`}
                className={`${commonClass} cursor-pointer border-0 p-0 text-left`}
                style={ROLE_STYLE[role]}
              >
                <CardContent
                  collection={collection}
                  active={false}
                />
              </button>
            );
          })}

          {COLLECTIONS.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/25 sm:h-12 sm:w-12 lg:-left-3"
                aria-label="Colección anterior"
              >
                <ArrowIcon direction="left" />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute right-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/25 sm:h-12 sm:w-12 lg:-right-3"
                aria-label="Colección siguiente"
              >
                <ArrowIcon />
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-2 flex justify-center gap-2" aria-label="Seleccionar colección">
          {COLLECTIONS.map((collection, index) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ir a ${collection.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                activeIndex === index
                  ? "w-7 bg-black"
                  : "w-2 bg-black/25 hover:bg-black/45"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
