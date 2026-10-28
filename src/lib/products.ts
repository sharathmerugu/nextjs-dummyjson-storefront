import { cacheLife } from "next/cache";

const API_URL = "https://dummyjson.com";
const PAGE_SIZE = 20;

export type ProductSummary = {
  id: number;
  title: string;
  price: number;
  rating: number;
  thumbnail: string;
};

export type Product = ProductSummary & {
  description: string;
  discountPercentage: number;
  images: string[];
};

export type ProductPage = {
  products: ProductSummary[];
  total: number;
  pageCount: number;
};

class ProductsApiError extends Error {
  name = "ProductsApiError";
}

/** Reads `?page=N`. Anything other than a positive integer falls back to page 1. */
export function parsePage(raw: string | string[] | undefined): number {
  return typeof raw === "string" ? (parsePositiveInteger(raw) ?? 1) : 1;
}

export async function getProducts(page: number): Promise<ProductPage> {
  "use cache";
  cacheLife("hours");

  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String((page - 1) * PAGE_SIZE),
    select: "title,price,rating,thumbnail",
  });
  const body = await readJson(await request(`/products?${params}`));
  if (!isProductList(body)) {
    throw new ProductsApiError("Unexpected response from DummyJSON for the product list");
  }

  return {
    products: body.products.map(toProductSummary),
    total: body.total,
    pageCount: Math.max(1, Math.ceil(body.total / PAGE_SIZE)),
  };
}

/** Resolves to `null` when the id is not a positive integer or the product doesn't exist. */
export async function getProduct(rawId: string): Promise<Product | null> {
  const id = parsePositiveInteger(rawId);
  return id === null ? null : fetchProduct(id);
}

async function fetchProduct(id: number): Promise<Product | null> {
  "use cache";
  cacheLife("hours");

  const response = await request(`/products/${id}`);
  if (response.status === 404) return null;

  const body = await readJson(response);
  if (!isProduct(body)) {
    throw new ProductsApiError(`Unexpected response from DummyJSON for product ${id}`);
  }

  const { title, description, price, discountPercentage, rating, thumbnail, images } = body;
  return { id: body.id, title, description, price, discountPercentage, rating, thumbnail, images };
}

async function request(path: string): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`);
  } catch (cause) {
    throw new ProductsApiError(`Could not reach DummyJSON (${path})`, { cause });
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new ProductsApiError(`DummyJSON responded with ${response.status}`);
  }
  try {
    return await response.json();
  } catch (cause) {
    throw new ProductsApiError("Unexpected response from DummyJSON: body is not JSON", { cause });
  }
}

function parsePositiveInteger(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function toProductSummary({ id, title, price, rating, thumbnail }: ProductSummary): ProductSummary {
  return { id, title, price, rating, thumbnail };
}

// TypeScript types don't validate external JSON, so the fields the UI relies on
// are checked at runtime before the data leaves this module.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isProductSummary(value: unknown): value is ProductSummary {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    typeof value.title === "string" &&
    isFiniteNumber(value.price) &&
    value.price >= 0 &&
    isFiniteNumber(value.rating) &&
    typeof value.thumbnail === "string"
  );
}

function isProduct(value: unknown): value is Product {
  if (!isProductSummary(value)) return false;
  const { description, discountPercentage, images } = value as Record<string, unknown>;
  return (
    typeof description === "string" &&
    isFiniteNumber(discountPercentage) &&
    Array.isArray(images) &&
    images.every((image) => typeof image === "string")
  );
}

function isProductList(value: unknown): value is { products: ProductSummary[]; total: number } {
  return (
    isRecord(value) &&
    Array.isArray(value.products) &&
    value.products.every(isProductSummary) &&
    isFiniteNumber(value.total) &&
    value.total >= 0
  );
}
