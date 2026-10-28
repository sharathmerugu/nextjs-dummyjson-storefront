"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { totalCount, hydrated } = useCart();
  const countLabel = `${totalCount} ${totalCount === 1 ? "item" : "items"}`;

  return (
    <>
      <Link
        href="/cart"
        aria-label={hydrated ? `Cart, ${countLabel}` : "Cart"}
        className="relative inline-flex items-center rounded-md p-2 hover:bg-zinc-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="h-6 w-6"
        >
          <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.76L21 8H6.2" />
          <circle cx="9" cy="20" r="1.25" />
          <circle cx="18" cy="20" r="1.25" />
        </svg>
        {/* The count is unknown until the saved cart loads; showing 0 first would be wrong. */}
        {hydrated && totalCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-xs font-semibold leading-5 text-white"
          >
            {totalCount}
          </span>
        )}
      </Link>
      <span aria-live="polite" className="sr-only">
        {hydrated ? `${countLabel} in cart` : ""}
      </span>
    </>
  );
}
