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
import { clearAuthSession } from "@/services/auth.service";

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
    ],
  },
];

/* =========================================
   ITEM NAVEGACIÓN
========================================= */
function NavigationItem({
  item,
  pathname,
  onNavigate,
}) {
  const active =
    item.exact
      ? pathname === item.href
      : pathname === item.href ||
        pathname.startsWith(
          `${item.href}/`
        );

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
        active
          ? "bg-black shadow-sm"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? "bg-white/10 !text-white"
            : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-black"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <span
        className={`font-medium ${
          active
            ? "!text-white"
            : "text-neutral-600 group-hover:text-black"
        }`}
      >
        {item.label}
      </span>
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
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-100 px-6 py-7">
        <Link
          href="/admin/dashboard"
          onClick={
            onNavigate
          }
          className="block"
        >
          <p className="text-[21px] font-semibold tracking-[0.22em] text-black">
            LAMINATI
          </p>

          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Administración
          </p>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {NAVIGATION.map(
            (
              section
            ) => (
              <div
                key={
                  section.title
                }
              >
                <p className="mb-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                  {
                    section.title
                  }
                </p>

                <div className="space-y-1">
                  {section.items.map(
                    (
                      item
                    ) => (
                      <NavigationItem
                        key={
                          item.href
                        }
                        item={
                          item
                        }
                        pathname={
                          pathname
                        }
                        onNavigate={
                          onNavigate
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )
          )}
        </nav>
      </div>

      <div className="border-t border-neutral-100 p-4">
        <Link
          href="/admin/perfil"
          onClick={onNavigate}
          aria-current={
            pathname === "/admin/perfil"
              ? "page"
              : undefined
          }
          className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
            pathname === "/admin/perfil"
              ? "bg-black shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              pathname === "/admin/perfil"
                ? "bg-white/10 !text-white"
                : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-black"
            }`}
          >
            <IconProfile className="h-[17px] w-[17px]" />
          </span>

          <span
            className={`font-medium ${
              pathname === "/admin/perfil"
                ? "!text-white"
                : "text-neutral-600 group-hover:text-black"
            }`}
          >
            Mi perfil
          </span>
        </Link>

        <Link
          href="/"
          onClick={
            onNavigate
          }
          className="group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition group-hover:bg-white group-hover:text-black">
            <IconStore className="h-[17px] w-[17px]" />
          </span>

          <span className="font-medium">
            Ver tienda
          </span>
        </Link>

        <button
          type="button"
          onClick={
            onLogout
          }
          className="group mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm text-neutral-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition group-hover:bg-white group-hover:text-red-600">
            <IconLogout className="h-[17px] w-[17px]" />
          </span>

          <span className="font-medium">
            Cerrar sesión
          </span>
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
          of NAVIGATION
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
        pathname,
      ]
    );

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
      <aside className="fixed bottom-0 left-0 top-[72px] z-40 hidden w-[280px] border-r border-black/5 bg-white lg:block">
        <SidebarContent
          pathname={
            pathname
          }
          onNavigate={() => {}}
          onLogout={
            handleLogout
          }
        />
      </aside>

      <div className="sticky top-[72px] z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Administración
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
        <div className="fixed inset-0 z-[100] lg:hidden">
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
            />
          </aside>
        </div>
      )}
    </>
  );
}
