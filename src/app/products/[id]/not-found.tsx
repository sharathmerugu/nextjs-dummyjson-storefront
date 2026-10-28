import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Product not found</h1>
      <p>This product doesn&apos;t exist or is no longer available.</p>
      <Link href="/" className="font-medium underline">
        Back to products
      </Link>
    </div>
  );
}
