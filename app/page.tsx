"use client";

import { useCallback, useMemo, useState } from "react";

import NewsList from "@/components/NewsList";
import StockPriceCard from "@/components/StockPriceCard";
import StockSearchForm from "@/components/StockSearchForm";
import { normalizeSymbol } from "@/lib/format";
import type { CompanyNewsDto, StockQuoteDto } from "@/lib/types";

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [quote, setQuote] = useState<StockQuoteDto | null>(null);
  const [news, setNews] = useState<CompanyNewsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchJson = useCallback(async <T,>(url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `요청에 실패했습니다. (${res.status})`);
    }
    return (await res.json()) as T;
  }, []);

  const onSubmit = useCallback(
    async (raw: string) => {
      const normalized = normalizeSymbol(raw);
      setErrorMessage(null);

      if (!normalized) {
        setErrorMessage("티커를 입력해주세요.");
        return;
      }

      setSymbol(normalized);
      setLoading(true);

      try {
        const [q, n] = await Promise.all([
          fetchJson<StockQuoteDto>(`/api/stock?symbol=${encodeURIComponent(normalized)}`),
          fetchJson<CompanyNewsDto>(`/api/news?symbol=${encodeURIComponent(normalized)}`),
        ]);

        setQuote(q);
        setNews(n);
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : "네트워크 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
      }
    },
    [fetchJson],
  );

  const fallbackHint = useMemo(() => {
    if (!quote && !news) return null;
    const isFallback = Boolean(quote?.isFallback) || Boolean(news?.isFallback);
    return isFallback
      ? "Finnhub API 호출에 실패해 샘플 데이터를 표시 중입니다."
      : null;
  }, [quote, news]);

  return (
    <div className="flex-1">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Stock Dashboard (학습용)
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            미국 주식 티커를 입력하면 주가 정보와 최근 기업 뉴스를 조회해 보여줍니다.
            (투자 자문 아님)
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <StockSearchForm initialSymbol={symbol} onSubmit={onSubmit} disabled={loading} />

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            불러오는 중...
          </div>
        ) : null}

        {fallbackHint ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {fallbackHint}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {quote ? <StockPriceCard data={quote} /> : null}
          {news ? <NewsList items={news.news} isFallback={news.isFallback} /> : null}
        </div>
      </main>

      <footer className="mt-8 border-t border-black/5 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-zinc-600 sm:px-6">
          본 서비스는 학습용 예제이며 투자 자문을 제공하지 않습니다.
        </div>
      </footer>
    </div>
  );
}
