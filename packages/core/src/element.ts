// <topography-bg>: a custom element around createTopography. Importing 'topography/element'
// registers it. Attributes come from the params table (see params.ts), plus style-name, seed,
// theme, ink and paper. Attribute changes update live.
import { PARAMS } from './params.js';
import { createTopography, type Topography, type SnapshotOptions } from './renderer.js';
import { fromAttributes, resolveSettings, type SettingsInput } from './settings.js';

export const ELEMENT_ATTRIBUTES: readonly string[] = ['style-name', 'seed', 'theme', 'ink', 'paper', ...PARAMS.map((p) => p.attr)];

const Base = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) as typeof HTMLElement;

export class TopographyElement extends Base {
  static observedAttributes = ELEMENT_ATTRIBUTES;
  #topography: Topography | null = null;

  /** The underlying instance, once connected. */
  get topography(): Topography | null { return this.#topography; }

  #read(): SettingsInput {
    return fromAttributes((n) => this.getAttribute(n));
  }

  connectedCallback(): void {
    if (this.#topography) return;
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    this.#topography = createTopography(this, this.#read());
  }

  disconnectedCallback(): void {
    this.#topography?.destroy();
    this.#topography = null;
  }

  attributeChangedCallback(): void {
    if (!this.#topography) return;
    // Resolve from scratch so a removed attribute returns to its (style) default.
    const full = resolveSettings(this.#read());
    this.#topography.update({ ...full, theme: { ink: undefined, paper: undefined, ...full.theme } });
  }

  snapshot(opts?: SnapshotOptions): Promise<Blob> {
    if (!this.#topography) return Promise.reject(new Error('[topography] element is not connected'));
    return this.#topography.snapshot(opts);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('topography-bg')) {
  customElements.define('topography-bg', TopographyElement);
}

declare global {
  interface HTMLElementTagNameMap { 'topography-bg': TopographyElement }
}
