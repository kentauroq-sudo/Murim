import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import AdSlot from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/config/ads';
import {
  getArtsOfSect,
  getFiguresOfSect,
  getItemsOfSect,
  getPlacesOfSect,
  getPractitioners,
  sectById,
  sects,
} from '@/lib/data';
import { FACTION_SWATCH } from '@/config/map';
import type { Sect } from '@/types/wuxia';

type Props = { params: Promise<{ id: string }> };

// 정적 내보내기에서는 만들 페이지 목록을 미리 알려 줘야 한다.
export const dynamicParams = false;

export function generateStaticParams() {
  return sects.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sect = sectById.get((await params).id);
  if (!sect) return { title: '무림여지도' };
  return {
    title: `${sect.name_kr}(${sect.name_hanja})`,
    description: sect.summary.slice(0, 120),
    alternates: { canonical: `/sects/${sect.id}/` },
  };
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[13px] text-ink-soft">{children}</span>;
}

function SourceList({ sources }: { sources: Sect['sources'] }) {
  return (
    <span className="text-[13px] text-ink-muted">
      {sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(' · ')}
    </span>
  );
}

export default async function SectPage({ params }: Props) {
  const sect = sectById.get((await params).id);
  if (!sect) notFound();

  const arts = getArtsOfSect(sect.id);
  const members = getFiguresOfSect(sect.id);
  const heldItems = getItemsOfSect(sect.id);
  const relatedPlaces = getPlacesOfSect(sect.id);

  return (
    <>
      <SiteHeader />
      <article id="main" className="mx-auto max-w-3xl px-5 pb-20 pt-8 font-serif text-ink">
        <p className="text-xs text-ink-muted">
          <Link href="/" className="underline">
            강호 지도
          </Link>{' '}
          / {sect.faction}
          {sect.sub_faction ? ` · ${sect.sub_faction}` : ''}
        </p>

        <h1 className="mt-2 text-3xl font-bold leading-tight">
          {sect.name_kr} <span className="text-xl font-normal text-ink-muted">{sect.name_hanja}</span>
        </h1>
        {sect.alias && sect.alias.length > 0 && (
          <p className="mt-1 text-sm text-ink-muted">다른 이름: {sect.alias.join(' · ')}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded-full border ${FACTION_SWATCH[sect.faction]}`} aria-hidden />
          <Tag>{sect.faction}</Tag>
          {sect.sub_faction && <Tag>{sect.sub_faction}</Tag>}
          {sect.alliance && <Tag>{sect.alliance}</Tag>}
          <Tag>[{sect.tier_tag}]</Tag>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 rounded-sm border border-ink/15 bg-white/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted">소재</dt>
            <dd>
              {sect.region.province}
              {sect.region.mountain ? ` · ${sect.region.mountain}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">지도 좌표</dt>
            <dd className="text-xs">
              픽셀 ({sect.region.map_position.x}, {sect.region.map_position.y})
              {sect.region.geo && (
                <>
                  {' · '}
                  <a
                    className="underline"
                    href={`https://www.google.com/maps?q=${sect.region.geo.lat},${sect.region.geo.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sect.region.geo.lat.toFixed(4)}, {sect.region.geo.lng.toFixed(4)}
                  </a>
                </>
              )}
            </dd>
          </div>
          {sect.philosophy && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-muted">문파 철학</dt>
              <dd>{sect.philosophy}</dd>
            </div>
          )}
          {sect.region.coord_note && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-muted">좌표 기준</dt>
              <dd className="text-xs text-ink-soft">{sect.region.coord_note}</dd>
            </div>
          )}
        </dl>

        <p className="mt-6 leading-relaxed">{sect.summary}</p>
        {sect.alignment_note && (
          <p className="mt-3 rounded-sm border-l-2 border-ink/30 bg-ink/5 p-3 text-sm leading-relaxed">{sect.alignment_note}</p>
        )}
        {sect.tier_note && <p className="mt-2 text-xs text-ink-muted">고증 메모: {sect.tier_note}</p>}

        {/* 광고 1: 요약 다음, 목록이 시작되기 전 (콘텐츠 내 자동 삽입형) */}
        <AdSlot slot={AD_SLOTS.articleTop} variant="in-article" minHeight={200} />

        <h2 className="mt-10 border-b border-ink/20 pb-1 text-xl font-bold">
          무공 <span className="text-sm font-normal text-ink-muted">{arts.length}종</span>
        </h2>
        <ul className="mt-3 space-y-5">
          {arts.map((a) => {
            const practitioners = getPractitioners(a.id);
            return (
              <li key={a.id} id={a.id} className="scroll-mt-20 rounded-sm border border-ink/10 p-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-lg font-bold">
                    {a.name_kr} <span className="text-sm font-normal text-ink-muted">{a.name_hanja}</span>
                  </h3>
                  {sect.signature_arts.includes(a.id) && (
                    <span className="rounded-sm bg-orthodox px-1.5 py-0.5 text-xs text-hanji">대표 무공</span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap gap-1.5 text-[13px] text-ink-muted">
                  <Tag>{a.category}</Tag>
                  <Tag>{a.weapon_type}</Tag>
                  <Tag>{a.grade}</Tag>
                  <Tag>[{a.tier_tag}]</Tag>
                  {a.alias && a.alias.length > 0 && <Tag>이명: {a.alias.join(' · ')}</Tag>}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{a.origin_and_principle}</p>
                {a.techniques.length > 0 && (
                  <details className="mt-2 rounded-sm bg-ink/5 p-3">
                    <summary className="text-sm font-bold">초식 {a.techniques.length}개 펼치기</summary>
                    <ol className="mt-2 space-y-1.5 text-sm">
                      {a.techniques.map((t) => (
                        <li key={`${a.id}-${t.name_kr}`}>
                          <b>
                            {t.name_kr}({t.name_hanja})
                          </b>{' '}
                          — {t.description}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
                {a.synergy_note && <p className="mt-2 text-xs text-ink-soft">상성·운용: {a.synergy_note}</p>}
                {practitioners.length > 0 && (
                  <p className="mt-2 text-xs text-ink-soft">
                    연마자:{' '}
                    {practitioners.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ', '}
                        <Link href={`/figures/#${p.id}`} className="underline">
                          {p.name_kr}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {a.enum_note && <p className="mt-1 text-[13px] text-ink-muted">{a.enum_note}</p>}
                <p className="mt-2">
                  <SourceList sources={a.sources} />
                </p>
              </li>
            );
          })}
        </ul>

        <h2 className="mt-10 border-b border-ink/20 pb-1 text-xl font-bold">
          인물 <span className="text-sm font-normal text-ink-muted">{members.length}명</span>
        </h2>
        <ul className="mt-3 space-y-4">
          {members.map((f) => (
            <li key={f.id} id={f.id} className="scroll-mt-20 rounded-sm border border-ink/10 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-lg font-bold">
                  {f.name_kr} <span className="text-sm font-normal text-ink-muted">{f.name_hanja}</span>
                </h3>
                <span className="text-xs text-ink-muted">{f.title}</span>
              </div>
              <p className="mt-1 flex flex-wrap gap-1.5 text-[13px] text-ink-muted">
                <Tag>{f.era_type}</Tag>
                <Tag>{f.realm ? `${f.realm.level}(${f.realm.basis})` : '경지 미상'}</Tag>
                <Tag>[{f.tier_tag}]</Tag>
              </p>
              <p className="mt-2 text-sm leading-relaxed">{f.biography}</p>
              {f.mastered_arts.length > 0 && (
                <p className="mt-2 text-xs text-ink-soft">
                  주 무공:{' '}
                  {f.mastered_arts.map((id, i) => {
                    const art = arts.find((a) => a.id === id);
                    return (
                      <span key={id}>
                        {i > 0 && ', '}
                        {art ? (
                          <Link href={`#${art.id}`} className="underline">
                            {art.name_kr}
                          </Link>
                        ) : (
                          id
                        )}
                      </span>
                    );
                  })}
                </p>
              )}
              {f.era_note && <p className="mt-1 text-[13px] text-ink-muted">{f.era_note}</p>}
            </li>
          ))}
        </ul>

        {(heldItems.length > 0 || relatedPlaces.length > 0) && (
          <>
            <h2 className="mt-10 border-b border-ink/20 pb-1 text-xl font-bold">기물·지명</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {heldItems.map((it) => (
                <li key={it.id}>
                  <b>
                    {it.name_kr}({it.name_hanja})
                  </b>{' '}
                  · {it.type} — {it.description}
                </li>
              ))}
              {relatedPlaces.map((p) => (
                <li key={p.id}>
                  <b>
                    {p.name_kr}({p.name_hanja})
                  </b>{' '}
                  · {p.type} — {p.description}
                </li>
              ))}
            </ul>
          </>
        )}

        {sect.relations && sect.relations.length > 0 && (
          <>
            <h2 className="mt-10 border-b border-ink/20 pb-1 text-xl font-bold">강호 관계</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {sect.relations.map((r) => {
                const other = sectById.get(r.sect_id);
                return (
                  <li key={r.sect_id}>
                    <b>{r.type}</b> ·{' '}
                    {other ? (
                      <Link href={`/sects/${other.id}/`} className="underline">
                        {other.name_kr}({other.name_hanja})
                      </Link>
                    ) : (
                      r.sect_id
                    )}{' '}
                    — {r.note}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <p className="mt-10 border-t border-ink/15 pt-3">
          <span className="text-xs font-bold">출처</span> <SourceList sources={sect.sources} />
        </p>

        {/* 광고 2: 본문 끝 */}
        <AdSlot slot={AD_SLOTS.articleBottom} minHeight={250} />
      </article>
      <SiteFooter />
    </>
  );
}
