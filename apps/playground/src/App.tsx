import { Tooltip } from '@base-ui-components/react/tooltip';
import { ExportMenu } from './exporting';
import { usePlayground } from './shared';
import { useTerrains } from './terrains';
import { GlassFrame, TuneStrip } from './ui';
import { noteInitialMode } from './device';
import { useState } from 'react';

export function App() {
  const pg = usePlayground();
  useState(() => noteInitialMode(pg.settings.mode === '3d' ? '3d' : '2d'));
  const terrains = useTerrains(pg);
  return (
    <Tooltip.Provider delay={200}>
      <GlassFrame
        pg={pg}
        terrains={terrains}
        tune={<TuneStrip pg={pg} region={terrains.region} />}
        exporting={(open, onOpenChange, clusterRef) => (
          <ExportMenu pg={pg} place={terrains.region.bbox && terrains.region.placeId ? terrains.region.name : null} open={open} onOpenChange={onOpenChange} clusterRef={clusterRef} />
        )}
      />
    </Tooltip.Provider>
  );
}
