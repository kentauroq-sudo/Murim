/**
 * 배포 경로 접두사.
 * - GitHub Pages 처럼 하위 경로(예: /Murim)에 올릴 때는 NEXT_PUBLIC_BASE_PATH=/Murim 을 준다.
 * - 루트 도메인(Cloudflare Pages, Vercel 등)에서는 값이 비어 있어 그대로 동작한다.
 *
 * next/link 의 href 는 Next.js 가 basePath 를 자동으로 붙여 주지만,
 * <img src>·Leaflet 이미지 오버레이·attribution 안의 <a href> 같은
 * 순수 정적 자산 경로는 직접 붙여야 한다.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const withBasePath = (path: string) =>
  path.startsWith('/') ? `${BASE_PATH}${path}` : `${BASE_PATH}/${path}`;
