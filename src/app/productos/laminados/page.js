import ProductsPage from "../page";
import {
  buildCatalogMetadata,
  getCatalogSeoConfig,
} from "@/lib/catalogSeo";

const config =
  getCatalogSeoConfig("laminados");

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
    <ProductsPage
      searchParams={searchParams}
      routeConfig={config}
    />
  );
}
