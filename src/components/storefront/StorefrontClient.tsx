"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  StorefrontProductCard,
  type StorefrontProduct,
} from "./StorefrontProductCard";
import { StorefrontFooter } from "./StorefrontFooter";
import {
  StorefrontCartDrawer,
  type CheckoutView,
} from "./StorefrontCartDrawer";
import { getProductImageUrl } from "@/lib/storage";

export interface StorefrontCategory {
  id: string;
  name: string;
  products: StorefrontProduct[];
}

export interface StorefrontCartLine {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  imagePath?: string;
}

const CART_STORAGE_KEY = "sari-salo-storefront-cart";

export function StorefrontClient({
  categories,
  todaysSpecial,
}: {
  categories: StorefrontCategory[];
  todaysSpecial: StorefrontProduct[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<StorefrontCartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Legitimate one-time sync with an external system — localStorage
        // isn't available during SSR, so this can only run post-mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      // Corrupt or inaccessible storage — just start with an empty cart.
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  function handleQuickAdd(product: StorefrontProduct) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imagePath: product.imagePath,
        },
      ];
    });
    setCartOpen(true);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity } : line,
      ),
    );
  }

  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotalCents = cart.reduce(
    (sum, line) =>
      sum + Math.round(parseFloat(line.price) * 100) * line.quantity,
    0,
  );
  const cartTotal = cartTotalCents / 100;

  const [checkoutView, setCheckoutView] = useState<CheckoutView>("cart");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    orderNumber: string;
    customerName: string;
  } | null>(null);

  function handleCloseCart() {
    setCartOpen(false);
    setCheckoutView("cart");
    setSubmitError(null);
  }

  const pendingOrderIdRef = useRef<string | null>(null);

  async function handleSubmitOrder() {
    if (customerName.trim().length === 0 || cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    if (pendingOrderIdRef.current === null) {
      pendingOrderIdRef.current = crypto.randomUUID();
    }

    try {
      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingOrderIdRef.current,
          customerName: customerName.trim(),
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });

      if (!res.ok) {
        let message = "Could not place order. Please try again.";
        try {
          const data = await res.json();
          message = data.error ?? message;
        } catch {}
        setSubmitError(message);
        return;
      }

      const data = await res.json();
      setConfirmation({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
      });
      setCart([]);
      setCustomerName("");
      setCheckoutView("confirmed");
      pendingOrderIdRef.current = null;
    } catch {
      setSubmitError("Network error — order not placed.");
    } finally {
      setSubmitting(false);
    }
  }

  const gridRef = useRef<HTMLDivElement>(null);

  function handleFooterCategorySelect(categoryId: string) {
    setActiveCategory(categoryId);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeProducts =
    categories.find((c) => c.id === activeCategory)?.products ?? [];

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
        <button
          onClick={() => setCartOpen(true)}
          aria-label={`Open cart, ${cartItemCount} item${
            cartItemCount === 1 ? "" : "s"
          }`}
          className="relative w-11 h-11 flex items-center justify-center rounded-lg hover:bg-counter transition-colors text-ink"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-annatto text-white text-xs font-mono w-5 h-5 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </button>
      </header>

      <section className="relative px-6 py-16 sm:py-20 overflow-hidden">
        <Image
          src={getProductImageUrl("sinigang.jpg")}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-ink/70 to-ink/90" />
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

      <StorefrontCartDrawer
        isOpen={cartOpen}
        onClose={handleCloseCart}
        view={checkoutView}
        lines={cart}
        total={cartTotal}
        onUpdateQuantity={updateCartQuantity}
        onStartCheckout={() => setCheckoutView("checkout")}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        onSubmitOrder={handleSubmitOrder}
        submitting={submitting}
        submitError={submitError}
        confirmation={confirmation}
      />
    </div>
  );
}
