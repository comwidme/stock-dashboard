import type { CompanyNewsItemDto } from "@/lib/types";
import type { SymbolLookupItemDto } from "@/lib/types";

export type SampleQuoteSeed = {
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
};

export const SAMPLE_QUOTES: Record<string, SampleQuoteSeed> = {
  AAPL: { currentPrice: 192.35, previousClose: 190.12, high: 193.1, low: 189.8 },
  MSFT: { currentPrice: 415.22, previousClose: 410.05, high: 416.4, low: 408.9 },
  NVDA: { currentPrice: 120.45, previousClose: 118.9, high: 121.2, low: 117.5 },
  TSLA: { currentPrice: 178.64, previousClose: 181.03, high: 182.2, low: 177.1 },
};

const nowSec = Math.floor(Date.now() / 1000);

export const SAMPLE_NEWS: Record<string, CompanyNewsItemDto[]> = {
  AAPL: [
    {
      headline: "Apple releases a new update for its ecosystem",
      source: "Sample News",
      datetime: nowSec - 60 * 60 * 6,
      url: "https://www.apple.com/newsroom/",
    },
    {
      headline: "Market reacts to Apple's quarterly results",
      source: "Sample News",
      datetime: nowSec - 60 * 60 * 20,
      url: "https://investor.apple.com/investor-relations/default.aspx",
    },
  ],
  MSFT: [
    {
      headline: "Microsoft announces new cloud features",
      source: "Sample News",
      datetime: nowSec - 60 * 60 * 8,
      url: "https://news.microsoft.com/",
    },
  ],
  NVDA: [
    {
      headline: "NVIDIA highlights AI hardware roadmap",
      source: "Sample News",
      datetime: nowSec - 60 * 60 * 10,
      url: "https://nvidianews.nvidia.com/",
    },
  ],
  TSLA: [
    {
      headline: "EV market update: new production milestones",
      source: "Sample News",
      datetime: nowSec - 60 * 60 * 12,
      url: "https://www.tesla.com/blog",
    },
  ],
};

export const SAMPLE_SYMBOL_LOOKUP: Record<string, SymbolLookupItemDto[]> = {
  apple: [{ symbol: "AAPL", description: "Apple Inc." }],
  microsoft: [{ symbol: "MSFT", description: "Microsoft Corporation" }],
  nvidia: [{ symbol: "NVDA", description: "NVIDIA Corporation" }],
  tesla: [{ symbol: "TSLA", description: "Tesla, Inc." }],
  aapl: [{ symbol: "AAPL", description: "Apple Inc." }],
  msft: [{ symbol: "MSFT", description: "Microsoft Corporation" }],
  nvda: [{ symbol: "NVDA", description: "NVIDIA Corporation" }],
  tsla: [{ symbol: "TSLA", description: "Tesla, Inc." }],
};

