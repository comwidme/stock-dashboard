import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";
import { resetSummaryGuardsForTests } from "@/lib/summaryGuards";

describe("/api/summary", () => {
  afterEach(() => {
    resetSummaryGuardsForTests();
    vi.unstubAllGlobals();
  });

  it("pass1 uses url_context only when result is acceptable", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      expect(body?.tools).toEqual([{ url_context: {} }]);
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: "- 국내 판매가 증가했다.\n- 경쟁사 대비 과제가 남아 있다." }] } },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/a", title: "t" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { summaryKo: string };
    expect(json.summaryKo).toMatch(/국내 판매/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pass2 uses google_search when pass1 is not acceptable", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    let call = 0;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      call += 1;
      if (call === 1) {
        expect(body?.tools).toEqual([{ url_context: {} }]);
        return new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: "The URL is an API endpoint only." }] } },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      expect(body?.tools).toEqual([{ google_search: {} }]);
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: "- 검색으로 확인한 바 주가 관련 뉴스다.\n- 세부 수치는 기사에 따른다." }] } },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/a", title: "t" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
