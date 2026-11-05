import { apiRequest } from "@/services/api";

const normalizeDays = (days) => {
  const parsed = Number(days);

  if ([7, 30, 90].includes(parsed)) {
    return parsed;
  }

  return 30;
};

const get = (endpoint, days, signal) =>
  apiRequest(
    `${endpoint}?days=${normalizeDays(days)}`,
    {
      signal,
    }
  );

export const getAdminAnalyticsOverview = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/overview",
    days,
    signal
  );

export const getAdminAnalyticsProducts = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/products",
    days,
    signal
  );

export const getAdminAnalyticsCollections = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/collections",
    days,
    signal
  );

export const getAdminAnalyticsLocations = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/locations",
    days,
    signal
  );

export const getAdminAnalyticsSearches = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/searches",
    days,
    signal
  );

export const getAdminAnalyticsSources = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/sources",
    days,
    signal
  );

export const getAdminAnalyticsDevices = (
  days = 30,
  signal
) =>
  get(
    "/admin/analytics/devices",
    days,
    signal
  );
