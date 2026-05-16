import { describe, expect, it } from "vitest";

import { parseApiErrorMessage } from "./parseApiError";

describe("parseApiErrorMessage", () => {
  it("extracts message from JSON body", () => {
    expect(parseApiErrorMessage('{"message":"fetch failed"}')).toBe("fetch failed");
  });

  it("maps generic fetch failed to friendly text", () => {
    expect(parseApiErrorMessage("fetch failed")).toContain("서버 연결");
  });

  it("returns trimmed plain text as-is", () => {
    expect(parseApiErrorMessage("  티커 오류  ")).toBe("티커 오류");
  });
});
