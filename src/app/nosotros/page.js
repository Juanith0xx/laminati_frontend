import Link from "next/link";


export const metadata = {
  title:
    "Nosotros | Laminati",
  description:
    "Conoce Laminati: especialistas en laminados decorativos, HPL y soluciones para arquitectura, mobiliario e interiorismo.",
  alternates: {
    canonical:
      "/nosotros",
  },
};


/* =========================================
   DATA
========================================= */

const values = [
  {
    number:
      "01",
    title:
      "Materiales con propósito",
    text:
      "Seleccionamos superficies que combinan diseño, desempeño y versatilidad para responder a proyectos residenciales, comerciales y profesionales.",
  },
  {
    number:
      "02",
    title:
      "Asesoría cercana",
    text:
      "Buscamos que cada elección sea más simple, acompañando la selección de colores, acabados, formatos y soluciones según las necesidades del proyecto.",
  },
  {
    number:
      "03",
    title:
      "Diseño que perdura",
    text:
      "Trabajamos con materiales pensados para transformar espacios y entregar una solución estética y funcional en cada aplicación.",
  },
];


const applications = [
  "Mobiliario",
  "Cocinas",
  "Interiorismo",
  "Retail",
  "Arquitectura",
  "Proyectos especiales",
];


/* =========================================
   VISUAL
========================================= */

function MaterialComposition() {
  return (
    <div
      className="
        relative
        mx-auto
        aspect-[4/5]
        w-full
        max-w-[560px]
      "
    >
      <div
        className="
          absolute
          left-[6%]
          top-[4%]

          h-[72%]
          w-[62%]

          rotate-[-7deg]

          rounded-[2rem]

          bg-[linear-gradient(135deg,#d4c4ac_0%,#9f8567_46%,#594332_100%)]

          shadow-[0_40px_90px_rgba(0,0,0,0.22)]
        "
      >
        <div
          className="
            absolute
            inset-0

            rounded-[inherit]

            bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.34),transparent_38%)]
          "
        />

        <div
          className="
            absolute
            bottom-6
            left-6

            text-[10px]
            font-semibold

            uppercase

            tracking-[0.25em]

            text-white/70
          "
        >
          Superficies
        </div>
      </div>

      <div
        className="
          absolute
          right-[4%]
          top-[18%]

          h-[68%]
          w-[58%]

          rotate-[8deg]

          overflow-hidden

          rounded-[2rem]

          bg-[linear-gradient(145deg,#d8d9d4_0%,#9b9e97_44%,#484c46_100%)]

          shadow-[0_36px_80px_rgba(0,0,0,0.25)]
        "
      >
        <div
          className="
            absolute
            -right-[22%]
            top-[14%]

            h-[70%]
            w-[72%]

            rounded-full

            bg-white/10

            blur-2xl
          "
        />

        <div
          className="
            absolute
            bottom-6
            right-6

            text-[10px]
            font-semibold

            uppercase

            tracking-[0.25em]

            text-white/70
          "
        >
          Diseño
        </div>
      </div>

      <div
        className="
          absolute
          bottom-[3%]
          left-[17%]

          h-[34%]
          w-[68%]

          rotate-[-2deg]

          rounded-[1.75rem]

          bg-[linear-gradient(120deg,#171717_0%,#393939_42%,#111111_100%)]

          shadow-[0_34px_80px_rgba(0,0,0,0.32)]
        "
      >
        <div
          className="
            absolute
            inset-x-6
            top-6

            h-px

            bg-white/10
          "
        />

        <div
          className="
            absolute
            bottom-6
            left-6
          "
        >
          <p
            className="
              text-[10px]
              font-semibold

              uppercase

              tracking-[0.24em]

              text-white/45
            "
          >
            Laminati
          </p>

          <p
            className="
              mt-2

              max-w-[230px]

              text-lg
              font-medium

              leading-tight

              tracking-[-0.03em]

              text-white
            "
          >
            Materiales para crear espacios con identidad.
          </p>
        </div>
      </div>
    </div>
  );
}


/* =========================================
   PAGE
========================================= */

export default function NosotrosPage() {
  return (
    <main className="bg-[#f5f3ef] text-[#161616]">

      {/* =====================================
          HERO
      ====================================== */}
      <section
        className="
          overflow-hidden

          border-b
          border-black/[0.08]

          bg-[#f5f3ef]

          py-16
          sm:py-20
          lg:py-28
        "
      >
        <div
          className="
            site-container

            grid
            items-center
            gap-14

            lg:grid-cols-[1.05fr_0.95fr]
            lg:gap-20
          "
        >

          <div className="max-w-3xl">

            <p
              className="
                mb-6

                text-xs
                font-semibold

                uppercase

                tracking-[0.28em]

                text-black/45
              "
            >
              Nosotros
            </p>

            <h1
              className="
                max-w-4xl

                text-[clamp(3.1rem,7vw,7rem)]
                font-medium

                leading-[0.91]

                tracking-[-0.065em]
              "
            >
              Materiales que transforman espacios.
            </h1>

            <p
              className="
                mt-8

                max-w-2xl

                text-base

                leading-7

                text-black/60

                sm:text-lg
                sm:leading-8
              "
            >
              En Laminati conectamos diseño, materialidad
              y funcionalidad para ofrecer soluciones en
              laminados decorativos, HPL y superficies
              destinadas a arquitectura, mobiliario e
              interiorismo.
            </p>

            <div
              className="
                mt-9

                flex
                flex-wrap

                gap-3
              "
            >
              <Link
                href="/productos"
                className="
                  inline-flex
                  h-12

                  items-center
                  justify-center

                  rounded-full

                  bg-black

                  px-6

                  text-sm
                  font-medium

                  text-white

                  transition

                  hover:
                  bg-black/80
                "
              >
                Explorar productos
              </Link>

              <Link
                href="/contacto"
                className="
                  inline-flex
                  h-12

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-black/15

                  bg-white/45

                  px-6

                  text-sm
                  font-medium

                  text-black

                  transition

                  hover:
                  bg-white
                "
              >
                Contactarnos
              </Link>
            </div>

          </div>

          <MaterialComposition />

        </div>
      </section>


      {/* =====================================
          QUIÉNES SOMOS
      ====================================== */}
      <section className="py-20 sm:py-24 lg:py-32">

        <div
          className="
            site-container

            grid
            gap-12

            lg:grid-cols-[0.7fr_1.3fr]
            lg:gap-20
          "
        >

          <div>
            <p
              className="
                text-xs
                font-semibold

                uppercase

                tracking-[0.25em]

                text-black/40
              "
            >
              Quiénes somos
            </p>
          </div>

          <div>
            <h2
              className="
                max-w-4xl

                text-3xl
                font-medium

                leading-[1.06]

                tracking-[-0.045em]

                sm:text-4xl
                lg:text-5xl
              "
            >
              Una propuesta enfocada en materiales
              de diseño y soluciones para proyectos
              que buscan algo distinto.
            </h2>

            <div
              className="
                mt-9

                grid
                gap-7

                text-[15px]
                leading-7

                text-black/58

                md:grid-cols-2
              "
            >
              <p>
                Trabajamos con una mirada especializada
                en superficies decorativas, poniendo a
                disposición alternativas para proyectos
                que necesitan combinar estética,
                resistencia y una correcta especificación
                de material.
              </p>

              <p>
                Nuestra propuesta busca acercar al mercado
                chileno colecciones contemporáneas,
                distintas terminaciones y soluciones
                técnicas que permitan desarrollar espacios
                con identidad propia.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* =====================================
          MARCAS
      ====================================== */}
      <section
        className="
          border-y
          border-black/[0.07]

          bg-white/55

          py-16
          sm:py-20
        "
      >
        <div className="site-container">

          <div
            className="
              grid
              gap-10

              lg:grid-cols-[0.8fr_1.2fr]
              lg:items-end
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-semibold

                  uppercase

                  tracking-[0.25em]

                  text-black/40
                "
              >
                Marcas
              </p>

              <h2
                className="
                  mt-4

                  max-w-xl

                  text-3xl
                  font-medium

                  tracking-[-0.04em]

                  sm:text-4xl
                "
              >
                Diseño internacional,
                selección local.
              </h2>
            </div>

            <p
              className="
                max-w-2xl

                text-[15px]
                leading-7

                text-black/56
              "
            >
              Laminati trabaja con Abet Laminati y
              soluciones provenientes de Karikal
              Argentina, ampliando las posibilidades
              para proyectos de diseño, arquitectura
              y fabricación de mobiliario.
            </p>
          </div>

          <div
            className="
              mt-12

              grid
              gap-4

              md:grid-cols-2
            "
          >

            <div
              className="
                group

                relative

                min-h-[260px]

                overflow-hidden

                rounded-[2rem]

                bg-[#151515]

                p-8

                text-white

                sm:p-10
              "
            >
              <div
                className="
                  absolute
                  -right-20
                  -top-20

                  h-64
                  w-64

                  rounded-full

                  bg-white/[0.06]

                  blur-3xl

                  transition-transform
                  duration-700

                  group-hover:
                  scale-125
                "
              />

              <p
                className="
                  relative
                  z-10

                  text-[10px]
                  font-semibold

                  uppercase

                  tracking-[0.25em]

                  text-white/45
                "
              >
                Italia
              </p>

              <h3
                className="
                  relative
                  z-10

                  mt-5

                  text-3xl
                  font-medium

                  tracking-[-0.045em]
                "
              >
                Abet Laminati
              </h3>

              <p
                className="
                  relative
                  z-10

                  mt-5

                  max-w-md

                  text-sm
                  leading-6

                  text-white/58
                "
              >
                Laminados decorativos y soluciones HPL
                para proyectos que buscan diseño,
                materialidad y variedad de acabados.
              </p>
            </div>


            <div
              className="
                group

                relative

                min-h-[260px]

                overflow-hidden

                rounded-[2rem]

                bg-[#ded7cb]

                p-8

                sm:p-10
              "
            >
              <div
                className="
                  absolute
                  bottom-[-35%]
                  right-[-6%]

                  h-72
                  w-44

                  rotate-[16deg]

                  rounded-[2rem]

                  bg-[linear-gradient(145deg,#8e7359,#d1b998)]

                  shadow-[0_20px_50px_rgba(0,0,0,0.16)]

                  transition-transform
                  duration-700

                  group-hover:
                  -translate-y-4
                "
              />

              <p
                className="
                  relative
                  z-10

                  text-[10px]
                  font-semibold

                  uppercase

                  tracking-[0.25em]

                  text-black/40
                "
              >
                Argentina
              </p>

              <h3
                className="
                  relative
                  z-10

                  mt-5

                  text-3xl
                  font-medium

                  tracking-[-0.045em]
                "
              >
                Karikal
              </h3>

              <p
                className="
                  relative
                  z-10

                  mt-5

                  max-w-sm

                  text-sm
                  leading-6

                  text-black/55
                "
              >
                Alternativas complementarias para ampliar
                la selección de terminaciones y soluciones
                disponibles para cada proyecto.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* =====================================
          VALORES
      ====================================== */}
      <section className="py-20 sm:py-24 lg:py-32">

        <div className="site-container">

          <div
            className="
              mb-12

              max-w-3xl

              sm:mb-16
            "
          >
            <p
              className="
                text-xs
                font-semibold

                uppercase

                tracking-[0.25em]

                text-black/40
              "
            >
              Nuestra forma de trabajar
            </p>

            <h2
              className="
                mt-4

                text-3xl
                font-medium

                tracking-[-0.045em]

                sm:text-4xl
                lg:text-5xl
              "
            >
              Más que vender una superficie,
              buscamos aportar a cada proyecto.
            </h2>
          </div>

          <div
            className="
              grid

              border-t
              border-black/10

              md:grid-cols-3
            "
          >
            {values.map(
              (
                item
              ) => (
                <article
                  key={
                    item.number
                  }
                  className="
                    border-b
                    border-black/10

                    py-9

                    md:border-b-0
                    md:border-r
                    md:px-8
                    md:py-10

                    md:first:
                    pl-0

                    md:last:
                    border-r-0

                    md:last:
                    pr-0
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-semibold

                      tracking-[0.22em]

                      text-black/35
                    "
                  >
                    {
                      item.number
                    }
                  </p>

                  <h3
                    className="
                      mt-7

                      text-xl
                      font-medium

                      tracking-[-0.03em]
                    "
                  >
                    {
                      item.title
                    }
                  </h3>

                  <p
                    className="
                      mt-4

                      text-sm
                      leading-6

                      text-black/55
                    "
                  >
                    {
                      item.text
                    }
                  </p>
                </article>
              )
            )}
          </div>

        </div>
      </section>


      {/* =====================================
          APLICACIONES
      ====================================== */}
      <section
        className="
          bg-[#111111]

          py-20

          text-white

          sm:py-24
          lg:py-28
        "
      >
        <div
          className="
            site-container

            grid
            gap-12

            lg:grid-cols-[0.8fr_1.2fr]
            lg:items-start
          "
        >

          <div>
            <p
              className="
                text-xs
                font-semibold

                uppercase

                tracking-[0.25em]

                text-white/35
              "
            >
              Aplicaciones
            </p>

            <h2
              className="
                mt-5

                max-w-lg

                text-3xl
                font-medium

                leading-[1.05]

                tracking-[-0.045em]

                sm:text-4xl
                lg:text-5xl
              "
            >
              Soluciones pensadas
              para distintos tipos
              de espacios.
            </h2>
          </div>

          <div
            className="
              grid

              border-t
              border-white/10

              sm:grid-cols-2
            "
          >
            {applications.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item
                  }
                  className="
                    flex
                    min-h-[108px]

                    items-center
                    justify-between

                    border-b
                    border-white/10

                    py-5

                    sm:px-6

                    sm:odd:
                    border-r
                  "
                >
                  <span
                    className="
                      text-base
                      font-medium

                      tracking-[-0.02em]
                    "
                  >
                    {
                      item
                    }
                  </span>

                  <span
                    className="
                      text-[10px]
                      tracking-[0.2em]

                      text-white/30
                    "
                  >
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>
                </div>
              )
            )}
          </div>

        </div>
      </section>


      {/* =====================================
          CTA
      ====================================== */}
      <section className="py-20 sm:py-24 lg:py-32">

        <div className="site-container">

          <div
            className="
              relative

              overflow-hidden

              rounded-[2.25rem]

              bg-[#ded8cc]

              px-6
              py-14

              sm:px-10
              sm:py-16

              lg:px-16
              lg:py-20
            "
          >
            <div
              className="
                absolute
                -right-[7%]
                -top-[38%]

                h-[420px]
                w-[260px]

                rotate-[19deg]

                rounded-[2rem]

                bg-[linear-gradient(145deg,#b69d7c,#765d46)]

                opacity-70

                shadow-[0_30px_80px_rgba(0,0,0,0.18)]
              "
            />

            <div
              className="
                relative
                z-10

                max-w-3xl
              "
            >
              <p
                className="
                  text-xs
                  font-semibold

                  uppercase

                  tracking-[0.25em]

                  text-black/40
                "
              >
                Hablemos de tu proyecto
              </p>

              <h2
                className="
                  mt-5

                  text-3xl
                  font-medium

                  leading-[1.04]

                  tracking-[-0.05em]

                  sm:text-4xl
                  lg:text-5xl
                "
              >
                Encuentra el material adecuado
                para llevar tu idea a la realidad.
              </h2>

              <div
                className="
                  mt-8

                  flex
                  flex-wrap

                  gap-3
                "
              >
                <Link
                  href="/contacto"
                  className="
                    inline-flex
                    h-12

                    items-center
                    justify-center

                    rounded-full

                    bg-black

                    px-6

                    text-sm
                    font-medium

                    text-white

                    transition

                    hover:
                    bg-black/80
                  "
                >
                  Contactar a Laminati
                </Link>

                <Link
                  href="/colecciones"
                  className="
                    inline-flex
                    h-12

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-black/15

                    bg-white/50

                    px-6

                    text-sm
                    font-medium

                    text-black

                    transition

                    hover:
                    bg-white
                  "
                >
                  Ver colecciones
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
