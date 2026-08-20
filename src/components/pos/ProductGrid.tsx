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
      <p className="text-gray-400">No products available in this category.</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className="border rounded-lg p-4 text-left hover:bg-gray-50"
        >
          <div className="font-medium">{product.name}</div>
          <div className="text-gray-600">₱{product.price}</div>
        </button>
      ))}
    </div>
  );
}
