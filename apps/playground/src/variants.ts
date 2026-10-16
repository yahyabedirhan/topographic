export type VariantId = 'a' | 'b';

export interface VisualVariants {
  dock: VariantId;
  link: VariantId;
  loading: VariantId;
  og: VariantId;
}

/** `variant` sets every prototype. `dock`, `link`, `loading` or `og` overrides one of them. */
export function visualVariants(search: string): VisualVariants {
  const q = new URLSearchParams(search);
  const all = q.get('variant');
  const pick = (key: string): VariantId => ((q.get(key) ?? all) === 'b' ? 'b' : 'a');
  return { dock: pick('dock'), link: pick('link'), loading: pick('loading'), og: pick('og') };
}
