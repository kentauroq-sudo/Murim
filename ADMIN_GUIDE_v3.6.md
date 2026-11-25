# 무림여지도 관리자 페이지 — 설치·사용 안내 (v3.6)

주소: `https://내사이트주소/admin/`
로그인한 뒤 문파·무공·인물·기물·명소를 **폼으로 고치고**, **지도를 눌러 위치를 찍고**, **게시하기** 한 번으로 사이트에 반영합니다. 코드나 JSON 파일을 직접 열 필요가 없습니다.

---

## 1. 어떻게 동작하나요

```
관리자 화면(/admin)  ──로그인──▶  Cloudflare Pages Functions (/api/admin/*)
       │                              │  아이디·비밀번호 확인 (비밀번호는 해시로만 보관)
       │  게시하기                     │
       └──────────────────────────▶   GitHub 저장소 src/data/*.json 에 커밋 1개로 저장
                                       │
                                       ▼
                         Cloudflare Pages가 자동으로 다시 빌드 → 1~3분 뒤 사이트 반영
```

- 사이트 자체는 지금처럼 정적 사이트로 남습니다. 방문자에게는 관리자 기능이 보이지 않습니다.
- 데이터의 원본은 GitHub 저장소입니다. 게시할 때마다 커밋 기록이 남으니 잘못 올려도 되돌릴 수 있습니다.
- 게시 전에 서버가 한 번 더 검증합니다 (ID 형식·중복, 필수 항목, 존재하지 않는 문파·인물 참조, 지도 밖 좌표). 오류가 있으면 게시되지 않습니다.

## 2. 처음 한 번만 하는 설정

### 2-1. 프로젝트 코드
관리자 기능은 `murim-yeojido-web-v3.6.zip`(드라이브 `무림여지도` 폴더)에 이미 들어 있습니다. 이 폴더 내용을 GitHub 저장소에 올리면(커밋·푸시) 됩니다.

### 2-2. GitHub 토큰 만들기 (관리자 화면이 저장소에 저장할 수 있게)
1. GitHub → 오른쪽 위 프로필 → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. Repository access: **Only select repositories** → 무림여지도 저장소 하나만
3. Permissions → Repository permissions → **Contents: Read and write** (다른 권한은 주지 않음)
4. 만료일은 1년 정도로. 만들어진 토큰(`github_pat_…`)을 복사해 둡니다. (다시 볼 수 없습니다)

### 2-3. Cloudflare Pages 환경변수
Cloudflare 대시보드 → Workers & Pages → 무림여지도 프로젝트 → **Settings → Variables and Secrets** → Production에 추가

| 이름 | 값 | 종류 |
|---|---|---|
| `ADMIN_ID` | 관리자 아이디 | 텍스트 |
| `ADMIN_PASSWORD_HASH` | 비밀번호 해시 (`pbkdf2$100000$…`) | **Secret** |
| `SESSION_SECRET` | 긴 무작위 문자열 | **Secret** |
| `GITHUB_TOKEN` | 2-2에서 만든 토큰 | **Secret** |
| `GITHUB_REPO` | `내아이디/저장소이름` | 텍스트 |
| `GITHUB_BRANCH` | `main` | 텍스트 |

빌드 설정은 그대로: Build command `npm run build`, Build output `out`. 프로젝트 루트의 `functions/` 폴더는 Cloudflare가 자동으로 인식합니다.
저장 후 **Deployments → 최신 배포 → Retry deployment**로 한 번 다시 배포해야 환경변수가 적용됩니다.

> 비밀번호 해시는 비밀번호를 거꾸로 알아낼 수 없게 바꾼 값입니다. 비밀번호를 바꾸고 싶으면 프로젝트 폴더에서 `node scripts/hash-password.mjs --secret`을 실행하고 새 값으로 바꾼 뒤 다시 배포하세요. 이때 SESSION_SECRET도 바꾸면 기존 로그인이 모두 풀립니다.

### 2-4. (필수) 배포 전 보안 설정
관리자 화면(`/admin`)과 API(`/api/admin/*`)는 인터넷에 공개된 주소로 열리므로, 아래 두 가지는 배포 전 반드시 적용합니다.
- **로그인 시도 제한 (WAF Rate limiting)**: Cloudflare → Security → WAF → Rate limiting rules → URI Path가 `/api/admin/login`이면 10초에 5번 넘게 요청하는 IP를 1분 차단.
- **Cloudflare Access**(무료): Zero Trust → Access → Applications에서 `/admin*`과 `/api/admin*`을 본인 이메일로만 열리게 설정해, 비밀번호 앞에 이메일 인증을 한 번 더 거치게 함.

## 3. 사용법

| 하고 싶은 일 | 방법 |
|---|---|
| 기록 고치기 | 왼쪽에서 종류(문파·무공…) → 가운데 목록에서 항목 → 오른쪽 폼 수정 |
| 새 항목 | 목록 위 **새 ○○ 추가** → ID(영문)와 이름 입력. ID는 게시 후 바꿀 수 없습니다 |
| 지도 위치 | "지도 위치" 칸의 지도를 누르면 빨간 점이 찍히고 x·y가 채워집니다. 1배·2배·3배로 확대해 정확히 |
| 연결 고르기 | 대표 무공·연마 무공 등은 이름을 검색해 + 로 추가, × 로 빼기 |
| Claude가 만든 JSON 넣기 | 왼쪽 아래 **JSON 붙여넣기** → 종류 고르고 붙여넣기 → 합치기 (같은 ID는 덮어씀) |
| 사이트에 반영 | 아래 막대 **게시하기** → 바꾼 내용 한 줄 적고 게시. 1~3분 뒤 반영 |
| 취소 | **되돌리기** = 마지막 게시 상태로. 게시 후라면 GitHub 커밋 기록에서 되돌립니다 |
| 프로젝트 인덱스 갱신 | **수집 인덱스 복사** → Claude 프로젝트의 `04_collected_index.md`에 붙여 넣기 |

- 고치는 중인 내용은 이 브라우저에 자동 임시저장됩니다. 창을 닫았다 열면 "이어서 하기"가 뜹니다.
- 목록의 **수정됨 / 새 항목 / 오류 n** 표시로 무엇이 바뀌었는지 한눈에 봅니다. 오류가 있으면 게시 창에서 오류 목록을 누르면 그 항목으로 바로 이동합니다.
- 삭제할 때 다른 기록이 그 항목을 가리키고 있으면 어디인지 알려 줍니다.

## 4. 내 컴퓨터에서 시험하려면 (선택)
`npm run dev`에는 관리자 서버가 없어 "관리자 서버에 연결할 수 없습니다"가 뜹니다. 시험하려면:
```bash
cp .dev.vars.example .dev.vars   # 값 채우기
npm run build
npx wrangler pages dev out        # http://localhost:8788/admin/
```
(로컬에서 게시해도 실제 GitHub 저장소에 커밋됩니다.)

## 5. 바뀐·새 파일
- 새: `functions/_lib/auth.ts`, `functions/_lib/github.ts`, `functions/api/admin/{login,logout,session,data,publish}.ts`, `src/app/admin/{layout,page}.tsx`, `src/components/admin/*`, `src/lib/admin/{schema,validate,api}.ts`, `scripts/hash-password.mjs`, `.dev.vars.example`
- 입력 칸을 바꾸려면 `src/lib/admin/schema.ts`만 고치면 됩니다. 검증 규칙은 `src/lib/admin/validate.ts` 한 곳에서 화면과 서버가 같이 씁니다.
