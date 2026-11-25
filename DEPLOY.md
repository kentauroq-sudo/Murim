# GitHub Pages 배포 방법 (하위 경로 `/Murim`)

현재 라이브 주소: **https://kentauroq-sudo.github.io/Murim/**

## 배포 구조

- `main` 브랜치에는 소스 코드만 둡니다.
- `gh-pages` 브랜치에는 `out/` 정적 빌드 결과물만 올립니다. GitHub Pages는 **Deploy from a branch → `gh-pages` / `/ (root)** 로 설정되어 있습니다.
- 하위 경로(`/Murim`)에서 자산이 깨지지 않도록 빌드할 때 `NEXT_PUBLIC_BASE_PATH=/Murim` 을 줍니다. `next.config.ts`의 `basePath`, `src/lib/base-path.ts`의 `withBasePath()` 가 이미지·지도·CREDITS 링크에 이 값을 반영합니다.
  - 루트 도메인(Cloudflare Pages 등)으로 올릴 때는 이 변수를 주지 않으면 기존과 동일하게 동작합니다.

## 다시 배포하기

```bash
# 1) 소스 최신화
git checkout main && git pull

# 2) 하위 경로용으로 빌드
npm ci
NEXT_PUBLIC_BASE_PATH=/Murim \
NEXT_PUBLIC_SITE_URL=https://kentauroq-sudo.github.io/Murim \
npm run build

# 3) out/ 을 gh-pages 브랜치로 올리기 (.nojekyll 필수: _next 폴더가 무시되지 않도록)
rm -rf /tmp/murim-pages && mkdir -p /tmp/murim-pages
cp -a out/. /tmp/murim-pages/
cd /tmp/murim-pages
touch .nojekyll
git init && git checkout -b gh-pages
git add -A && git commit -m "deploy: 무림여지도 정적 빌드"
git remote add origin https://github.com/kentauroq-sudo/Murim.git
git push -f origin gh-pages
```

푸시하면 1~2분 안에 Pages 빌드가 자동으로 돌고 라이브에 반영됩니다
(확인: `gh api repos/kentauroq-sudo/Murim/pages --jq .status`).

## GitHub Actions 워크플로로 옮기고 싶다면

`.github/workflows/deploy.yml` 을 저장소에 올리면 `main` 푸시만으로 자동 배포됩니다.
다만 현재 연결된 GitHub App에는 `workflows` 권한이 없어 이 파일은 API·푸시로 올릴 수 없습니다.
GitHub 웹 화면에서 **Add file → Create new file** 로 `.github/workflows/deploy.yml` 을 만들거나,
Settings → Actions 권한을 확인한 뒤 올리고, Settings → Pages → Source 를 **GitHub Actions** 로 바꾸면 됩니다.
