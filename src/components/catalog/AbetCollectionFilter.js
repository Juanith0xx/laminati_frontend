"use client";

import { useRouter } from "next/navigation";

const TYPE_ORDER = [
  "COLOR_EFFECT",
  "DESIGN_EDITION",
  "PRODUCT_RELATED",
  "PREVIEW",
  "OTHER",
];

const TYPE_LABELS = {
  COLOR_EFFECT: "Colores y efectos",
  DESIGN_EDITION: "Design Edition",
  PRODUCT_RELATED: "Relacionadas con producto",
  PREVIEW: "Preview",
  OTHER: "Otras colecciones",
};

function groupCollections(collections = []) {
  const groups = new Map();

  collections.forEach((collection) => {
    const type =
      String(
        collection?.collection_type || "OTHER"
      )
        .trim()
        .toUpperCase() || "OTHER";

    if (!groups.has(type)) {
      groups.set(type, []);
    }

    groups.get(type).push(collection);
  });

  return TYPE_ORDER
    .filter((type) => groups.has(type))
    .map((type) => ({
      type,
      label: TYPE_LABELS[type] || type,
      collections: groups.get(type),
    }));
}

function appendSearchParam(
  searchParams,
  key,
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    key === "page"
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (
        item !== undefined &&
        item !== null &&
        item !== ""
      ) {
        searchParams.append(
          key,
          String(item)
        );
      }
    });

    return;
  }

  searchParams.set(key, String(value));
}

export default function AbetCollectionFilter({
  collections = [],
  value = "",
  basePath = "/productos/laminados",
  params = {},
}) {
  const router = useRouter();
  const groups = groupCollections(collections);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const nextParams = new URLSearchParams();

    Object.entries(params || {}).forEach(
      ([key, paramValue]) => {
        if (key === "abet_collection") {
          return;
        }

        appendSearchParam(
          nextParams,
          key,
          paramValue
        );
      }
    );

    if (nextValue) {
      nextParams.set(
        "abet_collection",
        nextValue
      );
    }

    const query = nextParams.toString();

    router.push(
      query
        ? `${basePath}?${query}`
        : basePath
    );
  };

  return (
    <div className="rounded-[1.35rem] border border-black/5 bg-neutral-50 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Filtro
          </p>

          <p className="mt-1 text-sm font-medium text-neutral-800">
            Colección Abet
          </p>
        </div>

        <div className="relative w-full sm:w-[340px] lg:w-[390px]">
          <select
            aria-label="Filtrar por colección Abet"
            value={value || ""}
            onChange={handleChange}
            className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 pr-10 text-sm text-neutral-700 outline-none transition-colors hover:border-neutral-300 focus:border-neutral-400"
          >
            <option value="">
              Todas las colecciones
            </option>

            {groups.map((group) => (
              <optgroup
                key={group.type}
                label={group.label}
              >
                {group.collections.map(
                  (collection) => (
                    <option
                      key={collection.id}
                      value={collection.slug}
                    >
                      {collection.name}
                    </option>
                  )
                )}
              </optgroup>
            ))}
          </select>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          >
            <path
              d="m6 8 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
