import Link from "next/link";
import { getCatalogFilters } from "@/services/products.service";

export default async function CategoriesSection() {
  let categories = [];

  try {
    const response = await getCatalogFilters();

    categories = response?.filters?.categories || [];
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28">
      <div className="site-container">
        {/* ENCABEZADO */}
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between lg:mb-14">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-neutral-400">
              Catálogo
            </p>

            <h2 className="text-3xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Explora por categoría
            </h2>
          </div>

          <Link
            href="/productos"
            className="group flex w-fit items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-black"
          >
            Ver todos los productos

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* CATEGORÍAS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/productos?category=${category.slug}`}
              className="group relative min-h-[280px] overflow-hidden rounded-[1.5rem] bg-[#f3f1ec] p-6 sm:min-h-[340px] sm:p-8 lg:min-h-[390px]"
            >
              {/* DECORACIÓN */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className={`absolute h-[75%] w-[75%] rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110 ${
                    index % 3 === 0
                      ? "-bottom-[25%] -right-[20%] bg-[#d5cec2]"
                      : index % 3 === 1
                        ? "-left-[20%] -top-[20%] bg-[#d8d5ce]"
                        : "-bottom-[25%] left-[10%] bg-[#ded8cd]"
                  }`}
                />
              </div>

              <div className="relative z-10 flex h-full min-h-[230px] flex-col justify-between sm:min-h-[284px] lg:min-h-[326px]">
                {/* PARTE SUPERIOR */}
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium tracking-[0.2em] text-neutral-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/50 text-lg transition-all duration-300 group-hover:bg-black group-hover:text-white">
                    ↗
                  </span>
                </div>

                {/* PARTE INFERIOR */}
                <div>
                  <h3 className="text-2xl font-medium tracking-[-0.025em] text-neutral-950 sm:text-3xl">
                    {category.name}
                  </h3>

                  <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-500">
                    Descubre productos, acabados y soluciones para
                    tus proyectos.
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}