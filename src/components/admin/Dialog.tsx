'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** 기본 <dialog> 요소 기반 모달 — Esc 닫기·초점 가두기를 브라우저가 처리한다 */
export default function Dialog({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(40rem,94vw)] rounded-xl border border-line-strong bg-hanji p-0 text-ink shadow-[var(--shadow-panel)] backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="font-serif text-xl font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-md text-ink-soft hover:bg-hanji-deep">
          <X size={20} aria-hidden />
          <span className="sr-only">닫기</span>
        </button>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
    </dialog>
  );
}
