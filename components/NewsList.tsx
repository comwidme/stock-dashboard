"use client";

import type { CompanyNewsItemDto } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

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
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

