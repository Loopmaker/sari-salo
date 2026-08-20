"use client";

import { useEffect, useState } from "react";
import { db } from "@/db/schema";
import { getOrCreateTerminal } from "@/lib/terminal";
import { refreshCatalogFromServer } from "@/lib/catalog-sync";
import { POSClient, type Category } from "@/components/pos/POSClient";

export default function Home() {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await getOrCreateTerminal();

      // Render from whatever's already local FIRST — boot must never
      // block on network reachability.
      const localCategories = await loadCategoriesFromDexie();
      if (!cancelled) setCategories(localCategories);

      // Then attempt a background refresh. If it succeeds, re-read
      // and update. If it fails or is rejected by validation, the UI
      // simply keeps showing what was already loaded — no error
      // surfaced to the cashier for a background sync miss.
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

  return <POSClient categories={categories} />;
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
