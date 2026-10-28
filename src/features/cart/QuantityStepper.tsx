"use client";

import type { Ref } from "react";
import type { CartItem } from "./cart";
import { useCart } from "./CartProvider";

const buttonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

/** − / quantity / + for a cart line. At quantity 1 the − becomes a trash button that removes the line. */
export function QuantityStepper({
  item,
  increaseRef,
  onRemove,
}: {
  item: Pick<CartItem, "id" | "title" | "quantity">;
  increaseRef?: Ref<HTMLButtonElement>;
  onRemove?: () => void;
}) {
  const { increment, decrement, remove } = useCart();
  const isLast = item.quantity === 1;

  return (
    <div role="group" aria-label={`Quantity of ${item.title}`} className="flex items-center gap-2">
      {/* One element for both roles, so keyboard focus survives the swap between − and trash. */}
      <button
        type="button"
        onClick={() => {
          if (isLast) {
            remove(item.id);
            onRemove?.();
          } else {
            decrement(item.id);
          }
        }}
        aria-label={isLast ? `Remove ${item.title}` : `Decrease quantity of ${item.title}`}
        title={isLast ? "Remove from cart" : undefined}
        className={`${buttonClass} ${isLast ? "text-red-700 hover:bg-red-50" : "hover:bg-zinc-100"}`}
      >
        {isLast ? (
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-5 w-5"
          >
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          </svg>
        ) : (
          "−"
        )}
      </button>
      <output aria-label="Quantity" className="w-6 text-center">
        {item.quantity}
      </output>
      <button
        ref={increaseRef}
        type="button"
        onClick={() => increment(item.id)}
        aria-label={`Increase quantity of ${item.title}`}
        className={`${buttonClass} hover:bg-zinc-100`}
      >
        +
      </button>
    </div>
  );
}
