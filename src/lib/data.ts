import sectsJson from '@/data/sects.json';
import artsJson from '@/data/martial_arts.json';
import figuresJson from '@/data/figures.json';
import itemsJson from '@/data/items.json';
import placesJson from '@/data/places.json';
import type { Figure, Item, MartialArt, Place, Sect } from '@/types/wuxia';

// 형식은 빌드 전 scripts/validate-data.mjs가 보장하므로 여기서는 타입만 붙인다.
export const sects = sectsJson as unknown as Sect[];
export const martialArts = artsJson as unknown as MartialArt[];
export const figures = figuresJson as unknown as Figure[];
export const items = itemsJson as unknown as Item[];
export const places = placesJson as unknown as Place[];

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((r) => [r.id, r]));
export const sectById = byId(sects);
export const artById = byId(martialArts);
export const figureById = byId(figures);
export const itemById = byId(items);
export const placeById = byId(places);

export const getArtsOfSect = (sectId: string) => martialArts.filter((a) => a.sect_id === sectId);
export const getFiguresOfSect = (sectId: string) => figures.filter((f) => f.sect_id === sectId);
/** 무공의 연마자: 인물의 mastered_arts에서 계산 (무공 쪽에는 저장하지 않음) */
export const getPractitioners = (artId: string) => figures.filter((f) => f.mastered_arts.includes(artId));
export const getPlacesOfSect = (sectId: string) => places.filter((p) => p.related_sects.includes(sectId));
export const getItemsOfSect = (sectId: string) =>
  items.filter((it) => it.sect_id === sectId || it.holders.some((h) => figureById.get(h.figure_id)?.sect_id === sectId));
export const getItemsOfFigure = (figureId: string) => items.filter((it) => it.holders.some((h) => h.figure_id === figureId));
export const getArtsOfFigure = (figureId: string) => {
  const fig = figureById.get(figureId);
  return (fig?.mastered_arts ?? []).map((id) => artById.get(id)).filter((a): a is MartialArt => Boolean(a));
};
export const getRelationTarget = (sectId: string) => sectById.get(sectId);
