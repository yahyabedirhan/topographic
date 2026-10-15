import { Tooltip } from '@base-ui-components/react/tooltip';
import { ExportMenu } from './exporting';
import { usePlayground } from './shared';
import { useTerrains } from './terrains';
import { GlassFrame, TuneStrip } from './ui';

export function App() {
  const pg = usePlayground();
  const terrains = useTerrains(pg);
  return (
    <Tooltip.Provider delay={200}>
      <GlassFrame
        pg={pg}
        terrains={terrains}
        tune={<TuneStrip pg={pg} region={terrains.region} />}
        exporting={(open, onOpenChange, clusterRef) => (
          <ExportMenu pg={pg} open={open} onOpenChange={onOpenChange} clusterRef={clusterRef} />
        )}
      />
    </Tooltip.Provider>
  );
}
