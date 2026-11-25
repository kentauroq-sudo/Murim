import type { DataFile, Datasets, Issue } from './validate';

const H = { 'Content-Type': 'application/json', 'X-Murim-Admin': '1' };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...init });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Pages Functions가 없는 환경(npm run dev 등)에서는 HTML 404가 온다
    throw Object.assign(new Error('관리자 서버에 연결할 수 없습니다. Cloudflare Pages에 배포된 주소에서 접속하세요.'), { status: res.status });
  }
  if (!res.ok) throw Object.assign(new Error(body?.error ?? `오류 ${res.status}`), { status: res.status, body });
  return body as T;
}

export const adminApi = {
  session: () => call<{ user: string | null; missing: string[] }>('/api/admin/session'),
  login: (id: string, password: string) =>
    call<{ ok: true; user: string }>('/api/admin/login', { method: 'POST', headers: H, body: JSON.stringify({ id, password }) }),
  logout: () => call('/api/admin/logout', { method: 'POST', headers: H }),
  load: () => call<{ head: string; data: Datasets }>('/api/admin/data'),
  publish: (files: Partial<Datasets>, baseHead: string, message: string) =>
    call<{ ok: true; commit: string; url?: string }>('/api/admin/publish', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ files, baseHead, message }),
    }),
};

export type PublishError = Error & { status?: number; body?: { issues?: Issue[] } };
export type { DataFile };
