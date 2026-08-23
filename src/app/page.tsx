"use client";

import { useEffect, useState } from "react";
import { db } from "@/db/schema";
import { getOrCreateTerminal } from "@/lib/terminal";
import { refreshCatalogFromServer } from "@/lib/catalog-sync";
import { POSClient, type Category } from "@/components/pos/POSClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await getOrCreateTerminal();
      const localCategories = await loadCategoriesFromDexie();
      if (!cancelled) setCategories(localCategories);
      if (navigator.onLine) {
        const result = await refreshCatalogFromServer();
        if (result.ok && !cancelled) {
          const refreshed = await loadCategoriesFromDexie();
          setCategories(refreshed);
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (categories === null) {
    return <div className="p-8 text-gray-400">Loading catalog...</div>;
  }

  return (
    <ErrorBoundary fallbackMessage="Reload the page to continue taking orders.">
      <POSClient categories={categories} />
    </ErrorBoundary>
  );
}

async function loadCategoriesFromDexie(): Promise<Category[]> {
  const [cats, products] = await Promise.all([
    db.categories.toArray(),
    db.products.toArray(),
  ]);

  return cats.map((cat) => ({
    id: cat.id,
    name: cat.name,
    products: products
      .filter((p) => p.categoryId === cat.id && p.active)
      .map((p) => ({ id: p.id, name: p.name, price: p.price })),
  }));
}
