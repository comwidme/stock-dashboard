/** Gemini generateContent 응답에서 텍스트·URL context 상태 추출 */

export const toGeminiText = (data: unknown): string => {
  if (!data || typeof data !== "object") return "";
  const candidate = (data as { candidates?: unknown[] }).candidates?.[0] as
    | { content?: { parts?: Array<{ text?: string }> } }
    | undefined;
  const parts = candidate?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
};

type UrlMeta = {
  retrievedUrl?: string;
  retrieved_url?: string;
  urlRetrievalStatus?: string;
  url_retrieval_status?: string;
};

const getUrlMetadata = (data: unknown): UrlMeta[] | null => {
  const c = (data as { candidates?: unknown[] }).candidates?.[0] as Record<string, unknown> | undefined;
  if (!c) return null;
  const meta =
    (c.urlContextMetadata as { urlMetadata?: UrlMeta[]; url_metadata?: UrlMeta[] } | undefined) ??
    (c.url_context_metadata as { urlMetadata?: UrlMeta[]; url_metadata?: UrlMeta[] } | undefined);
  if (!meta) return null;
  return meta.urlMetadata ?? meta.url_metadata ?? null;
};

/** 대상 URL에 대한 가져오기가 실패(비성공 상태)로 보고되면 true */
export const urlContextFailedForTarget = (data: unknown, targetUrl: string): boolean => {
  const list = getUrlMetadata(data);
  if (!list?.length) return false;
  const norm = targetUrl.trim();
  for (const u of list) {
    const retrieved = (u.retrievedUrl ?? u.retrieved_url ?? "").trim();
    const status = (u.urlRetrievalStatus ?? u.url_retrieval_status ?? "").trim();
    if (!retrieved || !status) continue;
    const match =
      retrieved === norm || retrieved.startsWith(norm) || norm.startsWith(retrieved.split("?")[0] ?? "");
    if (!match) continue;
    if (status !== "URL_RETRIEVAL_STATUS_SUCCESS") return true;
  }
  return false;
};
