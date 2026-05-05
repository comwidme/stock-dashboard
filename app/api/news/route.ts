import { NextResponse } from "next/server";

import { SAMPLE_NEWS } from "@/data/sampleData";
import { normalizeSymbol } from "@/lib/format";
import { fetchCompanyNews, FinnhubConfigError } from "@/lib/finnhub";
import type { CompanyNewsDto, CompanyNewsItemDto } from "@/lib/types";

const toYmd = (d: Date): string => d.toISOString().slice(0, 10);

const takeTopN = <T,>(arr: readonly T[], n: number): T[] => arr.slice(0, n);

const toDto = (symbol: string, news: CompanyNewsItemDto[], isFallback: boolean): CompanyNewsDto => ({
  symbol,
  news,
  isFallback,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbol") ?? "";
  const symbol = normalizeSymbol(raw);

  if (!symbol) {
    return NextResponse.json({ message: "티커를 입력해주세요." }, { status: 400 });
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);

  try {
    const items = await fetchCompanyNews(symbol, toYmd(from), toYmd(to));
    const mapped: CompanyNewsItemDto[] = takeTopN(items, 5).map((n) => ({
      headline: n.headline,
      source: n.source,
      datetime: n.datetime,
      url: n.url,
    }));

    return NextResponse.json(toDto(symbol, mapped, false));
  } catch (err) {
    if (err instanceof FinnhubConfigError) {
      console.error("[/api/news] FINNHUB_API_KEY가 없습니다. .env.local을 설정해주세요.");
    } else {
      console.error("[/api/news] Finnhub 요청 실패:", err);
    }

    const fallback = takeTopN(SAMPLE_NEWS[symbol] ?? [], 5);
    return NextResponse.json(toDto(symbol, fallback, true));
  }
}

