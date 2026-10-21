"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "@/services/api";

export default function GerenciaProfilePage() {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(
    () => {
      let active =
        true;

      apiRequest(
        "/auth/me"
      )
        .then(
          (
            response
          ) => {
            if (
              active
            ) {
              setUser(
                response?.user ||
                  null
              );
            }
          }
        )
        .catch(
          (
            requestError
          ) => {
            if (
              active
            ) {
              setError(
                requestError
                  ?.message ||
                  "No fue posible cargar el perfil."
              );
            }
          }
        )
        .finally(
          () => {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        );

      return () => {
        active =
          false;
      };
    },
    []
  );

  const name =
    [
      user?.first_name,
      user?.last_name,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
      .trim();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1000px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Gerencia
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
            Mi perfil
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Información de la cuenta autenticada.
          </p>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <p className="text-sm text-neutral-500">
              Cargando perfil…
            </p>
          ) : error ? (
            <p className="text-sm font-medium text-red-600">
              {
                error
              }
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f7f5] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Nombre
                </p>

                <p className="mt-2 text-sm font-semibold text-neutral-900">
                  {
                    name ||
                    "—"
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f5] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Correo
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-neutral-900">
                  {
                    user?.email ||
                    "—"
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f5] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Perfil
                </p>

                <p className="mt-2 text-sm font-semibold text-neutral-900">
                  {
                    user?.role_label ||
                    "Gerencia"
                  }
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f7f5] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Acceso
                </p>

                <p className="mt-2 text-sm font-semibold text-neutral-900">
                  Solo lectura
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
