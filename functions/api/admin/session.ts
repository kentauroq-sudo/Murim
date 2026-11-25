import { json, missingEnv, readSession, type FnContext } from '../../_lib/auth';

export async function onRequestGet(ctx: FnContext) {
  const user = await readSession(ctx.request, ctx.env);
  return json({ user, missing: user ? missingEnv(ctx.env) : [] });
}
