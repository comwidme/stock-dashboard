import { describe, expect, it } from "vitest";

import { getCuratedLookup, mergeLookupResults, resolveSearchQuery } from "./searchAliases";

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

  it("curates 구글 to GOOGL (Alphabet Inc.)", () => {
    expect(getCuratedLookup("구글")).toEqual([
      { symbol: "GOOGL", description: "Alphabet Inc." },
    ]);
  });

  it("curates google alias to GOOGL", () => {
    expect(getCuratedLookup("google")).toEqual([
      { symbol: "GOOGL", description: "Alphabet Inc." },
    ]);
  });

  it("puts curated results first when merging", () => {
    const merged = mergeLookupResults(
      [{ symbol: "GOOGL", description: "Alphabet Inc." }],
      [
        { symbol: "GOOG", description: "Alphabet Inc Class C" },
        { symbol: "GOOGL", description: "Alphabet Inc Class A" },
      ],
    );
    expect(merged[0]).toEqual({ symbol: "GOOGL", description: "Alphabet Inc." });
    expect(merged).toHaveLength(2);
  });
});

