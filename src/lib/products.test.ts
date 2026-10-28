import { afterEach, describe, expect, it, vi } from "vitest";
import { getProduct, getProducts, parsePage } from "./products";

// `cacheLife` only works inside the Next.js runtime; caching is not under test here.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
});

function respondWith(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("parsePage", () => {
  it.each([
    { raw: "3", page: 3 },
    { raw: "1", page: 1 },
    { raw: undefined, page: 1 },
    { raw: "", page: 1 },
    { raw: "0", page: 1 },
    { raw: "-2", page: 1 },
    { raw: "2.5", page: 1 },
    { raw: "abc", page: 1 },
    { raw: "2abc", page: 1 },
    { raw: "1e3", page: 1 },
    { raw: "99999999999999999999", page: 1 },
    { raw: ["2", "3"], page: 1 },
  ])("reads $raw as page $page", ({ raw, page }) => {
    expect(parsePage(raw)).toBe(page);
  });
});

describe("getProducts", () => {
  it("requests the given page of 20 products from DummyJSON", async () => {
    respondWith({ products: [], total: 194, skip: 20, limit: 20 });

    await getProducts(2);

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://dummyjson.com/products");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("skip")).toBe("20");
    expect(url.searchParams.get("select")).toBe("title,price,rating,thumbnail");
  });

  it("returns the product summaries and catalog size", async () => {
    respondWith({
      products: [
        {
          id: 1,
          title: "Mascara",
          price: 9.99,
          rating: 2.56,
          thumbnail: "https://cdn.dummyjson.com/1.webp",
          brand: "Essence",
        },
      ],
      total: 194,
      skip: 0,
      limit: 20,
    });

    await expect(getProducts(1)).resolves.toEqual({
      products: [
        {
          id: 1,
          title: "Mascara",
          price: 9.99,
          rating: 2.56,
          thumbnail: "https://cdn.dummyjson.com/1.webp",
        },
      ],
      total: 194,
      pageCount: 10,
    });
  });

  it.each([
    { total: 40, pageCount: 2 },
    { total: 41, pageCount: 3 },
    // An empty catalog still has a first page, so page 1 is never a 404.
    { total: 0, pageCount: 1 },
  ])("reports $pageCount page(s) for $total products", async ({ total, pageCount }) => {
    respondWith({ products: [], total, skip: 0, limit: 20 });

    const result = await getProducts(1);

    expect(result.pageCount).toBe(pageCount);
  });

  it("fails when DummyJSON cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(getProducts(1)).rejects.toThrow("Could not reach DummyJSON");
  });

  it("fails when DummyJSON responds with an error status", async () => {
    respondWith({ message: "Internal error" }, 500);

    await expect(getProducts(1)).rejects.toThrow("DummyJSON responded with 500");
  });

  it("fails when the response is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>"));

    await expect(getProducts(1)).rejects.toThrow("Unexpected response from DummyJSON");
  });

  const validProduct = {
    id: 1,
    title: "Mascara",
    price: 9.99,
    rating: 2.56,
    thumbnail: "https://cdn.dummyjson.com/1.webp",
  };

  it.each([
    { case: "products is missing", body: { total: 1 } },
    { case: "total is missing", body: { products: [] } },
    { case: "a product has no id", body: { products: [{ ...validProduct, id: undefined }], total: 1 } },
    { case: "a price is a string", body: { products: [{ ...validProduct, price: "9.99" }], total: 1 } },
    { case: "a price is negative", body: { products: [{ ...validProduct, price: -1 }], total: 1 } },
    { case: "a title is missing", body: { products: [{ ...validProduct, title: null }], total: 1 } },
    { case: "the body is null", body: null },
  ])("fails when $case", async ({ body }) => {
    respondWith(body);

    await expect(getProducts(1)).rejects.toThrow("Unexpected response from DummyJSON");
  });
});

describe("getProduct", () => {
  const apiProduct = {
    id: 1,
    title: "Mascara",
    description: "Lengthens lashes.",
    price: 9.99,
    discountPercentage: 10.48,
    rating: 2.56,
    thumbnail: "https://cdn.dummyjson.com/thumb.webp",
    images: ["https://cdn.dummyjson.com/1.webp", "https://cdn.dummyjson.com/2.webp"],
    reviews: [{ rating: 5 }],
  };

  it("returns the product's detail fields", async () => {
    respondWith(apiProduct);

    await expect(getProduct("1")).resolves.toEqual({
      id: 1,
      title: "Mascara",
      description: "Lengthens lashes.",
      price: 9.99,
      discountPercentage: 10.48,
      rating: 2.56,
      thumbnail: "https://cdn.dummyjson.com/thumb.webp",
      images: ["https://cdn.dummyjson.com/1.webp", "https://cdn.dummyjson.com/2.webp"],
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://dummyjson.com/products/1");
  });

  it.each(["abc", "0", "-1", "1.5", "01", "1e2", "", "99999999999999999999"])(
    "returns null for the invalid id %j without calling DummyJSON",
    async (rawId) => {
      await expect(getProduct(rawId)).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns null when DummyJSON has no such product", async () => {
    respondWith({ message: "Product with id '9999' not found" }, 404);

    await expect(getProduct("9999")).resolves.toBeNull();
  });

  it("fails when DummyJSON cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(getProduct("1")).rejects.toThrow("Could not reach DummyJSON");
  });

  it("fails when DummyJSON responds with an error status", async () => {
    respondWith({ message: "Service unavailable" }, 503);

    await expect(getProduct("1")).rejects.toThrow("DummyJSON responded with 503");
  });

  it.each([
    { case: "description is missing", body: { ...apiProduct, description: undefined } },
    { case: "discountPercentage is a string", body: { ...apiProduct, discountPercentage: "10" } },
    { case: "images is not an array", body: { ...apiProduct, images: "1.webp" } },
    { case: "an image is not a string", body: { ...apiProduct, images: [null] } },
    { case: "rating is missing", body: { ...apiProduct, rating: undefined } },
  ])("fails when $case", async ({ body }) => {
    respondWith(body);

    await expect(getProduct("1")).rejects.toThrow("Unexpected response from DummyJSON");
  });
});
