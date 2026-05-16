import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import NewsList from "./NewsList";

describe("NewsList", () => {
  it("shows AI summary after clicking button", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof URL ? input.toString() : String(input);
        if (url === "/api/summary") {
          return new Response(
            JSON.stringify({
              url: "https://news.example.com/1",
              title: "headline",
              summaryKo: "- 요약 1\n- 요약 2",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );

    render(
      <NewsList
        isFallback={false}
        items={[
          {
            headline: "headline",
            source: "source",
            datetime: 1,
            url: "https://news.example.com/1",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "AI 요약" }));

    expect(await screen.findByText(/- 요약 1/)).toBeInTheDocument();
    expect(await screen.findByText(/- 요약 2/)).toBeInTheDocument();
  });

  it("disables AI summary button for fallback news", () => {
    render(
      <NewsList
        isFallback
        items={[
          { headline: "h", source: "s", datetime: 1, url: "https://news.example.com/1" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "AI 요약" })).toBeDisabled();
  });
});

