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

  const CATEGORY_ORDER = ["Meals", "Drinks", "Desserts"];
  const categoryRank = (name: string) => {
    const index = CATEGORY_ORDER.indexOf(name);
    return index === -1 ? CATEGORY_ORDER.length : index;
  };

  const serialized: StorefrontCategory[] = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      products: cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price.toString(),
        imagePath: p.imagePath ?? undefined,
      })),
    }))
    .sort((a, b) => {
      const rankDiff = categoryRank(a.name) - categoryRank(b.name);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name); // fallback for unlisted categories
    });

  const todaysSpecial = serialized
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
