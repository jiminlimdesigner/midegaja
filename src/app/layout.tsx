import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GA4PageTracker } from "@/components/GA4PageTracker";
import { GTMScript } from "@/components/GTMScript";
import { GTMNoScript } from "@/components/GTMNoScript";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미대가자 – 입시 미술 실기를 전략적으로 준비하는 연습 도구",
  description: "미술 입시 실전 실기를 단계별로 훈련할 수 있는 타이머 기반 연습 도구. 시간 안에 실력을 끌어올리는 전략적인 훈련을 도와줍니다.",
  keywords: ["미술 입시", "실기 연습", "타이머", "미대 준비", "미술 실기"],
  authors: [{ name: "미대가자" }],
  creator: "미대가자",
  publisher: "미대가자",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://midegaja.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "미대가자 – 시간을 설계해야 실력이 보인다",
    description: "입시 미술 실기를 전략적으로 준비하는 연습 도구",
    url: "https://midegaja.com",
    siteName: "미대가자",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "미대가자 - 입시 미술 실기 연습 도구",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "미대가자 – 시간을 설계해야 실력이 보인다",
    description: "입시 미술 실기를 전략적으로 준비하는 연습 도구",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Google Search Console에서 받은 코드로 교체 필요
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 파비콘: SVG, PNG, ICO 모두 명시 */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Windows Tile */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        <GTMScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GTMNoScript />
        <Suspense fallback={null}>
          <GA4PageTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
