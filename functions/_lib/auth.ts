/**
 * 관리자 인증 도우미 (Cloudflare Pages Functions, Web Crypto만 사용)
 * - 비밀번호는 평문으로 저장하지 않는다. 환경변수 ADMIN_PASSWORD_HASH에
 *   "pbkdf2$반복수$소금(base64)$해시(base64)" 형식으로 넣는다. (scripts/hash-password.mjs로 생성)
 * - 로그인 성공 시 HMAC 서명 토큰을 HttpOnly·Secure·SameSite=Strict 쿠키로 발급한다.
 */

export interface AdminEnv {
  ADMIN_ID: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string; // "소유자/저장소"
  GITHUB_BRANCH?: string; // 기본 main
}

export interface FnContext {
  request: Request;
  env: AdminEnv;
  params: Record<string, string | string[]>;
}

const enc = new TextEncoder();
export const COOKIE = 'murim_admin';
const SESSION_HOURS = 12;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);

/** 길이가 같을 때만 비교하고, 비교 시간을 내용과 무관하게 일정하게 */
function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltB64, hashB64] = (stored || '').split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !saltB64 || !hashB64) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: Number(iterStr) },
    key,
    256,
  );
  return safeEqual(new Uint8Array(bits), unb64(hashB64));
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(b64(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}

export async function issueToken(env: AdminEnv, user: string) {
  const payload = b64url(btoa(JSON.stringify({ u: user, exp: Date.now() + SESSION_HOURS * 3600_000 })));
  return `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
}

export async function readSession(request: Request, env: AdminEnv): Promise<string | null> {
  if (!env.SESSION_SECRET) return null;
  const cookie = request.headers.get('Cookie') ?? '';
  const raw = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = await hmac(env.SESSION_SECRET, payload);
  if (!safeEqual(enc.encode(sig), enc.encode(expected))) return null;
  try {
    const { u, exp } = JSON.parse(atob(unb64url(payload)));
    return typeof u === 'string' && Date.now() < exp ? u : null;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAgeSec = SESSION_HOURS * 3600) {
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

/** 변경 요청은 같은 사이트의 관리자 화면에서 온 것만 받는다 (CSRF 방지) */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  return request.headers.get('X-Murim-Admin') === '1' && (!origin || origin === new URL(request.url).origin);
}

/** 로그인 확인. 실패하면 401 응답을, 성공하면 null을 돌려준다 */
export async function guard(ctx: FnContext, mutating = false): Promise<Response | null> {
  if (mutating && !sameOrigin(ctx.request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  const user = await readSession(ctx.request, ctx.env);
  return user ? null : json({ error: '로그인이 필요합니다.' }, 401);
}

export function missingEnv(env: AdminEnv): string[] {
  return (['ADMIN_ID', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET', 'GITHUB_TOKEN', 'GITHUB_REPO'] as const).filter((k) => !env[k]);
}
