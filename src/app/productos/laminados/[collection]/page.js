import { notFound } from "next/navigation";
import ProductsPage from "../../page";
import {
  buildCatalogMetadata,
  getLaminadosCollectionConfig,
  getLaminadosCollectionSlugs,
} from "@/lib/catalogSeo";

export function generateStaticParams() {
  return getLaminadosCollectionSlugs()
    .map(
      (collection) => ({
        collection,
      })
    );
}

export async function generateMetadata({
  params,
  searchParams,
}) {
  const routeParams =
    await params;

  const queryParams =
    await searchParams;

  const config =
    getLaminadosCollectionConfig(
      routeParams?.collection
    );

  if (!config) {
    return {
      title:
        "Colección no encontrada | Laminati Chile",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildCatalogMetadata(
    config,
    queryParams?.page
  );
}

export default async function LaminadosCollectionPage({
  params,
  searchParams,
}) {
  const routeParams =
    await params;

  const config =
    getLaminadosCollectionConfig(
      routeParams?.collection
    );

  if (!config) {
    notFound();
  }

  return (
    <ProductsPage
      searchParams={searchParams}
      routeConfig={config}
    />
  );
}
