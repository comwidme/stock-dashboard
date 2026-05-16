export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--apple-hairline)] bg-[var(--apple-canvas-parchment)]">
      <div className="mx-auto max-w-[980px] px-6 py-16 sm:px-8">
        <p className="text-fine-print max-w-2xl">
          본 서비스는 학습용 예제이며 투자 자문을 제공하지 않습니다. 표시되는 주가·뉴스 데이터는
          Finnhub 등 제3자 API에 의존하며, 지연·오류·샘플 데이터 표시가 발생할 수 있습니다.
        </p>
        <p className="mt-4 text-[12px] text-[var(--apple-ink-muted-48)]">
          © {new Date().getFullYear()} Stock Dashboard (학습용)
        </p>
      </div>
    </footer>
  );
}
