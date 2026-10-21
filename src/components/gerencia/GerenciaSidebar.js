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
  apiRequest,
} from "@/services/api";

import {
  clearAuthSession,
} from "@/services/auth.service";

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
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="1.5"
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="1.5"
      />
      <rect
        x="13"
        y="10"
        width="8"
        height="11"
        rx="1.5"
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="1.5"
      />
    </svg>
  );
}

function IconBox({
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

function IconDocument({
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
      <path d="M8 11h8M8 15h8M8 19h5" />
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
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
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
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="m14 8 4 4-4 4M18 12H9" />
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

const NAVIGATION = [
  {
    title:
      "Resumen",
    items: [
      {
        label:
          "Dashboard",
        href:
          "/gerencia",
        exact:
          true,
        icon:
          IconDashboard,
      },
    ],
  },
  {
    title:
      "Operaciones",
    items: [
      {
        label:
          "Stock Distribución Chile",
        href:
          "/gerencia/stock",
        icon:
          IconBox,
      },
      {
        label:
          "Ventas Distribución Chile",
        href:
          "/gerencia/ventas",
        icon:
          IconDocument,
      },
      {
        label:
          "Cotizaciones Proyectos Chile",
        href:
          "/gerencia/cotizaciones-proyectos",
        icon:
          IconDocument,
      },
    ],
  },
];

const isItemActive = (
  pathname,
  item
) =>
  item.exact
    ? pathname ===
      item.href
    : pathname ===
        item.href ||
      pathname.startsWith(
        `${item.href}/`
      );

function NavigationItem({
  item,
  pathname,
  onNavigate,
}) {
  const active =
    isItemActive(
      pathname,
      item
    );

  const Icon =
    item.icon;

  return (
    <Link
      href={
        item.href
      }
      onClick={
        onNavigate
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
        active
          ? "!bg-black !text-white shadow-sm"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
      }`}
      style={
        active
          ? {
              backgroundColor: "#000000",
              color: "#ffffff",
            }
          : undefined
      }
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          active
            ? "!bg-neutral-800 !text-white"
            : "bg-neutral-100 text-neutral-500"
        }`}
        style={
          active
            ? {
                backgroundColor: "#262626",
                color: "#ffffff",
              }
            : undefined
        }
      >
        <Icon
          className={`h-4 w-4 ${
            active
              ? "!text-white"
              : "text-neutral-500"
          }`}
        />
      </span>

      <span
        className={`font-medium leading-5 ${
          active
            ? "!text-white"
            : ""
        }`}
        style={
          active
            ? {
                color: "#ffffff",
              }
            : undefined
        }
      >
        {
          item.label
        }
      </span>
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-black/5 px-6 pb-5 pt-6">
        <p className="text-[22px] font-semibold tracking-[0.18em] text-black">
          LAMINATI
        </p>

        <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
          Gerencia Italia
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-7">
          {NAVIGATION.map(
            (
              section
            ) => (
              <section
                key={
                  section.title
                }
              >
                <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {
                    section.title
                  }
                </p>

                <div className="mt-3 space-y-1.5">
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
              </section>
            )
          )}
        </div>
      </div>

      <div className="border-t border-black/5 p-3">
        <Link
          href="/gerencia/perfil"
          onClick={
            onNavigate
          }
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
            pathname ===
            "/gerencia/perfil"
              ? "bg-neutral-100 text-black"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
            <IconProfile className="h-4 w-4" />
          </span>

          <span className="font-medium">
            Mi perfil
          </span>
        </Link>

        <button
          type="button"
          onClick={
            onLogout
          }
          className="mt-1.5 flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
            <IconLogout className="h-4 w-4" />
          </span>

          <span className="font-medium">
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
}

export default function GerenciaSidebar() {
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
        if (
          pathname ===
          "/gerencia/perfil"
        ) {
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
            if (
              isItemActive(
                pathname,
                item
              )
            ) {
              return item.label;
            }
          }
        }

        return "Gerencia Italia";
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
            method:
              "POST",
          }
        );
      } catch {
        // Limpiar la sesión local igualmente.
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
              Gerencia Italia
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
            aria-label="Abrir menú de Gerencia Italia"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/35"
          />

          <aside className="absolute bottom-0 left-0 top-0 w-[86vw] max-w-[320px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              aria-label="Cerrar menú de Gerencia Italia"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"
            >
              <IconClose className="h-4 w-4" />
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
      ) : null}
    </>
  );
}
