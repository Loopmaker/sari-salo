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

// Validates the full payload shape before anything touches Dexie. A
// malformed or partial server response must never be allowed to
// replace a working local catalog — this is the gate that protects
// that invariant, separate from the transaction's own atomicity.
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

// Refreshes the local catalog cache from the server. This is a
// best-effort background operation: if it fails validation or the
// network request fails, the existing Dexie catalog is left
// completely untouched. The POS must always remain usable from
// whatever catalog is already local.
export async function refreshCatalogFromServer(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/catalog");
    if (!res.ok) return { ok: false };

    const data = await res.json();

    // Gate: reject the entire refresh if the payload doesn't match
    // the expected shape, before any Dexie write is attempted.
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

    // Atomic swap: clear + repopulate both tables in one transaction.
    // Combined with the validation gate above, this protects against
    // both a bad payload AND a failure mid-write.
    await db.transaction("rw", db.categories, db.products, async () => {
      await db.categories.clear();
      await db.products.clear();
      await db.categories.bulkAdd(categories);
      await db.products.bulkAdd(products);
    });

    return { ok: true };
  } catch {
    // Network error, parse error, transaction failure — in every
    // case, the previous catalog (if any) is untouched.
    return { ok: false };
  }
}
