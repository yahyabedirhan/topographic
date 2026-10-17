import { PARAMS } from './params.js';
import { createTopographicBackground, type TopographicBackground, type SnapshotOptions } from './renderer.js';
import { fromAttributes, resolveSettings, type SettingsInput } from './settings.js';

export const ELEMENT_ATTRIBUTES: readonly string[] = [
  'style-name', 'seed', 'theme', 'ink', 'paper', 'mode', 'elevation', 'extent', 'detail', 'quality',
  'azimuth', 'camera-elevation', 'radius', 'camera-motion', 'pan-x', 'pan-z', 'zoom', ...PARAMS.map((p) => p.attr),
];

const Base = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) as typeof HTMLElement;

export class TopographicBackgroundElement extends Base {
  static observedAttributes = ELEMENT_ATTRIBUTES;
  #topographic: TopographicBackground | null = null;

  /** The underlying instance, once connected. */
  get topographic(): TopographicBackground | null { return this.#topographic; }

  #read(): SettingsInput {
    return fromAttributes((n) => this.getAttribute(n));
  }

  connectedCallback(): void {
    if (this.#topographic) return;
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    this.#topographic = createTopographicBackground(this, this.#read());
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

if (typeof customElements !== 'undefined' && !customElements.get('topographic-bg')) {
  customElements.define('topographic-bg', TopographicBackgroundElement);
}

declare global {
  interface HTMLElementTagNameMap { 'topographic-bg': TopographicBackgroundElement }
}
