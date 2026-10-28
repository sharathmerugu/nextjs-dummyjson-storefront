export function Rating({ value }: { value: number }) {
  return (
    <span className="text-sm text-zinc-600">
      <span aria-hidden className="text-amber-500">
        ★
      </span>{" "}
      {value.toFixed(1)}
      <span className="sr-only"> out of 5</span>
    </span>
  );
}
