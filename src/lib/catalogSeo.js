const SITE_URL =
  "https://laminati.cl";

const buildConfig = ({
  key,
  path,
  heading,
  eyebrow,
  metaTitle,
  description,
  intro,
  query,
  breadcrumbs,
  availability,
  priority = 0.8,
}) => ({
  key,
  path,
  heading,
  eyebrow,
  metaTitle,
  description,
  intro,
  query,
  breadcrumbs,
  availability,
  priority,
  limit: 100,
});

export const CATALOG_SEO_CONFIGS = {
  laminados: buildConfig({
    key: "laminados",
    path: "/productos/laminados",
    heading: "Laminados HPL",
    eyebrow: "Superficies disponibles",
    metaTitle:
      "Laminados HPL en Chile | Laminati Chile",
    description:
      "Explora laminados HPL disponibles en Chile para mobiliario, interiorismo y arquitectura. Diseños Abet Laminati y Karikal con stock en Laminati Chile.",
    intro:
      "Selección de laminados HPL con stock disponible para proyectos de mobiliario, interiorismo y arquitectura. Encuentra diseños, texturas y acabados de Abet Laminati y Karikal.",
    query: {
      category: "laminados",
      in_stock: true,
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Laminados HPL",
        path: "/productos/laminados",
      },
    ],
    availability: {
      type: "stock_category",
      category: "laminados",
    },
    priority: 0.9,
  }),

  adhesivos: buildConfig({
    key: "adhesivos",
    path: "/productos/adhesivos",
    heading: "Adhesivos para laminados",
    eyebrow: "Instalación profesional",
    metaTitle:
      "Adhesivos para laminados HPL | Laminati Chile",
    description:
      "Adhesivos profesionales para instalación de laminados HPL y superficies. Productos Kisafix disponibles en Laminati Chile.",
    intro:
      "Adhesivos profesionales para la instalación de laminados y superficies, seleccionados para lograr una aplicación firme, limpia y durable.",
    query: {
      category: "adhesivos",
      in_stock: true,
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Adhesivos",
        path: "/productos/adhesivos",
      },
    ],
    availability: {
      type: "stock_category",
      category: "adhesivos",
    },
    priority: 0.75,
  }),

  meg: buildConfig({
    key: "meg",
    path: "/productos/meg",
    heading: "MEG · Fachadas ventiladas",
    eyebrow: "Soluciones para exterior",
    metaTitle:
      "MEG para fachadas ventiladas | Abet Laminati Chile",
    description:
      "Paneles MEG de Abet Laminati para fachadas ventiladas y arquitectura exterior. Diseños, formatos, acabados y espesores disponibles a pedido para proyectos en Chile.",
    intro:
      "MEG es la solución HPL de Abet Laminati desarrollada para aplicaciones exteriores y fachadas ventiladas. Consulta diseños, formatos, acabados y espesores disponibles a pedido para proyectos.",
    query: {
      category: "meg",
      collection:
        "fachadas-ventiladas",
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "MEG",
        path: "/productos/meg",
      },
    ],
    availability: {
      type: "project_family",
      codes: ["MEG"],
    },
    priority: 0.9,
  }),

  labgrade: buildConfig({
    key: "labgrade",
    path: "/productos/labgrade",
    heading:
      "Labgrade · Superficies para laboratorio",
    eyebrow: "Superficies técnicas",
    metaTitle:
      "Labgrade para laboratorios | Abet Laminati Chile",
    description:
      "Superficies técnicas Labgrade y Labgrade Plus de Abet Laminati para cubiertas de laboratorio. Productos disponibles a pedido para proyectos en Chile.",
    intro:
      "Labgrade y Labgrade Plus son superficies técnicas de Abet Laminati concebidas para cubiertas y mobiliario de laboratorio. Revisa las alternativas disponibles para especificación y cotización de proyectos.",
    query: {
      category: "labgrade",
      collection:
        "cubiertas-de-laboratorio",
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Labgrade",
        path: "/productos/labgrade",
      },
    ],
    availability: {
      type: "project_family",
      codes: [
        "LABGRADE",
        "LABGRADE_PLUS",
      ],
    },
    priority: 0.85,
  }),
};

export const LAMINADOS_COLLECTION_CONFIGS = {
  "legni-maderas": buildConfig({
    key: "legni-maderas",
    path:
      "/productos/laminados/legni-maderas",
    heading: "Legni | Maderas",
    eyebrow: "Colección HPL",
    metaTitle:
      "Legni Maderas HPL | Abet Laminati Chile",
    description:
      "Laminados HPL de la colección Legni | Maderas de Abet Laminati. Diseños inspirados en maderas con stock disponible en Laminati Chile.",
    intro:
      "Colección de laminados HPL inspirada en distintas expresiones de la madera, pensada para mobiliario, revestimientos e interiorismo contemporáneo.",
    query: {
      category: "laminados",
      collection: "legni-maderas",
      in_stock: true,
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Laminados HPL",
        path: "/productos/laminados",
      },
      {
        name: "Legni | Maderas",
        path:
          "/productos/laminados/legni-maderas",
      },
    ],
    availability: {
      type: "stock_collection",
      category: "laminados",
      collection: "legni-maderas",
    },
  }),

  "colours-mate": buildConfig({
    key: "colours-mate",
    path:
      "/productos/laminados/colours-mate",
    heading: "Colours | Mate",
    eyebrow: "Colección HPL",
    metaTitle:
      "Colours Mate HPL | Abet Laminati Chile",
    description:
      "Laminados HPL Colours Mate de Abet Laminati con stock disponible en Chile. Colores sólidos para mobiliario, arquitectura e interiorismo.",
    intro:
      "Colores sólidos en acabado mate para proyectos que buscan superficies limpias, versátiles y fáciles de combinar en mobiliario e interiorismo.",
    query: {
      category: "laminados",
      collection: "colours-mate",
      in_stock: true,
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Laminados HPL",
        path: "/productos/laminados",
      },
      {
        name: "Colours | Mate",
        path:
          "/productos/laminados/colours-mate",
      },
    ],
    availability: {
      type: "stock_collection",
      category: "laminados",
      collection: "colours-mate",
    },
  }),

  "colours-textures": buildConfig({
    key: "colours-textures",
    path:
      "/productos/laminados/colours-textures",
    heading: "Colours & Textures",
    eyebrow: "Colección HPL",
    metaTitle:
      "Colours & Textures HPL | Abet Laminati Chile",
    description:
      "Colección Colours & Textures de Abet Laminati con laminados HPL disponibles en Chile para mobiliario, diseño y arquitectura interior.",
    intro:
      "Una selección que combina color y textura para dar profundidad visual y carácter táctil a muebles, revestimientos y espacios interiores.",
    query: {
      category: "laminados",
      collection: "colours-textures",
      in_stock: true,
      sort: "featured",
    },
    breadcrumbs: [
      {
        name: "Laminados HPL",
        path: "/productos/laminados",
      },
      {
        name: "Colours & Textures",
        path:
          "/productos/laminados/colours-textures",
      },
    ],
    availability: {
      type: "stock_collection",
      category: "laminados",
      collection: "colours-textures",
    },
  }),

  "digital-circus-ettore-sottsass":
    buildConfig({
      key:
        "digital-circus-ettore-sottsass",
      path:
        "/productos/laminados/digital-circus-ettore-sottsass",
      heading:
        "Digital Circus | Ettore Sottsass",
      eyebrow: "Colección de diseño",
      metaTitle:
        "Digital Circus Ettore Sottsass | Abet Laminati Chile",
      description:
        "Laminados HPL Digital Circus de Ettore Sottsass para Abet Laminati. Diseños disponibles con stock en Laminati Chile.",
      intro:
        "Diseños expresivos de Ettore Sottsass llevados al laminado HPL para proyectos de mobiliario e interiorismo con una identidad gráfica inconfundible.",
      query: {
        category: "laminados",
        collection:
          "digital-circus-ettore-sottsass",
        in_stock: true,
        sort: "featured",
      },
      breadcrumbs: [
        {
          name: "Laminados HPL",
          path: "/productos/laminados",
        },
        {
          name:
            "Digital Circus | Ettore Sottsass",
          path:
            "/productos/laminados/digital-circus-ettore-sottsass",
        },
      ],
      availability: {
        type: "stock_collection",
        category: "laminados",
        collection:
          "digital-circus-ettore-sottsass",
      },
    }),

  "digitalia-karim-rashid":
    buildConfig({
      key: "digitalia-karim-rashid",
      path:
        "/productos/laminados/digitalia-karim-rashid",
      heading:
        "Digitalia | Karim Rashid",
      eyebrow: "Colección de diseño",
      metaTitle:
        "Digitalia Karim Rashid | Abet Laminati Chile",
      description:
        "Laminados HPL Digitalia de Karim Rashid para Abet Laminati. Diseños disponibles con stock en Laminati Chile.",
      intro:
        "La colección Digitalia lleva el lenguaje gráfico de Karim Rashid a superficies HPL pensadas para espacios y mobiliario con fuerte identidad visual.",
      query: {
        category: "laminados",
        collection:
          "digitalia-karim-rashid",
        in_stock: true,
        sort: "featured",
      },
      breadcrumbs: [
        {
          name: "Laminados HPL",
          path: "/productos/laminados",
        },
        {
          name:
            "Digitalia | Karim Rashid",
          path:
            "/productos/laminados/digitalia-karim-rashid",
        },
      ],
      availability: {
        type: "stock_collection",
        category: "laminados",
        collection:
          "digitalia-karim-rashid",
      },
    }),

  "serigrafia-alessandro-mendini":
    buildConfig({
      key:
        "serigrafia-alessandro-mendini",
      path:
        "/productos/laminados/serigrafia-alessandro-mendini",
      heading:
        "Serigrafía | Alessandro Mendini",
      eyebrow: "Colección de diseño",
      metaTitle:
        "Serigrafía Alessandro Mendini | Abet Laminati Chile",
      description:
        "Laminados HPL Serigrafía de Alessandro Mendini para Abet Laminati, disponibles con stock en Laminati Chile.",
      intro:
        "Superficies decorativas de Alessandro Mendini con patrones gráficos pensados para transformar mobiliario, revestimientos y espacios interiores.",
      query: {
        category: "laminados",
        collection:
          "serigrafia-alessandro-mendini",
        in_stock: true,
        sort: "featured",
      },
      breadcrumbs: [
        {
          name: "Laminados HPL",
          path: "/productos/laminados",
        },
        {
          name:
            "Serigrafía | Alessandro Mendini",
          path:
            "/productos/laminados/serigrafia-alessandro-mendini",
        },
      ],
      availability: {
        type: "stock_collection",
        category: "laminados",
        collection:
          "serigrafia-alessandro-mendini",
      },
    }),

  "parade-giulio-iacchetti":
    buildConfig({
      key:
        "parade-giulio-iacchetti",
      path:
        "/productos/laminados/parade-giulio-iacchetti",
      heading:
        "Parade | Giulio Iacchetti",
      eyebrow: "Colección de diseño",
      metaTitle:
        "Parade Giulio Iacchetti | Abet Laminati Chile",
      description:
        "Laminados HPL Parade de Giulio Iacchetti para Abet Laminati. Diseños disponibles con stock en Laminati Chile.",
      intro:
        "Una colección de superficies decorativas diseñada por Giulio Iacchetti para aportar ritmo, color y personalidad a proyectos de mobiliario e interiorismo.",
      query: {
        category: "laminados",
        collection:
          "parade-giulio-iacchetti",
        in_stock: true,
        sort: "featured",
      },
      breadcrumbs: [
        {
          name: "Laminados HPL",
          path: "/productos/laminados",
        },
        {
          name:
            "Parade | Giulio Iacchetti",
          path:
            "/productos/laminados/parade-giulio-iacchetti",
        },
      ],
      availability: {
        type: "stock_collection",
        category: "laminados",
        collection:
          "parade-giulio-iacchetti",
      },
    }),

  "polaris-extramate":
    buildConfig({
      key: "polaris-extramate",
      path:
        "/productos/laminados/polaris-extramate",
      heading: "Polaris | ExtraMate",
      eyebrow: "Colección HPL",
      metaTitle:
        "Polaris ExtraMate | Abet Laminati Chile",
      description:
        "Superficies Polaris ExtraMate de Abet Laminati disponibles en Chile. Acabado ultramate para mobiliario y arquitectura interior.",
      intro:
        "Polaris ExtraMate ofrece una estética ultramate y contemporánea para mobiliario e interiorismo, con una superficie de apariencia sofisticada y baja reflexión.",
      query: {
        category: "laminados",
        collection: "polaris-extramate",
        in_stock: true,
        sort: "featured",
      },
      breadcrumbs: [
        {
          name: "Laminados HPL",
          path: "/productos/laminados",
        },
        {
          name: "Polaris | ExtraMate",
          path:
            "/productos/laminados/polaris-extramate",
        },
      ],
      availability: {
        type: "stock_collection",
        category: "laminados",
        collection: "polaris-extramate",
      },
    }),
};

export const getCatalogSeoConfig = (
  key
) =>
  CATALOG_SEO_CONFIGS[key] ||
  null;

export const getLaminadosCollectionConfig =
  (slug) =>
    LAMINADOS_COLLECTION_CONFIGS[
      String(slug || "")
        .trim()
        .toLowerCase()
    ] || null;

export const getLaminadosCollectionSlugs =
  () =>
    Object.keys(
      LAMINADOS_COLLECTION_CONFIGS
    );

export const getAllCatalogSeoConfigs =
  () => [
    ...Object.values(
      CATALOG_SEO_CONFIGS
    ),
    ...Object.values(
      LAMINADOS_COLLECTION_CONFIGS
    ),
  ];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeFamily = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

export const catalogConfigHasProducts = (
  config,
  products
) => {
  const availability =
    config?.availability;

  if (
    !availability ||
    !Array.isArray(products)
  ) {
    return false;
  }

  if (
    availability.type ===
    "stock_category"
  ) {
    return products.some(
      (product) =>
        product?.in_stock === true &&
        normalize(
          product?.category_slug ||
            product?.category
        ) ===
          normalize(
            availability.category
          )
    );
  }

  if (
    availability.type ===
    "stock_collection"
  ) {
    return products.some(
      (product) =>
        product?.in_stock === true &&
        normalize(
          product?.category_slug ||
            product?.category
        ) ===
          normalize(
            availability.category
          ) &&
        normalize(
          product?.collection_slug ||
            product?.collection
        ) ===
          normalize(
            availability.collection
          )
    );
  }

  if (
    availability.type ===
    "project_family"
  ) {
    const codes =
      new Set(
        (
          availability.codes ||
          []
        ).map(
          normalizeFamily
        )
      );

    return products.some(
      (product) =>
        codes.has(
          normalizeFamily(
            product
              ?.project_family_code
          )
        )
    );
  }

  return false;
};

export const buildCatalogMetadata = (
  config,
  pageValue = 1
) => {
  const page =
    Math.max(
      Number.parseInt(
        pageValue,
        10
      ) || 1,
      1
    );

  const pageSuffix =
    page > 1
      ? `?page=${page}`
      : "";

  const pageLabel =
    page > 1
      ? ` · Página ${page}`
      : "";

  const title =
    `${config.metaTitle}${pageLabel}`;

  const canonical =
    `${config.path}${pageSuffix}`;

  return {
    title,
    description:
      config.description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description:
        config.description,
      url:
        `${SITE_URL}${canonical}`,
      siteName: "Laminati Chile",
      locale: "es_CL",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description:
        config.description,
    },
  };
};
