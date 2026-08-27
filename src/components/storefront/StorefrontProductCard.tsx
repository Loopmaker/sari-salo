import Image from "next/image";
import { getProductImageUrl } from "@/lib/storage";

export interface StorefrontProduct {
  id: string;
  name: string;
  price: string;
  imagePath?: string;
}

export function StorefrontProductCard({
  product,
  onQuickAdd,
  featured = false,
}: {
  product: StorefrontProduct;
  onQuickAdd: (product: StorefrontProduct) => void;
  featured?: boolean;
}) {
  return (
    <div className="bg-counter border border-counter-line rounded-lg overflow-hidden flex flex-col h-full">
      <div
        className={`relative bg-counter-line/40 flex items-center justify-center text-ink/30 text-sm ${
          featured ? "flex-1 min-h-48" : "aspect-square max-h-56"
        }`}
      >
        {product.imagePath ? (
          <Image
            src={getProductImageUrl(product.imagePath)}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          "Photo"
        )}
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="space-y-1">
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
