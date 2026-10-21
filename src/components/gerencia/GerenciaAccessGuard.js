"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  apiRequest,
} from "@/services/api";

const ROLE =
  "GERENCIA_ITALIA";

const destinationForRole = (
  role
) => {
  const normalized =
    String(role || "")
      .trim()
      .toUpperCase();

  if (
    normalized ===
    "ADMIN"
  ) {
    return "/admin/dashboard";
  }

  if (
    normalized ===
    "VENDEDOR"
  ) {
    return "/admin/showroom";
  }

  if (
    normalized ===
    ROLE
  ) {
    return "/gerencia";
  }

  return "/mi-cuenta";
};

export default function GerenciaAccessGuard({
  children,
}) {
  const router =
    useRouter();

  const [
    state,
    setState,
  ] = useState(
    "checking"
  );

  useEffect(
    () => {
      let active =
        true;

      const validate =
        async () => {
          try {
            const response =
              await apiRequest(
                "/auth/me"
              );

            if (!active) {
              return;
            }

            const user =
              response?.user ||
              null;

            const role =
              String(
                user?.role ||
                  ""
              )
                .trim()
                .toUpperCase();

            if (
              role !==
              ROLE
            ) {
              setState(
                "redirecting"
              );

              router.replace(
                destinationForRole(
                  role
                )
              );

              return;
            }

            setState(
              "authorized"
            );
          } catch (error) {
            if (!active) {
              return;
            }

            setState(
              "redirecting"
            );

            const redirect =
              encodeURIComponent(
                "/gerencia"
              );

            router.replace(
              `/login?redirect=${redirect}`
            );
          }
        };

      validate();

      return () => {
        active = false;
      };
    },
    [
      router,
    ]
  );

  if (
    state !==
    "authorized"
  ) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f5f4f1] px-6">
        <div className="rounded-3xl border border-black/5 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />

          <p className="mt-4 text-sm font-medium text-neutral-700">
            Validando acceso…
          </p>
        </div>
      </main>
    );
  }

  return children;
}
