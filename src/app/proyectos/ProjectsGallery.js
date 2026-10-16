"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  getPublicProjects,
} from "@/services/publicProjects.service";


const FALLBACK_CATEGORIES = [
  "Todos",
  "Interiores",
  "Mobiliario",
  "Fachadas",
  "Laboratorio",
  "Retail",
  "Salud",
];


const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2200&q=90";


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ProjectsHero({
  heroImage,
}) {
  return (
    <section
      className="
        overflow-hidden
        border-b
        border-black/[0.06]
        bg-[#f4f1eb]
      "
    >
      <div
        className="
          grid
          min-h-[620px]
          lg:grid-cols-[0.92fr_1.72fr]
        "
      >
        <div
          className="
            flex
            items-center
            px-6
            py-16
            sm:px-10
            lg:px-12
            lg:py-20
            xl:px-[max(5vw,72px)]
          "
        >
          <div className="max-w-xl">
            <p
              className="
                mb-7
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.32em]
                text-black/40
              "
            >
              Proyectos
            </p>

            <h1
              className="
                text-[clamp(3.7rem,6.7vw,7.4rem)]
                font-medium
                leading-[0.86]
                tracking-[-0.07em]
              "
            >
              Proyectos que inspiran espacios.
            </h1>

            <p
              className="
                mt-8
                max-w-lg
                text-base
                leading-7
                text-black/55
                sm:text-lg
                sm:leading-8
              "
            >
              Mostramos aplicaciones reales de nuestras
              superficies en arquitectura, interiorismo,
              retail, salud y mobiliario, donde el diseño
              y la funcionalidad se encuentran.
            </p>

            <div
              className="
                mt-8
                flex
                items-center
                gap-4
              "
            >
              <span
                className="
                  block
                  h-px
                  w-12
                  bg-black/35
                "
              />

              <span
                className="
                  max-w-[240px]
                  text-[10px]
                  font-semibold
                  uppercase
                  leading-5
                  tracking-[0.28em]
                  text-black/45
                "
              >
                Superficies para un mundo real
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            relative
            min-h-[460px]
            overflow-hidden
            lg:min-h-[620px]
          "
        >
          <img
            src={
              heroImage ||
              FALLBACK_HERO_IMAGE
            }
            alt="Proyecto con aplicación de superficies Laminati"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-black/[0.04]
              via-transparent
              to-black/[0.03]
            "
          />

          <div
            className="
              absolute
              bottom-12
              right-8
              hidden
              max-w-[130px]
              lg:block
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                leading-[1.75]
                tracking-[0.28em]
                text-black/55
              "
            >
              Diseño que se vive en espacios reales
            </p>

            <span
              className="
                mt-4
                block
                h-px
                w-8
                bg-black/35
              "
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function ProjectCard({
  project,
}) {
  const image =
    project.cover_image_url ||
    FALLBACK_HERO_IMAGE;

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-[1.4rem]
        bg-[#ebe7df]
        transition-transform
        duration-500
        ease-out
        hover:-translate-y-1
      "
    >
      <Link
        href={`/proyectos/${project.slug}`}
        className="
          block
          !text-inherit
          !no-underline
        "
        style={{
          color: "inherit",
          textDecoration: "none",
        }}
        aria-label={`Ver proyecto ${project.title}`}
      >
        <div
          className="
            relative
            min-h-[520px]
            overflow-hidden
            sm:min-h-[600px]
            lg:min-h-[700px]
          "
        >
          <img
            src={image}
            alt={
              project.title
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              transition-transform
              duration-700
              ease-out
              group-hover:scale-[1.035]
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/25
              via-transparent
              to-black/[0.03]
            "
          />

          <div
            className="
              absolute
              left-5
              top-5
              rounded-full
              border
              border-white/40
              bg-black/25
              px-4
              py-2
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-white
              backdrop-blur-md
            "
          >
            {
              project.category ||
              "Proyecto"
            }
          </div>
        </div>

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            px-5
            py-4
            sm:px-6
          "
        >
          <div className="min-w-0">
            <h2
              className="
                truncate
                text-xl
                font-medium
                tracking-[-0.035em]
              "
            >
              {
                project.title
              }
            </h2>

            <p
              className="
                mt-1
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.23em]
                text-black/40
              "
            >
              {[
                project.location,
                project.project_year,
              ]
                .filter(
                  Boolean
                )
                .join(" · ")}
            </p>
          </div>

          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-black/10
              transition
              group-hover:border-black/25
              group-hover:bg-black
              group-hover:text-white
            "
          >
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </article>
  );
}


function ProjectGrid({
  projects,
}) {
  if (
    projects.length ===
    0
  ) {
    return (
      <div
        className="
          flex
          min-h-[320px]
          items-center
          justify-center
          rounded-[2rem]
          border
          border-dashed
          border-black/[0.10]
          bg-white/35
          text-center
        "
      >
        <div className="max-w-md px-6">
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.22em]
              text-black/35
            "
          >
            Sin proyectos
          </p>

          <h3
            className="
              mt-3
              text-2xl
              font-medium
              tracking-[-0.035em]
            "
          >
            No hay proyectos publicados para esta categoría.
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        grid
        items-start
        gap-4
        md:grid-cols-2
        xl:grid-cols-3
      "
    >
      {projects.map(
        (
          project
        ) => (
          <ProjectCard
            key={
              project.id
            }
            project={
              project
            }
          />
        )
      )}
    </div>
  );
}

function FeaturedProject({
  project,
}) {
  if (!project) {
    return null;
  }

  return (
    <section
      className="
        mt-20
        overflow-hidden
        rounded-[2rem]
        bg-[#ddd5c8]
        lg:mt-28
      "
    >
      <div
        className="
          grid
          lg:grid-cols-[0.75fr_1.45fr]
        "
      >
        <div
          className="
            flex
            items-center
            px-7
            py-12
            sm:px-10
            sm:py-14
            lg:px-12
          "
        >
          <div className="max-w-lg">
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.28em]
                text-black/40
              "
            >
              Proyecto destacado
            </p>

            <h2
              className="
                mt-5
                text-3xl
                font-medium
                leading-[1.05]
                tracking-[-0.045em]
                sm:text-4xl
              "
            >
              {
                project.title
              }
            </h2>

            <p
              className="
                mt-5
                text-sm
                leading-6
                text-black/55
              "
            >
              {
                project.short_description ||
                "Una aplicación donde diseño, materialidad y funcionalidad se integran en una sola experiencia."
              }
            </p>

            <Link
              href={`/proyectos/${project.slug}`}
              className="
                group/cta
                mt-8
                inline-flex
                h-12
                items-center
                justify-center
                gap-3
                rounded-full
                bg-[#181818]
                pl-6
                pr-2.5
                text-sm
                font-medium
                !text-white
                shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-[#2a2a2a]
              "
              style={{
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              <span>
                Ver proyecto
              </span>

              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                  !text-white
                  transition-all
                  group-hover/cta:bg-white
                  group-hover/cta:!text-black
                "
              >
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>

        <div
          className="
            relative
            min-h-[420px]
            lg:min-h-[540px]
          "
        >
          <img
            src={
              project.cover_image_url ||
              FALLBACK_HERO_IMAGE
            }
            alt={
              project.title
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        </div>
      </div>
    </section>
  );
}


export default function ProjectsGallery() {
  const [
    projects,
    setProjects,
  ] =
    useState([]);

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState("Todos");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(
    () => {
      let active =
        true;

      const load =
        async () => {
          setIsLoading(
            true
          );

          setError("");

          try {
            const response =
              await getPublicProjects({
                limit: 100,
              });

            if (!active) {
              return;
            }

            setProjects(
              Array.isArray(
                response?.projects
              )
                ? response.projects
                : []
            );
          } catch (
            loadError
          ) {
            if (!active) {
              return;
            }

            setError(
              loadError?.message ||
              "No fue posible cargar los proyectos."
            );
          } finally {
            if (active) {
              setIsLoading(
                false
              );
            }
          }
        };

      load();

      return () => {
        active =
          false;
      };
    },
    []
  );

  const categories =
    useMemo(
      () => {
        const dynamic =
          projects
            .map(
              (
                project
              ) =>
                project.category
            )
            .filter(
              Boolean
            );

        return [
          "Todos",
          ...new Set([
            ...FALLBACK_CATEGORIES.slice(
              1
            ),
            ...dynamic,
          ]),
        ];
      },
      [
        projects,
      ]
    );

  const filteredProjects =
    useMemo(
      () => {
        if (
          activeCategory ===
          "Todos"
        ) {
          return projects;
        }

        return projects.filter(
          (
            project
          ) =>
            project.category ===
            activeCategory
        );
      },
      [
        projects,
        activeCategory,
      ]
    );

  const featured =
    projects.find(
      (
        project
      ) =>
        project.is_featured
    ) ||
    projects[0] ||
    null;

  return (
    <>
      <ProjectsHero
        heroImage={
          featured
            ?.cover_image_url
        }
      />

      <section
        className="
          py-6
          sm:py-8
          lg:py-10
        "
      >
        <div className="site-container">
          <div
            className="
              mb-6
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                scrollbar-none
                flex
                gap-2
                overflow-x-auto
                pb-1
              "
            >
              {categories.map(
                (
                  category
                ) => {
                  const isActive =
                    activeCategory ===
                    category;

                  return (
                    <button
                      key={
                        category
                      }
                      type="button"
                      onClick={() =>
                        setActiveCategory(
                          category
                        )
                      }
                      className={`
                        shrink-0
                        rounded-full
                        px-5
                        py-2.5
                        text-sm
                        font-medium
                        transition-all
                        ${
                          isActive
                            ? "bg-[#25221f] text-white shadow-sm"
                            : "bg-black/[0.035] text-black/55 hover:bg-black/[0.07] hover:text-black"
                        }
                      `}
                    >
                      {
                        category
                      }
                    </button>
                  );
                }
              )}
            </div>

            <div
              className="
                flex
                items-center
                gap-5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.23em]
                text-black/45
              "
            >
              <span
                className="
                  hidden
                  h-px
                  w-10
                  bg-black/25
                  sm:block
                "
              />

              {
                filteredProjects.length
              }{" "}
              {
                filteredProjects.length ===
                1
                  ? "proyecto"
                  : "proyectos"
              }
            </div>
          </div>

          {error ? (
            <div
              className="
                mb-6
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-5
                py-4
                text-sm
                text-red-700
              "
            >
              {
                error
              }
            </div>
          ) : null}

          {isLoading ? (
            <div
              className="
                grid
                gap-4
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="
                      min-h-[360px]
                      animate-pulse
                      rounded-[1.4rem]
                      bg-black/[0.06]
                    "
                  />
                )
              )}
            </div>
          ) : (
            <ProjectGrid
              projects={
                filteredProjects
              }
            />
          )}

          {!isLoading &&
          !error ? (
            <FeaturedProject
              project={
                featured
              }
            />
          ) : null}
        </div>
      </section>

      <section
        className="
          mt-12
          border-t
          border-black/[0.07]
          py-16
          sm:py-20
        "
      >
        <div
          className="
            site-container
            grid
            gap-10
            lg:grid-cols-[0.85fr_1.15fr]
            lg:items-end
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.28em]
                text-black/35
              "
            >
              Tu próximo proyecto
            </p>

            <h2
              className="
                mt-4
                max-w-xl
                text-3xl
                font-medium
                leading-[1.05]
                tracking-[-0.045em]
                sm:text-4xl
                lg:text-5xl
              "
            >
              También puede formar parte de esta historia.
            </h2>
          </div>

          <div
            className="
              flex
              flex-col
              gap-6
              lg:items-end
            "
          >
            <p
              className="
                max-w-xl
                text-sm
                leading-6
                text-black/55
                lg:text-right
              "
            >
              Cuéntanos tu idea y te ayudamos a encontrar
              superficies y soluciones adecuadas para el
              carácter, uso y exigencia de tu proyecto.
            </p>

            <Link
              href="/contacto"
              className="
                group/cta
                inline-flex
                h-12
                w-fit
                items-center
                justify-center
                gap-3
                rounded-full
                bg-[#181818]
                pl-6
                pr-2.5
                text-sm
                font-medium
                !text-white
                transition-all
                hover:-translate-y-0.5
                hover:bg-[#2a2a2a]
              "
              style={{
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              <span>
                Hablar con Laminati
              </span>

              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                  !text-white
                  transition-all
                  group-hover/cta:bg-white
                  group-hover/cta:!text-black
                "
              >
                <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
