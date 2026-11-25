export type Faction = '정파' | '사파' | '마교' | '세외' | '중립';
export type TierTag = '정통고증' | '신무협';
export type ArtCategory = '내공' | '외공' | '경공' | '기문';
export type WeaponType =
  | '내공심법'
  | '검법'
  | '도법'
  | '권각'
  | '창봉'
  | '암기'
  | '경공'
  | '음공'
  | '진법'
  | '기타';
export type ArtGrade = '일반' | '상승' | '절학';
export type EraType = '전대 고수' | '당대' | '후기지수';
export type RealmLevel = '삼류' | '이류' | '일류' | '절정' | '초절정' | '화경' | '현경' | '생사경';
export type RealmBasis = '원작묘사' | '신무협환산';
export type ItemType = '영약' | '신병' | '비급' | '기물';
export type PlaceType = '명산' | '명소' | '성시' | '관문' | '수계' | '객잔';

export interface Source {
  work: string;
  author: string | null;
}
export interface MapPosition {
  x: number;
  y: number;
}
export interface Geo {
  lat: number;
  lng: number;
}

interface BaseRecord {
  id: string;
  name_kr: string;
  name_hanja: string;
  tier_tag: TierTag;
  sources: Source[];
  /** v2.1에서 이어받은 확장 필드 */
  alias?: string[];
  /** 고증 태그가 한쪽으로 정리되지 않는 경우의 설명 */
  tier_note?: string | null;
}

export interface SectRelation {
  sect_id: string;
  type: string;
  note: string;
}

export interface Sect extends BaseRecord {
  faction: Faction;
  sub_faction: string | null;
  alliance: string | null;
  alignment_note: string | null;
  region: {
    province: string;
    mountain: string | null;
    map_position: MapPosition;
    geo: Geo | null;
    coord_note?: string | null;
  };
  philosophy: string | null;
  signature_arts: string[];
  notable_figures: { figure_id: string; role: string }[];
  relations?: SectRelation[];
  summary: string;
}

export interface Technique {
  name_kr: string;
  name_hanja: string;
  description: string;
}

export interface MartialArt extends BaseRecord {
  sect_id: string | null;
  lineage: string | null;
  category: ArtCategory;
  weapon_type: WeaponType;
  grade: ArtGrade;
  origin_and_principle: string;
  techniques: Technique[];
  synergy_note: string | null;
  /** v2.1 분류에서 옮겨 적은 원문 */
  enum_note?: string | null;
}

export interface Figure extends BaseRecord {
  title: string;
  sect_id: string | null;
  era_type: EraType;
  realm: { level: RealmLevel; basis: RealmBasis } | null;
  mastered_arts: string[];
  biography: string;
  era_note?: string | null;
}

export interface Item extends BaseRecord {
  type: ItemType;
  sect_id: string | null;
  holders: { figure_id: string; note: string }[];
  description: string;
}

export interface Place extends BaseRecord {
  type: PlaceType;
  province: string;
  map_position: MapPosition;
  geo: Geo | null;
  related_sects: string[];
  related_figures: string[];
  image?: string | null;
  description: string;
}
