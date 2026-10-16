import {
  apiRequest,
} from "@/services/api";


export async function getPublicProjects(
  {
    category,
    featured,
    limit = 100,
    offset = 0,
  } = {}
) {
  const params =
    new URLSearchParams();

  if (
    category &&
    category !== "Todos"
  ) {
    params.set(
      "category",
      category
    );
  }

  if (
    typeof featured ===
    "boolean"
  ) {
    params.set(
      "featured",
      String(
        featured
      )
    );
  }

  params.set(
    "limit",
    String(
      limit
    )
  );

  params.set(
    "offset",
    String(
      offset
    )
  );

  return apiRequest(
    `/public/projects?${params.toString()}`
  );
}


export async function getPublicProjectBySlug(
  slug
) {
  if (!slug) {
    throw new Error(
      "Slug de proyecto requerido"
    );
  }

  return apiRequest(
    `/public/projects/${encodeURIComponent(
      slug
    )}`
  );
}
