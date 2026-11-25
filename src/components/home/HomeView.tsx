'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import SiteHeader from '@/components/ui/SiteHeader';
import SectDetailDrawer from '@/components/ui/SectDetailDrawer';
import { figures, martialArts, sects } from '@/lib/data';
import { FACTIONS, FACTION_SWATCH } from '@/config/map';
import type { Faction, Sect } from '@/types/wuxia';

// Leaflet은 window가 필요하므로 서버 렌더링(정적 빌드)에서 제외한다.
const WuxiaMap = dynamic(() => import('@/components/map/WuxiaMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-paper font-serif text-ink">
      강호 지도를 펼치는 중…
    </div>
  ),
});

type Hit = {
  kind: '문파' | '무공' | '인물';
  id: string;
  title: string;
  hanja: string;
  sub: string;
  href: string;
  keywords: string;
  sectId?: string;
};

const searchIndex: Hit[] = [
  ...sects.map((s) => ({
    kind: '문파' as const,
    id: s.id,
    title: s.name_kr,
    hanja: s.name_hanja,
    sub: `${s.faction} · ${s.region.province}`,
    href: `/sects/${s.id}/`,
    keywords: [s.name_kr, s.name_hanja, ...(s.alias ?? []), s.summary, s.philosophy ?? '', s.region.mountain ?? ''].join(' '),
    sectId: s.id,
  })),
  ...martialArts.map((a) => ({
    kind: '무공' as const,
    id: a.id,
    title: a.name_kr,
    hanja: a.name_hanja,
    sub: `${a.weapon_type} · ${a.grade}`,
    href: `/martial-arts/#${a.id}`,
    keywords: [a.name_kr, a.name_hanja, ...(a.alias ?? []), ...a.techniques.map((t) => `${t.name_kr} ${t.name_hanja}`)].join(' '),
  })),
  ...figures.map((f) => ({
    kind: '인물' as const,
    id: f.id,
    title: f.name_kr,
    hanja: f.name_hanja,
    sub: `${f.title} · ${f.realm?.level ?? '경지 미상'}`,
    href: `/figures/#${f.id}`,
    keywords: [f.name_kr, f.name_hanja, ...(f.alias ?? []), f.title].join(' '),
  })),
];

const fuse = new Fuse(searchIndex, {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'hanja', weight: 2 },
    { name: 'keywords', weight: 1 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 1,
});

export default function HomeView() {
  const router = useRouter();
  const [selected, setSelected] = useState<Sect | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [faction, setFaction] = useState<Faction | '전체'>('전체');
  const [showLabels, setShowLabels] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const visibleSects = useMemo(
    () => (faction === '전체' ? sects : sects.filter((s) => s.faction === faction)),
    [faction],
  );

  const results = useMemo(() => (query.trim() ? fuse.search(query.trim()).slice(0, 8).map((r) => r.item) : []), [query]);
  useEffect(() => setActive(0), [query]);

  // URL 해시(#sect=huashan)와 선택 상태를 맞춘다.
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/sect=([a-z0-9_]+)/);
      if (m) {
        const found = sects.find((s) => s.id === m[1]);
        if (found) setSelected(found);
      }
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  // '/' 키로 어디서든 검색창에 바로 들어가기, 바깥을 누르면 결과 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const choose = useCallback((sect: Sect | null) => {
    setSelected(sect);
    const url = sect ? `${window.location.pathname}#sect=${sect.id}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, []);
  const close = useCallback(() => choose(null), [choose]);

  const pick = (item: Hit | undefined) => {
    if (!item) return;
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
    if (item.kind === '문파' && item.sectId) {
      const s = sects.find((x) => x.id === item.sectId);
      if (s) {
        // 다른 세력만 보고 있었다면 전체로 돌려 선택한 문파가 지도에 보이게 한다
        if (faction !== '전체' && s.faction !== faction) setFaction('전체');
        choose(s);
      }
    } else {
      router.push(item.href);
    }
  };

  const counts = useMemo(() => {
    const map = new Map<Faction, number>();
    sects.forEach((s) => map.set(s.faction, (map.get(s.faction) ?? 0) + 1));
    return map;
  }, []);

  const showList = open && query.trim().length > 0;
  const chip = (on: boolean) =>
    on
      ? 'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-ink bg-ink px-3.5 text-sm text-hanji shadow-sm'
      : 'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-hanji/95 px-3.5 text-sm text-ink-soft shadow-sm hover:border-ink-soft';

  return (
    <main id="main" className="relative" data-drawer={selected ? 'open' : 'closed'}>
      <h1 className="sr-only">무림여지도 — 무협 문파 지도</h1>
      {/* 상세 패널(데스크톱 420px)이 열리면 상단 메뉴가 가리지 않게 오른쪽을 비운다 */}
      <div className={selected ? "md:*:pr-[436px]" : ""}>
        <SiteHeader overlay />
      </div>

      <WuxiaMap sects={visibleSects} onSelectSect={(s) => choose(s)} selectedId={selected?.id ?? null} showLabels={showLabels} />

      {/* 검색·필터 패널 */}
      <div className="pointer-events-none absolute inset-x-0 top-[76px] z-[800] px-3 sm:px-4">
        <div className="mx-auto max-w-7xl">
          <div ref={boxRef} className="pointer-events-auto relative w-full max-w-md">
            <Search size={18} aria-hidden className="pointer-events-none absolute left-3.5 top-[15px] text-ink-muted" />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-label="문파·무공·초식·인물 통합 검색"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => (results.length ? (i + 1) % results.length : 0));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  pick(results[active]);
                } else if (e.key === 'Escape') {
                  if (query) setQuery('');
                  else inputRef.current?.blur();
                  setOpen(false);
                }
              }}
              placeholder="문파 · 무공 · 초식 · 인물 검색"
              className="h-12 w-full rounded-lg border border-line-strong bg-hanji/95 pl-10 pr-11 font-serif text-base shadow-[var(--shadow-panel)] outline-none placeholder:text-ink-muted focus:border-ink [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-ink-muted hover:text-ink"
              >
                <X size={18} aria-hidden />
                <span className="sr-only">검색어 지우기</span>
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3.5 top-3 hidden rounded border border-line px-1.5 text-xs text-ink-muted sm:block">/</kbd>
            )}
            {showList && (
              <div className="mt-1.5 overflow-hidden rounded-lg border border-line-strong bg-hanji shadow-[var(--shadow-panel)]">
                {results.length > 0 ? (
                  <ul id={listId} role="listbox" aria-label="검색 결과" className="max-h-[52vh] overflow-y-auto py-1">
                    {results.map((item, i) => (
                      <li
                        key={`${item.kind}-${item.id}`}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={i === active}
                        onPointerEnter={() => setActive(i)}
                        onClick={() => pick(item)}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? 'bg-accent-soft' : ''}`}
                      >
                        <span className="w-10 shrink-0 rounded border border-line text-center text-xs text-ink-muted">{item.kind}</span>
                        <span className="min-w-0 flex-1 truncate">
                          <strong>{item.title}</strong>
                          <span className="ml-1.5 text-sm text-ink-muted">{item.hanja}</span>
                        </span>
                        <span className="hidden shrink-0 text-sm text-ink-muted sm:inline">{item.sub}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p id={listId} className="px-4 py-3 text-sm text-ink-soft">
                    ‘{query}’에 맞는 기록이 없습니다. 한자나 초식 이름으로도 찾아보세요.
                  </p>
                )}
                <p aria-live="polite" className="sr-only">
                  {results.length ? `검색 결과 ${results.length}건` : '검색 결과 없음'}
                </p>
              </div>
            )}
          </div>

          {/* 세력 필터 겸 범례 — 모바일에서는 한 줄 가로 스크롤 */}
          <div
            role="group"
            aria-label="세력 필터"
            className="pointer-events-auto -mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            <button type="button" aria-pressed={faction === '전체'} onClick={() => setFaction('전체')} className={chip(faction === '전체')}>
              전체 <span className="text-xs opacity-80">{sects.length}</span>
            </button>
            {FACTIONS.filter((f) => counts.get(f)).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={faction === f}
                onClick={() => setFaction(faction === f ? '전체' : f)}
                className={chip(faction === f)}
              >
                <span className={`inline-block size-2.5 rounded-full border ${FACTION_SWATCH[f]}`} aria-hidden />
                {f} <span className="text-xs opacity-80">{counts.get(f)}</span>
              </button>
            ))}
            <button
              type="button"
              role="switch"
              aria-checked={showLabels}
              onClick={() => setShowLabels((v) => !v)}
              className={`${chip(false)} sm:ml-auto`}
            >
              <span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${showLabels ? 'bg-ink' : 'bg-line-strong'}`}>
                <span className={`absolute left-0 top-0.5 size-4 rounded-full bg-hanji shadow transition-transform ${showLabels ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
              </span>
              이름표
            </button>
          </div>
        </div>
      </div>

      {/* 하단 요약 — 상세 패널이 열리면 숨김 */}
      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[800] px-3 pb-3 sm:px-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-2 pr-14">
            <p role="status" className="pointer-events-auto flex items-center gap-2 rounded-full border border-line-strong bg-hanji/95 px-4 py-2 text-sm text-ink-soft shadow-sm">
              {faction === '전체' ? (
                <>문파 {sects.length} · 무공 {martialArts.length} · 인물 {figures.length}</>
              ) : (
                <>
                  <b className="text-ink">{faction}</b> 문파 {visibleSects.length}곳 표시 중
                  <button type="button" onClick={() => setFaction('전체')} className="-my-1 ml-1 rounded-full bg-ink px-3 py-1 text-hanji">
                    전체 보기
                  </button>
                </>
              )}
            </p>
            <p className="pointer-events-auto rounded-full border border-line bg-hanji/90 px-3.5 py-2 text-xs text-ink-muted shadow-sm sm:px-4 sm:text-sm">
              표식을 누르면 문파 기록이 열립니다<span className="hidden md:inline"> · <kbd className="rounded border border-line px-1 text-xs">/</kbd> 검색</span>
            </p>
            <Link
              href="/sects/"
              className="pointer-events-auto inline-flex min-h-9 items-center rounded-full border border-line-strong bg-hanji/95 px-3.5 py-2 text-xs font-medium text-ink shadow-sm hover:bg-hanji-deep sm:px-4 sm:text-sm"
            >
              목록으로 보기 →
            </Link>
          </div>
        </div>
      )}

      <SectDetailDrawer sect={selected} onClose={close} />
    </main>
  );
}
