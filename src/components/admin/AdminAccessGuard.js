"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getStoredUser,
} from "@/services/auth.service";

const SELLER_ALLOWED_PREFIXES = [
  "/admin/dashboard",
  "/admin/showroom",
  "/admin/cotizaciones",
  "/admin/pedidos",
  "/admin/pagos",
  "/admin/retiros",
  "/admin/contactos",
  "/admin/notificaciones",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const isAllowedSellerPath = (pathname) =>
  SELLER_ALLOWED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
  );

export default function AdminAccessGuard({
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [resolved, setResolved] =
    useState(false);

  useEffect(() => {
    setResolved(false);

    const user = getStoredUser();
    const role = normalizeRole(user?.role);

    if (role === "ADMIN") {
      setResolved(true);
      return;
    }

    if (role === "VENDEDOR") {
      if (pathname === "/admin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (!isAllowedSellerPath(pathname)) {
        router.replace("/admin/dashboard");
        return;
      }

      setResolved(true);
      return;
    }

    router.replace("/login");
  }, [pathname, router]);

  if (!resolved) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f5f4f1] px-6">
        <p className="text-sm text-neutral-500">
          Verificando acceso...
        </p>
      </div>
    );
  }

  return children;
}
