import { NextResponse } from "next/server";

import type { NewsSummaryDto, NewsSummaryRequestDto } from "@/lib/types";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

const getApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return key;
};

const clamp500 = (s: string): string => (s.length <= 500 ? s : s.slice(0, 500));

const latinLetterRatio = (s: string): number => {
  const letters = s.replace(/\s+/g, "");
  if (!letters) return 0;
  const latin = letters.replace(/[^A-Za-z]/g, "").length;
  return latin / letters.length;
};

const normalizeBulletLines = (raw: string): string => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines
    .map((l) => {
      const m = l.match(/^[-*•·]\s*(.+)$/);
      return m?.[1]?.trim() ?? "";
    })
    .filter(Boolean)
    .map((t) => `- ${t}`);

  return bullets.join("\n");
};

const isAcceptableKoSummary = (s: string): boolean => {
  if (!s) return false;
  if (latinLetterRatio(s) > 0.25) return false;
  const lines = s.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return false;
  return lines.every((l) => /^-\s+/.test(l.trim()));
};

const toText = (data: unknown): string => {
  if (!data || typeof data !== "object") return "";
  const candidate = (data as { candidates?: unknown[] }).candidates?.[0] as
    | { content?: { parts?: Array<{ text?: string }> } }
    | undefined;
  const parts = candidate?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
};

const refineToKoBullets = async (params: {
  apiKey: string;
  model: string;
  title: string;
  url: string;
  draft: string;
}): Promise<string> => {
  const prompt = [
    "너는 뉴스 요약 편집기다.",
    "아래 초안은 형식이 잘못되었을 수 있다. 반드시 한국어로만, 평서체로, 개조식(각 줄은 '- '로 시작)으로 다시 작성해라.",
    "",
    "절대 금지:",
    "- 영어 문장",
    "- 모델의 사고과정/도구 사용 설명(예: Google Search, URL, API endpoint 등)",
    "- 인사말/서론/결론/질문",
    "",
    "출력 형식(엄격):",
    "- 첫 줄부터 마지막 줄까지 모두 '- '로 시작",
    "- 빈 줄 금지",
    "- 3~6개 불릿",
    "- 총 길이 500자 이내(공백 포함)",
    "",
    `제목: ${params.title}`,
    `링크: ${params.url}`,
    "",
    "초안:",
    params.draft,
  ].join("\n");

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  };

  const res = await fetch(GEMINI_ENDPOINT(params.model), {
    method: "POST",
    headers: {
      "x-goog-api-key": params.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini 정제 요청 실패: ${res.status} ${text}`);
  }

  const json = (await res.json()) as unknown;
  return normalizeBulletLines(toText(json).trim());
};

export async function POST(req: Request) {
  const apiKey = (() => {
    try {
      return getApiKey();
    } catch {
      return null;
    }
  })();

  if (!apiKey) {
    return NextResponse.json(
      { message: "GEMINI_API_KEY가 없습니다. .env.local을 설정해주세요." },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => null)) as NewsSummaryRequestDto | null;
  const url = body?.url?.trim() ?? "";
  const title = body?.title?.trim() ?? "";

  if (!url || !title) {
    return NextResponse.json({ message: "url과 title이 필요합니다." }, { status: 400 });
  }

  const model = "gemini-2.5-flash-lite";

  const prompt = [
    "너는 뉴스 기사 요약 전문가다. 아래 제목/링크의 기사 내용을 바탕으로 요약해라.",
    "내부적으로 URL 본문을 읽거나(가능하면) Google Search로 보완해도 좋다. 하지만 사용자에게 그 과정을 설명하지 마라.",
    "",
    `제목: ${title}`,
    `링크: ${url}`,
    "",
    "출력 형식(엄격):",
    "- 한국어만 사용",
    "- 평서체",
    "- 개조식: 각 줄은 반드시 '- '로 시작",
    "- 빈 줄 금지",
    "- 3~6개 불릿",
    "- 총 길이 500자 이내(공백 포함)",
    "",
    "내용 규칙:",
    "- 확인된 사실만",
    "- 추측/과장 금지",
    "- 동일 기사 여부가 불확실하면, 불확실성을 한 불릿으로 짧게 명시",
    "",
    "절대 금지:",
    "- 영어",
    "- 도구/검색/URL/절차에 대한 설명",
    "- 인사말/서론/결론/질문",
  ].join("\n");

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ url_context: {} }, { google_search: {} }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 768,
    },
  };

  try {
    const res = await fetch(GEMINI_ENDPOINT(model), {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { message: `Gemini 요청 실패: ${res.status} ${text}` },
        { status: 502 },
      );
    }

    const json = (await res.json()) as unknown;
    const draft = normalizeBulletLines(toText(json).trim());
    let summary = clamp500(draft);

    if (!isAcceptableKoSummary(summary)) {
      try {
        summary = clamp500(
          await refineToKoBullets({ apiKey, model, title, url, draft: toText(json).trim() }),
        );
      } catch {
        // ignore; fall back to best-effort draft
        summary = clamp500(draft);
      }
    }

    const dto: NewsSummaryDto = {
      url,
      title,
      summaryKo: summary || "요약을 생성하지 못했습니다.",
    };

    return NextResponse.json(dto);
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "요약 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}

