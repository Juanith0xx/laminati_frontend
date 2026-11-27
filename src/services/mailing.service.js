import { apiRequest } from "@/services/api";

const base = "/admin/mailing";

export const getMailingSummary = () => apiRequest(`${base}/summary`);
export const getMailingContacts = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") qs.set(key, String(value));
  });
  const suffix = qs.toString();
  return apiRequest(`${base}/contacts${suffix ? `?${suffix}` : ""}`);
};
export const createMailingContact = (body) => apiRequest(`${base}/contacts`, { method: "POST", body });
export const updateMailingContact = (id, body) => apiRequest(`${base}/contacts/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const getMailingSegments = () => apiRequest(`${base}/segments`);
export const createMailingSegment = (body) => apiRequest(`${base}/segments`, { method: "POST", body });
export const getMailingTemplates = () => apiRequest(`${base}/templates`);
export const createMailingTemplate = (body) => apiRequest(`${base}/templates`, { method: "POST", body });
export const getMailingCampaigns = () => apiRequest(`${base}/campaigns`);
export const createMailingCampaign = (body) => apiRequest(`${base}/campaigns`, { method: "POST", body });
export const getMailingSuppressions = () => apiRequest(`${base}/suppressions`);
export const createMailingSuppression = (body) => apiRequest(`${base}/suppressions`, { method: "POST", body });
