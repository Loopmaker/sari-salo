"use client";

import type { StorefrontCartLine } from "./StorefrontClient";

export type CheckoutView = "cart" | "checkout" | "confirmed";

export function StorefrontCartDrawer({
  isOpen,
  onClose,
  view,
  lines,
  total,
  onUpdateQuantity,
  onStartCheckout,
  customerName,
  onCustomerNameChange,
  onSubmitOrder,
  submitting,
  submitError,
  confirmation,
}: {
  isOpen: boolean;
  onClose: () => void;
  view: CheckoutView;
  lines: StorefrontCartLine[];
  total: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onStartCheckout: () => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onSubmitOrder: () => void;
  submitting: boolean;
  submitError: string | null;
  confirmation: { orderNumber: string; customerName: string } | null;
}) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-paper z-40 shadow-xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-counter-line">
          <h2 className="font-semibold text-ink">
            {view === "confirmed" ? "Order placed" : "Your Order"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-counter transition-colors text-ink/60"
          >
            ✕
          </button>
        </div>

        {view === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {lines.length === 0 ? (
                <p className="text-ink/50 text-sm">Your cart is empty.</p>
              ) : (
                lines.map((line) => (
                  <div
                    key={line.productId}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <div className="text-ink text-sm font-medium">
                        {line.name}
                      </div>
                      <div className="text-ink/60 text-sm font-mono">
                        ₱{line.price} each
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateQuantity(line.productId, line.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${line.name}`}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-counter border border-counter-line text-ink hover:bg-counter-line transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono text-ink text-sm">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(line.productId, line.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${line.name}`}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-counter border border-counter-line text-ink hover:bg-counter-line transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-counter-line p-4">
              <div className="flex justify-between font-semibold mb-3">
                <span className="text-ink">Total</span>
                <span className="font-mono text-ink">₱{total.toFixed(2)}</span>
              </div>
              <button
                onClick={onStartCheckout}
                disabled={lines.length === 0}
                className="w-full bg-annatto text-white py-3 rounded-lg disabled:opacity-40 hover:bg-annatto/90 transition-colors"
              >
                Checkout
              </button>
            </div>
          </>
        )}

        {view === "checkout" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-ink/60 text-sm">
                Just your name — we&apos;ll call your number when it&apos;s
                ready.
              </p>
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-ink/70 text-xs font-medium uppercase tracking-wide mb-1"
                >
                  Name
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full min-h-12 px-3 rounded-lg border border-counter-line bg-counter text-ink focus:outline-none focus:ring-2 focus:ring-annatto"
                  autoFocus
                />
              </div>

              <div className="space-y-1 text-sm">
                {lines.map((line) => (
                  <div key={line.productId} className="flex justify-between">
                    <span className="text-ink/70">
                      {line.quantity}x {line.name}
                    </span>
                    <span className="font-mono text-ink/70">
                      ₱{(parseFloat(line.price) * line.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="text-status-attention text-sm">{submitError}</p>
              )}
            </div>

            <div className="border-t border-counter-line p-4">
              <div className="flex justify-between font-semibold mb-3">
                <span className="text-ink">Total</span>
                <span className="font-mono text-ink">₱{total.toFixed(2)}</span>
              </div>
              <button
                onClick={onSubmitOrder}
                disabled={submitting || customerName.trim().length === 0}
                className="w-full bg-annatto text-white py-3 rounded-lg disabled:opacity-40 hover:bg-annatto/90 transition-colors"
              >
                {submitting ? "Placing order..." : "Place Order"}
              </button>
            </div>
          </>
        )}

        {view === "confirmed" && confirmation && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-ink/60 text-sm">Order placed!</p>
            <p className="font-mono text-4xl font-bold text-annatto">
              {confirmation.orderNumber}
            </p>
            <p className="text-ink/70 text-sm max-w-xs">
              Thanks, {confirmation.customerName}. Please wait for your number
              to be called.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
