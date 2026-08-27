"use client";

import { useRef, useState } from "react";
import {
  StorefrontProductCard,
  type StorefrontProduct,
} from "./StorefrontProductCard";
import { StorefrontFooter } from "./StorefrontFooter";

interface StorefrontCategory {
  id: string;
  name: string;
  products: StorefrontProduct[];
}

const TODAYS_SPECIAL: StorefrontProduct[] = [
  { id: "m3", name: "Beef Caldereta", price: "110.00" },
  { id: "m1", name: "Chicken Rice", price: "85.00" },
  { id: "d2", name: "Buko Juice", price: "35.00" },
];

const DUMMY_CATEGORIES: StorefrontCategory[] = [
  {
    id: "meals",
    name: "Meals",
    products: [
      { id: "m1", name: "Chicken Rice", price: "85.00" },
      { id: "m2", name: "Pork Adobo", price: "95.00" },
      { id: "m3", name: "Beef Caldereta", price: "110.00" },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    products: [
      { id: "d1", name: "Iced Tea", price: "25.00" },
      { id: "d2", name: "Buko Juice", price: "35.00" },
    ],
  },
  {
    id: "snacks",
    name: "Snacks",
    products: [
      { id: "s1", name: "Turon", price: "20.00" },
      { id: "s2", name: "Banana Cue", price: "20.00" },
    ],
  },
];

export function StorefrontClient() {
  const [activeCategory, setActiveCategory] = useState(DUMMY_CATEGORIES[0].id);

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
    DUMMY_CATEGORIES.find((c) => c.id === activeCategory)?.products ?? [];

  // Real, computed counts — not a marketing stat. Reflects whatever the
  // catalog actually contains (dummy today, real once data-driven).
  const dishCount = DUMMY_CATEGORIES.reduce(
    (sum, cat) => sum + cat.products.length,
    0,
  );
  const categoryCount = DUMMY_CATEGORIES.length;

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

      <section className="px-6 py-8 border-b border-counter-line">
        <p className="text-ink/50 text-xs font-medium tracking-wide uppercase mb-3">
          Today&apos;s special
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-4">
          <div className="sm:col-span-2 sm:row-span-2">
            <StorefrontProductCard
              product={TODAYS_SPECIAL[0]}
              onQuickAdd={handleQuickAdd}
              featured
            />
          </div>
          <div className="sm:col-start-3 sm:row-start-1">
            <StorefrontProductCard
              product={TODAYS_SPECIAL[1]}
              onQuickAdd={handleQuickAdd}
            />
          </div>
          <div className="sm:col-start-3 sm:row-start-2">
            <StorefrontProductCard
              product={TODAYS_SPECIAL[2]}
              onQuickAdd={handleQuickAdd}
            />
          </div>
        </div>
      </section>

      <nav className="flex gap-2 px-6 py-4 overflow-x-auto">
        {DUMMY_CATEGORIES.map((cat) => (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeProducts.map((product) => (
            <StorefrontProductCard
              key={product.id}
              product={product}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      </main>

      <StorefrontFooter
        categories={DUMMY_CATEGORIES}
        onCategorySelect={handleFooterCategorySelect}
      />
    </div>
  );
}
