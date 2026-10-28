"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";

export function CartView() {
  const { items, hydrated, totalCount, totalPriceCents, totalSavingsCents, remove } = useCart();

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
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
        {items.map((item) => (
          // Fixed columns keep the stepper and line total in the same place on every row.
          // On small screens the stepper and total drop to a second row beside the image.
          <li
            key={item.id}
            aria-label={item.title}
            className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 py-4 [grid-template-areas:'image_details_details'_'image_quantity_total'] sm:grid-cols-[5rem_minmax(0,1fr)_8rem_7rem] sm:gap-x-4 sm:[grid-template-areas:'image_details_quantity_total']"
          >
            <Image
              src={item.thumbnail}
              alt=""
              width={80}
              height={80}
              className="aspect-square w-full rounded-md bg-zinc-100 object-contain [grid-area:image]"
            />
            <div className="min-w-0 [grid-area:details]">
              <Link href={`/products/${item.id}`} className="font-medium break-words hover:underline">
                {item.title}
              </Link>
              <p className="text-sm text-zinc-500">{formatCents(item.priceCents)} each</p>
            </div>
            <div className="[grid-area:quantity] sm:justify-self-center">
              <QuantityStepper item={item} />
            </div>
            <div className="flex flex-col items-end text-right [grid-area:total]">
              <p className="font-medium tabular-nums">{formatCents(item.priceCents * item.quantity)}</p>
              {/* At quantity 1 the stepper's trash button already removes the line. */}
              {item.quantity > 1 && (
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="mt-1 rounded-sm text-sm text-zinc-500 underline-offset-2 hover:text-red-700 hover:underline focus-visible:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section
        aria-labelledby="order-summary"
        className="rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 id="order-summary" className="mb-4 text-lg font-semibold">
          Order summary
        </h2>
        <dl className="space-y-2 tabular-nums">
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
          <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatCents(totalPriceCents)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
