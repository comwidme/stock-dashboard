import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("withDevTlsBypass", () => {
  let nodeEnv: string | undefined;
  let finnhubTls: string | undefined;
  let geminiTls: string | undefined;

  beforeEach(() => {
    nodeEnv = process.env.NODE_ENV;
    finnhubTls = process.env.FINNHUB_TLS_INSECURE;
    geminiTls = process.env.GEMINI_TLS_INSECURE;
    vi.resetModules();
  });

  afterEach(() => {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    if (finnhubTls === undefined) delete process.env.FINNHUB_TLS_INSECURE;
    else process.env.FINNHUB_TLS_INSECURE = finnhubTls;
    if (geminiTls === undefined) delete process.env.GEMINI_TLS_INSECURE;
    else process.env.GEMINI_TLS_INSECURE = geminiTls;
    vi.resetModules();
  });

  it("프로덕션이면 플래그가 있어도 dispatcher를 붙이지 않는다", async () => {
    process.env.NODE_ENV = "production";
    process.env.FINNHUB_TLS_INSECURE = "1";
    const { withDevTlsBypass } = await import("./devTlsFetch");
    const init = withDevTlsBypass({ method: "GET" });
    expect(init.dispatcher).toBeUndefined();
  });

  it("비프로덕션 + FINNHUB_TLS_INSECURE=1이면 dispatcher를 붙인다", async () => {
    process.env.NODE_ENV = "test";
    process.env.FINNHUB_TLS_INSECURE = "1";
    delete process.env.GEMINI_TLS_INSECURE;
    const { withDevTlsBypass } = await import("./devTlsFetch");
    const init = withDevTlsBypass({ method: "GET" });
    expect(init.dispatcher).toBeDefined();
  });

  it("비프로덕션 + GEMINI_TLS_INSECURE=true만으로 dispatcher를 붙인다", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.FINNHUB_TLS_INSECURE;
    process.env.GEMINI_TLS_INSECURE = "true";
    const { withDevTlsBypass } = await import("./devTlsFetch");
    const init = withDevTlsBypass({});
    expect(init.dispatcher).toBeDefined();
  });

  it("플래그가 없으면 dispatcher를 붙이지 않는다", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.FINNHUB_TLS_INSECURE;
    delete process.env.GEMINI_TLS_INSECURE;
    const { withDevTlsBypass } = await import("./devTlsFetch");
    const init = withDevTlsBypass({ cache: "no-store" });
    expect(init.dispatcher).toBeUndefined();
  });
});
