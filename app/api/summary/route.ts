import { NextResponse } from "next/server";

import { withDevTlsBypass } from "@/lib/devTlsFetch";
import type { NewsSummaryDto, NewsSummaryRequestDto } from "@/lib/types";
import {
  clampBulletsUnderMaxChars,
  isAcceptableKoSummary,
  normalizeBulletLines,
} from "@/lib/summaryFormat";
import { getCachedSummary, getClientIp, isRateLimited, setCachedSummary, summaryCacheKey } from "@/lib/summaryGuards";
import { toGeminiText, urlContextFailedForTarget } from "@/lib/summaryGeminiResponse";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

const MODEL = "gemini-2.5-flash-lite";
const MAX_SUMMARY_CHARS = 500;

const getApiKey = (): string => {
  const raw = process.env.GEMINI_API_KEY;
  const key = typeof raw === "string" ? raw.trim().replace(/^["']|["']$/g, "") : "";
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return key;
};

const buildPromptPass1 = (title: string, url: string): string =>
  [
    "너는 뉴스 기사 요약 전문가다. 제공된 URL의 본문만 근거로 요약하라.",
    "본문을 충분히 읽을 수 없거나 근거가 부족하면 추측하지 말고, '원문 확인이 어렵다'는 뜻을 한 불릿으로만 짧게 적어라.",
    "사용자에게 URL 가져오기 과정을 설명하지 마라.",
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
    `- 총 길이 ${MAX_SUMMARY_CHARS}자 이내(공백 포함)`,
    "",
    "내용 규칙:",
    "- 확인된 사실만",
    "- 추측/과장 금지",
    "",
    "절대 금지:",
    "- 영어",
    "- 도구/절차 설명",
    "- 인사말/서론/결론/질문",
  ].join("\n");

const buildPromptPass2 = (title: string, url: string): string =>
  [
    "너는 뉴스 기사 요약 전문가다. Google Search로 아래 제목·링크와 같은 주제의 신뢰할 만한 최신 기사를 찾아 요약하라.",
    "원문 링크와 다른 기사를 근거로 썼다면, 그 사실을 한 불릿으로 명시하라.",
    "검색·도구 사용 과정을 사용자에게 설명하지 마라.",
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
    `- 총 길이 ${MAX_SUMMARY_CHARS}자 이내(공백 포함)`,
    "",
    "내용 규칙:",
    "- 확인된 사실만",
    "- 추측/과장 금지",
    "",
    "절대 금지:",
    "- 영어",
    "- 도구/절차 설명",
    "- 인사말/서론/결론/질문",
  ].join("\n");

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
    "- 모델의 사고과정/도구 사용 설명",
    "- 인사말/서론/결론/질문",
    "",
    "출력 형식(엄격):",
    "- 첫 줄부터 마지막 줄까지 모두 '- '로 시작",
    "- 빈 줄 금지",
    "- 3~6개 불릿",
    `- 총 길이 ${MAX_SUMMARY_CHARS}자 이내(공백 포함)`,
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

  const res = await fetch(
    GEMINI_ENDPOINT(params.model),
    withDevTlsBypass({
      method: "POST",
      headers: {
        "x-goog-api-key": params.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini 정제 요청 실패: ${res.status} ${text}`);
  }

  const json = (await res.json()) as unknown;
  return normalizeBulletLines(toGeminiText(json).trim());
};

const callGemini = async (params: {
  apiKey: string;
  model: string;
  prompt: string;
  tools: Array<Record<string, unknown>>;
  maxOutputTokens: number;
}): Promise<{ ok: boolean; status: number; json: unknown; text: string }> => {
  const payload = {
    contents: [{ parts: [{ text: params.prompt }] }],
    tools: params.tools,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: params.maxOutputTokens,
    },
  };

  const res = await fetch(
    GEMINI_ENDPOINT(params.model),
    withDevTlsBypass({
      method: "POST",
      headers: {
        "x-goog-api-key": params.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }),
  );

  const json = (await res.json().catch(() => null)) as unknown;
  const text = toGeminiText(json).trim();
  return { ok: res.ok, status: res.status, json, text };
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

  const cacheKey = summaryCacheKey(url, title);
  const cached = getCachedSummary(cacheKey);
  if (cached) {
    const dto: NewsSummaryDto = { url, title, summaryKo: cached };
    return NextResponse.json(dto);
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ message: "요약 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  try {
    const pass1 = await callGemini({
      apiKey,
      model: MODEL,
      prompt: buildPromptPass1(title, url),
      tools: [{ url_context: {} }],
      maxOutputTokens: 768,
    });

    if (!pass1.ok) {
      const detail = typeof pass1.json === "object" ? JSON.stringify(pass1.json) : "";
      return NextResponse.json(
        { message: `Gemini 요청 실패: ${pass1.status} ${detail}`.slice(0, 2000) },
        { status: 502 },
      );
    }

    const urlFail = urlContextFailedForTarget(pass1.json, url);
    const draft1 = normalizeBulletLines(pass1.text);
    let work = clampBulletsUnderMaxChars(draft1, MAX_SUMMARY_CHARS);
    let acceptable = isAcceptableKoSummary(work);
    let lastRawForRefine = pass1.text;
    let jsonForBlock = pass1.json;

    const needSearch = urlFail || !acceptable || !pass1.text;

    if (needSearch) {
      const pass2 = await callGemini({
        apiKey,
        model: MODEL,
        prompt: buildPromptPass2(title, url),
        tools: [{ google_search: {} }],
        maxOutputTokens: 768,
      });

      if (pass2.ok) {
        lastRawForRefine = pass2.text;
        jsonForBlock = pass2.json;
        const draft2 = normalizeBulletLines(pass2.text);
        work = clampBulletsUnderMaxChars(draft2, MAX_SUMMARY_CHARS);
        acceptable = isAcceptableKoSummary(work);
      }
    }

    if (!acceptable) {
      try {
        work = clampBulletsUnderMaxChars(
          await refineToKoBullets({
            apiKey,
            model: MODEL,
            title,
            url,
            draft: lastRawForRefine || pass1.text,
          }),
          MAX_SUMMARY_CHARS,
        );
        acceptable = isAcceptableKoSummary(work);
      } catch {
        work = clampBulletsUnderMaxChars(normalizeBulletLines(lastRawForRefine), MAX_SUMMARY_CHARS);
      }
    }

    const blockReason = (jsonForBlock as { promptFeedback?: { blockReason?: string } } | null)
      ?.promptFeedback?.blockReason;
    const summaryKo =
      work ||
      (blockReason ? `요약을 생성할 수 없습니다. (${blockReason})` : "요약을 생성하지 못했습니다.");

    const dto: NewsSummaryDto = { url, title, summaryKo };
    setCachedSummary(cacheKey, summaryKo);
    return NextResponse.json(dto);
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? `: ${e.cause.message}` : "";
    const message =
      e instanceof Error ? `${e.message}${cause}` : "요약 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
