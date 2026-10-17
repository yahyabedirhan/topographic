import { describe, expect, it, vi } from 'vitest';
import { createTracker, track } from './analytics';
import { createErrorQueue, reportError, reportMessage } from './errors';
import { browserName } from './device';
import { quantile } from './perf';

describe('analytics', () => {
  it('is a no-op without a key: nothing loads and nothing is sent', async () => {
    const load = vi.fn();
    const t = createTracker(undefined, 'https://eu.i.posthog.com', load);
    t.start();
    t.track('dice_clicked', { target: 'shuffle' });
    await Promise.resolve();
    expect(t.enabled).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('the exported track does nothing in a test build, which has no key', () => {
    expect(() => track('link_copied')).not.toThrow();
    expect(() => track('export_clicked', { format: 'png' })).not.toThrow();
  });

  it('queues events until the client loads, then sends them in order', async () => {
    const sent: string[] = [];
    const t = createTracker('phc_test', 'https://eu.i.posthog.com', async () => (e) => { sent.push(e); });
    t.track('export_clicked', { format: 'link' });
    t.start();
    t.track('link_copied', {});
    await new Promise((r) => setTimeout(r, 0));
    t.track('dice_clicked', { target: 'ink' });
    expect(sent).toEqual(['export_clicked', 'link_copied', 'dice_clicked']);
  });

  it('drops queued events when the client declines to load, such as with Do Not Track', async () => {
    const t = createTracker('phc_test', 'h', async () => null);
    t.track('link_copied', {});
    t.start();
    await new Promise((r) => setTimeout(r, 0));
    expect(() => t.track('link_copied', {})).not.toThrow();
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
