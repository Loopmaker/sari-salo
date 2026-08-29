"use client";

import { useRef, useState } from "react";
import {
  StorefrontProductCard,
  type StorefrontProduct,
} from "./StorefrontProductCard";
import { StorefrontFooter } from "./StorefrontFooter";

export interface StorefrontCategory {
  id: string;
  name: string;
  products: StorefrontProduct[];
}

export function StorefrontClient({
  categories,
  todaysSpecial,
}: {
  categories: StorefrontCategory[];
  todaysSpecial: StorefrontProduct[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");

  function handleQuickAdd(product: StorefrontProduct) {
    // Placeholder only — no cart or order pipeline wired up yet.
    console.log("Quick add (placeholder):", product.name);
  }

  const gridRef = useRef<HTMLDivElement>(null);

  function handleFooterCategorySelect(categoryId: string) {
    setActiveCategory(categoryId);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeProducts =
    categories.find((c) => c.id === activeCategory)?.products ?? [];

  // Real, computed counts — not a marketing stat. Reflects whatever the
  // catalog actually contains.
  const dishCount = categories.reduce(
    (sum, cat) => sum + cat.products.length,
    0,
  );
  const categoryCount = categories.length;

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink/50">No menu items available right now.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-paper border-b border-counter-line">
        <h1 className="font-semibold text-lg text-ink">Sari-Salo</h1>
      </header>

      <section className="relative px-6 py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-steel to-ink" />
        <div className="absolute inset-0 flex items-center justify-center text-paper/30 text-xs tracking-wide">
          photo placeholder
        </div>
        <div className="relative max-w-lg">
          <p className="text-annatto font-medium text-sm mb-3">Fresh today</p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-paper leading-tight mb-2">
            Home-cooked meals,
          </h2>
          <h2 className="text-4xl sm:text-5xl font-semibold text-paper leading-tight mb-6">
            made fresh.
          </h2>
          <button
            onClick={() =>
              gridRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="bg-annatto text-white px-6 py-3 rounded-lg font-medium hover:bg-annatto/90 transition-colors mb-6"
          >
            Explore menu →
          </button>
          <p className="font-mono text-paper/70 text-sm">
            {dishCount} dishes · {categoryCount} categories
          </p>
        </div>
      </section>

      {todaysSpecial.length > 0 && (
        <section className="px-6 py-8 border-b border-counter-line">
          <p className="text-ink/50 text-xs font-medium tracking-wide uppercase mb-3">
            Today&apos;s special
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-4">
            {todaysSpecial[0] && (
              <div
                className={
                  todaysSpecial.length === 1
                    ? "sm:col-span-3"
                    : "sm:col-span-2 sm:row-span-2"
                }
              >
                <StorefrontProductCard
                  product={todaysSpecial[0]}
                  onQuickAdd={handleQuickAdd}
                  featured
                />
              </div>
            )}
            {todaysSpecial[1] && (
              <div className="sm:col-start-3 sm:row-start-1">
                <StorefrontProductCard
                  product={todaysSpecial[1]}
                  onQuickAdd={handleQuickAdd}
                />
              </div>
            )}
            {todaysSpecial[2] && (
              <div className="sm:col-start-3 sm:row-start-2">
                <StorefrontProductCard
                  product={todaysSpecial[2]}
                  onQuickAdd={handleQuickAdd}
                />
              </div>
            )}
          </div>
        </section>
      )}

      <nav className="flex gap-2 px-6 py-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-annatto text-white"
                : "bg-counter border border-counter-line text-ink hover:bg-counter-line"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      <main ref={gridRef} className="px-6 pb-10">
        {activeProducts.length === 0 ? (
          <p className="text-ink/50">No items available in this category.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </main>

      <StorefrontFooter
        categories={categories}
        onCategorySelect={handleFooterCategorySelect}
      />
    </div>
  );
}
