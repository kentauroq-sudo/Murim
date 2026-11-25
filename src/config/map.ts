import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import type { Faction, MapPosition } from '@/types/wuxia';
import { withBasePath } from '@/lib/base-path';
import mapConfig from './map.json';

// 하위 경로 배포(/Murim)에서도 고지도 이미지가 로드되도록 접두사를 붙인다.
export const MAP_IMAGE_URL = withBasePath(mapConfig.image);
export const MAP_WIDTH = mapConfig.width;
export const MAP_HEIGHT = mapConfig.height;
export const MAP_BOUNDS: LatLngBoundsExpression = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH],
];

/** 이미지 픽셀 좌표(좌상단 원점) → Leaflet CRS.Simple 좌표([y, x], 좌하단 원점) */
export function toLatLng({ x, y }: MapPosition): LatLngTuple {
  return [MAP_HEIGHT - y, x];
}

/** 세력별 마커 색. Tailwind가 찾을 수 있도록 클래스 이름을 완전한 문자열로 적는다. */
export const FACTION_MARKER_CLASS: Record<Faction, string> = {
  정파: 'bg-orthodox border-orthodox-accent border-solid',
  사파: 'bg-unorthodox border-unorthodox-accent border-solid',
  마교: 'bg-demonic border-demonic-accent border-dashed',
  세외: 'bg-outer border-outer-accent border-dotted',
  중립: 'bg-neutral-sect border-neutral-sect-accent border-solid',
};

/** 지도 범례·필터에 쓰는 세력 이름 */
export const FACTIONS: Faction[] = ['정파', '사파', '마교', '세외', '중립'];

export const FACTION_SWATCH: Record<Faction, string> = {
  정파: 'bg-orthodox border-orthodox-accent',
  사파: 'bg-unorthodox border-unorthodox-accent',
  마교: 'bg-demonic border-demonic-accent',
  세외: 'bg-outer border-outer-accent',
  중립: 'bg-neutral-sect border-neutral-sect-accent',
};
