'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronsDown, ChevronsUp, X } from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/config/ads';
import { getArtsOfSect, getFiguresOfSect, getItemsOfSect, getPlacesOfSect, sectById } from '@/lib/data';
import type { Sect } from '@/types/wuxia';
import { FACTION_SWATCH } from '@/config/map';

const TABS = ['소개', '무공', '인물'] as const;
type Tab = (typeof TABS)[number];

export default function SectDetailDrawer({ sect, onClose }: { sect: Sect | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('소개');
  const [expanded, setExpanded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 문파가 바뀌면 첫 탭으로, 제목으로 초점 이동(스크린리더가 바로 읽도록)
  useEffect(() => {
    setTab('소개');
    if (sect) headingRef.current?.focus({ preventScroll: true });
    else setExpanded(false);
  }, [sect?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sect, onClose]);

  if (!sect) return null;

  const arts = getArtsOfSect(sect.id);
  const members = getFiguresOfSect(sect.id);
  const heldItems = getItemsOfSect(sect.id);
  const relatedPlaces = getPlacesOfSect(sect.id);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="sect-drawer-title"
      className={`fixed inset-x-0 bottom-0 z-[1100] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-line-strong bg-hanji px-5 pb-8 pt-2 font-serif text-ink shadow-[var(--shadow-panel)] transition-[height] duration-200 md:inset-y-0 md:left-auto md:right-0 md:h-dvh md:w-[420px] md:rounded-none md:border-l md:border-t-0 md:px-6 md:pt-6 ${
        expanded ? 'h-[92dvh]' : 'h-[62dvh]'
      }`}
    >
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong md:hidden" />
      <div className="sticky top-0 z-20 float-right -mr-2 flex gap-1 rounded-md bg-hanji/90">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid size-10 place-items-center rounded-md text-ink-soft hover:bg-hanji-deep md:hidden"
        >
          {expanded ? <ChevronsDown size={20} aria-hidden /> : <ChevronsUp size={20} aria-hidden />}
          <span className="sr-only">{expanded ? '패널 작게' : '패널 크게'}</span>
        </button>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-md text-ink-soft hover:bg-hanji-deep">
          <X size={22} aria-hidden />
          <span className="sr-only">닫기</span>
        </button>
      </div>

      <h2 id="sect-drawer-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-tight focus:outline-none">
        {sect.name_kr} <span className="text-lg font-normal text-ink-muted">{sect.name_hanja}</span>
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-soft">
        <span className={`inline-block h-2.5 w-2.5 rounded-full border ${FACTION_SWATCH[sect.faction]}`} aria-hidden />
        <span>{sect.faction}</span>
        {sect.sub_faction && <span>· {sect.sub_faction}</span>}
        <span>· {sect.region.province}</span>
        <span className="ml-1 rounded-full border border-line-strong px-2 py-0.5 text-xs">{sect.tier_tag}</span>
      </p>

      <div role="tablist" aria-label="문파 기록" className="sticky -top-2 z-10 -mx-5 mt-4 flex gap-1 border-b border-line bg-hanji px-5 text-[0.9375rem] md:-top-6 md:-mx-6 md:px-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? '-mb-px min-h-11 border-b-2 border-accent px-3 font-bold'
                : 'min-h-11 px-3 text-ink-muted hover:text-ink'
            }
          >
            {t}
            <span className="ml-1 text-xs text-ink-muted">
              {t === '무공' ? arts.length : t === '인물' ? members.length : ''}
            </span>
          </button>
        ))}
      </div>

      {tab === '소개' && (
        <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed">
          <p>{sect.summary}</p>
          {sect.philosophy && (
            <p>
              <span className="font-bold">문파 철학</span> · {sect.philosophy}
            </p>
          )}
          {sect.alliance && (
            <p>
              <span className="font-bold">소속 연맹</span> · {sect.alliance}
            </p>
          )}
          {sect.alignment_note && <p className="rounded-sm bg-ink/5 p-3">{sect.alignment_note}</p>}
          {sect.region.coord_note && <p className="text-sm text-ink-muted">{sect.region.coord_note}</p>}
          {(heldItems.length > 0 || relatedPlaces.length > 0) && (
            <div className="space-y-1">
              <p className="font-bold">관련 기록</p>
              {heldItems.map((it) => (
                <p key={it.id} className="text-sm">
                  · {it.type} {it.name_kr}({it.name_hanja})
                </p>
              ))}
              {relatedPlaces.map((p) => (
                <p key={p.id} className="text-sm">
                  · {p.type} {p.name_kr}({p.name_hanja})
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === '무공' && (
        <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
          {arts.map((art) => (
            <li key={art.id} className="rounded-lg border border-line bg-hanji-deep/50 p-3">
              <p className="font-bold">
                <Link href={`/martial-arts/#${art.id}`} className="hover:underline">
                  {art.name_kr}
                </Link>{' '}
                <span className="text-sm font-normal text-ink-muted">{art.name_hanja}</span>
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {art.weapon_type} · {art.grade} · [{art.tier_tag}]
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{art.origin_and_principle}</p>
              {art.techniques.length > 0 && (
                <p className="mt-1 text-[13px] text-ink-muted">초식 {art.techniques.length}개</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === '인물' && (
        <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
          {members.map((fig) => (
            <li key={fig.id} className="rounded-lg border border-line bg-hanji-deep/50 p-3">
              <p className="font-bold">
                <Link href={`/figures/#${fig.id}`} className="hover:underline">
                  {fig.name_kr}
                </Link>{' '}
                <span className="text-sm font-normal text-ink-muted">{fig.name_hanja}</span>
              </p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {fig.title} · {fig.realm ? fig.realm.level : '경지 미상'} · [{fig.tier_tag}]
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{fig.biography}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[13px] text-ink-muted">
        출처: {sect.sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(', ')}
      </p>
      <Link
        href={`/sects/${sect.id}/`}
        className="mt-4 flex min-h-12 items-center justify-center rounded-lg bg-ink px-4 font-bold text-hanji hover:bg-ink-soft"
      >
        문파 전체 기록 보기 →
      </Link>
      {sect.relations && sect.relations.length > 0 && (
        <div className="mt-6 border-t border-line pt-3 text-sm">
          <p className="font-bold">강호 관계</p>
          <ul className="mt-1 space-y-1">
            {sect.relations.map((r) => {
              const other = sectById.get(r.sect_id);
              return (
                <li key={r.sect_id}>
                  ·{' '}
                  {other ? (
                    <Link href={`/sects/${r.sect_id}/`} className="underline">
                      {other.name_kr}
                    </Link>
                  ) : (
                    r.sect_id
                  )}{' '}
                  — {r.type}: {r.note}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 광고: 버튼·링크와 충분히 떨어진 패널 맨 아래. 문파가 바뀌면 key로 다시 마운트해 새 광고를 요청 */}
      <AdSlot key={sect.id} slot={AD_SLOTS.drawer} minHeight={250} className="mt-10" />
    </aside>
  );
}
