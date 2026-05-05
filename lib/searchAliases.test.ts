import { describe, expect, it } from "vitest";

import { resolveSearchQuery } from "./searchAliases";

describe("resolveSearchQuery", () => {
  it("maps Korean company name to English search query", () => {
    expect(resolveSearchQuery("테슬라").effective).toBe("tesla");
  });

  it("maps Korean phrase by first token", () => {
    expect(resolveSearchQuery("테슬라 주가").effective).toBe("tesla");
  });

  it("passes through unknown queries", () => {
    expect(resolveSearchQuery("Some Random Corp").effective).toBe("Some Random Corp");
  });
});

