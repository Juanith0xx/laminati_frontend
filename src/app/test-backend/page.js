"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/services/api";
import { getProducts } from "@/services/products.service";

export default function TestBackendPage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        setError(null);

        // 1. Comprobar backend + PostgreSQL
        const healthResponse = await apiRequest("/health");

        // 2. Comprobar catálogo real
        const productsResponse = await getProducts();

        setHealth(healthResponse);
        setProducts(productsResponse.products || []);
      } catch (err) {
        console.error("Error conexión backend:", err);

        setError({
          message: err.message,
          code: err.code,
          status: err.status,
        });
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Probando conexión con backend...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-lg rounded-xl border border-red-500 p-6">
          <h1 className="mb-4 text-2xl font-bold text-red-400">
            Error de conexión
          </h1>

          <pre className="overflow-auto text-sm">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">
          Prueba Frontend → Backend
        </h1>

        <div className="mb-8 rounded-xl border border-green-500 p-6">
          <h2 className="mb-4 text-2xl font-semibold text-green-400">
            Backend conectado ✅
          </h2>

          <p>
            Servidor:{" "}
            <strong>{health?.server}</strong>
          </p>

          <p>
            PostgreSQL:{" "}
            <strong>{health?.database?.status}</strong>
          </p>

          <p>
            Base de datos:{" "}
            <strong>{health?.database?.name}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-white/20 p-6">
          <h2 className="mb-4 text-2xl font-semibold">
            Productos recibidos: {products.length}
          </h2>

          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg bg-white/10 p-4"
              >
                <p className="font-semibold">
                  {product.name}
                </p>

                <p>SKU: {product.sku}</p>

                <p>
                  Precio: $
                  {Number(product.final_price).toLocaleString(
                    "es-CL"
                  )}
                </p>

                <p>
                  Stock web: {product.available_web}
                </p>

                <p>
                  Disponible:{" "}
                  {product.in_stock ? "Sí" : "No"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}