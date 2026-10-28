import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rating } from "@/components/Rating";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { toCartProduct } from "@/features/cart/cart";
import { formatDollars } from "@/lib/money";
import { getProduct } from "@/lib/products";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  // Shares the cached response with the page below, so this costs no extra request.
  const product = await getProduct((await params).id);
  return { title: product?.title ?? "Product not found" };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const product = await getProduct((await params).id);
  if (!product) notFound();

  const mainImage = product.images[0] ?? product.thumbnail;
  const discount = Math.round(product.discountPercentage);

  return (
    <article className="space-y-6">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">
        ← Back to products
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <Image
          src={mainImage}
          alt={product.title}
          width={600}
          height={600}
          sizes="(min-width: 768px) 50vw, 100vw"
          preload
          className="aspect-square w-full rounded-lg bg-white object-contain"
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <Rating value={product.rating} />
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatDollars(product.price)}</span>
            {discount > 0 && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
                {discount}% off
              </span>
            )}
          </div>
          <p className="leading-relaxed text-zinc-700">{product.description}</p>
          {/* Only the fields the cart needs cross the server/client boundary. */}
          <AddToCartButton product={toCartProduct(product)} />
        </div>
      </div>
    </article>
  );
}
