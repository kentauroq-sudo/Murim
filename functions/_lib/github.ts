/**
 * GitHub 저장소의 src/data/*.json 읽기·쓰기
 * - 여러 파일을 커밋 1개로 묶어 올린다 → Cloudflare Pages가 한 번만 다시 빌드한다.
 * - GITHUB_TOKEN은 해당 저장소 하나에만 Contents 읽기/쓰기 권한을 준 Fine-grained 토큰을 쓴다.
 */
import type { AdminEnv } from './auth';

export const DATA_FILES = ['sects.json', 'martial_arts.json', 'figures.json', 'items.json', 'places.json'] as const;
export type DataFile = (typeof DATA_FILES)[number];
export const DATA_DIR = 'src/data';

async function gh(env: AdminEnv, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'murim-yeojido-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<any>;
}

const branch = (env: AdminEnv) => env.GITHUB_BRANCH || 'main';

function decodeBase64Utf8(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** 현재 브랜치 최신 커밋 SHA와 데이터 파일 5종 */
export async function readAll(env: AdminEnv) {
  const ref = await gh(env, `/git/ref/heads/${branch(env)}`);
  const head: string = ref.object.sha;
  const entries = await Promise.all(
    DATA_FILES.map(async (f) => {
      try {
        const file = await gh(env, `/contents/${DATA_DIR}/${f}?ref=${head}`);
        // 1MB가 넘는 파일은 content가 비어 있으므로 blob API로 다시 받는다
        const text = file.content ? decodeBase64Utf8(file.content) : decodeBase64Utf8((await gh(env, `/git/blobs/${file.sha}`)).content);
        return [f, JSON.parse(text)] as const;
      } catch (e) {
        if (String(e).includes('GitHub 404')) return [f, []] as const; // 선택 파일(items, places)이 아직 없을 때
        throw e;
      }
    }),
  );
  return { head, data: Object.fromEntries(entries) as Record<DataFile, unknown[]> };
}

/** 여러 파일을 한 커밋으로 올린다. baseHead가 최신이 아니면(다른 곳에서 먼저 저장) 오류 */
export async function commitFiles(env: AdminEnv, files: Partial<Record<DataFile, unknown[]>>, message: string, baseHead?: string) {
  const ref = await gh(env, `/git/ref/heads/${branch(env)}`);
  const head: string = ref.object.sha;
  if (baseHead && baseHead !== head) {
    const err = new Error('CONFLICT');
    (err as any).head = head;
    throw err;
  }
  const headCommit = await gh(env, `/git/commits/${head}`);
  const tree = Object.entries(files).map(([name, data]) => ({
    path: `${DATA_DIR}/${name}`,
    mode: '100644',
    type: 'blob',
    content: JSON.stringify(data, null, 2) + '\n',
  }));
  const newTree = await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }) });
  const commit = await gh(env, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
  });
  await gh(env, `/git/refs/heads/${branch(env)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  return { commit: commit.sha as string, url: commit.html_url as string | undefined };
}
