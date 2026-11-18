"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  searchValue = "",
  basePath = "/productos/laminados",
  params = {},
}) {
  const router = useRouter();
  const groups = groupCollections(collections);
  const [searchInput, setSearchInput] = useState(searchValue);
  const latestParams = useRef(params);
  const isTyping = useRef(false);
  latestParams.current = params;

  // No reemplazar lo que el usuario está escribiendo cuando llega una
  // respuesta de navegación anterior. Sincronizar desde la URL solo cuando
  // no hay una edición pendiente (por ejemplo, al volver con el navegador).
  useEffect(() => {
    if (isTyping.current) {
      if (searchInput.trim() === String(searchValue || "").trim()) {
        isTyping.current = false;
      }
      return;
    }
    setSearchInput(searchValue);
  }, [searchValue, searchInput]);

  useEffect(() => {
    const input = searchInput.trim();
    const current = String(searchValue || "").trim();
    if (!isTyping.current || input === current) return;

    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams();
      Object.entries(latestParams.current || {}).forEach(([key, value]) => {
        if (key !== "page" && key !== "search" && key !== "strat_code") {
          appendSearchParam(nextParams, key, value);
        }
      });

      const codeMatch = input.match(/^(?:STRAT-)?([0-9]{1,6})$/i);
      if (codeMatch) {
        nextParams.set("strat_code", codeMatch[1]);
      } else if (input) {
        nextParams.set("search", input);
      }

      const query = nextParams.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, searchValue, basePath, router]);

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
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="strat-code-search"
            className="mb-2 block text-xs font-medium text-neutral-700"
          >
            Buscar por código o nombre
          </label>
          <input
            id="strat-code-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={searchInput}
            onChange={(event) => {
              isTyping.current = true;
              setSearchInput(event.target.value);
            }}
            placeholder="Ej: 810, 546, STRAT-810 o Bianco"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition-colors focus:border-neutral-400"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="abet-collection-select"
            className="mb-2 block text-xs font-medium text-neutral-700"
          >
            Colección Abet
          </label>
          <div className="relative">
            <select
              id="abet-collection-select"
              value={value || ""}
              onChange={handleChange}
              className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 pr-10 text-sm text-neutral-700 outline-none transition-colors hover:border-neutral-300 focus:border-neutral-400"
            >
              <option value="">Todas las colecciones</option>
              {groups.map((group) => (
                <optgroup key={group.type} label={group.label}>
                  {group.collections.map((collection) => (
                    <option key={collection.id} value={collection.slug}>
                      {collection.name}
                    </option>
                  ))}
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
    </div>
  );
}
