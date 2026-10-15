import { ExportStage } from './exporting';
import type { Playground } from './shared';
import { GlassFrame, TuneFocus } from './ui';

export function VariantP5({ pg }: { pg: Playground }) {
  return <GlassFrame pg={pg} tune={<TuneFocus pg={pg} />} dialog={(open, onOpenChange) => <ExportStage pg={pg} open={open} onOpenChange={onOpenChange} />} />;
}
