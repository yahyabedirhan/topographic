import { Tooltip } from '@base-ui-components/react/tooltip';
import { usePlayground } from './shared';
import { VariantP2 } from './VariantP2';
import './prototype.css';

export function Prototype() {
  const pg = usePlayground();
  return (
    <Tooltip.Provider delay={200}>
      <VariantP2 pg={pg} />
    </Tooltip.Provider>
  );
}
