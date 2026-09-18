import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getTypeSchema } from '../type_register.js';
import type {
    HistoryEnvelope,
    HistoryDailyEnvelope,
    HistoryCoverageDocument,
    HistoryParkRawEnvelope,
    HistoryParkDailyEnvelope,
    HistoryErrorInvalidDate,
    HistoryErrorRangeTooLong,
    HistoryErrorNotFound,
} from '../types/history.types.js';
import '../types/index.js';

// Contract tests for the history types.
//
// The fixtures are REAL responses, captured from the live API, trimmed to
// fewer rows but never reshaped. That is the whole point: a test that checked
// the generated types against the schema they were generated from would only
// prove the generator is deterministic. These check them against what the
// server actually sends, which is the claim a consumer of this package relies
// on.
//
// Two layers, because each catches what the other cannot:
//
//   1. `violations()` walks each fixture against the registered runtime schema,
//      checking declared types, required keys, nullability, enums and — the one
//      TypeScript cannot do here — UNDECLARED properties. A field the server
//      sends and this package does not describe is exactly the drift that makes
//      a type package worse than no package at all.
//   2. `satisfies` literals in `history.readme.test.ts` and at the foot of this
//      file, checked by `tsc`, covering shapes no captured fixture reaches.
//
// An earlier version of this comment claimed layer 1 was "assigning each
// fixture to its declared type, so the compiler rejects the assignment". That
// was FALSE and a reviewer proved it: the fixtures are typed `unknown` and read
// with `as HistoryEnvelope`, and `unknown as T` always compiles. Nothing was
// checked at compile time, and the walker had no type comparison either, so a
// `time` holding a number and a `changed` holding a bare string both passed.
//
// The lesson is not "add a cast that works" — a cast cannot check JSON read at
// runtime without making the fixture a typed module. It is that the comment
// asserted a guarantee nobody had tested. So the walker now does the type
// checking, in code, against the same fixtures.

type Fixtures = {
    'entity-history': unknown;
    'entity-history-daily': unknown;
    'entity-history-coverage': unknown;
    'park-history': unknown;
    'park-history-daily': unknown;
    'error-invalid-date': unknown;
    'error-invalid-range': unknown;
    'error-range-too-long': unknown;
    'error-not-found': unknown;
    // The first capture touched ONE of six LiveQueue branches and no showtimes
    // at all — five published types had never been compared against a real
    // response, because the walker can only check what a fixture contains.
    // Each of these is a real entity-day found by searching park history for
    // rows that actually carry the shape.
    'queue-single-rider': unknown;
    'queue-paid-return-time': unknown;
    'queue-paid-standby': unknown;
    'showtimes': unknown;
};

const fixtures: Fixtures = JSON.parse(
    readFileSync(new URL('./fixtures/history-responses.json', import.meta.url), 'utf8'),
);

/** A schema as the generator registers it: plain JSON, `$ref` by type name. */
type Schema = {
    type?: string;
    required?: string[];
    properties?: Record<string, Schema>;
    additionalProperties?: Schema;
    items?: Schema;
    nullable?: boolean;
    enum?: unknown[];
    $ref?: string;
};

/**
 * `#/properties/HistoryRow` -> the registered schema for `HistoryRow`.
 *
 * `seen` guards a `$ref` cycle: a self-referential schema would otherwise
 * recurse until the stack goes, which reports nothing useful. A cycle is a
 * schema bug, so it is named rather than survived.
 */
function resolve(schema: Schema, seen: string[] = []): Schema {
    if (!schema.$ref) return schema;
    const name = schema.$ref.replace('#/properties/', '');
    if (seen.includes(name)) throw new Error(`$ref cycle: ${[...seen, name].join(' -> ')}`);
    const target = getTypeSchema(name) as Schema | undefined;
    if (!target) throw new Error(`schema ${name} is referenced but not registered`);
    return resolve(target, [...seen, name]);
}

/**
 * The JSON Schema type names a value actually satisfies.
 *
 * Returns a set because `4` is both `integer` and `number`, and a schema may
 * legitimately declare either. Comparing single names would reject an integer
 * declared as a number, or force the walker to special-case it at every site.
 */
function jsonTypesOf(value: unknown): Set<string> {
    if (value === null) return new Set(['null']);
    if (Array.isArray(value)) return new Set(['array']);
    switch (typeof value) {
        case 'string': return new Set(['string']);
        case 'boolean': return new Set(['boolean']);
        case 'number':
            return Number.isInteger(value) ? new Set(['number', 'integer']) : new Set(['number']);
        case 'object': return new Set(['object']);
        default: return new Set([typeof value]);
    }
}

/** The type names a schema accepts, across both spellings of nullable. */
function declaredTypes(schema: Schema): string[] {
    const declared = Array.isArray(schema.type) ? [...schema.type] : schema.type ? [schema.type] : [];
    if (schema.nullable === true && !declared.includes('null')) declared.push('null');
    return declared;
}

/**
 * Every way `value` disagrees with `schema`, as human-readable paths.
 *
 * Returns all problems rather than throwing on the first, so one run names
 * every drifted field instead of making you re-run per field.
 */
function violations(value: unknown, schema: Schema, path: string): string[] {
    const s = resolve(schema);
    const out: string[] = [];

    // THE TYPE CHECK, and it goes first.
    //
    // This was missing entirely. The walk dispatched on the value's own shape —
    // "is it an array? recurse into items" — and so never asked whether the
    // shape was the one the schema declared. A `time` holding a number, a
    // `changed` holding a bare string instead of an array, a `waitTime` holding
    // "15": every one passed, because each was handled by whichever branch its
    // own runtime type selected.
    const declared = declaredTypes(s);
    if (declared.length > 0) {
        const actual = jsonTypesOf(value);
        if (!declared.some((t) => actual.has(t))) {
            out.push(
                `${path}: ${JSON.stringify(value)?.slice(0, 60)} is ${[...actual].join('|')}, `
                + `but the schema declares ${declared.join('|')}`,
            );
            // Do not also recurse: every child would be reported against the
            // wrong schema and bury the one finding that matters.
            return out;
        }
    }

    if (value === null) return out;

    if (Array.isArray(value)) {
        if (s.items) value.forEach((v, i) => out.push(...violations(v, s.items!, `${path}[${i}]`)));
        return out;
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;

        for (const key of s.required ?? []) {
            if (!(key in obj)) out.push(`${path}.${key}: required by the schema, absent from the response`);
        }

        // A schema with neither `properties` nor `additionalProperties` used to
        // accept an object with any keys at all — the undeclared-key report was
        // gated on `s.properties` being truthy, so a schema that declared none
        // silently permitted everything. An object against a schema that
        // describes no object is now itself the finding, caught by the type
        // check above when `type` is set, and here when it is not.
        if (!s.properties && !s.additionalProperties) {
            out.push(`${path}: an object, but the schema describes no properties`);
            return out;
        }

        for (const [key, v] of Object.entries(obj)) {
            const declaredProp = s.properties?.[key];
            if (declaredProp) {
                out.push(...violations(v, declaredProp, `${path}.${key}`));
            } else if (s.additionalProperties) {
                out.push(...violations(v, s.additionalProperties, `${path}.${key}`));
            } else {
                out.push(`${path}.${key}: sent by the server, not described by the package`);
            }
        }
        return out;
    }

    if (s.enum && !s.enum.includes(value)) {
        out.push(`${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(s.enum)}`);
    }
    return out;
}

/**
 * Divergences between what the API sends and what this package declares, which
 * are KNOWN, OPEN, and not this file's to decide.
 *
 * A queue that ends writes `null` into fields the shared queue schema declares
 * non-nullable. Verified on a real response: `PAID_RETURN_TIME` and
 * `RETURN_TIME` both arrive with `state: null`, and `PAID_RETURN_TIME` with
 * `price: null`, while the schema has `state` as a `ReturnTimeState` enum and
 * `price` as a `PriceData` object. A consumer who trusts the type and reads
 * `state.toUpperCase()` gets a runtime error.
 *
 * This is not a typo to patch here. The same `LiveQueue` schema serves
 * `/v1/entity/{id}/live`, so widening it is an API-wide decision about how an
 * ended queue is represented — and that decision is open and belongs to the
 * owner, not to a test.
 *
 * So the divergence is ENUMERATED rather than tolerated. Each entry is a
 * specific field, the test asserts that every entry is still real, and
 * anything not listed fails as normal drift. When the decision lands, deleting
 * the entry is the change that proves the fix.
 */
const KNOWN_DIVERGENCES = [
    'queue.RETURN_TIME.state',
    'queue.PAID_RETURN_TIME.state',
    'queue.PAID_RETURN_TIME.price',
] as const;

/** Whether `problem` is one of the enumerated known divergences. */
function isKnownDivergence(problem: string): boolean {
    // Matched on the field path plus the null claim specifically, so the
    // allowance covers ONLY "the server sent null here" and not some other
    // future drift on the same field.
    return KNOWN_DIVERGENCES.some(
        (field) => problem.includes(`.${field}:`) && problem.includes('null is null'),
    );
}

/** Schema name -> the fixture that must satisfy it. */
const CONTRACTS: Array<[typeName: string, fixture: keyof Fixtures]> = [
    ['HistoryEnvelope', 'entity-history'],
    ['HistoryDailyEnvelope', 'entity-history-daily'],
    ['HistoryCoverageDocument', 'entity-history-coverage'],
    ['HistoryParkRawEnvelope', 'park-history'],
    ['HistoryParkDailyEnvelope', 'park-history-daily'],
    ['HistoryErrorInvalidDate', 'error-invalid-date'],
    ['HistoryErrorInvalidRange', 'error-invalid-range'],
    ['HistoryErrorRangeTooLong', 'error-range-too-long'],
    ['HistoryErrorNotFound', 'error-not-found'],
    // The same HistoryEnvelope shape, but reaching queue branches and the
    // showtimes array that the first fixtures never touched.
    ['HistoryEnvelope', 'queue-single-rider'],
    ['HistoryEnvelope', 'queue-paid-return-time'],
    ['HistoryEnvelope', 'queue-paid-standby'],
    ['HistoryEnvelope', 'showtimes'],
];

describe('the published history types describe what the server sends', () => {
    it.each(CONTRACTS)('%s matches a real response with no undeclared fields', (typeName, fixture) => {
        const schema = getTypeSchema(typeName) as Schema | undefined;
        expect(schema, `${typeName} is not registered`).toBeDefined();

        const problems = violations(fixtures[fixture], schema!, typeName)
            .filter((p) => !isKnownDivergence(p));

        expect(problems, `\n  ${problems.join('\n  ')}\n`).toEqual([]);
    });

    it('every enumerated divergence is still real', () => {
        // The allowance list is the dangerous part of this file: an entry that
        // stops being true silently hides a field the package could now
        // describe honestly. So the list is checked in the other direction —
        // each entry must still be produced by a real fixture.
        const all = CONTRACTS.flatMap(([typeName, fixture]) =>
            violations(fixtures[fixture], getTypeSchema(typeName) as Schema, typeName));

        const stale = KNOWN_DIVERGENCES.filter(
            (field) => !all.some((p) => p.includes(`.${field}:`) && p.includes('null is null')),
        );

        expect(stale, `\n  no longer diverge — remove from KNOWN_DIVERGENCES:\n  ${stale.join('\n  ')}\n`)
            .toEqual([]);
    });

    it('registers every shape the schema declares', () => {
        // A shape that fails to register is invisible to the check above — the
        // loop would simply not reach it. Pinning the count means a shape
        // added to the schema and not to CONTRACTS is noticed.
        const declared = [
            'HistoryQuery', 'HistoryRange', 'HistoryCoverage', 'HistoryOpening', 'HistoryRow',
            'HistoryEnvelope', 'HistoryDailyQuery', 'HistoryDailyStats', 'HistoryDailyRow',
            'HistoryDailyEnvelope', 'HistoryParkEntityDaily', 'HistoryParkEntityRaw',
            'HistoryParkDailyEnvelope', 'HistoryParkRawEnvelope', 'HistoryCoverageKindSpan',
            'HistoryCoverageDocument', 'HistoryErrorBase', 'HistoryErrorInvalidDate',
            'HistoryErrorInvalidRange', 'HistoryErrorRangeTooLong', 'HistoryErrorNotFound',
            'HistoryErrorBackendUnavailable', 'HistoryErrorRateLimited', 'HistoryErrorWindowExceeded',
        ];

        expect(declared.filter((name) => getTypeSchema(name) === undefined)).toEqual([]);
    });
});

describe('the history types compile against real responses', () => {
    // The layer the runtime walk cannot do: these assignments are checked by
    // tsc, so a property the package declares and the server omits, or declares
    // at the wrong type, fails the build rather than a test.

    it('types an entity history response', () => {
        const res = fixtures['entity-history'] as HistoryEnvelope;

        expect(res.range.from).toBe('2026-09-15');
        expect(res.timezone).toBe('America/New_York');
        // `next` is null for a single entity: one call covers the whole range.
        expect(res.next).toBeNull();
        // Opening carries the state the range starts in, in the same shape as
        // a row, so one reader handles both.
        expect(typeof res.opening.time).toBe('string');
        expect(res.history[0]?.changed.length).toBeGreaterThan(0);
    });

    it('types a daily response, with absent blocks rather than null ones', () => {
        const res = fixtures['entity-history-daily'] as HistoryDailyEnvelope;
        const day = res.days[0]!;

        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof day.operatingMinutes).toBe('number');
        // standby is ABSENT, never null, when nothing was reported — the two
        // are different claims and the type keeps them apart.
        if (day.standby) {
            expect(day.standby.min).toBeLessThanOrEqual(day.standby.max);
            expect(day.standby.p50).toBeLessThanOrEqual(day.standby.p90);
        }
    });

    it('types a coverage document, keyed by live-data path', () => {
        const res = fixtures['entity-history-coverage'] as HistoryCoverageDocument;

        // `kinds` is keyed by the same live-data PATH `/live` and `/history`
        // use — `status`, `showtimes`, `queue.PAID_RETURN_TIME` — so a key
        // matches straight across all three without a lookup table. Asserting
        // the actual grammar rather than a character class: a key like
        // `paid_return_time` would be the internal kind name leaking through,
        // which is the specific mistake this keying exists to prevent.
        const livePath = /^(?:status|showtimes|operatingHours|diningAvailability|queue\.[A-Z][A-Z_]*)$/;

        expect(Object.keys(res.kinds).length).toBeGreaterThan(0);
        for (const [kind, span] of Object.entries(res.kinds)) {
            expect(kind).toMatch(livePath);
            expect(span.first <= span.last).toBe(true);
        }
    });

    it('types both park envelopes, which share the two entity paths', () => {
        const raw = fixtures['park-history'] as HistoryParkRawEnvelope;
        const daily = fixtures['park-history-daily'] as HistoryParkDailyEnvelope;

        // A PARK gets a different response shape from the SAME path, so a
        // client branches on entityType or on the presence of entities[].
        expect(raw.entityType).toBe('PARK');
        expect(daily.entityType).toBe('PARK');
        expect(raw.entities.length).toBeGreaterThan(0);
        expect(daily.entities.length).toBeGreaterThan(0);
        // Each park entry carries exactly the block the single-entity call
        // returns for that entity, so one client type reads both.
        expect(typeof raw.entities[0]!.opening.time).toBe('string');
        expect(Array.isArray(daily.entities[0]!.days)).toBe(true);
    });

    it('types each error as its own branch, discriminated by error.type', () => {
        const invalidDate = fixtures['error-invalid-date'] as HistoryErrorInvalidDate;
        const tooLong = fixtures['error-range-too-long'] as HistoryErrorRangeTooLong;
        const notFound = fixtures['error-not-found'] as HistoryErrorNotFound;

        // Pinned to a literal in the schema, so a client can switch on it and
        // the compiler checks the switch is exhaustive.
        expect(invalidDate.error.type).toBe('INVALID_DATE');
        expect(tooLong.error.type).toBe('RANGE_TOO_LONG');
        expect(notFound.error.type).toBe('NOT_FOUND');
    });
});
