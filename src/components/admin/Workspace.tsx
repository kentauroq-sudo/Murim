'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, ExternalLink, FileText, LogOut, Plus, RotateCcw, Search, Send } from 'lucide-react';
import BrandSeal from '@/components/ui/BrandSeal';
import { adminApi, type PublishError } from '@/lib/admin/api';
import { DATASETS, FILE_ORDER, findReferences } from '@/lib/admin/schema';
import { validateAll, type DataFile, type Datasets, type Issue } from '@/lib/admin/validate';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config/map';
import RecordEditor from './RecordEditor';
import JsonImportDialog from './JsonImportDialog';
import PublishDialog, { type ChangeSummary } from './PublishDialog';

const DRAFT_KEY = 'murim-admin-draft-v1';
const NEW_FLAG = '_new'; // 새로 만든 항목 표시 (게시 전에 지운다)

const strip = (d: Datasets): Datasets =>
  Object.fromEntries(FILE_ORDER.map((f) => [f, d[f].map(({ [NEW_FLAG]: _, ...r }) => r)])) as Datasets;

const store = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  set: (v: unknown) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  },
};

interface Props {
  user: string;
  missingEnv: string[];
  onLogout: () => void;
}

export default function Workspace({ user, missingEnv, onLogout }: Props) {
  const [original, setOriginal] = useState<Datasets | null>(null);
  const [data, setData] = useState<Datasets | null>(null);
  const [head, setHead] = useState('');
  const [loadError, setLoadError] = useState('');
  const [draftOffer, setDraftOffer] = useState<{ data: Datasets; savedAt: string } | null>(null);

  const [file, setFile] = useState<DataFile>('sects.json');
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; link?: string; tone?: 'ok' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const r = await adminApi.load();
      const d = Object.fromEntries(FILE_ORDER.map((f) => [f, r.data[f] ?? []])) as Datasets;
      setOriginal(d);
      setData(d);
      setHead(r.head);
      const draft = store.get();
      if (draft?.head === r.head && JSON.stringify(strip(draft.data)) !== JSON.stringify(d)) setDraftOffer(draft);
      else store.clear();
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── 파생 상태 */
  const clean = useMemo(() => (data ? strip(data) : null), [data]);
  const deferred = useDeferredValue(clean);
  const issues = useMemo(() => (deferred ? validateAll(structuredClone(deferred), { width: MAP_WIDTH, height: MAP_HEIGHT }) : []), [deferred]);
  const issuesById = useMemo(() => {
    const m = new Map<string, Issue[]>();
    issues.forEach((i) => m.set(`${i.file}:${i.id}`, [...(m.get(`${i.file}:${i.id}`) ?? []), i]));
    return m;
  }, [issues]);

  const changes: ChangeSummary[] = useMemo(() => {
    if (!clean || !original) return [];
    return FILE_ORDER.map((f) => {
      const before = new Map(original[f].map((r) => [r.id, JSON.stringify(r)]));
      const after = new Map(clean[f].map((r) => [r.id, JSON.stringify(r)]));
      let added = 0, modified = 0, removed = 0;
      after.forEach((v, id) => (!before.has(id) ? added++ : before.get(id) !== v && modified++));
      before.forEach((_, id) => !after.has(id) && removed++);
      const orderChanged = !added && !modified && !removed && JSON.stringify(original[f]) !== JSON.stringify(clean[f]);
      return { file: f, label: DATASETS[f].label, added, modified, removed: removed, dirty: added + modified + removed > 0 || orderChanged };
    }).filter((c) => c.dirty);
  }, [clean, original]);
  const dirty = changes.length > 0;

  // 임시저장 + 창 닫기 경고
  useEffect(() => {
    if (!data || !head) return;
    if (dirty) store.set({ head, data, savedAt: new Date().toISOString() });
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [data, head, dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.tone === 'error' ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loadError) {
    return (
      <Shell user={user} onLogout={onLogout}>
        <div className="mx-auto mt-16 max-w-lg rounded-xl border border-accent/40 bg-accent-soft p-6 text-accent">
          <p className="font-serif text-lg font-bold">데이터를 불러오지 못했습니다</p>
          <p className="mt-2 text-sm">{loadError}</p>
          <button type="button" onClick={load} className="mt-4 rounded-md bg-ink px-4 py-2 text-hanji">다시 시도</button>
        </div>
      </Shell>
    );
  }
  if (!data || !original || !clean) {
    return <Shell user={user} onLogout={onLogout}><p className="p-10 text-center text-ink-soft">기록을 불러오는 중…</p></Shell>;
  }

  const list = data[file];
  const origById = new Map(original[file].map((r) => [r.id, JSON.stringify(r)]));
  const q = query.trim();
  const visible = list
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !q || r.name_kr?.includes(q) || r.name_hanja?.includes(q) || r.id?.includes(q.toLowerCase()));
  const current = selected !== null ? list[selected] : null;

  const updateRecord = (i: number, next: any) =>
    setData((d) => (d ? { ...d, [file]: d[file].map((r, k) => (k === i ? next : r)) } : d));

  const addRecord = () => {
    const blank = { ...DATASETS[file].blank(), [NEW_FLAG]: true };
    setData((d) => (d ? { ...d, [file]: [...d[file], blank] } : d));
    setSelected(list.length);
    setQuery('');
  };

  const deleteRecord = (i: number) => {
    const r = list[i];
    const refs = findReferences(clean, file, r.id);
    const msg =
      `'${r.name_kr || r.id}'을(를) 삭제할까요?` +
      (refs.length ? `\n\n이 항목을 가리키는 곳이 ${refs.length}군데 있어 게시 전에 함께 고쳐야 합니다:\n- ${refs.slice(0, 6).join('\n- ')}${refs.length > 6 ? '\n…' : ''}` : '') +
      '\n\n게시하기 전까지는 "되돌리기"로 되살릴 수 있습니다.';
    if (!window.confirm(msg)) return;
    setData((d) => (d ? { ...d, [file]: d[file].filter((_, k) => k !== i) } : d));
    setSelected(null);
  };

  const revertAll = () => {
    if (!window.confirm('게시하지 않은 변경을 모두 버리고 마지막으로 게시된 상태로 돌아갈까요?')) return;
    setData(original);
    setSelected(null);
    store.clear();
  };

  const copyIndex = async () => {
    const lines = [`# 수집 완료 데이터 인덱스 (ID 매핑)`, `> 자동 생성: ${new Date().toISOString().slice(0, 10)}`];
    FILE_ORDER.forEach((f) => {
      lines.push('', `## ${DATASETS[f].label} (${clean[f].length}건)`);
      clean[f].forEach((r) => lines.push(`- ${r.id}: ${r.name_kr}(${r.name_hanja}) [${[r.faction, r.weapon_type, r.type, r.tier_tag].filter(Boolean).join('/')}]`));
    });
    await navigator.clipboard.writeText(lines.join('\n'));
    setToast({ text: '04_collected_index.md 내용을 복사했습니다. 프로젝트 문서에 붙여 넣으세요.' });
  };

  const publish = async (message: string) => {
    const files = Object.fromEntries(changes.map((c) => [c.file, clean[c.file]])) as Partial<Datasets>;
    try {
      const r = await adminApi.publish(files, head, message);
      store.clear();
      setPublishOpen(false);
      setToast({ text: '게시했습니다. 1~3분 뒤 사이트에 반영됩니다.', link: r.url });
      await load();
    } catch (e) {
      const err = e as PublishError;
      setToast({ text: err.message, tone: 'error' });
      if (err.status === 401) onLogout();
    }
  };

  return (
    <Shell user={user} onLogout={onLogout}>
      {missingEnv.length > 0 && (
        <p role="alert" className="bg-accent-soft px-4 py-2 text-sm text-accent">
          서버 설정이 빠졌습니다: {missingEnv.join(', ')} — Cloudflare Pages 환경변수를 확인하세요.
        </p>
      )}
      {draftOffer && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-place-bg px-4 py-2.5 text-sm">
          <span>
            게시하지 않은 작업이 남아 있습니다 ({new Date(draftOffer.savedAt).toLocaleString('ko-KR')}).
          </span>
          <button type="button" onClick={() => { setData(draftOffer.data); setDraftOffer(null); }} className="rounded-md bg-ink px-3 py-1.5 text-hanji">이어서 하기</button>
          <button type="button" onClick={() => { store.clear(); setDraftOffer(null); }} className="rounded-md px-3 py-1.5 text-ink-soft underline">버리기</button>
        </div>
      )}

      <div className="mx-auto grid max-w-[1400px] gap-0 md:grid-cols-[13rem_20rem_1fr]">
        {/* 데이터 종류 */}
        <nav aria-label="데이터 종류" className={`border-line md:sticky md:top-[57px] md:h-[calc(100dvh-57px)] md:self-start md:overflow-y-auto md:border-r ${current ? 'hidden md:block' : ''}`}>
          <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
            {FILE_ORDER.map((f) => {
              const c = changes.find((x) => x.file === f);
              const errCount = issues.filter((i) => i.file === f).length;
              return (
                <li key={f} className="shrink-0">
                  <button
                    type="button"
                    aria-current={file === f ? 'page' : undefined}
                    onClick={() => { setFile(f); setSelected(null); setQuery(''); }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left ${file === f ? 'bg-ink text-hanji' : 'hover:bg-hanji-deep'}`}
                  >
                    <span className="font-serif font-bold">{DATASETS[f].label}</span>
                    <span className={`text-sm ${file === f ? 'text-hanji/70' : 'text-ink-muted'}`}>{data[f].length}</span>
                    <span className="ml-auto flex gap-1">
                      {errCount > 0 && <span title="오류" className="rounded bg-accent px-1.5 text-xs text-hanji">{errCount}</span>}
                      {c && <span title="게시 안 한 변경" className="size-2 self-center rounded-full bg-place" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="hidden space-y-1 border-t border-line p-3 md:block">
            <ToolButton icon={<FileText size={16} />} onClick={() => setImportOpen(true)}>JSON 붙여넣기</ToolButton>
            <ToolButton icon={<Copy size={16} />} onClick={copyIndex}>수집 인덱스 복사</ToolButton>
          </div>
        </nav>

        {/* 목록 */}
        <section aria-label={`${DATASETS[file].label} 목록`} className={`border-line md:sticky md:top-[57px] md:h-[calc(100dvh-57px)] md:self-start md:overflow-y-auto md:border-r ${current ? 'hidden md:block' : ''}`}>
          <div className="sticky top-[57px] z-10 space-y-2 border-b border-line bg-hanji p-3 md:top-0">
            <div className="relative">
              <Search size={17} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${DATASETS[file].label} 찾기`} className="h-11 w-full rounded-md border border-line-strong bg-white/60 pl-9 pr-3 text-base" />
            </div>
            <button type="button" onClick={addRecord} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-ink font-medium text-hanji hover:bg-ink-soft">
              <Plus size={18} aria-hidden /> 새 {DATASETS[file].label} 추가
            </button>
          </div>
          <ul className={dirty ? 'pb-20' : ''}>
            {visible.length === 0 && <li className="p-6 text-center text-sm text-ink-muted">항목이 없습니다.</li>}
            {visible.map(({ r, i }) => {
              const errs = issuesById.get(`${file}:${r.id}`)?.length ?? 0;
              const state = r[NEW_FLAG] ? '새 항목' : origById.get(r.id) !== JSON.stringify(r) ? '수정됨' : '';
              return (
                <li key={`${r.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-current={selected === i ? 'true' : undefined}
                    className={`flex w-full items-start gap-2 border-b border-line px-4 py-3 text-left ${selected === i ? 'bg-accent-soft' : 'hover:bg-hanji-deep'}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif font-bold">
                        {r.name_kr || '(이름 없음)'} <span className="font-normal text-ink-muted">{r.name_hanja}</span>
                      </span>
                      <span className="block truncate text-sm text-ink-muted">{DATASETS[file].subtitle(r) || r.id}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {state && <span className="rounded bg-place-bg px-1.5 py-0.5 text-xs text-place">{state}</span>}
                      {errs > 0 && <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-hanji">오류 {errs}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 편집 */}
        <section aria-label="편집" className={`px-4 py-5 sm:px-6 ${current ? '' : 'hidden md:block'}`}>
          {current ? (
            <>
              <button type="button" onClick={() => setSelected(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft md:hidden">
                <ArrowLeft size={16} aria-hidden /> 목록으로
              </button>
              <RecordEditor
                key={`${file}:${selected}`}
                file={file}
                record={current}
                isNew={Boolean(current[NEW_FLAG])}
                datasets={clean}
                issues={issuesById.get(`${file}:${current.id}`) ?? []}
                onChange={(next) => updateRecord(selected!, next)}
                onDelete={() => deleteRecord(selected!)}
              />
            </>
          ) : (
            <div className="mx-auto mt-10 max-w-md text-center text-ink-soft">
              <p className="font-serif text-xl text-ink">왼쪽 목록에서 항목을 고르세요</p>
              <p className="mt-2 text-sm">고친 내용은 이 브라우저에 자동으로 임시저장되고, 아래 <b>게시하기</b>를 눌러야 사이트에 반영됩니다.</p>
              <dl className="mt-8 grid grid-cols-3 gap-2 text-left sm:grid-cols-5">
                {FILE_ORDER.map((f) => (
                  <div key={f} className="rounded-lg border border-line bg-hanji-deep p-3">
                    <dt className="text-xs text-ink-muted">{DATASETS[f].label}</dt>
                    <dd className="font-serif text-2xl font-bold">{data[f].length}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      </div>

      {/* 게시 막대 */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-hanji/95 shadow-[0_-6px_20px_-8px_rgb(28_27_24/0.3)] backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
            <p className="text-sm">
              <b>게시 안 한 변경</b> ·{' '}
              {changes.map((c) => `${c.label} ${c.added + c.modified + c.removed || '순서'}`).join(', ')}
              {issues.length > 0 && <span className="ml-2 text-accent">오류 {issues.length}건</span>}
            </p>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={revertAll} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-line-strong px-4 text-ink-soft hover:bg-hanji-deep">
                <RotateCcw size={16} aria-hidden /> 되돌리기
              </button>
              <button type="button" onClick={() => setPublishOpen(true)} className="inline-flex h-11 items-center gap-1.5 rounded-md bg-accent px-5 font-bold text-hanji hover:bg-accent-hover">
                <Send size={16} aria-hidden /> 게시하기
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <JsonImportDialog
          initialFile={file}
          onClose={() => setImportOpen(false)}
          onMerge={(f, incoming) => {
            const map = new Map(data[f].map((r) => [r.id, r]));
            let added = 0, updated = 0;
            incoming.forEach((r) => {
              if (map.has(r.id)) updated++;
              else added++;
              map.set(r.id, map.has(r.id) ? r : { ...r, [NEW_FLAG]: true });
            });
            setData({ ...data, [f]: [...map.values()] });
            setFile(f);
            setSelected(null);
            setImportOpen(false);
            setToast({ text: `${DATASETS[f].label}: 새로 ${added}건, 갱신 ${updated}건을 합쳤습니다. 확인 후 게시하세요.` });
          }}
        />
      )}
      {publishOpen && <PublishDialog changes={changes} issues={issues} onClose={() => setPublishOpen(false)} onPublish={publish} onJump={(f, id) => { setFile(f); setSelected(data[f].findIndex((r) => r.id === id)); setPublishOpen(false); }} />}

      {toast && (
        <div role="status" className={`fixed bottom-20 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-[var(--shadow-panel)] ${toast.tone === 'error' ? 'bg-accent text-hanji' : 'bg-ink text-hanji'}`}>
          {toast.text}
          {toast.link && (
            <a href={toast.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
              기록 보기 <ExternalLink size={13} aria-hidden />
            </a>
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ user, onLogout, children }: { user: string; onLogout: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-hanji">
      <header className="sticky top-0 z-20 flex h-[57px] items-center gap-3 border-b border-line-strong bg-hanji/95 px-4 backdrop-blur">
        <BrandSeal />
        <p className="font-serif text-lg font-bold">무림여지도 <span className="font-sans text-sm font-normal text-ink-muted">관리자</span></p>
        <div className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/" target="_blank" className="hidden items-center gap-1 rounded-md px-3 py-2 text-ink-soft hover:bg-hanji-deep sm:inline-flex">
            사이트 보기 <ExternalLink size={14} aria-hidden />
          </Link>
          <span className="hidden px-2 text-ink-muted sm:inline">{user}</span>
          <button type="button" onClick={onLogout} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line px-3 text-ink-soft hover:bg-hanji-deep">
            <LogOut size={16} aria-hidden /> 로그아웃
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}

function ToolButton({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-ink-soft hover:bg-hanji-deep hover:text-ink">
      {icon}
      {children}
    </button>
  );
}
