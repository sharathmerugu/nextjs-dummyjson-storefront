import Link from "next/link";
import { CartLink } from "@/features/cart/CartLink";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Storefront
        </Link>
        <CartLink />
      </nav>
    </header>
  );
}
