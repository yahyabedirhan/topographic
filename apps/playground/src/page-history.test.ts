import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPageUrl, resetPageHistory, schedulePageUrl } from './page-history';

describe('page history', () => {
  const calls: string[] = [];
  let search = '';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    calls.length = 0;
    search = '';
    vi.stubGlobal('location', {
      get pathname() { return '/'; },
      get search() { return search; },
      get hash() { return ''; },
    });
    vi.stubGlobal('history', {
      replaceState: (_state: null, _title: string, url: string) => {
        calls.push(url);
        search = url.startsWith('/?') ? url.slice(1) : '';
      },
    });
    resetPageHistory();
  });

  afterEach(() => {
    resetPageHistory();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('writes a thousand camera updates at most about four times a second, then the final url', () => {
    for (let i = 0; i < 1000; i++) {
      schedulePageUrl(`/?mode=3d&az=${i}&ce=20`);
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(300);
    expect(calls.length).toBeLessThanOrEqual(40);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.at(-1)).toBe('/?mode=3d&az=999&ce=20');
    expect(search).toBe('?mode=3d&az=999&ce=20');
  });

  it('skips a write when the url is already current', () => {
    search = '?mode=3d&az=4&ce=20';
    schedulePageUrl('/?mode=3d&az=4&ce=20');
    vi.advanceTimersByTime(1000);
    expect(calls).toEqual([]);
  });

  it('flushes the latest camera when the gesture ends', () => {
    schedulePageUrl('/?mode=3d&az=1&ce=20');
    schedulePageUrl('/?mode=3d&az=12&ce=33');
    flushPageUrl();
    expect(calls).toEqual(['/?mode=3d&az=12&ce=33']);
  });

  it('backs off when replaceState throws', () => {
    let tries = 0;
    vi.stubGlobal('history', {
      replaceState: () => {
        tries += 1;
        throw new Error('SecurityError: Attempt to use history.replaceState() more than 100 times per 10 seconds');
      },
    });
    schedulePageUrl('/?mode=3d&az=8&ce=20');
    vi.advanceTimersByTime(300);
    expect(tries).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(tries).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(tries).toBe(2);
  });
});
