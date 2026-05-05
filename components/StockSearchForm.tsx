"use client";

import { useCallback, useMemo, useState } from "react";

type Props = {
  initialSymbol?: string;
  onSubmit: (symbol: string) => void;
  disabled?: boolean;
};

type LookupItem = { symbol: string; description: string };
type LookupResponse = { query: string; results: LookupItem[]; isFallback: boolean };

export default function StockSearchForm({
  initialSymbol = "AAPL",
  onSubmit,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LookupItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSearch = !disabled && !searching;
  const canSubmit = !disabled && Boolean(selectedSymbol);

  const fetchJson = useCallback(async <T,>(url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `요청에 실패했습니다. (${res.status})`);
    }
    return (await res.json()) as T;
  }, []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    setMessage(null);

    if (!q) {
      setMessage("종목 이름을 입력해주세요.");
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await fetchJson<LookupResponse>(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data.results);
      if (data.results.length === 0) {
        setMessage("검색 결과가 없습니다.");
      } else if (!data.results.some((r) => r.symbol === selectedSymbol)) {
        setSelectedSymbol(data.results[0]?.symbol ?? "");
      }
    } catch (e) {
      setResults([]);
      setMessage(e instanceof Error ? e.message : "검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  }, [fetchJson, query, selectedSymbol]);

  const examplesText = useMemo(() => "Apple, Microsoft, NVIDIA, Tesla", []);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">종목 검색</h2>
      <p className="mt-1 text-sm text-zinc-600">
        종목 이름으로 티커를 찾은 뒤 선택하고 조회하세요. 예시:{" "}
        <span className="font-medium text-zinc-800">{examplesText}</span>
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">미국 주식 종목 이름</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canSearch) void runSearch();
              }
            }}
            placeholder="예: Apple"
            inputMode="text"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none ring-0 placeholder:text-zinc-400 focus:border-black/25 focus:outline-none"
            disabled={disabled}
          />
        </label>

        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={!canSearch}
          className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {searching ? "검색 중..." : "검색"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-rose-700" role="status">
          {message}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-4 rounded-xl border border-black/10">
          <ul className="max-h-64 divide-y divide-black/10 overflow-auto">
            {results.map((r) => (
              <li key={r.symbol} className="px-4 py-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="symbol"
                    value={r.symbol}
                    checked={selectedSymbol === r.symbol}
                    onChange={() => setSelectedSymbol(r.symbol)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900">{r.symbol}</span>
                    <span className="text-xs text-zinc-600">{r.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onSubmit(selectedSymbol)}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-base font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          조회하기
        </button>
      </div>
    </section>
  );
}

