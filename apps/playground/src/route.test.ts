import { describe, expect, it } from 'vitest';
import { homeScript, resolveRoute } from './route';

describe('resolveRoute', () => {
  it('serves home and /about', () => {
    expect(resolveRoute('/', '', '')).toEqual({ page: 'home' });
    expect(resolveRoute('/index.html', '?x=1', '')).toEqual({ page: 'home' });
    expect(resolveRoute('/about', '', '#analytics')).toEqual({ page: 'about' });
    expect(resolveRoute('/about/', '', '')).toEqual({ page: 'about' });
  });

  it('serves the docs page at /docs, with or without a slash, and from docs.html', () => {
    expect(resolveRoute('/docs', '', '')).toEqual({ page: 'docs' });
    expect(resolveRoute('/docs/', '', '#install')).toEqual({ page: 'docs' });
    expect(resolveRoute('/docs.html', '', '')).toEqual({ page: 'docs' });
    expect(resolveRoute('/topographic/docs', '', '', '/topographic/')).toEqual({ page: 'docs' });
  });

  it('leaves the plain-text docs to the host: an unknown page under /docs goes home', () => {
    expect(resolveRoute('/docs/nope', '', '')).toEqual({ page: 'redirect', to: '/' });
  });

  it('sends unknown paths, including /privacy, home with the query kept', () => {
    expect(resolveRoute('/privacy', '', '')).toEqual({ page: 'redirect', to: '/' });
    expect(resolveRoute('/nope/deep', '?analytics_optout=all', '')).toEqual({ page: 'redirect', to: '/?analytics_optout=all' });
    expect(resolveRoute('/x', '?analytics_optin', '#a')).toEqual({ page: 'redirect', to: '/?analytics_optin#a' });
  });

  it('respects a base path', () => {
    expect(resolveRoute('/topographic/', '', '', '/topographic/')).toEqual({ page: 'home' });
    expect(resolveRoute('/topographic/about', '', '', '/topographic/')).toEqual({ page: 'about' });
    expect(resolveRoute('/topographic/old', '?analytics_optout', '', '/topographic/')).toEqual({ page: 'redirect', to: '/topographic/?analytics_optout' });
  });
});

describe('homeScript', () => {
  const run = (pathname: string, search: string, hash: string, base = '/') => {
    const writes: [unknown, string][] = [];
    const location = { pathname, search, hash };
    const history = { state: { index: 0 }, replaceState: (s: unknown, _t: string, url: string) => { writes.push([s, url]); } };
    new Function('location', 'history', homeScript(base))(location, history);
    return writes;
  };

  it('sends an unknown path home in place, keeping the query, the hash and the history state', () => {
    expect(run('/nope/deep', '?analytics_optout=all', '#a')).toEqual([[{ index: 0 }, '/?analytics_optout=all#a']]);
    expect(run('/topographic/old', '?s=dunes', '', '/topographic/')).toEqual([[{ index: 0 }, '/topographic/?s=dunes']]);
  });

  it('leaves the home page alone', () => {
    expect(run('/', '?s=dunes', '')).toEqual([]);
    expect(run('/index.html', '', '')).toEqual([]);
  });
});
