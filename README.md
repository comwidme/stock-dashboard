# stock-dashboard (학습용)

미국 주식 **티커(symbol)** 를 입력하면 Finnhub API를 통해 **주가 정보**와 **최근 기업 뉴스**를 조회해 보여주는 초급자용 Next.js 실습 프로젝트입니다.

> 본 서비스는 학습용 예제이며 투자 자문을 제공하지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 을 열어 확인합니다.

## `.env.local` 설정 방법

1) `.env.example`을 참고해 프로젝트 루트에 `.env.local` 파일을 만듭니다.

```bash
FINNHUB_API_KEY=발급받은_API_KEY
```

2) 서버를 재시작합니다.

> 주의: API Key는 **클라이언트 코드에 노출하면 안 됩니다.** 이 프로젝트는 Finnhub 호출을 **서버 API Route에서만** 수행합니다.

## 사용 예시 티커

- AAPL
- MSFT
- NVDA
- TSLA

## 주요 기능

- 티커 입력 폼 + 예시 티커 안내
- `[조회하기]` 클릭 시 내부 API 호출
  - `/api/stock?symbol=AAPL`: 주가(현재가/전일종가/전일대비/등락률/고가/저가)
  - `/api/news?symbol=AAPL`: 최근 뉴스 최대 5개
- 로딩 상태 표시
- 빈 입력/잘못된 티커/네트워크 오류 처리
- Finnhub 실패 시 **샘플 데이터 fallback**(수업 진행용)

## 학습 포인트

- Next.js App Router에서 **Route Handler**로 서버 API 만들기
- 환경변수(`FINNHUB_API_KEY`)를 서버에서만 읽기
- 클라이언트에서 내부 API를 호출하고 상태(로딩/에러/결과) 관리하기
- 타입스크립트 타입 설계(DTO)와 데이터 포맷팅

## 주의사항

- 이 앱은 학습용이며 투자 자문/매수 추천/매도 추천을 제공하지 않습니다.
- Finnhub API 호출 제한(레이트 리밋)으로 실패할 수 있습니다. 실패 시 샘플 데이터가 표시될 수 있습니다.

## 테스트 체크리스트

```bash
npm run test:run
```

- `normalizeSymbol`이 trim + 대문자 변환되는가
- 빈 입력 시 “티커를 입력해주세요.”가 표시되는가
- API 실패 시 샘플 데이터가 표시되는가(`샘플 데이터` 배지)
- 뉴스가 없을 때 “최근 뉴스를 찾을 수 없습니다.”가 표시되는가

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
