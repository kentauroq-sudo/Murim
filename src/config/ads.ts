/**
 * Google AdSense 설정
 * - 값은 모두 빌드 시점 환경변수에서 읽는다 (.env.local 또는 Cloudflare Pages/Vercel 환경변수).
 * - 게시자 ID가 비어 있으면 광고 스크립트와 광고 칸이 아예 렌더링되지 않는다(빈 여백 없음).
 * - NEXT_PUBLIC_AD_PREVIEW=1 이면 실제 광고 대신 점선 자리표시를 보여 준다(레이아웃 확인용).
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ''; // 예: ca-pub-1234567890123456

export const AD_PREVIEW =
  process.env.NEXT_PUBLIC_AD_PREVIEW === '1' ||
  (process.env.NODE_ENV === 'development' && !ADSENSE_CLIENT);

/** 광고 단위(slot) ID — 애드센스 > 광고 > 광고 단위별에서 만든 숫자 ID */
export const AD_SLOTS = {
  /** 지도 화면 문파 상세 패널 맨 아래 (디스플레이, 반응형) */
  drawer: process.env.NEXT_PUBLIC_AD_SLOT_DRAWER ?? '',
  /** 상세 페이지 요약 아래 (콘텐츠 내 자동 삽입형) */
  articleTop: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE_TOP ?? '',
  /** 상세 페이지 본문 끝 (디스플레이, 반응형) */
  articleBottom: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE_BOTTOM ?? '',
  /** 도감 목록 사이 (인피드) */
  feed: process.env.NEXT_PUBLIC_AD_SLOT_FEED ?? '',
} as const;

/** 인피드 광고 레이아웃 키 (애드센스에서 인피드 광고 단위를 만들 때 함께 발급) */
export const AD_FEED_LAYOUT_KEY = process.env.NEXT_PUBLIC_AD_FEED_LAYOUT_KEY ?? '';

/** 도감 목록에서 카드 몇 개마다 인피드 광고를 넣을지 */
export const FEED_AD_EVERY = 8;
