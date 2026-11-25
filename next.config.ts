import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // 정적 HTML 내보내기
  // GitHub Pages 처럼 하위 경로(/Murim)에 배포할 때만 지정한다.
  // 값이 없으면(Cloudflare Pages 등 루트 배포) 기존과 동일하게 동작한다.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true, // /sects/huashan/index.html 형태로 생성 (정적 호스팅 호환)
  images: { unoptimized: true },
};

export default nextConfig;
