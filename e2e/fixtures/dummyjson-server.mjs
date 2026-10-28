// A stand-in for the two DummyJSON endpoints the app uses, serving fixed
// products so e2e assertions on prices stay exact.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3101);
const products = JSON.parse(readFileSync(new URL("./products.json", import.meta.url), "utf8"));

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);

  if (url.pathname === "/products") {
    const limit = Number(url.searchParams.get("limit") ?? 30);
    const skip = Number(url.searchParams.get("skip") ?? 0);
    const page = products.slice(skip, skip + limit);
    return send(response, 200, { products: page, total: products.length, skip, limit });
  }

  const match = url.pathname.match(/^\/products\/(\d+)$/);
  const product = match && products.find((p) => p.id === Number(match[1]));
  if (product) return send(response, 200, product);

  send(response, 404, { message: "Not found" });
}).listen(PORT, () => console.log(`Fixture DummyJSON listening on http://localhost:${PORT}`));
