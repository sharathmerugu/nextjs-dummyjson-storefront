import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { getProducts, parsePage } from "@/lib/products";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const page = parsePage((await searchParams).page);
  const { products, pageCount } = await getProducts(page);

  if (page > pageCount) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Products</h1>
      {products.length === 0 ? (
        <p>No products are available right now.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} />
    </div>
  );
}
