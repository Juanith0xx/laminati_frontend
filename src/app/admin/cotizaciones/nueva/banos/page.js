"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createBathroomQuotation,
  getBathroomOptimizationSummary,
  getBathroomQuotationPdfBlob,
  optimizeBathroomProject,
} from "@/services/bathroomProject.service";

import {
  calculateBathroomCutService,
} from "@/utils/bathroomCutService";

// LAMINATI_BATHROOM_CUT_SERVICE_V1

import {
  getProjectQuotationProducts,
  searchRelbaseCustomers,
} from "@/services/showroom.service";

/* =========================================
   CONSTANTES
========================================= */

const SHEET_WIDTH = 1220;
const SHEET_HEIGHT = 3050;
const DEFAULT_KERF = 4;

const SHEET_FORMATS = [
  {
    id: "1220x3050",
    label: "1220 × 3050 mm",
    width: 1220,
    height: 3050,
  },
  {
    id: "1300x3050",
    label: "1300 × 3050 mm",
    width: 1300,
    height: 3050,
  },
];

const DEFAULT_SHEET_FORMAT_ID =
  "1220x3050";

const THICKNESSES = [
  12,
  15,
  19,
];

const WALL_MODES = [
  {
    id: "BETWEEN_WALLS",
    label: "Entre muros",
    description:
      "Los muros reemplazan ambos laterales exteriores.",
  },
  {
    id: "ONE_WALL",
    label: "Un muro",
    description:
      "Un lateral exterior se fabrica en HPL.",
  },
  {
    id: "FREE",
    label: "Sin muros",
    description:
      "Ambos laterales exteriores se fabrican en HPL.",
  },
];

const ADDITIONAL_SERVICE_PRESETS = [
  {
    code: "SERV-QUINC",
    description: "Quincallería",
    unit: "GL",
  },
  {
    code: "SERV-INST",
    description: "Servicio de instalación",
    unit: "GL",
  },
  {
    code: "SERV-TRAS",
    description: "Traslado / flete",
    unit: "GL",
  },
];

const SERVICE_UNITS = [
  "GL",
  "UN",
  "HH",
  "M",
  "M2",
  "DÍA",
];

const moneyFormatter =
  new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  );

function money(value) {
  const number =
    Number(value || 0);

  return moneyFormatter.format(
    Number.isFinite(number)
      ? number
      : 0
  );
}

/* =========================================
   HELPERS
========================================= */

function numberValue(
  value,
  fallback = 0
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function createAdditionalService(
  preset = {}
) {
  return {
    id:
      `service-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    code:
      String(
        preset.code ||
        ""
      ),
    description:
      String(
        preset.description ||
        ""
      ),
    quantity:
      preset.quantity ??
      1,
    unit:
      String(
        preset.unit ||
        "GL"
      ),
    unitPrice:
      preset.unitPrice ??
      "",
  };
}

function createZone(
  index
) {
  return {
    id: `zona-${index + 1}`,
    label: `Zona ${index + 1}`,

    cubicles: 3,

    /*
     * cubicleWidth se conserva por compatibilidad
     * con snapshots anteriores. El divisor lateral
     * se cotiza por profundidad × altura.
     */
    cubicleWidth: 900,
    cubicleDepth: 1200,

    /*
     * FREE conserva el comportamiento histórico:
     * divisores = N + 1. El vendedor puede cambiar
     * rápidamente a BETWEEN_WALLS u ONE_WALL.
     */
    wallMode: "FREE",

    doorWidth: 600,
    doorHeight: 1500,

    dividerHeight: 1500,

    pilasterWidth: 150,
    pilasterHeight: 1800,

    dividerThickness: 12,
    doorThickness: 12,
    pilasterThickness: 19,

    dividerProduct: null,
    doorProduct: null,
    pilasterProduct: null,
  };
}

function getDividerQuantity(
  cubicles,
  wallMode
) {
  const n =
    Math.max(
      Math.trunc(
        numberValue(
          cubicles,
          0
        )
      ),
      0
    );

  const normalizedMode =
    String(
      wallMode ||
      "FREE"
    )
      .trim()
      .toUpperCase();

  if (
    normalizedMode ===
    "BETWEEN_WALLS"
  ) {
    return Math.max(
      n - 1,
      0
    );
  }

  if (
    normalizedMode ===
    "ONE_WALL"
  ) {
    return n;
  }

  return n + 1;
}

function getWallMode(
  wallMode
) {
  const normalizedMode =
    String(
      wallMode ||
      "FREE"
    )
      .trim()
      .toUpperCase();

  return (
    WALL_MODES.find(
      (mode) =>
        mode.id ===
        normalizedMode
    ) ||
    WALL_MODES[
      WALL_MODES.length -
      1
    ]
  );
}

function getMaterialCode(
  thickness
) {
  return `HPL-WHITE-${thickness}`;
}

function cleanProductCode(
  product
) {
  return String(
    product?.internal_code ||
    product?.sku ||
    product?.code ||
    product?.id ||
    ""
  ).trim();
}

function normalizeCatalogProduct(
  product
) {
  if (!product) {
    return null;
  }

  const id =
    product.id ||
    product.product_id ||
    null;

  const code =
    cleanProductCode(
      product
    );

  return {
    id,
    code,
    name:
      String(
        product.name ||
        code ||
        "HPL"
      ).trim(),
    brand:
      String(
        product.brand ||
        "ABET LAMINATI"
      ).trim(),
    collection:
      String(
        product.collection ||
        ""
      ).trim(),
    finish:
      String(
        product.finish ||
        ""
      ).trim(),
    thickness:
      numberValue(
        product.thickness_mm,
        0
      ),
    width:
      numberValue(
        product.width_mm,
        0
      ),
    height:
      numberValue(
        product.height_mm,
        0
      ),
    basePrice:
      numberValue(
        product.base_price,
        0
      ),
  };
}

function getPartMaterialCode({
  thickness,
  product,
}) {
  const normalized =
    normalizeCatalogProduct(
      product
    );

  if (normalized?.code) {
    return normalized.code;
  }

  return getMaterialCode(
    thickness
  );
}

function extractProjectProducts(
  response
) {
  if (
    Array.isArray(
      response?.products
    )
  ) {
    return response.products;
  }

  if (
    Array.isArray(
      response?.data?.products
    )
  ) {
    return response.data.products;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
}

function firstText(...values) {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      typeof value === "object"
    ) {
      continue;
    }

    const text =
      String(value).trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function firstEmail(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const email =
        value
          .map((item) =>
            String(
              item || ""
            ).trim()
          )
          .find(Boolean);

      if (email) {
        return email;
      }

      continue;
    }

    const email =
      firstText(value);

    if (email) {
      return email;
    }
  }

  return "";
}

function nestedName(value) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  return firstText(
    value.name,
    value.label,
    value.description
  );
}

function mapRelbaseCustomer(
  relbaseCustomer
) {
  const item =
    relbaseCustomer || {};

  return {
    id:
      firstText(
        item.id,
        item.customer_id,
        item.client_id,
        item.relbase_customer_id
      ),

    rut:
      firstText(
        item.rut,
        item.tax_id
      ),

    legalName:
      firstText(
        item.name,
        item.legal_name,
        item.name_fantasy
      ),

    businessActivity:
      firstText(
        item.business_activity,
        item.giro
      ),

    email:
      firstEmail(
        item.email,
        item.email_commercial,
        item.email_payment
      ),

    phone:
      firstText(
        item.mobile,
        item.phone,
        item.phone_payment
      ),

    address:
      firstText(
        item.address,
        item.address_line,
        item.full_address
      ),

    commune:
      firstText(
        item.commune_name,
        nestedName(
          item.commune
        ),
        typeof item.commune ===
          "string"
          ? item.commune
          : ""
      ),

    city:
      firstText(
        item.city_name,
        nestedName(
          item.city
        ),
        typeof item.city ===
          "string"
          ? item.city
          : ""
      ),

    region:
      firstText(
        item.region_name,
        nestedName(
          item.region
        ),
        typeof item.region ===
          "string"
          ? item.region
          : ""
      ),

    type:
      firstText(
        item.type_customer,
        item.customer_type,
        item.type
      ).toLowerCase(),
  };
}

function extractRelbaseCustomers(
  response
) {
  const candidates = [
    response?.customers,
    response?.data?.customers,
    response?.data?.data
      ?.customers,
    response?.data?.data,
    response?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function buildMaterials(
  zones,
  sheetFormat
) {
  const materials =
    new Map();

  const addMaterial = ({
    thickness,
    product = null,
  }) => {
    const normalizedProduct =
      normalizeCatalogProduct(
        product
      );

    const safeThickness =
      numberValue(
        normalizedProduct
          ?.thickness ||
        thickness,
        12
      );

    const code =
      getPartMaterialCode({
        thickness:
          safeThickness,
        product:
          normalizedProduct,
      });

    if (
      materials.has(
        code
      )
    ) {
      return;
    }

    materials.set(
      code,
      {
        code,
        label:
          normalizedProduct
            ?.name ||
          `HPL Blanco ${safeThickness} mm`,
        sheetWidth:
          sheetFormat?.width ||
          SHEET_WIDTH,
        sheetHeight:
          sheetFormat?.height ||
          SHEET_HEIGHT,
        thickness:
          safeThickness,
        kerf:
          DEFAULT_KERF,
        margins: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        allowRotation:
          false,
      }
    );
  };

  zones.forEach(
    (zone) => {
      addMaterial({
        thickness:
          zone.dividerThickness,
        product:
          zone.dividerProduct,
      });

      addMaterial({
        thickness:
          zone.doorThickness,
        product:
          zone.doorProduct,
      });

      addMaterial({
        thickness:
          zone.pilasterThickness,
        product:
          zone.pilasterProduct,
      });
    }
  );

  return Array.from(
    materials.values()
  );
}

function findSelectedProductForMaterial(
  zones,
  materialCode
) {
  for (const zone of zones) {
    const candidates = [
      zone.dividerProduct,
      zone.doorProduct,
      zone.pilasterProduct,
    ];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const normalized =
        normalizeCatalogProduct(
          candidate
        );

      if (
        normalized?.code ===
        materialCode
      ) {
        return normalized;
      }
    }
  }

  return null;
}

function buildPayload({
  projectName,
  zones,
  sheetFormat,
}) {
  return {
    project: {
      id:
        `BANO-${Date.now()}`,

      name:
        projectName.trim() ||
        "Proyecto de baños",
    },

    materials:
      buildMaterials(
        zones,
        sheetFormat
      ),

    zones:
      zones.map(
        (zone) => ({
          id:
            zone.id,

          label:
            zone.label,

          cubicles:
            numberValue(
              zone.cubicles,
              1
            ),

          wallMode:
            getWallMode(
              zone.wallMode
            ).id,

          cubicleWidth:
            numberValue(
              zone.cubicleWidth,
              900
            ),

          cubicleDepth:
            numberValue(
              zone.cubicleDepth,
              1200
            ),

          doorWidth:
            numberValue(
              zone.doorWidth,
              600
            ),

          doorHeight:
            numberValue(
              zone.doorHeight,
              1500
            ),

          dividerHeight:
            numberValue(
              zone.dividerHeight,
              1500
            ),

          pilasterWidth:
            numberValue(
              zone.pilasterWidth,
              150
            ),

          pilasterHeight:
            numberValue(
              zone.pilasterHeight,
              1800
            ),

          dividerMaterialCode:
            getPartMaterialCode({
              thickness:
                zone.dividerThickness,
              product:
                zone.dividerProduct,
            }),

          doorMaterialCode:
            getPartMaterialCode({
              thickness:
                zone.doorThickness,
              product:
                zone.doorProduct,
            }),

          pilasterMaterialCode:
            getPartMaterialCode({
              thickness:
                zone.pilasterThickness,
              product:
                zone.pilasterProduct,
            }),
        })
      ),

    options: {
      maxSheetsPerMaterial:
        200,

      strategy:
        "BEST_AREA_FIT",
    },
  };
}

/* =========================================
   UI HELPERS
========================================= */

function Section({
  number,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-6 py-5 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
            {number}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "number",
  min,
  suffix,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>

      <div className="relative">
        <input
          type={type}
          min={min}
          value={value}
          onChange={
            (event) =>
              onChange(
                event.target.value
              )
          }
          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm font-medium text-black outline-none transition focus:border-black"
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}


function WallModeSelector({
  value,
  onChange,
  cubicles,
}) {
  const selected =
    getWallMode(
      value
    );

  const dividerQuantity =
    getDividerQuantity(
      cubicles,
      selected.id
    );

  return (
    <div className="mt-5 rounded-[22px] border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Configuración de extremos
          </p>

          <p className="mt-1 text-sm text-neutral-500">
            Define cuántos laterales exteriores reemplaza la obra existente.
          </p>
        </div>

        <div className="rounded-full bg-[#eef6df] px-4 py-2 text-xs font-semibold text-[#4f7600]">
          {dividerQuantity}{" "}
          {dividerQuantity === 1
            ? "divisor"
            : "divisores"}{" "}
          HPL
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {WALL_MODES.map(
          (mode) => {
            const active =
              selected.id ===
              mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  onChange(
                    mode.id
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[#679300] bg-[#f4f8eb] ring-1 ring-[#679300]"
                    : "border-neutral-200 bg-neutral-50 hover:border-neutral-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? "border-[#679300] bg-[#679300]"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-black">
                      {mode.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

function ThicknessSelect({
  label,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>

      <select
        value={value}
        onChange={
          (event) =>
            onChange(
              Number(
                event.target.value
              )
            )
        }
        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-black outline-none transition focus:border-black"
      >
        {THICKNESSES.map(
          (thickness) => (
            <option
              key={
                thickness
              }
              value={
                thickness
              }
            >
              {thickness} mm
            </option>
          )
        )}
      </select>
    </label>
  );
}

function HplProductSelect({
  label,
  thickness,
  sheetFormat,
  value,
  onChange,
}) {
  const [
    search,
    setSearch,
  ] = useState(
    ""
  );

  const [
    results,
    setResults,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState(
    ""
  );

  const hasSearchQuery =
    String(
      search ||
      ""
    ).trim().length >= 2;

  useEffect(
    () => {
      const query =
        String(
          search ||
          ""
        ).trim();

      if (
        query.length < 2
      ) {
        return undefined;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            try {
              setLoading(true);
              setSearchError(
                ""
              );

              const response =
                await getProjectQuotationProducts({
                  q: query,
                  limit: 20,
                  signal:
                    controller.signal,
                });

              const products =
                extractProjectProducts(
                  response
                )
                  .map(
                    normalizeCatalogProduct
                  )
                  .filter(Boolean)
                  .filter(
                    (product) => {
                      const thicknessMatches =
                        !product.thickness ||
                        Number(
                          product.thickness
                        ) ===
                          Number(
                            thickness
                          );

                      const formatMatches =
                        (
                          !product.width ||
                          !product.height
                        ) ||
                        (
                          Number(
                            product.width
                          ) ===
                            Number(
                              sheetFormat?.width
                            ) &&
                          Number(
                            product.height
                          ) ===
                            Number(
                              sheetFormat?.height
                            )
                        );

                      return (
                        thicknessMatches &&
                        formatMatches
                      );
                    }
                  );

              setResults(
                products
              );
            } catch (error) {
              if (
                error?.name !==
                "AbortError"
              ) {
                setSearchError(
                  error?.message ||
                  "No fue posible buscar HPL"
                );
              }
            } finally {
              setLoading(false);
            }
          },
          250
        );

      return () => {
        controller.abort();
        window.clearTimeout(
          timer
        );
      };
    },
    [
      search,
      thickness,
      sheetFormat?.width,
      sheetFormat?.height,
    ]
  );

  const selected =
    normalizeCatalogProduct(
      value
    );

  return (
    <div className="mt-4">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>

      {selected ? (
        <div className="rounded-2xl border border-black bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-black">
                {selected.code}
                {selected.finish
                  ? ` · ${selected.finish}`
                  : ""}
              </p>

              <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                {selected.name}
              </p>

              <p className="mt-2 text-[11px] font-medium text-neutral-400">
                {selected.thickness || thickness} mm
                {selected.width &&
                selected.height
                  ? ` · ${selected.width} × ${selected.height} mm`
                  : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(null);
                setSearch(
                  ""
                );
              }}
              className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:border-black hover:text-black"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={`Buscar HPL ${thickness} mm por código o nombre`}
            className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-black outline-none transition focus:border-black"
          />

          {hasSearchQuery &&
            (
              loading ||
              results.length > 0 ||
              searchError
            ) && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
              {loading && (
                <p className="px-4 py-3 text-xs text-neutral-500">
                  Buscando HPL...
                </p>
              )}

              {!loading &&
                searchError && (
                  <p className="px-4 py-3 text-xs text-red-600">
                    {searchError}
                  </p>
                )}

              {!loading &&
                !searchError &&
                results.map(
                  (product) => (
                    <button
                      key={
                        product.id ||
                        product.code
                      }
                      type="button"
                      onClick={() => {
                        onChange(
                          product
                        );
                        setSearch(
                          ""
                        );
                        setResults([]);
                      }}
                      className="flex w-full items-start justify-between gap-4 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-neutral-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-black">
                          {product.code}
                          {product.finish
                            ? ` · ${product.finish}`
                            : ""}
                        </p>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {product.name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-black">
                          {product.thickness || thickness} mm
                        </p>
                        {product.basePrice > 0 && (
                          <p className="mt-1 text-[11px] text-neutral-400">
                            {money(
                              product.basePrice
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================
   VISUALIZACIÓN PLACA
========================================= */

function SheetPreview({
  sheet,
  material,
}) {
  const sheetWidth =
    numberValue(
      material?.sheetWidth,
      SHEET_WIDTH
    );

  const sheetHeight =
    numberValue(
      material?.sheetHeight,
      SHEET_HEIGHT
    );

  const placements =
    sheet?.placements || [];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-black">
          Placa{" "}
          {sheet?.index ??
            sheet?.sheetIndex ??
            ""}
        </p>

        <span className="text-xs text-neutral-400">
          {sheetWidth} ×{" "}
          {sheetHeight} mm
        </span>
      </div>

      <div
        className="relative mx-auto overflow-hidden border-2 border-black bg-white"
        style={{
          width:
            "100%",
          maxWidth:
            260,
          aspectRatio:
            `${sheetWidth} / ${sheetHeight}`,
        }}
      >
        {placements.map(
          (
            placement,
            index
          ) => {
            const left =
              (
                placement.x /
                sheetWidth
              ) * 100;

            const top =
              (
                placement.y /
                sheetHeight
              ) * 100;

            const width =
              (
                placement.width /
                sheetWidth
              ) * 100;

            const height =
              (
                placement.height /
                sheetHeight
              ) * 100;

            return (
              <div
                key={
                  placement.instanceId ||
                  index
                }
                className="absolute overflow-hidden border border-black/30 bg-neutral-200"
                style={{
                  left:
                    `${left}%`,
                  top:
                    `${top}%`,
                  width:
                    `${width}%`,
                  height:
                    `${height}%`,
                }}
                title={
                  `${
                    placement.instanceId ||
                    "Pieza"
                  } · ${
                    placement.width
                  }×${
                    placement.height
                  }`
                }
              >
                <div className="flex h-full w-full items-center justify-center p-1 text-center">
                  <span className="line-clamp-3 text-[8px] font-semibold leading-tight text-black">
                    {
                      placement.instanceId
                    }
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

/* =========================================
   PÁGINA
========================================= */

export default function BathroomQuotationPage() {
  const router = useRouter();
  const [
    projectName,
    setProjectName,
  ] = useState(
    ""
  );

  const [
    zones,
    setZones,
  ] = useState([
    createZone(0),
  ]);

  const [
    sheetFormatId,
    setSheetFormatId,
  ] = useState(
    DEFAULT_SHEET_FORMAT_ID
  );

  const sheetFormat =
    useMemo(
      () =>
        SHEET_FORMATS.find(
          (format) =>
            format.id ===
            sheetFormatId
        ) ||
        SHEET_FORMATS[0],
      [sheetFormatId]
    );

  const [
    optimizing,
    setOptimizing,
  ] = useState(
    false
  );

  const [
    optimizationResponse,
    setOptimizationResponse,
  ] = useState(
    null
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    materialCommercial,
    setMaterialCommercial,
  ] = useState({});

  const [
    cutService,
    setCutService,
  ] = useState({
    enabled: true,
    unitPrice: "",
  });

  const [
    additionalServices,
    setAdditionalServices,
  ] = useState([]);

  const [
    customer,
    setCustomer,
  ] = useState({
    rut: "",
    legalName: "",
    email: "",
    phone: "",
    address: "",
    businessActivity: "",
    commune: "",
    city: "",
    region: "Metropolitana",
  });

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");

  const [
    customerSearchResults,
    setCustomerSearchResults,
  ] = useState([]);

  const [
    customerSearchLoading,
    setCustomerSearchLoading,
  ] = useState(false);

  const [
    customerSearchError,
    setCustomerSearchError,
  ] = useState("");

  const [
    customerSearchOpen,
    setCustomerSearchOpen,
  ] = useState(false);

  const [
    selectedRelbaseCustomer,
    setSelectedRelbaseCustomer,
  ] = useState(null);

  const [
    quotationSettings,
    setQuotationSettings,
  ] = useState({
    reference:
      "Material - Cortes",
    validDays: 30,
    notes: "",
  });

  const [
    creatingQuotation,
    setCreatingQuotation,
  ] = useState(false);

  const [
    quotationError,
    setQuotationError,
  ] = useState("");

  const [
    quotationResult,
    setQuotationResult,
  ] = useState(null);

  const [
    quotationSuccessOpen,
    setQuotationSuccessOpen,
  ] = useState(false);

  useEffect(
    () => {
      const query =
        String(
          customerSearch ||
          ""
        ).trim();

      const selectedCustomer =
        selectedRelbaseCustomer
          ? mapRelbaseCustomer(
              selectedRelbaseCustomer
            )
          : null;

      const matchesSelectedCustomer =
        Boolean(
          selectedCustomer &&
          query &&
          [
            selectedCustomer.legalName,
            selectedCustomer.rut,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .trim()
                  .toLowerCase() ===
                query.toLowerCase()
            )
        );

      if (
        query.length < 2 ||
        matchesSelectedCustomer
      ) {
        return undefined;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            try {
              setCustomerSearchLoading(
                true
              );
              setCustomerSearchError(
                ""
              );

              const response =
                await searchRelbaseCustomers({
                  q: query,
                  query,
                  limit: 10,
                  signal:
                    controller.signal,
                });

              if (
                controller.signal
                  .aborted
              ) {
                return;
              }

              const results =
                extractRelbaseCustomers(
                  response
                );

              setCustomerSearchResults(
                results
              );
              setCustomerSearchOpen(
                true
              );
            } catch (requestError) {
              if (
                requestError?.name ===
                "AbortError"
              ) {
                return;
              }

              setCustomerSearchResults([]);
              setCustomerSearchError(
                requestError?.message ||
                "No fue posible buscar clientes en Relbase"
              );
              setCustomerSearchOpen(
                true
              );
            } finally {
              if (
                !controller.signal
                  .aborted
              ) {
                setCustomerSearchLoading(
                  false
                );
              }
            }
          },
          300
        );

      return () => {
        controller.abort();
        window.clearTimeout(
          timer
        );
      };
    },
    [
      customerSearch,
      selectedRelbaseCustomer,
    ]
  );

  const summary =
    useMemo(
      () =>
        getBathroomOptimizationSummary(
          optimizationResponse
        ),
      [
        optimizationResponse,
      ]
    );

  const cutCalculation =
    useMemo(
      () =>
        calculateBathroomCutService(
          optimizationResponse
        ),
      [optimizationResponse]
    );

  const cutServiceUnitPrice =
    numberValue(
      cutService.unitPrice,
      0
    );

  const cutServiceTotal =
    cutService.enabled
      ? cutCalculation.cutCount *
        cutServiceUnitPrice
      : 0;

  const additionalServicesTotal =
    useMemo(
      () =>
        additionalServices.reduce(
          (
            total,
            service
          ) =>
            total +
            Math.max(
              numberValue(
                service.quantity,
                0
              ),
              0
            ) *
              Math.max(
                numberValue(
                  service.unitPrice,
                  0
                ),
                0
              ),
          0
        ),
      [
        additionalServices,
      ]
    );

  const calculatedPieces =
    useMemo(
      () => {
        return zones.reduce(
          (
            total,
            zone
          ) => {
            const n =
              Math.max(
                numberValue(
                  zone.cubicles,
                  0
                ),
                0
              );

            const dividers =
              getDividerQuantity(
                n,
                zone.wallMode
              );

            return {
              dividers:
                total.dividers +
                dividers,

              doors:
                total.doors +
                n,

              pilasters:
                total.pilasters +
                n * 2,

              total:
                total.total +
                dividers +
                n +
                n * 2,
            };
          },
          {
            dividers: 0,
            doors: 0,
            pilasters: 0,
            total: 0,
          }
        );
      },
      [
        zones,
      ]
    );

  const quotationTotals =
    useMemo(
      () => {
        const materialsGross =
          summary?.materials
            ?.reduce(
              (
                total,
                material
              ) => {
                const commercial =
                  materialCommercial[
                    material.code
                  ] || {};

                const selectedProduct =
                  findSelectedProductForMaterial(
                    zones,
                    material.code
                  );

                const unitPrice =
                  numberValue(
                    commercial.unitPrice ??
                    selectedProduct?.basePrice,
                    0
                  );

                return (
                  total +
                  unitPrice *
                    numberValue(
                      material.sheetsRequired,
                      0
                    )
                );
              },
              0
            ) || 0;

        const gross =
          materialsGross +
          cutServiceTotal +
          additionalServicesTotal;

        const net =
          Math.round(
            gross / 1.19
          );

        return {
          gross,
          net,
          tax:
            gross - net,
        };
      },
      [
        summary,
        materialCommercial,
        zones,
        cutServiceTotal,
        additionalServicesTotal,
      ]
    );

  function addAdditionalService(
    preset = {}
  ) {
    setAdditionalServices(
      (current) => [
        ...current,
        createAdditionalService(
          preset
        ),
      ]
    );

    setQuotationResult(
      null
    );
  }

  function updateAdditionalService(
    serviceId,
    field,
    value
  ) {
    setAdditionalServices(
      (current) =>
        current.map(
          (service) =>
            service.id ===
            serviceId
              ? {
                  ...service,
                  [field]:
                    value,
                }
              : service
        )
    );

    setQuotationResult(
      null
    );
  }

  function removeAdditionalService(
    serviceId
  ) {
    setAdditionalServices(
      (current) =>
        current.filter(
          (service) =>
            service.id !==
            serviceId
        )
    );

    setQuotationResult(
      null
    );
  }

  function updateCommercialMaterial(
    materialCode,
    field,
    value
  ) {
    const selectedProduct =
      findSelectedProductForMaterial(
        zones,
        materialCode
      );

    setMaterialCommercial(
      (current) => ({
        ...current,
        [materialCode]: {
          description:
            selectedProduct?.name ||
            "HPL",
          code:
            selectedProduct?.code ||
            materialCode,
          finish:
            selectedProduct?.finish ||
            "Mate",
          unitPrice:
            selectedProduct?.basePrice > 0
              ? selectedProduct.basePrice
              : "",
          ...(current[
            materialCode
          ] || {}),
          [field]:
            value,
        },
      })
    );

    setQuotationResult(
      null
    );
  }

  function applyRelbaseCustomer(
    relbaseCustomer
  ) {
    const mapped =
      mapRelbaseCustomer(
        relbaseCustomer
      );

    setCustomer(
      (current) => ({
        ...current,
        rut:
          mapped.rut ||
          current.rut,
        legalName:
          mapped.legalName ||
          current.legalName,
        email:
          mapped.email ||
          current.email,
        phone:
          mapped.phone ||
          current.phone,
        address:
          mapped.address ||
          current.address,
        businessActivity:
          mapped.businessActivity ||
          current.businessActivity,
        commune:
          mapped.commune ||
          current.commune,
        city:
          mapped.city ||
          current.city,
        region:
          mapped.region ||
          current.region,
      })
    );

    setSelectedRelbaseCustomer(
      relbaseCustomer
    );
    setCustomerSearch(
      mapped.legalName ||
      mapped.rut ||
      ""
    );
    setCustomerSearchResults([]);
    setCustomerSearchOpen(false);
    setCustomerSearchError("");
    setQuotationResult(null);
  }

  function updateCustomer(
    field,
    value
  ) {
    setCustomer(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateQuotationSetting(
    field,
    value
  ) {
    setQuotationSettings(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateZoneFields(
    index,
    changes
  ) {
    setZones(
      (current) =>
        current.map(
          (
            zone,
            zoneIndex
          ) =>
            zoneIndex ===
            index
              ? {
                  ...zone,
                  ...changes,
                }
              : zone
        )
    );

    setOptimizationResponse(
      null
    );

    setQuotationResult(
      null
    );
  }

  function updateZone(
    index,
    field,
    value
  ) {
    updateZoneFields(
      index,
      {
        [field]:
          value,
      }
    );
  }

  function addZone() {
    setZones(
      (current) => [
        ...current,
        createZone(
          current.length
        ),
      ]
    );

    setOptimizationResponse(
      null
    );
  }

  function duplicateZone(
    index
  ) {
    setZones(
      (current) => {
        const source =
          current[index];

        if (!source) {
          return current;
        }

        const nextIndex =
          current.length;

        return [
          ...current,
          {
            ...source,
            id:
              `zona-${
                nextIndex +
                1
              }`,
            label:
              `Zona ${
                nextIndex +
                1
              }`,
          },
        ];
      }
    );

    setOptimizationResponse(
      null
    );

    setQuotationResult(
      null
    );
  }

  function applyZoneMeasurementsToAll(
    index
  ) {
    setZones(
      (current) => {
        const source =
          current[index];

        if (!source) {
          return current;
        }

        const shared = {
          cubicleDepth:
            source.cubicleDepth,
          dividerHeight:
            source.dividerHeight,
          doorWidth:
            source.doorWidth,
          doorHeight:
            source.doorHeight,
          pilasterWidth:
            source.pilasterWidth,
          pilasterHeight:
            source.pilasterHeight,
          dividerThickness:
            source.dividerThickness,
          dividerProduct:
            source.dividerProduct,
          doorThickness:
            source.doorThickness,
          pilasterThickness:
            source.pilasterThickness,
          doorProduct:
            source.doorProduct,
          pilasterProduct:
            source.pilasterProduct,
        };

        return current.map(
          (zone) => ({
            ...zone,
            ...shared,
          })
        );
      }
    );

    setOptimizationResponse(
      null
    );

    setQuotationResult(
      null
    );
  }

  function removeZone(
    index
  ) {
    setZones(
      (current) =>
        current
          .filter(
            (
              _,
              zoneIndex
            ) =>
              zoneIndex !==
              index
          )
          .map(
            (
              zone,
              zoneIndex
            ) => ({
              ...zone,
              id:
                `zona-${
                  zoneIndex +
                  1
                }`,
              label:
                `Zona ${
                  zoneIndex +
                  1
                }`,
            })
          )
    );

    setOptimizationResponse(
      null
    );
  }

  async function handleOptimize() {
    try {
      setOptimizing(
        true
      );

      setError(
        ""
      );

      for (const zone of zones) {
        const missingMaterial = [
          [
            zone.dividerProduct,
            "divisores",
          ],
          [
            zone.doorProduct,
            "puertas",
          ],
          [
            zone.pilasterProduct,
            "pilastras",
          ],
        ].find(
          ([product]) =>
            !normalizeCatalogProduct(
              product
            )?.code
        );

        if (missingMaterial) {
          throw new Error(
            `Selecciona el HPL para ${missingMaterial[1]} de ${zone.label}`
          );
        }
      }

      const payload =
        buildPayload({
          projectName,
          zones,
          sheetFormat,
        });

      const response =
        await optimizeBathroomProject(
          payload
        );

      setOptimizationResponse(
        response
      );
    } catch (requestError) {
      setOptimizationResponse(
        null
      );

      setError(
        requestError
          ?.message ||
          "No fue posible optimizar los cortes"
      );
    } finally {
      setOptimizing(
        false
      );
    }
  }

  async function handleCreateQuotation() {
    try {
      setCreatingQuotation(
        true
      );

      setQuotationError(
        ""
      );
      setQuotationResult(
        null
      );

      if (
        !summary ||
        !optimizationResponse
          ?.data
      ) {
        throw new Error(
          "Primero debes optimizar los cortes"
        );
      }

      if (
        !projectName.trim()
      ) {
        throw new Error(
          "Ingresa el nombre del proyecto"
        );
      }

      const requiredCustomerFields =
        [
          [
            customer.rut,
            "RUT",
          ],
          [
            customer.legalName,
            "razón social",
          ],
          [
            customer.email,
            "correo",
          ],
          [
            customer.phone,
            "teléfono",
          ],
          [
            customer.address,
            "dirección",
          ],
          [
            customer.businessActivity,
            "giro",
          ],
          [
            customer.commune,
            "comuna",
          ],
          [
            customer.city,
            "ciudad",
          ],
        ];

      const missingCustomer =
        requiredCustomerFields.find(
          ([value]) =>
            !String(
              value || ""
            ).trim()
        );

      if (missingCustomer) {
        throw new Error(
          `Falta ${missingCustomer[1]} del cliente`
        );
      }

      const materialLines =
        summary.materials.map(
          (
            material,
            index
          ) => {
            const commercial =
              materialCommercial[
                material.code
              ] || {};

            const selectedProduct =
              findSelectedProductForMaterial(
                zones,
                material.code
              );

            const unitPrice =
              numberValue(
                commercial.unitPrice ??
                selectedProduct?.basePrice,
                0
              );

            if (
              unitPrice <= 0
            ) {
              throw new Error(
                `Ingresa el valor unitario para ${material.code}`
              );
            }

            return {
              line_type:
                "PRODUCT",
              product_id:
                selectedProduct?.id ||
                null,
              description:
                String(
                  commercial.description ||
                  selectedProduct?.name ||
                  "HPL"
                ).trim(),
              code:
                String(
                  commercial.code ||
                  selectedProduct?.code ||
                  material.code
                ).trim(),
              brand:
                selectedProduct?.brand ||
                "ABET LAMINATI",
              collection:
                selectedProduct?.collection ||
                null,
              finish:
                String(
                  commercial.finish ||
                  selectedProduct?.finish ||
                  "Mate"
                ).trim(),
              thickness_mm:
                material.thickness,
              quantity:
                material.sheetsRequired,
              unit:
                "UN",
              format_label:
                `${sheetFormat.width / 10}x${sheetFormat.height / 10}`,
              width_cm:
                sheetFormat.width / 10,
              height_cm:
                sheetFormat.height / 10,
              unit_price_gross:
                unitPrice,
              tax_rate: 19,
              pricing_mode:
                "UNIT",
              sort_order:
                index,
            };
          }
        );

      if (
        cutService.enabled &&
        cutCalculation.cutCount > 0 &&
        cutServiceUnitPrice <= 0
      ) {
        throw new Error(
          "Ingresa el valor por corte para el servicio SERV-HPL"
        );
      }

      const serviceLines =
        cutService.enabled &&
        cutCalculation.cutCount > 0
          ? [
              {
                line_type:
                  "SERVICE",
                description:
                  "Servicio de corte HPL",
                code:
                  "SERV-HPL",
                brand:
                  "LAMINATI",
                finish:
                  null,
                thickness_mm:
                  null,
                quantity:
                  cutCalculation.cutCount,
                unit:
                  "CORTE",
                format_label:
                  null,
                width_cm:
                  null,
                height_cm:
                  null,
                unit_price_gross:
                  cutServiceUnitPrice,
                tax_rate:
                  19,
                pricing_mode:
                  "UNIT",
                sort_order:
                  materialLines.length,
              },
            ]
          : [];

      const additionalServiceLines =
        additionalServices.map(
          (
            service,
            index
          ) => {
            const description =
              String(
                service.description ||
                ""
              ).trim();

            const code =
              String(
                service.code ||
                ""
              ).trim();

            const quantity =
              numberValue(
                service.quantity,
                0
              );

            const unit =
              String(
                service.unit ||
                ""
              )
                .trim()
                .toUpperCase();

            const unitPrice =
              numberValue(
                service.unitPrice,
                0
              );

            if (!description) {
              throw new Error(
                `Completa la descripción del servicio adicional ${index + 1}`
              );
            }

            if (
              quantity <= 0
            ) {
              throw new Error(
                `La cantidad del servicio "${description}" debe ser mayor a 0`
              );
            }

            if (!unit) {
              throw new Error(
                `Selecciona la unidad del servicio "${description}"`
              );
            }

            if (
              unitPrice < 0
            ) {
              throw new Error(
                `El valor unitario del servicio "${description}" no puede ser negativo`
              );
            }

            return {
              line_type:
                "SERVICE",
              description,
              code:
                code ||
                `SERV-ADIC-${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}`,
              brand:
                "LAMINATI",
              finish:
                null,
              thickness_mm:
                null,
              quantity,
              unit,
              format_label:
                null,
              width_cm:
                null,
              height_cm:
                null,
              unit_price_gross:
                unitPrice,
              tax_rate:
                19,
              pricing_mode:
                "UNIT",
              sort_order:
                materialLines.length +
                serviceLines.length +
                index,
            };
          }
        );

      const lines = [
        ...materialLines,
        ...serviceLines,
        ...additionalServiceLines,
      ];

      const optimizerPayload =
        buildPayload({
          projectName,
          zones,
          sheetFormat,
        });

      const response =
        await createBathroomQuotation({
          quotation_type:
            "PROJECT",
          document_type:
            "FACTURA",
          customer: {
            customer_type:
              "COMPANY",
            name:
              customer.legalName,
            rut:
              customer.rut,
            email:
              customer.email,
            phone:
              customer.phone,
            address:
              customer.address,
          },
          billing: {
            customer_type:
              "COMPANY",
            rut:
              customer.rut,
            legal_name:
              customer.legalName,
            business_activity:
              customer.businessActivity,
            billing_email:
              customer.email,
            phone:
              customer.phone,
            address_line:
              customer.address,
            commune:
              customer.commune,
            city:
              customer.city,
            region:
              customer.region,
            country:
              "Chile",
          },
          project_name:
            projectName.trim(),
          project_reference:
            quotationSettings.reference,
          visible_to_italy:
            false,
          valid_days:
            numberValue(
              quotationSettings.validDays,
              30
            ),
          notes:
            quotationSettings.notes,
          lines,
          bathroom_optimization: {
            configuration: {
              materials:
                optimizerPayload.materials,
              zones:
                optimizerPayload.zones,
              options:
                optimizerPayload.options,
              cut_service: {
                enabled:
                  cutService.enabled,
                code:
                  "SERV-HPL",
                unit:
                  "CORTE",
                cut_count:
                  cutCalculation.cutCount,
                vertical_cuts:
                  cutCalculation.verticalCuts,
                horizontal_cuts:
                  cutCalculation.horizontalCuts,
                sheets_analyzed:
                  cutCalculation.sheetsAnalyzed,
                unit_price_gross:
                  cutServiceUnitPrice,
                total_gross:
                  cutServiceTotal,
              },
            },
            optimization:
              optimizationResponse.data,
          },
        });

      const createdQuotation =
        response?.quotation ||
        response?.data?.quotation ||
        response?.data?.data?.quotation ||
        (response?.id
          ? response
          : null);

      if (!createdQuotation) {
        throw new Error(
          "La cotización fue procesada, pero el backend no devolvió sus datos"
        );
      }

      setQuotationResult({
        ...(response || {}),
        quotation:
          createdQuotation,
      });

      setQuotationSuccessOpen(
        true
      );
    } catch (requestError) {
      setQuotationError(
        requestError
          ?.message ||
          "No fue posible crear la cotización"
      );
    } finally {
      setCreatingQuotation(
        false
      );
    }
  }

  function handleGoToQuotations() {
    setQuotationSuccessOpen(
      false
    );

    router.push(
      "/admin/showroom/cotizaciones"
    );
  }

  async function handleOpenPdf() {
    const quotationId =
      quotationResult
        ?.quotation
        ?.id;

    if (!quotationId) {
      return;
    }

    try {
      setQuotationError(
        ""
      );

      const blob =
        await getBathroomQuotationPdfBlob(
          quotationId
        );

      const url =
        URL.createObjectURL(
          blob
        );

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        60000
      );
    } catch (requestError) {
      setQuotationError(
        requestError
          ?.message ||
          "No fue posible abrir el PDF"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 rounded-[30px] bg-black px-6 py-7 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Laminati · Cotizaciones
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Proyecto de baños
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Configura las baterías de baño,
              materiales y espesores. El sistema
              calculará automáticamente las piezas
              y optimizará las placas HPL.
            </p>
          </div>

          <Link
            href="/admin/cotizaciones"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white hover:text-black"
          >
            Volver a cotizaciones
          </Link>
        </div>

        <div className="space-y-6">
          {/* 01 */}
          <Section
            number="01"
            title="Datos del proyecto"
            subtitle="Identificación inicial de la cotización de baños."
          >
            <div className="max-w-2xl">
              <Field
                type="text"
                label="Nombre del proyecto"
                value={
                  projectName
                }
                onChange={
                  setProjectName
                }
              />
            </div>
          </Section>

          {/* 02 */}
          <Section
            number="02"
            title="Configuración de baños"
            subtitle="Cada zona corresponde a una batería independiente de cubículos."
          >
            <div className="space-y-5">
              {zones.map(
                (
                  zone,
                  index
                ) => (
                  <div
                    key={
                      zone.id
                    }
                    className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6"
                  >
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                          Batería
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-black">
                          {
                            zone.label
                          }
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full bg-[#eef6df] px-3 py-2 text-xs font-semibold text-[#4f7600]">
                          {numberValue(
                            zone.cubicles,
                            0
                          )}{" "}
                          cubículos
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            duplicateZone(
                              index
                            )
                          }
                          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-black transition hover:border-black"
                        >
                          Duplicar zona
                        </button>

                        {zones.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              applyZoneMeasurementsToAll(
                                index
                              )
                            }
                            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-black hover:text-black"
                          >
                            Aplicar medidas a todas
                          </button>
                        )}

                        {zones.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeZone(
                                index
                              )
                            }
                            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-500 transition hover:border-red-200 hover:text-red-600"
                          >
                            Eliminar zona
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="Cubículos"
                        min="1"
                        value={
                          zone.cubicles
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "cubicles",
                              value
                            )
                        }
                      />

                      <Field
                        label="Profundidad divisor lateral"
                        suffix="mm"
                        value={
                          zone.cubicleDepth
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "cubicleDepth",
                              value
                            )
                        }
                      />

                      <Field
                        label="Altura divisor lateral"
                        suffix="mm"
                        value={
                          zone.dividerHeight
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "dividerHeight",
                              value
                            )
                        }
                      />

                      <Field
                        label="Ancho puerta"
                        suffix="mm"
                        value={
                          zone.doorWidth
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "doorWidth",
                              value
                            )
                        }
                      />

                      <Field
                        label="Altura puerta"
                        suffix="mm"
                        value={
                          zone.doorHeight
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "doorHeight",
                              value
                            )
                        }
                      />

                      <Field
                        label="Ancho pilastra"
                        suffix="mm"
                        value={
                          zone.pilasterWidth
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "pilasterWidth",
                              value
                            )
                        }
                      />

                      <Field
                        label="Altura pilastra"
                        suffix="mm"
                        value={
                          zone.pilasterHeight
                        }
                        onChange={
                          (
                            value
                          ) =>
                            updateZone(
                              index,
                              "pilasterHeight",
                              value
                            )
                        }
                      />
                    </div>

                    <WallModeSelector
                      value={
                        zone.wallMode
                      }
                      cubicles={
                        zone.cubicles
                      }
                      onChange={
                        (value) =>
                          updateZone(
                            index,
                            "wallMode",
                            value
                          )
                      }
                    />
                  </div>
                )
              )}

              <button
                type="button"
                onClick={
                  addZone
                }
                className="inline-flex h-11 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-black transition hover:border-black"
              >
                + Agregar zona
              </button>
            </div>
          </Section>

          {/* 03 */}
          <Section
            number="03"
            title="Materiales y espesores"
            subtitle="Selecciona el espesor y el HPL real del catálogo para divisores, puertas y pilastras."
          >
            <div className="space-y-5">
              {zones.map(
                (
                  zone,
                  index
                ) => (
                  <div
                    key={
                      zone.id
                    }
                    className="grid gap-4 rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 sm:grid-cols-3"
                  >
                    <div className="sm:col-span-3">
                      <p className="text-sm font-semibold text-black">
                        {
                          zone.label
                        }
                      </p>
                    </div>

                    <div>
                      <ThicknessSelect
                        label="Divisores"
                        value={
                          zone.dividerThickness
                        }
                        onChange={
                          (value) =>
                            updateZoneFields(
                              index,
                              {
                                dividerThickness:
                                  value,
                                dividerProduct:
                                  null,
                              }
                            )
                        }
                      />

                      <HplProductSelect
                        label="HPL para divisores"
                        thickness={
                          zone.dividerThickness
                        }
                        sheetFormat={
                          sheetFormat
                        }
                        value={
                          zone.dividerProduct
                        }
                        onChange={(product) =>
                          updateZoneFields(
                            index,
                            {
                              dividerProduct:
                                product,
                              ...(product?.thickness
                                ? {
                                    dividerThickness:
                                      product.thickness,
                                  }
                                : {}),
                            }
                          )
                        }
                      />
                    </div>

                    <div>
                      <ThicknessSelect
                        label="Puertas"
                        value={
                          zone.doorThickness
                        }
                        onChange={
                          (value) =>
                            updateZoneFields(
                              index,
                              {
                                doorThickness:
                                  value,
                                doorProduct:
                                  null,
                              }
                            )
                        }
                      />

                      <HplProductSelect
                        label="HPL para puertas"
                        thickness={
                          zone.doorThickness
                        }
                        sheetFormat={
                          sheetFormat
                        }
                        value={
                          zone.doorProduct
                        }
                        onChange={(product) =>
                          updateZoneFields(
                            index,
                            {
                              doorProduct:
                                product,
                              ...(product?.thickness
                                ? {
                                    doorThickness:
                                      product.thickness,
                                  }
                                : {}),
                            }
                          )
                        }
                      />
                    </div>

                    <div>
                      <ThicknessSelect
                        label="Pilastras"
                        value={
                          zone.pilasterThickness
                        }
                        onChange={
                          (value) =>
                            updateZoneFields(
                              index,
                              {
                                pilasterThickness:
                                  value,
                                pilasterProduct:
                                  null,
                              }
                            )
                        }
                      />

                      <HplProductSelect
                        label="HPL para pilastras"
                        thickness={
                          zone.pilasterThickness
                        }
                        sheetFormat={
                          sheetFormat
                        }
                        value={
                          zone.pilasterProduct
                        }
                        onChange={(product) =>
                          updateZoneFields(
                            index,
                            {
                              pilasterProduct:
                                product,
                              ...(product?.thickness
                                ? {
                                    pilasterThickness:
                                      product.thickness,
                                  }
                                : {}),
                            }
                          )
                        }
                      />
                    </div>
                  </div>
                )
              )}

              <div className="grid gap-4 rounded-2xl bg-black px-5 py-4 text-sm text-white sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                    Formato de placa
                  </span>

                  <select
                    value={
                      sheetFormatId
                    }
                    onChange={
                      (event) => {
                        setSheetFormatId(
                          event.target.value
                        );

                        setOptimizationResponse(
                          null
                        );

                        setQuotationResult(
                          null
                        );
                      }
                    }
                    className="h-12 w-full rounded-2xl border border-white/20 bg-white px-4 text-sm font-semibold text-black outline-none sm:min-w-[280px]"
                  >
                    {SHEET_FORMATS.map(
                      (format) => (
                        <option
                          key={
                            format.id
                          }
                          value={
                            format.id
                          }
                        >
                          {
                            format.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="rounded-2xl border border-white/10 px-5 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/40">
                    Corte
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {DEFAULT_KERF} mm
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* 04 */}
          <Section
            number="04"
            title="Piezas calculadas"
            subtitle="La cantidad se genera automáticamente según los cubículos definidos por zona."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Divisores",
                  calculatedPieces.dividers,
                ],
                [
                  "Puertas",
                  calculatedPieces.doors,
                ],
                [
                  "Pilastras",
                  calculatedPieces.pilasters,
                ],
                [
                  "Total piezas",
                  calculatedPieces.total,
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={
                      label
                    }
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      {label}
                    </p>

                    <p className="mt-2 text-3xl font-semibold text-black">
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>

            <p className="mt-5 text-xs leading-5 text-neutral-500">
              Los divisores se calculan según la configuración de extremos:
              entre muros = N - 1, un muro = N y sin muros = N + 1.
              Puertas = N y pilastras = 2N.
            </p>
          </Section>

          {/* 05 */}
          <Section
            number="05"
            title="Optimización de cortes"
            subtitle="Envía la geometría al Cut Optimizer local y calcula la distribución de placas."
          >
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={
                  optimizing
                }
                onClick={
                  handleOptimize
                }
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#679300] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {optimizing
                  ? "Optimizando..."
                  : "Optimizar cortes"}
              </button>

              {summary && (
                <span className="text-xs font-medium text-neutral-500">
                  Optimizer{" "}
                  {
                    summary.optimizerVersion
                  }
                </span>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {summary && (
              <div className="mt-8 space-y-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-black p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.12em] text-white/50">
                      Placas necesarias
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                      {
                        summary.sheetsRequired
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-400">
                      Piezas
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                      {
                        summary.pieces
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-neutral-400">
                      Materiales
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                      {
                        summary.materialGroups
                      }
                    </p>
                  </div>
                </div>

                {summary.materials.map(
                  (
                    material,
                    materialIndex
                  ) => {
                    const rawGroup =
                      optimizationResponse
                        ?.data
                        ?.materials?.[
                          materialIndex
                        ];

                    return (
                      <div
                        key={
                          `${material.code}-${materialIndex}`
                        }
                        className="rounded-[26px] border border-neutral-200"
                      >
                        <div className="grid gap-4 border-b border-neutral-100 p-6 sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-neutral-400">
                              Material
                            </p>
                            <p className="mt-1 font-semibold">
                              {
                                material.code
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">
                              Espesor
                            </p>
                            <p className="mt-1 font-semibold">
                              {
                                material.thickness
                              }{" "}
                              mm
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">
                              Placas
                            </p>
                            <p className="mt-1 font-semibold">
                              {
                                material.sheetsRequired
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-neutral-400">
                              Aprovechamiento
                            </p>
                            <p className="mt-1 font-semibold text-[#679300]">
                              {
                                material.utilization
                              }
                              %
                            </p>

                            <p className="mt-1 text-xs text-neutral-400">
                              Desperdicio{" "}
                              {
                                material.wastePercentage
                              }
                              %
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {rawGroup
                            ?.optimization
                            ?.sheets
                            ?.map(
                              (
                                sheet,
                                sheetIndex
                              ) => (
                                <SheetPreview
                                  key={
                                    sheetIndex
                                  }
                                  sheet={{
                                    ...sheet,
                                    index:
                                      sheetIndex +
                                      1,
                                  }}
                                  material={
                                    rawGroup.material
                                  }
                                />
                              )
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </Section>

          {/* 06 */}
          {summary && (
            <Section
              number="06"
              title="Valorización comercial"
              subtitle="La cantidad de placas proviene del optimizador. Los HPL seleccionados precargan código, acabado y precio; los valores siguen siendo editables antes de crear la cotización."
            >
              <div className="space-y-5">
                {summary.materials.map(
                  (material) => {
                    const commercial =
                      materialCommercial[
                        material.code
                      ] || {};

                    const selectedProduct =
                      findSelectedProductForMaterial(
                        zones,
                        material.code
                      );

                    const unitPrice =
                      numberValue(
                        commercial.unitPrice ??
                        selectedProduct?.basePrice,
                        0
                      );

                    const lineTotal =
                      unitPrice *
                      material.sheetsRequired;

                    return (
                      <div
                        key={
                          material.code
                        }
                        className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6"
                      >
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                              Material optimizado
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-black">
                              {material.code}
                              {" · "}
                              {material.thickness} mm
                            </h3>
                          </div>

                          <div className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                            {material.sheetsRequired}{" "}
                            placas
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Field
                            type="text"
                            label="Descripción"
                            value={
                              commercial.description ??
                              selectedProduct?.name ??
                              "HPL"
                            }
                            onChange={
                              (value) =>
                                updateCommercialMaterial(
                                  material.code,
                                  "description",
                                  value
                                )
                            }
                          />

                          <Field
                            type="text"
                            label="Código HPL"
                            value={
                              commercial.code ??
                              selectedProduct?.code ??
                              material.code
                            }
                            onChange={
                              (value) =>
                                updateCommercialMaterial(
                                  material.code,
                                  "code",
                                  value
                                )
                            }
                          />

                          <Field
                            type="text"
                            label="Acabado"
                            value={
                              commercial.finish ??
                              selectedProduct?.finish ??
                              "Mate"
                            }
                            onChange={
                              (value) =>
                                updateCommercialMaterial(
                                  material.code,
                                  "finish",
                                  value
                                )
                            }
                          />

                          <Field
                            label="Valor unitario bruto"
                            suffix="CLP"
                            value={
                              commercial.unitPrice ??
                              (selectedProduct?.basePrice > 0
                                ? selectedProduct.basePrice
                                : "")
                            }
                            onChange={
                              (value) =>
                                updateCommercialMaterial(
                                  material.code,
                                  "unitPrice",
                                  value
                                )
                            }
                          />
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                            <p className="text-xs text-neutral-400">
                              Cantidad automática
                            </p>
                            <p className="mt-1 font-semibold">
                              {material.sheetsRequired}{" "}
                              placas
                            </p>
                          </div>

                          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                            <p className="text-xs text-neutral-400">
                              Valor unitario
                            </p>
                            <p className="mt-1 font-semibold">
                              {money(unitPrice)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                            <p className="text-xs text-neutral-400">
                              Total línea
                            </p>
                            <p className="mt-1 font-semibold">
                              {money(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            
              <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Servicio
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-black">
                      Servicio de corte
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      La cantidad se calcula automáticamente desde la distribución real del optimizador.
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-pressed={cutService.enabled}
                    onClick={() => {
                      setCutService((current) => ({
                        ...current,
                        enabled: !current.enabled,
                      }));
                      setQuotationResult(null);
                    }}
                    className="inline-flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-black"
                  >
                    <span
                      className={`relative h-6 w-11 rounded-full transition ${
                        cutService.enabled
                          ? "bg-[#679300]"
                          : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                          cutService.enabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </span>
                    Optimización automática
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Cantidad de cortes calculada
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black">
                      {cutCalculation.cutCount}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {cutCalculation.verticalCuts} verticales · {cutCalculation.horizontalCuts} horizontales
                    </p>
                  </div>

                  <Field
                    label="Valor por corte"
                    suffix="CLP"
                    value={cutService.unitPrice}
                    onChange={(value) => {
                      setCutService((current) => ({
                        ...current,
                        unitPrice: value,
                      }));
                      setQuotationResult(null);
                    }}
                  />

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Total servicio
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black">
                      {money(
                        cutService.enabled
                          ? cutServiceTotal
                          : 0
                      )}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-neutral-400">
                  Calculado automáticamente a partir de los patrones optimizados de divisores, puertas y pilastras. Código de servicio: SERV-HPL.
                </p>
              </div>

              <div className="mt-6 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Servicios adicionales
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-black">
                      Servicios y cargos del proyecto
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                      Agrega quincallería, instalación, traslado u otros servicios. Se suman automáticamente a la cotización y aparecen en el PDF como líneas de servicio.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ADDITIONAL_SERVICE_PRESETS.map(
                      (preset) => (
                        <button
                          key={
                            preset.code
                          }
                          type="button"
                          onClick={() =>
                            addAdditionalService(
                              preset
                            )
                          }
                          className="inline-flex h-10 items-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
                        >
                          +{" "}
                          {
                            preset.description
                          }
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        addAdditionalService()
                      }
                      className="inline-flex h-10 items-center rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-[#679300]"
                    >
                      + Otro servicio
                    </button>
                  </div>
                </div>

                {additionalServices.length ===
                0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-center">
                    <p className="text-sm font-medium text-neutral-500">
                      No hay servicios adicionales.
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      El servicio de corte SERV-HPL se mantiene independiente y automático.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {additionalServices.map(
                      (
                        service,
                        index
                      ) => {
                        const quantity =
                          Math.max(
                            numberValue(
                              service.quantity,
                              0
                            ),
                            0
                          );

                        const unitPrice =
                          Math.max(
                            numberValue(
                              service.unitPrice,
                              0
                            ),
                            0
                          );

                        const lineTotal =
                          quantity *
                          unitPrice;

                        return (
                          <div
                            key={
                              service.id
                            }
                            className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4 sm:p-5"
                          >
                            <div className="mb-4 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Servicio{" "}
                                  {index +
                                    1}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-black">
                                  {service.description ||
                                    "Nuevo servicio"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeAdditionalService(
                                    service.id
                                  )
                                }
                                className="inline-flex h-9 items-center rounded-full border border-red-200 bg-white px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                              <Field
                                label="Descripción"
                                type="text"
                                value={
                                  service.description
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateAdditionalService(
                                    service.id,
                                    "description",
                                    value
                                  )
                                }
                              />

                              <Field
                                label="Código"
                                type="text"
                                value={
                                  service.code
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateAdditionalService(
                                    service.id,
                                    "code",
                                    value
                                  )
                                }
                              />

                              <Field
                                label="Cantidad"
                                min="0.001"
                                value={
                                  service.quantity
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateAdditionalService(
                                    service.id,
                                    "quantity",
                                    value
                                  )
                                }
                              />

                              <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                                  Unidad
                                </span>

                                <select
                                  value={
                                    service.unit
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateAdditionalService(
                                      service.id,
                                      "unit",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-black outline-none transition focus:border-black"
                                >
                                  {SERVICE_UNITS.map(
                                    (
                                      unit
                                    ) => (
                                      <option
                                        key={
                                          unit
                                        }
                                        value={
                                          unit
                                        }
                                      >
                                        {
                                          unit
                                        }
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>

                              <Field
                                label="Valor unitario"
                                suffix="CLP"
                                min="0"
                                value={
                                  service.unitPrice
                                }
                                onChange={(
                                  value
                                ) =>
                                  updateAdditionalService(
                                    service.id,
                                    "unitPrice",
                                    value
                                  )
                                }
                              />
                            </div>

                            <div className="mt-4 flex justify-end">
                              <div className="min-w-[220px] rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                                  Total servicio
                                </p>
                                <p className="mt-1 text-xl font-semibold text-black">
                                  {money(
                                    lineTotal
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}

                    <div className="flex justify-end">
                      <div className="min-w-[260px] rounded-2xl bg-black px-5 py-4 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                          Total servicios adicionales
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                          {money(
                            additionalServicesTotal
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

</Section>
          )}

          {/* 07 */}
          {summary && (
            <Section
              number="07"
              title="Cliente y datos de cotización"
              subtitle="Se utilizarán los mismos datos y formato de la cotización de proyecto actual de Laminati."
            >
              <div className="relative mb-6 rounded-[22px] border border-neutral-200 bg-neutral-50 p-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-neutral-700">
                    Buscar cliente en Relbase por nombre o RUT
                  </span>

                  <div className="relative">
                    <input
                      type="search"
                      value={
                        customerSearch
                      }
                      onChange={(event) => {
                        const nextValue =
                          event.target.value;

                        setCustomerSearch(
                          nextValue
                        );
                        setSelectedRelbaseCustomer(
                          null
                        );

                        if (
                          String(nextValue)
                            .trim().length < 2
                        ) {
                          setCustomerSearchResults([]);
                          setCustomerSearchError("");
                          setCustomerSearchOpen(false);
                          setCustomerSearchLoading(false);
                        }
                      }}
                      onFocus={() => {
                        if (
                          customerSearchResults.length >
                          0
                        ) {
                          setCustomerSearchOpen(
                            true
                          );
                        }
                      }}
                      placeholder="Ej. Cumbres, 76.838.035-K"
                      className="h-12 w-full rounded-2xl border border-neutral-300 bg-white px-4 pr-12 text-sm font-medium text-black outline-none transition focus:border-black"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      {customerSearchLoading
                        ? "…"
                        : "⌕"}
                    </span>
                  </div>
                </label>

                {selectedRelbaseCustomer && (
                  <p className="mt-3 text-xs font-medium text-[#5f8900]">
                    Cliente Relbase seleccionado. Los datos se cargaron automáticamente y puedes completarlos o corregirlos antes de crear la cotización.
                  </p>
                )}

                {customerSearchOpen &&
                  String(
                    customerSearch ||
                    ""
                  ).trim().length >=
                    2 && (
                  <div className="absolute left-5 right-5 top-[calc(100%-6px)] z-40 max-h-80 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl">
                    {customerSearchLoading && (
                      <p className="px-5 py-4 text-sm text-neutral-500">
                        Buscando clientes en Relbase...
                      </p>
                    )}

                    {!customerSearchLoading &&
                      customerSearchError && (
                      <p className="px-5 py-4 text-sm text-red-600">
                        {customerSearchError}
                      </p>
                    )}

                    {!customerSearchLoading &&
                      !customerSearchError &&
                      customerSearchResults.length ===
                        0 && (
                      <p className="px-5 py-4 text-sm text-neutral-500">
                        No se encontraron clientes en Relbase. Puedes completar los datos manualmente.
                      </p>
                    )}

                    {!customerSearchLoading &&
                      !customerSearchError &&
                      customerSearchResults.map(
                        (item, resultIndex) => {
                          const mapped =
                            mapRelbaseCustomer(
                              item
                            );

                          const typeLabel =
                            mapped.type ===
                            "company"
                              ? "Empresa"
                              : mapped.type ===
                                  "person"
                                ? "Persona"
                                : "Cliente";

                          return (
                            <button
                              key={
                                mapped.id ||
                                mapped.rut ||
                                `${mapped.legalName}-${resultIndex}`
                              }
                              type="button"
                              onClick={() =>
                                applyRelbaseCustomer(
                                  item
                                )
                              }
                              className="block w-full border-b border-neutral-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-neutral-50"
                            >
                              <p className="text-sm font-semibold text-black">
                                {mapped.legalName ||
                                  "Cliente sin nombre"}
                              </p>

                              <p className="mt-1 text-xs text-neutral-500">
                                {mapped.rut ||
                                  "Sin RUT"}
                                {" · "}
                                {typeLabel}
                              </p>

                              {(mapped.address ||
                                mapped.commune ||
                                mapped.city) && (
                                <p className="mt-1 text-xs text-neutral-400">
                                  {[
                                    mapped.address,
                                    mapped.commune,
                                    mapped.city,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </button>
                          );
                        }
                      )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  type="text"
                  label="Razón social"
                  value={
                    customer.legalName
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "legalName",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="RUT"
                  value={customer.rut}
                  onChange={
                    (value) =>
                      updateCustomer(
                        "rut",
                        value
                      )
                  }
                />

                <Field
                  type="email"
                  label="Correo"
                  value={
                    customer.email
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "email",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Teléfono"
                  value={
                    customer.phone
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "phone",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Dirección"
                  value={
                    customer.address
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "address",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Giro"
                  value={
                    customer.businessActivity
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "businessActivity",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Comuna"
                  value={
                    customer.commune
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "commune",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Ciudad"
                  value={
                    customer.city
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "city",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Región"
                  value={
                    customer.region
                  }
                  onChange={
                    (value) =>
                      updateCustomer(
                        "region",
                        value
                      )
                  }
                />

                <Field
                  type="text"
                  label="Referencia"
                  value={
                    quotationSettings.reference
                  }
                  onChange={
                    (value) =>
                      updateQuotationSetting(
                        "reference",
                        value
                      )
                  }
                />

                <Field
                  label="Vigencia"
                  suffix="días"
                  min="1"
                  value={
                    quotationSettings.validDays
                  }
                  onChange={
                    (value) =>
                      updateQuotationSetting(
                        "validDays",
                        value
                      )
                  }
                />
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Observaciones
                </span>
                <textarea
                  value={
                    quotationSettings.notes
                  }
                  onChange={
                    (event) =>
                      updateQuotationSetting(
                        "notes",
                        event.target.value
                      )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black outline-none transition focus:border-black"
                />
              </label>
            </Section>
          )}

          {/* 08 */}
          {summary && (
            <Section
              number="08"
              title="Resumen económico y PDF"
              subtitle="El frontend muestra una referencia. El backend vuelve a calcular neto, IVA y total al crear la cotización."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-xs uppercase tracking-[0.12em] text-neutral-400">
                    Neto estimado
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {money(
                      quotationTotals.net
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-xs uppercase tracking-[0.12em] text-neutral-400">
                    IVA 19%
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {money(
                      quotationTotals.tax
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/50">
                    Total cotización
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {money(
                      quotationTotals.gross
                    )}
                  </p>
                </div>
              </div>

              {quotationError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {quotationError}
                </div>
              )}

              {quotationResult
                ?.quotation && (
                <div className="mt-5 rounded-[24px] border border-[#679300]/30 bg-[#679300]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#679300]">
                    Cotización creada
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold text-black">
                        {
                          quotationResult
                            .quotation
                            .quote_number
                        }
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Total{" "}
                        {money(
                          quotationResult
                            .quotation
                            .total
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleOpenPdf
                      }
                      className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#679300]"
                    >
                      Ver PDF
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    creatingQuotation ||
                    quotationTotals.gross <= 0
                  }
                  onClick={
                    handleCreateQuotation
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#679300] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creatingQuotation
                    ? "Creando cotización..."
                    : "Crear cotización real"}
                </button>

                <p className="flex items-center text-xs text-neutral-500">
                  El PDF conservará el formato PROJECT actual y añadirá el anexo técnico del optimizador.
                </p>
              </div>
            </Section>
          )}
        </div>
      </div>

      {quotationSuccessOpen &&
        quotationResult?.quotation && (
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[4px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bathroom-quotation-success-title"
          >
            <div className="w-full max-w-[500px] rounded-[30px] bg-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-9">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 10v12" />
                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                  </svg>
                </span>

                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#679300]">
                  Cotización creada
                </p>
              </div>

              <h2
                id="bathroom-quotation-success-title"
                className="mt-4 text-[28px] font-semibold leading-tight text-black"
              >
                {quotationResult.quotation.quote_number ||
                  quotationResult.quotation.quotation_number ||
                  quotationResult.quotation.number ||
                  "Cotización generada"}
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500">
                Tu cotización se creó de forma correcta y ya está disponible en el listado de cotizaciones.
              </p>

              <div className="mt-6 rounded-[20px] border border-neutral-200 bg-neutral-50 p-5">
                <div>
                  <p className="text-xs text-neutral-500">
                    Cliente
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {customer.legalName ||
                      quotationResult.quotation.customer_name ||
                      "Cliente"}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-neutral-500">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-semibold text-black">
                    {money(
                      quotationResult.quotation.total ||
                      quotationResult.quotation.total_gross ||
                      quotationTotals.gross
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setQuotationSuccessOpen(
                      false
                    )
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 text-sm font-medium text-black transition hover:border-neutral-400"
                >
                  Permanecer aquí
                </button>

                <button
                  type="button"
                  onClick={
                    handleGoToQuotations
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white transition hover:bg-[#679300]"
                >
                  Ir a cotizaciones
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
