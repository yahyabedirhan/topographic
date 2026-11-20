/**
 * Copies a plain JSON value. `structuredClone` is missing in some older browsers, so those take a JSON copy.
 * A height grid is not a plain value: callers pass that object back by reference, as settings merge does.
 */
export function copyPlain<T>(value: T): T {
  const clone = globalThis.structuredClone;
  return (typeof clone === 'function' ? clone(value) : JSON.parse(JSON.stringify(value))) as T;
}
