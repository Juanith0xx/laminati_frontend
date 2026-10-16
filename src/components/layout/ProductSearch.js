"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  searchProductSuggestions,
} from "@/services/search.service";

/* =========================================
   FORMATEAR PRECIO
========================================= */

const formatPrice = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  ).format(number);
};

/* =========================================
   COMPONENTE
========================================= */

export default function ProductSearch({
  onClose,
}) {
  const router = useRouter();

  const inputRef = useRef(null);

  const [query, setQuery] =
    useState("");

  const [suggestions, setSuggestions] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(false);

  const [selectedIndex, setSelectedIndex] =
    useState(-1);

  /* =========================================
     AUTOFOCUS
  ========================================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  /* =========================================
     AUTOCOMPLETADO
  ========================================= */

  useEffect(() => {
    const normalizedQuery =
      query.trim();

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(false);
      setSelectedIndex(-1);

      return;
    }

    const controller =
      new AbortController();

    /*
      Debounce:
      esperamos antes de consultar
      para no llamar al backend
      con cada pulsación.
    */
    const timeout = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError(false);

          const response =
            await searchProductSuggestions(
              normalizedQuery,
              {
                limit: 6,
                signal:
                  controller.signal,
              }
            );

          setSuggestions(
            response?.suggestions || []
          );

          setSelectedIndex(-1);
        } catch (error) {
          if (
            error?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Error buscando productos:",
            error
          );

          setSuggestions([]);
          setError(true);
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false);
          }
        }
      },
      200
    );

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  /* =========================================
     IR A PRODUCTO
  ========================================= */

  const goToProduct = (product) => {
    if (!product?.slug) {
      return;
    }

    onClose?.();

    router.push(
      `/productos/${product.slug}`
    );
  };

  /* =========================================
     VER TODOS
  ========================================= */

  const searchAll = () => {
    const normalizedQuery =
      query.trim();

    if (!normalizedQuery) {
      return;
    }

    onClose?.();

    router.push(
      `/productos?search=${encodeURIComponent(
        normalizedQuery
      )}`
    );
  };

  /* =========================================
     TECLADO
  ========================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      onClose?.();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (
        suggestions.length === 0
      ) {
        return;
      }

      setSelectedIndex(
        (current) =>
          current >=
          suggestions.length - 1
            ? 0
            : current + 1
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (
        suggestions.length === 0
      ) {
        return;
      }

      setSelectedIndex(
        (current) =>
          current <= 0
            ? suggestions.length - 1
            : current - 1
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        selectedIndex >= 0 &&
        suggestions[selectedIndex]
      ) {
        goToProduct(
          suggestions[selectedIndex]
        );

        return;
      }

      searchAll();
    }
  };

  const showMinimumMessage =
    query.length > 0 &&
    query.trim().length < 2;

  const showNoResults =
    !loading &&
    !error &&
    query.trim().length >= 2 &&
    suggestions.length === 0;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* INPUT */}
      <div className="relative">
        {/* ICONO */}
        <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.7"
            />

            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder="Buscar por nombre, SKU o código..."
          autoComplete="off"
          spellCheck="false"
          aria-label="Buscar productos"
          className="h-14 w-full rounded-full border border-black/10 bg-neutral-50 pl-13 pr-14 text-sm text-neutral-950 outline-none transition focus:border-black/20 focus:bg-white sm:h-16 sm:text-base"
        />

        {/* LOADING */}
        {loading && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          </div>
        )}

        {/* LIMPIAR */}
        {!loading &&
          query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setSelectedIndex(-1);

                inputRef.current?.focus();
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
            >
              ×
            </button>
          )}
      </div>

      {/* AYUDA MÍNIMO */}
      {showMinimumMessage && (
        <p className="px-5 pt-3 text-xs text-neutral-400">
          Escribe al menos 2 caracteres.
        </p>
      )}

      {/* RESULTADOS */}
      <AnimatePresence>
        {query.trim().length >= 2 && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -5,
            }}
            transition={{
              duration: 0.15,
            }}
            className="mt-3 overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          >
            {/* ERROR */}
            {error && (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-neutral-800">
                  No pudimos realizar la búsqueda.
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Intenta nuevamente.
                </p>
              </div>
            )}

            {/* SIN RESULTADOS */}
            {showNoResults && (
              <div className="p-7 text-center">
                <p className="text-sm font-medium text-neutral-800">
                  No encontramos productos.
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Prueba con otro nombre,
                  SKU o código.
                </p>
              </div>
            )}

            {/* SUGERENCIAS */}
            {suggestions.length > 0 && (
              <>
                <div className="max-h-[420px] overflow-y-auto p-2">
                  {suggestions.map(
                    (
                      product,
                      index
                    ) => {
                      const selected =
                        selectedIndex ===
                        index;

                      const price =
                        formatPrice(
                          product.final_price ??
                            product.base_price
                        );

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onMouseEnter={() =>
                            setSelectedIndex(
                              index
                            )
                          }
                          onClick={() =>
                            goToProduct(
                              product
                            )
                          }
                          className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition ${
                            selected
                              ? "bg-neutral-100"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          {/* IMAGEN */}
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 sm:h-16 sm:w-16">
                            {product.primary_image_url ? (
                              <img
                                src={
                                  product.primary_image_url
                                }
                                alt={
                                  product.primary_image_alt ||
                                  product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                                Laminati
                              </span>
                            )}
                          </div>

                          {/* INFORMACIÓN */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-950 sm:text-base">
                              {
                                product.name
                              }
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {product.sku && (
                                <span className="text-xs text-neutral-400">
                                  SKU{" "}
                                  {
                                    product.sku
                                  }
                                </span>
                              )}

                              {product.in_stock ? (
                                <span className="text-xs text-green-700">
                                  Disponible
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  Sin stock
                                </span>
                              )}
                            </div>
                          </div>

                          {/* PRECIO */}
                          {price && (
                            <div className="hidden shrink-0 text-right sm:block">
                              <p className="text-sm font-medium text-neutral-900">
                                {price}
                              </p>
                            </div>
                          )}

                          <span className="shrink-0 text-lg text-neutral-400">
                            →
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* VER TODOS */}
                <div className="border-t border-black/5 p-2">
                  <button
                    type="button"
                    onClick={
                      searchAll
                    }
                    className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition hover:bg-neutral-50"
                  >
                    <span>
                      Ver todos los resultados
                      para &quot;{query.trim()}&quot;
                    </span>

                    <span>→</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}