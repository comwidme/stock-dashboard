"use client";

import { useCallback, useMemo, useState } from "react";

import type { CompanyNewsItemDto } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import type { NewsSummaryDto } from "@/lib/types";

type Props = {
  items: CompanyNewsItemDto[];
  isFallback?: boolean;
};

const Badge = ({ children }: { children: string }) => (
  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
    {children}
  </span>
);

export default function NewsList({ items, isFallback = false }: Props) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [errorByUrl, setErrorByUrl] = useState<Record<string, string | undefined>>({});
  const [summaryByUrl, setSummaryByUrl] = useState<Record<string, string | undefined>>({});

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `요청에 실패했습니다. (${res.status})`);
    }
    return (await res.json()) as T;
  }, []);

  const canSummarize = useMemo(() => !isFallback, [isFallback]);

  const onSummarize = useCallback(
    async (item: CompanyNewsItemDto) => {
      if (!canSummarize) return;

      const url = item.url;
      setErrorByUrl((prev) => ({ ...prev, [url]: undefined }));

      if (summaryByUrl[url]) return;

      setLoadingUrl(url);
      try {
        const dto = await fetchJson<NewsSummaryDto>("/api/summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: item.url, title: item.headline }),
        });
        setSummaryByUrl((prev) => ({ ...prev, [url]: dto.summaryKo }));
      } catch (e) {
        setErrorByUrl((prev) => ({
          ...prev,
          [url]: e instanceof Error ? e.message : "요약 중 오류가 발생했습니다.",
        }));
      } finally {
        setLoadingUrl(null);
      }
    },
    [canSummarize, fetchJson, summaryByUrl],
  );

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">최근 뉴스</h2>
          <p className="mt-1 text-sm text-zinc-600">최대 5개</p>
        </div>
        {isFallback ? <Badge>샘플 데이터</Badge> : <Badge>실시간</Badge>}
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-600">최근 뉴스를 찾을 수 없습니다.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {items.map((n, idx) => (
            <li key={`${n.url}-${idx}`} className="rounded-xl border border-black/10 p-4">
              <div className="flex flex-col gap-1">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold leading-snug text-zinc-900 hover:underline"
                >
                  {n.headline}
                </a>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-600">
                  <span className="font-medium text-zinc-700">{n.source}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={new Date(n.datetime * 1000).toISOString()}>
                    {formatDateTime(n.datetime)}
                  </time>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canSummarize || loadingUrl === n.url}
                    onClick={() => void onSummarize(n)}
                    className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      canSummarize
                        ? "기사 본문을 AI로 요약합니다."
                        : "샘플 데이터에서는 AI 요약을 사용할 수 없습니다."
                    }
                  >
                    {loadingUrl === n.url ? "요약 중..." : "AI요약"}
                  </button>
                  {errorByUrl[n.url] ? (
                    <span className="text-xs text-rose-700">{errorByUrl[n.url]}</span>
                  ) : null}
                </div>

                {summaryByUrl[n.url] ? (
                  <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800">
                    <p className="whitespace-pre-line">{summaryByUrl[n.url]}</p>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

