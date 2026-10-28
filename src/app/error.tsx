"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p>We couldn&apos;t load this page. Please try again.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
      >
        Try again
      </button>
    </div>
  );
}
