import { describe, expect, it } from "vitest";

import { clampBulletsUnderMaxChars, isAcceptableKoSummary, normalizeBulletLines } from "./summaryFormat";

describe("summaryFormat", () => {
  it("normalizeBulletLines converts markers to hyphen bullets", () => {
    expect(normalizeBulletLines("* a\n• b")).toBe("- a\n- b");
  });

  it("clampBulletsUnderMaxChars drops whole lines instead of mid-sentence cut", () => {
    const long = "- " + "가".repeat(200) + "\n- " + "나".repeat(200);
    const out = clampBulletsUnderMaxChars(long, 220);
    expect(out.length).toBeLessThanOrEqual(220);
    expect(out).not.toContain("\n- 나");
    expect(out.startsWith("- ")).toBe(true);
  });

  it("isAcceptableKoSummary accepts two Korean bullets", () => {
    expect(isAcceptableKoSummary("- 첫째\n- 둘째")).toBe(true);
  });
});
