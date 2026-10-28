import { expect, test } from "@playwright/test";

// Runs against the fixture API in e2e/fixtures: product 1 is "Essence Mascara Lash Princess"
// at $9.99 with 10.48% off ($8.94); product 2 has no discount.
test("a shopper adds a product twice, keeps it across a reload, and removes it", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: /Essence Mascara Lash Princess/ });
  await expect(card.getByText("$8.94", { exact: true })).toBeVisible();
  await expect(card.locator("s")).toHaveText("Original price $9.99");
  await expect(page.getByRole("link", { name: /Eyeshadow Palette with Mirror/ }).locator("s")).toHaveCount(0);
  await card.click();

  await expect(page).toHaveURL("/products/1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Essence Mascara Lash Princess");
  const detail = page.getByRole("article");
  await expect(detail.getByText("$8.94", { exact: true })).toBeVisible();
  await expect(detail.locator("s")).toHaveText("Original price $9.99");
  await expect(detail.getByText("10.48% off")).toBeVisible();

  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Added · 1 in cart" }).click();
  await expect(page.getByRole("button", { name: "Added · 2 in cart" })).toBeVisible();

  const cartLink = page.getByRole("link", { name: /^Cart/ });
  await expect(cartLink).toHaveAccessibleName("Cart, 2 items");
  await cartLink.click();

  await expect(page).toHaveURL("/cart");
  const line = page.getByRole("listitem", { name: "Essence Mascara Lash Princess" });
  const summary = page.getByRole("region", { name: "Order summary" });
  const summaryItems = summary.locator("dt:text-is('Items') + dd");
  const summarySavings = summary.locator("dt:text-is('You save') + dd");
  const summaryTotal = summary.locator("dt:text-is('Total') + dd");
  await expect(line.getByText("$8.94 each")).toBeVisible();
  await expect(line.getByRole("status", { name: "Quantity" })).toHaveText("2");
  await expect(summaryItems).toHaveText("2");
  await expect(summarySavings).toHaveText("−$2.10");
  await expect(summaryTotal).toHaveText("$17.88");

  await page.reload();

  await expect(line.getByRole("status", { name: "Quantity" })).toHaveText("2");
  await expect(summaryItems).toHaveText("2");
  await expect(summaryTotal).toHaveText("$17.88");
  await expect(cartLink).toHaveAccessibleName("Cart, 2 items");

  await line.getByRole("button", { name: "Remove Essence Mascara Lash Princess" }).click();

  await expect(line).toHaveCount(0);
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await expect(cartLink).toHaveAccessibleName("Cart, 0 items");
});
