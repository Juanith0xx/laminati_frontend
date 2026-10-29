"use client";

import Link from "next/link";

export default function CollectionComingSoon({
  brand = "Karikal",
  logo = "/images/brands/karikal-logo.png",
  title = "Colección en preparación",
  description = "Estamos preparando nuestra selección de superficies Karikal para incorporarla próximamente al catálogo.",
  productsHref = "/colecciones",
  contactHref = "/contacto",
}) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="relative min-h-[680px] overflow-hidden rounded-[32px] border border-neutral-200 bg-[#f7f6f2]">

        {/* Decoración ambiental */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-black/[0.03] blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-black/[0.04] blur-3xl" />
        </div>

        {/* Paneles decorativos izquierda */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 hidden h-[72%] w-[220px] lg:block"
        >
          <div className="absolute bottom-0 left-0 h-[62%] w-[150px] bg-[#d9d2c6] shadow-2xl" />
          <div className="absolute bottom-0 left-[85px] h-[50%] w-[135px] bg-[#3f403d] shadow-2xl" />
          <div className="absolute bottom-[43%] left-0 h-[26%] w-[175px] bg-[#ece9e2] shadow-xl" />
        </div>

        {/* Paneles decorativos derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[82%] w-[220px] lg:block"
        >
          <div className="absolute bottom-0 right-0 h-[51%] w-[110px] bg-[#e7e2d8] shadow-2xl" />
          <div className="absolute bottom-[4%] right-[80px] h-[59%] w-[115px] bg-[#8b8984] shadow-2xl" />
          <div className="absolute bottom-[42%] right-0 h-[48%] w-[95px] bg-[#9a7657] shadow-xl" />
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex min-h-[680px] flex-col items-center justify-center px-6 py-20 text-center sm:px-10">

          <img
            src={logo}
            alt={`${brand} - Soluciones en Superficies`}
            className="mb-10 h-auto w-[175px] object-contain sm:w-[215px]"
            loading="eager"
          />

          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
            Próximamente
          </p>

          <h1 className="max-w-3xl text-4xl font-light uppercase leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex w-full max-w-[560px] flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link
              href={productsHref}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 whitespace-nowrap rounded-full bg-black px-8 text-sm font-semibold !text-white shadow-sm transition hover:bg-neutral-800 sm:min-w-[240px] sm:flex-1"
              style={{ color: "#ffffff" }}
            >
              <span>Ver otros productos</span>
              <span aria-hidden="true">
                →
              </span>
            </Link>

            <Link
              href={contactHref}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-8 text-sm font-semibold !text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 sm:min-w-[200px] sm:flex-1"
              style={{ color: "#171717" }}
            >
              <span>Contactar</span>
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>

          <div className="mt-12 h-px w-16 bg-neutral-300" />

          <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400">
            Próximamente disponible en Laminati
          </p>
        </div>
      </div>
    </section>
  );
}
