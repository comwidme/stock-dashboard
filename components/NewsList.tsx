"use client";

import { useCallback, useMemo, useState } from "react";

import type { CompanyNewsItemDto, NewsSummaryDto } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { parseApiErrorMessage } from "@/lib/parseApiError";

type Props = {
  items: CompanyNewsItemDto[];
  isFallback?: boolean;
};

const StatusChip = ({ children }: { children: string }) => (
  <span className="chip-badge">{children}</span>
);

export default function NewsList({ items, isFallback = false }: Props) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [errorByUrl, setErrorByUrl] = useState<Record<string, string | undefined>>({});
  const [summaryByUrl, setSummaryByUrl] = useState<Record<string, string | undefined>>({});
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(parseApiErrorMessage(text || `요청에 실패했습니다. (${res.status})`));
    }
    return (await res.json()) as T;
  }, []);

  const canSummarize = useMemo(() => !isFallback, [isFallback]);

  const onSummarize = useCallback(
    async (item: CompanyNewsItemDto) => {
      if (!canSummarize) return;

      const url = item.url;
      setErrorByUrl((prev) => ({ ...prev, [url]: undefined }));
      setExpandedUrl(url);

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
          [url]:
            e instanceof Error
              ? parseApiErrorMessage(e.message)
              : "요약 중 오류가 발생했습니다.",
        }));
      } finally {
        setLoadingUrl(null);
      }
    },
    [canSummarize, fetchJson, summaryByUrl],
  );

  return (
    <section className="card-utility" aria-labelledby="news-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="news-heading" className="text-display-lg text-[var(--apple-ink)]">
            최근 뉴스
          </h2>
          <p className="text-caption mt-1 text-[var(--apple-body-muted)]">최대 5개 · AI 요약 지원</p>
        </div>
        {isFallback ? <StatusChip>샘플 데이터</StatusChip> : <StatusChip>실시간</StatusChip>}
      </div>

      {items.length === 0 ? (
        <p className="text-caption mt-6 text-[var(--apple-body-muted)]">
          최근 뉴스를 찾을 수 없습니다.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {items.map((n, idx) => {
            const summary = summaryByUrl[n.url];
            const error = errorByUrl[n.url];
            const isLoading = loadingUrl === n.url;
            const isExpanded = expandedUrl === n.url && (Boolean(summary) || Boolean(error) || isLoading);

            return (
              <li
                key={`${n.url}-${idx}`}
                className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-hairline)] bg-[var(--apple-canvas)] p-5"
              >
                <article>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link text-[17px] font-semibold leading-snug"
                  >
                    {n.headline}
                  </a>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-[var(--apple-body-muted)]">
                    <span className="text-caption-strong text-[var(--apple-ink-muted-80)]">
                      {n.source}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={new Date(n.datetime * 1000).toISOString()}>
                      {formatDateTime(n.datetime)}
                    </time>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!canSummarize || isLoading}
                      onClick={() => void onSummarize(n)}
                      className="btn-primary min-h-0 py-2 text-[14px]"
                      title={
                        canSummarize
                          ? "기사 본문을 AI로 요약합니다."
                          : "샘플 데이터에서는 AI 요약을 사용할 수 없습니다."
                      }
                    >
                      {isLoading ? "요약 중…" : summary ? "요약 다시 보기" : "AI 요약"}
                    </button>
                    {!canSummarize ? (
                      <span className="text-fine-print">샘플 데이터에서는 요약 불가</span>
                    ) : null}
                  </div>

                  {error ? (
                    <p className="text-caption mt-3 text-[var(--apple-ink-muted-80)]" role="alert">
                      {error}
                    </p>
                  ) : null}

                  {isExpanded && summary ? (
                    <div className="mt-4 rounded-[var(--apple-radius-sm)] border border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)] p-4">
                      <p className="text-caption-strong mb-2 text-[var(--apple-ink)]">AI 요약</p>
                      <p className="whitespace-pre-line text-[17px] leading-[1.47] text-[var(--apple-ink)]">
                        {summary}
                      </p>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
