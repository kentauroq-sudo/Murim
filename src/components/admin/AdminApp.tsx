'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin/api';
import LoginForm from './LoginForm';
import Workspace from './Workspace';

/** 로그인 여부를 확인하고 로그인 화면 또는 작업 화면을 보여 준다 */
export default function AdminApp() {
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .session()
      .then((s) => {
        setUser(s.user);
        setMissing(s.missing);
      })
      .catch((e) => {
        setError((e as Error).message);
        setUser(null);
      });
  }, []);

  if (user === undefined) {
    return <div className="grid min-h-dvh place-items-center bg-paper text-ink-soft">불러오는 중…</div>;
  }
  if (!user) {
    return (
      <>
        {error && (
          <p role="alert" className="fixed inset-x-0 top-0 z-10 bg-accent px-4 py-2.5 text-center text-sm text-hanji">
            {error}
          </p>
        )}
        <LoginForm onLogin={(u) => { setError(''); setUser(u); adminApi.session().then((s) => setMissing(s.missing)).catch(() => {}); }} />
      </>
    );
  }
  return (
    <Workspace
      user={user}
      missingEnv={missing}
      onLogout={async () => {
        await adminApi.logout().catch(() => {});
        setUser(null);
      }}
    />
  );
}
