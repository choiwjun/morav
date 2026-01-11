import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morav - AI 블로그 자동화 플랫폼",
  description: "트렌드 키워드 분석부터 콘텐츠 생성, 자동 발행까지. AI 기반 블로그 자동화 서비스",
  keywords: ["블로그", "AI", "자동화", "콘텐츠", "키워드", "SEO"],
  authors: [{ name: "Morav" }],
  openGraph: {
    title: "Morav - AI 블로그 자동화 플랫폼",
    description: "트렌드 키워드 분석부터 콘텐츠 생성, 자동 발행까지",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
