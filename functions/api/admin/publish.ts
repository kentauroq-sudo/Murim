import { guard, json, readSession, type FnContext } from '../../_lib/auth';
import { DATA_FILES, commitFiles, readAll, type DataFile } from '../../_lib/github';
import { validateAll, type Datasets } from '../../../src/lib/admin/validate';
import mapConfig from '../../../src/config/map.json';

/** 바뀐 파일만 받아 검증한 뒤 커밋 1개로 게시 → Cloudflare Pages가 자동으로 다시 빌드 */
export async function onRequestPost(ctx: FnContext) {
  const denied = await guard(ctx, true);
  if (denied) return denied;

  let body: { files?: Partial<Record<DataFile, unknown[]>>; baseHead?: string; message?: string };
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }
  const files = Object.fromEntries(
    Object.entries(body.files ?? {}).filter(([k]) => (DATA_FILES as readonly string[]).includes(k)),
  ) as Partial<Record<DataFile, unknown[]>>;
  if (!Object.keys(files).length) return json({ error: '바뀐 내용이 없습니다.' }, 400);

  try {
    // 바뀌지 않은 파일은 저장소 최신본과 합쳐 전체를 검증한다 (참조 오류 방지)
    const current = await readAll(ctx.env);
    const merged = { ...current.data, ...files } as Datasets;
    const issues = validateAll(merged, mapConfig);
    if (issues.length) return json({ error: '검증 오류가 있어 게시하지 않았습니다.', issues }, 422);

    const user = await readSession(ctx.request, ctx.env);
    const summary = Object.keys(files).join(', ');
    const message = `admin: ${body.message?.trim() || `${summary} 수정`}\n\n관리자 화면에서 ${user}이(가) 게시`;
    const result = await commitFiles(ctx.env, files, message, body.baseHead);
    return json({ ok: true, ...result });
  } catch (e) {
    if ((e as Error).message === 'CONFLICT') {
      return json({ error: '다른 곳에서 먼저 저장된 내용이 있습니다. 새로고침 후 다시 시도하세요.', head: (e as any).head }, 409);
    }
    return json({ error: `게시에 실패했습니다. ${(e as Error).message}` }, 502);
  }
}
