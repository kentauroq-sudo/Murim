import type { MetadataRoute } from 'next';
import { sects } from '@/lib/data';

export const dynamic = 'force-static';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://murim-yeojido.pages.dev';

// 검색엔진·애드센스 크롤러가 정적 상세 페이지를 모두 찾을 수 있도록 목록을 만든다.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const fixed = ['/', '/sects/', '/martial-arts/', '/figures/', '/items/', '/about/', '/privacy/'];
  return [
    ...fixed.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now })),
    ...sects.map((s) => ({ url: `${SITE_URL}/sects/${s.id}/`, lastModified: now })),
  ];
}
