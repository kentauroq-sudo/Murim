import { issueToken, json, missingEnv, sameOrigin, sessionCookie, verifyPassword, type FnContext } from '../../_lib/auth';

export async function onRequestPost(ctx: FnContext) {
  const { request, env } = ctx;
  if (!sameOrigin(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  const missing = missingEnv(env).filter((k) => k.startsWith('ADMIN') || k === 'SESSION_SECRET');
  if (missing.length) return json({ error: `서버 설정이 빠졌습니다: ${missing.join(', ')}` }, 500);

  let body: { id?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }
  const idOk = typeof body.id === 'string' && body.id === env.ADMIN_ID;
  // 아이디가 틀려도 비밀번호 검사를 똑같이 돌려 응답 시간으로 아이디를 추측하지 못하게 한다
  const pwOk = await verifyPassword(String(body.password ?? ''), env.ADMIN_PASSWORD_HASH);
  if (!idOk || !pwOk) {
    await new Promise((r) => setTimeout(r, 800)); // 무차별 대입 속도 늦추기
    return json({ error: '아이디 또는 비밀번호가 맞지 않습니다.' }, 401);
  }
  return json({ ok: true, user: env.ADMIN_ID }, 200, { 'Set-Cookie': sessionCookie(await issueToken(env, env.ADMIN_ID)) });
}
