import { ExportRail } from './exporting';
import type { Playground } from './shared';
import { GlassFrame, TuneGrid } from './ui';

export function VariantP4({ pg }: { pg: Playground }) {
  return <GlassFrame pg={pg} wide tune={<TuneGrid pg={pg} />} dialog={(open, onOpenChange) => <ExportRail pg={pg} open={open} onOpenChange={onOpenChange} />} />;
}
