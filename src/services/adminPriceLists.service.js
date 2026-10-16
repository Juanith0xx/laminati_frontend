import { apiRequest } from "@/services/api";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const listAdminPriceLists = async (filters = {}, options = {}) =>
  apiRequest(`/admin/price-lists${buildQuery(filters)}`, {
    signal: options.signal,
  });

export const getAdminPriceList = async (priceListId, options = {}) =>
  apiRequest(`/admin/price-lists/${encodeURIComponent(priceListId)}`, {
    signal: options.signal,
  });

export const createAdminPriceList = async (payload) =>
  apiRequest("/admin/price-lists", {
    method: "POST",
    body: payload,
  });

export const updateAdminPriceList = async (priceListId, payload) =>
  apiRequest(`/admin/price-lists/${encodeURIComponent(priceListId)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminPriceList = async (priceListId) =>
  apiRequest(`/admin/price-lists/${encodeURIComponent(priceListId)}`, {
    method: "DELETE",
  });

export const createAdminPriceListRule = async (priceListId, payload) =>
  apiRequest(
    `/admin/price-lists/${encodeURIComponent(priceListId)}/rules`,
    {
      method: "POST",
      body: payload,
    }
  );

export const updateAdminPriceListRule = async (
  priceListId,
  ruleId,
  payload
) =>
  apiRequest(
    `/admin/price-lists/${encodeURIComponent(
      priceListId
    )}/rules/${encodeURIComponent(ruleId)}`,
    {
      method: "PATCH",
      body: payload,
    }
  );

export const deleteAdminPriceListRule = async (priceListId, ruleId) =>
  apiRequest(
    `/admin/price-lists/${encodeURIComponent(
      priceListId
    )}/rules/${encodeURIComponent(ruleId)}`,
    {
      method: "DELETE",
    }
  );

export const listAdminPriceListProducts = async (options = {}) =>
  apiRequest("/admin/products", {
    signal: options.signal,
  });

export const listAdminPriceListCollections = async (options = {}) =>
  apiRequest("/admin/collections", {
    signal: options.signal,
  });
