"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AUTH_CHANGED_EVENT,
  getStoredUser,
} from "@/services/auth.service";

const SELLER_ALLOWED_PATHS = [
  "/admin/dashboard",
  "/admin/showroom",
  "/admin/proyectos-cotizados",
  "/admin/cotizaciones/nueva/proyecto",
  "/admin/pedidos",
  "/admin/pagos",
  "/admin/documentos-tributarios",
  "/admin/retiros",
  "/admin/perfil",
  "/admin/contactos",
  "/admin/notificaciones",
];

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const matchesAllowedPath = (pathname, root) =>
  pathname === root ||
  pathname.startsWith(`${root}/`);

export default function AdminAccessGuard({
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] =
    useState(false);
  const [role, setRole] =
    useState("");

  useEffect(() => {
    const syncUser = () => {
      const storedUser =
        getStoredUser();

      setRole(
        normalizeRole(
          storedUser?.role
        )
      );
      setReady(true);
    };

    syncUser();

    window.addEventListener(
      AUTH_CHANGED_EVENT,
      syncUser
    );

    return () => {
      window.removeEventListener(
        AUTH_CHANGED_EVENT,
        syncUser
      );
    };
  }, []);

  const sellerAllowed =
    useMemo(
      () =>
        SELLER_ALLOWED_PATHS.some(
          (root) =>
            matchesAllowedPath(
              pathname,
              root
            )
        ),
      [pathname]
    );

  const allowed =
    role === "ADMIN" ||
    (role === "VENDEDOR" &&
      sellerAllowed);

  useEffect(() => {
    if (!ready || allowed) {
      return;
    }

    if (!role) {
      router.replace("/login");
      return;
    }

    router.replace(
      "/admin/dashboard"
    );
  }, [
    allowed,
    ready,
    role,
    router,
  ]);

  if (!ready || !allowed) {
    return null;
  }

  return children;
}
