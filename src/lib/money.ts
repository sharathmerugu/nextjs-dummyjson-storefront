const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Prices are handled in integer cents so totals don't pick up floating-point drift. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Unit price in cents after a percentage discount. `price` is the pre-discount
 * price in dollars; the result is rounded to cents once, here, and nowhere else.
 */
export function discountedCents(price: number, discountPercentage: number): number {
  // price × 100 cents × (100 − d) / 100, without an intermediate rounding step.
  return Math.round(price * (100 - discountPercentage));
}

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

export function formatDollars(amount: number): string {
  return formatCents(toCents(amount));
}

/** `10.48` → `"10.48%"`, `7` → `"7%"`. */
export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}
