'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import { AD_FEED_LAYOUT_KEY, AD_SLOTS, FEED_AD_EVERY } from '@/config/ads';
import type { EraType, Faction, Figure, MartialArt, Sect } from '@/types/wuxia';
import { FACTIONS } from '@/config/map';

const ERAS: EraType[] = ['전대 고수', '당대', '후기지수'];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? 'inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 text-sm text-hanji'
          : 'inline-flex min-h-9 items-center rounded-full border border-line-strong bg-hanji px-3.5 text-sm text-ink-soft hover:border-ink-soft'
      }
    >
      {children}
    </button>
  );
}

export default function FiguresBrowser({
  figures,
  sects,
  arts,
}: {
  figures: Figure[];
  sects: Sect[];
  arts: MartialArt[];
}) {
  const [query, setQuery] = useState('');
  const [era, setEra] = useState<EraType | '전체'>('전체');
  const [faction, setFaction] = useState<Faction | '전체'>('전체');

  const sectById = useMemo(() => new Map(sects.map((s) => [s.id, s])), [sects]);
  const artById = useMemo(() => new Map(arts.map((a) => [a.id, a])), [arts]);

  const fuse = useMemo(
    () =>
      new Fuse(figures, {
        keys: [
          { name: 'name_kr', weight: 3 },
          { name: 'name_hanja', weight: 2 },
          { name: 'alias', weight: 2 },
          { name: 'title', weight: 1.5 },
          { name: 'biography', weight: 1 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [figures],
  );

  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : figures;
    if (era !== '전체') list = list.filter((f) => f.era_type === era);
    if (faction !== '전체') list = list.filter((f) => (f.sect_id ? sectById.get(f.sect_id)?.faction === faction : false));
    return list;
  }, [query, era, faction, figures, fuse, sectById]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="인물 이름·별호로 찾기 (예: 풍청양, 장무기)"
          aria-label="인물 검색"
          className="w-full rounded-sm border border-ink/20 bg-white/60 h-12 pl-10 pr-3 text-base outline-none placeholder:text-ink/40 focus:border-ink/50"
        />
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-10 text-[13px] text-ink-muted">시대</span>
          <Chip active={era === '전체'} onClick={() => setEra('전체')}>
            전체
          </Chip>
          {ERAS.map((e) => (
            <Chip key={e} active={era === e} onClick={() => setEra(era === e ? '전체' : e)}>
              {e}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-10 text-[13px] text-ink-muted">세력</span>
          <Chip active={faction === '전체'} onClick={() => setFaction('전체')}>
            전체
          </Chip>
          {FACTIONS.map((f) => (
            <Chip key={f} active={faction === f} onClick={() => setFaction(faction === f ? '전체' : f)}>
              {f}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        {filtered.length}명 표시 중 (전체 {figures.length}명)
      </p>

      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((f, i) => {
          const sect = f.sect_id ? sectById.get(f.sect_id) : null;
          return [
            <li key={f.id} id={f.id} className="scroll-mt-24 rounded-sm border border-ink/15 bg-white/50 p-4 target:border-accent target:ring-2 target:ring-accent/25 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="text-lg font-bold">
                  {f.name_kr} <span className="text-sm font-normal text-ink-muted">{f.name_hanja}</span>
                </h2>
                <span className="ml-auto text-[13px] text-ink-muted">[{f.tier_tag}]</span>
              </div>
              <p className="mt-1 text-[13px] text-ink-muted">
                {sect ? (
                  <Link href={`/sects/${sect.id}/`} className="underline">
                    {sect.name_kr}
                  </Link>
                ) : (
                  '무소속'
                )}{' '}
                · {f.era_type} · {f.realm ? `${f.realm.level}(${f.realm.basis})` : '경지 미상'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">{f.title}</p>
              <p className="mt-2 text-sm leading-relaxed">{f.biography}</p>
              {f.mastered_arts.length > 0 && (
                <p className="mt-2 text-[13px] text-ink-muted">
                  주 무공:{' '}
                  {f.mastered_arts.map((id, i) => {
                    const art = artById.get(id);
                    return (
                      <span key={id}>
                        {i > 0 && ', '}
                        {art ? (
                          <Link href={`/martial-arts/#${art.id}`} className="underline">
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
              {f.era_note && <p className="mt-1 text-xs text-ink-muted">{f.era_note}</p>}
              <p className="mt-1.5 text-xs text-ink-muted">
                출처: {f.sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(' · ')}
              </p>
            </li>,
            // 인피드 광고: 카드 FEED_AD_EVERY개마다 두 칸을 가로질러 한 줄
            (i + 1) % FEED_AD_EVERY === 0 && i + 1 < filtered.length ? (
              <li key={`ad-${f.id}`} className="md:col-span-2">
                <AdSlot slot={AD_SLOTS.feed} variant="in-feed" layoutKey={AD_FEED_LAYOUT_KEY} minHeight={160} className="my-2" />
              </li>
            ) : null,
          ];
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="mt-8 rounded-sm border border-dashed border-ink/25 p-6 text-center text-sm text-ink-muted">
          조건에 맞는 인물이 없습니다.
        </p>
      )}
    </div>
  );
}
