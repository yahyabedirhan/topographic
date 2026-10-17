export type Route = { page: 'home' | 'about' } | { page: 'redirect'; to: string };

/**
 * Picks the page for a path under `base`. Only the home page and /about exist;
 * any other path goes to home, keeping the query string and hash.
 */
export function resolveRoute(pathname: string, search: string, hash: string, base = '/'): Route {
  const root = base.endsWith('/') ? base : `${base}/`;
  if (pathname === root || pathname === root.slice(0, -1) || pathname === `${root}index.html`) return { page: 'home' };
  if (pathname === `${root}about` || pathname === `${root}about/`) return { page: 'about' };
  return { page: 'redirect', to: `${root}${search}${hash}` };
}
