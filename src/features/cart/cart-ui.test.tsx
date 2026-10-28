import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AddToCartButton } from "./AddToCartButton";
import { CartLink } from "./CartLink";
import { CartProvider } from "./CartProvider";
import { CartView } from "./CartView";

const mascara = {
  id: 1,
  title: "Mascara",
  priceCents: 999,
  thumbnail: "https://cdn.dummyjson.com/product-images/mascara.webp",
};
const lipstick = {
  id: 2,
  title: "Lipstick",
  priceCents: 1250,
  thumbnail: "https://cdn.dummyjson.com/product-images/lipstick.webp",
};

afterEach(() => {
  localStorage.clear();
});

function saveCart(items: unknown[]) {
  localStorage.setItem("cart:v1", JSON.stringify(items));
}

describe("add to cart button", () => {
  it("adds the product and reports how many are in the cart", async () => {
    render(
      <CartProvider>
        <CartLink />
        <AddToCartButton product={mascara} />
      </CartProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Add to cart" }));
    fireEvent.click(screen.getByRole("button", { name: /in cart/ }));

    expect(screen.getByRole("button", { name: "Added · 2 in cart" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cart, 2 items" })).toBeTruthy();
  });
});

describe("header cart link", () => {
  it("shows a zero count for an empty cart", async () => {
    render(
      <CartProvider>
        <CartLink />
      </CartProvider>,
    );

    const link = await screen.findByRole("link", { name: "Cart, 0 items" });
    expect(link.textContent).toBe("0");
  });

  it("shows the saved item count once the cart has loaded", async () => {
    saveCart([
      { ...mascara, quantity: 2 },
      { ...lipstick, quantity: 1 },
    ]);

    render(
      <CartProvider>
        <CartLink />
      </CartProvider>,
    );

    const link = await screen.findByRole("link", { name: "Cart, 3 items" });
    expect(link.getAttribute("href")).toBe("/cart");
    expect(link.textContent).toContain("3");
  });
});

describe("cart page", () => {
  function renderCartPage() {
    return render(
      <CartProvider>
        <CartView />
      </CartProvider>,
    );
  }

  it("invites the shopper back to the catalog when the cart is empty", async () => {
    renderCartPage();

    expect(await screen.findByText("Your cart is empty.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Browse products" }).getAttribute("href")).toBe("/");
  });

  it("lists each line with its price, quantity and subtotal, and the cart totals", async () => {
    saveCart([
      { ...mascara, quantity: 2 },
      { ...lipstick, quantity: 1 },
    ]);
    renderCartPage();

    const line = within(await screen.findByRole("listitem", { name: "Mascara" }));
    expect(line.getByRole("link", { name: "Mascara" }).getAttribute("href")).toBe("/products/1");
    expect(line.getByText("$9.99 each")).toBeTruthy();
    expect(line.getByText("2", { selector: "output" })).toBeTruthy();
    expect(line.getByText("$19.98")).toBeTruthy();

    const summary = within(screen.getByRole("region", { name: "Order summary" }));
    expect(summary.getByText("3")).toBeTruthy();
    expect(summary.getByText("$32.48")).toBeTruthy();
  });

  it("changes quantities, never below one, and updates the totals", async () => {
    saveCart([{ ...mascara, quantity: 1 }]);
    renderCartPage();

    const line = within(await screen.findByRole("listitem", { name: "Mascara" }));
    const decrease = line.getByRole("button", { name: "Decrease quantity of Mascara" });
    expect((decrease as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(line.getByRole("button", { name: "Increase quantity of Mascara" }));

    expect(line.getByText("2", { selector: "output" })).toBeTruthy();
    expect((decrease as HTMLButtonElement).disabled).toBe(false);
    const summary = within(screen.getByRole("region", { name: "Order summary" }));
    expect(summary.getByText("$19.98")).toBeTruthy();

    fireEvent.click(decrease);
    expect(line.getByText("1", { selector: "output" })).toBeTruthy();
  });

  it("removes a line and shows the empty state when nothing is left", async () => {
    saveCart([{ ...mascara, quantity: 3 }]);
    renderCartPage();

    fireEvent.click(await screen.findByRole("button", { name: "Remove Mascara" }));

    expect(screen.queryByRole("listitem", { name: "Mascara" })).toBeNull();
    expect(screen.getByText("Your cart is empty.")).toBeTruthy();
  });
});
