"use client";

import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import {
  cartReducer,
  getTotalCount,
  getTotalPriceCents,
  initialCartState,
  parseStoredCart,
  type CartItem,
  type CartProduct,
} from "./cart";

const STORAGE_KEY = "cart:v1";

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  totalCount: number;
  totalPriceCents: number;
  add: (product: CartProduct) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  remove: (id: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // localStorage only exists in the browser, so the saved cart is loaded after
  // mount. Until then the cart renders empty, matching the server render.
  useEffect(() => {
    dispatch({ type: "hydrate", items: parseStoredCart(readStorage()) });
  }, []);

  // Skipping writes until hydrated stops the initial empty cart from
  // overwriting the saved one.
  useEffect(() => {
    if (state.hydrated) writeStorage(JSON.stringify(state.items));
  }, [state]);

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    totalCount: getTotalCount(state.items),
    totalPriceCents: getTotalPriceCents(state.items),
    add: (product) => dispatch({ type: "add", product }),
    increment: (id) => dispatch({ type: "increment", id }),
    decrement: (id) => dispatch({ type: "decrement", id }),
    remove: (id) => dispatch({ type: "remove", id }),
  };

  return <CartContext value={value}>{children}</CartContext>;
}

// Storage can throw (private mode, blocked site data, quota). The cart then
// keeps working in memory for the rest of the visit.
function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignored on purpose; see above.
  }
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
