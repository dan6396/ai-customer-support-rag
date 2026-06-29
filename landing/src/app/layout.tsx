import type { Metadata } from "next";
import { Nanum_Myeongjo, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const serif = Nanum_Myeongjo({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "단답 — 고객이 원하는 건 답입니다, 변명이 아니라",
  description:
    "스마트스토어 FAQ를 붙여넣으면 5분 뒤 카톡에서 한국어로 정확히 응대합니다. 비용 폭탄 없는 정액제.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
