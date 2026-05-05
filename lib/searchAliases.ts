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

