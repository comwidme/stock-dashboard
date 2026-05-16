"use client";

import { useCallback, useMemo, useState } from "react";

import { parseApiErrorMessage } from "@/lib/parseApiError";

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
      throw new Error(parseApiErrorMessage(text || `요청에 실패했습니다. (${res.status})`));
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
      setMessage(
        e instanceof Error ? e.message : "검색 중 오류가 발생했습니다.",
      );
    } finally {
      setSearching(false);
    }
  }, [fetchJson, query, selectedSymbol]);

  const examples = useMemo(
    () => ["Apple", "Microsoft", "NVIDIA", "Tesla"] as const,
    [],
  );

  return (
    <section className="card-utility" aria-labelledby="search-heading">
      <h2 id="search-heading" className="text-tagline text-[var(--apple-ink)]">
        종목 검색
      </h2>
      <p className="text-caption mt-2 text-[var(--apple-body-muted)]">
        종목 이름으로 티커를 찾은 뒤 선택하고 조회하세요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((name) => (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => {
              setQuery(name);
              setMessage(null);
            }}
            className="btn-pearl min-h-0 py-2 text-[13px]"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
            className="input-search"
            disabled={disabled}
          />
        </label>

        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={!canSearch}
          className="btn-secondary-pill shrink-0 sm:min-w-[100px]"
        >
          {searching ? "검색 중…" : "검색"}
        </button>
      </div>

      {message ? (
        <p className="text-caption mt-3 text-[var(--apple-ink-muted-80)]" role="status">
          {message}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-[var(--apple-radius-lg)] border border-[var(--apple-hairline)]">
          <ul className="max-h-64 divide-y divide-[var(--apple-hairline)] overflow-auto bg-[var(--apple-canvas)]">
            {results.map((r) => {
              const selected = selectedSymbol === r.symbol;
              return (
                <li key={r.symbol}>
                  <label
                    className={[
                      "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors",
                      selected ? "bg-[var(--apple-canvas-parchment)]" : "hover:bg-[var(--apple-surface-pearl)]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="symbol"
                      value={r.symbol}
                      checked={selected}
                      onChange={() => setSelectedSymbol(r.symbol)}
                      disabled={disabled}
                      className="mt-1 h-4 w-4 accent-[var(--apple-primary)]"
                    />
                    <span className="flex flex-col">
                      <span className="text-caption-strong text-[var(--apple-ink)]">
                        {r.symbol}
                      </span>
                      <span className="text-caption text-[var(--apple-body-muted)]">
                        {r.description}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end border-t border-[var(--apple-divider-soft)] pt-5">
        <button
          type="button"
          onClick={() => onSubmit(selectedSymbol)}
          disabled={!canSubmit}
          className="btn-primary w-full sm:w-auto"
        >
          조회하기
        </button>
      </div>
    </section>
  );
}
