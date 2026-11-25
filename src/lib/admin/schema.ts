/**
 * 관리자 편집 화면의 필드 정의.
 * 화면은 이 목록만 보고 입력칸을 그린다 → 스키마가 바뀌면 여기만 고치면 된다.
 * 여기 없는 필드(geo 등)는 지우지 않고 그대로 보존된다.
 */
import { ENUMS, type DataFile } from './validate';

export type SubField =
  | { key: string; label: string; kind: 'text' | 'textarea'; placeholder?: string }
  | { key: string; label: string; kind: 'select'; options: readonly string[] }
  | { key: string; label: string; kind: 'ref'; target: DataFile };

export type Field = { path: string; label: string; help?: string; required?: boolean } & (
  | { kind: 'text'; placeholder?: string }
  | { kind: 'textarea'; rows?: number; placeholder?: string }
  | { kind: 'select'; options: readonly string[]; nullable?: boolean }
  | { kind: 'ref'; target: DataFile; nullable?: boolean; nullLabel?: string }
  | { kind: 'refs'; target: DataFile; onlyOwn?: boolean }
  | { kind: 'tags'; placeholder?: string }
  | { kind: 'position' }
  | { kind: 'realm' }
  | { kind: 'list'; item: SubField[]; addLabel: string }
);

export interface Section {
  title: string;
  fields: Field[];
}

const NAME: Field[] = [
  { path: 'name_kr', label: '한글 이름', kind: 'text', required: true, placeholder: '화산파' },
  { path: 'name_hanja', label: '한자 이름', kind: 'text', required: true, placeholder: '華山派' },
];
const SOURCE: Section = {
  title: '출처·고증',
  fields: [
    { path: 'tier_tag', label: '고증 구분', kind: 'select', options: ENUMS.tier_tag, required: true, help: '정통고증 = 중국 고전 원작 / 신무협 = 한국 무협·웹소설 설정' },
    { path: 'tier_note', label: '고증 메모', kind: 'text', placeholder: '원작과 다른 점 등 (선택)' },
    {
      path: 'sources',
      label: '출처 작품',
      kind: 'list',
      required: true,
      addLabel: '출처 추가',
      item: [
        { key: 'work', label: '작품', kind: 'text', placeholder: '소오강호' },
        { key: 'author', label: '작가', kind: 'text', placeholder: '김용' },
      ],
    },
  ],
};

export const DATASETS: Record<DataFile, { label: string; hanja: string; sections: Section[]; blank: () => any; subtitle: (r: any) => string }> = {
  'sects.json': {
    label: '문파',
    hanja: '門派',
    subtitle: (r) => [r.faction, r.region?.province].filter(Boolean).join(' · '),
    blank: () => ({
      id: '', name_kr: '', name_hanja: '', alias: [], tier_tag: '정통고증', sources: [{ work: '', author: null }],
      faction: '정파', sub_faction: null, alliance: null, alignment_note: null,
      region: { province: '', mountain: null, map_position: null, geo: null },
      philosophy: null, signature_arts: [], notable_figures: [], relations: [], summary: '',
    }),
    sections: [
      { title: '기본', fields: [...NAME, { path: 'alias', label: '별칭', kind: 'tags', placeholder: '쉼표로 구분: 화산, 華山' }] },
      {
        title: '세력·위치',
        fields: [
          { path: 'faction', label: '세력', kind: 'select', options: ENUMS.faction, required: true },
          { path: 'sub_faction', label: '하위 분류', kind: 'text', placeholder: '구파일방, 오대세가 …' },
          { path: 'alliance', label: '소속 연맹', kind: 'text', placeholder: '무림맹' },
          { path: 'region.province', label: '지역(성)', kind: 'text', required: true, placeholder: '섬서' },
          { path: 'region.mountain', label: '산·근거지', kind: 'text', placeholder: '화산' },
          { path: 'region.map_position', label: '지도 위치', kind: 'position', required: true },
          { path: 'region.coord_note', label: '위치 메모', kind: 'text' },
        ],
      },
      {
        title: '내용',
        fields: [
          { path: 'summary', label: '요약', kind: 'textarea', rows: 4, required: true, help: '원작 문장을 옮기지 말고 직접 요약하세요.' },
          { path: 'philosophy', label: '문훈·종지', kind: 'textarea', rows: 2 },
          { path: 'alignment_note', label: '성향 메모', kind: 'text' },
        ],
      },
      {
        title: '연결',
        fields: [
          { path: 'signature_arts', label: '대표 무공', kind: 'refs', target: 'martial_arts.json', onlyOwn: true, help: '이 문파 소속 무공 중에서 고릅니다.' },
          {
            path: 'notable_figures', label: '대표 인물', kind: 'list', addLabel: '인물 추가',
            item: [
              { key: 'figure_id', label: '인물', kind: 'ref', target: 'figures.json' },
              { key: 'role', label: '역할', kind: 'text', placeholder: '장문인' },
            ],
          },
          {
            path: 'relations', label: '강호 관계', kind: 'list', addLabel: '관계 추가',
            item: [
              { key: 'sect_id', label: '상대 문파', kind: 'ref', target: 'sects.json' },
              { key: 'type', label: '관계', kind: 'select', options: ENUMS.relation_type },
              { key: 'note', label: '설명', kind: 'text' },
            ],
          },
        ],
      },
      SOURCE,
    ],
  },
  'martial_arts.json': {
    label: '무공',
    hanja: '武功',
    subtitle: (r) => [r.weapon_type, r.grade].filter(Boolean).join(' · '),
    blank: () => ({
      id: '', name_kr: '', name_hanja: '', tier_tag: '정통고증', sources: [{ work: '', author: null }],
      sect_id: null, lineage: null, category: '외공', weapon_type: '검법', grade: '일반',
      origin_and_principle: '', techniques: [], synergy_note: null,
    }),
    sections: [
      { title: '기본', fields: [...NAME, { path: 'alias', label: '이명', kind: 'tags', placeholder: '쉼표로 구분' }] },
      {
        title: '분류',
        fields: [
          { path: 'sect_id', label: '소속 문파', kind: 'ref', target: 'sects.json', nullable: true, nullLabel: '무소속' },
          { path: 'lineage', label: '계보 (무소속일 때)', kind: 'text', placeholder: '독고구패 계보' },
          { path: 'category', label: '분류', kind: 'select', options: ENUMS.category, required: true },
          { path: 'weapon_type', label: '계통', kind: 'select', options: ENUMS.weapon_type, required: true },
          { path: 'grade', label: '등급', kind: 'select', options: ENUMS.grade, required: true },
        ],
      },
      {
        title: '내용',
        fields: [
          { path: 'origin_and_principle', label: '내력·원리', kind: 'textarea', rows: 4, required: true },
          {
            path: 'techniques', label: '초식', kind: 'list', addLabel: '초식 추가',
            item: [
              { key: 'name_kr', label: '한글', kind: 'text' },
              { key: 'name_hanja', label: '한자', kind: 'text' },
              { key: 'description', label: '설명', kind: 'text' },
            ],
          },
          { path: 'synergy_note', label: '상생·상극 메모', kind: 'text' },
        ],
      },
      SOURCE,
    ],
  },
  'figures.json': {
    label: '인물',
    hanja: '人物',
    subtitle: (r) => [r.title, r.realm?.level].filter(Boolean).join(' · '),
    blank: () => ({
      id: '', name_kr: '', name_hanja: '', tier_tag: '정통고증', sources: [{ work: '', author: null }],
      title: '', sect_id: null, era_type: '당대', realm: null, mastered_arts: [], biography: '',
    }),
    sections: [
      { title: '기본', fields: [...NAME, { path: 'title', label: '별호·직함', kind: 'text', placeholder: '검성' }, { path: 'alias', label: '다른 이름', kind: 'tags', placeholder: '쉼표로 구분' }] },
      {
        title: '소속·경지',
        fields: [
          { path: 'sect_id', label: '소속 문파', kind: 'ref', target: 'sects.json', nullable: true, nullLabel: '무소속' },
          { path: 'era_type', label: '시대', kind: 'select', options: ENUMS.era_type, required: true },
          { path: 'realm', label: '경지', kind: 'realm', help: '김용·고룡 원작 인물은 근거를 "신무협환산"으로 두세요.' },
          { path: 'mastered_arts', label: '연마 무공', kind: 'refs', target: 'martial_arts.json' },
        ],
      },
      { title: '내용', fields: [{ path: 'biography', label: '행적', kind: 'textarea', rows: 5, required: true }, { path: 'era_note', label: '시대 메모', kind: 'text' }] },
      SOURCE,
    ],
  },
  'items.json': {
    label: '기물',
    hanja: '奇物',
    subtitle: (r) => r.type ?? '',
    blank: () => ({
      id: '', name_kr: '', name_hanja: '', tier_tag: '정통고증', sources: [{ work: '', author: null }],
      type: '영약', sect_id: null, holders: [], description: '',
    }),
    sections: [
      { title: '기본', fields: [...NAME, { path: 'type', label: '종류', kind: 'select', options: ENUMS.item_type, required: true }] },
      {
        title: '연결',
        fields: [
          { path: 'sect_id', label: '소속 문파', kind: 'ref', target: 'sects.json', nullable: true, nullLabel: '없음' },
          {
            path: 'holders', label: '소유자', kind: 'list', addLabel: '소유자 추가',
            item: [
              { key: 'figure_id', label: '인물', kind: 'ref', target: 'figures.json' },
              { key: 'note', label: '메모', kind: 'text' },
            ],
          },
        ],
      },
      { title: '내용', fields: [{ path: 'description', label: '설명', kind: 'textarea', rows: 4, required: true }] },
      SOURCE,
    ],
  },
  'places.json': {
    label: '명소',
    hanja: '名所',
    subtitle: (r) => [r.type, r.province].filter(Boolean).join(' · '),
    blank: () => ({
      id: '', name_kr: '', name_hanja: '', tier_tag: '정통고증', sources: [{ work: '', author: null }],
      type: '명소', province: '', map_position: null, geo: null, related_sects: [], related_figures: [], image: null, description: '',
    }),
    sections: [
      { title: '기본', fields: [...NAME, { path: 'type', label: '종류', kind: 'select', options: ENUMS.place_type, required: true }] },
      {
        title: '위치',
        fields: [
          { path: 'province', label: '지역(성)', kind: 'text', placeholder: '섬서' },
          { path: 'map_position', label: '지도 위치', kind: 'position', required: true },
          { path: 'image', label: '사진 경로', kind: 'text', placeholder: '/images/places/siguoya.png', help: 'public/images/places/ 안의 파일 (선택)' },
        ],
      },
      {
        title: '연결·내용',
        fields: [
          { path: 'related_sects', label: '관련 문파', kind: 'refs', target: 'sects.json' },
          { path: 'related_figures', label: '관련 인물', kind: 'refs', target: 'figures.json' },
          { path: 'description', label: '설명', kind: 'textarea', rows: 4, required: true },
        ],
      },
      SOURCE,
    ],
  },
};

export const FILE_ORDER: DataFile[] = ['sects.json', 'martial_arts.json', 'figures.json', 'items.json', 'places.json'];

/* ── 경로 도우미: 'region.map_position' 같은 경로로 읽고 쓰기 (원본은 건드리지 않음) */
export function getIn(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const base: any = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  base[head] = rest.length ? setIn(base[head], rest.join('.'), value) : value;
  return base;
}

/** 다른 데이터에서 이 항목을 가리키는 곳 (삭제 전 경고용) */
export function findReferences(d: Record<DataFile, any[]>, file: DataFile, id: string): string[] {
  const out: string[] = [];
  const name = (r: any) => `${r.name_kr}(${r.id})`;
  if (file === 'sects.json') {
    d['martial_arts.json'].filter((a) => a.sect_id === id).forEach((a) => out.push(`무공 ${name(a)}의 소속`));
    d['figures.json'].filter((f) => f.sect_id === id).forEach((f) => out.push(`인물 ${name(f)}의 소속`));
    d['sects.json'].filter((s) => s.relations?.some((r: any) => r.sect_id === id)).forEach((s) => out.push(`문파 ${name(s)}의 관계`));
    d['places.json'].filter((p) => p.related_sects?.includes(id)).forEach((p) => out.push(`명소 ${name(p)}`));
  }
  if (file === 'martial_arts.json') {
    d['sects.json'].filter((s) => s.signature_arts?.includes(id)).forEach((s) => out.push(`문파 ${name(s)}의 대표 무공`));
    d['figures.json'].filter((f) => f.mastered_arts?.includes(id)).forEach((f) => out.push(`인물 ${name(f)}의 연마 무공`));
  }
  if (file === 'figures.json') {
    d['sects.json'].filter((s) => s.notable_figures?.some((n: any) => n.figure_id === id)).forEach((s) => out.push(`문파 ${name(s)}의 대표 인물`));
    d['items.json'].filter((i) => i.holders?.some((h: any) => h.figure_id === id)).forEach((i) => out.push(`기물 ${name(i)}의 소유자`));
    d['places.json'].filter((p) => p.related_figures?.includes(id)).forEach((p) => out.push(`명소 ${name(p)}`));
  }
  return out;
}
