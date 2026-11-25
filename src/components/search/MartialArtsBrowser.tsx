'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import { AD_FEED_LAYOUT_KEY, AD_SLOTS, FEED_AD_EVERY } from '@/config/ads';
import type { ArtCategory, ArtGrade, Faction, Figure, MartialArt, Sect, WeaponType } from '@/types/wuxia';
import { FACTIONS } from '@/config/map';

const CATEGORIES: ArtCategory[] = ['내공', '외공', '경공', '기문'];
const WEAPONS: WeaponType[] = ['내공심법', '검법', '도법', '권각', '창봉', '암기', '경공', '음공', '진법', '기타'];
const GRADES: ArtGrade[] = ['일반', '상승', '절학'];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

export default function MartialArtsBrowser({
  arts,
  sects,
  figures,
}: {
  arts: MartialArt[];
  sects: Sect[];
  figures: Figure[];
}) {
  const [query, setQuery] = useState('');
  const [faction, setFaction] = useState<Faction | '전체'>('전체');
  const [category, setCategory] = useState<ArtCategory | '전체'>('전체');
  const [weapon, setWeapon] = useState<WeaponType | '전체'>('전체');
  const [grade, setGrade] = useState<ArtGrade | '전체'>('전체');

  const sectById = useMemo(() => new Map(sects.map((s) => [s.id, s])), [sects]);
  const factionOf = (art: MartialArt): Faction | null => (art.sect_id ? sectById.get(art.sect_id)?.faction ?? null : null);

  const indexed = useMemo(
    () =>
      arts.map((a) => ({
        ...a,
        technique_text: a.techniques.map((t) => `${t.name_kr} ${t.name_hanja}`).join(' '),
      })),
    [arts],
  );

  const fuseIndexed = useMemo(
    () =>
      new Fuse(indexed, {
        keys: [
          { name: 'name_kr', weight: 3 },
          { name: 'name_hanja', weight: 2 },
          { name: 'alias', weight: 2 },
          { name: 'technique_text', weight: 1 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [indexed],
  );
  const filtered = useMemo(() => {
    let list = query.trim() ? fuseIndexed.search(query.trim()).map((r) => r.item) : indexed;
    if (faction !== '전체') list = list.filter((a) => factionOf(a) === faction);
    if (category !== '전체') list = list.filter((a) => a.category === category);
    if (weapon !== '전체') list = list.filter((a) => a.weapon_type === weapon);
    if (grade !== '전체') list = list.filter((a) => a.grade === grade);
    return list;
  }, [query, faction, category, weapon, grade, indexed, fuseIndexed]);

  const practitioners = useMemo(() => {
    const map = new Map<string, Figure[]>();
    figures.forEach((f) => f.mastered_arts.forEach((id) => {
      const list = map.get(id) ?? [];
      list.push(f);
      map.set(id, list);
    }));
    return map;
  }, [figures]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="무공·초식 이름으로 찾기 (예: 항룡십팔장, 파검식)"
          aria-label="무공 검색"
          className="w-full rounded-sm border border-ink/20 bg-white/60 h-12 pl-10 pr-3 text-base outline-none placeholder:text-ink/40 focus:border-ink/50"
        />
      </div>

      <div className="mt-3 space-y-2">
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-10 text-[13px] text-ink-muted">분류</span>
          <Chip active={category === '전체'} onClick={() => setCategory('전체')}>
            전체
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? '전체' : c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-10 text-[13px] text-ink-muted">계통</span>
          <Chip active={weapon === '전체'} onClick={() => setWeapon('전체')}>
            전체
          </Chip>
          {WEAPONS.map((w) => (
            <Chip key={w} active={weapon === w} onClick={() => setWeapon(weapon === w ? '전체' : w)}>
              {w}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-10 text-[13px] text-ink-muted">등급</span>
          <Chip active={grade === '전체'} onClick={() => setGrade('전체')}>
            전체
          </Chip>
          {GRADES.map((g) => (
            <Chip key={g} active={grade === g} onClick={() => setGrade(grade === g ? '전체' : g)}>
              {g}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        {filtered.length}종 표시 중 (전체 {arts.length}종)
      </p>

      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((a, i) => {
          const sect = a.sect_id ? sectById.get(a.sect_id) : null;
          const users = practitioners.get(a.id) ?? [];
          return [
            <li
              key={a.id}
              id={a.id}
              className="scroll-mt-24 rounded-sm border border-ink/15 bg-white/50 p-4 target:border-accent target:ring-2 target:ring-accent/25 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="text-lg font-bold">
                  {a.name_kr} <span className="text-sm font-normal text-ink-muted">{a.name_hanja}</span>
                </h2>
                <span className="ml-auto text-[13px] text-ink-muted">[{a.tier_tag}]</span>
              </div>
              <p className="mt-1 text-[13px] text-ink-muted">
                {sect ? (
                  <Link href={`/sects/${sect.id}/`} className="underline">
                    {sect.name_kr}
                  </Link>
                ) : (
                  a.lineage ?? '계보 미상'
                )}{' '}
                · {a.category} · {a.weapon_type} · {a.grade}
              </p>
              {a.alias && a.alias.length > 0 && (
                <p className="mt-0.5 text-[13px] text-ink-muted">이명: {a.alias.join(' · ')}</p>
              )}
              <p className="mt-2 text-sm leading-relaxed">{a.origin_and_principle}</p>
              {a.techniques.length > 0 && (
                <details className="mt-2 rounded-sm bg-ink/5 p-2.5">
                  <summary className="text-xs font-bold">초식 {a.techniques.length}개</summary>
                  <ol className="mt-1.5 space-y-1 text-xs">
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
              {a.synergy_note && <p className="mt-2 text-[13px] text-ink-muted">상성·운용: {a.synergy_note}</p>}
              {users.length > 0 && (
                <p className="mt-1.5 text-[13px] text-ink-muted">
                  연마자:{' '}
                  {users.map((u, i) => (
                    <span key={u.id}>
                      {i > 0 && ', '}
                      <Link href={`/figures/#${u.id}`} className="underline">
                        {u.name_kr}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
              <p className="mt-1.5 text-xs text-ink-muted">
                출처: {a.sources.map((s) => (s.author ? `${s.work} / ${s.author}` : s.work)).join(' · ')}
              </p>
            </li>,
            // 인피드 광고: 카드 FEED_AD_EVERY개마다 두 칸을 가로질러 한 줄
            (i + 1) % FEED_AD_EVERY === 0 && i + 1 < filtered.length ? (
              <li key={`ad-${a.id}`} className="md:col-span-2">
                <AdSlot slot={AD_SLOTS.feed} variant="in-feed" layoutKey={AD_FEED_LAYOUT_KEY} minHeight={160} className="my-2" />
              </li>
            ) : null,
          ];
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="mt-8 rounded-sm border border-dashed border-ink/25 p-6 text-center text-sm text-ink-muted">
          조건에 맞는 무공이 없습니다. 검색어나 필터를 풀어 보세요.
        </p>
      )}
    </div>
  );
}
