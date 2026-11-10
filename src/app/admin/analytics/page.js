"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAdminAnalyticsCollections,
  getAdminAnalyticsDevices,
  getAdminAnalyticsLocations,
  getAdminAnalyticsOverview,
  getAdminAnalyticsProducts,
  getAdminAnalyticsSearches,
  getAdminAnalyticsSources,
} from "@/services/adminAnalytics.service";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
];

const LAMINATI_CHART_COLORS = [
  "#7A1F8A",
  "#7FA341",
  "#E4AA25",
  "#55A9A3",
  "#C7423A",
  "#3B8EAD",
];

const DEVICE_COLORS = [
  LAMINATI_CHART_COLORS[0],
  LAMINATI_CHART_COLORS[3],
  LAMINATI_CHART_COLORS[2],
  LAMINATI_CHART_COLORS[5],
];

const compactNumber = new Intl.NumberFormat(
  "es-CL",
  {
    notation: "compact",
    maximumFractionDigits: 1,
  }
);

const regularNumber = new Intl.NumberFormat(
  "es-CL",
  {
    maximumFractionDigits: 0,
  }
);

const unwrap = (value) =>
  value?.data ?? value ?? {};

const toNumber = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const pick = (
  object,
  keys,
  fallback = null
) => {
  for (const key of keys) {
    const value =
      object?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const rowsFrom = (
  payload,
  keys = []
) => {
  const value =
    unwrap(payload);

  if (Array.isArray(value)) {
    return value;
  }

  for (const key of [
    ...keys,
    "items",
    "rows",
    "results",
  ]) {
    if (
      Array.isArray(
        value?.[key]
      )
    ) {
      return value[key];
    }
  }

  return [];
};

const formatMetric = (value) =>
  compactNumber.format(
    toNumber(value)
  );

const formatCount = (value) =>
  regularNumber.format(
    toNumber(value)
  );

const formatPercent = (
  value,
  digits = 1
) =>
  `${toNumber(value).toLocaleString(
    "es-CL",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        digits,
    }
  )}%`;

const safePercent = (
  numerator,
  denominator
) => {
  const base =
    toNumber(denominator);

  if (base <= 0) {
    return 0;
  }

  return (
    (toNumber(numerator) /
      base) *
    100
  );
};

const normalizeDateKey = (
  value
) => {
  if (!value) {
    return "";
  }

  const raw =
    String(value);

  const isoMatch =
    raw.match(
      /^\d{4}-\d{2}-\d{2}/
    );

  if (isoMatch) {
    return isoMatch[0];
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return raw;
  }

  const year =
    parsed.getFullYear();

  const month =
    String(
      parsed.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      parsed.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateLabel = (
  dateKey
) => {
  const parsed =
    new Date(
      `${dateKey}T12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return dateKey;
  }

  return parsed
    .toLocaleDateString(
      "es-CL",
      {
        day: "numeric",
        month: "short",
      }
    )
    .replace(".", "");
};

const humanizeSlug = (
  value
) => {
  const normalized =
    String(value || "")
      .replace(/[-_]+/g, " ")
      .trim();

  if (!normalized) {
    return "Sin identificar";
  }

  return normalized
    .split(" ")
    .map((part) =>
      part
        ? part
            .charAt(0)
            .toUpperCase() +
          part.slice(1)
        : ""
    )
    .join(" ");
};

function Icon({ type }) {
  const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke:
      "currentColor",
    strokeWidth: "1.7",
    strokeLinecap:
      "round",
    strokeLinejoin:
      "round",
    className:
      "h-[18px] w-[18px]",
    "aria-hidden": true,
  };

  if (
    type === "sessions"
  ) {
    return (
      <svg {...base}>
        <circle
          cx="8"
          cy="8"
          r="3"
        />
        <path d="M3 19a5 5 0 0 1 10 0" />
        <path d="M16 7h5M18.5 4.5v5" />
      </svg>
    );
  }

  if (
    type === "pages"
  ) {
    return (
      <svg {...base}>
        <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (
    type === "products"
  ) {
    return (
      <svg {...base}>
        <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" />
        <path d="m4.8 7.7 7.2 4.2 7.2-4.2M12 12v8.4" />
      </svg>
    );
  }

  if (
    type === "search"
  ) {
    return (
      <svg {...base}>
        <circle
          cx="11"
          cy="11"
          r="7"
        />
        <path d="m16.5 16.5 4.5 4.5" />
      </svg>
    );
  }

  if (
    type === "checkout"
  ) {
    return (
      <svg {...base}>
        <path d="M4 5h2l2 10h9l2-7H7" />
        <circle
          cx="10"
          cy="19"
          r="1"
        />
        <circle
          cx="17"
          cy="19"
          r="1"
        />
      </svg>
    );
  }

  if (
    type === "orders"
  ) {
    return (
      <svg {...base}>
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2.5"
        />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    );
  }

  return (
    <svg {...base}>
      <path d="M4 19V10M10 19V5M16 19v-7M22 19V8M3 19h20" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  helper,
  badge = null,
  accent = "#111111",
}) {
  return (
    <article className="min-w-0 rounded-[26px] border border-black/[0.06] bg-white px-6 py-6 shadow-[0_2px_5px_rgba(0,0,0,0.035)]">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor:
              accent,
          }}
        />

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <p className="text-[34px] font-semibold leading-none tracking-[-0.055em] text-neutral-950">
          {value}
        </p>

        {badge ? (
          <span className="mb-0.5 rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-semibold text-neutral-500">
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-4 min-h-5 text-[11px] leading-5 text-neutral-400">
        {helper}
      </p>
    </article>
  );
}

function DashboardCard({
  eyebrow = null,
  title,
  description,
  children,
  className = "",
  action = null,
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_2px_5px_rgba(0,0,0,0.03)] ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-black/[0.045] px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          {eyebrow ? (
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              {eyebrow}
            </p>
          ) : null}

          <h2 className={`${eyebrow ? "mt-2" : ""} text-[20px] font-semibold tracking-[-0.035em] text-neutral-950`}>
            {title}
          </h2>

          {description ? (
            <p className="mt-1.5 text-xs leading-5 text-neutral-400">
              {description}
            </p>
          ) : null}
        </div>

        {action}
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-7">
        {children}
      </div>
    </section>
  );
}

function EmptyState({
  message,
  compact = false,
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center ${
        compact
          ? "min-h-28"
          : "min-h-52"
      }`}
    >
      <p className="max-w-sm text-xs leading-5 text-neutral-400">
        {message}
      </p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/95 px-3.5 py-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>

      <div className="space-y-1.5">
        {payload.map(
          (item) => (
            <div
              key={
                item.dataKey ||
                item.name
              }
              className="flex min-w-36 items-center justify-between gap-5"
            >
              <span className="text-xs text-neutral-500">
                {item.name}
              </span>

              <strong className="text-xs font-semibold text-neutral-950">
                {formatCount(
                  item.value
                )}
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function RankingBars({
  rows,
  labelKey,
  valueKey,
  secondaryKey = null,
  emptyMessage,
  maxItems = 7,
  colors = null,
}) {
  const items =
    rows
      .slice(0, maxItems)
      .map((row) => ({
        label:
          row[labelKey] ||
          "Sin identificar",
        value:
          toNumber(
            row[valueKey]
          ),
        secondary:
          secondaryKey
            ? toNumber(
                row[
                  secondaryKey
                ]
              )
            : 0,
      }));

  if (!items.length) {
    return (
      <EmptyState
        message={emptyMessage}
        compact
      />
    );
  }

  const max =
    Math.max(
      1,
      ...items.map(
        (item) =>
          item.value +
          item.secondary
      )
    );

  return (
    <div className="space-y-4">
      {items.map(
        (item, index) => {
          const total =
            item.value +
            item.secondary;

          const width =
            Math.max(
              4,
              (total / max) *
                100
            );

          const primaryWidth =
            total > 0
              ? (item.value /
                  total) *
                100
              : 0;

          return (
            <div
              key={`${item.label}-${index}`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-xs font-medium text-neutral-700">
                  {item.label}
                </span>

                <span className="shrink-0 text-[11px] font-semibold text-neutral-900">
                  {formatCount(
                    total
                  )}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="flex h-full overflow-hidden rounded-full"
                  style={{
                    width: `${width}%`,
                  }}
                >
                  <span
                    className="h-full"
                    style={{
                      width: `${primaryWidth}%`,
                      backgroundColor:
                        colors?.length
                          ? colors[
                              index %
                                colors.length
                            ]
                          : "#171717",
                    }}
                  />

                  {secondaryKey ? (
                    <span
                      className="h-full flex-1 bg-neutral-400"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function Funnel({
  sessions,
  productViews,
  checkoutStarts,
  ordersCreated,
}) {
  const stages = [
    {
      label: "Sesiones",
      value: sessions,
      helper:
        "Tráfico total",
    },
    {
      label:
        "Vistas de producto",
      value:
        productViews,
      helper: `${formatPercent(
        safePercent(
          productViews,
          sessions
        )
      )} de sesiones`,
    },
    {
      label:
        "Inicio checkout",
      value:
        checkoutStarts,
      helper: `${formatPercent(
        safePercent(
          checkoutStarts,
          sessions
        )
      )} de sesiones`,
    },
    {
      label:
        "Pedidos creados",
      value:
        ordersCreated,
      helper: `${formatPercent(
        safePercent(
          ordersCreated,
          sessions
        )
      )} de sesiones`,
    },
  ];

  const max =
    Math.max(
      1,
      ...stages.map(
        (item) => item.value
      )
    );

  return (
    <div className="space-y-4">
      {stages.map(
        (stage, index) => {
          const width =
            Math.max(
              stage.value > 0
                ? 6
                : 0,
              (stage.value /
                max) *
                100
            );

          return (
            <div
              key={stage.label}
            >
              <div className="mb-1.5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-700">
                    {stage.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    {
                      stage.helper
                    }
                  </p>
                </div>

                <strong className="text-lg font-semibold tracking-[-0.035em] text-neutral-950">
                  {formatCount(
                    stage.value
                  )}
                </strong>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${
                    index ===
                    stages.length -
                      1
                      ? "bg-black"
                      : "bg-neutral-700"
                  }`}
                  style={{
                    width: `${width}%`,
                    opacity:
                      1 -
                      index *
                        0.14,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function DeviceDonut({
  rows,
}) {
  const data =
    rows.map((row) => ({
      name:
        humanizeSlug(
          pick(
            row,
            [
              "device_type",
              "device",
              "type",
            ],
            "unknown"
          )
        ),
      value:
        toNumber(
          pick(
            row,
            [
              "sessions",
              "session_count",
              "count",
              "total",
            ],
            0
          )
        ),
    }));

  const total =
    data.reduce(
      (sum, row) =>
        sum + row.value,
      0
    );

  if (!data.length) {
    return (
      <EmptyState
        message="Todavía no hay información de dispositivos."
        compact
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
      <div className="relative mx-auto h-[140px] w-[140px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={43}
              outerRadius={64}
              paddingAngle={2}
              stroke="none"
            >
              {data.map(
                (
                  entry,
                  index
                ) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={
                      DEVICE_COLORS[
                        index %
                          DEVICE_COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-xl font-semibold tracking-[-0.04em] text-neutral-950">
            {formatCount(
              total
            )}
          </strong>
          <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
            sesiones
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map(
          (row, index) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background:
                      DEVICE_COLORS[
                        index %
                          DEVICE_COLORS.length
                      ],
                  }}
                />

                <span className="truncate text-xs text-neutral-500">
                  {row.name}
                </span>
              </div>

              <span className="shrink-0 text-xs font-semibold text-neutral-800">
                {formatPercent(
                  safePercent(
                    row.value,
                    total
                  ),
                  0
                )}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function LocationList({
  rows,
  colors = null,
}) {
  const items =
    rows.slice(0, 7);

  if (!items.length) {
    return (
      <EmptyState
        message="Todavía no hay información geográfica."
        compact
      />
    );
  }

  const total =
    rows.reduce(
      (sum, row) =>
        sum +
        toNumber(
          pick(
            row,
            [
              "sessions",
              "session_count",
              "count",
              "total",
            ],
            0
          )
        ),
      0
    );

  return (
    <div className="divide-y divide-neutral-100">
      {items.map(
        (row, index) => {
          const sessions =
            toNumber(
              pick(
                row,
                [
                  "sessions",
                  "session_count",
                  "count",
                  "total",
                ],
                0
              )
            );

          const main =
            pick(
              row,
              [
                "commune",
                "city",
                "region",
                "country_code",
              ],
              "Sin identificar"
            );

          const detail =
            [
              pick(
                row,
                ["city"]
              ),
              pick(
                row,
                [
                  "region_code",
                  "region",
                ]
              ),
              pick(
                row,
                [
                  "country_code",
                  "country",
                ]
              ),
            ]
              .filter(
                (
                  value,
                  valueIndex,
                  array
                ) =>
                  value &&
                  array.indexOf(
                    value
                  ) ===
                    valueIndex
              )
              .join(" · ");

          return (
            <div
              key={`${main}-${index}`}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      colors?.length
                        ? colors[
                            index %
                              colors.length
                          ]
                        : "#d4d4d4",
                  }}
                />

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-700">
                    {main}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                    {detail ||
                      "Ubicación aproximada"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-neutral-900">
                  {formatCount(
                    sessions
                  )}
                </p>

                <p className="text-[9px] text-neutral-400">
                  {formatPercent(
                    safePercent(
                      sessions,
                      total
                    ),
                    0
                  )}
                </p>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [
    days,
    setDays,
  ] = useState(30);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatedAt,
    setUpdatedAt,
  ] = useState(null);

  const [
    data,
    setData,
  ] = useState({
    overview: null,
    products: null,
    collections: null,
    locations: null,
    searches: null,
    sources: null,
    devices: null,
  });

  const loadAnalytics =
    useCallback(
      async (
        signal
      ) => {
        setLoading(true);
        setError("");

        const requests =
          await Promise.allSettled(
            [
              getAdminAnalyticsOverview(
                days,
                signal
              ),
              getAdminAnalyticsProducts(
                days,
                signal
              ),
              getAdminAnalyticsCollections(
                days,
                signal
              ),
              getAdminAnalyticsLocations(
                days,
                signal
              ),
              getAdminAnalyticsSearches(
                days,
                signal
              ),
              getAdminAnalyticsSources(
                days,
                signal
              ),
              getAdminAnalyticsDevices(
                days,
                signal
              ),
            ]
          );

        if (
          signal?.aborted
        ) {
          return;
        }

        const keys = [
          "overview",
          "products",
          "collections",
          "locations",
          "searches",
          "sources",
          "devices",
        ];

        const nextData =
          {};

        const failures =
          [];

        requests.forEach(
          (
            result,
            index
          ) => {
            const key =
              keys[index];

            if (
              result.status ===
              "fulfilled"
            ) {
              nextData[key] =
                result.value;
            } else {
              nextData[key] =
                null;
              failures.push(
                result.reason
              );
            }
          }
        );

        setData(nextData);
        setUpdatedAt(
          new Date()
        );

        if (
          failures.length ===
          requests.length
        ) {
          setError(
            failures[0]
              ?.message ||
              "No fue posible cargar Analytics."
          );
        } else if (
          failures.length >
          0
        ) {
          setError(
            "Algunas métricas no pudieron cargarse. Los datos disponibles se muestran igualmente."
          );
        }

        setLoading(false);
      },
      [days]
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadAnalytics(
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [loadAnalytics]);

  const overview =
    unwrap(data.overview);

  const summary =
    overview?.summary ||
    overview?.metrics ||
    overview ||
    {};

  const trafficRows =
    rowsFrom(
      overview,
      [
        "traffic",
        "daily",
        "timeline",
        "series",
      ]
    );

  const products =
    rowsFrom(
      data.products,
      ["products"]
    );

  const collections =
    rowsFrom(
      data.collections,
      ["collections"]
    );

  const locations =
    rowsFrom(
      data.locations,
      [
        "locations",
        "communes",
        "cities",
      ]
    );

  const searches =
    rowsFrom(
      data.searches,
      [
        "searches",
        "terms",
      ]
    );

  const sources =
    rowsFrom(
      data.sources,
      [
        "sources",
        "referrers",
      ]
    );

  const devices =
    rowsFrom(
      data.devices,
      ["devices"]
    );

  const metrics =
    useMemo(
      () => ({
        sessions:
          toNumber(
            pick(
              summary,
              [
                "sessions",
                "total_sessions",
              ]
            )
          ),
        pageViews:
          toNumber(
            pick(
              summary,
              [
                "page_views",
                "pageViews",
              ]
            )
          ),
        productViews:
          toNumber(
            pick(
              summary,
              [
                "product_views",
                "productViews",
              ]
            )
          ),
        productClicks:
          toNumber(
            pick(
              summary,
              [
                "product_clicks",
                "productClicks",
              ]
            )
          ),
        collectionViews:
          toNumber(
            pick(
              summary,
              [
                "collection_views",
                "collectionViews",
              ]
            )
          ),
        collectionClicks:
          toNumber(
            pick(
              summary,
              [
                "collection_clicks",
                "collectionClicks",
              ]
            )
          ),
        searches:
          toNumber(
            pick(
              summary,
              [
                "searches",
                "search_count",
                "search_events",
              ]
            )
          ),
        noResults:
          toNumber(
            pick(
              summary,
              [
                "searches_no_results",
                "search_no_results",
                "no_result_searches",
                "no_results",
              ]
            )
          ),
        whatsapp:
          toNumber(
            pick(
              summary,
              [
                "whatsapp_clicks",
                "whatsapp",
              ]
            )
          ),
        checkoutStarts:
          toNumber(
            pick(
              summary,
              [
                "checkout_starts",
                "checkoutStarts",
              ]
            )
          ),
        ordersCreated:
          toNumber(
            pick(
              summary,
              [
                "orders_created",
                "ordersCreated",
              ]
            )
          ),
        conversion:
          toNumber(
            pick(
              summary,
              [
                "order_conversion_rate",
                "conversion_rate",
              ]
            )
          ),
      }),
      [summary]
    );

  const timeline =
    useMemo(() => {
      const byDate =
        new Map();

      trafficRows.forEach(
        (row) => {
          const dateKey =
            normalizeDateKey(
              pick(
                row,
                [
                  "day",
                  "date",
                  "created_date",
                  "period",
                ],
                ""
              )
            );

          if (!dateKey) {
            return;
          }

          byDate.set(
            dateKey,
            {
              sessions:
                toNumber(
                  pick(
                    row,
                    [
                      "sessions",
                      "session_count",
                    ],
                    0
                  )
                ),
              pageViews:
                toNumber(
                  pick(
                    row,
                    [
                      "page_views",
                      "pageViews",
                      "views",
                    ],
                    0
                  )
                ),
            }
          );
        }
      );

      const result = [];
      const today =
        new Date();

      today.setHours(
        12,
        0,
        0,
        0
      );

      for (
        let offset =
          days - 1;
        offset >= 0;
        offset -= 1
      ) {
        const date =
          new Date(today);

        date.setDate(
          today.getDate() -
            offset
        );

        const year =
          date.getFullYear();

        const month =
          String(
            date.getMonth() +
              1
          ).padStart(
            2,
            "0"
          );

        const day =
          String(
            date.getDate()
          ).padStart(
            2,
            "0"
          );

        const key =
          `${year}-${month}-${day}`;

        const existing =
          byDate.get(key) ||
          {
            sessions: 0,
            pageViews: 0,
          };

        result.push({
          date: key,
          label:
            formatDateLabel(
              key
            ),
          sessions:
            existing.sessions,
          pageViews:
            existing.pageViews,
        });
      }

      return result;
    }, [
      trafficRows,
      days,
    ]);

  const productChart =
    useMemo(
      () =>
        products
          .slice(0, 8)
          .map((row) => ({
            product:
              pick(
                row,
                [
                  "product_name",
                  "name",
                  "product_code",
                  "code",
                  "sku",
                ],
                "Producto"
              ),
            views:
              toNumber(
                pick(
                  row,
                  [
                    "views",
                    "product_views",
                    "view_count",
                  ],
                  0
                )
              ),
            clicks:
              toNumber(
                pick(
                  row,
                  [
                    "clicks",
                    "product_clicks",
                    "click_count",
                  ],
                  0
                )
              ),
          })),
      [products]
    );

  const collectionRows =
    useMemo(
      () =>
        collections.map(
          (row) => ({
            label:
              humanizeSlug(
                pick(
                  row,
                  [
                    "collection_name",
                    "name",
                    "collection_slug",
                    "slug",
                  ],
                  ""
                )
              ),
            views:
              toNumber(
                pick(
                  row,
                  [
                    "views",
                    "collection_views",
                    "view_count",
                  ],
                  0
                )
              ),
            clicks:
              toNumber(
                pick(
                  row,
                  [
                    "clicks",
                    "collection_clicks",
                    "interactions",
                    "click_count",
                  ],
                  0
                )
              ),
          })
        ),
      [collections]
    );

  const searchRows =
    useMemo(
      () =>
        searches.map(
          (row) => ({
            label:
              String(
                pick(
                  row,
                  [
                    "search_term",
                    "term",
                    "query",
                  ],
                  "Sin término"
                )
              ),
            searches:
              toNumber(
                pick(
                  row,
                  [
                    "searches",
                    "search_count",
                    "count",
                    "total",
                  ],
                  0
                )
              ),
            noResults:
              toNumber(
                pick(
                  row,
                  [
                    "no_results",
                    "no_result_count",
                    "search_no_results",
                  ],
                  0
                )
              ),
          })
        ),
      [searches]
    );

  const sourceRows =
    useMemo(
      () =>
        sources.map(
          (row) => ({
            label:
              humanizeSlug(
                pick(
                  row,
                  [
                    "source",
                    "utm_source",
                    "referrer",
                    "channel",
                  ],
                  "direct"
                )
              ),
            value:
              toNumber(
                pick(
                  row,
                  [
                    "sessions",
                    "session_count",
                    "count",
                    "total",
                  ],
                  0
                )
              ),
          })
        ),
      [sources]
    );

  const searchSuccess =
    Math.max(
      0,
      metrics.searches
    ) > 0
      ? Math.max(
          0,
          100 -
            safePercent(
              metrics.noResults,
              metrics.searches +
                metrics.noResults
            )
        )
      : 0;

  const checkoutRate =
    safePercent(
      metrics.checkoutStarts,
      metrics.sessions
    );

  const productCtr =
    safePercent(
      metrics.productClicks,
      metrics.productViews
    );

  const periodStartLabel =
    timeline?.[0]?.date
      ? new Date(
          `${timeline[0].date}T12:00:00`
        ).toLocaleDateString(
          "es-CL"
        )
      : "-";

  const periodEndLabel =
    timeline?.[
      timeline.length - 1
    ]?.date
      ? new Date(
          `${timeline[
            timeline.length - 1
          ].date}T12:00:00`
        ).toLocaleDateString(
          "es-CL"
        )
      : "-";

  return (
    <div className="min-h-screen bg-[#f5f4f2] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
      <div className="mx-auto w-full max-w-[1680px]">
        {/* ======================================
            BARRA DE CONTEXTO / PERÍODO
        ====================================== */}
        <div className="mb-6 flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs font-medium text-neutral-500">
            Período:{" "}
            <span className="font-semibold text-neutral-600">
              {periodStartLabel} — {periodEndLabel}
            </span>
            {" · "}Datos: Sitio público
            {" · "}Geografía: Aproximada
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-black/[0.06] bg-white p-1 shadow-sm">
              {PERIOD_OPTIONS.map(
                (option) => {
                  const active =
                    days ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        setDays(
                          option.value
                        )
                      }
                      className={`min-h-8 rounded-full px-4 text-[11px] font-semibold transition ${
                        active
                          ? "bg-black text-white"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-black"
                      }`}
                      style={
                        active
                          ? {
                              color:
                                "#ffffff",
                            }
                          : undefined
                      }
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                loadAnalytics()
              }
              disabled={loading}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 text-[11px] font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-3.5 w-3.5 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
                aria-hidden="true"
              >
                <path d="M20 11a8 8 0 1 0 2 5.3" />
                <path d="M20 4v7h-7" />
              </svg>
              Actualizar
            </button>

            <span className="rounded-full border border-black/[0.06] bg-white px-3 py-2 text-[10px] font-medium text-neutral-500">
              Analytics interno
            </span>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {error}
          </div>
        ) : null}

        {loading &&
        !data.overview ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-[168px] animate-pulse rounded-[26px] border border-black/[0.04] bg-white"
                />
              )
            )}
          </div>
        ) : (
          <>
            {/* ======================================
                KPIs PRINCIPALES
            ====================================== */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                label="Sesiones"
                value={formatMetric(
                  metrics.sessions
                )}
                helper="Sesiones únicas del período."
                accent="#111111"
              />

              <KpiCard
                label="Páginas vistas"
                value={formatMetric(
                  metrics.pageViews
                )}
                helper="Navegación total del sitio."
                badge={`${formatPercent(
                  safePercent(
                    metrics.pageViews,
                    metrics.sessions
                  )
                )} / 100 sesiones`}
                accent="#ef6262"
              />

              <KpiCard
                label="Producto"
                value={formatMetric(
                  metrics.productClicks
                )}
                helper={`${formatCount(
                  metrics.productViews
                )} vistas de detalle.`}
                badge={`CTR ${formatPercent(
                  productCtr
                )}`}
                accent="#6d4bc3"
              />

              <KpiCard
                label="Inicio checkout"
                value={formatMetric(
                  metrics.checkoutStarts
                )}
                helper="Usuarios que avanzaron desde el carrito."
                badge={`${formatPercent(
                  checkoutRate
                )} sesiones`}
                accent="#111111"
              />

              <KpiCard
                label="Conversión"
                value={formatPercent(
                  metrics.conversion
                )}
                helper={`${formatCount(
                  metrics.ordersCreated
                )} pedidos creados.`}
                badge="Pedido / sesión"
                accent="#111111"
              />
            </section>

            {/* ======================================
                01 · TRÁFICO
            ====================================== */}
            <div className="mt-6">
              <DashboardCard
                eyebrow="01 · Tráfico del sitio"
                title="Evolución de actividad"
                description="Sesiones y páginas vistas agrupadas por día durante el período seleccionado."
                action={
                  <span className="rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-semibold text-neutral-500">
                    Diaria
                  </span>
                }
              >
                <div className="h-[380px] w-full lg:h-[430px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        timeline
                      }
                      margin={{
                        top: 12,
                        right: 18,
                        left: -8,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        stroke="#eceae7"
                        strokeDasharray="3 5"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#9a9a9a",
                          fontSize: 10,
                        }}
                        interval={
                          days === 7
                            ? 0
                            : days ===
                                30
                              ? 4
                              : 14
                        }
                        minTickGap={
                          12
                        }
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#9a9a9a",
                          fontSize: 10,
                        }}
                      />

                      <Tooltip
                        content={
                          <ChartTooltip />
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="pageViews"
                        name="Páginas vistas"
                        stroke="#6d4bc3"
                        strokeWidth={
                          2.4
                        }
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#6d4bc3",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Sesiones"
                        stroke="#111111"
                        strokeWidth={
                          2
                        }
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#111111",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4">
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d4bc3]" />
                    Páginas vistas
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />
                    Sesiones
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* ======================================
                02 · CONVERSIÓN
            ====================================== */}
            <section className="mt-6 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
              <DashboardCard
                eyebrow="02 · Conversión"
                title="Funnel comercial"
                description="Cómo avanzan las visitas desde el sitio hasta la creación de un pedido."
              >
                <Funnel
                  sessions={
                    metrics.sessions
                  }
                  productViews={
                    metrics.productViews
                  }
                  checkoutStarts={
                    metrics.checkoutStarts
                  }
                  ordersCreated={
                    metrics.ordersCreated
                  }
                />

                <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl bg-[#f7f6f4] p-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                      WhatsApp
                    </p>
                    <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-neutral-900">
                      {formatCount(
                        metrics.whatsapp
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                      Búsquedas
                    </p>
                    <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-neutral-900">
                      {formatCount(
                        metrics.searches
                      )}
                    </p>
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard
                eyebrow="03 · Catálogo"
                title="Productos con mayor interés"
                description="Comparación de vistas y clicks en los productos más relevantes del período."
              >
                {productChart.length ? (
                  <div className="h-[340px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={
                          productChart
                        }
                        layout="vertical"
                        margin={{
                          top: 4,
                          right: 10,
                          left: 14,
                          bottom: 4,
                        }}
                      >
                        <CartesianGrid
                          horizontal={
                            false
                          }
                          stroke="#efede9"
                          strokeDasharray="3 5"
                        />

                        <XAxis
                          type="number"
                          allowDecimals={
                            false
                          }
                          axisLine={
                            false
                          }
                          tickLine={
                            false
                          }
                          tick={{
                            fill: "#9a9a9a",
                            fontSize: 10,
                          }}
                        />

                        <YAxis
                          type="category"
                          dataKey="product"
                          width={92}
                          axisLine={
                            false
                          }
                          tickLine={
                            false
                          }
                          tick={{
                            fill: "#737373",
                            fontSize: 10,
                          }}
                        />

                        <Tooltip
                          content={
                            <ChartTooltip />
                          }
                        />

                        <Bar
                          dataKey="views"
                          name="Vistas"
                          fill="#6d4bc3"
                          radius={[
                            0,
                            6,
                            6,
                            0,
                          ]}
                          barSize={
                            10
                          }
                        />

                        <Bar
                          dataKey="clicks"
                          name="Clicks"
                          fill="#111111"
                          radius={[
                            0,
                            6,
                            6,
                            0,
                          ]}
                          barSize={
                            10
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    message="Todavía no hay actividad de productos para este período."
                    compact
                  />
                )}
              </DashboardCard>
            </section>

            {/* ======================================
                04 · COLECCIONES / BÚSQUEDAS
            ====================================== */}
            <section className="mt-6 grid gap-5 xl:grid-cols-2">
              <DashboardCard
                eyebrow="04 · Colecciones"
                title="Interés por colección"
                description="Vistas y clicks acumulados por colección."
              >
                <RankingBars
                  rows={
                    collectionRows
                  }
                  labelKey="label"
                  valueKey="views"
                  secondaryKey="clicks"
                  emptyMessage="Todavía no hay actividad de colecciones."
                />

                {collectionRows.length ? (
                  <div className="mt-6 flex flex-wrap gap-5 border-t border-neutral-100 pt-4">
                    <span className="flex items-center gap-2 text-[10px] text-neutral-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
                      Vistas
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-neutral-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" />
                      Clicks
                    </span>
                  </div>
                ) : null}
              </DashboardCard>

              <DashboardCard
                eyebrow="05 · Búsqueda"
                title="Búsquedas internas"
                description="Términos utilizados y búsquedas que no entregaron resultados."
              >
                <RankingBars
                  rows={
                    searchRows
                  }
                  labelKey="label"
                  valueKey="searches"
                  secondaryKey="noResults"
                  emptyMessage="Todavía no hay búsquedas registradas."
                />

                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-400">
                      Búsquedas
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {formatCount(
                        metrics.searches
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-400">
                      Sin resultado
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {formatCount(
                        metrics.noResults
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-400">
                      Éxito
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {formatPercent(
                        searchSuccess
                      )}
                    </p>
                  </div>
                </div>
              </DashboardCard>
            </section>

            {/* ======================================
                06 · AUDIENCIA
            ====================================== */}
            <section className="mt-6 grid gap-5 xl:grid-cols-3">
              <DashboardCard
                eyebrow="06 · Audiencia"
                title="Dispositivos"
                description="Distribución de sesiones."
              >
                <DeviceDonut
                  rows={devices}
                />
              </DashboardCard>

              <DashboardCard
                eyebrow="07 · Adquisición"
                title="Origen del tráfico"
                description="Fuente detectada al iniciar la sesión."
              >
                <RankingBars
                  rows={
                    sourceRows
                  }
                  labelKey="label"
                  valueKey="value"
                  emptyMessage="Todavía no hay fuentes de tráfico."
                  maxItems={6}
                  colors={
                    LAMINATI_CHART_COLORS
                  }
                />
              </DashboardCard>

              <DashboardCard
                eyebrow="08 · Geografía"
                title="Ubicación"
                description="Comuna o ciudad aproximada."
              >
                <LocationList
                  rows={
                    locations
                  }
                  colors={
                    LAMINATI_CHART_COLORS
                  }
                />
              </DashboardCard>
            </section>

            {/* ======================================
                09 · INDICADORES DERIVADOS
            ====================================== */}
            <div className="mt-6">
              <DashboardCard
                eyebrow="09 · Lectura rápida"
                title="Indicadores comerciales"
                description="Relaciones útiles para interpretar el comportamiento del período."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-black/[0.05] bg-[#f7f6f4] p-5">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                      Click / vista producto
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                      {formatPercent(
                        productCtr
                      )}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                      Clicks respecto de vistas de producto.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-black/[0.05] bg-[#f7f6f4] p-5">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                      Sesión → checkout
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                      {formatPercent(
                        checkoutRate
                      )}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                      Sesiones que avanzaron al checkout.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-black/[0.05] bg-[#f7f6f4] p-5">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                      Éxito búsqueda
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-neutral-950">
                      {formatPercent(
                        searchSuccess
                      )}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                      Búsquedas sin término fallido.
                    </p>
                  </div>

                  <div className="rounded-[22px] bg-black p-5 text-white">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/45">
                      Conversión final
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                      {formatPercent(
                        metrics.conversion
                      )}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-white/45">
                      Pedidos creados respecto de sesiones.
                    </p>
                  </div>
                </div>
              </DashboardCard>
            </div>

            <footer className="mt-5 flex flex-col gap-1 px-1 text-[10px] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Analytics interno · últimos{" "}
                {days} días
              </span>

              <span>
                {updatedAt
                  ? `Actualizado ${updatedAt.toLocaleString(
                      "es-CL"
                    )}`
                  : ""}
              </span>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
