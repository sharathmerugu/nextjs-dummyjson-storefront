"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartView() {
  const { items, hydrated, totalCount, totalPriceCents, totalSavingsCents, increment, decrement, remove } =
    useCart();

  // Rendering "empty" before the saved cart loads would flash the wrong state.
  if (!hydrated) {
    return <p className="text-zinc-500">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p>Your cart is empty.</p>
        <Link href="/" className="font-medium underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
      <ul className="divide-y divide-zinc-200">
        {items.map((item) => (
          <li key={item.id} aria-label={item.title} className="flex gap-4 py-4">
            <Image
              src={item.thumbnail}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-md bg-zinc-100 object-contain"
            />
            <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/products/${item.id}`} className="font-medium hover:underline">
                  {item.title}
                </Link>
                <p className="text-sm text-zinc-500">{formatCents(item.priceCents)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decrement(item.id)}
                  disabled={item.quantity <= 1}
                  aria-label={`Decrease quantity of ${item.title}`}
                  className="h-8 w-8 rounded-md border border-zinc-300 disabled:opacity-40"
                >
                  −
                </button>
                <output aria-label="Quantity" className="w-6 text-center">
                  {item.quantity}
                </output>
                <button
                  type="button"
                  onClick={() => increment(item.id)}
                  aria-label={`Increase quantity of ${item.title}`}
                  className="h-8 w-8 rounded-md border border-zinc-300"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCents(item.priceCents * item.quantity)}</p>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="text-sm text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="order-summary" className="h-fit rounded-lg bg-zinc-50 p-6">
        <h2 id="order-summary" className="mb-4 text-lg font-semibold">
          Order summary
        </h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt>Items</dt>
            <dd>{totalCount}</dd>
          </div>
          {totalSavingsCents > 0 && (
            <div className="flex justify-between text-green-800">
              <dt>You save</dt>
              <dd>−{formatCents(totalSavingsCents)}</dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatCents(totalPriceCents)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
