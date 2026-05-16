"use client";

import type { StockQuoteDto } from "@/lib/types";
import { formatNumber2, formatPercent2 } from "@/lib/format";

type Props = {
  data: StockQuoteDto;
};

const StatusChip = ({ children }: { children: string }) => (
  <span className="chip-badge">{children}</span>
);

export default function StockPriceCard({ data }: Props) {
  const isUp = data.change > 0;
  const isDown = data.change < 0;

  const changeClass = isUp
    ? "text-[var(--apple-ink)]"
    : isDown
      ? "text-[var(--apple-ink-muted-48)]"
      : "text-[var(--apple-ink-muted-80)]";

  return (
    <section className="card-utility" aria-labelledby={`quote-${data.symbol}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`quote-${data.symbol}`} className="text-display-lg text-[var(--apple-ink)]">
            {data.symbol}
          </h2>
          <p className="text-caption mt-1 text-[var(--apple-body-muted)]">주가 정보</p>
        </div>
        {data.isFallback ? <StatusChip>샘플 데이터</StatusChip> : <StatusChip>실시간</StatusChip>}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-cell col-span-2 sm:col-span-1">
          <p className="text-caption text-[var(--apple-body-muted)]">현재가</p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight text-[var(--apple-ink)]">
            {formatNumber2(data.currentPrice)}
          </p>
        </div>

        <div className="stat-cell">
          <p className="text-caption text-[var(--apple-body-muted)]">전일 종가</p>
          <p className="mt-1 text-[21px] font-semibold tabular-nums text-[var(--apple-ink)]">
            {formatNumber2(data.previousClose)}
          </p>
        </div>

        <div className="stat-cell">
          <p className="text-caption text-[var(--apple-body-muted)]">전일 대비</p>
          <p className={["mt-1 text-[21px] font-semibold tabular-nums", changeClass].join(" ")}>
            {isUp ? "+" : ""}
            {formatNumber2(data.change)} ({formatPercent2(data.changePercent)})
          </p>
        </div>

        <div className="stat-cell">
          <p className="text-caption text-[var(--apple-body-muted)]">고가</p>
          <p className="mt-1 text-[21px] font-semibold tabular-nums text-[var(--apple-ink)]">
            {formatNumber2(data.high)}
          </p>
        </div>

        <div className="stat-cell">
          <p className="text-caption text-[var(--apple-body-muted)]">저가</p>
          <p className="mt-1 text-[21px] font-semibold tabular-nums text-[var(--apple-ink)]">
            {formatNumber2(data.low)}
          </p>
        </div>
      </div>
    </section>
  );
}
