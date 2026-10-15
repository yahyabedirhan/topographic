// <topographic-bg>: a custom element around createTopographic. Importing 'topographic/element'
// registers it. Attributes come from the params table (see params.ts), plus style-name, seed,
// theme, ink and paper. Attribute changes update live.
import { PARAMS } from './params.js';
import { createTopographic, type Topographic, type SnapshotOptions } from './renderer.js';
import { fromAttributes, resolveSettings, type SettingsInput } from './settings.js';

export const ELEMENT_ATTRIBUTES: readonly string[] = ['style-name', 'seed', 'theme', 'ink', 'paper', ...PARAMS.map((p) => p.attr)];

const Base = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) as typeof HTMLElement;

export class TopographicElement extends Base {
  static observedAttributes = ELEMENT_ATTRIBUTES;
  #topographic: Topographic | null = null;

  /** The underlying instance, once connected. */
  get topographic(): Topographic | null { return this.#topographic; }

  #read(): SettingsInput {
    return fromAttributes((n) => this.getAttribute(n));
  }

  connectedCallback(): void {
    if (this.#topographic) return;
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    this.#topographic = createTopographic(this, this.#read());
  }

  disconnectedCallback(): void {
    this.#topographic?.destroy();
    this.#topographic = null;
  }

  attributeChangedCallback(): void {
    if (!this.#topographic) return;
    // Resolve from scratch so a removed attribute returns to its (style) default.
    const full = resolveSettings(this.#read());
    this.#topographic.update({ ...full, theme: { ink: undefined, paper: undefined, ...full.theme } });
  }

  snapshot(opts?: SnapshotOptions): Promise<Blob> {
    if (!this.#topographic) return Promise.reject(new Error('[topographic] element is not connected'));
    return this.#topographic.snapshot(opts);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('topographic-bg')) {
  customElements.define('topographic-bg', TopographicElement);
}

declare global {
  interface HTMLElementTagNameMap { 'topographic-bg': TopographicElement }
}
