"use client";

import Link from "next/link";
import {
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  useForm,
} from "react-hook-form";
import {
  zodResolver,
} from "@hookform/resolvers/zod";
import {
  loginSchema,
} from "@/schemas/auth.schema";

import {
  loginUser,
  resolvePostLoginDestination,
  saveAuthSession,
} from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loginError,
    setLoginError,
  ] = useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver:
      zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoginError("");

      const response =
        await loginUser({
          email: data.email,
          password: data.password,
        });

      if (
        !response?.success ||
        !response?.token ||
        !response?.user
      ) {
        throw new Error(
          "Respuesta de autenticación inválida"
        );
      }

      saveAuthSession(response);

      const redirect =
        typeof window !== "undefined"
          ? new URLSearchParams(
              window.location.search
            ).get("redirect")
          : null;

      const destination =
        resolvePostLoginDestination({
          role: response.user.role,
          redirect,
        });

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error(
        "Error iniciando sesión:",
        error
      );

      setLoginError(
        error?.message ||
          "No fue posible iniciar sesión"
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto grid min-h-[650px] max-w-[1250px] overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_25px_70px_rgba(0,0,0,0.08)] lg:grid-cols-[0.92fr_1.08fr]">

        <section className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/10"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full border border-white/10"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
              Área privada
            </p>

            <h1 className="mt-7 max-w-md text-4xl font-medium leading-[1.08] tracking-[-0.045em] xl:text-5xl">
              Gestión de tu experiencia Laminati.
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">
              Accede a las herramientas de administración y gestión de la plataforma.
            </p>
          </div>

          <div className="relative z-10">
            <div className="h-px w-full bg-white/10" />

            <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/35">
              Laminati
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[430px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Bienvenido
              </p>

              <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                Ingresar
              </h2>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Ingresa tus credenciales para acceder a tu cuenta.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit(
                  onSubmit
                )
              }
              className="mt-10"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2.5 block text-xs font-medium text-neutral-600"
                >
                  Email
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6.5h16v11H4v-11Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />

                      <path
                        d="m5 7.5 7 5 7-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <input
                    {...register(
                      "email"
                    )}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@correo.cl"
                    className={`h-14 w-full rounded-2xl border bg-white pl-12 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-300 ${
                      errors.email
                        ? "border-red-400 focus:border-red-500"
                        : "border-neutral-200 hover:border-neutral-300 focus:border-black"
                    }`}
                  />
                </div>

                {errors.email && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {
                      errors.email
                        .message
                    }
                  </p>
                )}
              </div>

              <div className="mt-6">
                <label
                  htmlFor="password"
                  className="mb-2.5 block text-xs font-medium text-neutral-600"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />

                      <path
                        d="M8 10V7a4 4 0 0 1 8 0v3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  <input
                    {...register(
                      "password"
                    )}
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    className={`h-14 w-full rounded-2xl border bg-white pl-12 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-300 ${
                      errors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-neutral-200 hover:border-neutral-300 focus:border-black"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-black"
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 3l18 18"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />

                        <path
                          d="M10.6 10.7a2 2 0 0 0 2.7 2.7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />

                        <path
                          d="M9.9 5.3A10.6 10.6 0 0 1 12 5c5.5 0 9 7 9 7a16.4 16.4 0 0 1-2.6 3.5M6.6 6.6C4.3 8.1 3 12 3 12s3.5 7 9 7a9.7 9.7 0 0 0 3.4-.6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />

                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {
                      errors
                        .password
                        .message
                    }
                  </p>
                )}
              </div>

              {loginError && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-xs font-medium leading-5 text-red-600">
                    {loginError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-black px-6 text-sm font-medium text-white transition duration-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Ingresando..."
                  : "Ingresar"}
              </button>
            </form>

            <div className="mt-8 border-t border-neutral-100 pt-7 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 transition hover:text-black"
              >
                <span>
                  ←
                </span>

                Volver a Laminati
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
