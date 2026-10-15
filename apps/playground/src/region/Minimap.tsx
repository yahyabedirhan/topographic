import { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Tip } from '../parts';
import type { Heightfield } from 'topographic';
import type { Playground } from '../shared';
import type { Terrains } from '../terrains';
import { fitRotating, minimapTurn, northTarget } from './compass';

/** How long the compass takes to turn the camera back to north, in milliseconds. */
const TURN_MS = 520;

/**
 * Draws the heightfield as a quiet land-and-sea picture, for a saved item made before minimaps
 * (or a place opened from a link), which has no map image.
 */
function fieldPicture(field: Heightfield, ink: string): string | null {
  try {
    const n = field.size;
    const canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(n, n);
    const [r, g, b] = ink.match(/\d+/g)!.map(Number);
    for (let row = 0; row < n; row++) {
      // Row 0 of the field is south; row 0 of the picture is the top, so it reads north-up.
      const src = (n - 1 - row) * n;
      for (let col = 0; col < n; col++) {
        const h = field.samples[src + col];
        const o = (row * n + col) * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = h <= 0.004 ? 18 : Math.round(70 + 150 * Math.min(1, h));
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The minimap: the applied map area as a small picture just above the dock's right end. In 3D it
 * turns with the camera, so it always matches the terrain on screen, and the compass on it shows
 * where north is; a click on the compass turns the camera back to north-up. In 2D the map is
 * already north-up, so the minimap stands still and the compass hides. A click on the picture
 * opens the Map popover.
 */
export function Minimap({ pg, terrains, onOpenMap }: { pg: Playground; terrains: Terrains; onOpenMap?: () => void }) {
  const { region, activeSaved, activeMapLook } = terrains;
  const kept = activeMapLook?.minimap ?? activeSaved?.minimap;
  const field = region.status === 'ready' ? region.field : null;
  const three = pg.settings.mode === '3d';
  const root = useRef<HTMLDivElement>(null);
  const turner = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const [covered, setCovered] = useState(false);
  const [ink, setInk] = useState('');
  useEffect(() => {
    // The picture's ink follows the theme; read it once the theme has been applied.
    setInk(getComputedStyle(document.documentElement).color || 'rgb(127,127,127)');
  }, [pg.mode]);
  const fallback = useMemo(() => (field && !kept && ink ? fieldPicture(field, ink) : null), [field, kept, ink]);
  const picture = kept ?? fallback;

  // Follows the live camera, motion paths included, by writing the transform directly each frame.
  useEffect(() => {
    if (!field) return;
    let id = 0;
    let last = NaN;
    let check = 0;
    const tick = (now: number) => {
      const pose = pg.instance.current?.pose;
      const turn = three && pose ? minimapTurn(pose.azimuth) : 0;
      if (turn !== last) {
        last = turn;
        if (turner.current) turner.current.style.transform = `rotate(${turn}deg)`;
        if (needle.current) needle.current.style.transform = `rotate(${turn}deg)`;
        if (root.current) root.current.dataset.turn = turn.toFixed(1);
      }
      // A few times a second: hide under any open popover rather than overlap it.
      if (now - check > 200 && root.current) {
        check = now;
        const box = root.current.getBoundingClientRect();
        const hit = [...document.querySelectorAll('.pt-pop')].some((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top;
        });
        setCovered((c) => (c === hit ? c : hit));
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [field, three, pg.instance]);

  const turning = useRef(0);
  useEffect(() => () => cancelAnimationFrame(turning.current), []);
  const northUp = () => {
    cancelAnimationFrame(turning.current);
    const from = pg.instance.current?.pose.azimuth ?? pg.settings.camera.azimuth;
    const start = minimapTurn(from);
    const goal = northTarget(start);
    if (prefersReducedMotion() || start === goal) {
      pg.change({ camera: { azimuth: 0, motion: 'still' } });
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / TURN_MS);
      const e = 1 - (1 - t) ** 3;
      const az = t >= 1 ? 0 : Number((start + (goal - start) * e).toFixed(1));
      pg.change({ camera: { azimuth: az, motion: 'still' } });
      if (t < 1) turning.current = requestAnimationFrame(step);
    };
    turning.current = requestAnimationFrame(step);
  };

  if (!field || !picture) return null;
  const { width, height } = fitRotating(field.aspect || 1, 100);
  const name = activeMapLook?.name ?? activeSaved?.name ?? region.name ?? 'Area';
  return (
    <div
      ref={root}
      className={`pt-minimap pt-glass${covered ? ' is-covered' : ''}${three ? ' is-3d' : ''}`}
      data-turn="0"
      aria-hidden={covered ? true : undefined}
    >
      <button type="button" className="pt-minimap-map" aria-label={`${name} on the map. Open the map`} onClick={onOpenMap}>
        <div className="pt-minimap-turn" ref={turner}>
          <img src={picture} alt="" style={{ width: `${width}%`, height: `${height}%` }} />
        </div>
      </button>
      {three ? (
        <Tooltip.Root>
          <Tooltip.Trigger delay={280} className="pt-compass" aria-label="North up" onClick={northUp}>
            <span className="pt-compass-needle" ref={needle} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <text x="12" y="7.6" textAnchor="middle" className="pt-compass-letter">N</text>
                <path d="M12 9.2 14.6 15.4H9.4z" className="pt-compass-n" />
                <path d="M12 21.4 9.4 15.4h5.2z" className="pt-compass-s" />
              </svg>
            </span>
          </Tooltip.Trigger>
          <Tip side="top">North up</Tip>
        </Tooltip.Root>
      ) : null}
    </div>
  );
}
