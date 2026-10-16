"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import RegisterLaminateShowcase from "@/components/registro/RegisterLaminateShowcase";
import {
  useRouter,
} from "next/navigation";

import {
  apiRequest,
} from "@/services/api";

/* =========================================
   CONFIG
========================================= */

const ACCOUNT_TYPES = [
  {
    id: "PERSON",
    label: "Particular",
    description: "Compra y cotiza para tus espacios.",
  },
  {
    id: "COMPANY",
    label: "Empresa",
    description: "Cuenta comercial y datos de facturación.",
  },
  {
    id: "PROFESSIONAL",
    label: "Arquitecto / Diseñador",
    description: "Cuenta personal para proyectos profesionales.",
  },
];

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  rut: "",
  password: "",
  confirm_password: "",

  company_legal_name: "",
  company_trade_name: "",
  company_rut: "",
  company_business_activity: "",
  company_billing_email: "",
  company_phone: "",
  company_address_line: "",
  company_commune: "",
  company_city: "",
  company_region: "",
  company_position_name: "",
};

const PERSON_REGISTER_ENDPOINT =
  "/auth/register";

/*
 * El backend de Laminatiword ya posee registerCompany.
 * Dejamos compatibilidad con las dos convenciones de
 * ruta más habituales del proyecto. El fallback sólo
 * se ejecuta si la ruta anterior responde 404.
 */
const COMPANY_REGISTER_ENDPOINTS = [
  "/auth/register-company",
  "/auth/register/company",
];

/* =========================================
   HELPERS
========================================= */

const cleanText = (value) =>
  String(value ?? "").trim();

const normalizeEmail = (value) =>
  cleanText(value).toLowerCase();

const persistSessionAndContinue = (
  response
) => {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  if (response?.token) {
    window.localStorage.setItem(
      "token",
      response.token
    );
  }

  if (response?.user) {
    window.localStorage.setItem(
      "user",
      JSON.stringify(
        response.user
      )
    );
  }

  window.localStorage.setItem(
    "mustChangePassword",
    "false"
  );

  /*
   * Recarga completa intencional:
   * Navbar y cualquier consumidor de sesión
   * parten leyendo localStorage desde cero.
   */
  window.location.assign(
    "/mi-cuenta"
  );
};

const registerCompanyAccount =
  async (payload) => {
    let lastError = null;

    for (
      const endpoint
      of COMPANY_REGISTER_ENDPOINTS
    ) {
      try {
        return await apiRequest(
          endpoint,
          {
            method: "POST",
            body: payload,
          }
        );
      } catch (error) {
        lastError = error;

        if (
          Number(error?.status) !==
          404
        ) {
          throw error;
        }
      }
    }

    throw (
      lastError ||
      new Error(
        "No se encontró la ruta de registro de empresa."
      )
    );
  };

/* =========================================
   ICONS
========================================= */

function IconUser({
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
        r="3.5"
      />
      <path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6" />
    </svg>
  );
}

function IconMail({
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
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconPhone({
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
      <path d="M7.2 3.8 4.8 6.2c-.9.9-.8 2.5.1 4.4 1.2 2.5 4 5.3 6.5 6.5 1.9.9 3.5 1 4.4.1l2.4-2.4-4.1-3-1.6 1.6c-.8-.3-1.8-.9-2.9-2s-1.7-2.1-2-2.9l1.6-1.6-2-3.1Z" />
    </svg>
  );
}

function IconLock({
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
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconEye({
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
      <path d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z" />
      <circle
        cx="12"
        cy="12"
        r="2.2"
      />
    </svg>
  );
}

function IconEyeOff({
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
      <path d="m3 3 18 18" />
      <path d="M10.6 7.1A9.7 9.7 0 0 1 12 7c6.1 0 9.5 5 9.5 5a14 14 0 0 1-2.2 2.6M6.3 6.3C3.8 8 2.5 12 2.5 12s3.4 5 9.5 5a10 10 0 0 0 3-.4" />
    </svg>
  );
}

function IconBuilding({
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
      <path d="M4 21V5l8-2v18M12 8h8v13" />
      <path d="M7 7h2M7 11h2M7 15h2M15 11h2M15 15h2M15 19h2" />
    </svg>
  );
}

function IconPencil({
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
      <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
      <path d="m13.8 6.7 3.5 3.5" />
    </svg>
  );
}

function IconArrow({
  className = "",
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
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function IconShield({
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
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconSupport({
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
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13h3v6H5a1 1 0 0 1-1-1v-5ZM20 13h-3v6h2a1 1 0 0 0 1-1v-5Z" />
      <path d="M17 19c-.5 1.2-1.6 2-3 2h-2" />
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
      <path d="M14 3v4h4M8 11h7M8 15h7M8 19h4" />
    </svg>
  );
}

function IconCheck({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/* =========================================
   UI
========================================= */

function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-medium text-neutral-800">
        {label}
        {required && (
          <span className="ml-1 text-[#8b6d52]">
            *
          </span>
        )}
      </span>

      <span className="relative block">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400" />
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`h-[50px] w-full rounded-xl border border-black/10 bg-white/80 text-[13px] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#8b6d52]/70 focus:ring-4 focus:ring-[#8b6d52]/10 ${
            Icon
              ? "pl-12 pr-4"
              : "px-4"
          }`}
        />

        {children}
      </span>
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  visible,
  onToggle,
}) {
  return (
    <Field
      label={label}
      icon={IconLock}
      type={
        visible
          ? "text"
          : "password"
      }
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      autoComplete={autoComplete}
    >
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        aria-label={
          visible
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
        }
      >
        {visible ? (
          <IconEyeOff className="h-[17px] w-[17px]" />
        ) : (
          <IconEye className="h-[17px] w-[17px]" />
        )}
      </button>
    </Field>
  );
}

function AccountType({
  option,
  selected,
  onSelect,
}) {
  const Icon =
    option.id ===
    "COMPANY"
      ? IconBuilding
      : option.id ===
          "PROFESSIONAL"
        ? IconPencil
        : IconUser;

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(option.id)
      }
      className={`group flex min-h-[62px] items-center gap-3 rounded-xl border px-4 text-left transition ${
        selected
          ? "border-[#8b6d52] bg-[#f6efe7] shadow-[0_0_0_3px_rgba(139,109,82,0.08)]"
          : "border-black/10 bg-white/70 hover:border-black/20 hover:bg-white"
      }`}
      aria-pressed={selected}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          selected
            ? "bg-[#8b6d52] text-white"
            : "bg-neutral-100 text-neutral-500"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-neutral-900">
          {option.label}
        </span>
        <span className="mt-0.5 hidden text-[10px] leading-4 text-neutral-500 xl:block">
          {
            option.description
          }
        </span>
      </span>

      <span
        className={`h-4 w-4 shrink-0 rounded-full border p-[3px] ${
          selected
            ? "border-[#8b6d52]"
            : "border-neutral-300"
        }`}
      >
        <span
          className={`block h-full w-full rounded-full ${
            selected
              ? "bg-[#8b6d52]"
              : "bg-transparent"
          }`}
        />
      </span>
    </button>
  );
}

/* =========================================
   DECORATIVE EDITORIAL PANEL
========================================= */

function EditorialPanel() {
  return (
    <RegisterLaminateShowcase />
  );
}

/* =========================================
   PAGE
========================================= */

export default function RegisterPage() {
  const router =
    useRouter();

  const [
    accountType,
    setAccountType,
  ] = useState(
    "PERSON"
  );

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const isCompany =
    accountType ===
    "COMPANY";

  const passwordScore =
    useMemo(() => {
      const password =
        form.password;

      let score = 0;

      if (
        password.length >=
        8
      ) {
        score += 1;
      }

      if (
        /[A-Z]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /[0-9]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /[^A-Za-z0-9]/.test(
          password
        )
      ) {
        score += 1;
      }

      return score;
    }, [
      form.password,
    ]);

  const updateField =
    (field) =>
    (event) => {
      const value =
        event.target.value;

      setForm(
        (
          current
        ) => ({
          ...current,
          [field]:
            value,
        })
      );

      if (
        errorMessage
      ) {
        setErrorMessage(
          ""
        );
      }
    };

  const validateForm =
    () => {
      if (
        !cleanText(
          form.first_name
        ) ||
        !cleanText(
          form.last_name
        )
      ) {
        return "Completa tu nombre y apellido.";
      }

      if (
        !normalizeEmail(
          form.email
        )
      ) {
        return "Ingresa un correo electrónico válido.";
      }

      if (
        form.password.length <
        8
      ) {
        return "La contraseña debe tener al menos 8 caracteres.";
      }

      if (
        form.password !==
        form.confirm_password
      ) {
        return "Las contraseñas no coinciden.";
      }

      if (
        isCompany &&
        (
          !cleanText(
            form.company_legal_name
          ) ||
          !cleanText(
            form.company_rut
          ) ||
          !cleanText(
            form.company_business_activity
          ) ||
          !cleanText(
            form.company_address_line
          ) ||
          !cleanText(
            form.company_commune
          ) ||
          !cleanText(
            form.company_city
          ) ||
          !cleanText(
            form.company_region
          )
        )
      ) {
        return "Completa los datos obligatorios de la empresa.";
      }

      if (
        !acceptedTerms
      ) {
        return "Debes aceptar los Términos y Condiciones y la Política de Privacidad.";
      }

      return "";
    };

  const buildPersonPayload =
    () => ({
      first_name:
        cleanText(
          form.first_name
        ),
      last_name:
        cleanText(
          form.last_name
        ),
      email:
        normalizeEmail(
          form.email
        ),
      password:
        form.password,
      phone:
        cleanText(
          form.phone
        ) ||
        undefined,
      rut:
        cleanText(
          form.rut
        ) ||
        undefined,
    });

  const buildCompanyPayload =
    () => ({
      ...buildPersonPayload(),
      company: {
        legal_name:
          cleanText(
            form.company_legal_name
          ),
        trade_name:
          cleanText(
            form.company_trade_name
          ) ||
          undefined,
        rut:
          cleanText(
            form.company_rut
          ),
        business_activity:
          cleanText(
            form.company_business_activity
          ),
        billing_email:
          normalizeEmail(
            form.company_billing_email
          ) ||
          normalizeEmail(
            form.email
          ),
        phone:
          cleanText(
            form.company_phone
          ) ||
          cleanText(
            form.phone
          ) ||
          undefined,
        address_line:
          cleanText(
            form.company_address_line
          ),
        commune:
          cleanText(
            form.company_commune
          ),
        city:
          cleanText(
            form.company_city
          ),
        region:
          cleanText(
            form.company_region
          ),
        country:
          "Chile",
        position_name:
          cleanText(
            form.company_position_name
          ) ||
          "Contacto principal",
      },
    });

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setErrorMessage(
          validationError
        );
        return;
      }

      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const response =
          isCompany
            ? await registerCompanyAccount(
                buildCompanyPayload()
              )
            : await apiRequest(
                PERSON_REGISTER_ENDPOINT,
                {
                  method:
                    "POST",
                  body:
                    buildPersonPayload(),
                }
              );

        if (
          !response?.success ||
          !response?.token ||
          !response?.user
        ) {
          throw new Error(
            response?.message ||
              "La respuesta del registro no es válida."
          );
        }

        setSuccessMessage(
          response?.message ||
            "Cuenta creada correctamente."
        );

        persistSessionAndContinue(
          response
        );
      } catch (
        error
      ) {
        console.error(
          "Error registrando cuenta:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No fue posible crear la cuenta. Intenta nuevamente."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f3efe9] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1540px] gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <EditorialPanel />

        <section className="flex min-h-[760px] items-center rounded-[28px] border border-black/5 bg-white/95 p-5 shadow-[0_26px_80px_rgba(68,52,40,0.10)] sm:p-8 xl:p-12">
          <div className="mx-auto w-full max-w-[760px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8b6d52]">
                Bienvenido
              </p>

              <h2 className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.035em] text-neutral-950 sm:text-[48px]">
                Regístrate
              </h2>

              <p className="mt-3 text-[13px] leading-6 text-neutral-500">
                Crea tu cuenta para comprar, cotizar y gestionar tu experiencia Laminatiword.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  icon={IconUser}
                  value={
                    form.first_name
                  }
                  onChange={
                    updateField(
                      "first_name"
                    )
                  }
                  placeholder="Tu nombre"
                  required
                  autoComplete="given-name"
                />

                <Field
                  label="Apellido"
                  icon={IconUser}
                  value={
                    form.last_name
                  }
                  onChange={
                    updateField(
                      "last_name"
                    )
                  }
                  placeholder="Tu apellido"
                  required
                  autoComplete="family-name"
                />
              </div>

              <div className="mt-4">
                <Field
                  label="Correo electrónico"
                  icon={IconMail}
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    updateField(
                      "email"
                    )
                  }
                  placeholder="tu@correo.cl"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Teléfono"
                  icon={IconPhone}
                  type="tel"
                  value={
                    form.phone
                  }
                  onChange={
                    updateField(
                      "phone"
                    )
                  }
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                />

                <Field
                  label={
                    isCompany
                      ? "RUT contacto (opcional)"
                      : "RUT (opcional)"
                  }
                  value={
                    form.rut
                  }
                  onChange={
                    updateField(
                      "rut"
                    )
                  }
                  placeholder="12.345.678-5"
                  autoComplete="off"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <PasswordField
                    label="Contraseña"
                    value={
                      form.password
                    }
                    onChange={
                      updateField(
                        "password"
                      )
                    }
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    visible={
                      showPassword
                    }
                    onToggle={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                  />

                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map(
                        (
                          step
                        ) => (
                          <span
                            key={
                              step
                            }
                            className={`h-1 flex-1 rounded-full ${
                              passwordScore >=
                              step
                                ? "bg-[#8b6d52]"
                                : "bg-neutral-200"
                            }`}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                <PasswordField
                  label="Confirmar contraseña"
                  value={
                    form.confirm_password
                  }
                  onChange={
                    updateField(
                      "confirm_password"
                    )
                  }
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  visible={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[12px] font-medium text-neutral-800">
                  Tipo de cliente
                </p>

                <div className="grid gap-3 md:grid-cols-3">
                  {ACCOUNT_TYPES.map(
                    (
                      option
                    ) => (
                      <AccountType
                        key={
                          option.id
                        }
                        option={
                          option
                        }
                        selected={
                          accountType ===
                          option.id
                        }
                        onSelect={
                          setAccountType
                        }
                      />
                    )
                  )}
                </div>

                {accountType ===
                  "PROFESSIONAL" && (
                  <p className="mt-2 text-[10px] leading-5 text-neutral-400">
                    Esta cuenta se registra actualmente como cliente personal. La especialidad profesional podrá incorporarse al perfil en una etapa posterior.
                  </p>
                )}
              </div>

              {isCompany && (
                <section className="mt-6 rounded-[22px] border border-[#8b6d52]/15 bg-[#faf7f3] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#efe5da] text-[#7a5d47]">
                      <IconBuilding className="h-[18px] w-[18px]" />
                    </span>

                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900">
                        Datos de la empresa
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                        Utilizaremos estos datos para identificar tu cuenta comercial y futuras facturas.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Razón social"
                      value={
                        form.company_legal_name
                      }
                      onChange={
                        updateField(
                          "company_legal_name"
                        )
                      }
                      placeholder="Empresa SpA"
                      required
                    />

                    <Field
                      label="Nombre de fantasía"
                      value={
                        form.company_trade_name
                      }
                      onChange={
                        updateField(
                          "company_trade_name"
                        )
                      }
                      placeholder="Opcional"
                    />

                    <Field
                      label="RUT empresa"
                      value={
                        form.company_rut
                      }
                      onChange={
                        updateField(
                          "company_rut"
                        )
                      }
                      placeholder="76.123.456-7"
                      required
                    />

                    <Field
                      label="Giro"
                      value={
                        form.company_business_activity
                      }
                      onChange={
                        updateField(
                          "company_business_activity"
                        )
                      }
                      placeholder="Arquitectura, construcción..."
                      required
                    />

                    <Field
                      label="Correo facturación"
                      icon={IconMail}
                      type="email"
                      value={
                        form.company_billing_email
                      }
                      onChange={
                        updateField(
                          "company_billing_email"
                        )
                      }
                      placeholder="facturacion@empresa.cl"
                    />

                    <Field
                      label="Teléfono empresa"
                      icon={IconPhone}
                      type="tel"
                      value={
                        form.company_phone
                      }
                      onChange={
                        updateField(
                          "company_phone"
                        )
                      }
                      placeholder="+56 2 1234 5678"
                    />

                    <div className="sm:col-span-2">
                      <Field
                        label="Dirección"
                        value={
                          form.company_address_line
                        }
                        onChange={
                          updateField(
                            "company_address_line"
                          )
                        }
                        placeholder="Calle, número"
                        required
                      />
                    </div>

                    <Field
                      label="Comuna"
                      value={
                        form.company_commune
                      }
                      onChange={
                        updateField(
                          "company_commune"
                        )
                      }
                      placeholder="San Miguel"
                      required
                    />

                    <Field
                      label="Ciudad"
                      value={
                        form.company_city
                      }
                      onChange={
                        updateField(
                          "company_city"
                        )
                      }
                      placeholder="Santiago"
                      required
                    />

                    <Field
                      label="Región"
                      value={
                        form.company_region
                      }
                      onChange={
                        updateField(
                          "company_region"
                        )
                      }
                      placeholder="Región Metropolitana"
                      required
                    />

                    <Field
                      label="Cargo / relación"
                      value={
                        form.company_position_name
                      }
                      onChange={
                        updateField(
                          "company_position_name"
                        )
                      }
                      placeholder="Contacto principal"
                    />
                  </div>
                </section>
              )}

              <label className="mt-6 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={
                    acceptedTerms
                  }
                  onChange={(
                    event
                  ) =>
                    setAcceptedTerms(
                      event.target
                        .checked
                    )
                  }
                  className="peer sr-only"
                />

                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-black/20 bg-white text-white transition peer-checked:border-[#8b6d52] peer-checked:bg-[#8b6d52] peer-focus-visible:ring-4 peer-focus-visible:ring-[#8b6d52]/15">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>

                <span className="text-[11px] leading-5 text-neutral-500">
                  Acepto los{" "}
                  <span className="font-medium text-neutral-800 underline underline-offset-2">
                    Términos y Condiciones
                  </span>{" "}
                  y la{" "}
                  <span className="font-medium text-neutral-800 underline underline-offset-2">
                    Política de Privacidad
                  </span>{" "}
                  de Laminatiword.
                </span>
              </label>

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700"
                >
                  {
                    errorMessage
                  }
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] leading-5 text-emerald-700"
                >
                  {
                    successMessage
                  }
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="mt-6 flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[#342a22] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(52,42,34,0.18)] transition hover:bg-[#241d18] disabled:cursor-wait disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? "Creando cuenta..."
                    : "Crear cuenta"}
                </span>

                {!submitting && (
                  <IconArrow className="h-[17px] w-[17px]" />
                )}
              </button>

              <div className="mt-5 flex items-center gap-4">
                <span className="h-px flex-1 bg-black/10" />
                <p className="text-[11px] text-neutral-500">
                  ¿Ya tienes cuenta?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-neutral-900 underline underline-offset-3"
                  >
                    Inicia sesión
                  </Link>
                </p>
                <span className="h-px flex-1 bg-black/10" />
              </div>

              <div className="mt-7 grid gap-3 rounded-[20px] bg-[#f8f5f1] p-4 sm:grid-cols-3 sm:p-5">
                <div className="flex items-center gap-3">
                  <IconShield className="h-6 w-6 shrink-0 text-[#6f533f]" />
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-800">
                      Compra segura
                    </p>
                    <p className="mt-0.5 text-[9px] text-neutral-400">
                      Tus datos protegidos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:border-l sm:border-black/10 sm:pl-4">
                  <IconSupport className="h-6 w-6 shrink-0 text-[#6f533f]" />
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-800">
                      Asesoría especializada
                    </p>
                    <p className="mt-0.5 text-[9px] text-neutral-400">
                      Te acompañamos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:border-l sm:border-black/10 sm:pl-4">
                  <IconDocument className="h-6 w-6 shrink-0 text-[#6f533f]" />
                  <div>
                    <p className="text-[10px] font-semibold text-neutral-800">
                      Cotizaciones
                    </p>
                    <p className="mt-0.5 text-[9px] text-neutral-400">
                      Para tus proyectos
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/"
                  )
                }
                className="mx-auto mt-5 block text-[10px] font-medium text-neutral-400 transition hover:text-neutral-700"
              >
                ← Volver a Laminati
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
