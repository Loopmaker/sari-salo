import type { Product } from "./POSClient";

export function ProductGrid({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="text-ink/50">No products available in this category.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className="bg-counter border border-counter-line rounded-lg p-4 text-left hover:bg-counter-line transition-colors"
        >
          <div className="font-medium text-ink">{product.name}</div>
          <div className="font-mono text-ink/70">₱{product.price}</div>
        </button>
      ))}
    </div>
  );
}
