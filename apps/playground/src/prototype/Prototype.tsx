import { useState } from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { PrototypeSwitcher } from './Switcher';
import { usePlayground } from './shared';
import { VariantP1 } from './VariantP1';
import { VariantP2 } from './VariantP2';
import { VariantP3 } from './VariantP3';
import { VariantP4 } from './VariantP4';
import { VariantP5 } from './VariantP5';
import './prototype.css';

const VARIANTS = [
  { key: 'P1', name: 'Line', C: VariantP1 },
  { key: 'P2', name: 'Strip', C: VariantP2 },
  { key: 'P3', name: 'Dial', C: VariantP3 },
  { key: 'P4', name: 'Grid', C: VariantP4 },
  { key: 'P5', name: 'Focus', C: VariantP5 },
];

function readVariant() {
  const raw = new URLSearchParams(location.search).get('variant') ?? 'P1';
  if (raw === 'A' || raw === 'A2') return 'P1';
  return VARIANTS.some((v) => v.key === raw) ? raw : 'P1';
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
