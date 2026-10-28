import { expect, test } from "@playwright/test";

// Runs against the fixture API in e2e/fixtures: product 1 is "Essence Mascara Lash Princess"
// at $9.99 with 10.48% off ($8.94); product 2 has no discount.
test("a shopper steps a product's quantity on the product and cart pages, and it persists", async ({ page }) => {
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

  const title = "Essence Mascara Lash Princess";
  const addButton = page.getByRole("button", { name: "Add to cart" });
  const stepper = page.getByRole("group", { name: `Quantity of ${title}` });
  const quantity = stepper.getByRole("status", { name: "Quantity" });
  const decrease = stepper.getByRole("button", { name: `Decrease quantity of ${title}` });
  const increase = stepper.getByRole("button", { name: `Increase quantity of ${title}` });
  const trash = stepper.getByRole("button", { name: `Remove ${title}` });
  const cartLink = page.getByRole("link", { name: /^Cart/ });

  // 0 → 1 → 2 → 1 → 0 on the product page.
  await addButton.click();
  await expect(quantity).toHaveText("1");
  await expect(trash).toBeVisible();
  await expect(decrease).toHaveCount(0);
  await expect(addButton).toHaveCount(0);
  await increase.click();
  await expect(quantity).toHaveText("2");
  await expect(trash).toHaveCount(0);
  await decrease.click();
  await expect(quantity).toHaveText("1");
  await trash.click();
  await expect(stepper).toHaveCount(0);
  await expect(cartLink).toHaveAccessibleName("Cart, 0 items");

  await addButton.click();
  await increase.click();
  await expect(quantity).toHaveText("2");
  await expect(cartLink).toHaveAccessibleName("Cart, 2 items");
  await cartLink.click();

  await expect(page).toHaveURL("/cart");
  const line = page.getByRole("listitem", { name: title });
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

  // At one, the line keeps a single removal control: the stepper's trash button.
  await line.getByRole("button", { name: `Decrease quantity of ${title}` }).click();
  await expect(line.getByRole("status", { name: "Quantity" })).toHaveText("1");
  await expect(line.getByRole("button", { name: `Remove ${title}` })).toHaveCount(1);
  await expect(line.getByRole("button", { name: `Decrease quantity of ${title}` })).toHaveCount(0);

  // The product page reflects the change made on the cart page, also after a reload.
  await line.getByRole("link", { name: title }).click();
  await expect(page).toHaveURL("/products/1");
  await expect(quantity).toHaveText("1");
  await page.reload();
  await expect(quantity).toHaveText("1");
  await expect(addButton).toHaveCount(0);

  await page.goto("/cart");
  await line.getByRole("button", { name: `Remove ${title}` }).click();

  await expect(line).toHaveCount(0);
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await expect(cartLink).toHaveAccessibleName("Cart, 0 items");
});
