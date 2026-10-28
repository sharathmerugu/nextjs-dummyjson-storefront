# Storefront

A small e-commerce app built with Next.js 16 (App Router) on the [DummyJSON](https://dummyjson.com/docs/products) products API: a paginated product list, product detail pages, and a cart that survives reloads.

**Live:** https://nextjs-dummyjson-storefront.vercel.app

## Running locally

Requires Node.js 20.9+ (developed on 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm test`           | Unit/integration tests (Vitest + Testing Library)              |
| `npm run test:e2e`   | Builds the app against fixture data and runs the Playwright test |
| `npm run typecheck`  | Generates Next.js route types and runs `tsc`                   |
| `npm run lint`       | ESLint                                                         |
| `npm run build && npm start` | Production build and server                            |

Before the first e2e run, install the browser once with `npx playwright install chromium`.

## Deployment

Hosted on Vercel. No environment variables are needed because DummyJSON is a public API. (`DUMMYJSON_API_URL` overrides the API base URL; only the e2e setup uses it.) Deploys are manual (`npx vercel deploy --prod`): the Vercel project isn't connected to the GitHub repo, so pushes don't deploy automatically.

## How it's put together

```
src/
  app/                 routes only: pages, loading, error and not-found states
  components/          server-rendered UI: Header, ProductCard, Price, Pagination, Rating
  features/cart/       the cart: pure reducer, provider + useCart hook, cart UI
  lib/products.ts      DummyJSON client: fetching, caching, runtime validation
  lib/money.ts         cents conversion, discount calculation, USD and percent formatting
e2e/                   Playwright test and its fixture DummyJSON server
```

**Server vs. client.** Product data is fetched and rendered in Server Components. Nothing about the catalog ships as client JavaScript. Client Components sit only at the leaves that need browser state: the cart provider, the header's cart link, the detail page's add-to-cart control and the cart page body. The provider wraps the layout's `children`, but those children stay server-rendered. The detail page passes only the five fields the cart needs (`id`, `title`, `priceCents`, `listPriceCents`, `thumbnail`) across the boundary, not the whole product.

**Data fetching and caching.** Pages call `getProducts(page)` / `getProduct(id)` directly. There are no API routes and no client fetching library, because there's no client-side server state to manage. The app uses Cache Components (the default for new Next.js 16 apps), so each upstream response is cached with `"use cache"` + `cacheLife("hours")`, revalidating roughly hourly. Pages read `searchParams`/`params` at request time and stream in behind `loading.tsx` skeletons, while the header and layout are prerendered as a static shell.

**Pagination.** 20 products per page, using DummyJSON's `limit`/`skip`, with the page kept in the URL (`/?page=N`). This makes pages shareable and bookmarkable, and lets the back button work, with no client state. Pagination links point page 1 to `/` (`/?page=1` also works but isn't redirected). A missing or malformed `page` falls back to page 1, and a page past the end shows not-found. An empty catalog still renders page 1 with an empty-state message instead of a 404.

**Validating external data.** TypeScript types don't check JSON at runtime, so `lib/products.ts` checks the fields the UI depends on before returning them. It uses small hand-written type guards instead of adding a schema library for two endpoints. A malformed response, an error status or a network failure raises an error that the route's error boundary turns into a "Try again" screen. Product IDs are validated as positive integers before any request is made. Invalid IDs and upstream 404s both render "Product not found".

**Cart state.** React Context + `useReducer`, with no extra dependency.
- The reducer (`add`, `increment`, `decrement`, `remove`, `hydrate`) is pure.
- All browser concerns live in the provider. It loads the saved cart from `localStorage` after mount, so the first client render matches the server render (an empty cart). It writes only after that load, so the empty initial state can never overwrite a saved cart.
- Until then, the header badge and cart page render placeholders instead of a misleading "0" or "Your cart is empty", and the detail page shows a placeholder instead of "Add to cart" or a stepper.
- Storage errors (private mode, quota) are caught, and the cart keeps working in memory. A corrupt or unexpected saved cart resets to empty. This includes image URLs outside DummyJSON's CDN, which `next/image` would refuse to render.

**Money.** The cart stores prices in integer cents, and totals are summed in cents and formatted with `Intl.NumberFormat`. This avoids floating-point drift such as `0.1 + 0.2`.

## Trade-offs and decisions

- **`localStorage` rather than `sessionStorage` or memory only.** The brief asks for the cart to persist within the session and names `localStorage` as an option. `localStorage` meets that and also survives closing the tab, which matches how real carts behave.
- **The cart stores a snapshot of each product**, not just IDs. The cart page renders instantly with no network requests. The cost is that a price change upstream isn't reflected in an existing cart line.
- **Context over Zustand.** With three consumers, Context re-rendering every consumer on change costs nothing measurable. If the cart grew more consumers or derived state, Zustand's selectors and `persist` middleware would be the next step.
- **Quantities, with "Add to cart" only on the detail page.** Adding the same product twice increases its quantity, and the header shows the total quantity. Product cards are links, and nesting a button inside a link is invalid interactive HTML, so card-level adding was left out rather than restructuring the cards.
- **One quantity stepper on both pages, with trash at 1.** The detail page shows "Add to cart" at quantity 0, then the same `QuantityStepper` the cart page uses, reading the quantity straight from the cart, so it stays in step after reloads or cart-page changes. At quantity 1 the "−" becomes a trash button that removes the line, and the cart page hides its separate "Remove" link so there is one removal control. The reducer's `decrement` still floors at 1: removal is always the explicit `remove` action, the trash button just puts it where the shopper's pointer already is. When adding or removing swaps the control on the detail page, keyboard focus moves to its replacement.
- **Discounts are applied, and DummyJSON's `price` is assumed to be the pre-discount price.** The API returns `price` and `discountPercentage` without saying whether the discount is already included; this app assumes it isn't. The exact percentage is used (10.48%, not 10%), and the unit price is rounded to cents once, in `discountedCents` (`lib/money.ts`), which the cards, the detail page and the cart all share. The badge shows the same exact percentage ("10.48% off"). Cart lines snapshot both the discounted and original unit price, so the order summary can show savings without recalculating anything. Cart storage moved to `cart:v2`, so carts saved before this change (with undiscounted prices) are dropped.
- **Tests sit at three seams.** Testing behaviour through public interfaces keeps the tests robust to refactoring:
  - The products module's public functions, with `fetch` stubbed. Covers pagination, ID validation, 404s, error statuses, network failures and malformed responses.
  - The cart through `CartProvider`/`useCart` and its UI with a real jsdom `localStorage`. Covers repeated adds, quantities, removal, totals, hydration, persistence and corrupt-storage recovery.
  - One Playwright test against a production build fed by a small fixture API (`e2e/fixtures`). Checks discounted prices on the card and detail page, steps the quantity 0 → 1 → 2 → 1 → 0 on the detail page, checks the quantity, savings and total on the cart page, reloads to confirm persistence, checks the detail page reflects a cart-page change, then removes it with the trash button.
  
  There are no separate reducer unit tests and no snapshot tests.

## Known limitations

- **Missing products and out-of-range pages return HTTP 200, not 404.** These lookups happen after the response has started streaming, so Next.js can't change the status code. It marks the page `noindex` instead. URLs that match no route (e.g. `/abc`) still return a real 404.
- **Cart prices can go stale**, because they are snapshots taken when the product was added.
- **No cross-tab sync.** A cart changed in one tab updates in another only after a reload.
- **Stock and minimum order quantities are ignored.**
- **The e2e test uses fixture data, not the live API**, so it won't catch DummyJSON changing its response shape or pricing. Product images still load from DummyJSON's CDN. The e2e build is prerendered from fixtures, so run `npm run build` again before serving real data.
- **Catalog changes appear late.** Upstream responses are cached for about an hour.
- **Out of scope:** checkout, auth, search, filtering, sorting, and numbered pagination.
