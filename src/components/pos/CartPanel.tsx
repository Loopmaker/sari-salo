import type { CartLine } from "./POSClient";

interface Confirmation {
  orderNumber: string;
  total: string;
}

export function CartPanel({
  cart,
  total,
  submitting,
  error,
  confirmation,
  onUpdateQuantity,
  onCheckout,
}: {
  cart: CartLine[];
  total: number;
  submitting: boolean;
  error: string | null;
  confirmation: Confirmation | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="w-80 border-l p-4 flex flex-col">
      <h2 className="font-semibold mb-4">Current Order</h2>

      {confirmation && (
        <div className="mb-4 rounded bg-green-50 border border-green-200 p-3 text-sm">
          <div className="font-medium text-green-800">Order saved</div>
          <div className="text-green-700">
            #{confirmation.orderNumber} — ₱{confirmation.total}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.map((line) => (
          <div key={line.id} className="flex justify-between items-center">
            <div>
              <div>{line.name}</div>
              <div className="text-sm text-gray-500">₱{line.price} each</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.name}`}
              >
                -
              </button>
              <span>{line.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
                aria-label={`Increase quantity of ${line.name}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
        {cart.length === 0 && <p className="text-gray-400">No items yet</p>}
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between font-semibold mb-2">
          <span>Total</span>
          <span>₱{total.toFixed(2)}</span>
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || submitting}
          className="w-full bg-black text-white py-3 rounded disabled:opacity-40"
        >
          {submitting ? "Saving..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
