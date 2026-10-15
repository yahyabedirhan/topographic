import { useState } from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { PrototypeSwitcher } from './Switcher';
import { usePlayground } from './shared';
import { VariantA1 } from './VariantA1';
import { VariantA2 } from './VariantA2';
import { VariantA3 } from './VariantA3';
import { VariantA4 } from './VariantA4';
import { VariantA5 } from './VariantA5';
import './prototype.css';

const VARIANTS = [
  { key: 'A1', name: 'Stage', C: VariantA1 },
  { key: 'A2', name: 'Popover', C: VariantA2 },
  { key: 'A3', name: 'Sheet', C: VariantA3 },
  { key: 'A4', name: 'Mixer', C: VariantA4 },
  { key: 'A5', name: 'Rail', C: VariantA5 },
];

function readVariant() {
  const raw = new URLSearchParams(location.search).get('variant') ?? 'A1';
  if (raw === 'A') return 'A1';
  return VARIANTS.some((v) => v.key === raw) ? raw : 'A1';
}

export function Prototype() {
  const [variant, setVariant] = useState(readVariant);
  const pg = usePlayground();
  const V = (VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0]).C;
  const change = (key: string) => {
    const q = new URLSearchParams(location.search);
    q.set('variant', key);
    history.replaceState(null, '', `${location.pathname}?${q}`);
    setVariant(key);
  };
  return (
    <Tooltip.Provider delay={200}>
      <V key={variant} pg={pg} />
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={change} />
    </Tooltip.Provider>
  );
}
