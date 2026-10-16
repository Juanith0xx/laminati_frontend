import {
  apiRequest,
} from "@/services/api";


function buildQuery(
  params = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(
    params
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      searchParams.set(
        key,
        String(
          value
        )
      );
    }
  );

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}


export function listAdminProjects(
  params = {}
) {
  return apiRequest(
    `/admin/projects${buildQuery(
      params
    )}`
  );
}


export function getAdminProject(
  projectId
) {
  return apiRequest(
    `/admin/projects/${projectId}`
  );
}


export function createAdminProject(
  data
) {
  return apiRequest(
    "/admin/projects",
    {
      method: "POST",
      body: data,
    }
  );
}


export function updateAdminProject(
  projectId,
  data
) {
  return apiRequest(
    `/admin/projects/${projectId}`,
    {
      method: "PATCH",
      body: data,
    }
  );
}


export function setAdminProjectStatus(
  projectId,
  data
) {
  return apiRequest(
    `/admin/projects/${projectId}/status`,
    {
      method: "PATCH",
      body: data,
    }
  );
}


export function archiveAdminProject(
  projectId
) {
  return apiRequest(
    `/admin/projects/${projectId}`,
    {
      method: "DELETE",
    }
  );
}


export function deleteAdminProjectPermanently(
  projectId
) {
  return apiRequest(
    `/admin/projects/${projectId}/permanent`,
    {
      method: "DELETE",
    }
  );
}


export function uploadAdminProjectImage(
  projectId,
  {
    file,
    altText,
    caption,
    isPrimary = false,
    sortOrder = 0,
  }
) {
  const formData =
    new FormData();

  formData.append(
    "image",
    file
  );

  formData.append(
    "alt_text",
    altText ||
      ""
  );

  formData.append(
    "caption",
    caption ||
      ""
  );

  formData.append(
    "is_primary",
    isPrimary
      ? "true"
      : "false"
  );

  formData.append(
    "sort_order",
    String(
      sortOrder ||
      0
    )
  );

  return apiRequest(
    `/admin/projects/${projectId}/images`,
    {
      method: "POST",
      body: formData,
    }
  );
}


export function updateAdminProjectImage(
  projectId,
  imageId,
  data
) {
  return apiRequest(
    `/admin/projects/${projectId}/images/${imageId}`,
    {
      method: "PATCH",
      body: data,
    }
  );
}


export function deleteAdminProjectImage(
  projectId,
  imageId
) {
  return apiRequest(
    `/admin/projects/${projectId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );
}


export function attachAdminProjectProduct(
  projectId,
  data
) {
  return apiRequest(
    `/admin/projects/${projectId}/products`,
    {
      method: "POST",
      body: data,
    }
  );
}


export function removeAdminProjectProduct(
  projectId,
  productId
) {
  return apiRequest(
    `/admin/projects/${projectId}/products/${productId}`,
    {
      method: "DELETE",
    }
  );
}


export function listAdminProductsForProjects() {
  return apiRequest(
    "/admin/products"
  );
}
