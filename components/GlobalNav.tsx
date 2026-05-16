export default function GlobalNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex h-11 items-center justify-center bg-black px-4 text-[12px] text-white"
      aria-label="전역 내비게이션"
    >
      <span className="text-nav-link font-normal tracking-[-0.12px] text-white/90">
        Stock Dashboard
      </span>
      <span className="sr-only">학습용</span>
    </nav>
  );
}
