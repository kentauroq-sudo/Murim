import { json, sessionCookie } from '../../_lib/auth';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}
