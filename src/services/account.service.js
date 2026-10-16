import { apiRequest } from "@/services/api";

export const getAccount = () =>
  apiRequest("/account/me");

export const updateAccount = (payload) =>
  apiRequest("/account/me", {
    method: "PATCH",
    body: payload,
  });

export const getAccountAddresses = () =>
  apiRequest("/account/addresses");

export const createAccountAddress = (payload) =>
  apiRequest("/account/addresses", {
    method: "POST",
    body: payload,
  });

export const updateAccountAddress = (
  addressId,
  payload
) =>
  apiRequest(
    `/account/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "PATCH",
      body: payload,
    }
  );

export const deleteAccountAddress = (addressId) =>
  apiRequest(
    `/account/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "DELETE",
    }
  );

export const getAccountCompanies = () =>
  apiRequest("/account/companies");

export const updateAccountCompany = (
  companyId,
  payload
) =>
  apiRequest(
    `/account/companies/${encodeURIComponent(companyId)}`,
    {
      method: "PATCH",
      body: payload,
    }
  );

export const getAccountOrders = ({
  page = 1,
  limit = 20,
} = {}) =>
  apiRequest(
    `/account/orders?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`
  );

export const getAccountOrder = (orderId) =>
  apiRequest(
    `/account/orders/${encodeURIComponent(orderId)}`
  );

export const getAccountDocuments = ({
  page = 1,
  limit = 20,
} = {}) =>
  apiRequest(
    `/account/documents?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`
  );

export const createDocumentAccess = (taxDocumentId) =>
  apiRequest(
    `/account/documents/${encodeURIComponent(taxDocumentId)}/access`,
    {
      method: "POST",
    }
  );

export const getAccountExclusiveProducts = () =>
  apiRequest("/account/exclusive-products");

