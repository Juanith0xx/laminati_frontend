import { apiRequest } from "./api";

export function getProducts(
  params = {},
  requestOptions = {}
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return apiRequest(
    `/products${query ? `?${query}` : ""}`,
    requestOptions
  );
}

export function getProductBySlug(
  slug,
  requestOptions = {}
) {
  return apiRequest(
    `/products/${slug}`,
    requestOptions
  );
}

export function getCatalogFilters(
  requestOptions = {}
) {
  return apiRequest(
    "/catalog/filters",
    requestOptions
  );
}

/* =========================================
   CATÁLOGO PÚBLICO / HOME

   Estos helpers se usan solamente en contenido
   público que puede reutilizarse durante 60 s.
   El resto de la app conserva `no-store`.
========================================= */

const PUBLIC_CATALOG_REVALIDATE_SECONDS =
  60;

function getPublicCatalogRequestOptions() {
  return {
    cache: "force-cache",
    next: {
      revalidate:
        PUBLIC_CATALOG_REVALIDATE_SECONDS,
    },
  };
}

export function getPublicProducts(
  params = {}
) {
  return getProducts(
    params,
    getPublicCatalogRequestOptions()
  );
}

export function getPublicCatalogFilters() {
  return getCatalogFilters(
    getPublicCatalogRequestOptions()
  );
}