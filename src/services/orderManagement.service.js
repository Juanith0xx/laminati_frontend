import { apiRequest } from "@/services/api";

/** Consultas administrativas de pedidos WEB y STORE; no realizan mutaciones. */
export async function getAdminOrders({
  search = "",
  source = "ALL",
  status = "ALL",
  payment_status = "ALL",
  fulfillment_status = "ALL",
  from = "",
  to = "",
  page = 1,
  limit = 20,
  signal,
} = {}) {
  const params = new URLSearchParams({
    source, status, payment_status, fulfillment_status,
    page: String(page), limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiRequest(`/admin/order-management?${params.toString()}`, { signal });
}

export async function getAdminOrderById(orderId, { signal } = {}) {
  return apiRequest(`/admin/order-management/${encodeURIComponent(orderId)}`, { signal });
}
