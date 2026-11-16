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

export function getProductBySlug(slug) {
  return apiRequest(`/products/${slug}`);
}

export function getCatalogFilters() {
  return apiRequest("/catalog/filters");
}