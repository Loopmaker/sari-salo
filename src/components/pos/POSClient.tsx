"use client";

import { useState } from "react";
import { ProductGrid } from "./ProductGrid";
import { CartPanel } from "./CartPanel";
import { createOrderOffline } from "@/lib/create-order-offline";
import { RecentOrders } from "./RecentOrders";

export interface Product {
  id: string;
  name: string;
  price: string;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  price: string;
  quantity: number;
}

interface Confirmation {
  orderNumber: string;
  total: string;
}

export function POSClient({ categories }: { categories: Category[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastConfirmation, setLastConfirmation] = useState<Confirmation | null>(
    null,
  );

  function addToCart(product: Product) {
    setLastConfirmation(null);
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
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((line) => line.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((line) => (line.id === itemId ? { ...line, quantity } : line)),
    );
  }

  const totalCents = cart.reduce(
    (sum, line) =>
      sum + Math.round(parseFloat(line.price) * 100) * line.quantity,
    0,
  );
  const total = totalCents / 100;

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setLastError(null);
    setLastConfirmation(null);

    try {
      const result = await createOrderOffline(
        cart.map((line) => ({
          id: line.id,
          productId: line.productId,
          productName: line.name,
          price: line.price,
          quantity: line.quantity,
        })),
      );

      setLastConfirmation({
        orderNumber: result.orderNumber,
        total: result.total,
      });
      setCart([]);
    } catch {
      setLastError("Could not save order locally.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-4 py-2 rounded ${
                activeCategory === cat.id
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <ProductGrid
          products={
            categories.find((c) => c.id === activeCategory)?.products ?? []
          }
          onSelect={addToCart}
        />
      </div>

      <div className="w-80 flex flex-col">
        <CartPanel
          cart={cart}
          total={total}
          submitting={submitting}
          error={lastError}
          confirmation={lastConfirmation}
          onUpdateQuantity={updateQuantity}
          onCheckout={checkout}
        />
        <div className="border-t p-4">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
