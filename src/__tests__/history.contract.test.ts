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
//   1. Assigning each fixture to its declared type. Catches a MISSING or
//      wrongly-typed property — the compiler rejects the assignment.
//   2. Walking each fixture against the registered runtime schema. Catches an
//      UNDECLARED property, which TypeScript's structural typing accepts in
//      silence when the value comes from JSON.parse. A field the server sends
//      and the package does not describe is exactly the kind of drift that
//      makes a type package worse than no package at all.

type Fixtures = {
    'entity-history': unknown;
    'entity-history-daily': unknown;
    'entity-history-coverage': unknown;
    'park-history': unknown;
    'park-history-daily': unknown;
    'error-invalid-date': unknown;
    'error-range-too-long': unknown;
    'error-not-found': unknown;
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

/** `#/properties/HistoryRow` -> the registered schema for `HistoryRow`. */
function resolve(schema: Schema): Schema {
    if (!schema.$ref) return schema;
    const name = schema.$ref.replace('#/properties/', '');
    const target = getTypeSchema(name) as Schema | undefined;
    if (!target) throw new Error(`schema ${name} is referenced but not registered`);
    return resolve(target);
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

    if (value === null) {
        // A null where the schema does not allow one is real drift. `nullable`
        // is the generator's spelling; a union `type` array is JSON Schema's.
        const allowed = s.nullable === true || (Array.isArray(s.type) && s.type.includes('null'));
        if (!allowed) out.push(`${path}: null, but the schema does not allow null`);
        return out;
    }

    if (Array.isArray(value)) {
        if (s.items) value.forEach((v, i) => out.push(...violations(v, s.items!, `${path}[${i}]`)));
        return out;
    }

    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;

        for (const key of s.required ?? []) {
            if (!(key in obj)) out.push(`${path}.${key}: required by the schema, absent from the response`);
        }

        for (const [key, v] of Object.entries(obj)) {
            const declared = s.properties?.[key];
            if (declared) {
                out.push(...violations(v, declared, `${path}.${key}`));
            } else if (s.additionalProperties) {
                out.push(...violations(v, s.additionalProperties, `${path}.${key}`));
            } else if (s.properties) {
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

/** Schema name -> the fixture that must satisfy it. */
const CONTRACTS: Array<[typeName: string, fixture: keyof Fixtures]> = [
    ['HistoryEnvelope', 'entity-history'],
    ['HistoryDailyEnvelope', 'entity-history-daily'],
    ['HistoryCoverageDocument', 'entity-history-coverage'],
    ['HistoryParkRawEnvelope', 'park-history'],
    ['HistoryParkDailyEnvelope', 'park-history-daily'],
    ['HistoryErrorInvalidDate', 'error-invalid-date'],
    ['HistoryErrorRangeTooLong', 'error-range-too-long'],
    ['HistoryErrorNotFound', 'error-not-found'],
];

describe('the published history types describe what the server sends', () => {
    it.each(CONTRACTS)('%s matches a real response with no undeclared fields', (typeName, fixture) => {
        const schema = getTypeSchema(typeName) as Schema | undefined;
        expect(schema, `${typeName} is not registered`).toBeDefined();

        const problems = violations(fixtures[fixture], schema!, typeName);

        expect(problems, `\n  ${problems.join('\n  ')}\n`).toEqual([]);
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
