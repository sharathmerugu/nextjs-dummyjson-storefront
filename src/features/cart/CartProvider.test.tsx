import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toCartProduct } from "./cart";
import { CartProvider, useCart } from "./CartProvider";

const mascara = {
  id: 1,
  title: "Mascara",
  priceCents: 999,
  listPriceCents: 999,
  thumbnail: "https://cdn.dummyjson.com/product-images/mascara.webp",
};
const lipstick = {
  id: 2,
  title: "Lipstick",
  priceCents: 1250,
  listPriceCents: 1250,
  thumbnail: "https://cdn.dummyjson.com/product-images/lipstick.webp",
};

afterEach(() => {
  localStorage.clear();
});

async function renderCart() {
  const view = renderHook(() => useCart(), { wrapper: CartProvider });
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  return view;
}

describe("cart", () => {
  it("adds a product as a single line and increases its quantity on repeat adds", async () => {
    const { result } = await renderCart();

    act(() => result.current.add(mascara));
    act(() => result.current.add(mascara));

    expect(result.current.items).toEqual([{ ...mascara, quantity: 2 }]);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPriceCents).toBe(1998);
  });

  it("totals quantities and prices across lines", async () => {
    const { result } = await renderCart();

    act(() => result.current.add(mascara));
    act(() => result.current.add(lipstick));
    act(() => result.current.add(lipstick));

    expect(result.current.totalCount).toBe(3);
    // 9.99 + 2 × 12.50
    expect(result.current.totalPriceCents).toBe(3499);
  });

  it("increments and decrements a line's quantity, never below one", async () => {
    const { result } = await renderCart();
    act(() => result.current.add(mascara));

    act(() => result.current.increment(mascara.id));
    act(() => result.current.increment(mascara.id));
    expect(result.current.items[0].quantity).toBe(3);

    act(() => result.current.decrement(mascara.id));
    act(() => result.current.decrement(mascara.id));
    act(() => result.current.decrement(mascara.id));
    expect(result.current.items).toEqual([{ ...mascara, quantity: 1 }]);
  });

  it("removes a line regardless of its quantity", async () => {
    const { result } = await renderCart();
    act(() => result.current.add(mascara));
    act(() => result.current.add(mascara));
    act(() => result.current.add(lipstick));

    act(() => result.current.remove(mascara.id));

    expect(result.current.items).toEqual([{ ...lipstick, quantity: 1 }]);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPriceCents).toBe(1250);
  });

  it("charges the discounted unit price, rounded to cents once, for every unit", async () => {
    const { result } = await renderCart();
    const discounted = toCartProduct({
      id: 3,
      title: "Lash Princess",
      price: 9.99,
      discountPercentage: 10.48,
      rating: 2.56,
      thumbnail: "https://cdn.dummyjson.com/product-images/lash.webp",
    });

    act(() => result.current.add(discounted));
    act(() => result.current.increment(discounted.id));
    act(() => result.current.increment(discounted.id));
    act(() => result.current.add(lipstick));

    expect(result.current.items[0]).toMatchObject({ priceCents: 894, listPriceCents: 999, quantity: 3 });
    // 3 × 8.94 + 12.50; the per-unit price is rounded before multiplying.
    expect(result.current.totalPriceCents).toBe(3932);
    // 3 × (9.99 − 8.94)
    expect(result.current.totalSavingsCents).toBe(315);
  });
});

describe("cart persistence", () => {
  const STORAGE_KEY = "cart:v2";

  it("restores the cart after the app is reloaded", async () => {
    const first = await renderCart();
    act(() => first.result.current.add(mascara));
    act(() => first.result.current.add(mascara));
    first.unmount();

    const { result } = await renderCart();

    expect(result.current.items).toEqual([{ ...mascara, quantity: 2 }]);
    expect(result.current.totalCount).toBe(2);
  });

  it("starts empty and not hydrated, then loads the saved cart", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...lipstick, quantity: 3 }]));

    const renders: { hydrated: boolean; totalCount: number }[] = [];
    const { result } = renderHook(
      () => {
        const cart = useCart();
        renders.push({ hydrated: cart.hydrated, totalCount: cart.totalCount });
        return cart;
      },
      { wrapper: CartProvider },
    );

    // The first render must match the server render, which can't see localStorage.
    expect(renders[0]).toEqual({ hydrated: false, totalCount: 0 });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.items).toEqual([{ ...lipstick, quantity: 3 }]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([{ ...lipstick, quantity: 3 }]);
  });

  it("never overwrites the saved cart while it is still loading", async () => {
    const saved = JSON.stringify([{ ...mascara, quantity: 2 }]);
    localStorage.setItem(STORAGE_KEY, saved);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    try {
      await renderCart();

      for (const [key, value] of setItem.mock.calls) {
        expect(key).toBe(STORAGE_KEY);
        expect(value).toBe(saved);
      }
    } finally {
      setItem.mockRestore();
    }
  });

  it.each([
    { case: "not JSON", stored: "{not json" },
    { case: "not a list", stored: JSON.stringify({ items: [] }) },
    { case: "a line without a price", stored: JSON.stringify([{ ...mascara, priceCents: undefined, quantity: 1 }]) },
    { case: "a fractional price", stored: JSON.stringify([{ ...mascara, priceCents: 9.99, quantity: 1 }]) },
    {
      case: "a line without a list price",
      stored: JSON.stringify([{ ...mascara, listPriceCents: undefined, quantity: 1 }]),
    },
    {
      case: "a list price below the price paid",
      stored: JSON.stringify([{ ...mascara, listPriceCents: 500, quantity: 1 }]),
    },
    { case: "a zero quantity", stored: JSON.stringify([{ ...mascara, quantity: 0 }]) },
    { case: "a string id", stored: JSON.stringify([{ ...mascara, id: "1", quantity: 1 }]) },
    // next/image only accepts DummyJSON's CDN; any other host would crash the cart page.
    {
      case: "an image from another host",
      stored: JSON.stringify([{ ...mascara, thumbnail: "https://example.com/x.png", quantity: 1 }]),
    },
  ])("recovers with an empty cart when the saved cart is $case", async ({ stored }) => {
    localStorage.setItem(STORAGE_KEY, stored);

    const { result } = await renderCart();
    expect(result.current.items).toEqual([]);

    act(() => result.current.add(mascara));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([{ ...mascara, quantity: 1 }]);
  });

  it("still works in memory when storage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    try {
      const { result } = await renderCart();
      act(() => result.current.add(mascara));

      expect(result.current.totalCount).toBe(1);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
