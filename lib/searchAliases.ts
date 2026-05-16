import type { SymbolLookupItemDto } from "@/lib/types";

const ALIASES: Readonly<Record<string, string>> = {
  // Korean
  테슬라: "tesla",
  애플: "apple",
  마이크로소프트: "microsoft",
  엔비디아: "nvidia",
  구글: "google",
  알파벳: "alphabet",
  아마존: "amazon",
  메타: "meta",
  넷플릭스: "netflix",
  // English common variants
  nvidia: "nvidia",
  tesla: "tesla",
  apple: "apple",
  microsoft: "microsoft",
};

const normalize = (raw: string): string => raw.trim();

export const resolveSearchQuery = (raw: string): { original: string; effective: string } => {
  const original = normalize(raw);
  if (!original) return { original: "", effective: "" };

  const key = original.toLowerCase();
  const direct = ALIASES[original] ?? ALIASES[key];
  if (direct) return { original, effective: direct };

  // If user typed Korean with spaces like "테슬라 주식", try first token.
  const firstToken = original.split(/\s+/).filter(Boolean)[0];
  if (firstToken) {
    const tokenKey = firstToken.toLowerCase();
    const tokenAlias = ALIASES[firstToken] ?? ALIASES[tokenKey];
    if (tokenAlias) return { original, effective: tokenAlias };
  }

  return { original, effective: original };
};

/** API 검색 전·후에 항상 최상단에 둘 티커 (한글/영문 쿼리 키) */
const CURATED_LOOKUP: Readonly<Record<string, readonly SymbolLookupItemDto[]>> = {
  구글: [{ symbol: "GOOGL", description: "Alphabet Inc." }],
  google: [{ symbol: "GOOGL", description: "Alphabet Inc." }],
  alphabet: [{ symbol: "GOOGL", description: "Alphabet Inc." }],
  알파벳: [{ symbol: "GOOGL", description: "Alphabet Inc." }],
};

const lookupKeysFor = (original: string, effective: string): string[] => {
  const keys = new Set<string>();
  for (const value of [original, effective]) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    keys.add(trimmed);
    keys.add(trimmed.toLowerCase());
  }
  return [...keys];
};

export const getCuratedLookup = (raw: string): SymbolLookupItemDto[] | null => {
  const { original, effective } = resolveSearchQuery(raw);
  for (const key of lookupKeysFor(original, effective)) {
    const hit = CURATED_LOOKUP[key];
    if (hit?.length) return hit.map((item) => ({ ...item }));
  }
  return null;
};

export const mergeLookupResults = (
  curated: readonly SymbolLookupItemDto[] | null,
  fromApi: readonly SymbolLookupItemDto[],
): SymbolLookupItemDto[] => {
  const seen = new Set<string>();
  const merged: SymbolLookupItemDto[] = [];

  const push = (item: SymbolLookupItemDto) => {
    if (seen.has(item.symbol)) return;
    seen.add(item.symbol);
    merged.push(item);
  };

  for (const item of curated ?? []) push(item);
  for (const item of fromApi) push(item);

  return merged;
};

