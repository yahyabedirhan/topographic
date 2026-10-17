// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { EVENT_NAMES, createDebouncer, createTracker, errorLabel, track, trackDebounced, type AnalyticsEvents } from './analytics';
import { createErrorQueue, reportError, reportMessage } from './errors';
import { browserName, osFamily, superProperties, viewportClass } from './device';
import { quantile } from './perf';

describe('analytics', () => {
  it('is a no-op without a key: nothing loads and nothing is sent', async () => {
    const load = vi.fn();
    const t = createTracker(undefined, 'https://eu.i.posthog.com', load);
    t.start();
    t.track('shuffle_clicked', { target: 'all' });
    await Promise.resolve();
    expect(t.enabled).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('the exported track does nothing in a test build, which has no key', () => {
    expect(() => track('link_copied', { params_count: 2 })).not.toThrow();
    expect(() => track('code_copied', { lang: 'install' })).not.toThrow();
    expect(() => trackDebounced('k', 'colour_changed', { slot: 'ink', source: 'picker' })).not.toThrow();
  });

  it('queues events until the client loads, then sends them in order', async () => {
    const sent: string[] = [];
    const t = createTracker('phc_test', 'https://eu.i.posthog.com', async () => (e) => { sent.push(e); });
    t.track('panel_opened', { panel: 'export' });
    t.start();
    t.track('link_copied', { params_count: 0 });
    await new Promise((r) => setTimeout(r, 0));
    t.track('shuffle_clicked', { target: 'ink' });
    expect(sent).toEqual(['panel_opened', 'link_copied', 'shuffle_clicked']);
  });

  it('drops queued events when the client declines to load, such as with Do Not Track', async () => {
    const t = createTracker('phc_test', 'h', async () => null);
    t.track('link_copied', { params_count: 0 });
    t.start();
    await new Promise((r) => setTimeout(r, 0));
    expect(() => t.track('link_copied', { params_count: 0 })).not.toThrow();
  });
});

describe('error reporting', () => {
  it('is a no-op without a DSN', () => {
    expect(() => reportError(new Error('x'))).not.toThrow();
    expect(() => reportMessage('webglcontextlost')).not.toThrow();
    const q = createErrorQueue(false);
    q.push({ kind: 'message', message: 'x' });
    expect(q.pending).toBe(0);
  });

  it('buffers early reports, flushes them on attach, and caps a page at the limit', () => {
    const q = createErrorQueue(true, 3);
    for (let i = 0; i < 5; i += 1) q.push({ kind: 'message', message: `m${i}` });
    expect(q.pending).toBe(3);
    const got: string[] = [];
    q.attach({ report: (r) => { if (r.kind === 'message') got.push(r.message); } });
    q.push({ kind: 'message', message: 'late' });
    expect(got).toEqual(['m0', 'm1', 'm2']);
  });
});

describe('performance sample helpers', () => {
  it('reads quantiles', () => {
    expect(quantile([], 0.5)).toBeNull();
    expect(quantile([60, 30, 59, 61, 58, 20, 60, 60, 60, 60], 0.1)).toBe(30);
    expect(quantile([60, 30, 59], 0.5)).toBe(59);
  });

  it('names the browser family only', () => {
    expect(browserName('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toBe('safari mobile');
    expect(browserName('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1')).toBe('chrome mobile');
    expect(browserName('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36')).toBe('chrome');
  });
});

describe('event map', () => {
  it('lists every event once, in snake_case object_action form', () => {
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
    for (const name of EVENT_NAMES) expect(name).toMatch(/^[a-z]+(_[a-z]+)+$/);
  });

  it('covers every key of the typed map', () => {
    // A compile-time check: a key missing from EVENT_NAMES makes this assignment fail to type check.
    const all: Record<keyof AnalyticsEvents, true> = Object.fromEntries(EVENT_NAMES.map((n) => [n, true])) as Record<keyof AnalyticsEvents, true>;
    expect(Object.keys(all)).toHaveLength(EVENT_NAMES.length);
  });

  it('keeps error labels short and free of the library prefix', () => {
    expect(errorLabel(new Error('[topographic] no encoder\nstack'))).toBe('no encoder');
    expect(errorLabel(undefined)).toBe('unknown');
    expect(errorLabel('x'.repeat(200))).toHaveLength(80);
  });

  it('registers fixed super properties', () => {
    const p = superProperties();
    expect(p.site).toBe('topographic');
    expect(p.app).toBe('topographic');
    expect(typeof p.app_version).toBe('string');
    expect(['2d', '3d']).toContain(p.initial_view_mode);
  });

  it('reads coarse device classes', () => {
    expect(osFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
    expect(osFamily('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
    expect(osFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('macos');
    expect(viewportClass(390)).toBe('phone');
    expect(viewportClass(900)).toBe('tablet');
    expect(viewportClass(1440)).toBe('desktop');
  });
});

describe('debouncing', () => {
  it('sends one call per key after input stops, with the last value', () => {
    vi.useFakeTimers();
    const got: string[] = [];
    const d = createDebouncer(1000);
    for (let i = 0; i < 30; i += 1) { d('ink', () => got.push(`ink${i}`)); vi.advanceTimersByTime(50); }
    d('paper', () => got.push('paper'));
    expect(got).toEqual([]);
    vi.advanceTimersByTime(1000);
    expect(got).toEqual(['ink29', 'paper']);
    d('ink', () => got.push('again'));
    vi.advanceTimersByTime(1000);
    expect(got).toEqual(['ink29', 'paper', 'again']);
    vi.useRealTimers();
  });
});
