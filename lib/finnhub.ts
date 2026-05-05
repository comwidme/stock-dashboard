type FinnhubQuoteResponse = {
  c: number; // current
  pc: number; // previous close
  h: number; // high
  l: number; // low
};

type FinnhubCompanyNewsItem = {
  headline: string;
  source: string;
  datetime: number;
  url: string;
};

type FinnhubSymbolLookupResponse = {
  count: number;
  result: Array<{
    description: string;
    symbol: string;
    type: string;
  }>;
};

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export class FinnhubConfigError extends Error {
  override name = "FinnhubConfigError";
}

const getApiKey = (): string => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new FinnhubConfigError("Missing FINNHUB_API_KEY");
  return key;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    // App Router route handlers run on server; avoid caching during demos
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Finnhub request failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
};

export const fetchQuote = async (symbol: string): Promise<FinnhubQuoteResponse> => {
  const key = getApiKey();
  const url = new URL(`${FINNHUB_BASE_URL}/quote`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", key);
  return fetchJson<FinnhubQuoteResponse>(url.toString());
};

export const fetchCompanyNews = async (
  symbol: string,
  from: string,
  to: string,
): Promise<FinnhubCompanyNewsItem[]> => {
  const key = getApiKey();
  const url = new URL(`${FINNHUB_BASE_URL}/company-news`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("token", key);
  return fetchJson<FinnhubCompanyNewsItem[]>(url.toString());
};

export const fetchSymbolLookup = async (query: string): Promise<FinnhubSymbolLookupResponse> => {
  const key = getApiKey();
  const url = new URL(`${FINNHUB_BASE_URL}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("token", key);
  return fetchJson<FinnhubSymbolLookupResponse>(url.toString());
};

