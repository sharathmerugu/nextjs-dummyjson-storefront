"use client";

import type { CartProduct } from "./cart";
import { useCart } from "./CartProvider";

export function AddToCartButton({ product }: { product: CartProduct }) {
  const { items, hydrated, add } = useCart();
  const quantity = items.find((item) => item.id === product.id)?.quantity ?? 0;

  return (
    <button
      type="button"
      onClick={() => add(product)}
      // Adding before the saved cart has loaded would be overwritten by it.
      disabled={!hydrated}
      className="rounded-md bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
    >
      {quantity > 0 ? `Added · ${quantity} in cart` : "Add to cart"}
    </button>
  );
}
