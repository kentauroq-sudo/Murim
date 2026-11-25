'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, AD_PREVIEW } from '@/config/ads';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export type AdVariant = 'display' | 'in-article' | 'in-feed';

interface AdSlotProps {
  /** 광고 단위 ID (config/ads.ts의 AD_SLOTS 값) */
  slot: string;
  variant?: AdVariant;
  /** in-feed 전용 레이아웃 키 */
  layoutKey?: string;
  /** 광고가 뜨기 전 자리를 확보해 레이아웃 흔들림(CLS)을 막는 최소 높이 */
  minHeight?: number;
  className?: string;
}

/**
 * 애드센스 광고 칸.
 * - 화면 전환(문파 변경, 페이지 이동) 때 새 광고를 받으려면 부모에서 key를 바꿔 다시 마운트한다.
 *   예) <AdSlot key={sect.id} slot={AD_SLOTS.drawer} />
 * - 클릭 유도 정책 위반을 피하려고 항상 '광고' 라벨을 붙이고, 버튼·링크와 충분히 떨어뜨려 배치한다.
 */
export default function AdSlot({ slot, variant = 'display', layoutKey, minHeight = 250, className = '' }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const live = Boolean(ADSENSE_CLIENT && slot && (variant !== 'in-feed' || layoutKey));

  useEffect(() => {
    if (!live) return;
    const ins = insRef.current;
    // 같은 <ins>에 두 번 push하면 "already have ads" 오류가 나므로 상태 속성을 확인한다.
    if (!ins || ins.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기 등으로 스크립트가 없을 때는 조용히 넘어간다.
    }
  }, [live]);

  if (!live && !AD_PREVIEW) return null;

  const variantAttrs =
    variant === 'in-article'
      ? { 'data-ad-layout': 'in-article', 'data-ad-format': 'fluid' }
      : variant === 'in-feed'
        ? { 'data-ad-format': 'fluid', 'data-ad-layout-key': layoutKey }
        : { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' };

  return (
    <aside aria-label="광고" className={`ad-slot ${className}`}>
      <p className="ad-slot__label">광고</p>
      {live ? (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight, textAlign: variant === 'in-article' ? 'center' : undefined }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          {...variantAttrs}
        />
      ) : (
        <div className="ad-slot__placeholder" style={{ minHeight }}>
          광고 영역 미리보기 · {variant}
        </div>
      )}
    </aside>
  );
}
