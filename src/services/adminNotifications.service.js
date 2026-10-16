import {
  apiRequest,
} from "@/services/api";

export const ADMIN_NOTIFICATION_RECEIVED_EVENT =
  "laminati:admin-notification";

export const ADMIN_NOTIFICATION_READ_EVENT =
  "laminati:admin-notification-read";

export const ADMIN_NOTIFICATIONS_READ_ALL_EVENT =
  "laminati:admin-notifications-read-all";

export const QUOTATION_TRACKING_UPDATED_EVENT =
  "laminati:quotation-tracking-updated";

export async function listAdminNotifications({
  page = 1,
  limit = 15,
  search = "",
  type = "ALL",
  readStatus = "ALL",
  signal,
} = {}) {
  const params =
    new URLSearchParams();

  params.set(
    "page",
    String(page)
  );

  params.set(
    "limit",
    String(limit)
  );

  const normalizedSearch =
    String(
      search || ""
    ).trim();

  if (
    normalizedSearch
  ) {
    params.set(
      "search",
      normalizedSearch
    );
  }

  const normalizedType =
    String(
      type || "ALL"
    )
      .trim()
      .toUpperCase();

  if (
    normalizedType !==
    "ALL"
  ) {
    params.set(
      "type",
      normalizedType
    );
  }

  const normalizedReadStatus =
    String(
      readStatus ||
        "ALL"
    )
      .trim()
      .toUpperCase();

  if (
    normalizedReadStatus !==
    "ALL"
  ) {
    params.set(
      "read_status",
      normalizedReadStatus
    );
  }

  return apiRequest(
    `/admin/notifications?${params.toString()}`,
    {
      signal,
    }
  );
}

export async function markAdminNotificationRead(
  notificationId
) {
  return apiRequest(
    `/admin/notifications/${encodeURIComponent(
      notificationId
    )}/read`,
    {
      method:
        "PATCH",
    }
  );
}

export async function markAllAdminNotificationsRead() {
  return apiRequest(
    "/admin/notifications/read-all",
    {
      method:
        "POST",
    }
  );
}
