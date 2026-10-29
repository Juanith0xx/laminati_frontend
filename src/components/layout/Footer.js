"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/registro",
  "/checkout",
  "/mi-cuenta",
];

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  "contacto@laminati.cl";

const CONTACT_PHONE =
  "+56 9 5371 0480";

const CONTACT_PHONE_HREF =
  "tel:+56953710480";

const CONTACT_ADDRESS =
  "Av. Santa Rosa 5415, San Miguel";

const CONTACT_ADDRESS_REFERENCE =
  "Al costado de Construmart de Departamental";

const CONTACT_MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Av.%20Santa%20Rosa%205415%2C%20San%20Miguel%2C%20Chile";

function MailIcon({ className = "" }) {
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

function PhoneIcon({ className = "" }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MapPinIcon({ className = "" }) {
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
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function ShieldLockIcon({ className = "" }) {
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
      <path d="M12 3 20 6v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3Z" />
      <rect x="9" y="11" width="6" height="5" rx="1" />
      <path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11" />
    </svg>
  );
}

function ContactIcon({ children }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-neutral-50 text-neutral-700">
      {children}
    </span>
  );
}

export default function Footer() {
  const pathname = usePathname();

  if (
    HIDDEN_PREFIXES.some(
      (prefix) =>
        pathname === prefix ||
        pathname.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }

  return (
    <footer className="mx-auto mt-12 w-full max-w-[1440px] px-4 pb-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(0,0,0,.03)] sm:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.55fr_.7fr_.7fr_.7fr] lg:gap-0">
          <div className="lg:pr-10">
            <Link
              href="/"
              className="inline-block"
              aria-label="Ir al inicio"
            >
              <span className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                Laminati Chile SPA.
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-6 text-neutral-500">
              Representantes oficiales de Abet Laminati · Distribución Karikal.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group flex w-fit items-center gap-3"
              >
                <ContactIcon>
                  <MailIcon className="h-[17px] w-[17px]" />
                </ContactIcon>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Correo
                  </p>

                  <p className="mt-0.5 text-sm font-medium text-neutral-700 transition group-hover:text-black">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </a>

              <a
                href={CONTACT_PHONE_HREF}
                className="group flex w-fit items-center gap-3"
              >
                <ContactIcon>
                  <PhoneIcon className="h-[17px] w-[17px]" />
                </ContactIcon>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Teléfono
                  </p>

                  <p className="mt-0.5 text-sm font-medium text-neutral-700 transition group-hover:text-black">
                    {CONTACT_PHONE}
                  </p>
                </div>
              </a>

              <a
                href={CONTACT_MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex max-w-sm items-start gap-3"
              >
                <ContactIcon>
                  <MapPinIcon className="h-[17px] w-[17px]" />
                </ContactIcon>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Showroom
                  </p>

                  <p className="mt-0.5 text-sm font-medium leading-5 text-neutral-700 transition group-hover:text-black">
                    {CONTACT_ADDRESS}
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-neutral-400">
                    {CONTACT_ADDRESS_REFERENCE}
                  </p>
                </div>
              </a>
            </div>
          </div>

          <div className="lg:border-l lg:border-neutral-100 lg:px-10">
            <p className="text-xs font-semibold text-neutral-950">
              Productos
            </p>

            <div className="mt-4 space-y-2.5 text-sm text-neutral-500">
              <Link
                className="block transition hover:text-black"
                href="/productos"
              >
                Laminados
              </Link>

              <Link
                className="block transition hover:text-black"
                href="/colecciones"
              >
                Colecciones
              </Link>
            </div>
          </div>

          <div className="lg:border-l lg:border-neutral-100 lg:px-10">
            <p className="text-xs font-semibold text-neutral-950">
              Empresa
            </p>

            <div className="mt-4 space-y-2.5 text-sm text-neutral-500">
              <Link
                className="block transition hover:text-black"
                href="/nosotros"
              >
                Nosotros
              </Link>

              <Link
                className="block transition hover:text-black"
                href="/contacto"
              >
                Contacto
              </Link>
            </div>

          </div>

          <div className="lg:border-l lg:border-neutral-100 lg:pl-10">
            <p className="text-xs font-semibold text-neutral-950">
              Ayuda
            </p>

            <div className="mt-4 space-y-2.5 text-sm text-neutral-500">
              <Link
                className="block transition hover:text-black"
                href="/mi-cuenta"
              >
                Mi cuenta
              </Link>

              <Link
                className="block transition hover:text-black"
                href="/contacto"
              >
                Cotizaciones y soporte
              </Link>
            </div>

            <div className="mt-16 w-full">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-900/[0.06] bg-emerald-50/70 text-emerald-700">
                  <ShieldLockIcon className="h-[18px] w-[18px]" />
                </span>

                <p className="text-sm font-semibold text-neutral-950">
                  Compra segura
                </p>
              </div>

              <p className="mt-2 max-w-[210px] text-xs leading-5 text-neutral-500">
                Protegemos tus datos durante todo el proceso de compra.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-neutral-100 pt-5 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 Laminati Chile SPA.
          </p>

          <p>
            Laminados, HPL y soluciones para arquitectura y mobiliario.
          </p>
        </div>
      </div>
    </footer>
  );
}