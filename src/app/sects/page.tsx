import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import AdSlot from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/config/ads';
import { FACTIONS, FACTION_SWATCH } from '@/config/map';
import { getArtsOfSect, getFiguresOfSect, sects } from '@/lib/data';

export const metadata: Metadata = {
  title: '문파 일람',
  description: '정파·사파·마교·세외·중립으로 나눈 강호 문파 목록. 문파별 근거지·무공·인물 수를 한눈에 본다.',
};

/** 문파 목록 — 예전에는 메뉴의 '문파'가 소림사 한 곳으로만 연결됐다 */
export default function SectsIndexPage() {
  const groups = FACTIONS.map((f) => ({ faction: f, list: sects.filter((s) => s.faction === f) })).filter((g) => g.list.length);
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-5 pb-12 pt-8 font-serif text-ink">
        <h1 className="text-3xl font-bold">
          문파 일람 <span className="text-2xl font-normal text-ink-muted">門派一覽</span>
        </h1>
        <p className="mt-2 text-ink-soft">
          강호 문파 {sects.length}곳. 세력별로 묶었고, 이름을 누르면 문파 기록으로, ‘지도에서 보기’를 누르면 지도 위 위치로 갑니다.
        </p>

        <nav aria-label="세력 바로가기" className="mt-5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.faction} href={`#${g.faction}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-sm text-ink-soft hover:border-ink-soft hover:text-ink">
              <span className={`inline-block size-2.5 rounded-full border ${FACTION_SWATCH[g.faction]}`} aria-hidden />
              {g.faction} <span className="text-xs text-ink-muted">{g.list.length}</span>
            </a>
          ))}
        </nav>

        {groups.map((g, gi) => (
          <section key={g.faction} id={g.faction} aria-labelledby={`h-${g.faction}`} className="mt-10 scroll-mt-20">
            <h2 id={`h-${g.faction}`} className="flex items-center gap-2 border-b-2 border-ink pb-2 text-2xl font-bold">
              <span className={`inline-block size-3 rounded-full border ${FACTION_SWATCH[g.faction]}`} aria-hidden />
              {g.faction}
              <span className="text-base font-normal text-ink-muted">{g.list.length}곳</span>
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.list.map((s) => (
                <li key={s.id} className="flex flex-col rounded-lg border border-line bg-white/50 p-4">
                  <Link href={`/sects/${s.id}/`} className="text-lg font-bold hover:underline">
                    {s.name_kr} <span className="text-sm font-normal text-ink-muted">{s.name_hanja}</span>
                  </Link>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    {[s.sub_faction, s.region.mountain ?? s.region.province].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{s.summary}</p>
                  <div className="mt-auto flex items-center justify-between pt-3 text-[13px] text-ink-muted">
                    <span>
                      무공 {getArtsOfSect(s.id).length} · 인물 {getFiguresOfSect(s.id).length}
                    </span>
                    <Link href={`/#sect=${s.id}`} className="inline-flex min-h-9 items-center rounded-md px-2 underline underline-offset-4 hover:text-ink">
                      지도에서 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {/* 광고: 첫 세력 묶음 다음 한 번만 */}
            {gi === 0 && groups.length > 1 && <AdSlot slot={AD_SLOTS.articleTop} variant="in-article" minHeight={200} />}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
