"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  archiveAdminProject,
  deleteAdminProjectPermanently,
  listAdminProjects,
} from "@/services/adminProjects.service";


const STATUS_OPTIONS = [
  [
    "",
    "Todos los estados",
  ],
  [
    "DRAFT",
    "Borradores",
  ],
  [
    "PUBLISHED",
    "Publicados",
  ],
  [
    "ARCHIVED",
    "Archivados",
  ],
];


function StatusBadge({
  status,
}) {
  const normalized =
    String(
      status ||
      "DRAFT"
    ).toUpperCase();

  const styles =
    normalized ===
    "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : normalized ===
        "ARCHIVED"
        ? "bg-neutral-100 text-neutral-500 ring-neutral-200"
        : "bg-amber-50 text-amber-700 ring-amber-100";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ring-1 ring-inset ${styles}`}
    >
      {normalized ===
      "PUBLISHED"
        ? "Publicado"
        : normalized ===
          "ARCHIVED"
          ? "Archivado"
          : "Borrador"}
    </span>
  );
}


export default function AdminProjectsPage() {
  const [
    projects,
    setProjects,
  ] = useState([]);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    archiveTarget,
    setArchiveTarget,
  ] = useState(null);


  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);


  const loadProjects =
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await listAdminProjects({
            search:
              search.trim() ||
              undefined,
            status:
              status ||
              undefined,
            category:
              category ||
              undefined,
            limit: 100,
          });

        setProjects(
          response.projects ||
          []
        );

        setTotal(
          Number(
            response.total ||
            0
          )
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible cargar los proyectos"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(
    () => {
      const timer =
        setTimeout(
          loadProjects,
          250
        );

      return () =>
        clearTimeout(
          timer
        );
    },
    [
      search,
      status,
      category,
    ]
  );


  const categories =
    useMemo(
      () =>
        [...new Set(
          projects
            .map(
              (
                project
              ) =>
                project.category
            )
            .filter(
              Boolean
            )
        )].sort(),
      [
        projects,
      ]
    );


  const confirmArchive =
    async () => {
      if (
        !archiveTarget
      ) {
        return;
      }

      try {
        await archiveAdminProject(
          archiveTarget.id
        );

        setArchiveTarget(
          null
        );

        await loadProjects();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible archivar el proyecto"
        );
      }
    };


  const confirmDelete =
    async () => {
      if (
        !deleteTarget
      ) {
        return;
      }

      try {
        await deleteAdminProjectPermanently(
          deleteTarget.id
        );

        setDeleteTarget(
          null
        );

        await loadProjects();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible eliminar el proyecto"
        );
      }
    };


  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-400">
            Contenido
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-black sm:text-4xl">
            Proyectos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Administra la vitrina de proyectos, fotografías, materiales utilizados y publicación pública.
          </p>
        </div>

        <Link
          href="/admin/proyectos/nuevo"
          className="inline-flex w-fit items-center rounded-full bg-black px-5 py-3 text-sm font-semibold !text-white shadow-sm transition hover:bg-neutral-800"
        >
          + Nuevo proyecto
        </Link>
      </div>

      <div className="mt-7 grid gap-3 rounded-[22px] border border-neutral-200 bg-white p-4 shadow-sm md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <input
          value={
            search
          }
          onChange={(
            event
          ) =>
            setSearch(
              event.target.value
            )
          }
          className="h-11 rounded-xl border border-neutral-200 px-4 text-sm outline-none transition focus:border-black"
          placeholder="Buscar por nombre, slug o ubicación..."
        />

        <select
          value={
            status
          }
          onChange={(
            event
          ) =>
            setStatus(
              event.target.value
            )
          }
          className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-black"
        >
          {STATUS_OPTIONS.map(
            ([
              value,
              label,
            ]) => (
              <option
                key={
                  value ||
                  "all"
                }
                value={
                  value
                }
              >
                {label}
              </option>
            )
          )}
        </select>

        <select
          value={
            category
          }
          onChange={(
            event
          ) =>
            setCategory(
              event.target.value
            )
          }
          className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-black"
        >
          <option value="">
            Todas las categorías
          </option>

          {categories.map(
            (
              item
            ) => (
              <option
                key={
                  item
                }
                value={
                  item
                }
              >
                {item}
              </option>
            )
          )}
        </select>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-400">
          {total} {total === 1 ? "proyecto" : "proyectos"}
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-[22px] border border-neutral-200 bg-white px-6 py-16 text-center text-sm text-neutral-400">
          Cargando proyectos...
        </div>
      ) : projects.length ===
        0 ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-black">
            No hay proyectos para mostrar
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Crea el primero o cambia los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {projects.map(
            (
              project
            ) => (
              <article
                key={
                  project.id
                }
                className="group overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm"
              >
                <div className="grid min-h-[220px] sm:grid-cols-[220px_1fr]">
                  <div className="relative min-h-[210px] bg-neutral-100">
                    {project.cover_image_url ? (
                      <img
                        src={
                          project.cover_image_url
                        }
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-400">
                        Sin portada
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={
                          project.status
                        }
                      />

                      {project.is_featured ? (
                        <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] !text-white">
                          Destacado
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-xl font-semibold tracking-[-0.035em] text-black">
                      {project.title}
                    </h2>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      {project.category}
                      {project.location
                        ? ` · ${project.location}`
                        : ""}
                      {project.project_year
                        ? ` · ${project.project_year}`
                        : ""}
                    </p>

                    {project.short_description ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                        {project.short_description}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                        {project.images_count || 0} imágenes · {project.products_count || 0} productos
                      </p>

                      <div className="flex gap-2">
                        <Link
                          href={`/admin/proyectos/${project.id}/editar`}
                          className="
                            group/edit
                            inline-flex
                            h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-full
                            bg-[#181818]
                            pl-4
                            pr-2.5
                            text-xs
                            font-semibold
                            !text-white
                            shadow-[0_6px_18px_rgba(0,0,0,0.10)]
                            transition-all
                            duration-200
                            hover:-translate-y-0.5
                            hover:bg-[#2a2a2a]
                            hover:shadow-[0_9px_22px_rgba(0,0,0,0.15)]
                          "
                          style={{
                            color: "#ffffff",
                            textDecoration: "none",
                          }}
                        >
                          <span>
                            Editar
                          </span>

                          <span
                            className="
                              flex
                              h-6
                              w-6
                              items-center
                              justify-center
                              rounded-full
                              bg-white/10
                              !text-white
                              transition-all
                              duration-200
                              group-hover/edit:bg-white
                              group-hover/edit:!text-black
                            "
                            style={{
                              color: "#ffffff",
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path
                                d="M5 12h14M13 6l6 6-6 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </Link>

                        {project.status !==
                        "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setArchiveTarget(
                                project
                              )
                            }
                            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:border-red-200 hover:text-red-600"
                          >
                            Archivar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-red-500">
              Acción irreversible
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">
              Eliminar proyecto
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Vas a eliminar permanentemente{" "}
              <strong className="font-semibold text-black">
                {deleteTarget.title}
              </strong>
              . También se eliminarán su galería y las relaciones con productos.
              Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-black"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmDelete
                }
                className="h-11 rounded-full bg-red-600 px-5 text-sm font-semibold !text-white transition hover:bg-red-700"
                style={{
                  color:
                    "#ffffff",
                }}
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {archiveTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Archivar proyecto
            </p>

            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-black">
              {archiveTarget.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              El proyecto dejará de estar disponible públicamente y quedará marcado como archivado.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setArchiveTarget(
                    null
                  )
                }
                className="rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmArchive
                }
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold !text-white"
              >
                Archivar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
