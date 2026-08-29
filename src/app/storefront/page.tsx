import { prisma } from "@/lib/prisma";
import {
  StorefrontClient,
  type StorefrontCategory,
} from "@/components/storefront/StorefrontClient";
import type { StorefrontProduct } from "@/components/storefront/StorefrontProductCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

async function getStorefrontCatalog(): Promise<{
  categories: StorefrontCategory[];
  todaysSpecial: StorefrontProduct[];
}> {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized: StorefrontCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      imagePath: p.imagePath ?? undefined,
    })),
  }));

  // No "featured" concept in the schema yet — first 3 active products,
  // in the same deterministic (alphabetical) order as the menu itself.
  const todaysSpecial = serialized.flatMap((cat) => cat.products).slice(0, 3);

  return { categories: serialized, todaysSpecial };
}

export default async function StorefrontPage() {
  const { categories, todaysSpecial } = await getStorefrontCatalog();

  return (
    <ErrorBoundary fallbackMessage="Reload the page to continue browsing the menu.">
      <StorefrontClient categories={categories} todaysSpecial={todaysSpecial} />
    </ErrorBoundary>
  );
}
