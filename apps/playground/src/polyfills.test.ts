import { afterEach, describe, expect, it } from 'vitest';
import { installPolyfills } from './polyfills';

describe('Object.hasOwn polyfill', () => {
  const real = Object.hasOwn;

  afterEach(() => {
    Object.hasOwn = real;
  });

  it('distinguishes own keys from inherited ones when Object.hasOwn is deleted', () => {
    Reflect.deleteProperty(Object, 'hasOwn');
    expect(Object.hasOwn).toBeUndefined();
    installPolyfills();
    const proto = { inherited: true };
    const obj = Object.create(proto) as { own?: boolean };
    obj.own = true;
    expect(Object.hasOwn(obj, 'own')).toBe(true);
    expect(Object.hasOwn(obj, 'inherited')).toBe(false);
    expect(Object.hasOwn(obj, 'toString')).toBe(false);
    expect(Object.hasOwn(obj, 'missing')).toBe(false);
  });

  it('leaves an existing Object.hasOwn in place', () => {
    const marker = function hasOwn(): boolean { return false; };
    Object.hasOwn = marker as typeof Object.hasOwn;
    installPolyfills();
    expect(Object.hasOwn).toBe(marker);
  });
});
