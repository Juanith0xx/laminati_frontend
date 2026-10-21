import Link from "next/link";

const cards = [
  {
    label:
      "Stock Distribución Chile",
    value:
      "—",
    secondary:
      "Valorización USD",
    href:
      "/gerencia/stock",
    icon:
      "stock",
  },
  {
    label:
      "Ventas Distribución Chile",
    value:
      "—",
    secondary:
      "Valorización USD",
    href:
      "/gerencia/ventas",
    icon:
      "sales",
  },
  {
    label:
      "Cotizaciones Proyectos Chile",
    value:
      "—",
    secondary:
      "Valorización USD",
    href:
      "/gerencia/cotizaciones-proyectos",
    icon:
      "quotes",
  },
];

function CardIcon({
  type,
}) {
  if (
    type ===
    "sales"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5"
      >
        <path d="M5 20V10h3v10H5Zm6 0V4h3v16h-3Zm6 0v-7h3v7h-3Z" />
      </svg>
    );
  }

  if (
    type ===
    "quotes"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5"
      >
        <path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v4h4M8 12h8M8 16h6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" />
      <path d="m4.8 7.7 7.2 4.2 7.2-4.2M12 12v8.4" />
    </svg>
  );
}

export default function GerenciaDashboardPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1450px]">
        <section className="rounded-[1.75rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Gerencia Italia
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
            Resumen
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Stock, ventas y cotizaciones de proyectos de distribución Chile valorizados en USD.
          </p>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-3">
          {cards.map(
            (
              card
            ) => (
              <Link
                key={
                  card.href
                }
                href={
                  card.href
                }
                className="group rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                      <CardIcon
                        type={
                          card.icon
                        }
                      />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-700">
                        {
                          card.label
                        }
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
                        {
                          card.value
                        }
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        {
                          card.secondary
                        }
                      </p>
                    </div>
                  </div>

                  <span className="mt-2 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-black">
                    →
                  </span>
                </div>
              </Link>
            )
          )}
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Detalles
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950">
                Panel preparado
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Fase 2
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#f7f7f5] p-5">
              <p className="text-xs font-medium text-neutral-500">
                Stock
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                Se conectará al inventario en la Fase 3.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f7f5] p-5">
              <p className="text-xs font-medium text-neutral-500">
                Ventas
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                Se conectará a pedidos valorizados en USD en la Fase 4.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f7f5] p-5">
              <p className="text-xs font-medium text-neutral-500">
                Cotizaciones
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-900">
                Se conectará a proyectos valorizados en USD en la Fase 5.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
