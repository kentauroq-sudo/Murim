'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageOverlay, MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Faction, MapPosition, Sect } from '@/types/wuxia';
import { MAP_BOUNDS, MAP_HEIGHT, MAP_IMAGE_URL, MAP_WIDTH, toLatLng } from '@/config/map';
import { withBasePath } from '@/lib/base-path';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** globals.css의 .sect-marker[data-faction] 규칙과 짝 */
const FACTION_KEY: Record<Faction, string> = {
  정파: 'orthodox',
  사파: 'unorthodox',
  마교: 'demonic',
  세외: 'outer',
  중립: 'neutral',
};

/** 줌 단계별 라벨 밀도 (globals.css의 [data-zoom] 규칙과 짝) */
function zoomBand(zoom: number): 'far' | 'mid' | 'near' {
  if (zoom < -1) return 'far';
  if (zoom < 0.5) return 'mid';
  return 'near';
}

// 크기 0인 아이콘 안에서 라벨을 -50%씩 옮겨, 이름 길이와 상관없이 좌표 정중앙에 오게 한다.
function createSectIcon(sect: Sect, selected: boolean) {
  return L.divIcon({
    className: 'wuxia-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<div class="sect-marker${selected ? ' is-selected' : ''}" data-faction="${FACTION_KEY[sect.faction]}"><span class="sect-marker__dot"></span><span class="sect-marker__name">${escapeHtml(sect.name_kr)}</span><span class="sect-marker__hanja">${escapeHtml(sect.name_hanja)}</span></div>`,
  });
}

/** 현재 줌 단계와 이름표 설정을 지도 컨테이너 속성으로 기록 → CSS가 라벨 밀도를 조절 */
function LabelController({ showLabels }: { showLabels: boolean }) {
  const map = useMapEvents({
    zoomend: () => {
      map.getContainer().dataset.zoom = zoomBand(map.getZoom());
    },
  });
  useEffect(() => {
    const el = map.getContainer();
    el.dataset.zoom = zoomBand(map.getZoom());
    el.dataset.labels = showLabels ? 'on' : 'off';
  }, [map, showLabels]);
  return null;
}

/** 선택한 문파로 부드럽게 이동. 상세 패널(모바일 하단 시트 / 데스크톱 오른쪽 패널)에 가리지 않게 비켜 준다 */
function FlyToController({ target }: { target: MapPosition | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Math.max(map.getZoom(), 0);
    const size = map.getSize();
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const offset = mobile ? L.point(0, size.y * 0.3) : L.point(size.x > 1100 ? 210 : 0, 0);
    const center = map.unproject(map.project(toLatLng(target), zoom).add(offset), zoom);
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [target, map]);
  return null;
}

/** 지도가 화면을 꽉 채우는 최소 줌 (비율 유지, 빈 여백 없음). zoomSnap 0.5에 맞춰 올림 */
function coverZoom(map: LeafletMap) {
  const size = map.getSize();
  const z = Math.log2(Math.max(size.x / MAP_WIDTH, size.y / MAP_HEIGHT));
  return Math.ceil(z * 2) / 2;
}

/**
 * 화면 크기에 맞춰 지도 이미지가 늘어나거나 빈 여백이 생기지 않게 한다.
 * - 세로 화면(휴대폰): 높이에 맞춰 꽉 채우고, 좌우는 손가락으로 밀어 본다. 처음에는 문파가 모인 중원을 가운데로.
 * - 가로 화면: 거의 전체가 한 화면에 들어오고 위아래·좌우 빈 띠가 생기지 않는다.
 * - 화면을 돌리거나 창 크기를 바꾸면 다시 계산한다.
 */
function CoverFit({ center }: { center: MapPosition }) {
  const map = useMap();
  useEffect(() => {
    const apply = (initial: boolean) => {
      const minZ = coverZoom(map);
      map.setMinZoom(minZ);
      if (initial) map.setView(toLatLng(center), minZ, { animate: false });
      else if (map.getZoom() < minZ) map.setZoom(minZ, { animate: false });
    };
    apply(true);
    const onResize = () => apply(false);
    map.on('resize', onResize);
    return () => {
      map.off('resize', onResize);
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * 확대·축소·전체보기 버튼 (Leaflet 기본 버튼 대신)
 * - 48px 크기, 진한 테두리로 잘 보이게
 * - 상세 패널이 열리면 globals.css 규칙(main[data-drawer=open] .map-controls)이 패널 옆으로 비켜 준다
 */
function MapControls() {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  useEffect(() => {
    // 버튼을 누를 때 지도가 함께 끌리거나 확대되지 않게
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);
  return (
    <div ref={ref} role="group" aria-label="지도 확대·축소" className="map-controls">
      <button type="button" onClick={() => map.zoomIn()} disabled={zoom >= map.getMaxZoom()} title="확대 (+ 키)">
        <span aria-hidden>+</span>
        <span className="sr-only">확대</span>
      </button>
      <button type="button" onClick={() => map.zoomOut()} disabled={zoom <= map.getMinZoom()} title="축소 (− 키)">
        <span aria-hidden>−</span>
        <span className="sr-only">축소</span>
      </button>
      <button type="button" onClick={() => map.flyTo(map.getCenter(), coverZoom(map), { duration: 0.6 })} title="지도 전체 보기" className="map-controls__fit">
        전체
      </button>
    </div>
  );
}

interface WuxiaMapProps {
  sects: Sect[];
  onSelectSect: (sect: Sect) => void;
  selectedId?: string | null;
  showLabels?: boolean;
}

export default function WuxiaMap({ sects, onSelectSect, selectedId = null, showLabels = true }: WuxiaMapProps) {
  const icons = useMemo(
    () => new Map(sects.map((s) => [s.id, createSectIcon(s, s.id === selectedId)])),
    [sects, selectedId],
  );
  // 처음 화면의 가운데: 문파들이 모인 곳의 평균 위치
  const initialCenter = useMemo<MapPosition>(() => {
    if (!sects.length) return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const sum = sects.reduce((a, s) => ({ x: a.x + s.region.map_position.x, y: a.y + s.region.map_position.y }), { x: 0, y: 0 });
    return { x: Math.round(sum.x / sects.length), y: Math.round(sum.y / sects.length) };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const target = useMemo(
    () => sects.find((s) => s.id === selectedId)?.region.map_position ?? null,
    [sects, selectedId],
  );

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={MAP_BOUNDS}
      maxBounds={MAP_BOUNDS}
      maxBoundsViscosity={1}
      minZoom={-2}
      maxZoom={2}
      zoomSnap={0.5}
      zoomControl={false}
      className="h-dvh w-full bg-paper"
    >
      <CoverFit center={initialCenter} />
      <MapControls />
      <ImageOverlay
        url={MAP_IMAGE_URL}
        bounds={MAP_BOUNDS}
        attribution={`지도: 수묵 고지도 &middot; <a href="${withBasePath('/images/CREDITS.md')}">CREDITS</a>`}
      />
      <LabelController showLabels={showLabels} />
      <FlyToController target={target} />
      {sects.map((sect) => (
        <Marker
          key={sect.id}
          position={toLatLng(sect.region.map_position)}
          icon={icons.get(sect.id)!}
          title={`${sect.name_kr}(${sect.name_hanja}) · ${sect.faction}`}
          alt={`${sect.name_kr} 위치`}
          zIndexOffset={sect.id === selectedId ? 1000 : 0}
          // Leaflet 마커는 Tab으로 초점이 가고 Enter를 누르면 click이 발생한다
          eventHandlers={{ click: () => onSelectSect(sect) }}
        />
      ))}
    </MapContainer>
  );
}
