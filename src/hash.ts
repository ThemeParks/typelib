/**
 * Deterministic object hashing using node:crypto SHA-256.
 *
 * ## Supported types
 * Plain objects, arrays, strings, numbers, booleans, null.
 *
 * ## Unsupported types (throws TypeError)
 * undefined, Date, Map, Set, TypedArrays (Buffer, Uint8Array, etc.),
 * Function, BigInt, Symbol, and circular references.
 *
 * Unsupported types throw rather than silently producing a hash that
 * diverges from the previous object-hash implementation.
 *
 * ## Key ordering
 * Object keys are sorted recursively before serialisation, so
 * `{ b: 2, a: 1 }` and `{ a: 1, b: 2 }` produce the same hash.
 *
 * ## Array ordering
 * Array element order is preserved — `[1, 2]` and `[2, 1]` hash differently.
 */

import { createHash } from 'node:crypto';

/**
 * Recursively normalise a value for hashing:
 * - Sort object keys alphabetically
 * - Throw TypeError on any unsupported type
 * - Track seen objects to detect circular references
 */
function normalise(value: unknown, seen: Set<object>): unknown {
  // null is fine
  if (value === null) return null;

  // Primitives
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `hashObject: non-finite number is not supported (got: ${value})`,
      );
    }
    return value;
  }
  if (typeof value === 'boolean') return value;

  // Explicitly unsupported primitives
  if (value === undefined) {
    throw new TypeError(
      'hashObject: undefined is not supported — use null or omit the key instead',
    );
  }
  if (typeof value === 'bigint') {
    throw new TypeError(
      `hashObject: BigInt is not supported — convert to string or number first (got: ${value}n)`,
    );
  }
  if (typeof value === 'symbol') {
    throw new TypeError(
      `hashObject: Symbol is not supported (got: ${String(value)})`,
    );
  }
  if (typeof value === 'function') {
    throw new TypeError(
      `hashObject: function is not supported (got: ${(value as Function).name || 'anonymous'})`,
    );
  }

  // Object types
  if (typeof value === 'object') {
    // Circular reference detection
    if (seen.has(value)) {
      throw new TypeError('hashObject: circular reference detected');
    }

    // Explicitly unsupported object types — check before Array/plain-object
    if (value instanceof Date) {
      throw new TypeError(
        `hashObject: Date is not supported — convert to ISO string first (got: ${value.toISOString()})`,
      );
    }
    if (value instanceof Map) {
      throw new TypeError(
        'hashObject: Map is not supported — convert to a plain object first',
      );
    }
    if (value instanceof Set) {
      throw new TypeError(
        'hashObject: Set is not supported — convert to an Array first',
      );
    }
    if (ArrayBuffer.isView(value)) {
      throw new TypeError(
        `hashObject: TypedArray/Buffer is not supported — convert to a plain array or base64 string first (got: ${value.constructor.name})`,
      );
    }

    seen.add(value);

    let result: unknown;

    if (Array.isArray(value)) {
      result = value.map((item) => normalise(item, seen));
    } else {
      // Plain object — sort keys for determinism
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[key] = normalise((value as Record<string, unknown>)[key], seen);
      }
      result = sorted;
    }

    seen.delete(value); // allow the same object to appear in sibling branches
    return result;
  }

  // Should be unreachable, but TypeScript needs the exhaustive case
  throw new TypeError(`hashObject: unsupported type: ${typeof value}`);
}

/**
 * Return a deterministic 64-char hex SHA-256 hash of the given value.
 *
 * Throws TypeError if the value contains any unsupported type.
 */
export function hashObject(value: unknown): string {
  const normalised = normalise(value, new Set());
  return createHash('sha256')
    .update(JSON.stringify(normalised))
    .digest('hex');
}
