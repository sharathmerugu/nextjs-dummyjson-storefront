# Storefront

A small e-commerce app built with Next.js 16 (App Router) on the [DummyJSON](https://dummyjson.com/docs/products) products API: a paginated product list, product detail pages, and a cart that survives reloads.

## Running locally

Requires Node.js 22+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm test`           | Unit/integration tests (Vitest + Testing Library)              |
| `npm run test:e2e`   | Builds the app and runs the Playwright end-to-end test         |
| `npm run typecheck`  | Generates Next.js route types and runs `tsc`                   |
| `npm run lint`       | ESLint                                                         |
| `npm run build && npm start` | Production build and server                            |

Before the first e2e run, install the browser once with `npx playwright install chromium`.

## How it's put together

```
src/
  app/                 routes only: pages, loading, error and not-found states
  components/          server-rendered UI: Header, ProductCard, Pagination, Rating
  features/cart/       the cart: pure reducer, provider + useCart hook, cart UI
  lib/products.ts      DummyJSON client: fetching, caching, runtime validation
  lib/money.ts         cents conversion and USD formatting
e2e/                   Playwright test
```

**Server vs. client.** Product data is fetched and rendered in Server Components. Nothing about the catalog ships as client JavaScript. Client Components sit only at the leaves that need browser state: the cart provider, the header's cart link, the "Add to cart" button and the cart page body. The provider wraps the layout's `children`, but those children stay server-rendered. The detail page passes only the four fields the cart needs (`id`, `title`, `priceCents`, `thumbnail`) across the boundary, not the whole product.

**Data fetching and caching.** Pages call `getProducts(page)` / `getProduct(id)` directly. There are no API routes and no client fetching library, because there's no client-side server state to manage. The app uses Cache Components (the default for new Next.js 16 apps), so each upstream response is cached with `"use cache"` + `cacheLife("hours")`, revalidating roughly hourly. Pages read `searchParams`/`params` at request time and stream in behind `loading.tsx` skeletons, while the header and layout are prerendered as a static shell.

**Pagination.** 20 products per page, using DummyJSON's `limit`/`skip`, with the page kept in the URL (`/?page=N`). This makes pages shareable and bookmarkable, and lets the back button work, with no client state. Page 1 is always `/`. A missing or malformed `page` falls back to page 1, and a page past the end shows not-found. An empty catalog still renders page 1 with an empty-state message instead of a 404.

**Validating external data.** TypeScript types don't check JSON at runtime, so `lib/products.ts` checks the fields the UI depends on before returning them. It uses small hand-written type guards instead of adding a schema library for two endpoints. A malformed response, an error status or a network failure raises an error that the route's error boundary turns into a "Try again" screen. Product IDs are validated as positive integers before any request is made. Invalid IDs and upstream 404s both render "Product not found".

**Cart state.** React Context + `useReducer`, with no extra dependency.
- The reducer (`add`, `increment`, `decrement`, `remove`, `hydrate`) is pure.
- All browser concerns live in the provider. It loads the saved cart from `localStorage` after mount, so the first client render matches the server render (an empty cart). It writes only after that load, so the empty initial state can never overwrite a saved cart.
- Until then, the header badge and cart page render placeholders instead of a misleading "0" or "Your cart is empty", and "Add to cart" stays disabled.
- Storage errors (private mode, quota) are caught, and the cart keeps working in memory. A corrupt or unexpected saved cart resets to empty.

**Money.** The cart stores prices in integer cents, and totals are summed in cents and formatted with `Intl.NumberFormat`. This avoids floating-point drift such as `0.1 + 0.2`.

## Trade-offs and decisions

- **`localStorage` rather than `sessionStorage` or memory only.** The brief asks for the cart to persist within the session and names `localStorage` as an option. `localStorage` meets that and also survives closing the tab, which matches how real carts behave.
- **The cart stores a snapshot of each product**, not just IDs. The cart page renders instantly with no network requests. The cost is that a price change upstream isn't reflected in an existing cart line.
- **Context over Zustand.** With three consumers, Context re-rendering every consumer on change costs nothing measurable. If the cart grew more consumers or derived state, Zustand's selectors and `persist` middleware would be the next step.
- **Quantities, with "Add to cart" only on the detail page.** Adding the same product twice increases its quantity, and the header shows the total quantity. Product cards are links, and nesting a button inside a link is invalid interactive HTML, so card-level adding was left out rather than restructuring the cards.
- **Decrease stops at 1.** Removing a line is always the explicit "Remove" action, never a side effect of the "−" button.
- **Discounts are displayed, not applied.** The brief asks to show the discount percentage. The cart total uses the listed `price`.
- **Tests sit at three seams.** Testing behaviour through public interfaces keeps the tests robust to refactoring:
  - The products module's public functions, with `fetch` stubbed. Covers pagination, ID validation, 404s, error statuses, network failures and malformed responses.
  - The cart through `CartProvider`/`useCart` and its UI with a real jsdom `localStorage`. Covers repeated adds, quantities, removal, totals, hydration, persistence and corrupt-storage recovery.
  - One Playwright test against a production build. Adds a product twice, checks the quantity and total, reloads to confirm persistence, then removes it.
  
  There are no separate reducer unit tests and no snapshot tests.

## Known limitations

- **Not-found pages return HTTP 200, not 404.** Product and page lookups happen after the response has started streaming, so Next.js can't change the status code. It marks the page `noindex` instead.
- **Cart prices can go stale**, because they are snapshots taken when the product was added.
- **No cross-tab sync.** A cart changed in one tab updates in another only after a reload.
- **Stock and minimum order quantities are ignored.**
- **The e2e test hits the live DummyJSON API**, so it depends on the network and on DummyJSON's sample data staying the same.
- **Catalog changes appear late.** Upstream responses are cached for about an hour.
- **Out of scope:** checkout, auth, search, filtering, sorting, and numbered pagination.
