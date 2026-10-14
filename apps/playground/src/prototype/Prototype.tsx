// PROTOTYPE: five background-first variants of the playground, switchable via ?variant=A..E on the existing route.
// Throwaway. Pick a direction, fold it into App.tsx properly, then drop this folder.
import { useState } from 'react';
import { PrototypeSwitcher } from './Switcher';
import { usePlayground } from './shared';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';
import { VariantD } from './VariantD';
import { VariantE } from './VariantE';
import './prototype.css';

const VARIANTS = [
  { key: 'A', name: 'Glass dock', C: VariantA },
  { key: 'B', name: 'Command palette', C: VariantB },
  { key: 'C', name: 'Filmstrip', C: VariantC },
  { key: 'D', name: 'Inspector card', C: VariantD },
  { key: 'E', name: 'Gallery first', C: VariantE },
];

export function Prototype() {
  const [variant, setVariant] = useState(() => new URLSearchParams(location.search).get('variant') ?? 'A');
  const pg = usePlayground();
  const V = (VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0]).C;
  const change = (key: string) => {
    const q = new URLSearchParams(location.search);
    q.set('variant', key);
    history.replaceState(null, '', `${location.pathname}?${q}`);
    setVariant(key);
  };
  return (
    <>
      <V key={variant} pg={pg} />
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={change} />
    </>
  );
}
