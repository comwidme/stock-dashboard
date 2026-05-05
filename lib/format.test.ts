import { describe, expect, it } from "vitest";

import { formatDateTime, formatNumber2, normalizeSymbol, round2 } from "./format";

describe("format utils", () => {
  it("normalizeSymbol trims and uppercases", () => {
    expect(normalizeSymbol(" aapl ")).toBe("AAPL");
  });

  it("round2 rounds to 2 decimals", () => {
    expect(round2(1.005)).toBe(1.01);
  });

  it("formatNumber2 prints 2 decimals", () => {
    expect(formatNumber2(3)).toMatch(/3\.00|3,00/);
  });

  it("formatDateTime returns '-' for invalid", () => {
    expect(formatDateTime(Number.NaN)).toBe("-");
  });
});

