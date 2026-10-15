import { MapPin } from 'lucide-react';
import type { RegionController } from './useRegion';

export function km(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const n = meters / 1000;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km`;
}

export function PlaceButton({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  return (
    <button type="button" className="pt-ibtn" aria-label="Place" aria-pressed={pressed} onClick={onClick}>
      <MapPin size={18} strokeWidth={1.75} />
    </button>
  );
}

export function RegionPill({ region, onOpen }: { region: RegionController; onOpen: () => void }) {
  if (region.status === 'idle' && !region.error) return null;
  const span = region.info?.span;
  const detail = region.status === 'loading'
    ? 'Reading the land…'
    : region.status === 'error'
      ? region.error
      : span
        ? `${km(span.widthM)} × ${km(span.heightM)} · ${Math.round(region.info?.reliefM ?? 0)} m of relief`
        : '';
  return (
    <div className="pt-region pt-glass" data-region-status={region.status}>
      <button type="button" className="pt-region-name" onClick={onOpen}>{region.name || 'Place'}</button>
      <span>{detail}</span>
      {region.bbox && (
        <button type="button" className="pt-region-clear" onClick={region.clear}>Clear</button>
      )}
    </div>
  );
}
