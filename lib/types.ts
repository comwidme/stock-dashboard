export type StockQuoteDto = {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  isFallback: boolean;
};

export type CompanyNewsItemDto = {
  headline: string;
  source: string;
  datetime: number; // unix seconds
  url: string;
};

export type CompanyNewsDto = {
  symbol: string;
  news: CompanyNewsItemDto[];
  isFallback: boolean;
};

export type SymbolLookupItemDto = {
  symbol: string;
  description: string;
};

export type SymbolLookupDto = {
  query: string;
  results: SymbolLookupItemDto[];
  isFallback: boolean;
};

