'use client';

import { useState } from 'react';
import { DATASETS, FILE_ORDER } from '@/lib/admin/schema';
import { ID_FORMAT, type DataFile } from '@/lib/admin/validate';
import Dialog from './Dialog';

/** Claude가 만들어 준 JSON을 붙여 넣어 한꺼번에 추가·갱신 (같은 ID는 덮어쓰기) */
export default function JsonImportDialog({ initialFile, onClose, onMerge }: { initialFile: DataFile; onClose: () => void; onMerge: (f: DataFile, records: any[]) => void }) {
  const [file, setFile] = useState<DataFile>(initialFile);
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  const parse = () => {
    try {
      // 코드 블록(```json … ```)째 붙여 넣어도 되게 감싼 부분을 벗긴다
      const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
      const v = JSON.parse(text);
      const arr = Array.isArray(v) ? v : [v];
      const bad = arr.filter((r) => !r || typeof r.id !== 'string' || !ID_FORMAT.test(r.id));
      if (bad.length) throw new Error(`ID가 없거나 형식이 틀린 항목이 ${bad.length}개 있습니다.`);
      onMerge(file, arr);
    } catch (e) {
      setError(e instanceof SyntaxError ? `JSON 문법 오류: ${e.message}` : (e as Error).message);
    }
  };

  return (
    <Dialog
      title="JSON 붙여넣기"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-md px-4 text-ink-soft hover:bg-hanji-deep">취소</button>
          <button type="button" disabled={!raw.trim()} onClick={parse} className="h-11 rounded-md bg-ink px-5 font-medium text-hanji disabled:opacity-50">합치기</button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">Claude 프로젝트에서 받은 JSON(배열 또는 객체 하나)을 붙여 넣으세요. 같은 ID가 있으면 새 내용으로 바뀝니다. 합친 뒤에도 게시하기 전까지는 사이트에 반영되지 않습니다.</p>
      <div role="radiogroup" aria-label="넣을 곳" className="mt-4 flex flex-wrap gap-1.5">
        {FILE_ORDER.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={file === f} onClick={() => setFile(f)} className={`min-h-10 rounded-full border px-4 text-sm ${file === f ? 'border-ink bg-ink text-hanji' : 'border-line-strong text-ink-soft'}`}>
            {DATASETS[f].label}
          </button>
        ))}
      </div>
      <textarea
        aria-label="JSON"
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setError(''); }}
        rows={12}
        spellCheck={false}
        placeholder={'[\n  { "id": "hua_shan", "name_kr": "화산파", … }\n]'}
        className="mt-3 w-full rounded-md border border-line-strong bg-white/70 p-3 font-mono text-sm"
      />
      {error && <p role="alert" className="mt-2 text-sm text-accent">{error}</p>}
    </Dialog>
  );
}
