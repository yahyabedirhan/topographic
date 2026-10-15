import { ExportBeside } from './exporting';
import type { Playground } from './shared';
import { GlassFrame, TuneLine } from './ui';

export function VariantP1({ pg }: { pg: Playground }) {
  return <GlassFrame pg={pg} tune={<TuneLine pg={pg} />} dialog={(open, onOpenChange) => <ExportBeside pg={pg} open={open} onOpenChange={onOpenChange} />} />;
}
