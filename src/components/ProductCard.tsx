import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/products";
import { formatDollars } from "@/lib/money";
import { Rating } from "./Rating";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-3 transition hover:shadow-md"
    >
      <Image
        src={product.thumbnail}
        alt=""
        width={300}
        height={300}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="aspect-square w-full rounded-md bg-zinc-100 object-contain"
      />
      <h2 className="mt-3 line-clamp-2 font-medium group-hover:underline">{product.title}</h2>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-semibold">{formatDollars(product.price)}</span>
        <Rating value={product.rating} />
      </div>
    </Link>
  );
}
