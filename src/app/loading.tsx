export default function Loading() {
  return (
    <div aria-busy className="space-y-8">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-zinc-200" />
        ))}
      </div>
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
