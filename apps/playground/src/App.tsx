import { Tooltip } from '@base-ui-components/react/tooltip';
import { ExportMenu } from './exporting';
import { usePlayground } from './shared';
import { GlassFrame, TuneStrip } from './ui';

export function App() {
  const pg = usePlayground();
  return (
    <Tooltip.Provider delay={200}>
      <GlassFrame
        pg={pg}
        tune={<TuneStrip pg={pg} />}
        exporting={(open, onOpenChange, clusterRef) => (
          <ExportMenu pg={pg} open={open} onOpenChange={onOpenChange} clusterRef={clusterRef} />
        )}
      />
    </Tooltip.Provider>
  );
}
