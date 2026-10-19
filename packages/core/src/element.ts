import { PARAMS } from './params.js';
import { createTopography, type Topography, type SnapshotOptions } from './renderer.js';
import { fromAttributes, resolveSettings, type SettingsInput } from './settings.js';

export const ELEMENT_ATTRIBUTES: readonly string[] = [
  'look', 'shape', 'seed', 'theme', 'ink', 'paper', 'mode', 'elevation', 'extent', 'detail', 'quality',
  'azimuth', 'camera-elevation', 'radius', 'camera-motion', 'pan-x', 'pan-z', 'view-x', 'view-y', 'view-zoom', ...PARAMS.map((p) => p.attr),
];

const Base = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) as typeof HTMLElement;

export class TopographyElement extends Base {
  static observedAttributes = ELEMENT_ATTRIBUTES;
  #topographic: Topography | null = null;

  /** The underlying instance, once connected. */
  get topographic(): Topography | null { return this.#topographic; }

  #read(): SettingsInput {
    return fromAttributes((n) => this.getAttribute(n));
  }

  connectedCallback(): void {
    if (this.#topographic) return;
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    this.#topographic = createTopography(this, this.#read());
  }

  disconnectedCallback(): void {
    this.#topographic?.destroy();
    this.#topographic = null;
  }

  attributeChangedCallback(): void {
    if (!this.#topographic) return;
    const full = resolveSettings(this.#read());
    this.#topographic.update({ ...full, theme: { ink: undefined, paper: undefined, ...full.theme } });
  }

  snapshot(opts?: SnapshotOptions): Promise<Blob> {
    if (!this.#topographic) return Promise.reject(new Error('[topographic] element is not connected'));
    return this.#topographic.snapshot(opts);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('topographic-view')) {
  customElements.define('topographic-view', TopographyElement);
}

declare global {
  interface HTMLElementTagNameMap { 'topographic-view': TopographyElement }
}
