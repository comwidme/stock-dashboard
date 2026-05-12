# 개발 기록 요약 (핵심만)

이 문서는 이후 작업·온보딩 시 빠르게 맥락을 잡기 위한 **요약**이다. 상세 규약은 `README.md`, 릴리즈 자동화는 `docs/RELEASE_PLEASE.md`를 참고한다.

---

## 제품 동작 (사용자 플로우)

1. **종목 이름**으로 검색 → `/api/search` (Finnhub `search` + 한글 별칭 보정 `lib/searchAliases.ts`).
2. 검색 결과에서 **티커 선택** → **[조회하기]**.
3. **주가** `/api/stock`, **최근 뉴스(최대 5개, 최근 30일)** `/api/news` 병렬 조회.
4. 주가는 **카드**(`StockPriceCard`), 뉴스는 **리스트**(`NewsList`).
5. 각 뉴스에 **[AI요약]** → `POST /api/summary` (Gemini, 서버만 키 사용).

---

## 외부 API·환경변수

| 변수 | 용도 |
|------|------|
| `FINNHUB_API_KEY` | 주가·뉴스·티커 검색 (서버 Route Handler만 호출) |
| `FINNHUB_TLS_INSECURE` | (선택, **로컬만**) `1`이면 Finnhub 호출 시 TLS 검증 생략. 사내 프록시 등으로 `unable to verify certificate`가 날 때. **프로덕션에서는 사용 금지.** |
| `GEMINI_API_KEY` | 뉴스 AI 요약 (`/api/summary`) |

- `.env.local`에 두고 **커밋하지 않음** (`.gitignore`에 `.env*`).
- Finnhub 실패 시 **샘플 주가·뉴스**로 fallback (`data/sampleData.ts`). 샘플 뉴스 링크는 실제 도메인으로 유지.
- **권장**: TLS 문제는 `FINNHUB_TLS_INSECURE` 대신 `NODE_EXTRA_CA_CERTS`에 기업 루트 인증서를 지정하는 편이 안전하다.

---

## AI 요약 (`app/api/summary/route.ts`)

- **모델**: `gemini-2.5-flash-lite`.
- **도구**: `url_context`(기사 URL 본문) + `google_search`(접근 불가 시 보완).
- **출력**: 한국어, **500자 이내**, **`- ` 개조식**, 평서체. 형식이 어긋나면 **정제용 2차 호출**(도구 없음).
- **샘플 뉴스**(`NewsList`의 `isFallback`): AI 요약 버튼 **비활성화**.

---

## 프론트·테스트

- `StockSearchForm`: 검색 → 라디오 선택 → 조회.
- `vitest.config.ts`: `@/` → 프로젝트 루트 **alias** (테스트에서 `@/lib/...` 해석).
- `vitest.setup.ts`: 매 테스트 후 `cleanup` + `vi.unstubAllGlobals()` 등 정리.

---

## 릴리즈·기록 자동화 (GitHub)

- **release-please** (manifest): `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml`.
- 트리거 브랜치: **`main`** (`workflow_dispatch` 지원).
- 저장소 **Workflow permissions**: Read/Write + **Actions가 PR 생성 허용** 필요 (release-please 릴리즈 PR용).
- **릴리즈 PR·태그·CHANGELOG 자동 채움**은 주로 **`feat:` / `fix:`** 등 Conventional Commits가 쌓일 때부터 두드러짐 (`chore`/`ci`만이면 릴리즈 PR이 안 열릴 수 있음).

---

## 운영 시 유의

- **SSL**: 일부 환경에서 `git push`가 인증서 오류로 실패할 수 있음 → 기업 CA, `schannel`, 또는 SSH 원격 권장.
- **API 키**: 채팅·PR 본문에 노출하지 말 것. 유출 시 **즉시 재발급**.

---

## 주요 경로 (코드 탐색용)

| 영역 | 경로 |
|------|------|
| 메인 페이지 | `app/page.tsx` |
| 검색 API | `app/api/search/route.ts` |
| 주가 / 뉴스 / 요약 API | `app/api/stock`, `news`, `summary` |
| Finnhub 클라이언트 | `lib/finnhub.ts` |
| 한글 검색 별칭 | `lib/searchAliases.ts` |
| 타입 DTO | `lib/types.ts` |

---

*이 문서는 특정 시점까지의 기능을 요약한 것이며, 이후 변경 시 함께 갱신하는 것이 좋다.*
