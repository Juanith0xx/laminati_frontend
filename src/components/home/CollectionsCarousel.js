import Image from "next/image";
import Link from "next/link";

const MAX_HOME_COLLECTIONS = 8;

function getCollectionHref(collection) {
  const slug = String(collection?.slug || "").trim();
  return slug
    ? `/productos?collection=${encodeURIComponent(slug)}`
    : "/colecciones";
}

export default function CollectionsCarousel({ collections = [] }) {
  const visibleCollections = Array.isArray(collections)
    ? collections.slice(0, MAX_HOME_COLLECTIONS)
    : [];

  if (visibleCollections.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Colecciones destacadas"
    >
      {visibleCollections.map((collection) => {
        const image = collection?.visual_background || null;
        const name = String(
          collection?.name || collection?.title || "Colección Laminati"
        ).trim();

        return (
          <article
            key={collection?.id || collection?.slug || name}
            className="group min-w-0"
          >
            <Link
              href={getCollectionHref(collection)}
              prefetch={false}
              className="relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-neutral-900 ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`Ver colección ${name}`}
            >
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 50vw, 25vw"
                  loading="lazy"
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
              )}

              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"
                aria-hidden="true"
              />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  {collection?.brand || "Abet Laminati"}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                  {name}
                </h3>
                {Number(collection?.product_count || 0) > 0 ? (
                  <p className="mt-2 text-xs font-medium text-white/85">
                    {collection.product_count} productos
                  </p>
                ) : null}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
