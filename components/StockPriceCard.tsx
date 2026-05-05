"use client";

import type { StockQuoteDto } from "@/lib/types";
import { formatNumber2, formatPercent2 } from "@/lib/format";

type Props = {
  data: StockQuoteDto;
};

const Badge = ({ children }: { children: string }) => (
  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
    {children}
  </span>
);

export default function StockPriceCard({ data }: Props) {
  const isUp = data.change > 0;
  const isDown = data.change < 0;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{data.symbol}</h2>
          <p className="mt-1 text-sm text-zinc-600">주가 정보 (학습용)</p>
        </div>
        {data.isFallback ? <Badge>샘플 데이터</Badge> : <Badge>실시간</Badge>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-600">현재가</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {formatNumber2(data.currentPrice)}
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-600">전일 종가</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber2(data.previousClose)}
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-600">전일 대비</div>
          <div
            className={[
              "mt-1 text-xl font-semibold tabular-nums",
              isUp ? "text-emerald-700" : "",
              isDown ? "text-rose-700" : "",
            ].join(" ")}
          >
            {formatNumber2(data.change)} ({formatPercent2(data.changePercent)})
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-600">고가</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber2(data.high)}
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4">
          <div className="text-xs font-medium text-zinc-600">저가</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber2(data.low)}
          </div>
        </div>
      </div>
    </section>
  );
}

