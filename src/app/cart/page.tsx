import type { Metadata } from "next";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      <CartView />
    </div>
  );
}
