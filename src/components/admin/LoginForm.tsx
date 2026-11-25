'use client';

import { useState } from 'react';
import BrandSeal from '@/components/ui/BrandSeal';
import { adminApi } from '@/lib/admin/api';

export default function LoginForm({ onLogin }: { onLogin: (user: string) => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            const r = await adminApi.login(id.trim(), pw);
            setPw('');
            onLogin(r.user);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="w-full max-w-sm rounded-xl border border-line-strong bg-hanji p-7 shadow-[var(--shadow-panel)]"
      >
        <div className="flex items-center gap-2.5">
          <BrandSeal size={34} />
          <div>
            <h1 className="font-serif text-xl font-bold leading-tight">무림여지도 관리자</h1>
            <p className="text-sm text-ink-muted">기록을 고치고 사이트에 게시합니다</p>
          </div>
        </div>

        <label className="mt-7 block text-sm font-medium" htmlFor="admin-id">
          아이디
        </label>
        <input
          id="admin-id"
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          required
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-md border border-line-strong bg-white/60 px-3 text-base focus:border-ink focus:outline-none"
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="admin-pw">
          비밀번호
        </label>
        <div className="relative mt-1.5">
          <input
            id="admin-pw"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-12 w-full rounded-md border border-line-strong bg-white/60 pl-3 pr-16 text-base focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1/2 h-10 -translate-y-1/2 rounded px-3 text-sm text-ink-muted hover:text-ink"
          >
            {show ? '숨기기' : '보기'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 h-12 w-full rounded-md bg-ink font-serif text-base font-bold text-hanji hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? '확인 중…' : '로그인'}
        </button>
        <p className="mt-4 text-center text-xs text-ink-muted">로그인은 12시간 동안 유지됩니다.</p>
      </form>
    </main>
  );
}
