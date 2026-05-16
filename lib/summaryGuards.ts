/** 요약 API: 메모리 캐시 + IP당 간단 레이트 리밋 (서버리스에서는 인스턴스별로만 유효) */

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_KEYS = 200;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = 30;

type CacheEntry = { summary: string; expiresAt: number };

const summaryCache = new Map<string, CacheEntry>();
const rateBuckets = new Map<string, number[]>();

export const summaryCacheKey = (url: string, title: string): string => `${url}\n${title}`;

export const getCachedSummary = (key: string): string | null => {
  const e = summaryCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    summaryCache.delete(key);
    return null;
  }
  return e.summary;
};

export const setCachedSummary = (key: string, summary: string): void => {
  if (summaryCache.size >= CACHE_MAX_KEYS) {
    const first = summaryCache.keys().next().value;
    if (first) summaryCache.delete(first);
  }
  summaryCache.set(key, { summary, expiresAt: Date.now() + CACHE_TTL_MS });
};

export const getClientIp = (req: Request): string => {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
};

/** Vitest 등에서 모듈 상태 초기화용 */
export const resetSummaryGuardsForTests = (): void => {
  summaryCache.clear();
  rateBuckets.clear();
};

export const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const prev = rateBuckets.get(ip) ?? [];
  const windowed = prev.filter((t) => now - t < RATE_WINDOW_MS);
  if (windowed.length >= RATE_MAX_PER_WINDOW) {
    rateBuckets.set(ip, windowed);
    return true;
  }
  windowed.push(now);
  rateBuckets.set(ip, windowed);
  return false;
};
