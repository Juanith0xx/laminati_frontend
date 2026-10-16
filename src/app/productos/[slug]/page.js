import { notFound } from "next/navigation";

import { getProductBySlug } from "@/services/products.service";

import ProductDetailClient from "./ProductDetailClient";
import ProjectProductDetailClient from "./ProjectProductDetailClient";

/* =========================================
   PRODUCT DETAIL PAGE
========================================= */

export default async function ProductPage({
  params,
}) {
  const { slug } = await params;

  try {
    const response =
      await getProductBySlug(slug);

    if (
      !response?.success ||
      !response?.product
    ) {
      notFound();
    }

    if (
      response.product
        .commercial_mode ===
      "PROJECT_ONLY"
    ) {
      return (
        <ProjectProductDetailClient
          product={
            response.product
          }
        />
      );
    }

    return (
      <ProductDetailClient
        product={response.product}
      />
    );
  } catch (error) {
    console.error(
      "Error cargando producto:",
      error
    );

    notFound();
  }
}