import { expect, test } from "@playwright/test";

// Uses the live DummyJSON API. Product 1 is "Essence Mascara Lash Princess" at $9.99.
test("a shopper adds a product twice, keeps it across a reload, and removes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Essence Mascara Lash Princess/ }).click();

  await expect(page).toHaveURL("/products/1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Essence Mascara Lash Princess");

  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Added · 1 in cart" }).click();
  await expect(page.getByRole("button", { name: "Added · 2 in cart" })).toBeVisible();

  const cartLink = page.getByRole("link", { name: /^Cart/ });
  await expect(cartLink).toHaveAccessibleName("Cart, 2 items");
  await cartLink.click();

  await expect(page).toHaveURL("/cart");
  const line = page.getByRole("listitem", { name: "Essence Mascara Lash Princess" });
  const summary = page.getByRole("region", { name: "Order summary" });
  await expect(line.getByRole("status", { name: "Quantity" })).toHaveText("2");
  await expect(summary).toContainText("Items2");
  await expect(summary).toContainText("Total$19.98");

  await page.reload();

  await expect(line.getByRole("status", { name: "Quantity" })).toHaveText("2");
  await expect(summary).toContainText("Total$19.98");
  await expect(cartLink).toHaveAccessibleName("Cart, 2 items");

  await line.getByRole("button", { name: "Remove Essence Mascara Lash Princess" }).click();

  await expect(line).toHaveCount(0);
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await expect(cartLink).toHaveAccessibleName("Cart, 0 items");
});
