"use client";

import { useEffect, useRef } from "react";
import type { CartProduct } from "./cart";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

/** "Add to cart" while the product isn't in the cart, then a stepper showing the cart's quantity. */
export function AddToCartButton({ product }: { product: CartProduct }) {
  const { items, hydrated, add } = useCart();
  const quantity = items.find((item) => item.id === product.id)?.quantity ?? 0;
  const inCart = quantity > 0;

  // Adding or removing swaps the focused control for another one. Focus follows,
  // but only after the shopper's own action here, never on load or cart-page changes.
  const addRef = useRef<HTMLButtonElement>(null);
  const increaseRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (inCart ? increaseRef : addRef).current?.focus();
  }, [inCart]);

  // Until the saved cart loads, the quantity is unknown; "Add to cart" could be wrong.
  if (!hydrated) {
    return (
      <div className="h-12 w-40 animate-pulse rounded-md bg-zinc-200">
        <span className="sr-only">Loading cart…</span>
      </div>
    );
  }

  if (!inCart) {
    return (
      <button
        ref={addRef}
        type="button"
        onClick={() => {
          moveFocus.current = true;
          add(product);
        }}
        className="h-12 rounded-md bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        Add to cart
      </button>
    );
  }

  return (
    <QuantityStepper
      item={{ id: product.id, title: product.title, quantity }}
      increaseRef={increaseRef}
      onRemove={() => {
        moveFocus.current = true;
      }}
    />
  );
}
