"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { apiRequest } from "@/services/api";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getStoredUser,
} from "@/services/auth.service";

/* =========================================
   ICONOS
========================================= */
function IconImages({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
      />
      <circle
        cx="8.5"
        cy="9"
        r="1.5"
      />
      <path d="m5.5 17 4.25-4.25 3.1 3.1 2.15-2.15 3.5 3.3" />
    </svg>
  );
}

function IconProducts({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" />
      <path d="m4.8 7.7 7.2 4.2 7.2-4.2M12 12v8.4" />
    </svg>
  );
}

function IconProjects({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  );
}

function IconPayments({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
      />
      <path d="M3 9h18" />
      <path d="M7 15h4" />
    </svg>
  );
}


function IconShowroom({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4h14l1 5H4l1-5Z" />
      <path d="M5 9v11h14V9" />
      <path d="M8 13h8M8 16h5" />
    </svg>
  );
}

function IconOrders({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </svg>
  );
}

function IconQuotations({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v4h4" />
      <path d="M8 11h8" />
      <path d="M8 15h8" />
      <path d="M8 19h5" />
    </svg>
  );
}

function IconPriceLists({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2.5"
      />
      <path d="M8 8h8M8 12h5M8 16h3" />
      <path d="M15.5 14.5h2.5v2.5h-2.5z" />
    </svg>
  );
}

function IconTaxDocuments({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v4h4" />
      <path d="M8 11h8M8 15h5" />
      <path d="M16 14.5v4M14.5 16.5h3" />
    </svg>
  );
}

function IconQr({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
    </svg>
  );
}

function IconStore({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 10v9h16v-9" />
      <path d="M3 10 5.4 5h13.2L21 10" />
      <path d="M3 10a3 3 0 0 0 5 2.2A3 3 0 0 0 12 12a3 3 0 0 0 4 .2A3 3 0 0 0 21 10" />
      <path d="M9 19v-5h6v5" />
    </svg>
  );
}

function IconProfile({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function IconUsers({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function IconSessions({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 8v4l2.5 1.5" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M4.5 4.5 7 7" />
      <path d="M19.5 4.5 17 7" />
    </svg>
  );
}

function IconLogout({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

function IconMenu({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function IconChevron({
  className = "",
  direction = "left",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {direction === "right" ? (
        <path d="m9 6 6 6-6 6" />
      ) : (
        <path d="m15 6-6 6 6 6" />
      )}
    </svg>
  );
}

function IconDashboard({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

/* =========================================
   NAVEGACIÓN
========================================= */
const NAVIGATION = [
  {
    title: "Resumen",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        exact: true,
        icon: IconDashboard,
      },
    ],
  },
  {
    title:
      "Ventas",
    items: [
      {
        label:
          "Showroom",
        href:
          "/admin/showroom",
        exact:
          true,
        icon:
          IconShowroom,
      },
      {
        label:
          "Cotizaciones",
        href:
          "/admin/showroom/cotizaciones",
        icon:
          IconQuotations,
        excludePaths: [
          "/admin/showroom/cotizaciones/nueva",
        ],
      },
      {
        label:
          "Board proyectos cotizados",
        href:
          "/admin/proyectos-cotizados",
        icon:
          IconProjects,
      },
      {
        label:
          "Nueva cotización de proyecto",
        href:
          "/admin/cotizaciones/nueva/proyecto",
        exact:
          true,
        icon:
          IconQuotations,
      },
      {
        label: "Pedidos",
        href: "/admin/pedidos",
        icon: IconOrders,
      },
      {
        label:
          "Pagos y transferencias",
        href:
          "/admin/pagos",
        icon:
          IconPayments,
      },
      {
        label:
          "Documentos tributarios",
        href:
          "/admin/documentos-tributarios",
        icon:
          IconTaxDocuments,
      },
    ],
  },
  {
    title:
      "Catálogo",
    items: [
      {
        label:
          "Productos",
        href:
          "/admin/productos",
        icon:
          IconProducts,
      },
      {
        label:
          "Listas de precios",
        href:
          "/admin/listas-precios",
        icon:
          IconPriceLists,
      },
      {
        label:
          "Proyectos",
        href:
          "/admin/proyectos",
        icon:
          IconProjects,
      },
    ],
  },
  {
    title:
      "Operaciones",
    items: [
      {
        label:
          "Retiros QR",
        href:
          "/admin/retiros",
        icon:
          IconQr,
      },
    ],
  },
  {
    title:
      "Administración",
    items: [
      {
        label:
          "Usuarios",
        href:
          "/admin/usuarios",
        icon:
          IconUsers,
      },
      {
        label:
          "Historial de Sesiones",
        href:
          "/admin/historial-sesiones",
        exact:
          true,
        icon:
          IconSessions,
      },
    ],
  },
];

const SELLER_ALLOWED_PATHS = new Set([
  "/admin/dashboard",
  "/admin/showroom",
  "/admin/showroom/cotizaciones",
  "/admin/cotizaciones/nueva/proyecto",
  "/admin/proyectos-cotizados",
  "/admin/pedidos",
  "/admin/pagos",
  "/admin/documentos-tributarios",
  "/admin/retiros",
]);

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const getNavigationForRole = (role) => {
  if (normalizeRole(role) !== "VENDEDOR") {
    return NAVIGATION;
  }

  return NAVIGATION
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        SELLER_ALLOWED_PATHS.has(item.href)
      ),
    }))
    .filter((section) => section.items.length > 0);
};

/* =========================================
   ITEM NAVEGACIÓN
========================================= */
function NavigationItem({
  item,
  pathname,
  onNavigate,
  collapsed = false,
  onShowTooltip = null,
  onHideTooltip = null,
}) {
  const excluded =
    Array.isArray(item.excludePaths) &&
    item.excludePaths.some(
      (excludedPath) =>
        pathname === excludedPath ||
        pathname.startsWith(
          `${excludedPath}/`
        )
    );

  const active =
    !excluded &&
    (item.exact
      ? pathname === item.href
      : pathname === item.href ||
        pathname.startsWith(
          `${item.href}/`
        ));

  const Icon = item.icon;

  const handleMouseEnter =
    (event) => {
      if (
        collapsed &&
        onShowTooltip
      ) {
        onShowTooltip(
          item.label,
          event.currentTarget
        );
      }
    };

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={
        collapsed
          ? onHideTooltip
          : undefined
      }
      onFocus={handleMouseEnter}
      onBlur={
        collapsed
          ? onHideTooltip
          : undefined
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      aria-label={
        collapsed
          ? item.label
          : undefined
      }
      className={`group relative flex items-center text-sm transition-all duration-200 ${
        collapsed
          ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
          : "min-h-11 gap-3 rounded-xl px-3.5 py-2.5"
      } ${
        active
          ? "bg-black text-white shadow-sm"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center transition ${
          collapsed
            ? "h-9 w-9 rounded-[10px] bg-transparent"
            : "h-8 w-8 rounded-lg"
        } ${
          active
            ? "!text-white"
            : collapsed
              ? "text-neutral-500 group-hover:text-black"
              : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-black"
        }`}
      >
        <Icon
          className={
            collapsed
              ? "h-[18px] w-[18px]"
              : "h-[17px] w-[17px]"
          }
        />
      </span>

      {!collapsed && (
        <span
          className={`font-medium ${
            active
              ? "!text-white"
              : "text-neutral-600 group-hover:text-black"
          }`}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

/* =========================================
   CONTENIDO SIDEBAR
========================================= */
function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  navigation,
  role,
  collapsed = false,
  onToggleCollapse = null,
  onShowTooltip = null,
  onHideTooltip = null,
}) {
  const profileActive =
    pathname === "/admin/perfil";

  const showCompactTooltip =
    (label, target) => {
      if (
        collapsed &&
        onShowTooltip
      ) {
        onShowTooltip(
          label,
          target
        );
      }
    };

  return (
    <div className="flex h-full flex-col">
      <div
        className={`border-b border-neutral-100 transition-all duration-300 ${
          collapsed
            ? "px-2.5 py-3"
            : "px-5 py-5"
        }`}
      >
        <div
          className={`flex ${
            collapsed
              ? "flex-col items-center gap-2"
              : "items-start justify-between gap-3"
          }`}
        >
          <Link
            href="/admin/dashboard"
            onClick={onNavigate}
            className={
              collapsed
                ? "flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-neutral-50"
                : "min-w-0 flex-1"
            }
            aria-label="Ir al dashboard"
          >
            {collapsed ? (
              <img
                src="/icon.png"
                alt="Laminati World"
                className="h-9 w-9 object-contain"
                loading="eager"
              />
            ) : (
              <img
                src="/images/logo-laminati-world.png"
                alt="Laminati World"
                className="h-auto w-[160px] max-w-full object-contain"
                loading="eager"
              />
            )}
          </Link>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`flex shrink-0 items-center justify-center border border-black/[0.08] bg-white text-neutral-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-black/15 hover:bg-neutral-50 hover:text-black ${
                collapsed
                  ? "h-9 w-9 rounded-xl"
                  : "h-9 w-9 rounded-full"
              }`}
              aria-label={
                collapsed
                  ? "Expandir menú administrativo"
                  : "Ocultar menú administrativo"
              }
              title={
                collapsed
                  ? "Expandir menú"
                  : "Ocultar menú"
              }
            >
              <IconChevron
                direction={
                  collapsed
                    ? "right"
                    : "left"
                }
                className="h-4 w-4"
              />
            </button>
          )}
        </div>

        {!collapsed && (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {normalizeRole(role) === "VENDEDOR"
              ? "Perfil vendedor"
              : "Administración"}
          </p>
        )}
      </div>

      <div
        className={`flex-1 overflow-y-auto py-4 transition-all duration-300 ${
          collapsed
            ? "admin-sidebar-scrollbar-hidden px-1.5"
            : "px-4"
        }`}
      >
        <nav className={collapsed ? "space-y-2.5" : "space-y-6"}>
          {navigation.map(
            (section) => (
              <div
                key={section.title}
              >
                {!collapsed && (
                  <p className="mb-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                    {section.title}
                  </p>
                )}

                <div className={collapsed ? "space-y-1.5" : "space-y-1"}>
                  {section.items.map(
                    (item) => (
                      <NavigationItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        collapsed={collapsed}
                        onShowTooltip={onShowTooltip}
                        onHideTooltip={onHideTooltip}
                      />
                    )
                  )}
                </div>
              </div>
            )
          )}
        </nav>
      </div>

      <div
        className={`border-t border-neutral-100 transition-all duration-300 ${
          collapsed
            ? "space-y-1.5 p-1.5"
            : "p-4"
        }`}
      >
        <Link
          href="/admin/perfil"
          onClick={onNavigate}
          onMouseEnter={(event) =>
            showCompactTooltip(
              "Mi perfil",
              event.currentTarget
            )
          }
          onMouseLeave={collapsed ? onHideTooltip : undefined}
          onFocus={(event) =>
            showCompactTooltip(
              "Mi perfil",
              event.currentTarget
            )
          }
          onBlur={collapsed ? onHideTooltip : undefined}
          aria-current={profileActive ? "page" : undefined}
          aria-label={collapsed ? "Mi perfil" : undefined}
          className={`group flex items-center text-sm transition-all duration-200 ${
            collapsed
              ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
              : "min-h-11 gap-3 rounded-xl px-3.5 py-2.5"
          } ${
            profileActive
              ? "bg-black text-white shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center transition ${
              collapsed
                ? "h-9 w-9 rounded-[10px] bg-transparent"
                : "h-8 w-8 rounded-lg"
            } ${
              profileActive
                ? "!text-white"
                : collapsed
                  ? "text-neutral-500 group-hover:text-black"
                  : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-black"
            }`}
          >
            <IconProfile className={collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} />
          </span>

          {!collapsed && (
            <span className={`font-medium ${profileActive ? "!text-white" : "text-neutral-600 group-hover:text-black"}`}>
              Mi perfil
            </span>
          )}
        </Link>

        <Link
          href="/"
          onClick={onNavigate}
          onMouseEnter={(event) =>
            showCompactTooltip(
              "Ver tienda",
              event.currentTarget
            )
          }
          onMouseLeave={collapsed ? onHideTooltip : undefined}
          onFocus={(event) =>
            showCompactTooltip(
              "Ver tienda",
              event.currentTarget
            )
          }
          onBlur={collapsed ? onHideTooltip : undefined}
          aria-label={collapsed ? "Ver tienda" : undefined}
          className={`group flex items-center text-sm text-neutral-600 transition-all duration-200 hover:bg-neutral-100 hover:text-black ${
            collapsed
              ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
              : "min-h-11 gap-3 rounded-xl px-3.5 py-2.5"
          }`}
        >
          <span className={`flex shrink-0 items-center justify-center text-neutral-500 transition group-hover:text-black ${collapsed ? "h-9 w-9 rounded-[10px] bg-transparent" : "h-8 w-8 rounded-lg bg-neutral-100 group-hover:bg-white"}`}>
            <IconStore className={collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} />
          </span>

          {!collapsed && (
            <span className="font-medium">
              Ver tienda
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          onMouseEnter={(event) =>
            showCompactTooltip(
              "Cerrar sesión",
              event.currentTarget
            )
          }
          onMouseLeave={collapsed ? onHideTooltip : undefined}
          onFocus={(event) =>
            showCompactTooltip(
              "Cerrar sesión",
              event.currentTarget
            )
          }
          onBlur={collapsed ? onHideTooltip : undefined}
          aria-label={collapsed ? "Cerrar sesión" : undefined}
          className={`group flex w-full items-center text-left text-sm text-neutral-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 ${
            collapsed
              ? "mx-auto h-11 w-11 justify-center rounded-xl p-0"
              : "mt-1 min-h-11 gap-3 rounded-xl px-3.5 py-2.5"
          }`}
        >
          <span className={`flex shrink-0 items-center justify-center text-neutral-500 transition group-hover:text-red-600 ${collapsed ? "h-9 w-9 rounded-[10px] bg-transparent" : "h-8 w-8 rounded-lg bg-neutral-100 group-hover:bg-white"}`}>
            <IconLogout className={collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} />
          </span>

          {!collapsed && (
            <span className="font-medium">
              Cerrar sesión
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================
   SIDEBAR ADMIN
========================================= */
export default function AdminSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    desktopCollapsed,
    setDesktopCollapsed,
  ] =
    useState(false);

  const [
    desktopTooltip,
    setDesktopTooltip,
  ] = useState(null);

  const [
    currentRole,
    setCurrentRole,
  ] =
    useState("");

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          "laminati-admin-sidebar-collapsed"
        );

      setDesktopCollapsed(
        stored === "1"
      );
    } catch {
      setDesktopCollapsed(
        false
      );
    }
  }, []);

  useEffect(() => {
    const root =
      document.documentElement;

    root.dataset.adminSidebarCollapsed =
      desktopCollapsed
        ? "true"
        : "false";

    root.style.setProperty(
      "--admin-sidebar-width",
      desktopCollapsed
        ? "72px"
        : "280px"
    );

    try {
      window.localStorage.setItem(
        "laminati-admin-sidebar-collapsed",
        desktopCollapsed
          ? "1"
          : "0"
      );
    } catch {
      // El sidebar funciona aunque localStorage no esté disponible.
    }

    return () => {
      delete root.dataset.adminSidebarCollapsed;
    };
  }, [
    desktopCollapsed,
  ]);

  useEffect(() => {
    const syncRole = () => {
      setCurrentRole(
        normalizeRole(
          getStoredUser()?.role
        )
      );
    };

    syncRole();

    window.addEventListener(
      AUTH_CHANGED_EVENT,
      syncRole
    );

    return () => {
      window.removeEventListener(
        AUTH_CHANGED_EVENT,
        syncRole
      );
    };
  }, []);

  const navigation =
    useMemo(
      () => getNavigationForRole(currentRole),
      [currentRole]
    );

  useEffect(
    () => {
      setMobileOpen(
        false
      );
    },
    [
      pathname,
    ]
  );

  useEffect(
    () => {
      if (
        !mobileOpen
      ) {
        document.body.style.overflow =
          "";

        return;
      }

      const previous =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previous;
      };
    },
    [
      mobileOpen,
    ]
  );

  const currentLabel =
    useMemo(
      () => {
        if (pathname === "/admin/perfil") {
          return "Mi perfil";
        }

        for (
          const section
          of navigation
        ) {
          for (
            const item
            of section.items
          ) {
            const active =
              item.exact
                ? pathname ===
                  item.href
                : pathname ===
                    item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            if (
              active
            ) {
              return item.label;
            }
          }
        }

        return "Backoffice";
      },
      [
        navigation,
        pathname,
      ]
    );

  const showDesktopTooltip =
    (label, target) => {
      if (
        !desktopCollapsed ||
        !target
      ) {
        return;
      }

      const rect =
        target.getBoundingClientRect();

      setDesktopTooltip({
        label,
        top:
          rect.top +
          rect.height / 2,
      });
    };

  const hideDesktopTooltip =
    () => {
      setDesktopTooltip(null);
    };

  const toggleDesktopSidebar =
    () => {
      setDesktopTooltip(null);
      setDesktopCollapsed(
        (
          current
        ) =>
          !current
      );
    };

  const handleLogout =
    async () => {
      try {
        await apiRequest(
          "/auth/logout",
          {
            method: "POST",
          }
        );
      } catch {
        // La limpieza local se ejecuta igualmente.
      } finally {
        clearAuthSession();

        setMobileOpen(
          false
        );

        router.replace(
          "/login"
        );

        router.refresh();
      }
    };

  return (
    <>
      <style>{`
        .admin-sidebar-scrollbar-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .admin-sidebar-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 768px) {
          [class~="md:pl-[280px]"],
          [class~="lg:pl-[280px]"] {
            padding-left: var(--admin-sidebar-width, 280px) !important;
            transition: padding-left 300ms ease;
          }

          [class~="md:ml-[280px]"],
          [class~="lg:ml-[280px]"] {
            margin-left: var(--admin-sidebar-width, 280px) !important;
            transition: margin-left 300ms ease;
          }
        }
      `}</style>

      <aside
        data-admin-sidebar="desktop"
        data-collapsed={
          desktopCollapsed
            ? "true"
            : "false"
        }
        className={`fixed bottom-0 left-0 top-[72px] z-40 hidden border-r border-black/5 bg-white transition-[width] duration-300 ease-out md:block ${
          desktopCollapsed
            ? "w-[72px]"
            : "w-[280px]"
        }`}
      >
        <SidebarContent
          pathname={
            pathname
          }
          onNavigate={() => {}}
          onLogout={
            handleLogout
          }
          navigation={
            navigation
          }
          role={
            currentRole
          }
          collapsed={
            desktopCollapsed
          }
          onToggleCollapse={
            toggleDesktopSidebar
          }
          onShowTooltip={
            showDesktopTooltip
          }
          onHideTooltip={
            hideDesktopTooltip
          }
        />
      </aside>

      {desktopCollapsed && desktopTooltip && (
        <div
          className="pointer-events-none fixed z-[90] hidden -translate-y-1/2 md:block"
          style={{
            left: "82px",
            top: `${desktopTooltip.top}px`,
          }}
        >
          <div className="relative whitespace-nowrap rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white shadow-xl transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-neutral-950" />
            <span className="relative">
              {desktopTooltip.label}
            </span>
          </div>
        </div>
      )}

      <div className="sticky top-[72px] z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {normalizeRole(currentRole) === "VENDEDOR"
                ? "Vendedor"
                : "Administración"}
            </p>

            <p className="truncate text-sm font-medium text-neutral-900">
              {
                currentLabel
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                true
              )
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-neutral-50"
            aria-label="Abrir menú administrativo"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />

          <aside className="absolute bottom-0 left-0 top-0 w-[86vw] max-w-[310px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700"
              aria-label="Cerrar menú administrativo"
            >
              <IconClose className="h-5 w-5" />
            </button>

            <SidebarContent
              pathname={
                pathname
              }
              onNavigate={() =>
                setMobileOpen(
                  false
                )
              }
              onLogout={
                handleLogout
              }
              navigation={
                navigation
              }
              role={
                currentRole
              }
              collapsed={
                false
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}
