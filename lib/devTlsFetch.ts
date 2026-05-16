import { Agent } from "undici";

let warned = false;
let singleton: Agent | undefined;

const tlsBypassRequested = (): boolean =>
  process.env.FINNHUB_TLS_INSECURE === "1" ||
  process.env.FINNHUB_TLS_INSECURE === "true" ||
  process.env.GEMINI_TLS_INSECURE === "1" ||
  process.env.GEMINI_TLS_INSECURE === "true";

/**
 * 로컬에서 사내 프록시 등으로 TLS 검증이 실패할 때, Finnhub·Gemini 등 외부 HTTPS 호출에만 적용.
 * 프로덕션에서는 무시된다.
 */
export const withDevTlsBypass = (init: RequestInit): RequestInit & { dispatcher?: Agent } => {
  if (process.env.NODE_ENV === "production" || !tlsBypassRequested()) {
    return init;
  }
  if (!warned) {
    console.warn(
      "[dev] FINNHUB_TLS_INSECURE 또는 GEMINI_TLS_INSECURE: 외부 fetch TLS 검증 생략(로컬 전용). 가능하면 NODE_EXTRA_CA_CERTS 사용.",
    );
    warned = true;
  }
  singleton ??= new Agent({ connect: { rejectUnauthorized: false } });
  return { ...init, dispatcher: singleton };
};
