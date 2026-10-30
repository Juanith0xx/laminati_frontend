import Link from "next/link";
import CatalogPage from "@/components/catalog/CatalogPage";
import {
  buildCatalogMetadata,
  getCatalogSeoConfig,
} from "@/lib/catalogSeo";

const config =
  getCatalogSeoConfig("labgrade");

export async function generateMetadata({
  searchParams,
}) {
  const params =
    await searchParams;

  return buildCatalogMetadata(
    config,
    params?.page
  );
}

export default async function SeoCatalogPage({
  searchParams,
}) {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-[1900px] px-5 pt-10 sm:px-8 lg:px-10 lg:pt-14">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <Link
              href="/"
              className="transition-colors hover:text-neutral-950"
            >
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/productos"
              className="transition-colors hover:text-neutral-950"
            >
              Productos
            </Link>
            <span>/</span>
            <span>Labgrade</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {config?.eyebrow || "Superficies técnicas"}
              </p>

              <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                {config?.heading ||
                  "Labgrade · Superficies para laboratorio"}
              </h1>

              {config?.intro && (
                <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-500 sm:text-[15px] sm:leading-7">
                  {config.intro}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <CatalogPage
        searchParams={searchParams}
        routeConfig={config}
        hideSeoHeader
      />
    </>
  );
}
