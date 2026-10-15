import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Earth } from 'lucide-react';
import { Tip } from '../parts';

export function km(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const n = meters / 1000;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km`;
}

/**
 * The cluster's Map button. Its icon is a globe, so it never reads as the folded map of the 2D toggle.
 * It carries a dot while a place is applied; a fill means only that its popover is open.
 */
export function MapButton({ hasPlace }: { hasPlace: boolean }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={180}
        render={<Popover.Trigger className={`pt-ibtn${hasPlace ? ' has-dot' : ''}`} aria-label="Map" />}
      >
        <Earth size={18} strokeWidth={1.75} />
      </Tooltip.Trigger>
      <Tip>Map</Tip>
    </Tooltip.Root>
  );
}
