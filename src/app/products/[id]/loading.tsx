export default function Loading() {
  return (
    <div aria-busy className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-lg bg-zinc-200" />
      <div className="space-y-4">
        <div className="h-9 w-3/4 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-24 animate-pulse rounded bg-zinc-200" />
      </div>
      <span className="sr-only">Loading product…</span>
    </div>
  );
}
