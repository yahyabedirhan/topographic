export type Route = { page: 'home' | 'about' | 'docs' } | { page: 'redirect'; to: string };

/**
 * Picks the page for a path under `base`. Only the home page, /about and /docs exist;
 * any other path goes to home, keeping the query string and hash.
 * /docs.html is the same page: the host serves /docs from that file, with the docs page's own metadata.
 */
export function resolveRoute(pathname: string, search: string, hash: string, base = '/'): Route {
  const root = base.endsWith('/') ? base : `${base}/`;
  if (pathname === root || pathname === root.slice(0, -1) || pathname === `${root}index.html`) return { page: 'home' };
  if (pathname === `${root}about` || pathname === `${root}about/`) return { page: 'about' };
  if (pathname === `${root}docs` || pathname === `${root}docs/` || pathname === `${root}docs.html`) return { page: 'docs' };
  return { page: 'redirect', to: `${root}${search}${hash}` };
}

/**
 * The inline script of the home page. The Worker answers a browser's request for an unknown path with index.html,
 * so this sends it home in place, before anything reads the address, keeping the query string, the hash and the
 * history entry's state. It is `resolveRoute` itself, so the rule has one source.
 */
export function homeScript(base = '/'): string {
  return `(function(){var r=(${resolveRoute.toString()})(location.pathname,location.search,location.hash,${JSON.stringify(base)});`
    + `if(r.page==='redirect')history.replaceState(history.state,'',r.to);})();`;
}
