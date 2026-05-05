import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import StockSearchForm from "./StockSearchForm";

describe("StockSearchForm", () => {
  it("searches by name, selects a ticker, then submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input.toString() : String(input);
      if (url.startsWith("/api/search")) {
        return new Response(
          JSON.stringify({
            query: "apple",
            results: [
              { symbol: "AAPL", description: "Apple Inc." },
              { symbol: "APLE", description: "Apple Hospitality REIT, Inc." },
            ],
            isFallback: true,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    });

    render(<StockSearchForm initialSymbol="" onSubmit={onSubmit} />);

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const input = screen.getByPlaceholderText("예: Apple");
    await user.type(input, "apple");
    await user.click(screen.getByRole("button", { name: "검색" }));

    await user.click(screen.getByRole("radio", { name: /APLE/ }));
    await user.click(screen.getByRole("button", { name: "조회하기" }));

    expect(onSubmit).toHaveBeenCalledWith("APLE");

    vi.unstubAllGlobals();
  });
});

