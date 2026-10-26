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

export const listAdminUsers = async (filters = {}, options = {}) =>
  apiRequest(`/admin/users${buildQuery(filters)}`, {
    signal: options.signal,
  });

export const getAdminUserOptions = async (options = {}) =>
  apiRequest("/admin/users/options", {
    signal: options.signal,
  });

export const createAdminUser = async (payload) =>
  apiRequest("/admin/users", {
    method: "POST",
    body: payload,
  });

export const updateAdminUser = async (userId, payload) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: payload,
  });

export const setAdminUserStatus = async (userId, isActive) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: {
      is_active: Boolean(isActive),
    },
  });

export const deleteAdminUser = async (userId) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

export const listAdminPriceListsForUsers = async (options = {}) =>
  apiRequest("/admin/price-lists", {
    signal: options.signal,
  });

export const getAdminUserPriceList = async (userId, options = {}) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}/price-list`, {
    signal: options.signal,
  });

export const listAdminAuthHistory = async (filters = {}, options = {}) =>
  apiRequest(`/admin/auth-history${buildQuery(filters)}`, {
    signal: options.signal,
  });

export const getAdminUserAuthHistory = async (
  userId,
  filters = {},
  options = {}
) =>
  apiRequest(
    `/admin/users/${encodeURIComponent(userId)}/auth-history${buildQuery(filters)}`,
    {
      signal: options.signal,
    }
  );


export const assignAdminUserPriceList = async (
  userId,
  priceListId
) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}/price-list`, {
    method: "PUT",
    body: {
      price_list_id: priceListId,
    },
  });

export const removeAdminUserPriceList = async (userId) =>
  apiRequest(`/admin/users/${encodeURIComponent(userId)}/price-list`, {
    method: "DELETE",
  });

