'use client';

import { useMemo, useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { DATASETS, getIn, setIn, type Field, type SubField } from '@/lib/admin/schema';
import { ENUMS, ID_FORMAT, type DataFile, type Datasets, type Issue } from '@/lib/admin/validate';
import MapPicker from './MapPicker';

interface Props {
  file: DataFile;
  record: any;
  isNew: boolean;
  datasets: Datasets;
  issues: Issue[];
  onChange: (next: any) => void;
  onDelete: () => void;
}

const inputCls =
  'h-11 w-full rounded-md border border-line-strong bg-white/70 px-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-ink focus:outline-none';

/** 스키마(schema.ts)를 읽어 입력칸을 자동으로 그리는 편집기 */
export default function RecordEditor({ file, record, isNew, datasets, issues, onChange, onDelete }: Props) {
  const def = DATASETS[file];
  const set = (path: string, v: unknown) => onChange(setIn(record, path, v));
  const idTaken = isNew && record.id && datasets[file].filter((r) => r.id === record.id).length > 1;

  return (
    <div className="pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{isNew ? `새 ${def.label}` : `${def.label} 편집`}</p>
          <h2 className="truncate font-serif text-2xl font-bold">
            {record.name_kr || '(이름 없음)'} <span className="text-lg font-normal text-ink-muted">{record.name_hanja}</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-line px-3 text-sm text-accent hover:border-accent hover:bg-accent-soft"
        >
          <Trash2 size={16} aria-hidden /> 삭제
        </button>
      </div>

      {issues.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
          {issues.map((i, k) => (
            <li key={k}>• {i.message}</li>
          ))}
        </ul>
      )}

      {/* ID */}
      <section className="mt-6">
        <Label text="ID (주소에 쓰이는 영문 이름)" required />
        {isNew ? (
          <>
            <input
              value={record.id}
              onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[\s-]+/g, '_'))}
              placeholder="hua_shan"
              autoCapitalize="off"
              spellCheck={false}
              className={`${inputCls} font-mono`}
            />
            <p className={`mt-1 text-sm ${record.id && (!ID_FORMAT.test(record.id) || idTaken) ? 'text-accent' : 'text-ink-muted'}`}>
              {idTaken ? '이미 있는 ID입니다.' : '영문 소문자·숫자·밑줄(_)만. 게시 후에는 바꿀 수 없습니다.'}
            </p>
          </>
        ) : (
          <p className="flex h-11 items-center rounded-md bg-hanji-deep px-3 font-mono text-ink-soft">{record.id}</p>
        )}
      </section>

      {def.sections.map((sec) => (
        <fieldset key={sec.title} className="mt-8">
          <legend className="mb-1 w-full border-b border-line pb-1.5 font-serif text-lg font-bold">{sec.title}</legend>
          <div className="grid gap-x-4 gap-y-5 pt-3 sm:grid-cols-2">
            {sec.fields.map((f) => (
              <div key={f.path} className={wide(f) ? 'sm:col-span-2' : ''}>
                <FieldInput field={f} file={file} record={record} datasets={datasets} value={getIn(record, f.path)} onChange={(v) => set(f.path, v)} />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const wide = (f: Field) => ['textarea', 'position', 'list', 'refs', 'realm'].includes(f.kind);

function Label({ text, required, help, htmlFor }: { text: string; required?: boolean; help?: string; htmlFor?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-[0.9375rem] font-medium">
        {text}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </label>
      {help && <p className="text-sm text-ink-muted">{help}</p>}
    </div>
  );
}

function FieldInput({ field: f, file, record, datasets, value, onChange }: { field: Field; file: DataFile; record: any; datasets: Datasets; value: any; onChange: (v: unknown) => void }) {
  const id = `f-${f.path}`;
  const label = <Label text={f.label} required={f.required} help={f.help} htmlFor={id} />;
  const nullIfEmpty = (s: string) => (s.trim() === '' ? null : s);

  switch (f.kind) {
    case 'text':
      return (
        <>
          {label}
          <input id={id} value={value ?? ''} placeholder={f.placeholder} onChange={(e) => onChange(f.required ? e.target.value : nullIfEmpty(e.target.value))} className={inputCls} />
        </>
      );
    case 'textarea':
      return (
        <>
          {label}
          <textarea
            id={id}
            rows={f.rows ?? 3}
            value={value ?? ''}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.required ? e.target.value : nullIfEmpty(e.target.value))}
            className="w-full rounded-md border border-line-strong bg-white/70 px-3 py-2.5 text-base leading-relaxed focus:border-ink focus:outline-none"
          />
          <p className="mt-0.5 text-right text-xs text-ink-muted">{(value ?? '').length}자</p>
        </>
      );
    case 'select':
      return (
        <>
          {label}
          <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
            {f.nullable && <option value="">(없음)</option>}
            {f.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </>
      );
    case 'ref':
      return (
        <>
          {label}
          <RefSelect id={id} target={f.target} datasets={datasets} value={value} nullLabel={f.nullable ? (f.nullLabel ?? '없음') : undefined} onChange={onChange} />
        </>
      );
    case 'refs': {
      const list: string[] = Array.isArray(value) ? value : [];
      const pool = f.onlyOwn ? datasets[f.target].filter((r) => r.sect_id === record.id) : datasets[f.target];
      return (
        <>
          {label}
          <MultiRef ids={list} pool={pool} all={datasets[f.target]} onChange={onChange} emptyText={f.onlyOwn ? '이 문파 소속 무공이 아직 없습니다. 무공 탭에서 소속 문파를 먼저 지정하세요.' : undefined} />
        </>
      );
    }
    case 'tags':
      return (
        <>
          {label}
          <input
            id={id}
            defaultValue={(value ?? []).join(', ')}
            placeholder={f.placeholder}
            onBlur={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className={inputCls}
          />
        </>
      );
    case 'position': {
      const own = file === 'sects.json' ? 'region.map_position' : 'map_position';
      const others = datasets[file]
        .filter((r) => r.id !== record.id)
        .map((r) => ({ ...(getIn(r, own) ?? { x: -100, y: -100 }), label: r.name_kr }));
      return (
        <>
          {label}
          <MapPicker value={value ?? null} others={others} onChange={onChange} />
        </>
      );
    }
    case 'realm': {
      const v = value ?? null;
      return (
        <>
          {label}
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label="경지"
              value={v?.level ?? ''}
              onChange={(e) => onChange(e.target.value ? { level: e.target.value, basis: v?.basis ?? '신무협환산' } : null)}
              className={inputCls}
            >
              <option value="">(경지 없음)</option>
              {ENUMS.realm_level.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select
              aria-label="경지 근거"
              disabled={!v}
              value={v?.basis ?? ''}
              onChange={(e) => onChange({ ...v, basis: e.target.value })}
              className={`${inputCls} disabled:opacity-50`}
            >
              {ENUMS.realm_basis.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </>
      );
    }
    case 'list': {
      const rows: any[] = Array.isArray(value) ? value : [];
      const blankRow = Object.fromEntries(f.item.map((s) => [s.key, s.kind === 'select' ? s.options[0] : s.key === 'author' ? null : '']));
      return (
        <>
          {label}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-line bg-hanji-deep/50 p-2.5">
                <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
                  {f.item.map((s) => (
                    <SubInput key={s.key} sub={s} datasets={datasets} value={row?.[s.key]} onChange={(v) => onChange(rows.map((r, k) => (k === i ? { ...r, [s.key]: v } : r)))} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, k) => k !== i))}
                  className="grid size-10 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-accent-soft hover:text-accent"
                >
                  <X size={18} aria-hidden />
                  <span className="sr-only">이 줄 지우기</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange([...rows, blankRow])}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 text-sm text-ink-soft hover:border-ink hover:text-ink"
            >
              <Plus size={16} aria-hidden /> {f.addLabel}
            </button>
          </div>
        </>
      );
    }
  }
}

function SubInput({ sub, datasets, value, onChange }: { sub: SubField; datasets: Datasets; value: any; onChange: (v: unknown) => void }) {
  const cls = 'h-10 w-full rounded-md border border-line-strong bg-white/70 px-2.5 text-[0.9375rem] focus:border-ink focus:outline-none';
  if (sub.kind === 'select')
    return (
      <select aria-label={sub.label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
        {sub.options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  if (sub.kind === 'ref') return <RefSelect target={sub.target} datasets={datasets} value={value} onChange={onChange} small ariaLabel={sub.label} />;
  return (
    <input
      aria-label={sub.label}
      placeholder={sub.placeholder ?? sub.label}
      value={value ?? ''}
      onChange={(e) => onChange(sub.key === 'author' && !e.target.value.trim() ? null : e.target.value)}
      className={cls}
    />
  );
}

function RefSelect({ id, target, datasets, value, onChange, nullLabel, small, ariaLabel }: { id?: string; target: DataFile; datasets: Datasets; value: any; onChange: (v: unknown) => void; nullLabel?: string; small?: boolean; ariaLabel?: string }) {
  const options = useMemo(() => [...datasets[target]].sort((a, b) => String(a.name_kr).localeCompare(String(b.name_kr), 'ko')), [datasets, target]);
  const missing = value && !options.some((o) => o.id === value);
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={small ? 'h-10 w-full rounded-md border border-line-strong bg-white/70 px-2 text-[0.9375rem]' : inputCls}
    >
      <option value="">{nullLabel ?? '— 고르세요 —'}</option>
      {missing && <option value={value}>⚠ 없는 항목: {value}</option>}
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name_kr} ({o.name_hanja}) · {o.id}
        </option>
      ))}
    </select>
  );
}

/** 여러 개 고르기: 고른 항목은 칩으로, 추가는 검색해서 */
function MultiRef({ ids, pool, all, onChange, emptyText }: { ids: string[]; pool: any[]; all: any[]; onChange: (v: string[]) => void; emptyText?: string }) {
  const [q, setQ] = useState('');
  const byId = useMemo(() => new Map(all.map((r) => [r.id, r])), [all]);
  const candidates = pool.filter((r) => !ids.includes(r.id) && (!q || r.name_kr.includes(q) || r.name_hanja?.includes(q) || r.id.includes(q))).slice(0, 8);

  return (
    <div className="rounded-lg border border-line-strong bg-white/50 p-2.5">
      <div className="flex flex-wrap gap-1.5">
        {ids.length === 0 && <span className="px-1 py-1 text-sm text-ink-muted">고른 항목 없음</span>}
        {ids.map((id) => {
          const r = byId.get(id);
          return (
            <span key={id} className={`inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm ${r ? 'border-line-strong bg-hanji' : 'border-accent text-accent'}`}>
              {r ? r.name_kr : `⚠ ${id}`}
              <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="grid size-6 place-items-center rounded-full hover:bg-accent-soft">
                <X size={13} aria-hidden />
                <span className="sr-only">{r?.name_kr ?? id} 빼기</span>
              </button>
            </span>
          );
        })}
      </div>
      {pool.length === 0 && emptyText ? (
        <p className="mt-2 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름으로 찾아 추가…" className="mt-2 h-10 w-full rounded-md border border-line bg-white/80 px-2.5 text-[0.9375rem]" />
          {(q || candidates.length <= 8) && candidates.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {candidates.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...ids, r.id]);
                      setQ('');
                    }}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-line-strong px-3 text-sm text-ink-soft hover:border-ink hover:text-ink"
                  >
                    <Plus size={13} aria-hidden /> {r.name_kr}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
