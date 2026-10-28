import Link from "next/link";

// Page 1 lives at "/" so each page has exactly one URL.
function pageHref(page: number): string {
  return page === 1 ? "/" : `/?page=${page}`;
}

const linkClass = "rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100";
const disabledClass = "rounded-md border border-zinc-200 px-4 py-2 text-zinc-400";

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} rel="prev" className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span aria-disabled className={disabledClass}>
          ← Previous
        </span>
      )}
      <span className="text-sm text-zinc-600">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={pageHref(page + 1)} rel="next" className={linkClass}>
          Next →
        </Link>
      ) : (
        <span aria-disabled className={disabledClass}>
          Next →
        </span>
      )}
    </nav>
  );
}
