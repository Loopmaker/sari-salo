import Image from "next/image";

export interface StorefrontProduct {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
}

export function StorefrontProductCard({
  product,
  onQuickAdd,
}: {
  product: StorefrontProduct;
  onQuickAdd: (product: StorefrontProduct) => void;
}) {
  return (
    <div className="bg-counter border border-counter-line rounded-lg overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-counter-line/40 flex items-center justify-center text-ink/30 text-sm">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          "Photo"
        )}
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-medium text-ink">{product.name}</div>
          <div className="font-mono text-ink/70">₱{product.price}</div>
        </div>
        <button
          onClick={() => onQuickAdd(product)}
          aria-label={`Add ${product.name} to cart`}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg bg-annatto text-white text-xl hover:bg-annatto/90 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
