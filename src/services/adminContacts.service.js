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

export const listAdminContacts = async (filters = {}, options = {}) =>
  apiRequest(`/admin/contacts${buildQuery(filters)}`, {
    signal: options.signal,
  });

export const updateAdminContactStatus = async (messageId, status) =>
  apiRequest(`/admin/contacts/${encodeURIComponent(messageId)}/status`, {
    method: "PATCH",
    body: { status },
  });

export const listAdminContactReplies = async (
  messageId,
  options = {}
) =>
  apiRequest(
    `/admin/contacts/${encodeURIComponent(messageId)}/replies`,
    {
      signal: options.signal,
    }
  );

export const sendAdminContactReply = async (
  messageId,
  payload
) =>
  apiRequest(
    `/admin/contacts/${encodeURIComponent(messageId)}/replies`,
    {
      method: "POST",
      body: payload,
    }
  );