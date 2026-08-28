import type { CartLine } from "./POSClient";
import { CashierSyncIndicator } from "./CashierSyncIndicator";

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
        <div className="mb-4 rounded-lg bg-status-ok/10 border border-status-ok/30 p-3 text-sm">
          <div className="font-medium text-status-ok">Order saved</div>
          <div className="text-ink/80 font-mono">
            #{confirmation.orderNumber} — ₱{confirmation.total}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.map((line) => (
          <div key={line.id} className="flex justify-between items-center">
            <div>
              <div className="text-ink">{line.name}</div>
              <div className="text-sm text-ink/60 font-mono">
                ₱{line.price} each
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.name}`}
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-counter border border-counter-line text-ink text-lg hover:bg-counter-line transition-colors"
              >
                -
              </button>
              <span className="w-6 text-center font-mono text-ink">
                {line.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
                aria-label={`Increase quantity of ${line.name}`}
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-counter border border-counter-line text-ink text-lg hover:bg-counter-line transition-colors"
              >
                +
              </button>
            </div>
          </div>
        ))}
        {cart.length === 0 && <p className="text-ink/50">No items yet</p>}
      </div>

      <div className="border-t border-counter-line pt-4 mt-4">
        <div className="flex justify-between font-semibold mb-2">
          <span className="text-ink">Total</span>
          <span className="font-mono text-ink">₱{total.toFixed(2)}</span>
        </div>

        {error && <p className="text-status-attention text-sm mb-2">{error}</p>}

        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || submitting}
          className="w-full bg-annatto text-white py-3 rounded-lg disabled:opacity-40 hover:bg-annatto/90 transition-colors"
        >
          {submitting ? "Saving..." : "Place Order"}
        </button>
      </div>

      <CashierSyncIndicator />
    </div>
  );
}
