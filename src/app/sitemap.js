import {
  catalogConfigHasProducts,
  getAllCatalogSeoConfigs,
} from "@/lib/catalogSeo";

const SITE_URL = "https://laminati.cl";

const API_URL = (
  process.env.API_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
).replace(/\/$/, "");

/*
 * El sitemap se regenera periódicamente para que productos
 * y proyectos publicados recientemente puedan aparecer sin
 * tener que mantener un XML manual.
 */
export const revalidate = 3600;

const cleanText = (value) =>
  String(value ?? "").trim();

const asArray = (value) =>
  Array.isArray(value) ? value : [];

const toLastModified = (value) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const buildEntry = ({
  url,
  lastModified,
  changeFrequency,
  priority,
}) => {
  const entry = {
    url,
    changeFrequency,
    priority,
  };

  if (lastModified) {
    entry.lastModified = lastModified;
  }

  return entry;
};

const fetchPublicJson = async (path) => {
  if (
    !API_URL ||
    !/^https?:\/\//i.test(API_URL)
  ) {
    throw new Error(
      "API_SERVER_URL o NEXT_PUBLIC_API_URL debe contener una URL absoluta"
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} para ${path}`
    );
  }

  return response.json();
};

const extractProducts = (payload) => {
  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  if (Array.isArray(payload?.data?.products)) {
    return payload.data.products;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const extractProjects = (payload) => {
  if (Array.isArray(payload?.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload?.data?.projects)) {
    return payload.data.projects;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const loadAllPublicProducts = async () => {
  const limit = 100;
  const maxPages = 200;
  const collected = [];

  for (
    let page = 1;
    page <= maxPages;
    page += 1
  ) {
    const payload = await fetchPublicJson(
      `/products?page=${page}&limit=${limit}`
    );

    const products =
      extractProducts(payload);

    collected.push(...products);

    const pagination =
      payload?.pagination ||
      payload?.data?.pagination ||
      null;

    if (
      pagination?.has_next_page === false
    ) {
      break;
    }

    const totalPages = Number(
      pagination?.total_pages ||
      pagination?.totalPages ||
      0
    );

    if (
      Number.isFinite(totalPages) &&
      totalPages > 0 &&
      page >= totalPages
    ) {
      break;
    }

    if (products.length < limit) {
      break;
    }
  }

  return collected;
};

const loadAllPublicProjects = async () => {
  const limit = 100;
  const maxPages = 200;
  const collected = [];

  for (
    let page = 0;
    page < maxPages;
    page += 1
  ) {
    const offset = page * limit;

    const payload = await fetchPublicJson(
      `/public/projects?limit=${limit}&offset=${offset}`
    );

    const projects =
      extractProjects(payload);

    collected.push(...projects);

    const pagination =
      payload?.pagination ||
      payload?.data?.pagination ||
      payload?.meta ||
      null;

    const total = Number(
      pagination?.total ||
      pagination?.total_count ||
      0
    );

    if (
      Number.isFinite(total) &&
      total > 0 &&
      offset + projects.length >= total
    ) {
      break;
    }

    if (projects.length < limit) {
      break;
    }
  }

  return collected;
};

const isPublicRecord = (item) =>
  item?.is_active !== false &&
  item?.is_published !== false;

const buildProductEntries = (products) => {
  const seen = new Set();
  const entries = [];

  for (const product of asArray(products)) {
    const slug = cleanText(product?.slug);

    if (
      !slug ||
      !isPublicRecord(product) ||
      seen.has(slug)
    ) {
      continue;
    }

    seen.add(slug);

    entries.push(
      buildEntry({
        url: `${SITE_URL}/productos/${encodeURIComponent(slug)}`,
        lastModified: toLastModified(
          product?.updated_at ||
          product?.created_at
        ),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );
  }

  return entries;
};

const buildCatalogLandingEntries = (
  products
) => {
  return getAllCatalogSeoConfigs()
    .filter(
      (config) =>
        catalogConfigHasProducts(
          config,
          products
        )
    )
    .map(
      (config) =>
        buildEntry({
          url:
            `${SITE_URL}${config.path}`,
          changeFrequency:
            config.key === "meg" ||
            config.key === "labgrade"
              ? "weekly"
              : "daily",
          priority:
            config.priority ||
            0.8,
        })
    );
};

const buildProjectEntries = (projects) => {
  const seen = new Set();
  const entries = [];

  for (const project of asArray(projects)) {
    const slug = cleanText(project?.slug);

    if (
      !slug ||
      !isPublicRecord(project) ||
      seen.has(slug)
    ) {
      continue;
    }

    seen.add(slug);

    entries.push(
      buildEntry({
        url: `${SITE_URL}/proyectos/${encodeURIComponent(slug)}`,
        lastModified: toLastModified(
          project?.updated_at ||
          project?.published_at ||
          project?.created_at
        ),
        changeFrequency: "monthly",
        priority: 0.7,
      })
    );
  }

  return entries;
};

export default async function sitemap() {
  const staticEntries = [
    buildEntry({
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    }),
    buildEntry({
      url: `${SITE_URL}/productos`,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    buildEntry({
      url: `${SITE_URL}/nosotros`,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    buildEntry({
      url: `${SITE_URL}/proyectos`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  ];

  const [
    productsResult,
    projectsResult,
  ] = await Promise.allSettled([
    loadAllPublicProducts(),
    loadAllPublicProjects(),
  ]);

  if (productsResult.status === "rejected") {
    console.error(
      "No fue posible cargar productos para sitemap:",
      productsResult.reason
    );
  }

  if (projectsResult.status === "rejected") {
    console.error(
      "No fue posible cargar proyectos para sitemap:",
      projectsResult.reason
    );
  }

  const products =
    productsResult.status === "fulfilled"
      ? productsResult.value
      : [];

  const projects =
    projectsResult.status === "fulfilled"
      ? projectsResult.value
      : [];

  return [
    ...staticEntries,
    ...buildCatalogLandingEntries(
      products
    ),
    ...buildProductEntries(products),
    ...buildProjectEntries(projects),
  ];
}
