import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import AdSlot from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/config/ads';
import { figureById, items, places, sectById } from '@/lib/data';
import { withBasePath } from '@/lib/base-path';

export const metadata: Metadata = {
  title: '기물·지명',
  description: '무림여지도에 실린 영약·신병·비급과 강호의 지명.',
};

export default function ItemsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-4xl px-5 pb-20 pt-8 font-serif text-ink">
        <h1 className="text-3xl font-bold">기물·지명</h1>
        <p className="mt-2 text-sm text-ink-soft">
          검과 도, 비급, 그리고 강호의 이름난 자리. 스키마 v3.0에서 새로 둔 <code>items.json</code>·
          <code>places.json</code>에 실린 기록입니다.
        </p>

        <h2 className="mt-8 border-b border-ink/20 pb-1 text-xl font-bold">영약·신병·비급</h2>
        <ul className="mt-3 space-y-3">
          {items.map((it) => {
            const sect = it.sect_id ? sectById.get(it.sect_id) : null;
            return (
              <li key={it.id} id={it.id} className="scroll-mt-24 rounded-sm border border-ink/15 bg-white/50 p-4 target:border-accent target:ring-2 target:ring-accent/25">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-lg font-bold">
                    {it.name_kr} <span className="text-sm font-normal text-ink-muted">{it.name_hanja}</span>
                  </h3>
                  <span className="ml-auto text-[13px] text-ink-muted">
                    {it.type} · [{it.tier_tag}]
                  </span>
                </div>
                {sect && (
                  <p className="mt-1 text-[13px] text-ink-muted">
                    관련 문파:{' '}
                    <Link href={`/sects/${sect.id}/`} className="underline">
                      {sect.name_kr}
                    </Link>
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed">{it.description}</p>
                {it.holders.length > 0 && (
                  <p className="mt-2 text-[13px] text-ink-muted">
                    소유·사용:{' '}
                    {it.holders.map((h, i) => {
                      const fig = figureById.get(h.figure_id);
                      return (
                        <span key={h.figure_id}>
                          {i > 0 && ', '}
                          {fig ? (
                            <Link href={`/figures/#${fig.id}`} className="underline">
                              {fig.name_kr}
                            </Link>
                          ) : (
                            h.figure_id
                          )}
                          ({h.note})
                        </span>
                      );
                    })}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-ink-muted">
                  출처: {it.sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(' · ')}
                </p>
              </li>
            );
          })}
        </ul>

        {/* 광고: 기물 목록과 지명 목록 사이 */}
        <AdSlot slot={AD_SLOTS.articleBottom} minHeight={250} />

        <h2 className="mt-10 border-b border-ink/20 pb-1 text-xl font-bold">지명·명소</h2>
        <ul className="mt-3 space-y-3">
          {places.map((p) => (
            <li key={p.id} id={p.id} className="scroll-mt-24 rounded-sm border border-ink/15 bg-white/50 p-4 target:border-accent target:ring-2 target:ring-accent/25">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-lg font-bold">
                  {p.name_kr} <span className="text-sm font-normal text-ink-muted">{p.name_hanja}</span>
                </h3>
                <span className="ml-auto text-[13px] text-ink-muted">
                  {p.type} · {p.province}
                </span>
              </div>
              {p.image && (
                <div className="mt-3 overflow-hidden rounded-sm border border-ink/15 bg-hanji">
                  <img
                    src={withBasePath(p.image)}
                    alt={`${p.name_kr} (${p.name_hanja}) 수묵 삽화`}
                    className="h-56 w-full object-cover"
                  />
                </div>
              )}
              <p className="mt-2 text-sm leading-relaxed">{p.description}</p>
              {p.related_sects.length > 0 && (
                <p className="mt-2 text-[13px] text-ink-muted">
                  관련 문파:{' '}
                  {p.related_sects.map((id, i) => {
                    const sect = sectById.get(id);
                    return (
                      <span key={id}>
                        {i > 0 && ', '}
                        {sect ? (
                          <Link href={`/sects/${sect.id}/`} className="underline">
                            {sect.name_kr}
                          </Link>
                        ) : (
                          id
                        )}
                      </span>
                    );
                  })}
                </p>
              )}
              <p className="mt-1.5 text-xs text-ink-muted">
                출처: {p.sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
