"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  attachAdminProjectProduct,
  createAdminProject,
  deleteAdminProjectImage,
  getAdminProject,
  listAdminProductsForProjects,
  removeAdminProjectProduct,
  setAdminProjectStatus,
  updateAdminProject,
  updateAdminProjectImage,
  uploadAdminProjectImage,
} from "@/services/adminProjects.service";


const CATEGORIES = [
  "Interiores",
  "Mobiliario",
  "Fachadas",
  "Laboratorio",
  "Retail",
  "Salud",
  "Educación",
  "Hospitalidad",
  "Oficinas",
  "Residencial",
];


const EMPTY_FORM = {
  title: "",
  slug: "",
  category: "Interiores",
  location: "",
  project_year:
    new Date().getFullYear(),
  short_description: "",
  description: "",
  is_featured: false,
  is_active: true,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
};


function normalizeProjectToForm(
  project
) {
  return {
    title:
      project?.title ||
      "",
    slug:
      project?.slug ||
      "",
    category:
      project?.category ||
      "Interiores",
    location:
      project?.location ||
      "",
    project_year:
      project?.project_year ||
      new Date().getFullYear(),
    short_description:
      project?.short_description ||
      "",
    description:
      project?.description ||
      "",
    is_featured:
      Boolean(
        project?.is_featured
      ),
    is_active:
      project?.is_active !==
      false,
    sort_order:
      Number(
        project?.sort_order ||
        0
      ),
    meta_title:
      project?.meta_title ||
      "",
    meta_description:
      project?.meta_description ||
      "",
  };
}


function Field({
  label,
  hint,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </span>

      {children}

      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-neutral-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}


function Section({
  eyebrow,
  title,
  description,
  children,
  action,
}) {
  return (
    <section className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-400">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-black">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>

        {action}
      </div>

      <div className="pt-6">
        {children}
      </div>
    </section>
  );
}


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

  const label =
    normalized ===
    "PUBLISHED"
      ? "Publicado"
      : normalized ===
        "ARCHIVED"
        ? "Archivado"
        : "Borrador";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}


function getImageUrl(
  image
) {
  return (
    image?.urls?.card ||
    image?.urls?.detail ||
    image?.image_url ||
    null
  );
}


export default function ProjectEditor({
  mode,
  projectId,
}) {
  const router =
    useRouter();

  const isEdit =
    mode === "edit";

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    project,
    setProject,
  ] = useState(
    null
  );

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    applicationNote,
    setApplicationNote,
  ] = useState("");

  const [
    uploadFile,
    setUploadFile,
  ] = useState(null);

  const [
    uploadAlt,
    setUploadAlt,
  ] = useState("");

  const [
    uploadCaption,
    setUploadCaption,
  ] = useState("");

  const [
    uploadPrimary,
    setUploadPrimary,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(
    isEdit
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  const updateField = (
    field,
    value
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,
        [field]: value,
      })
    );
  };


  const loadProject =
    async () => {
      if (
        !isEdit ||
        !projectId
      ) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          projectResponse,
          productsResponse,
        ] = await Promise.all([
          getAdminProject(
            projectId
          ),
          listAdminProductsForProjects(),
        ]);

        setProject(
          projectResponse.project
        );

        setForm(
          normalizeProjectToForm(
            projectResponse.project
          )
        );

        setProducts(
          Array.isArray(
            productsResponse.products
          )
            ? productsResponse.products
            : []
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible cargar el proyecto"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(
    () => {
      loadProject();
    },
    [
      projectId,
      isEdit,
    ]
  );


  const linkedProductIds =
    useMemo(
      () =>
        new Set(
          (
            project?.products ||
            []
          ).map(
            (
              item
            ) =>
              item.product_id
          )
        ),
      [
        project?.products,
      ]
    );


  const filteredProducts =
    useMemo(
      () => {
        const query =
          productSearch
            .trim()
            .toLowerCase();

        return products
          .filter(
            (
              item
            ) =>
              !linkedProductIds.has(
                item.id
              )
          )
          .filter(
            (
              item
            ) => {
              if (!query) {
                return true;
              }

              return [
                item.name,
                item.sku,
                item.internal_code,
                item.collection,
                item.brand,
              ]
                .filter(Boolean)
                .some(
                  (
                    value
                  ) =>
                    String(
                      value
                    )
                      .toLowerCase()
                      .includes(
                        query
                      )
                );
            }
          )
          .slice(
            0,
            12
          );
      },
      [
        products,
        productSearch,
        linkedProductIds,
      ]
    );


  const buildPayload = () => ({
    title:
      form.title.trim(),
    ...(form.slug.trim()
      ? {
          slug:
            form.slug.trim(),
        }
      : {}),
    category:
      form.category.trim(),
    location:
      form.location.trim() ||
      null,
    project_year:
      form.project_year
        ? Number(
            form.project_year
          )
        : null,
    short_description:
      form.short_description.trim() ||
      null,
    description:
      form.description.trim() ||
      null,
    is_featured:
      Boolean(
        form.is_featured
      ),
    is_active:
      Boolean(
        form.is_active
      ),
    sort_order:
      Number(
        form.sort_order ||
        0
      ),
    meta_title:
      form.meta_title.trim() ||
      null,
    meta_description:
      form.meta_description.trim() ||
      null,
  });


  const handleSave =
    async (
      event
    ) => {
      event.preventDefault();
      setMessage("");
      setError("");

      if (
        !form.title.trim() ||
        !form.category.trim()
      ) {
        setError(
          "Nombre y categoría son obligatorios"
        );
        return;
      }

      setSaving(true);

      try {
        if (
          isEdit
        ) {
          const response =
            await updateAdminProject(
              projectId,
              buildPayload()
            );

          setProject(
            (
              current
            ) => ({
              ...current,
              ...response.project,
            })
          );

          setForm(
            normalizeProjectToForm(
              response.project
            )
          );

          setMessage(
            "Proyecto guardado correctamente"
          );
        } else {
          const response =
            await createAdminProject(
              buildPayload()
            );

          router.replace(
            `/admin/proyectos/${response.project.id}/editar?created=1`
          );
        }
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible guardar el proyecto"
        );
      } finally {
        setSaving(false);
      }
    };


  const handleStatus =
    async (
      status
    ) => {
      if (
        !projectId
      ) {
        return;
      }

      setSaving(true);
      setMessage("");
      setError("");

      try {
        await setAdminProjectStatus(
          projectId,
          {
            status,
            is_active:
              status ===
              "ARCHIVED"
                ? false
                : true,
          }
        );

        await loadProject();

        setMessage(
          status ===
          "PUBLISHED"
            ? "Proyecto publicado"
            : status ===
              "DRAFT"
              ? "Proyecto cambiado a borrador"
              : "Proyecto archivado"
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible cambiar el estado"
        );
      } finally {
        setSaving(false);
      }
    };


  const handleUpload =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !uploadFile ||
        !projectId
      ) {
        setError(
          "Selecciona una imagen"
        );
        return;
      }

      setUploading(true);
      setMessage("");
      setError("");

      try {
        await uploadAdminProjectImage(
          projectId,
          {
            file:
              uploadFile,
            altText:
              uploadAlt,
            caption:
              uploadCaption,
            isPrimary:
              uploadPrimary,
            sortOrder:
              (
                project?.images
                  ?.length ||
                0
              ) + 1,
          }
        );

        setUploadFile(
          null
        );
        setUploadAlt("");
        setUploadCaption("");
        setUploadPrimary(false);

        await loadProject();

        setMessage(
          "Imagen subida correctamente"
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible subir la imagen"
        );
      } finally {
        setUploading(false);
      }
    };


  const handlePrimaryImage =
    async (
      imageId
    ) => {
      try {
        await updateAdminProjectImage(
          projectId,
          imageId,
          {
            is_primary: true,
          }
        );

        await loadProject();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible cambiar la imagen principal"
        );
      }
    };


  const handleDeleteImage =
    async (
      imageId
    ) => {
      if (
        !window.confirm(
          "¿Eliminar esta imagen del proyecto?"
        )
      ) {
        return;
      }

      try {
        await deleteAdminProjectImage(
          projectId,
          imageId
        );

        await loadProject();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible eliminar la imagen"
        );
      }
    };


  const handleAttachProduct =
    async () => {
      if (
        !selectedProductId
      ) {
        return;
      }

      try {
        await attachAdminProjectProduct(
          projectId,
          {
            product_id:
              selectedProductId,
            application_note:
              applicationNote.trim() ||
              null,
            sort_order:
              (
                project?.products
                  ?.length ||
                0
              ) + 1,
          }
        );

        setSelectedProductId("");
        setApplicationNote("");
        setProductSearch("");

        await loadProject();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible asociar el producto"
        );
      }
    };


  const handleRemoveProduct =
    async (
      productIdToRemove
    ) => {
      try {
        await removeAdminProjectProduct(
          projectId,
          productIdToRemove
        );

        await loadProject();
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
          "No fue posible quitar el producto"
        );
      }
    };


  if (
    loading
  ) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-sm text-neutral-500">
        Cargando proyecto...
      </div>
    );
  }


  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/proyectos"
            className="text-xs font-semibold text-neutral-400 transition hover:text-black"
          >
            ← Volver a proyectos
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-black sm:text-4xl">
              {isEdit
                ? project?.title ||
                  "Editar proyecto"
                : "Nuevo proyecto"}
            </h1>

            {isEdit ? (
              <StatusBadge
                status={
                  project?.status
                }
              />
            ) : null}
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            {isEdit
              ? "Actualiza contenido, fotografías, productos relacionados y publicación sin tocar código."
              : "Crea la base del proyecto. Después podrás cargar fotografías y relacionar productos Laminati."}
          </p>
        </div>

        {isEdit ? (
          <div className="flex flex-wrap gap-2">
            {project?.status !==
            "PUBLISHED" ? (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatus(
                    "PUBLISHED"
                  )
                }
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Publicar
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatus(
                    "DRAFT"
                  )
                }
                className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:border-black disabled:opacity-50"
              >
                Pasar a borrador
              </button>
            )}

            <a
              href="/proyectos"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:border-black"
            >
              Ver vitrina ↗
            </a>
          </div>
        ) : null}
      </div>

      {message ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={
          handleSave
        }
        className="space-y-5"
      >
        <Section
          eyebrow="Contenido"
          title="Información general"
          description="Estos datos identifican el proyecto en la vitrina pública y en buscadores."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-2">
              <Field label="Nombre del proyecto">
                <input
                  value={
                    form.title
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "title",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                  placeholder="Ej. Casa Los Nogales"
                  required
                />
              </Field>
            </div>

            <Field
              label="Categoría"
            >
              <select
                value={
                  form.category
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              >
                {CATEGORIES.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label="Ubicación"
            >
              <input
                value={
                  form.location
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "location",
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                placeholder="Santiago, Chile"
              />
            </Field>

            <Field
              label="Año"
            >
              <input
                type="number"
                min="1900"
                max="2200"
                value={
                  form.project_year
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "project_year",
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
            </Field>

            <Field
              label="Orden"
              hint="Los números más bajos aparecen primero."
            >
              <input
                type="number"
                min="0"
                value={
                  form.sort_order
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "sort_order",
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-3">
              <Field
                label="Descripción corta"
                hint="Se utiliza en las tarjetas y listados de proyectos."
              >
                <textarea
                  rows="3"
                  maxLength="500"
                  value={
                    form.short_description
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "short_description",
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                  placeholder="Resume el proyecto y su aplicación..."
                />
              </Field>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Field
                label="Descripción completa"
              >
                <textarea
                  rows="7"
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                  placeholder="Describe el contexto, desafío, aplicación de materiales y resultado..."
                />
              </Field>
            </div>

            {isEdit ? (
              <div className="md:col-span-2 xl:col-span-3">
                <Field
                  label="Slug"
                  hint="Puedes modificarlo, pero evita hacerlo después de posicionar el proyecto en Google."
                >
                  <input
                    value={
                      form.slug
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "slug",
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 font-mono text-xs outline-none transition focus:border-black"
                  />
                </Field>
              </div>
            ) : null}
          </div>
        </Section>

        <Section
          eyebrow="Publicación"
          title="Visibilidad"
          description="Controla qué proyectos destacan y si permanecen activos en el sitio."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4">
              <div>
                <p className="text-sm font-semibold text-black">
                  Proyecto destacado
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Tendrá prioridad en listados y futuras secciones destacadas.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.is_featured
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "is_featured",
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-black"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 p-4">
              <div>
                <p className="text-sm font-semibold text-black">
                  Proyecto activo
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Un proyecto publicado pero inactivo no se entrega por la API pública.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.is_active
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "is_active",
                    event.target.checked
                  )
                }
                className="h-5 w-5 accent-black"
              />
            </label>
          </div>
        </Section>

        <Section
          eyebrow="SEO"
          title="Posicionamiento orgánico"
          description="Define el título y la descripción que utilizaremos posteriormente en /proyectos/[slug]."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Field
              label="Meta title"
              hint={`${form.meta_title.length}/180 caracteres`}
            >
              <input
                maxLength="180"
                value={
                  form.meta_title
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "meta_title",
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-black"
                placeholder="Casa Los Nogales | Proyectos Laminati"
              />
            </Field>

            <Field
              label="Meta description"
              hint={`${form.meta_description.length}/320 caracteres`}
            >
              <textarea
                rows="3"
                maxLength="320"
                value={
                  form.meta_description
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "meta_description",
                    event.target.value
                  )
                }
                className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
              />
            </Field>
          </div>
        </Section>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <div className="rounded-full border border-neutral-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold !text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear proyecto"}
            </button>
          </div>
        </div>
      </form>

      {isEdit ? (
        <div className="mt-5 space-y-5">
          <Section
            eyebrow="Galería"
            title="Fotografías del proyecto"
            description="Las imágenes se procesan automáticamente a WEBP y se generan variantes para miniatura, tarjeta y detalle."
          >
            <form
              onSubmit={
                handleUpload
              }
              className="grid gap-4 rounded-2xl bg-neutral-50 p-4 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-end"
            >
              <Field label="Archivo">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(
                    event
                  ) =>
                    setUploadFile(
                      event.target.files?.[0] ||
                      null
                    )
                  }
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
              </Field>

              <Field label="Texto alternativo">
                <input
                  value={
                    uploadAlt
                  }
                  onChange={(
                    event
                  ) =>
                    setUploadAlt(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
                  placeholder="Describe la imagen"
                />
              </Field>

              <Field label="Pie de foto">
                <input
                  value={
                    uploadCaption
                  }
                  onChange={(
                    event
                  ) =>
                    setUploadCaption(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
                  placeholder="Opcional"
                />
              </Field>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                  <input
                    type="checkbox"
                    checked={
                      uploadPrimary
                    }
                    onChange={(
                      event
                    ) =>
                      setUploadPrimary(
                        event.target.checked
                      )
                    }
                    className="accent-black"
                  />
                  Principal
                </label>

                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !uploadFile
                  }
                  className="h-11 rounded-full bg-black px-5 text-sm font-semibold !text-white disabled:opacity-40"
                >
                  {uploading
                    ? "Subiendo..."
                    : "Subir imagen"}
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(project?.images || []).map(
                (
                  image
                ) => {
                  const imageUrl =
                    getImageUrl(
                      image
                    );

                  return (
                    <article
                      key={
                        image.id
                      }
                      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                    >
                      <div className="relative aspect-[4/3] bg-neutral-100">
                        {imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              image.alt_text ||
                              project.title
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                            Sin vista previa
                          </div>
                        )}

                        {image.is_primary ? (
                          <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] !text-white">
                            Principal
                          </span>
                        ) : null}
                      </div>

                      <div className="p-4">
                        <p className="truncate text-sm font-semibold text-black">
                          {image.caption ||
                            image.alt_text ||
                            image.original_filename ||
                            "Imagen de proyecto"}
                        </p>

                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                          {image.storage_provider ||
                            "EXTERNAL"}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {!image.is_primary ? (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrimaryImage(
                                  image.id
                                )
                              }
                              className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-black"
                            >
                              Hacer principal
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteImage(
                                image.id
                              )
                            }
                            className="rounded-full border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {(project?.images || []).length ===
            0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center text-sm text-neutral-400">
                Aún no hay fotografías cargadas.
              </div>
            ) : null}
          </Section>

          <Section
            eyebrow="Materiales"
            title="Productos utilizados"
            description="Relaciona el caso de estudio con productos reales del catálogo para construir enlazado interno y mostrar materiales usados."
          >
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 p-4">
                <Field label="Buscar producto">
                  <input
                    value={
                      productSearch
                    }
                    onChange={(
                      event
                    ) => {
                      setProductSearch(
                        event.target.value
                      );
                      setSelectedProductId("");
                    }}
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-black"
                    placeholder="SKU, nombre, colección..."
                  />
                </Field>

                <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {filteredProducts.map(
                    (
                      productItem
                    ) => {
                      const selected =
                        selectedProductId ===
                        productItem.id;

                      return (
                        <button
                          key={
                            productItem.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedProductId(
                              productItem.id
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-black bg-neutral-50"
                              : "border-neutral-100 hover:border-neutral-300"
                          }`}
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {productItem.primary_image_url ? (
                              <img
                                src={
                                  productItem.primary_image_url
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-black">
                              {productItem.name}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                              {productItem.sku}
                              {productItem.collection
                                ? ` · ${productItem.collection}`
                                : ""}
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mt-4">
                  <Field label="Aplicación en el proyecto">
                    <input
                      value={
                        applicationNote
                      }
                      onChange={(
                        event
                      ) =>
                        setApplicationNote(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-black"
                      placeholder="Ej. Mobiliario de cocina"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  disabled={
                    !selectedProductId
                  }
                  onClick={
                    handleAttachProduct
                  }
                  className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold !text-white disabled:opacity-40"
                >
                  Asociar producto
                </button>
              </div>

              <div className="space-y-3">
                {(project?.products || []).map(
                  (
                    item
                  ) => (
                    <article
                      key={
                        item.product_id
                      }
                      className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-black">
                          {item.name}
                        </p>

                        <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-neutral-400">
                          {item.sku}
                        </p>

                        {item.application_note ? (
                          <p className="mt-2 text-xs leading-5 text-neutral-500">
                            {item.application_note}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveProduct(
                            item.product_id
                          )
                        }
                        className="shrink-0 rounded-full border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </article>
                  )
                )}

                {(project?.products || []).length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center text-sm text-neutral-400">
                    Aún no hay productos asociados.
                  </div>
                ) : null}
              </div>
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
