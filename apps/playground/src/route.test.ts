import { describe, expect, it } from 'vitest';
import { resolveRoute } from './route';

describe('resolveRoute', () => {
  it('serves home and /about', () => {
    expect(resolveRoute('/', '', '')).toEqual({ page: 'home' });
    expect(resolveRoute('/index.html', '?x=1', '')).toEqual({ page: 'home' });
    expect(resolveRoute('/about', '', '#analytics')).toEqual({ page: 'about' });
    expect(resolveRoute('/about/', '', '')).toEqual({ page: 'about' });
  });

  it('sends unknown paths, including /privacy, home with the query kept', () => {
    expect(resolveRoute('/privacy', '', '')).toEqual({ page: 'redirect', to: '/' });
    expect(resolveRoute('/nope/deep', '?optout=all', '')).toEqual({ page: 'redirect', to: '/?optout=all' });
    expect(resolveRoute('/x', '?optin', '#a')).toEqual({ page: 'redirect', to: '/?optin#a' });
  });

  it('respects a base path', () => {
    expect(resolveRoute('/topographic/', '', '', '/topographic/')).toEqual({ page: 'home' });
    expect(resolveRoute('/topographic/about', '', '', '/topographic/')).toEqual({ page: 'about' });
    expect(resolveRoute('/topographic/old', '?optout', '', '/topographic/')).toEqual({ page: 'redirect', to: '/topographic/?optout' });
  });
});
