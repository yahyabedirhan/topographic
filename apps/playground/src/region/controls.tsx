import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { MapPin } from 'lucide-react';
import { Tip } from '../parts';
import type { RegionController } from './useRegion';

export function km(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const n = meters / 1000;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km`;
}

/** The cluster's map pin. It carries a dot while a place is applied; a fill means only that its popover is open. */
export function PlaceButton({ hasPlace }: { hasPlace: boolean }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={180}
        render={<Popover.Trigger className={`pt-ibtn${hasPlace ? ' has-dot' : ''}`} aria-label="Place" />}
      >
        <MapPin size={18} strokeWidth={1.75} />
      </Tooltip.Trigger>
      <Tip>Place</Tip>
    </Tooltip.Root>
  );
}

/** What the terrain uses now: the applied place with its size and relief, or a hint when there is none. */
export function PlaceNow({ region }: { region: RegionController }) {
  const pin = <span className="pin" aria-hidden="true"><MapPin size={15} strokeWidth={1.75} /></span>;
  if (!region.bbox && region.status !== 'error') {
    return (
      <div className="pt-place-now is-empty" data-region-status={region.status}>
        {pin}
        <span className="copy">
          <b>No place set</b>
          <small>The terrain is generated. Pick a city or frame a region to use real heights.</small>
        </span>
      </div>
    );
  }
  const span = region.info?.span;
  const detail = region.status === 'loading'
    ? 'Reading the land…'
    : region.status === 'error'
      ? region.error
      : span
        ? `${km(span.widthM)} × ${km(span.heightM)} · ${Math.round(region.info?.reliefM ?? 0)} m of relief`
        : '';
  return (
    <div className="pt-place-now" data-region-status={region.status}>
      {pin}
      <span className="copy">
        <b>{region.name || 'Place'}</b>
        <small>{detail}</small>
      </span>
      {region.bbox && <button type="button" className="pt-clear" onClick={region.clear}>Clear</button>}
    </div>
  );
}
