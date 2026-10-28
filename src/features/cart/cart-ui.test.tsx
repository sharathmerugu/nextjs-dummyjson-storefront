import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { AddToCartButton } from "./AddToCartButton";
import { CartLink } from "./CartLink";
import { CartProvider } from "./CartProvider";
import { CartView } from "./CartView";

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

function saveCart(items: unknown[]) {
  localStorage.setItem("cart:v2", JSON.stringify(items));
}

describe("product page cart control", () => {
  function renderProductControl() {
    return render(
      <CartProvider>
        <CartLink />
        <AddToCartButton product={mascara} />
      </CartProvider>,
    );
  }

  it("moves between Add to cart, trash and − as the quantity goes 0 → 1 → 2 → 1 → 0", async () => {
    renderProductControl();

    fireEvent.click(await screen.findByRole("button", { name: "Add to cart" }));

    const stepper = within(screen.getByRole("group", { name: "Quantity of Mascara" }));
    expect(stepper.getByText("1", { selector: "output" })).toBeTruthy();
    expect(stepper.queryByRole("button", { name: "Decrease quantity of Mascara" })).toBeNull();
    const increase = stepper.getByRole("button", { name: "Increase quantity of Mascara" });
    expect(document.activeElement).toBe(increase);
    expect(screen.queryByRole("button", { name: "Add to cart" })).toBeNull();

    fireEvent.click(increase);
    expect(stepper.getByText("2", { selector: "output" })).toBeTruthy();
    expect(stepper.queryByRole("button", { name: "Remove Mascara" })).toBeNull();
    expect(screen.getByRole("link", { name: "Cart, 2 items" })).toBeTruthy();

    fireEvent.click(stepper.getByRole("button", { name: "Decrease quantity of Mascara" }));
    expect(stepper.getByText("1", { selector: "output" })).toBeTruthy();

    fireEvent.click(stepper.getByRole("button", { name: "Remove Mascara" }));
    const add = screen.getByRole("button", { name: "Add to cart" });
    expect(document.activeElement).toBe(add);
    expect(screen.queryByRole("group", { name: "Quantity of Mascara" })).toBeNull();
    expect(screen.getByRole("link", { name: "Cart, 0 items" })).toBeTruthy();
  });

  it("shows the saved quantity once the cart has loaded", async () => {
    saveCart([{ ...mascara, quantity: 3 }]);
    renderProductControl();

    const stepper = within(await screen.findByRole("group", { name: "Quantity of Mascara" }));
    expect(stepper.getByText("3", { selector: "output" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to cart" })).toBeNull();
    // Loading a saved cart is not the shopper's action, so focus stays put.
    expect(document.activeElement).toBe(document.body);
  });

  it("renders a placeholder, not Add to cart, before the saved cart loads", () => {
    saveCart([{ ...mascara, quantity: 3 }]);

    // The server render can't see localStorage, so it is what shows until hydration.
    const html = renderToString(
      <CartProvider>
        <AddToCartButton product={mascara} />
      </CartProvider>,
    );

    expect(html).toContain("Loading cart");
    expect(html).not.toContain("Add to cart");
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
    expect(summary.queryByText("You save")).toBeNull();
  });

  it("charges discounted prices and shows the savings in the order summary", async () => {
    saveCart([{ ...mascara, priceCents: 894, listPriceCents: 999, quantity: 2 }]);
    renderCartPage();

    const line = within(await screen.findByRole("listitem", { name: "Mascara" }));
    expect(line.getByText("$8.94 each")).toBeTruthy();
    expect(line.getByText("$17.88")).toBeTruthy();

    const summary = within(screen.getByRole("region", { name: "Order summary" }));
    expect(summary.getByText("−$2.10")).toBeTruthy();
    expect(summary.getByText("$17.88")).toBeTruthy();
  });

  it("changes quantities, swapping − for a trash button and hiding Remove at one", async () => {
    saveCart([{ ...mascara, quantity: 1 }]);
    renderCartPage();

    const line = within(await screen.findByRole("listitem", { name: "Mascara" }));
    expect(line.getAllByRole("button", { name: "Remove Mascara" })).toHaveLength(1);
    expect(line.getByRole("button", { name: "Remove Mascara" }).getAttribute("title")).toBe("Remove from cart");
    expect(line.queryByRole("button", { name: "Decrease quantity of Mascara" })).toBeNull();

    fireEvent.click(line.getByRole("button", { name: "Increase quantity of Mascara" }));

    expect(line.getByText("2", { selector: "output" })).toBeTruthy();
    expect(line.getByText("Remove")).toBeTruthy();
    const summary = within(screen.getByRole("region", { name: "Order summary" }));
    expect(summary.getByText("$19.98")).toBeTruthy();

    fireEvent.click(line.getByRole("button", { name: "Decrease quantity of Mascara" }));
    expect(line.getByText("1", { selector: "output" })).toBeTruthy();
    expect(line.queryByText("Remove")).toBeNull();

    fireEvent.click(line.getByRole("button", { name: "Remove Mascara" }));
    expect(screen.queryByRole("listitem", { name: "Mascara" })).toBeNull();
    expect(screen.getByText("Your cart is empty.")).toBeTruthy();
  });

  it("removes a line and shows the empty state when nothing is left", async () => {
    saveCart([{ ...mascara, quantity: 3 }]);
    renderCartPage();

    fireEvent.click(await screen.findByRole("button", { name: "Remove Mascara" }));

    expect(screen.queryByRole("listitem", { name: "Mascara" })).toBeNull();
    expect(screen.getByText("Your cart is empty.")).toBeTruthy();
  });
});
