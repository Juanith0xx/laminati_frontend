import { apiRequest } from "./api";

export function searchProductSuggestions(
  query,
  {
    limit = 6,
    signal,
  } = {}
) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return apiRequest(
    `/products/search/suggestions?${params.toString()}`,
    {
      signal,
    }
  );
}