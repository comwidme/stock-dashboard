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

  const hasResults = Boolean(quote || news);

  return (
    <>
      <header className="bg-[var(--apple-canvas)]">
        <div className="mx-auto max-w-[980px] px-6 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
          <h1 className="text-hero-display text-[var(--apple-ink)]">주가와 뉴스를 한곳에서.</h1>
          <p className="text-lead mt-4 max-w-xl">
            미국 주식 티커를 검색하면 실시간 시세와 최근 기업 뉴스를 확인할 수 있습니다. AI 요약으로
            기사 핵심만 빠르게 읽어보세요.
          </p>
          <p className="text-fine-print mt-3">투자 자문이 아닌 학습용 예제입니다.</p>
        </div>
      </header>

      <div className="sub-nav-frosted sticky top-11 z-40">
        <div className="mx-auto flex h-[52px] max-w-[980px] items-center justify-between px-6 sm:px-8">
          <span className="text-tagline text-[var(--apple-ink)]">
            {symbol ? symbol : "종목 선택"}
          </span>
          {hasResults ? (
            <span className="text-caption text-[var(--apple-body-muted)]">조회됨</span>
          ) : (
            <span className="text-caption text-[var(--apple-body-muted)]">검색 후 조회</span>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[980px] flex-1 space-y-8 px-6 py-10 sm:px-8">
        <StockSearchForm initialSymbol={symbol} onSubmit={onSubmit} disabled={loading} />

        {errorMessage ? (
          <div className="banner-error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="banner-info" aria-live="polite">
            <span className="text-caption-strong text-[var(--apple-ink)]">불러오는 중…</span>
            <span className="mt-1 block text-caption text-[var(--apple-body-muted)]">
              주가와 뉴스를 가져오고 있습니다.
            </span>
          </div>
        ) : null}

        {fallbackHint ? (
          <div className="banner-warn" role="status">
            {fallbackHint}
          </div>
        ) : null}

        {hasResults ? (
          <section
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            aria-label="조회 결과"
          >
            {quote ? <StockPriceCard data={quote} /> : null}
            {news ? <NewsList items={news.news} isFallback={news.isFallback} /> : null}
          </section>
        ) : (
          <section className="card-utility text-center">
            <p className="text-tagline text-[var(--apple-ink)]">시작하기</p>
            <p className="text-lead mx-auto mt-2 max-w-md">
              위에서 Apple, Microsoft 같은 종목 이름을 검색한 뒤 티커를 선택하고 조회하세요.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
