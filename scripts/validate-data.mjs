#!/usr/bin/env node
// 무림여지도 데이터 검증 스크립트 (스키마 v3.0)
// 사용: node scripts/validate-data.mjs [프로젝트루트]
// package.json의 "prebuild"로 등록해 빌드 전에 자동 실행한다. 오류가 하나라도 있으면 exit 1.
//
// 03_wuxia_taxonomy.md · src/types/wuxia.ts 와 열거값을 같게 유지한다. 값을 바꾸면 세 곳을 함께 고친다.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src', 'data');
const mapConfig = JSON.parse(readFileSync(join(root, 'src', 'config', 'map.json'), 'utf8'));

const ENUMS = {
  faction: ['정파', '사파', '마교', '세외', '중립'],
  tier_tag: ['정통고증', '신무협'],
  category: ['내공', '외공', '경공', '기문'],
  weapon_type: ['내공심법', '검법', '도법', '권각', '창봉', '암기', '경공', '음공', '진법', '기타'],
  grade: ['일반', '상승', '절학'],
  era_type: ['전대 고수', '당대', '후기지수'],
  realm_level: ['삼류', '이류', '일류', '절정', '초절정', '화경', '현경', '생사경'],
  realm_basis: ['원작묘사', '신무협환산'],
  item_type: ['영약', '신병', '비급', '기물'],
  place_type: ['명산', '명소', '성시', '관문', '수계', '객잔'],
};

// 05_lore_style_guide.md 2절 금지 용어. '얼마나'의 '마나'는 오탐이라 앞 글자를 배제한다.
const BANNED_WORDS = [
  ['마나', /(?<!얼)마나/],
  ['스킬', /스킬/],
  ['레벨', /레벨/],
  ['쿨타임', /쿨타임/],
  ['버프', /버프/],
  ['데미지', /데미지/],
  ['스탯', /스탯/],
];
const HAN = /\p{Script=Han}/u;
const ID_FORMAT = /^[a-z0-9]+(_[a-z0-9]+)*$/;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function load(file, required) {
  const path = join(dataDir, file);
  if (!existsSync(path)) {
    if (required) err(file, '파일이 없습니다');
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(file, `JSON 문법 오류 - ${e.message}`);
    return [];
  }
  if (!Array.isArray(parsed)) {
    err(file, '최상위가 배열([ ... ])이어야 합니다');
    return [];
  }
  return parsed;
}

const sets = {
  sects: load('sects.json', true),
  arts: load('martial_arts.json', true),
  figures: load('figures.json', true),
  items: load('items.json', true),
  places: load('places.json', true),
};

// ── 지도 이미지 크기와 src/config/map.json 대조 ───────────────────────
function readWebpSize(path) {
  if (!existsSync(path)) return null;
  const b = readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') {
    const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width: w, height: h };
  }
  if (fourcc === 'VP8 ') {
    return {
      width: b.readUInt16LE(26) & 0x3fff,
      height: b.readUInt16LE(28) & 0x3fff,
    };
  }
  if (fourcc === 'VP8L') {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

const imagePath = join(root, 'public', mapConfig.image.replace(/^\//, ''));
const imageSize = readWebpSize(imagePath);
if (!imageSize) {
  err('map.json', `지도 이미지를 읽을 수 없습니다: ${imagePath}`);
} else if (imageSize.width !== mapConfig.width || imageSize.height !== mapConfig.height) {
  err(
    'map.json',
    `width·height(${mapConfig.width}×${mapConfig.height})가 실제 이미지(${imageSize.width}×${imageSize.height})와 다릅니다`,
  );
}

// ── ID 수집 ────────────────────────────────────────────────────────
const index = {};
for (const [kind, list] of Object.entries(sets)) {
  index[kind] = new Map();
  list.forEach((rec, i) => {
    const where = `${kind}[${i}]${rec?.id ? ` (${rec.id})` : ''}`;
    if (typeof rec.id !== 'string' || !ID_FORMAT.test(rec.id)) {
      err(where, 'id는 영문 소문자·숫자·밑줄(snake_case)이어야 합니다');
      return;
    }
    if (index[kind].has(rec.id)) err(where, 'id 중복');
    index[kind].set(rec.id, rec);
  });
}

function checkEnum(where, field, value, allowed, nullable = false) {
  if (nullable && (value === null || value === undefined)) return;
  if (!allowed.includes(value)) err(where, `${field} 값 "${value}"은(는) 허용값이 아닙니다 (${allowed.join(', ')})`);
}

function checkRef(where, field, kind, id, nullable = false) {
  if (nullable && (id === null || id === undefined)) return null;
  const target = index[kind].get(id);
  if (!target) err(where, `${field}: "${id}"에 해당하는 ${kind} 레코드가 없습니다`);
  return target ?? null;
}

function checkCommon(where, rec) {
  for (const f of ['name_kr', 'name_hanja']) {
    if (typeof rec[f] !== 'string' || !rec[f].trim()) err(where, `${f} 누락`);
  }
  if (rec.name_hanja && !HAN.test(rec.name_hanja)) warn(where, `name_hanja에 한자가 없습니다: "${rec.name_hanja}"`);
  checkEnum(where, 'tier_tag', rec.tier_tag, ENUMS.tier_tag);
  if (!Array.isArray(rec.sources) || rec.sources.length === 0) {
    err(where, 'sources(출처)가 비어 있습니다');
  } else {
    rec.sources.forEach((s, i) => {
      if (!s || typeof s !== 'object' || Array.isArray(s)) {
        err(where, `sources[${i}]는 { work, author } 객체여야 합니다`);
        return;
      }
      if (typeof s.work !== 'string' || !s.work.trim()) err(where, `sources[${i}].work 누락`);
      if (!('author' in s) || !(s.author === null || typeof s.author === 'string')) {
        err(where, `sources[${i}].author는 문자열 또는 null이어야 합니다`);
      }
    });
  }
  const text = JSON.stringify(rec);
  for (const [word, pattern] of BANNED_WORDS) {
    if (pattern.test(text)) warn(where, `금지 용어 "${word}" 사용`);
  }
}

// 고증 태그가 섞인 참조. v3.0 태그는 두 값뿐이라 '혼합'을 표현할 수 없으므로,
// 참조하는 레코드가 tier_note로 그 사정을 밝혀 두면 경고하지 않는다(00_instructions 4항).
function checkTierMix(where, rec, target, field) {
  if (rec.tier_tag === '정통고증' && target?.tier_tag === '신무협') {
    if (!rec.tier_note) {
      warn(where, `정통고증 레코드가 신무협 레코드(${target.id})를 ${field}에서 참조합니다 — tier_note로 근거를 남기세요`);
    }
  }
}

function checkPosition(where, pos) {
  if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    err(where, 'map_position은 { "x": 숫자, "y": 숫자 } 형식이어야 합니다');
    return;
  }
  if (!Number.isInteger(pos.x) || !Number.isInteger(pos.y)) warn(where, 'map_position은 정수 픽셀이어야 합니다');
  if (pos.x < 0 || pos.x > mapConfig.width || pos.y < 0 || pos.y > mapConfig.height) {
    err(where, `map_position (${pos.x}, ${pos.y})이 지도 범위(0~${mapConfig.width}, 0~${mapConfig.height})를 벗어났습니다`);
  }
}

function checkGeo(where, geo) {
  if (geo == null) return;
  if (typeof geo.lat !== 'number' || typeof geo.lng !== 'number') {
    err(where, 'geo는 { "lat": 숫자, "lng": 숫자 } 또는 null이어야 합니다');
    return;
  }
  if (geo.lat < -90 || geo.lat > 90) err(where, `geo.lat 범위 오류: ${geo.lat}`);
  if (geo.lng < -180 || geo.lng > 180) err(where, `geo.lng 범위 오류: ${geo.lng}`);
}

// ── 문파 ──────────────────────────────────────────────────────────
for (const s of index.sects.values()) {
  const where = `sects (${s.id})`;
  checkCommon(where, s);
  checkEnum(where, 'faction', s.faction, ENUMS.faction);
  checkPosition(where, s.region?.map_position);
  checkGeo(where, s.region?.geo);
  (s.signature_arts ?? []).forEach((id) => {
    const art = checkRef(where, 'signature_arts', 'arts', id);
    if (art && art.sect_id !== s.id) err(where, `signature_arts의 ${id}는 sect_id가 "${art.sect_id}"입니다 (이 문파 무공이 아님)`);
    checkTierMix(where, s, art, 'signature_arts');
  });
  (s.notable_figures ?? []).forEach(({ figure_id }) => {
    const fig = checkRef(where, 'notable_figures', 'figures', figure_id);
    if (fig && fig.sect_id !== s.id) warn(where, `notable_figures의 ${figure_id}는 sect_id가 "${fig.sect_id}"입니다`);
  });
}

// ── 무공 ──────────────────────────────────────────────────────────
for (const a of index.arts.values()) {
  const where = `martial_arts (${a.id})`;
  checkCommon(where, a);
  checkRef(where, 'sect_id', 'sects', a.sect_id, true);
  if (a.sect_id == null && !a.lineage) warn(where, '소속 문파가 없으면 lineage(계보)를 적어 주세요');
  checkEnum(where, 'category', a.category, ENUMS.category);
  checkEnum(where, 'weapon_type', a.weapon_type, ENUMS.weapon_type);
  checkEnum(where, 'grade', a.grade, ENUMS.grade);
  if ('practitioners' in a) warn(where, 'practitioners는 더 이상 쓰지 않습니다. 인물의 mastered_arts에만 기록하세요');
  if (!Array.isArray(a.techniques)) {
    err(where, 'techniques는 배열이어야 합니다');
  } else {
    a.techniques.forEach((t, i) => {
      for (const f of ['name_kr', 'name_hanja', 'description']) {
        if (typeof t?.[f] !== 'string' || !t[f].trim()) err(where, `techniques[${i}].${f} 누락`);
      }
      if (t?.name_hanja && !HAN.test(t.name_hanja)) warn(where, `techniques[${i}].name_hanja에 한자 없음`);
    });
  }
  if (!a.origin_and_principle?.trim()) err(where, 'origin_and_principle 누락');
}

// ── 인물 ──────────────────────────────────────────────────────────
for (const f of index.figures.values()) {
  const where = `figures (${f.id})`;
  checkCommon(where, f);
  checkRef(where, 'sect_id', 'sects', f.sect_id, true);
  checkEnum(where, 'era_type', f.era_type, ENUMS.era_type);
  if (f.realm != null) {
    if (typeof f.realm !== 'object' || Array.isArray(f.realm)) {
      err(where, 'realm은 { level, basis } 객체 또는 null이어야 합니다');
    } else {
      checkEnum(where, 'realm.level', f.realm.level, ENUMS.realm_level);
      checkEnum(where, 'realm.basis', f.realm.basis, ENUMS.realm_basis);
      if (f.tier_tag === '정통고증' && f.realm.basis === '원작묘사') {
        warn(where, '김용·고룡 원작에는 삼류~생사경 체계가 없습니다. realm.basis를 "신무협환산"으로 확인하세요');
      }
    }
  }
  if (!f.biography?.trim()) err(where, 'biography 누락');
  (f.mastered_arts ?? []).forEach((id) => {
    const art = checkRef(where, 'mastered_arts', 'arts', id);
    checkTierMix(where, f, art, 'mastered_arts');
  });
}

// ── 영약·신병·비급 ────────────────────────────────────────────────
for (const it of index.items.values()) {
  const where = `items (${it.id})`;
  checkCommon(where, it);
  checkEnum(where, 'type', it.type, ENUMS.item_type);
  checkRef(where, 'sect_id', 'sects', it.sect_id, true);
  (it.holders ?? []).forEach(({ figure_id }) => checkRef(where, 'holders', 'figures', figure_id));
  if (!it.description?.trim()) err(where, 'description 누락');
}

// ── 지명·명소 ─────────────────────────────────────────────────────
for (const p of index.places.values()) {
  const where = `places (${p.id})`;
  checkCommon(where, p);
  checkEnum(where, 'type', p.type, ENUMS.place_type);
  checkPosition(where, p.map_position);
  checkGeo(where, p.geo);
  (p.related_sects ?? []).forEach((id) => checkRef(where, 'related_sects', 'sects', id));
  (p.related_figures ?? []).forEach((id) => checkRef(where, 'related_figures', 'figures', id));
  if (!p.description?.trim()) err(where, 'description 누락');
}

// ── 역참조 정합성: 인물이 연마하는 무공은 실재해야 하고, 문파 대표 인물은 문파 소속이어야 한다 ──
for (const s of index.sects.values()) {
  for (const { figure_id } of s.notable_figures ?? []) {
    const f = index.figures.get(figure_id);
    if (f && f.sect_id !== s.id) warn(`sects (${s.id})`, `notable_figures ${figure_id} 소속(${f.sect_id}) 불일치`);
  }
}

// ── 결과 ──────────────────────────────────────────────────────────
const counts = Object.entries(index)
  .map(([k, m]) => `${k} ${m.size}`)
  .join(', ');
const techTotal = [...index.arts.values()].reduce((n, a) => n + (a.techniques?.length ?? 0), 0);

console.log(`[무림여지도 v3.0 검증] ${counts} · 초식 ${techTotal}`);
warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
errors.forEach((e) => console.error(`  ✖ ${e}`));
if (errors.length) {
  console.error(`오류 ${errors.length}건 - 빌드를 중단합니다.`);
  process.exit(1);
}
console.log(`통과 (경고 ${warnings.length}건)`);
