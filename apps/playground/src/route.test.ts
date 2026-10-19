import { describe, expect, it } from 'vitest';
import { resolveRoute } from './route';

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
