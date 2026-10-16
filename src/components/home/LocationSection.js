import Link from "next/link";

const CONTACT_EMAIL =
  "contacto@laminati.cl";

const CONTACT_PHONE =
  "+56 9 5371 0480";

const CONTACT_PHONE_HREF =
  "tel:+56953710480";

const ADDRESS =
  "Av. Santa Rosa 5415, San Miguel";

const ADDRESS_REFERENCE =
  "Al costado de Construmart Departamental";

const MAP_LINK =
  "https://www.google.com/maps/search/?api=1&query=Av.%20Santa%20Rosa%205413%2C%20San%20Miguel%2C%20Chile";

const MAP_EMBED =
  "https://www.google.com/maps?q=Av.%20Santa%20Rosa%205413%2C%20San%20Miguel%2C%20Chile&output=embed";

function LocationIcon({
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
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle
        cx="12"
        cy="10"
        r="2.6"
      />
    </svg>
  );
}

function PhoneIcon({
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
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function MailIcon({
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

function ArrowIcon({
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
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function StoreIcon({
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
      <path d="M3 9 5 4h14l2 5" />
      <path d="M5 13v7h14v-7" />
      <path d="M9 20v-5h6v5" />
      <path d="M3 9c0 1.7 1 3 2.5 3S8 10.7 8 9c0 1.7 1 3 2.5 3S13 10.7 13 9c0 1.7 1 3 2.5 3S18 10.7 18 9c0 1.7 1 3 2.5 3S21 10.7 21 9" />
    </svg>
  );
}

function PeopleIcon({
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
        cx="9"
        cy="8"
        r="3"
      />
      <path d="M3.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M16.5 14c2.5.5 3.9 2.5 4 6" />
    </svg>
  );
}

function PackageIcon({
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
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function ContactRow({
  icon,
  label,
  children,
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.05] bg-[#f7f5f1] text-[#6f5b3e]">
        {icon}
      </span>

      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {label}
        </p>

        {children}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}) {
  return (
    <article className="flex items-start gap-4 rounded-[22px] border border-black/[0.05] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5f1ea] text-[#6f5b3e]">
        {icon}
      </span>

      <div>
        <h3 className="text-sm font-semibold text-neutral-950">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-neutral-500">
          {text}
        </p>
      </div>
    </article>
  );
}

export default function LocationSection() {
  return (
    <section className="bg-[#f7f6f3] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_16px_60px_rgba(0,0,0,.06)]">
          <div className="h-1 bg-gradient-to-r from-[#d8ad66] via-[#ead2a4] to-[#9f7e47]" />

          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="px-6 py-9 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9b7747]">
                Visítanos
              </p>

              <h2 className="mt-4 max-w-xl text-4xl font-medium tracking-[-0.045em] text-neutral-950 sm:text-5xl">
                Nuestra ubicación
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-500 sm:text-base">
                Visita nuestro showroom y recibe asesoría para elegir laminados, HPL y soluciones para arquitectura, diseño y mobiliario.
              </p>

              <div className="mt-8 space-y-5">
                <ContactRow
                  label="Dirección"
                  icon={
                    <LocationIcon className="h-5 w-5" />
                  }
                >
                  <p className="mt-1 text-sm font-semibold leading-5 text-neutral-900 sm:text-base">
                    {ADDRESS}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-400">
                    {ADDRESS_REFERENCE}
                  </p>
                </ContactRow>

                <ContactRow
                  label="Teléfono"
                  icon={
                    <PhoneIcon className="h-5 w-5" />
                  }
                >
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="mt-1 block text-sm font-semibold text-neutral-900 transition hover:text-[#8b6a3d] sm:text-base"
                  >
                    {CONTACT_PHONE}
                  </a>
                </ContactRow>

                <ContactRow
                  label="Correo"
                  icon={
                    <MailIcon className="h-5 w-5" />
                  }
                >
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-1 block text-sm font-semibold text-neutral-900 transition hover:text-[#8b6a3d] sm:text-base"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </ContactRow>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-black px-6 text-sm font-medium !text-white transition hover:bg-neutral-800 hover:!text-white"
                  style={{ color: "#ffffff" }}
                >
                  <span className="!text-white">
                    Cómo llegar
                  </span>

                  <ArrowIcon className="h-4 w-4 !text-white" />
                </a>

                <Link
                  href="/contacto"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-6 text-sm font-medium text-neutral-900 transition hover:border-black hover:bg-neutral-50"
                >
                  Contactar

                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[430px] border-t border-black/[0.05] bg-neutral-100 lg:min-h-[560px] lg:border-l lg:border-t-0">
              <iframe
                src={MAP_EMBED}
                title="Ubicación de Laminatiword en Av. Santa Rosa 5415, San Miguel"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 grayscale-[15%]"
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/35 to-transparent" />

              <div className="pointer-events-none absolute bottom-5 left-5 right-5 sm:left-7 sm:right-auto">
                <div className="max-w-sm rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_15px_45px_rgba(0,0,0,.12)] backdrop-blur-md">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Laminatiword · Showroom
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-neutral-900">
                    Av. Santa Rosa 5415
                  </p>

                  <p className="mt-0.5 text-xs text-neutral-500">
                    San Miguel, Santiago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={
              <StoreIcon className="h-5 w-5" />
            }
            title="Showroom físico"
            text="Conoce laminados y HPL en persona antes de definir tu proyecto."
          />

          <FeatureCard
            icon={
              <PeopleIcon className="h-5 w-5" />
            }
            title="Atención personalizada"
            text="Te asesoramos para encontrar una solución acorde a tu proyecto."
          />

          <FeatureCard
            icon={
              <PackageIcon className="h-5 w-5" />
            }
            title="Retiro en tienda"
            text="Compra en línea y retira tus productos directamente en nuestro showroom."
          />
        </div>
      </div>
    </section>
  );
}
