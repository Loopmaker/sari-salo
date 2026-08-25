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

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-6 py-4 border-b border-counter-line">
        <h1 className="font-semibold text-lg text-ink">Sari-Salo</h1>
      </header>

      <section className="bg-counter border-b border-counter-line px-6 py-10">
        <p className="text-annatto font-medium text-sm mb-2">Fresh today</p>
        <h2 className="text-3xl font-semibold text-ink mb-2">
          Home-cooked meals, made fresh
        </h2>
        <p className="text-ink/70">Browse today&apos;s menu below.</p>
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

      <main className="px-6 pb-10">
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
