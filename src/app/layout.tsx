import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "라니투어 | 여행 일정 플래너",
  description: "가족, 친구와 함께 공유하는 카카오 지도 기반 반응형 여행 일정 플래너",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
