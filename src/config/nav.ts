/**
 * 사이트 전역 메뉴 정의 (서버·클라이언트 컴포넌트 공용).
 * 'use client' 모듈(SiteHeader)에서 상수를 가져오면 서버 렌더 시 값이 전달되지 않아
 * 프리렌더가 깨지므로, 별도 모듈에 두고 양쪽에서 가져다 쓴다.
 */
export const NAV_ITEMS = [
  { href: '/', label: '강호 지도' },
  { href: '/sects/', label: '문파' },
  { href: '/martial-arts/', label: '무공' },
  { href: '/figures/', label: '인물' },
  { href: '/items/', label: '기물' },
] as const;

export const FOOTER_ITEMS = [
  { href: '/about/', label: '사이트 소개' },
  { href: '/privacy/', label: '개인정보처리방침' },
] as const;
