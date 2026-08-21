import { db } from "@/db/schema";

interface RawProduct {
  id: string;
  categoryId: string;
  name: string;
  price: string;
  active: boolean;
  updatedAt: string;
}

interface RawCategory {
  id: string;
  name: string;
  updatedAt: string;
  products: RawProduct[];
}

function validateCatalogPayload(
  data: unknown,
): data is { categories: RawCategory[] } {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.categories)) return false;

  for (const cat of d.categories) {
    if (typeof cat.id !== "string" || cat.id.length === 0) return false;
    if (typeof cat.name !== "string" || cat.name.length === 0) return false;
    if (typeof cat.updatedAt !== "string") return false;
    if (!Array.isArray(cat.products)) return false;

    for (const p of cat.products) {
      if (typeof p.id !== "string" || p.id.length === 0) return false;
      if (typeof p.categoryId !== "string" || p.categoryId !== cat.id)
        return false;
      if (typeof p.name !== "string" || p.name.length === 0) return false;
      if (typeof p.price !== "string" || !/^\d+(\.\d{1,2})?$/.test(p.price))
        return false;
      if (typeof p.active !== "boolean") return false;
      if (typeof p.updatedAt !== "string") return false;
    }
  }

  return true;
}

export async function refreshCatalogFromServer(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/catalog");
    if (!res.ok) return { ok: false };

    const data = await res.json();

    if (!validateCatalogPayload(data)) return { ok: false };

    const categories = data.categories.map((c) => ({
      id: c.id,
      name: c.name,
      updatedAt: c.updatedAt,
    }));

    const products = data.categories.flatMap((c) =>
      c.products.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        price: p.price,
        active: p.active,
        updatedAt: p.updatedAt,
      })),
    );

    await db.transaction("rw", db.categories, db.products, async () => {
      await db.categories.clear();
      await db.products.clear();
      await db.categories.bulkAdd(categories);
      await db.products.bulkAdd(products);
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
