import { NextResponse } from "next/server";

import { SAMPLE_SYMBOL_LOOKUP } from "@/data/sampleData";
import { fetchSymbolLookup, FinnhubConfigError } from "@/lib/finnhub";
import { resolveSearchQuery } from "@/lib/searchAliases";
import type { SymbolLookupDto, SymbolLookupItemDto } from "@/lib/types";

const takeTopN = <T,>(arr: readonly T[], n: number): T[] => arr.slice(0, n);

const toDto = (query: string, results: SymbolLookupItemDto[], isFallback: boolean): SymbolLookupDto => ({
  query,
  results,
  isFallback,
});

const isLikelyUsSymbol = (symbol: string): boolean => /^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const { original: query, effective } = resolveSearchQuery(raw);

  if (!query) {
    return NextResponse.json({ message: "종목 이름을 입력해주세요." }, { status: 400 });
  }

  try {
    const res = await fetchSymbolLookup(effective);
    const mapped = takeTopN(
      res.result
        .filter((r) => isLikelyUsSymbol(r.symbol))
        .map<SymbolLookupItemDto>((r) => ({ symbol: r.symbol, description: r.description }))
        .filter((r) => r.symbol && r.description),
      10,
    );
    return NextResponse.json(toDto(query, mapped, false));
  } catch (err) {
    if (err instanceof FinnhubConfigError) {
      console.error("[/api/search] FINNHUB_API_KEY가 없습니다. .env.local을 설정해주세요.");
    } else {
      console.error("[/api/search] Finnhub 요청 실패:", err);
    }

    const fallback =
      SAMPLE_SYMBOL_LOOKUP[query.toLowerCase()] ??
      SAMPLE_SYMBOL_LOOKUP[effective.toLowerCase()] ??
      [];
    return NextResponse.json(toDto(query, fallback, true));
  }
}

