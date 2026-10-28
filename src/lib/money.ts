const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Prices are handled in integer cents so totals don't pick up floating-point drift. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

export function formatDollars(amount: number): string {
  return formatCents(toCents(amount));
}
