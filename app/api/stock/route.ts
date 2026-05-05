import { NextResponse } from "next/server";

import { SAMPLE_QUOTES } from "@/data/sampleData";
import { normalizeSymbol, round2 } from "@/lib/format";
import { fetchQuote, FinnhubConfigError } from "@/lib/finnhub";
import type { StockQuoteDto } from "@/lib/types";

const buildDto = (symbol: string, seed: { c: number; pc: number; h: number; l: number }, isFallback: boolean): StockQuoteDto => {
  const currentPrice = seed.c;
  const previousClose = seed.pc;
  const change = currentPrice - previousClose;
  const changePercent = previousClose === 0 ? 0 : (change / previousClose) * 100;

  return {
    symbol,
    currentPrice: round2(currentPrice),
    previousClose: round2(previousClose),
    change: round2(change),
    changePercent: round2(changePercent),
    high: round2(seed.h),
    low: round2(seed.l),
    isFallback,
  };
};

const isLikelyInvalidQuote = (q: { c: number; pc: number; h: number; l: number }): boolean =>
  [q.c, q.pc, q.h, q.l].every((n) => !Number.isFinite(n) || n <= 0);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbol") ?? "";
  const symbol = normalizeSymbol(raw);

  if (!symbol) {
    return NextResponse.json({ message: "티커를 입력해주세요." }, { status: 400 });
  }

  try {
    const q = await fetchQuote(symbol);

    if (isLikelyInvalidQuote(q)) {
      return NextResponse.json({ message: "잘못된 티커입니다." }, { status: 404 });
    }

    const dto = buildDto(symbol, q, false);
    return NextResponse.json(dto);
  } catch (err) {
    if (err instanceof FinnhubConfigError) {
      console.error("[/api/stock] FINNHUB_API_KEY가 없습니다. .env.local을 설정해주세요.");
    } else {
      console.error("[/api/stock] Finnhub 요청 실패:", err);
    }

    const seed = SAMPLE_QUOTES[symbol] ?? SAMPLE_QUOTES.AAPL;
    const dto = buildDto(
      symbol,
      { c: seed.currentPrice, pc: seed.previousClose, h: seed.high, l: seed.low },
      true,
    );
    return NextResponse.json(dto);
  }
}

