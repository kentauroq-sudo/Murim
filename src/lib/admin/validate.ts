/**
 * 관리자 화면과 서버(Pages Functions)가 함께 쓰는 데이터 검증.
 * scripts/validate-data.mjs의 "오류" 규칙과 같게 유지한다 (경고 규칙은 빌드 때 확인).
 * 외부 의존성 없이 작성 — functions/ 쪽에서 상대 경로로 가져다 쓴다.
 */

export type DataFile = 'sects.json' | 'martial_arts.json' | 'figures.json' | 'items.json' | 'places.json';
export type Datasets = Record<DataFile, any[]>;

export const ENUMS = {
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
  // 관계 종류는 validate-data.mjs에서 자유 문자열이지만, 관리자 화면에서는 기존 값 중에서 고르게 한다
  relation_type: ['동맹', '우호', '중립', '경쟁', '갈등', '대립', '적대', '숙적'],
} as const;

export const ID_FORMAT = /^[a-z0-9]+(_[a-z0-9]+)*$/;

export interface Issue {
  file: DataFile;
  id: string;
  message: string;
}

export function validateAll(d: Datasets, map: { width: number; height: number }): Issue[] {
  const issues: Issue[] = [];
  const idx = {} as Record<DataFile, Map<string, any>>;
  (Object.keys(d) as DataFile[]).forEach((file) => {
    idx[file] = new Map();
    if (!Array.isArray(d[file])) {
      issues.push({ file, id: '-', message: '최상위가 배열이 아닙니다' });
      d[file] = [];
    }
    d[file].forEach((r, i) => {
      const id = r?.id;
      if (typeof id !== 'string' || !ID_FORMAT.test(id)) {
        issues.push({ file, id: String(id ?? `#${i + 1}`), message: 'ID는 영문 소문자·숫자·밑줄만 쓸 수 있습니다 (예: hua_shan)' });
        return;
      }
      if (idx[file].has(id)) issues.push({ file, id, message: 'ID가 중복됩니다' });
      idx[file].set(id, r);
    });
  });

  const err = (file: DataFile, id: string, message: string) => issues.push({ file, id, message });
  const common = (file: DataFile, r: any) => {
    if (!r.name_kr?.trim?.()) err(file, r.id, '한글 이름이 비어 있습니다');
    if (!r.name_hanja?.trim?.()) err(file, r.id, '한자 이름이 비어 있습니다');
    if (!ENUMS.tier_tag.includes(r.tier_tag)) err(file, r.id, '고증 구분(정통고증/신무협)을 고르세요');
    if (!Array.isArray(r.sources) || !r.sources.some((s: any) => s?.work?.trim?.())) err(file, r.id, '출처 작품을 하나 이상 적으세요');
  };
  const en = (file: DataFile, r: any, label: string, v: unknown, allowed: readonly string[], nullable = false) => {
    if (nullable && (v === null || v === undefined || v === '')) return;
    if (!allowed.includes(v as string)) err(file, r.id, `${label} 값이 올바르지 않습니다`);
  };
  const ref = (file: DataFile, r: any, label: string, target: DataFile, v: unknown, nullable = false) => {
    if (nullable && (v === null || v === undefined || v === '')) return;
    if (!idx[target]?.has(v as string)) err(file, r.id, `${label}: '${v}' 항목을 찾을 수 없습니다`);
  };
  const pos = (file: DataFile, r: any, p: any) => {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return err(file, r.id, '지도 위치를 찍어 주세요');
    if (p.x < 0 || p.y < 0 || p.x > map.width || p.y > map.height) err(file, r.id, '지도 위치가 지도 밖입니다');
    else if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) err(file, r.id, '지도 위치는 정수여야 합니다');
  };

  for (const r of idx['sects.json'].values()) {
    const f: DataFile = 'sects.json';
    common(f, r);
    en(f, r, '세력', r.faction, ENUMS.faction);
    if (!r.region?.province?.trim?.()) err(f, r.id, '지역(성)이 비어 있습니다');
    pos(f, r, r.region?.map_position);
    if (!r.summary?.trim?.()) err(f, r.id, '요약이 비어 있습니다');
    (r.signature_arts ?? []).forEach((a: string) => {
      ref(f, r, '대표 무공', 'martial_arts.json', a);
      const art = idx['martial_arts.json'].get(a);
      if (art && art.sect_id !== r.id) err(f, r.id, `대표 무공 '${art.name_kr}'은(는) 이 문파 소속이 아닙니다`);
    });
    (r.notable_figures ?? []).forEach((n: any) => ref(f, r, '대표 인물', 'figures.json', n?.figure_id));
    (r.relations ?? []).forEach((rel: any) => {
      ref(f, r, '관계 문파', 'sects.json', rel?.sect_id);
      if (!rel?.type?.trim?.()) err(f, r.id, '관계 종류가 비어 있습니다');
    });
  }
  for (const r of idx['martial_arts.json'].values()) {
    const f: DataFile = 'martial_arts.json';
    common(f, r);
    ref(f, r, '소속 문파', 'sects.json', r.sect_id, true);
    en(f, r, '분류', r.category, ENUMS.category);
    en(f, r, '계통', r.weapon_type, ENUMS.weapon_type);
    en(f, r, '등급', r.grade, ENUMS.grade);
    if (!r.origin_and_principle?.trim?.()) err(f, r.id, '내력·원리가 비어 있습니다');
    (r.techniques ?? []).forEach((t: any, i: number) => {
      if (!t?.name_kr?.trim?.() || !t?.name_hanja?.trim?.() || !t?.description?.trim?.())
        err(f, r.id, `초식 ${i + 1}번째의 한글·한자·설명을 모두 채우세요`);
    });
  }
  for (const r of idx['figures.json'].values()) {
    const f: DataFile = 'figures.json';
    common(f, r);
    ref(f, r, '소속 문파', 'sects.json', r.sect_id, true);
    en(f, r, '시대', r.era_type, ENUMS.era_type);
    if (r.realm) {
      en(f, r, '경지', r.realm.level, ENUMS.realm_level);
      en(f, r, '경지 근거', r.realm.basis, ENUMS.realm_basis);
    }
    (r.mastered_arts ?? []).forEach((a: string) => ref(f, r, '연마 무공', 'martial_arts.json', a));
    if (!r.biography?.trim?.()) err(f, r.id, '행적이 비어 있습니다');
  }
  for (const r of idx['items.json'].values()) {
    const f: DataFile = 'items.json';
    common(f, r);
    en(f, r, '종류', r.type, ENUMS.item_type);
    ref(f, r, '소속 문파', 'sects.json', r.sect_id, true);
    (r.holders ?? []).forEach((h: any) => ref(f, r, '소유자', 'figures.json', h?.figure_id));
    if (!r.description?.trim?.()) err(f, r.id, '설명이 비어 있습니다');
  }
  for (const r of idx['places.json'].values()) {
    const f: DataFile = 'places.json';
    common(f, r);
    en(f, r, '종류', r.type, ENUMS.place_type);
    pos(f, r, r.map_position);
    (r.related_sects ?? []).forEach((s: string) => ref(f, r, '관련 문파', 'sects.json', s));
    (r.related_figures ?? []).forEach((s: string) => ref(f, r, '관련 인물', 'figures.json', s));
    if (!r.description?.trim?.()) err(f, r.id, '설명이 비어 있습니다');
  }
  return issues;
}
