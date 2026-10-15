import { useCallback, useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { SlidersHorizontal } from 'lucide-react';
import { SplitDialog } from './exporting';
import type { Playground } from './shared';
import { ExportButton, Shell, Tip, TuneBody, useDismiss } from './ui';

export function VariantA2({ pg }: { pg: Playground }) {
  const [tune, setTune] = useState(false);
  const [exp, setExp] = useState(false);
  const close = useCallback(() => { setTune(false); setExp(false); }, []);
  useDismiss(close);
  return (
    <Popover.Root open={tune} onOpenChange={(open) => { setTune(open); if (open) setExp(false); }}>
      <Shell
        pg={pg}
        tune={(
          <Tooltip.Root>
            <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Tune" />}>
              <SlidersHorizontal size={18} strokeWidth={1.75} />
            </Tooltip.Trigger>
            <Tip>Tune</Tip>
          </Tooltip.Root>
        )}
        exporting={<ExportButton pressed={exp} onClick={() => { setExp((v) => !v); setTune(false); }} />}
      >
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={16} className="pt-layer">
            <Popover.Popup className="pt-pop pt-solid pt-tune-pop pt-panel">
              <Popover.Title className="pt-pop-title">Tune</Popover.Title>
              <TuneBody pg={pg} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
        <SplitDialog pg={pg} open={exp} onOpenChange={setExp} />
      </Shell>
    </Popover.Root>
  );
}
