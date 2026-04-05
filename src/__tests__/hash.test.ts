import { describe, it, expect } from 'vitest';
import { hashObject } from '../hash.js';

// ── Helper ─────────────────────────────────────────────────────────────────

/** Assert that two values hash the same */
function same(a: unknown, b: unknown): void {
  expect(hashObject(a)).toBe(hashObject(b));
}

/** Assert that two values hash differently */
function different(a: unknown, b: unknown): void {
  expect(hashObject(a)).not.toBe(hashObject(b));
}

/** Assert that hashObject throws a TypeError with a message matching the pattern */
function throwsTypeError(value: unknown, pattern: RegExp): void {
  expect(() => hashObject(value)).toThrow(TypeError);
  expect(() => hashObject(value)).toThrow(pattern);
}

// ── Output format ──────────────────────────────────────────────────────────

describe('output format', () => {
  it('returns a 64-character lowercase hex string', () => {
    expect(hashObject({ x: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input always produces same output', () => {
    const obj = { a: 1, b: [2, 3], c: { d: 'hello' } };
    expect(hashObject(obj)).toBe(hashObject(obj));
    expect(hashObject(obj)).toBe(hashObject({ a: 1, b: [2, 3], c: { d: 'hello' } }));
  });
});

// ── Supported types ────────────────────────────────────────────────────────

describe('supported scalar types', () => {
  it('hashes null', () => {
    const h = hashObject(null);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes strings', () => {
    different('hello', 'world');
    same('hello', 'hello');
  });

  it('hashes numbers', () => {
    different(1, 2);
    same(42, 42);
  });

  it('hashes booleans', () => {
    different(true, false);
    same(true, true);
  });

  it('differentiates between types with similar string forms', () => {
    different(null, 'null');
    different(0, false);
    different(0, '0');
    different(false, 'false');
    different(1, '1');
    different(null, ''); // null is fine; just checking null != ''
  });

  it('differentiates NaN from null — NaN throws', () => {
    expect(() => hashObject(NaN)).toThrow(TypeError);
    // null should still work fine
    expect(() => hashObject(null)).not.toThrow();
  });
});

describe('supported object types', () => {
  it('hashes empty object', () => {
    const h = hashObject({});
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes empty array', () => {
    different([], {});
    expect(hashObject([])).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes plain objects', () => {
    same({ a: 1 }, { a: 1 });
    different({ a: 1 }, { a: 2 });
    different({ a: 1 }, { b: 1 });
  });

  it('hashes arrays (order is preserved)', () => {
    same([1, 2, 3], [1, 2, 3]);
    different([1, 2, 3], [3, 2, 1]);
  });

  it('hashes nested objects', () => {
    same({ a: { b: { c: 42 } } }, { a: { b: { c: 42 } } });
    different({ a: { b: 1 } }, { a: { b: 2 } });
  });

  it('hashes mixed nested structures', () => {
    same({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] });
    different({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] });
  });

  it('allows the same object reference in sibling array positions', () => {
    const shared = { x: 1 };
    expect(() => hashObject([shared, shared])).not.toThrow();
    same([shared, shared], [{ x: 1 }, { x: 1 }]);
  });
});

// ── Key ordering ───────────────────────────────────────────────────────────

describe('key ordering', () => {
  it('produces the same hash regardless of key insertion order (top level)', () => {
    same({ a: 1, b: 2 }, { b: 2, a: 1 });
  });

  it('produces the same hash for deeply nested objects with different key order', () => {
    same(
      { x: { c: 3, a: 1, b: 2 } },
      { x: { a: 1, b: 2, c: 3 } },
    );
  });

  it('produces the same hash for objects inside arrays with different key order', () => {
    same(
      [{ z: 26, a: 1 }, { m: 13, b: 2 }],
      [{ a: 1, z: 26 }, { b: 2, m: 13 }],
    );
  });

  it('distinguishes objects with the same keys but different values', () => {
    different({ a: 1, b: 2 }, { a: 2, b: 1 });
  });
});

// ── Unsupported types — must throw TypeError ───────────────────────────────

describe('unsupported types throw TypeError', () => {
  it('throws on undefined (top-level)', () => {
    throwsTypeError(undefined, /undefined/);
  });

  it('throws on undefined inside an object value', () => {
    throwsTypeError({ a: undefined }, /undefined/);
  });

  it('throws on undefined inside a nested object', () => {
    throwsTypeError({ a: { b: undefined } }, /undefined/);
  });

  it('throws on undefined inside an array', () => {
    throwsTypeError([1, undefined, 3], /undefined/);
  });

  it('throws on Date', () => {
    throwsTypeError(new Date(), /Date/);
  });

  it('throws on Date inside an object', () => {
    throwsTypeError({ created: new Date() }, /Date/);
  });

  it('throws on Map', () => {
    throwsTypeError(new Map([['a', 1]]), /Map/);
  });

  it('throws on Map inside an object', () => {
    throwsTypeError({ data: new Map() }, /Map/);
  });

  it('throws on Set', () => {
    throwsTypeError(new Set([1, 2, 3]), /Set/);
  });

  it('throws on Set inside an object', () => {
    throwsTypeError({ tags: new Set(['a', 'b']) }, /Set/);
  });

  it('throws on Buffer', () => {
    throwsTypeError(Buffer.from('hello'), /TypedArray|Buffer/);
  });

  it('throws on Uint8Array', () => {
    throwsTypeError(new Uint8Array([1, 2, 3]), /TypedArray|Buffer/);
  });

  it('throws on Int32Array', () => {
    throwsTypeError(new Int32Array([1, 2, 3]), /TypedArray|Buffer/);
  });

  it('throws on Float64Array', () => {
    throwsTypeError(new Float64Array([1.0, 2.0]), /TypedArray|Buffer/);
  });

  it('throws on function', () => {
    throwsTypeError(() => 42, /function/);
  });

  it('throws on function inside an object', () => {
    throwsTypeError({ fn: () => {} }, /function/);
  });

  it('throws on BigInt', () => {
    throwsTypeError(BigInt(9007199254740993), /BigInt/);
  });

  it('throws on BigInt inside an object', () => {
    throwsTypeError({ id: BigInt(1) }, /BigInt/);
  });

  it('throws on Symbol', () => {
    throwsTypeError(Symbol('test'), /Symbol/);
  });

  it('throws on circular reference (object)', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    throwsTypeError(obj, /circular/);
  });

  it('throws on circular reference (array)', () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr);
    throwsTypeError(arr, /circular/);
  });

  it('throws on circular reference (nested)', () => {
    const inner: Record<string, unknown> = { x: 1 };
    const outer = { a: inner, b: inner };  // shared ref is fine (not circular)
    outer.a.parent = outer;                // this makes it circular
    throwsTypeError(outer, /circular/);
  });

  it('does NOT throw for shared (non-circular) references', () => {
    // The same object appearing in two sibling branches is fine — it is not circular
    const shared = { x: 1 };
    expect(() => hashObject({ a: shared, b: shared })).not.toThrow();
    // And both branches must hash the same
    same({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 1 } });
  });

  it('throws on NaN', () => {
    throwsTypeError(NaN, /non-finite/);
  });

  it('throws on Infinity', () => {
    throwsTypeError(Infinity, /non-finite/);
  });

  it('throws on -Infinity', () => {
    throwsTypeError(-Infinity, /non-finite/);
  });

  it('throws on NaN inside an object', () => {
    throwsTypeError({ value: NaN }, /non-finite/);
  });

  it('throws on Symbol inside an object', () => {
    throwsTypeError({ s: Symbol('test') }, /Symbol/);
  });

  it('throws on Buffer inside an object', () => {
    throwsTypeError({ data: Buffer.from('hello') }, /TypedArray|Buffer/);
  });
});
