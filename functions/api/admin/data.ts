import { guard, json, type FnContext } from '../../_lib/auth';
import { readAll } from '../../_lib/github';

/** GitHub의 최신 데이터 (배포본이 아니라 저장소 기준이므로 방금 게시한 내용도 바로 보인다) */
export async function onRequestGet(ctx: FnContext) {
  const denied = await guard(ctx);
  if (denied) return denied;
  try {
    return json(await readAll(ctx.env));
  } catch (e) {
    return json({ error: `데이터를 불러오지 못했습니다. ${(e as Error).message}` }, 502);
  }
}
