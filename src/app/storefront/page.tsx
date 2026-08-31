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

  const FEATURED_CATEGORY_PRIORITY = ["Meals"];
  const categoriesForSpecial = [...serialized].sort((a, b) => {
    const aIsPriority = FEATURED_CATEGORY_PRIORITY.includes(a.name);
    const bIsPriority = FEATURED_CATEGORY_PRIORITY.includes(b.name);
    if (aIsPriority && !bIsPriority) return -1;
    if (bIsPriority && !aIsPriority) return 1;
    return 0; // otherwise preserve existing (alphabetical) order
  });

  const todaysSpecial = categoriesForSpecial
    .filter((cat) => cat.products.length > 0)
    .slice(0, 3)
    .map((cat) => cat.products[0]);

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
