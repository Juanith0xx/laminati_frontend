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

import {
  ADMIN_NOTIFICATION_READ_EVENT,
  ADMIN_NOTIFICATION_RECEIVED_EVENT,
  ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
  listAdminNotifications,
} from "@/services/adminNotifications.service";

import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getStoredUser,
} from "@/services/auth.service";

/* =========================================
   ICONOS
========================================= */
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
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m6.5 16 3.4-3.6 2.5 2.4 2.7-3 2.4 2.6" />
      <circle cx="15.8" cy="8.5" r="1.4" />
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
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
      <path d="M17 13v4M15 15h4" />
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
      <path d="M8 11h8" />
      <path d="M8 15h8" />
      <path d="M8 19h4" />
      <path d="M16.5 16.5 19 19l2-2" />
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

function IconContacts({
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
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconNotifications({
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
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
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
          "/admin/cotizaciones",
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
          "Pagos y documentos",
        href:
          "/admin/pagos",
        icon:
          IconPayments,
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
      {
        label:
          "Listas de precios",
        href:
          "/admin/listas-precios",
        icon:
          IconPriceLists,
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
    title: "Administración",
    items: [
      {
        label: "Usuarios",
        href: "/admin/usuarios",
        icon: IconUsers,
      },
      {
        label: "Contactos",
        href: "/admin/contactos",
        icon: IconContacts,
      },
      {
        label: "Notificaciones",
        href: "/admin/notificaciones",
        icon: IconNotifications,
        badgeKey: "notifications",
      },
    ],
  },
];

const SELLER_ALLOWED_PATHS = new Set([
  "/admin/dashboard",
  "/admin/showroom",
  "/admin/cotizaciones",
  "/admin/pedidos",
  "/admin/pagos",
  "/admin/retiros",
  "/admin/contactos",
  "/admin/notificaciones",
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
      items: section.items.filter(
        (item) =>
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
  badgeCount = 0,
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
        className={`min-w-0 flex-1 truncate font-medium ${
          active
            ? "!text-white"
            : "text-neutral-600 group-hover:text-black"
        }`}
      >
        {item.label}
      </span>

      {badgeCount >
        0 && (
        <span
          className={`ml-auto flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold ${
            active
              ? "bg-white text-black"
              : "bg-red-500 text-white"
          }`}
          aria-label={`${badgeCount} notificaciones sin leer`}
        >
          {badgeCount >
          99
            ? "99+"
            : badgeCount}
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
  unreadNotifications = 0,
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
            {normalizeRole(role) === "VENDEDOR"
              ? "Perfil vendedor"
              : "Administración"}
          </p>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {navigation.map(
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
                        badgeCount={
                          item.badgeKey ===
                          "notifications"
                            ? unreadNotifications
                            : 0
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

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] =
    useState(0);

  const [
    currentRole,
    setCurrentRole,
  ] =
    useState("");

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
      const syncRole =
        () => {
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
    },
    []
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

  useEffect(
    () => {
      let active =
        true;

      const controller =
        new AbortController();

      const loadUnread =
        async () => {
          try {
            const response =
              await listAdminNotifications({
                page:
                  1,

                limit:
                  1,

                signal:
                  controller.signal,
              });

            if (
              active
            ) {
              setUnreadNotifications(
                Number(
                  response
                    ?.unread_count ||
                    0
                )
              );
            }
          } catch (
            error
          ) {
            if (
              error?.name !==
              "AbortError"
            ) {
              console.error(
                "No fue posible cargar el contador de notificaciones:",
                error
              );
            }
          }
        };

      const handleReceived =
        () => {
          setUnreadNotifications(
            (current) =>
              current +
              1
          );
        };

      const handleRead =
        () => {
          /*
           * Para evitar desincronizaciones entre
           * navbar, toast, sidebar y página,
           * consultamos nuevamente el contador real.
           */
          loadUnread();
        };

      const handleReadAll =
        () => {
          setUnreadNotifications(
            0
          );
        };

      loadUnread();

      window.addEventListener(
        ADMIN_NOTIFICATION_RECEIVED_EVENT,
        handleReceived
      );

      window.addEventListener(
        ADMIN_NOTIFICATION_READ_EVENT,
        handleRead
      );

      window.addEventListener(
        ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
        handleReadAll
      );

      return () => {
        active =
          false;

        controller.abort();

        window.removeEventListener(
          ADMIN_NOTIFICATION_RECEIVED_EVENT,
          handleReceived
        );

        window.removeEventListener(
          ADMIN_NOTIFICATION_READ_EVENT,
          handleRead
        );

        window.removeEventListener(
          ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
          handleReadAll
        );
      };
    },
    []
  );

  const navigation =
    useMemo(
      () =>
        getNavigationForRole(
          currentRole
        ),
      [
        currentRole,
      ]
    );

  const currentLabel =
    useMemo(
      () => {
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

  const handleLogout =
    () => {
      clearAuthSession();

      setMobileOpen(
        false
      );

      router.replace(
        "/login"
      );

      router.refresh();
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
          navigation={
            navigation
          }
          role={
            currentRole
          }
          unreadNotifications={
            unreadNotifications
          }
        />
      </aside>

      <div className="sticky top-[72px] z-30 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
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
              navigation={
                navigation
              }
              role={
                currentRole
              }
              unreadNotifications={
                unreadNotifications
              }
            />
          </aside>
        </div>
      )}
    </>
  );
}