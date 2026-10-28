# Spec: DummyJSON Storefront

## Problem Statement
A shopper wants to browse a product catalog, inspect individual products, and collect products in a cart that survives page refreshes. The reviewer wants to see sound Next.js architecture: clear server/client boundaries, deliberate data fetching and caching, a simple and testable cart, and honest trade-offs. Polish is not the point.

## Solution
A Next.js 16 App Router app (TypeScript strict, Tailwind, npm) that renders the catalog and product details on the server from DummyJSON, with URL-based pagination. The cart is a small client-side state island backed by `localStorage`. A persistent header shows the site name and a cart link with the item count.

## User Stories
1. As a shopper, I want to see a grid of products on the home page, so that I can browse what's available.
2. As a shopper, I want each product card to show image, title, price (discounted, with the original struck through) and rating, so that I can compare at a glance.
3. As a shopper, I want to click a product card to open its detail page.
4. As a shopper, I want 20 products per page, so that pages load quickly and stay scannable.
5. As a shopper, I want Previous/Next controls and "Page X of Y", so that I know where I am.
6. As a shopper, I want the current page in the URL (`?page=N`), so that I can refresh, bookmark, share or go back.
7. As a shopper, I want page 1 to live at `/`, so that URLs stay canonical.
8. As a shopper, I want a malformed or below-1 `?page` to show page 1.
9. As a shopper, I want a page beyond the last to show not-found.
10. As a shopper, I want an empty catalog to show a "No products" message on page 1, not a 404.
11. As a shopper, I want the detail page to show title, main image, description, price, discount percentage and rating.
12. As a shopper, I want non-positive-integer product IDs to show not-found without any upstream request.
13. As a shopper, I want IDs of products that don't exist to show not-found with a link home.
14. As a shopper, I want an error page with "Try again" when the product service fails or returns unexpected data.
15. As a shopper, I want loading skeletons while the list or detail page loads.
16. As a shopper, I want the tab title to show the product name on detail pages.
17. As a shopper, I want an "Add to cart" button on the detail page while the product isn't in my cart.
18. As a shopper, I want adding the same product again to increase its quantity.
19. As a shopper, once the product is in my cart, I want the detail page to show a quantity stepper with the cart's current quantity, so I can adjust or remove it without leaving the page.
20. As a shopper, I want the header to show my total item count (sum of quantities) on every page.
21. As a screen-reader user, I want the cart link to announce its count and count changes.
22. As a shopper, I want a cart page listing thumbnail, linked title, unit price, quantity controls, line subtotal and Remove (for quantities above 1) for each line.
23. As a shopper, I want the same +/− stepper on the detail and cart pages, with − replaced by a trash button that removes the product at quantity 1.
24. As a shopper, I want to remove a product entirely.
25. As a shopper, I want to see the total item count, my discount savings and the total price on the cart page.
26. As a shopper, I want accurate totals with no floating-point artifacts.
27. As a shopper, I want an empty-cart message linking home.
28. As a shopper, I want my cart to survive refreshes and browser restarts.
29. As a shopper, I don't want a flash of "0 items" or "empty cart" while my saved cart loads.
30. As a shopper, I want a corrupted saved cart to reset to empty without crashing.
31. As a reviewer, I want a README covering how to run and test the app, the thought process, trade-offs and limitations.

## Implementation Decisions

**Rendering and boundaries**
- These are server components: layout, header shell, home, product card, pagination, detail page, not-found pages.
- These are client components: the cart provider (wraps layout `children`), the header cart link, the add-to-cart button, the cart page body, and the error boundary.
- The add-to-cart button receives only `{ id, title, priceCents, listPriceCents, thumbnail }`.

**Products data module (server)**
- Interface:
  - `parsePage(raw) → positive integer` (defaults to 1).
  - `getProducts(page) → { products, total, pageCount }`.
  - `getProduct(rawId) → Product | null`.
- The base URL defaults to `https://dummyjson.com` and can be overridden with `DUMMYJSON_API_URL` (used by e2e).
- The list uses `limit=20`, `skip=(page−1)×20`, and `select=title,price,discountPercentage,rating,thumbnail`.
- `pageCount = max(1, ceil(total / 20))`. The home page calls `notFound()` only when `page > pageCount`. An empty catalog renders page 1 with an empty state.
- IDs are validated as positive integers (safe-integer range) before any fetch. An invalid ID or an upstream 404 returns `null`, and the route calls `notFound()`. Other non-OK statuses, network failures, non-JSON bodies and malformed shapes throw.
- Caching: Cache Components is enabled (the Next 16.4 create-next-app default). Data functions use `"use cache"` + `cacheLife("hours")`, giving about one-hour revalidation. No specific upstream request rate is promised.
- Runtime checks are hand-written type guards with no library.
  - List: `products` is an array, `total` is a non-negative number. Each item has `id` as a positive integer, `title` as a string, `price` as a finite number ≥ 0, `discountPercentage` as a finite number from 0 to 100, `rating` as a finite number, `thumbnail` as a string.
  - Detail: the same checks, plus `description` as a string and `images` as a string array.
- Main image is `images[0]`, falling back to `thumbnail`.

**Cart module (client)**
- Line item: `{ id, title, priceCents, listPriceCents, thumbnail, quantity }`. `priceCents` is the discounted unit price and `listPriceCents` the pre-discount one, both computed once when the product is added; the cart never recalculates discounts.
- The reducer is pure, with actions `hydrate`, `add`, `increment`, `decrement` (floors at 1) and `remove`. Totals are computed by pure selectors.
- The provider owns persistence:
  - It starts empty with `hydrated = false`, reads `localStorage["cart:v2"]` after mount, validates it (invalid becomes empty), then hydrates.
  - It writes only when hydrated.
  - All storage access is wrapped in try/catch.
- `useCart() → { items, hydrated, totalCount, totalPriceCents, totalSavingsCents, add, increment, decrement, remove }`.
- The header count and cart page render placeholders until hydrated.

**UI**
- `next/image` with `remotePatterns` limited to `cdn.dummyjson.com`, plus `sizes`.
- Money is formatted with `Intl.NumberFormat` in USD from cents.
- Discounts are applied. DummyJSON's `price` is treated as the pre-discount price (the API doesn't say). The unit price paid is `round(price × (100 − discountPercentage))` cents, using the exact percentage and rounding once, in `discountedCents` (`lib/money.ts`). Cards and the detail page show it with the original struck through; the detail page adds an "N% off" badge with up to two decimals (e.g. "10.48% off"), hidden at 0%.
- Route files: `loading`, `error`, `not-found`. `generateMetadata` on the detail page.

## Testing Decisions
- Test external behaviour through public interfaces only. No snapshot tests and no separate reducer tests.
- **Products seam** (Vitest, stubbed `fetch`): `parsePage` edge cases; skip/limit/select sent upstream; page count for total 0, an exact multiple, and a remainder; invalid IDs return null with no fetch; 404 returns null; error status, network failure, non-JSON and malformed shapes throw.
- **Cart seam** (Vitest + RTL + jsdom `localStorage`, through `CartProvider`/`useCart` and the cart UI): repeated adds, increment/decrement, removal, totals, hydration, persistence across remount, no overwrite before hydration, corrupt-storage recovery, storage unavailable.
- **Money**: `discountedCents` for 0%, fractional and 100% discounts; `formatPercent`.
- **E2E seam** (Playwright against a production build and a local fixture API): check discounted prices on the card and detail page, step the quantity 0 → 1 → 2 → 1 → 0 on the detail page, verify quantity 2, savings and the correct total on the cart page, reload to verify persistence, check the detail page reflects a cart-page change, then remove with the trash button.

## Out of Scope
Checkout, auth, coupon codes, stock limits, cross-tab sync, search, filters, sorting, numbered pagination, i18n, refreshing stale prices.
