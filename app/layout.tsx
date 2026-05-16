import type { Metadata } from "next";

import AppFooter from "@/components/AppFooter";
import GlobalNav from "@/components/GlobalNav";

import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Dashboard (학습용)",
  description: "티커로 주가·뉴스를 조회하는 학습용 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <GlobalNav />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
