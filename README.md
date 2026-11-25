# 무림여지도(武林輿地圖) — 웹 뼈대 v3.0

무협 세계관의 문파·무공·인물·기물·지명을 정규화한 정적 데이터와, 수묵 고지도 위에서 탐색하는 Next.js 정적 사이트(SSG)입니다.
데이터 스키마는 **v3.0**(`02_data_schema.md`)이며, 이 프로젝트는 v3.0 지식문서와 같은 규격을 씁니다.

> **라이브 사이트**: https://kentauroq-sudo.github.io/Murim/ — GitHub Pages 배포 방법은 [DEPLOY.md](DEPLOY.md) 참고.

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 데이터 검증(prebuild) → out/ 정적 HTML 생성
npm run preview    # out/을 로컬에서 서빙
```

- **Node.js 20.9 이상**이 필요합니다(Next.js 16 요구). 20.18.1과 24.22.3에서 빌드를 확인했습니다.
- `npm run build`는 `prebuild`로 `scripts/validate-data.mjs`를 먼저 실행하고, 오류가 있으면 빌드를 중단합니다.

## 기술 스택

| 항목 | 버전 |
|---|---|
| Next.js (App Router, `output: 'export'`) | 16.4.6 |
| React / React DOM | 19.3.1 |
| Tailwind CSS (`@theme` 팔레트) | 4.2.4 |
| Leaflet / react-leaflet | 1.9.4 / 5.0.0 |
| Fuse.js (한글·한자·초식 검색) | 7.5.0 |
| lucide-react | 1.79.0 |
| TypeScript | 5.9.3 |

> Tailwind는 4.3.x 대신 **4.2.4로 고정**했습니다. 4.3.x의 `@tailwindcss/node`가 ESM 전용 `magic-string` 1.x를 `require()`하는데, Next.js 16의 Turbopack이 이를 평가하지 못해 빌드가 실패합니다(`require() of ES Module ... not supported`). 4.2.4는 Turbopack과 호환되며 `@theme` 문법은 같습니다.

## 디렉토리

```
murim-yeojido/
├── public/images/
│   ├── jianghu-antique-map.webp   # 3000×2000 수묵 고지도
│   └── CREDITS.md                 # 지도 이미지 출처·라이선스
├── scripts/validate-data.mjs      # v3.0 데이터 검증 (prebuild)
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 + 팔레트(@theme)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # 메인 지도 화면
│   │   ├── sects/[id]/page.tsx    # 문파 상세 (24개 정적 생성)
│   │   ├── martial-arts/page.tsx  # 무공 도감
│   │   ├── figures/page.tsx       # 인물 열전
│   │   └── items/page.tsx         # 기물·지명
│   ├── components/
│   │   ├── map/WuxiaMap.tsx       # Leaflet CRS.Simple 지도
│   │   ├── ui/SectDetailDrawer.tsx
│   │   ├── ui/SiteHeader.tsx
│   │   ├── home/HomeView.tsx      # 지도 + 통합검색 + 세력 필터
│   │   └── search/{MartialArtsBrowser,FiguresBrowser}.tsx
│   ├── config/
│   │   ├── map.json               # 지도 이미지 경로·크기 (검증 스크립트와 공유)
│   │   └── map.ts                 # toLatLng()·세력 색
│   ├── lib/data.ts                # 데이터 로드·역참조 계산
│   ├── types/wuxia.ts             # v3.0 타입
│   └── data/
│       ├── sects.json             # 24
│       ├── martial_arts.json      # 57 (초식 172)
│       ├── figures.json           # 48
│       ├── items.json             # 3
│       └── places.json            # 3
├── next.config.ts
└── package.json
```

## 좌표 규칙

- 렌더링 기준은 `map_position: {x, y}` 하나입니다. 단위는 지도 이미지 픽셀, 원점은 좌상단입니다.
- Leaflet 좌표 변환은 `src/config/map.ts`의 `toLatLng()` 한 곳에서만 합니다: `[이미지높이 − y, x]`.
- `region.geo`는 실제 위·경도 참고용이며 자동 변환에 쓰지 않습니다. 지도 이미지를 바꾸면 `src/config/map.json`의 `width`·`height`를 실제 크기로 고치고 `map_position`을 다시 측정합니다(검증 스크립트가 이미지 크기와 config를 대조합니다).

## 데이터 규칙 (v3.0)

- 각 JSON은 레코드 배열입니다. 공통 필수: `id`(snake_case), `name_kr`, `name_hanja`, `tier_tag`, `sources[{work, author}]`.
- 관계는 한쪽에만 저장합니다: 무공의 소속 `sect_id`, 인물의 소속 `sect_id`, 인물의 연마 무공 `mastered_arts`. 무공의 연마자는 `getPractitioners()`로 계산합니다.
- 열거값은 `03_wuxia_taxonomy.md`·`src/types/wuxia.ts`·`scripts/validate-data.mjs` 세 곳이 같아야 합니다.
- v2.1에서 이어받은 확장 필드: `alias`, `relations`, `region.coord_note`, `tier_note`, `enum_note`, `era_note`. 화면에서는 `tier_note`를 "고증 메모"로 표시합니다.

## 검증

```bash
npm run validate
# [무림여지도 v3.0 검증] sects 24, arts 57, figures 48, items 3, places 3 · 초식 172
# 통과 (경고 0건)
```

검사 항목: ID 형식·중복, 필수 필드, `sources` 객체 형식, 열거값, 참조 무결성(문파·무공·인물·기물·지명), `signature_arts` 소속 일치, 좌표 범위와 지도 이미지 크기 일치, 금지 용어, 한자 병기, 인물 `realm` 구조, 고증 태그가 섞인 참조(근거 `tier_note`가 없을 때만 경고).

## 배포

`out/`을 그대로 올리면 됩니다(GitHub → Cloudflare Pages/Vercel). `trailingSlash: true`라 `/sects/huashan/index.html` 형태로 생성됩니다.

## v3.6 변경 (UX/UI 개선 · 애드센스 · 관리자)

- **화면**: 본문·보조 글자 크기 상향(11px → 13~16px), 흐린 회색을 대비 4.5:1 이상인 `ink-muted`/`ink-soft` 토큰으로 교체, 버튼·칩 터치 크기 40~44px, 지도 라벨이 줌에 따라 점 → 이름 → 이름+한자로 바뀜, 선택한 문파로 지도 이동·강조, 검색 결과 키보드(↑↓·Enter·Esc, `/` 단축키) 지원, 상세 패널이 모바일에서는 하단 시트로 열림, 메뉴의 '문파'가 문파 일람(`/sects/`)으로 연결.
- **애드센스**: `src/config/ads.ts`, `src/components/ads/AdSlot.tsx`. 게시자 ID(`NEXT_PUBLIC_ADSENSE_CLIENT`)가 비어 있으면 광고 코드가 출력되지 않음. 자리: 지도 상세 패널 하단, 문파 상세(요약 아래·본문 끝), 무공·인물 목록 8개마다, 기물 페이지, 문파 일람. `.env.example` 참고.
- **심사용 페이지**: `/about`, `/privacy`, `sitemap.xml`, `robots.txt`, 404.
- **관리자**: `/admin/` (로그인 후 폼으로 편집 → 게시하기 → GitHub 커밋 → 자동 재배포). 서버는 `functions/`(Cloudflare Pages Functions). 설정은 `ADMIN_GUIDE_v3.6.md`.
