import { discountedCents, toCents } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

/** What the cart keeps about a product: a snapshot taken when it was added. */
export type CartProduct = {
  id: number;
  title: string;
  /** Unit price after discount: what the shopper pays. */
  priceCents: number;
  /** Unit price before discount, kept only to show savings. */
  listPriceCents: number;
  thumbnail: string;
};

export type CartItem = CartProduct & { quantity: number };

// Must match `images.remotePatterns` in next.config.ts, or next/image rejects the URL.
const IMAGE_URL_PREFIX = "https://cdn.dummyjson.com/product-images/";

export function toCartProduct({
  id,
  title,
  price,
  discountPercentage,
  thumbnail,
}: ProductSummary): CartProduct {
  return {
    id,
    title,
    priceCents: discountedCents(price, discountPercentage),
    listPriceCents: toCents(price),
    thumbnail,
  };
}

type CartState = {
  items: CartItem[];
  /** False until the saved cart has been read from storage on the client. */
  hydrated: boolean;
};

type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; product: CartProduct }
  | { type: "increment"; id: number }
  | { type: "decrement"; id: number }
  | { type: "remove"; id: number };

export const initialCartState: CartState = { items: [], hydrated: false };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const exists = state.items.some((item) => item.id === action.product.id);
      return exists
        ? changeQuantity(state, action.product.id, 1)
        : { ...state, items: [...state.items, { ...action.product, quantity: 1 }] };
    }
    case "increment":
      return changeQuantity(state, action.id, 1);
    case "decrement":
      return changeQuantity(state, action.id, -1);
    case "remove":
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
  }
}

/** Quantity never drops below one; removing a line is always an explicit action. */
function changeQuantity(state: CartState, id: number, delta: number): CartState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
    ),
  };
}

/** Parses a saved cart. Anything unreadable or malformed yields an empty cart. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every(isCartItem) ? value : [];
  } catch {
    return [];
  }
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    isPositiveInteger(item.id) &&
    typeof item.title === "string" &&
    Number.isSafeInteger(item.priceCents) &&
    (item.priceCents as number) >= 0 &&
    Number.isSafeInteger(item.listPriceCents) &&
    (item.listPriceCents as number) >= (item.priceCents as number) &&
    typeof item.thumbnail === "string" &&
    item.thumbnail.startsWith(IMAGE_URL_PREFIX) &&
    isPositiveInteger(item.quantity)
  );
}

export function getTotalCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getTotalPriceCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

export function getTotalSavingsCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.listPriceCents - item.priceCents) * item.quantity, 0);
}
