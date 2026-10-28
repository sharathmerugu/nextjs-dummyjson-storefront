import { describe, expect, it } from "vitest";
import { discountedCents, formatCents, formatPercent } from "./money";

describe("discountedCents", () => {
  it.each([
    { price: 9.99, discountPercentage: 0, cents: 999 },
    // 999 × 0.8952 = 894.30
    { price: 9.99, discountPercentage: 10.48, cents: 894 },
    // 1250 × 0.875 = 1093.75
    { price: 12.5, discountPercentage: 12.5, cents: 1094 },
    // 1999 × 0.9 = 1799.1; 19.99 × 100 is 1998.9999… in floating point
    { price: 19.99, discountPercentage: 10, cents: 1799 },
    { price: 9.99, discountPercentage: 100, cents: 0 },
  ])("takes $discountPercentage% off $price as $cents cents", ({ price, discountPercentage, cents }) => {
    expect(discountedCents(price, discountPercentage)).toBe(cents);
  });
});

describe("formatCents", () => {
  it("formats cents as US dollars", () => {
    expect(formatCents(894)).toBe("$8.94");
    expect(formatCents(123456)).toBe("$1,234.56");
  });
});

describe("formatPercent", () => {
  it.each([
    { value: 10.48, text: "10.48%" },
    { value: 7, text: "7%" },
    { value: 12.5, text: "12.5%" },
    { value: 3.456, text: "3.46%" },
  ])("formats $value as $text", ({ value, text }) => {
    expect(formatPercent(value)).toBe(text);
  });
});
