import { discountedCents, formatCents, formatDollars, formatPercent } from "@/lib/money";

type PriceProps = {
  /** Pre-discount price in dollars, as DummyJSON returns it. */
  price: number;
  discountPercentage: number;
  /** Also show the "N% off" badge. */
  badge?: boolean;
  /** Sizes the price the shopper pays. */
  className?: string;
};

/** What the shopper pays, with the original price struck through when discounted. */
export function Price({ price, discountPercentage, badge = false, className }: PriceProps) {
  const discounted = discountPercentage > 0;

  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className={className ? `font-semibold ${className}` : "font-semibold"}>
        {formatCents(discountedCents(price, discountPercentage))}
      </span>
      {discounted && (
        <s className="text-sm text-zinc-500">
          <span className="sr-only">Original price </span>
          {formatDollars(price)}
        </s>
      )}
      {discounted && badge && (
        <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
          {formatPercent(discountPercentage)} off
        </span>
      )}
    </span>
  );
}
