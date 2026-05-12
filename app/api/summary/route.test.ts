import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("/api/summary", () => {
  it("sends both url_context and google_search tools", async () => {
    process.env.GEMINI_API_KEY = "test-key";

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      expect(body?.tools).toEqual([{ url_context: {} }, { google_search: {} }]);
      expect(body?.generationConfig).toEqual(
        expect.objectContaining({
          temperature: 0.2,
          maxOutputTokens: 768,
        }),
      );
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
});

