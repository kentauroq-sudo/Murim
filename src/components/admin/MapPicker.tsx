'use client';

import { useRef, useState } from 'react';
import { MAP_HEIGHT, MAP_IMAGE_URL, MAP_WIDTH } from '@/config/map';

interface Pt { x: number; y: number }

/** 지도 이미지를 눌러 map_position(이미지 픽셀, 좌상단 원점)을 정한다 */
export default function MapPicker({ value, others, onChange }: { value: Pt | null; others: (Pt & { label: string })[]; onChange: (p: Pt) => void }) {
  const [zoom, setZoom] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);
  const pct = (p: Pt) => ({ left: `${(p.x / MAP_WIDTH) * 100}%`, top: `${(p.y / MAP_HEIGHT) * 100}%` });

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-muted">지도를 눌러 위치를 찍으세요.</span>
        <span className="ml-auto inline-flex rounded-md border border-line p-0.5">
          {[1, 2, 3].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={`min-h-8 rounded px-2.5 ${zoom === z ? 'bg-ink text-hanji' : 'text-ink-soft'}`}
            >
              {z}배
            </button>
          ))}
        </span>
      </div>
      <div className="max-h-[420px] overflow-auto rounded-lg border border-line-strong bg-paper">
        <div
          ref={boxRef}
          role="button"
          tabIndex={0}
          aria-label="지도에서 위치 고르기"
          style={{ width: `${zoom * 100}%`, aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
          className="relative cursor-crosshair select-none"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onChange({
              x: Math.round(((e.clientX - r.left) / r.width) * MAP_WIDTH),
              y: Math.round(((e.clientY - r.top) / r.height) * MAP_HEIGHT),
            });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MAP_IMAGE_URL} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
          {others.map((o, i) => (
            <span key={i} title={o.label} style={pct(o)} className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/45 ring-1 ring-hanji" />
          ))}
          {value && (
            <span style={pct(value)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2">
              <span className="block size-5 rounded-full border-[3px] border-hanji bg-accent shadow-lg" />
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        {(['x', 'y'] as const).map((k) => (
          <label key={k} className="flex items-center gap-1.5">
            <span className="uppercase text-ink-muted">{k}</span>
            <input
              type="number"
              inputMode="numeric"
              value={value?.[k] ?? ''}
              onChange={(e) => onChange({ x: value?.x ?? 0, y: value?.y ?? 0, [k]: Number(e.target.value) })}
              className="h-9 w-24 rounded-md border border-line bg-white/60 px-2"
            />
          </label>
        ))}
        <span className="text-xs text-ink-muted">(지도 크기 {MAP_WIDTH}×{MAP_HEIGHT})</span>
      </div>
    </div>
  );
}
