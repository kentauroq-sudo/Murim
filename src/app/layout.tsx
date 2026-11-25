import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ADSENSE_CLIENT } from '@/config/ads';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://murim-yeojido.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '무림여지도(武林輿地圖)',
    template: '%s | 무림여지도',
  },
  description:
    '정통 무협의 문파·무공·인물·기물을 수묵 고지도 위에서 탐색하는 정적 아카이브. 스키마 v3.0.',
  openGraph: { type: 'website', siteName: '무림여지도', locale: 'ko_KR' },
  // 애드센스 사이트 소유권 확인용 메타 태그 (게시자 ID를 넣었을 때만)
  other: ADSENSE_CLIENT ? { 'google-adsense-account': ADSENSE_CLIENT } : undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f2eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Serif+SC:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-hanji font-serif text-ink antialiased">
        {children}
        {/* 구글 애드센스: 게시자 ID가 비어 있으면 스크립트를 아예 넣지 않는다 */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}
