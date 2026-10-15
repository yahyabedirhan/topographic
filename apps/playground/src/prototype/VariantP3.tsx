import { ExportStack } from './exporting';
import type { Playground } from './shared';
import { GlassFrame, TuneDial } from './ui';

export function VariantP3({ pg }: { pg: Playground }) {
  return <GlassFrame pg={pg} tune={<TuneDial pg={pg} />} dialog={(open, onOpenChange) => <ExportStack pg={pg} open={open} onOpenChange={onOpenChange} />} />;
}
