import { ExportSteps } from './exporting';
import type { Playground } from './shared';
import { GlassFrame, TuneStrip } from './ui';

export function VariantP2({ pg }: { pg: Playground }) {
  return <GlassFrame pg={pg} tune={<TuneStrip pg={pg} />} dialog={(open, onOpenChange) => <ExportSteps pg={pg} open={open} onOpenChange={onOpenChange} />} />;
}
