'use client';

import { useState } from 'react';
import { DATASETS } from '@/lib/admin/schema';
import type { DataFile, Issue } from '@/lib/admin/validate';
import Dialog from './Dialog';

export interface ChangeSummary {
  file: DataFile;
  label: string;
  added: number;
  modified: number;
  removed: number;
  dirty: boolean;
}

export default function PublishDialog({ changes, issues, onClose, onPublish, onJump }: { changes: ChangeSummary[]; issues: Issue[]; onClose: () => void; onPublish: (msg: string) => Promise<void>; onJump: (f: DataFile, id: string) => void }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const blocked = issues.length > 0;

  return (
    <Dialog
      title={blocked ? '먼저 고칠 곳이 있습니다' : '사이트에 게시'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-md px-4 text-ink-soft hover:bg-hanji-deep">닫기</button>
          {!blocked && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => { setBusy(true); await onPublish(msg); setBusy(false); }}
              className="h-11 rounded-md bg-accent px-5 font-bold text-hanji hover:bg-accent-hover disabled:opacity-60"
            >
              {busy ? '게시 중…' : '게시하기'}
            </button>
          )}
        </>
      }
    >
      {blocked ? (
        <>
          <p className="text-sm text-ink-soft">아래 오류를 고쳐야 게시할 수 있습니다. 항목을 누르면 바로 이동합니다.</p>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {issues.slice(0, 50).map((i, k) => (
              <li key={k}>
                <button type="button" onClick={() => onJump(i.file, i.id)} className="flex w-full gap-3 px-3 py-2.5 text-left text-sm hover:bg-hanji-deep">
                  <span className="shrink-0 rounded border border-line px-1.5 text-xs text-ink-muted">{DATASETS[i.file].label}</span>
                  <span className="font-mono text-ink-soft">{i.id}</span>
                  <span className="text-accent">{i.message}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <ul className="space-y-1.5">
            {changes.map((c) => (
              <li key={c.file} className="flex justify-between rounded-md bg-hanji-deep px-3 py-2">
                <span className="font-serif font-bold">{c.label}</span>
                <span className="text-sm text-ink-soft">
                  {[c.added && `추가 ${c.added}`, c.modified && `수정 ${c.modified}`, c.removed && `삭제 ${c.removed}`].filter(Boolean).join(' · ') || '순서 변경'}
                </span>
              </li>
            ))}
          </ul>
          <label className="mt-5 block text-sm font-medium" htmlFor="publish-msg">무엇을 바꿨나요? (선택, 변경 기록에 남습니다)</label>
          <input id="publish-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="예: 화산파 인물 3명 추가" className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-white/70 px-3 text-base" />
          <p className="mt-3 text-sm text-ink-muted">게시하면 사이트가 자동으로 다시 만들어져 1~3분 뒤 반영됩니다. 잘못 올려도 GitHub 기록에서 되돌릴 수 있습니다.</p>
        </>
      )}
    </Dialog>
  );
}
