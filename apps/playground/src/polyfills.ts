// Chrome before 93 and Safari before 15.4 have no Object.hasOwn. The docs page calls it from
// the bundled floating-tree store, so this runs before that code.
export function installPolyfills(): void {
  if (typeof Object.hasOwn === 'function') return;
  Object.hasOwn = function hasOwn(obj: object, key: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
}

installPolyfills();
