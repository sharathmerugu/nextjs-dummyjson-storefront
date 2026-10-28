import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Price } from "./Price";

describe("Price", () => {
  it("shows the discounted price, the struck-through original and the exact discount", () => {
    render(<Price price={9.99} discountPercentage={10.48} badge />);

    expect(screen.getByText("$8.94")).toBeTruthy();
    expect(screen.getByText("$9.99").closest("s")).toBeTruthy();
    expect(screen.getByText("10.48% off")).toBeTruthy();
  });

  it("leaves the badge out unless asked for", () => {
    render(<Price price={9.99} discountPercentage={10.48} />);

    expect(screen.getByText("$8.94")).toBeTruthy();
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it("shows only the price when there is no discount", () => {
    const { container } = render(<Price price={12.5} discountPercentage={0} badge />);

    expect(screen.getByText("$12.50")).toBeTruthy();
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/% off/)).toBeNull();
  });
});
