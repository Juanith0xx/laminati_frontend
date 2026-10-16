"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { useCartStore } from "@/store/cartStore";

import ProductSearch from "./ProductSearch";

import {
  AUTH_CHANGED_EVENT,
} from "@/services/auth.service";

import AdminNotificationCenter from "@/components/admin/AdminNotificationCenter";

const API_BASE_URL = (

  process.env.NEXT_PUBLIC_API_URL ||

  "http://localhost:5000/api"

).replace(/\/$/, "");

const navItems = [

  {
    label: "Inicio",
    href: "/",
  },

  {
    label: "Productos",
    href: "/productos",
  },

  {
    label: "Proyectos",
    href: "/proyectos",
  },

  {
    label: "Contacto",
    href: "/contacto",
  },

  {
    label: "Nosotros",
    href: "/nosotros",
  },

];

const getUserDisplayName = (user) => {
  if (!user) {
    return "";
  }

  const firstName = String(
    user.first_name ||
      user.firstName ||
      ""
  ).trim();

  const lastName = String(
    user.last_name ||
      user.lastName ||
      ""
  ).trim();

  const fullName = [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return String(
    user.name ||
      user.full_name ||
      user.fullName ||
      user.email ||
      ""
  ).trim();
};

const getUserInitials = (user) => {

  if (!user) {
    return "AD";
  }

  const firstName = String(
    user.first_name ||
      user.firstName ||
      ""
  ).trim();

  const lastName = String(
    user.last_name ||
      user.lastName ||
      ""
  ).trim();

  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  const fullName = String(
    user.name ||
      user.full_name ||
      user.fullName ||
      ""
  ).trim();

  if (fullName) {
    const parts = fullName
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }

  const email = String(
    user.email ||
      ""
  ).trim();

  if (email) {
    return email.charAt(0).toUpperCase();
  }

  return "AD";
};

export default function Navbar() {

  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  /* =========================================
     MENÚ DE ACCESO / REGISTRO
     Mantiene el aspecto actual del Navbar
     mientras está cerrado.
  ========================================= */

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountMenuRef = useRef(null);

  /* =========================================
     SESIÓN DE USUARIO
  ========================================= */

  const [
    sessionUser,
    setSessionUser,
  ] = useState(null);

  const userInitials =
    getUserInitials(
      sessionUser
    );

  const userDisplayName =
    getUserDisplayName(
      sessionUser
    );

  const sessionRole = String(
    sessionUser?.role || ""
  )
    .trim()
    .toUpperCase();

  const accountHref =
    sessionRole === "ADMIN"
      ? "/admin"
      : sessionRole === "VENDEDOR"
        ? "/admin/dashboard"
        : "/mi-cuenta";

  const accountAriaLabel =
    sessionRole === "ADMIN"
      ? "Ir al panel de administración"
      : sessionRole === "VENDEDOR"
        ? "Ir al panel de ventas"
        : sessionRole === "USUARIO_EMPRESA"
          ? "Ir a mi empresa"
          : "Ir a mi cuenta";

  /* =========================================
     MENÚ DE PRODUCTOS
  ========================================= */

  const [
    productsOpen,
    setProductsOpen,
  ] = useState(false);

  const [
    mobileProductsOpen,
    setMobileProductsOpen,
  ] = useState(false);

  const [
    mobileProductGroup,
    setMobileProductGroup,
  ] = useState(
    "laminados"
  );

  const [
    activeProductGroup,
    setActiveProductGroup,
  ] = useState(
    "laminados"
  );

  const [
    activeHplBrand,
    setActiveHplBrand,
  ] = useState(
    "abet"
  );

  const [
    catalogBrands,
    setCatalogBrands,
  ] = useState([]);

  const [
    activeLaminateBrandId,
    setActiveLaminateBrandId,
  ] = useState(null);

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);

  const [
    catalogError,
    setCatalogError,
  ] = useState("");

  const items = useCartStore(

    (state) => state.items

  );

  /**

*   * Cantidad de PRODUCTOS DISTINTOS en el carrito.*

*   **

*   * Ejemplos:*

*   * - 10 unidades de Apple Tree 668 = 1*

*   * - 3 unidades de Samoa 1860 = 1*

*   * - Apple Tree + Samoa = 2*

*   **

*   * No suma item.quantity.*

*   */

  const totalProducts = new Set(

    items.map(

      (item, index) =>

        item.product_id ||

        item.id ||

        item.slug ||

        `cart-item-${index}`

    )

  ).size;

  const cartAriaLabel =

    totalProducts === 1

      ? "Carrito con 1 producto"

      : `Carrito con ${totalProducts} productos`;

  const isActive = (href) => {

    if (href === "/") {

      return pathname === "/";

    }

    return pathname.startsWith(href);

  };

  const normalizeCatalogName = (
    value
  ) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  const laminateBrands =
    catalogBrands.filter(
      (brand) => {
        const name =
          normalizeCatalogName(
            brand?.name
          );

        return (
          name.includes(
            "abet"
          ) ||
          name.includes(
            "karikal"
          )
        );
      }
    );

  const activeLaminateBrand =
    laminateBrands.find(
      (brand) =>
        brand.id ===
        activeLaminateBrandId
    ) ||
    laminateBrands[0] ||
    null;


  /* =========================================
     CARGAR MARCAS + COLECCIONES
     DESDE EL CATÁLOGO PÚBLICO
  ========================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      const loadCatalogNavigation =
        async () => {
          try {
            setCatalogLoading(
              true
            );

            setCatalogError(
              ""
            );

            const response =
              await fetch(
                `${API_BASE_URL}/catalog/navigation`,
                {
                  method:
                    "GET",

                  signal:
                    controller.signal,

                  cache:
                    "no-store",
                }
              );

            const data =
              await response.json();

            if (
              !response.ok ||
              !data?.success
            ) {
              throw new Error(
                data?.message ||
                  "No fue posible cargar el catálogo."
              );
            }

            const brands =
              Array.isArray(
                data.brands
              )
                ? data.brands
                : [];

            setCatalogBrands(
              brands
            );

            const laminates =
              brands.filter(
                (brand) => {
                  const name =
                    String(
                      brand?.name ||
                        ""
                    )
                      .trim()
                      .toLowerCase()
                      .normalize(
                        "NFD"
                      )
                      .replace(
                        /[\u0300-\u036f]/g,
                        ""
                      );

                  return (
                    name.includes(
                      "abet"
                    ) ||
                    name.includes(
                      "karikal"
                    )
                  );
                }
              );

            setActiveLaminateBrandId(
              (current) =>
                current &&
                laminates.some(
                  (brand) =>
                    brand.id ===
                    current
                )
                  ? current
                  : laminates[0]
                      ?.id ||
                    null
            );
          } catch (
            error
          ) {
            if (
              error?.name ===
              "AbortError"
            ) {
              return;
            }

            console.error(
              "Error cargando navegación del catálogo:",
              error
            );

            setCatalogBrands(
              []
            );

            setActiveLaminateBrandId(
              null
            );

            setCatalogError(
              "No fue posible cargar las colecciones."
            );
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setCatalogLoading(
                false
              );
            }
          }
        };

      loadCatalogNavigation();

      return () => {
        controller.abort();
      };
    },
    []
  );

  /* =========================================*

*     CERRAR MENÚS AL CAMBIAR RUTA*

*  ========================================= */

  useEffect(() => {

    setMenuOpen(false);

    setSearchOpen(false);

    setProductsOpen(false);

    setAccountMenuOpen(false);

    setMobileProductsOpen(

      false

    );

    setMobileProductGroup(

      "laminados"

    );

    setActiveProductGroup(

      "laminados"

    );

  }, [pathname]);

  /* =========================================
     SINCRONIZAR SESIÓN
  ========================================= */

  useEffect(() => {
    const syncSession = () => {
      try {
        const token =
          window.localStorage.getItem(
            "token"
          );

        const storedUser =
          window.localStorage.getItem(
            "user"
          );

        if (!token || !storedUser) {
          setSessionUser(null);
          return;
        }

        const parsedUser =
          JSON.parse(
            storedUser
          );

        const role = String(
          parsedUser?.role ||
            ""
        )
          .trim()
          .toUpperCase();

        if (
          role === "ADMIN" ||
          role === "VENDEDOR" ||
          role === "CLIENTE" ||
          role === "USUARIO_EMPRESA"
        ) {
          setSessionUser(
            parsedUser
          );
          return;
        }

        setSessionUser(null);
      } catch (error) {
        console.error(
          "Error leyendo sesión del usuario:",
          error
        );

        setSessionUser(null);
      }
    };

    syncSession();

    window.addEventListener(
      "storage",
      syncSession
    );

    window.addEventListener(
      AUTH_CHANGED_EVENT,
      syncSession
    );

    return () => {
      window.removeEventListener(
        "storage",
        syncSession
      );

      window.removeEventListener(
        AUTH_CHANGED_EVENT,
        syncSession
      );
    };
  }, [pathname]);


  /* =========================================
     CERRAR MENÚ DE CUENTA AL HACER CLICK
     FUERA DEL POPOVER
  ========================================= */

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, []);

  /* =========================================*

*     ESCAPE*

*  ========================================= */

  useEffect(() => {

    const handleEscape = (

      event

    ) => {

      if (

        event.key === "Escape"

      ) {

        setSearchOpen(false);

        setMenuOpen(false);

        setProductsOpen(

          false

        );

        setMobileProductsOpen(

          false

        );

        setAccountMenuOpen(false);

      }

    };

    window.addEventListener(

      "keydown",

      handleEscape

    );

    return () => {

      window.removeEventListener(

        "keydown",

        handleEscape

      );

    };

  }, []);

  const toggleSearch = () => {

    setSearchOpen(
      (current) => !current
    );

    setMenuOpen(false);

    setProductsOpen(false);

    setAccountMenuOpen(false);

  };

  const toggleMenu = () => {

    setMenuOpen(
      (current) => !current
    );

    setSearchOpen(false);

    setProductsOpen(false);

    setAccountMenuOpen(false);

  };

  /*
   * Los filtros del catálogo cambian solamente el query string
   * (/productos?collection=...), por lo que `pathname` sigue
   * siendo /productos y el efecto que escucha pathname no se
   * vuelve a ejecutar. Cerramos el menú explícitamente al
   * seleccionar cualquier enlace del catálogo móvil.
   */
  const closeMobileNavigation = () => {
    setMenuOpen(false);
    setMobileProductsOpen(false);
    setMobileProductGroup("laminados");
    setSearchOpen(false);
    setProductsOpen(false);
    setAccountMenuOpen(false);
  };

  const openDesktopProducts = () => {

    setProductsOpen(true);

    setSearchOpen(false);

    setAccountMenuOpen(false);

  };

  const toggleDesktopProducts = () => {

    setProductsOpen(
      (current) => !current
    );

    setSearchOpen(false);

    setAccountMenuOpen(false);

  };

  const toggleMobileProducts = () => {

    setMobileProductsOpen(
      (current) => !current
    );

  };

  const toggleMobileProductGroup = (
    group
  ) => {

    setMobileProductGroup(
      (current) =>
        current === group
          ? null
          : group
    );

  };

  return (

    <>

      <header

        className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl"

        onMouseLeave={() => {
          setProductsOpen(false);
          setAccountMenuOpen(false);
        }}

      >

        {/* NAV PRINCIPAL */}

        <div className="site-container flex h-[72px] items-center justify-between">

          {/* LOGO */}

          <Link

            href="/"

            onMouseEnter={() =>

              setProductsOpen(

                false

              )

            }

            className="text-xl font-semibold tracking-[0.12em] sm:text-2xl"

          >

            LAMINATI

          </Link>

          {/* =====================================
              NAVEGACIÓN DESKTOP
          ===================================== */}

          <nav className="hidden items-center gap-7 lg:flex xl:gap-9">

            {navItems.map(
              (item) => {
                const active =
                  isActive(
                    item.href
                  );

                if (
                  item.label ===
                  "Productos"
                ) {
                  return (
                    <div
                      key={
                        item.href
                      }
                      className="relative"
                      onMouseEnter={
                        openDesktopProducts
                      }
                    >
                      <button
                        type="button"
                        onClick={
                          toggleDesktopProducts
                        }
                        aria-expanded={
                          productsOpen
                        }
                        aria-controls="desktop-products-menu"
                        className={`relative flex items-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                          active ||
                          productsOpen
                            ? "text-black"
                            : "text-neutral-500 hover:text-black"
                        }`}
                      >
                        <span>
                          Productos
                        </span>

                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className={`transition-transform duration-200 ${
                            productsOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        >
                          <path
                            d="m7 9 5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {active && (
                          <motion.span
                            layoutId="navbar-active"
                            className="absolute inset-x-0 -bottom-1 h-px bg-black"
                          />
                        )}
                      </button>
                    </div>
                  );
                }

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onMouseEnter={() =>
                      setProductsOpen(
                        false
                      )
                    }
                    className={`relative py-2 text-sm font-medium transition-colors ${
                      active
                        ? "text-black"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    {
                      item.label
                    }

                    {active && (
                      <motion.span
                        layoutId="navbar-active"
                        className="absolute inset-x-0 -bottom-1 h-px bg-black"
                      />
                    )}
                  </Link>
                );
              }
            )}

          </nav>

          {/* ACCIONES */}

          <div

            className="flex items-center gap-2"

            onMouseEnter={() =>

              setProductsOpen(

                false

              )

            }

          >

            {/* BUSCAR */}

            <button

              type="button"

              onClick={

                toggleSearch

              }

              aria-label={

                searchOpen

                  ? "Cerrar buscador"

                  : "Buscar productos"

              }

              aria-expanded={

                searchOpen

              }

              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${

                searchOpen

                  ? "border-black bg-black text-white"

                  : "border-black/10 text-black hover:bg-neutral-100"

              }`}

            >

              {searchOpen ? (

                <span className="text-xl leading-none">

                  ×

                </span>

              ) : (

                <svg

                  width="19"

                  height="19"

                  viewBox="0 0 24 24"

                  fill="none"

                  aria-hidden="true"

                >

                  <circle

                    cx="11"

                    cy="11"

                    r="7"

                    stroke="currentColor"

                    strokeWidth="1.7"

                  />

                  <path

                    d="M16.5 16.5L21 21"

                    stroke="currentColor"

                    strokeWidth="1.7"

                    strokeLinecap="round"

                  />

                </svg>

              )}

            </button>

            {/* CENTRO DE NOTIFICACIONES BACKOFFICE */}

            {[
              "ADMIN",
              "VENDEDOR",
            ].includes(sessionRole) && (
              <AdminNotificationCenter />
            )}

            {/* SESIÓN / LOGIN DESKTOP */}

            {sessionUser ? (
              sessionRole === "VENDEDOR" ? (
                <Link
                  href={accountHref}
                  aria-label={accountAriaLabel}
                  className="hidden max-w-[190px] items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-black lg:flex"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[9px] font-semibold uppercase tracking-[0.06em] text-white">
                    {userInitials}
                  </span>

                  <span className="truncate">
                    {userDisplayName || "Vendedor"}
                  </span>
                </Link>
              ) : (
                <Link
                  href={accountHref}
                  aria-label={accountAriaLabel}
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-neutral-100 lg:flex"
                >
                  <span
                    className="text-xs font-semibold uppercase leading-none tracking-[0.06em]"
                    style={{ color: "#171717" }}
                  >
                    {userInitials}
                  </span>
                </Link>
              )
            ) : (
              <div
                ref={accountMenuRef}
                className="relative hidden lg:block"
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(
                      (current) => !current
                    );

                    setSearchOpen(false);
                    setProductsOpen(false);
                  }}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                >
                  Ingresar
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -6,
                        scale: 0.985,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -6,
                        scale: 0.985,
                      }}
                      transition={{
                        duration: 0.16,
                        ease: "easeOut",
                      }}
                      role="menu"
                      className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[290px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-2 shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
                    >
                      <div className="px-3 pb-2 pt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                          Tu cuenta
                        </p>
                      </div>

                      <Link
                        href="/login"
                        role="menuitem"
                        onClick={() =>
                          setAccountMenuOpen(false)
                        }
                        className="group flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-neutral-50"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-neutral-950">
                            Iniciar sesión
                          </span>

                          <span className="mt-0.5 block text-[11px] leading-4 text-neutral-500">
                            Accede a tu cuenta Laminati.
                          </span>
                        </span>

                        <span className="text-sm text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-black">
                          →
                        </span>
                      </Link>

                      <div className="my-1 h-px bg-black/[0.06]" />

                      <Link
                        href="/registro"
                        role="menuitem"
                        onClick={() =>
                          setAccountMenuOpen(false)
                        }
                        className="group flex items-center justify-between gap-4 rounded-xl bg-[#f6f1eb] px-3 py-3 transition hover:bg-[#efe7de]"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-neutral-950">
                            Crear cuenta
                          </span>

                          <span className="mt-0.5 block text-[11px] leading-4 text-neutral-500">
                            Regístrate para comprar y cotizar.
                          </span>
                        </span>

                        <span className="text-sm text-[#8b6d52] transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* =====================================*

*                CARRITO*

*                Icono en todas las resoluciones.*

*                Badge = productos distintos.*

*            ===================================== */}

            <Link

              href="/carrito"

              aria-label={

                cartAriaLabel

              }

              title="Carrito"

              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black transition hover:bg-neutral-100"

            >

              <svg

                width="19"

                height="19"

                viewBox="0 0 24 24"

                fill="none"

                aria-hidden="true"

              >

                <path

                  d="M4 6H6L8 16H18L20 9H7"

                  stroke="currentColor"

                  strokeWidth="1.7"

                  strokeLinecap="round"

                  strokeLinejoin="round"

                />

                <circle

                  cx="9"

                  cy="20"

                  r="1"

                  fill="currentColor"

                />

                <circle

                  cx="17"

                  cy="20"

                  r="1"

                  fill="currentColor"

                />

              </svg>

              {totalProducts >

                0 && (

                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold leading-none text-white">

                  {

                    totalProducts

                  }

                </span>

              )}

            </Link>

            {/* HAMBURGUESA */}

            <button

              type="button"

              onClick={

                toggleMenu

              }

              aria-label={

                menuOpen

                  ? "Cerrar menú"

                  : "Abrir menú"

              }

              aria-expanded={

                menuOpen

              }

              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:bg-neutral-100 lg:hidden"

            >

              <span className="relative h-4 w-5">

                <span

                  className={`absolute left-0 top-0.5 h-px w-5 bg-black transition-all duration-300 ${

                    menuOpen

                      ? "translate-y-[6px] rotate-45"

                      : ""

                  }`}

                />

                <span

                  className={`absolute left-0 top-[7px] h-px w-5 bg-black transition-all duration-300 ${

                    menuOpen

                      ? "opacity-0"

                      : "opacity-100"

                  }`}

                />

                <span

                  className={`absolute bottom-0.5 left-0 h-px w-5 bg-black transition-all duration-300 ${

                    menuOpen

                      ? "-translate-y-[6px] -rotate-45"

                      : ""

                  }`}

                />

              </span>

            </button>

          </div>

        </div>

        {/* =====================================
            MENÚ PRODUCTOS DESKTOP
            Mantiene el efecto visual del
            mega menú anterior.
        ===================================== */}

        <AnimatePresence>

          {productsOpen &&
            !searchOpen && (

            <motion.div
              id="desktop-products-menu"
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
              }}
              className="absolute left-0 top-full hidden w-full border-t border-black/5 bg-white shadow-[0_24px_50px_rgba(0,0,0,0.08)] lg:block"
              onMouseEnter={
                openDesktopProducts
              }
            >
              <div className="site-container py-8 xl:py-10">

                <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-10 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-14">

                  {/* CATEGORÍAS */}

                  <div className="border-r border-black/10 pr-8">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      Productos
                    </p>

                    <div className="mt-4 flex flex-col gap-1">

                      {[
                        {
                          id:
                            "laminados",
                          label:
                            "Laminados",
                        },
                        {
                          id:
                            "hpl",
                          label:
                            "HPL",
                        },
                        {
                          id:
                            "adhesivos",
                          label:
                            "Adhesivos",
                        },
                      ].map(
                        (
                          group
                        ) => {
                          const selected =
                            activeProductGroup ===
                            group.id;

                          return (
                            <button
                              key={
                                group.id
                              }
                              type="button"
                              onMouseEnter={() =>
                                setActiveProductGroup(
                                  group.id
                                )
                              }
                              onFocus={() =>
                                setActiveProductGroup(
                                  group.id
                                )
                              }
                              onClick={() =>
                                setActiveProductGroup(
                                  group.id
                                )
                              }
                              className="group relative w-full overflow-hidden rounded-xl px-3 py-3 text-left text-sm font-medium"
                            >
                              <span
                                className={`absolute inset-0 origin-left bg-black transition-transform duration-700 ease-out ${
                                  selected
                                    ? "scale-x-100"
                                    : "scale-x-0 group-hover:scale-x-100"
                                }`}
                                aria-hidden="true"
                              />

                              <span
                                className={`relative z-10 transition-colors duration-300 ${
                                  selected
                                    ? "text-white"
                                    : "text-neutral-600 group-hover:text-white"
                                }`}
                              >
                                {
                                  group.label
                                }
                              </span>
                            </button>
                          );
                        }
                      )}

                    </div>

                    <Link
                      href="/productos"
                      onClick={() =>
                        setProductsOpen(
                          false
                        )
                      }
                      className="mt-6 inline-flex items-center text-xs font-medium text-neutral-500 transition hover:text-black"
                    >
                      Ver todos los productos
                    </Link>

                  </div>

                  {/* SUBMENÚ */}

                  <div className="min-w-0">

                    <AnimatePresence
                      mode="wait"
                    >

                      {activeProductGroup ===
                        "laminados" && (

                        <motion.div
                          key="laminados"
                          initial={{
                            opacity: 0,
                            x: 10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: -8,
                          }}
                          transition={{
                            duration: 0.16,
                          }}
                        >
                          <div className="flex items-end justify-between gap-6">

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                                Laminados
                              </p>

                              <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                                Marcas y colecciones
                              </h3>
                            </div>

                            <Link
                              href="/productos?category=laminados"
                              onClick={() =>
                                setProductsOpen(
                                  false
                                )
                              }
                              className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-black"
                            >
                              Ver todos los laminados
                            </Link>

                          </div>

                          <div className="mt-6 grid grid-cols-[190px_minmax(0,1fr)] gap-8 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10">

                            {/* MARCAS DE LAMINADOS */}

                            <div className="border-r border-black/10 pr-6">

                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                Marcas
                              </p>

                              <div className="mt-3 flex flex-col gap-1">

                                {catalogLoading ? (

                                  <p className="px-3 py-3 text-sm text-neutral-400">
                                    Cargando...
                                  </p>

                                ) : catalogError ? (

                                  <p className="px-3 py-3 text-xs leading-5 text-red-600">
                                    {catalogError}
                                  </p>

                                ) : laminateBrands.length ===
                                  0 ? (

                                  <p className="px-3 py-3 text-sm text-neutral-400">
                                    No hay marcas visibles.
                                  </p>

                                ) : (

                                  laminateBrands.map(
                                    (
                                      brand
                                    ) => {
                                      const selected =
                                        activeLaminateBrand
                                          ?.id ===
                                        brand.id;

                                      return (
                                        <button
                                          key={
                                            brand.id
                                          }
                                          type="button"
                                          onMouseEnter={() =>
                                            setActiveLaminateBrandId(
                                              brand.id
                                            )
                                          }
                                          onFocus={() =>
                                            setActiveLaminateBrandId(
                                              brand.id
                                            )
                                          }
                                          onClick={() =>
                                            setActiveLaminateBrandId(
                                              brand.id
                                            )
                                          }
                                          className="group relative w-full overflow-hidden rounded-xl px-3 py-3 text-left text-sm font-medium"
                                        >
                                          <span
                                            className={`absolute inset-0 origin-left bg-black transition-transform duration-700 ease-out ${
                                              selected
                                                ? "scale-x-100"
                                                : "scale-x-0 group-hover:scale-x-100"
                                            }`}
                                            aria-hidden="true"
                                          />

                                          <span
                                            className={`relative z-10 transition-colors duration-300 ${
                                              selected
                                                ? "text-white"
                                                : "text-neutral-600 group-hover:text-white"
                                            }`}
                                          >
                                            {
                                              brand.name
                                            }
                                          </span>
                                        </button>
                                      );
                                    }
                                  )

                                )}

                              </div>

                            </div>

                            {/* COLECCIONES DE LA MARCA */}

                            <div className="min-w-0">

                              {activeLaminateBrand ? (

                                <>

                                  <div className="flex items-end justify-between gap-6">

                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                        Colecciones
                                      </p>

                                      <h4 className="mt-2 text-xl font-medium tracking-[-0.025em] text-neutral-950">
                                        {
                                          activeLaminateBrand.name
                                        }
                                      </h4>
                                    </div>

                                    <Link
                                      href={`/productos?brand=${encodeURIComponent(
                                        activeLaminateBrand.slug
                                      )}`}
                                      onClick={() =>
                                        setProductsOpen(
                                          false
                                        )
                                      }
                                      className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-black"
                                    >
                                      Ver productos
                                    </Link>

                                  </div>

                                  {Array.isArray(
                                    activeLaminateBrand.collections
                                  ) &&
                                  activeLaminateBrand.collections
                                    .length >
                                    0 ? (

                                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1 xl:grid-cols-3 xl:gap-x-7">

                                      {activeLaminateBrand.collections.map(
                                        (
                                          collection
                                        ) => (

                                          <Link
                                            key={
                                              collection.id
                                            }
                                            href={`/productos?collection=${encodeURIComponent(
                                              collection.slug
                                            )}`}
                                            onClick={() =>
                                              setProductsOpen(
                                                false
                                              )
                                            }
                                            className="group relative flex min-h-11 items-center overflow-hidden rounded-lg px-3 py-2 text-sm"
                                          >
                                            <span
                                              className="absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-700 ease-out group-hover:scale-x-100"
                                              aria-hidden="true"
                                            />

                                            <span className="relative z-10 min-w-0 truncate text-neutral-600 transition-colors duration-300 group-hover:text-white">
                                              {
                                                collection.name
                                              }
                                            </span>

                                          </Link>

                                        )
                                      )}

                                    </div>

                                  ) : (

                                    <div className="mt-4 rounded-2xl border border-black/5 bg-neutral-50 px-5 py-5">

                                      <p className="text-sm text-neutral-500">
                                        Esta marca no tiene colecciones visibles por el momento.
                                      </p>

                                    </div>

                                  )}

                                </>

                              ) : (

                                <div className="rounded-2xl border border-black/5 bg-neutral-50 px-5 py-5">

                                  <p className="text-sm text-neutral-500">
                                    Selecciona una marca para ver sus colecciones.
                                  </p>

                                </div>

                              )}

                            </div>

                          </div>

                        </motion.div>

                      )}

                      {activeProductGroup ===
                        "hpl" && (

                        <motion.div
                          key="hpl"
                          initial={{
                            opacity: 0,
                            x: 10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: -8,
                          }}
                          transition={{
                            duration: 0.16,
                          }}
                        >
                          <div className="flex items-end justify-between gap-6">

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                                HPL
                              </p>

                              <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                                Marcas y aplicaciones
                              </h3>
                            </div>

                            <Link
                              href="/productos?category=hpl"
                              onClick={() =>
                                setProductsOpen(
                                  false
                                )
                              }
                              className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-black"
                            >
                              Ver todos los HPL
                            </Link>

                          </div>

                          <div className="mt-6 grid grid-cols-[190px_minmax(0,1fr)] gap-8 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10">

                            {/* MARCAS HPL */}

                            <div className="border-r border-black/10 pr-6">

                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                Marcas
                              </p>

                              <div className="mt-3 flex flex-col gap-1">

                                <button
                                  type="button"
                                  onMouseEnter={() =>
                                    setActiveHplBrand(
                                      "abet"
                                    )
                                  }
                                  onFocus={() =>
                                    setActiveHplBrand(
                                      "abet"
                                    )
                                  }
                                  onClick={() =>
                                    setActiveHplBrand(
                                      "abet"
                                    )
                                  }
                                  className="group relative w-full overflow-hidden rounded-xl px-3 py-3 text-left text-sm font-medium"
                                >
                                  <span
                                    className={`absolute inset-0 origin-left bg-black transition-transform duration-700 ease-out ${
                                      activeHplBrand ===
                                      "abet"
                                        ? "scale-x-100"
                                        : "scale-x-0 group-hover:scale-x-100"
                                    }`}
                                    aria-hidden="true"
                                  />

                                  <span
                                    className={`relative z-10 transition-colors duration-300 ${
                                      activeHplBrand ===
                                      "abet"
                                        ? "text-white"
                                        : "text-neutral-600 group-hover:text-white"
                                    }`}
                                  >
                                    Abet Laminati
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onMouseEnter={() =>
                                    setActiveHplBrand(
                                      "karikal"
                                    )
                                  }
                                  onFocus={() =>
                                    setActiveHplBrand(
                                      "karikal"
                                    )
                                  }
                                  onClick={() =>
                                    setActiveHplBrand(
                                      "karikal"
                                    )
                                  }
                                  className="group relative w-full overflow-hidden rounded-xl px-3 py-3 text-left text-sm font-medium"
                                >
                                  <span
                                    className={`absolute inset-0 origin-left bg-black transition-transform duration-700 ease-out ${
                                      activeHplBrand ===
                                      "karikal"
                                        ? "scale-x-100"
                                        : "scale-x-0 group-hover:scale-x-100"
                                    }`}
                                    aria-hidden="true"
                                  />

                                  <span
                                    className={`relative z-10 transition-colors duration-300 ${
                                      activeHplBrand ===
                                      "karikal"
                                        ? "text-white"
                                        : "text-neutral-600 group-hover:text-white"
                                    }`}
                                  >
                                    Karikal
                                  </span>
                                </button>

                              </div>

                            </div>

                            {/* APLICACIONES HPL */}

                            <div className="min-w-0">

                              <AnimatePresence
                                mode="wait"
                              >

                                {activeHplBrand ===
                                  "abet" && (

                                  <motion.div
                                    key="hpl-abet"
                                    initial={{
                                      opacity: 0,
                                      x: 10,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                    }}
                                    exit={{
                                      opacity: 0,
                                      x: -8,
                                    }}
                                    transition={{
                                      duration: 0.16,
                                    }}
                                  >
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                        Abet Laminati
                                      </p>

                                      <h4 className="mt-2 text-xl font-medium tracking-[-0.025em] text-neutral-950">
                                        Aplicaciones HPL
                                      </h4>
                                    </div>

                                    <div className="mt-4 grid gap-x-5 gap-y-1 xl:grid-cols-2">

                                      {[
                                        {
                                          label:
                                            "Cubiertas",
                                          detail:
                                            "Stratificato",
                                          href:
                                            "/productos?category=hpl&brand=abet-laminati&application=stratificato",
                                        },
                                        {
                                          label:
                                            "Fachadas Ventiladas",
                                          detail:
                                            "MEG",
                                          href:
                                            "/productos?category=hpl&brand=abet-laminati&application=meg",
                                        },
                                        {
                                          label:
                                            "Cubiertas de Laboratorio",
                                          detail:
                                            "Labgrade",
                                          href:
                                            "/productos?category=hpl&brand=abet-laminati&application=labgrade",
                                        },
                                      ].map(
                                        (
                                          item
                                        ) => (

                                          <Link
                                            key={
                                              item.href
                                            }
                                            href={
                                              item.href
                                            }
                                            onClick={() =>
                                              setProductsOpen(
                                                false
                                              )
                                            }
                                            className="group relative flex min-h-14 items-center overflow-hidden rounded-xl px-4 py-3"
                                          >
                                            <span
                                              className="absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-700 ease-out group-hover:scale-x-100"
                                              aria-hidden="true"
                                            />

                                            <span className="relative z-10 min-w-0">
                                              <span className="block text-sm font-medium text-neutral-700 transition-colors duration-300 group-hover:text-white">
                                                {
                                                  item.label
                                                }
                                              </span>

                                              <span className="mt-1 block text-xs text-neutral-400 transition-colors duration-300 group-hover:text-white/70">
                                                {
                                                  item.detail
                                                }
                                              </span>
                                            </span>

                                            <span className="relative z-10 ml-auto text-neutral-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white">
                                              →
                                            </span>
                                          </Link>

                                        )
                                      )}

                                    </div>

                                  </motion.div>

                                )}

                                {activeHplBrand ===
                                  "karikal" && (

                                  <motion.div
                                    key="hpl-karikal"
                                    initial={{
                                      opacity: 0,
                                      x: 10,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                    }}
                                    exit={{
                                      opacity: 0,
                                      x: -8,
                                    }}
                                    transition={{
                                      duration: 0.16,
                                    }}
                                  >
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                        Karikal
                                      </p>

                                      <h4 className="mt-2 text-xl font-medium tracking-[-0.025em] text-neutral-950">
                                        Aplicaciones HPL
                                      </h4>
                                    </div>

                                    <div className="mt-4 grid gap-x-5 gap-y-1 xl:grid-cols-2">

                                      <Link
                                        href="/productos?category=hpl&brand=karikal&application=banos"
                                        onClick={() =>
                                          setProductsOpen(
                                            false
                                          )
                                        }
                                        className="group relative flex min-h-14 items-center overflow-hidden rounded-xl px-4 py-3"
                                      >
                                        <span
                                          className="absolute inset-0 origin-left scale-x-0 bg-black transition-transform duration-700 ease-out group-hover:scale-x-100"
                                          aria-hidden="true"
                                        />

                                        <span className="relative z-10 min-w-0">
                                          <span className="block text-sm font-medium text-neutral-700 transition-colors duration-300 group-hover:text-white">
                                            Paneles Fenólicos
                                          </span>

                                          <span className="mt-1 block text-xs text-neutral-400 transition-colors duration-300 group-hover:text-white/70">
                                            Baños
                                          </span>
                                        </span>

                                        <span className="relative z-10 ml-auto text-neutral-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white">
                                          →
                                        </span>
                                      </Link>

                                    </div>

                                  </motion.div>

                                )}

                              </AnimatePresence>

                            </div>

                          </div>

                        </motion.div>

                      )}

                      {activeProductGroup ===
                        "adhesivos" && (

                        <motion.div
                          key="adhesivos"
                          initial={{
                            opacity: 0,
                            x: 10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: -8,
                          }}
                          transition={{
                            duration: 0.16,
                          }}
                        >
                          <div className="flex items-end justify-between gap-6">

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                                Adhesivos
                              </p>

                              <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                                Kisafix
                              </h3>
                            </div>

                            <Link
                              href="/productos?category=adhesivos"
                              onClick={() =>
                                setProductsOpen(
                                  false
                                )
                              }
                              className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-black"
                            >
                              Ver todos los adhesivos
                            </Link>

                          </div>

                          <div className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">

                            <Link
                              href="/productos?brand=kisafix"
                              onClick={() =>
                                setProductsOpen(
                                  false
                                )
                              }
                              className="group relative overflow-hidden rounded-xl px-4 py-4"
                            >
                              <span className="absolute inset-0 origin-left bg-neutral-50 transition-transform duration-500 ease-out group-hover:scale-x-100" />

                              <span className="relative z-10 flex items-center justify-between gap-4">
                                <span>
                                  <span className="block text-sm font-medium text-neutral-800">
                                    Kisafix
                                  </span>

                                  <span className="mt-1 block text-xs text-neutral-400">
                                    Adhesivos profesionales para laminados y superficies
                                  </span>
                                </span>

                                <span className="text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-black">
                                  →
                                </span>
                              </span>
                            </Link>

                          </div>

                        </motion.div>

                      )}

                    </AnimatePresence>

                  </div>

                </div>

              </div>
            </motion.div>

          )}

        </AnimatePresence>

        {/* =====================================*

*            PANEL BUSCADOR*

*        ===================================== */}

        <AnimatePresence>

          {searchOpen && (

            <motion.div

              initial={{

                opacity: 0,

                height: 0,

              }}

              animate={{

                opacity: 1,

                height: "auto",

              }}

              exit={{

                opacity: 0,

                height: 0,

              }}

              transition={{

                duration: 0.25,

                ease: "easeInOut",

              }}

              className="overflow-visible border-t border-black/5 bg-white"

            >

              <div className="site-container py-5 sm:py-7">

                <ProductSearch

                  onClose={() =>

                    setSearchOpen(

                      false

                    )

                  }

                />

              </div>

            </motion.div>

          )}

        </AnimatePresence>

        {/* =====================================*

*            MENÚ MÓVIL / TABLET*

*        ===================================== */}

        <AnimatePresence>

          {menuOpen && (

            <motion.div

              initial={{

                opacity: 0,

                height: 0,

              }}

              animate={{

                opacity: 1,

                height: "auto",

              }}

              exit={{

                opacity: 0,

                height: 0,

              }}

              transition={{

                duration: 0.25,

                ease: "easeInOut",

              }}

              className="overflow-hidden border-t border-black/5 bg-white lg:hidden"

            >

              <div className="site-container py-5">

                <nav className="flex flex-col">

                  {navItems.map(
                    (item) => {
                      const active =
                        isActive(
                          item.href
                        );

                      if (
                        item.label ===
                        "Productos"
                      ) {
                        return (
                          <div
                            key={
                              item.href
                            }
                            className="border-b border-black/5"
                          >
                            <button
                              type="button"
                              onClick={
                                toggleMobileProducts
                              }
                              aria-expanded={
                                mobileProductsOpen
                              }
                              className={`flex w-full items-center justify-between py-4 text-left text-base font-medium ${
                                active
                                  ? "text-black"
                                  : "text-neutral-600"
                              }`}
                            >
                              <span>
                                Productos
                              </span>

                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                                className={`transition-transform duration-200 ${
                                  mobileProductsOpen
                                    ? "rotate-180"
                                    : ""
                                }`}
                              >
                                <path
                                  d="m7 9 5 5 5-5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            <AnimatePresence initial={false}>
                              {mobileProductsOpen && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    height: 0,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                  }}
                                  exit={{
                                    opacity: 0,
                                    height: 0,
                                  }}
                                  transition={{
                                    duration: 0.22,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-5">

                                    {/* =====================================
                                        LAMINADOS
                                        Colecciones dinámicas del catálogo
                                    ===================================== */}

                                    <div className="border-b border-black/10">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleMobileProductGroup(
                                            "laminados"
                                          )
                                        }
                                        aria-expanded={
                                          mobileProductGroup ===
                                          "laminados"
                                        }
                                        className="flex min-h-14 w-full items-center justify-between py-3 text-left"
                                      >
                                        <span>
                                          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                            Productos
                                          </span>

                                          <span className="mt-1 block text-base font-semibold text-neutral-950">
                                            Laminados
                                          </span>
                                        </span>

                                        <span
                                          className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-neutral-700 transition-transform duration-200 ${
                                            mobileProductGroup ===
                                            "laminados"
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                          >
                                            <path
                                              d="m7 9 5 5 5-5"
                                              stroke="currentColor"
                                              strokeWidth="1.8"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </span>
                                      </button>

                                      <AnimatePresence initial={false}>
                                        {mobileProductGroup ===
                                          "laminados" && (
                                          <motion.div
                                            initial={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            transition={{
                                              duration:
                                                0.2,
                                              ease:
                                                "easeInOut",
                                            }}
                                            className="overflow-hidden"
                                          >
                                            <div className="pb-5 pt-1">

                                              <Link
                                                href="/productos?category=laminados"
                                                onClick={closeMobileNavigation}
                                                className="flex min-h-11 items-center justify-between rounded-xl bg-neutral-950 px-4 text-sm font-semibold !text-white"
                                                style={{
                                                  color:
                                                    "#ffffff",
                                                }}
                                              >
                                                <span className="!text-white">
                                                  Ver todos los laminados
                                                </span>

                                                <span className="!text-white">
                                                  →
                                                </span>
                                              </Link>

                                              <div className="mt-5">

                                                <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                                                  Colecciones
                                                </p>

                                                {catalogLoading ? (
                                                  <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-4 text-sm text-neutral-400">
                                                    Cargando colecciones...
                                                  </div>
                                                ) : catalogError ? (
                                                  <div className="mt-3 rounded-xl bg-red-50 px-4 py-4 text-xs leading-5 text-red-600">
                                                    {catalogError}
                                                  </div>
                                                ) : laminateBrands.length ===
                                                  0 ? (
                                                  <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-4 text-sm text-neutral-400">
                                                    No hay colecciones visibles.
                                                  </div>
                                                ) : (
                                                  <div className="mt-3 space-y-5">

                                                    {laminateBrands.map(
                                                      (
                                                        brand
                                                      ) => (
                                                        <div
                                                          key={
                                                            brand.id
                                                          }
                                                        >
                                                          <div className="flex items-center justify-between gap-4 px-1">
                                                            <p className="text-xs font-semibold text-neutral-950">
                                                              {
                                                                brand.name
                                                              }
                                                            </p>

                                                            <Link
                                                              href={`/productos?brand=${encodeURIComponent(
                                                                brand.slug
                                                              )}`}
                                                              onClick={closeMobileNavigation}
                                                              className="text-[10px] font-medium text-neutral-400"
                                                            >
                                                              Ver marca
                                                            </Link>
                                                          </div>

                                                          {Array.isArray(
                                                            brand.collections
                                                          ) &&
                                                          brand.collections
                                                            .length >
                                                            0 ? (
                                                            <div className="mt-2 overflow-hidden rounded-2xl border border-black/[0.07] bg-neutral-50/80">

                                                              {brand.collections.map(
                                                                (
                                                                  collection,
                                                                  index
                                                                ) => (
                                                                  <Link
                                                                    key={
                                                                      collection.id
                                                                    }
                                                                    href={`/productos?collection=${encodeURIComponent(
                                                                      collection.slug
                                                                    )}`}
                                                                    onClick={closeMobileNavigation}
                                                                    className={`group flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-black ${
                                                                      index !==
                                                                      brand
                                                                        .collections
                                                                        .length -
                                                                        1
                                                                        ? "border-b border-black/[0.06]"
                                                                        : ""
                                                                    }`}
                                                                  >
                                                                    <span className="min-w-0 truncate">
                                                                      {
                                                                        collection.name
                                                                      }
                                                                    </span>

                                                                    <span className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-black">
                                                                      →
                                                                    </span>
                                                                  </Link>
                                                                )
                                                              )}

                                                            </div>
                                                          ) : (
                                                            <p className="mt-2 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-400">
                                                              Sin colecciones visibles.
                                                            </p>
                                                          )}

                                                        </div>
                                                      )
                                                    )}

                                                  </div>
                                                )}

                                              </div>

                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    {/* =====================================
                                        HPL
                                    ===================================== */}

                                    <div className="border-b border-black/10">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleMobileProductGroup(
                                            "hpl"
                                          )
                                        }
                                        aria-expanded={
                                          mobileProductGroup ===
                                          "hpl"
                                        }
                                        className="flex min-h-14 w-full items-center justify-between py-3 text-left"
                                      >
                                        <span>
                                          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                            Soluciones
                                          </span>

                                          <span className="mt-1 block text-base font-semibold text-neutral-950">
                                            HPL
                                          </span>
                                        </span>

                                        <span
                                          className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-neutral-700 transition-transform duration-200 ${
                                            mobileProductGroup ===
                                            "hpl"
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                          >
                                            <path
                                              d="m7 9 5 5 5-5"
                                              stroke="currentColor"
                                              strokeWidth="1.8"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </span>
                                      </button>

                                      <AnimatePresence initial={false}>
                                        {mobileProductGroup ===
                                          "hpl" && (
                                          <motion.div
                                            initial={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            transition={{
                                              duration:
                                                0.2,
                                              ease:
                                                "easeInOut",
                                            }}
                                            className="overflow-hidden"
                                          >
                                            <div className="space-y-5 pb-5 pt-1">

                                              <div>
                                                <p className="px-1 text-xs font-semibold text-neutral-950">
                                                  Abet Laminati
                                                </p>

                                                <div className="mt-2 overflow-hidden rounded-2xl border border-black/[0.07] bg-neutral-50/80">
                                                  {[
                                                    {
                                                      label:
                                                        "Cubiertas / Stratificato",
                                                      href:
                                                        "/productos?category=hpl&brand=abet-laminati&application=stratificato",
                                                    },
                                                    {
                                                      label:
                                                        "Fachadas Ventiladas / MEG",
                                                      href:
                                                        "/productos?category=hpl&brand=abet-laminati&application=meg",
                                                    },
                                                    {
                                                      label:
                                                        "Cubiertas de Laboratorio / Labgrade",
                                                      href:
                                                        "/productos?category=hpl&brand=abet-laminati&application=labgrade",
                                                    },
                                                  ].map(
                                                    (
                                                      link,
                                                      index,
                                                      links
                                                    ) => (
                                                      <Link
                                                        key={
                                                          link.href
                                                        }
                                                        href={
                                                          link.href
                                                        }
                                                        onClick={closeMobileNavigation}
                                                        className={`group flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-black ${
                                                          index !==
                                                          links.length -
                                                            1
                                                            ? "border-b border-black/[0.06]"
                                                            : ""
                                                        }`}
                                                      >
                                                        <span>
                                                          {
                                                            link.label
                                                          }
                                                        </span>

                                                        <span className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-black">
                                                          →
                                                        </span>
                                                      </Link>
                                                    )
                                                  )}
                                                </div>
                                              </div>

                                              <div>
                                                <p className="px-1 text-xs font-semibold text-neutral-950">
                                                  Karikal
                                                </p>

                                                <div className="mt-2 overflow-hidden rounded-2xl border border-black/[0.07] bg-neutral-50/80">
                                                  <Link
                                                    href="/productos?category=hpl&brand=karikal&application=banos"
                                                    onClick={closeMobileNavigation}
                                                    className="group flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-black"
                                                  >
                                                    <span>
                                                      Paneles Fenólicos / Baños
                                                    </span>

                                                    <span className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-black">
                                                      →
                                                    </span>
                                                  </Link>
                                                </div>
                                              </div>

                                              <Link
                                                href="/productos?category=hpl"
                                                onClick={closeMobileNavigation}
                                                className="flex min-h-11 items-center justify-between px-1 text-xs font-semibold text-neutral-500"
                                              >
                                                Ver todos los HPL
                                                <span>
                                                  →
                                                </span>
                                              </Link>

                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    {/* =====================================
                                        ADHESIVOS
                                    ===================================== */}

                                    <div className="border-b border-black/10">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleMobileProductGroup(
                                            "adhesivos"
                                          )
                                        }
                                        aria-expanded={
                                          mobileProductGroup ===
                                          "adhesivos"
                                        }
                                        className="flex min-h-14 w-full items-center justify-between py-3 text-left"
                                      >
                                        <span>
                                          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                            Complementos
                                          </span>

                                          <span className="mt-1 block text-base font-semibold text-neutral-950">
                                            Adhesivos
                                          </span>
                                        </span>

                                        <span
                                          className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-neutral-700 transition-transform duration-200 ${
                                            mobileProductGroup ===
                                            "adhesivos"
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                          >
                                            <path
                                              d="m7 9 5 5 5-5"
                                              stroke="currentColor"
                                              strokeWidth="1.8"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </span>
                                      </button>

                                      <AnimatePresence initial={false}>
                                        {mobileProductGroup ===
                                          "adhesivos" && (
                                          <motion.div
                                            initial={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            animate={{
                                              opacity: 1,
                                              height: "auto",
                                            }}
                                            exit={{
                                              opacity: 0,
                                              height: 0,
                                            }}
                                            transition={{
                                              duration:
                                                0.2,
                                              ease:
                                                "easeInOut",
                                            }}
                                            className="overflow-hidden"
                                          >
                                            <div className="space-y-2 pb-5 pt-1">

                                              <Link
                                                href="/productos?brand=kisafix"
                                                onClick={closeMobileNavigation}
                                                className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-neutral-50/80 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-black"
                                              >
                                                <span>
                                                  Kisafix
                                                </span>

                                                <span className="text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-black">
                                                  →
                                                </span>
                                              </Link>

                                              <Link
                                                href="/productos?category=adhesivos"
                                                onClick={closeMobileNavigation}
                                                className="flex min-h-11 items-center justify-between px-1 text-xs font-semibold text-neutral-500"
                                              >
                                                Ver todos los adhesivos
                                                <span>
                                                  →
                                                </span>
                                              </Link>

                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    <Link
                                      href="/productos"
                                      onClick={closeMobileNavigation}
                                      className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-black px-4 text-sm font-semibold !text-white"
                                      style={{
                                        color:
                                          "#ffffff",
                                      }}
                                    >
                                      <span className="!text-white">
                                        Ver todos los productos
                                      </span>
                                    </Link>

                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          onClick={closeMobileNavigation}
                          className={`flex items-center justify-between border-b border-black/5 py-4 text-base font-medium ${
                            active
                              ? "text-black"
                              : "text-neutral-600"
                          }`}
                        >
                          <span>
                            {
                              item.label
                            }
                          </span>

                          <span className="text-neutral-400">
                            →
                          </span>
                        </Link>
                      );
                    }
                  )}

                </nav>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  {sessionUser ? (
                    <Link
                      href={accountHref}
                      aria-label={accountAriaLabel}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 transition hover:bg-neutral-50"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase leading-none tracking-[0.06em] ${
                          sessionRole === "VENDEDOR"
                            ? "bg-black text-white"
                            : "border border-black/10 bg-white"
                        }`}
                        style={
                          sessionRole === "VENDEDOR"
                            ? undefined
                            : { color: "#171717" }
                        }
                      >
                        {userInitials}
                      </span>

                      {sessionRole === "VENDEDOR" ? (
                        <span className="min-w-0 truncate text-sm font-medium text-neutral-800">
                          {userDisplayName || "Vendedor"}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="flex min-h-12 items-center justify-center rounded-xl border border-black/10 px-4 text-sm font-medium"
                    >
                      Ingresar
                    </Link>
                  )}

                  <Link

                    href="/carrito"

                    aria-label={

                      cartAriaLabel

                    }

                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white"

                  >

                    <svg

                      width="18"

                      height="18"

                      viewBox="0 0 24 24"

                      fill="none"

                      aria-hidden="true"

                    >

                      <path

                        d="M4 6H6L8 16H18L20 9H7"

                        stroke="currentColor"

                        strokeWidth="1.7"

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      />

                      <circle

                        cx="9"

                        cy="20"

                        r="1"

                        fill="currentColor"

                      />

                      <circle

                        cx="17"

                        cy="20"

                        r="1"

                        fill="currentColor"

                      />

                    </svg>

                    <span>

                      Carrito

                    </span>

                    {totalProducts >

                      0 && (

                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black">

                        {

                          totalProducts

                        }

                      </span>

                    )}

                  </Link>

                </div>

                {!sessionUser && (
                  <Link
                    href="/registro"
                    className="mt-3 flex min-h-12 items-center justify-between rounded-xl border border-[#8b6d52]/20 bg-[#f7f2ec] px-4 text-sm font-medium text-neutral-800 transition hover:bg-[#f1e9e0]"
                  >
                    <span>
                      Crear una cuenta
                    </span>

                    <span className="text-[#8b6d52]">
                      →
                    </span>
                  </Link>
                )}

              </div>

            </motion.div>

          )}

        </AnimatePresence>

      </header>

      {/* FONDO AL ABRIR BUSCADOR */}

      <AnimatePresence>

        {searchOpen && (

          <motion.button

            type="button"

            aria-label="Cerrar buscador"

            onClick={() =>

              setSearchOpen(

                false

              )

            }

            initial={{

              opacity: 0,

            }}

            animate={{

              opacity: 1,

            }}

            exit={{

              opacity: 0,

            }}

            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px]"

          />

        )}

      </AnimatePresence>

    </>

  );

}