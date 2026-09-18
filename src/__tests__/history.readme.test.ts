import { describe, it, expect } from 'vitest';
import type {
    HistoryEnvelope,
    HistoryParkRawEnvelope,
    HistoryRow,
    HistoryDailyRow,
    HistoryErrorRangeTooLong,
    HistoryErrorWindowExceeded,
} from '../types/history.types.js';
import '../types/index.js';

// The README's history examples, verbatim, so `tsc` compiles them.
//
// A README example that does not compile is worse than no example: it is
// confidently wrong, and the reader assumes the mistake is theirs. These are
// the same snippets, so a type change that breaks the documentation breaks the
// build instead of silently shipping.

// --- "two of the history paths return a different shape for a park" ---
type HistoryResponse = HistoryEnvelope | HistoryParkRawEnvelope;

function rowsFor(res: HistoryResponse) {
    return 'entities' in res
        ? res.entities.flatMap((e) => e.history)
        : res.history;
}

// --- "a history row is the complete live-data state at that instant" ---
const row: HistoryRow = {
    time: '2026-09-15T09:43:15Z',
    changed: ['queue.STANDBY.waitTime'],
    status: 'OPERATING',
    queue: { STANDBY: { waitTime: 25 } },
};

// --- "daily summaries leave a block absent rather than null" ---
function medianWait(day: HistoryDailyRow): number | undefined {
    return day.standby?.p50;
}

// --- "errors are discriminated by error.type" ---
type HistoryError = HistoryErrorRangeTooLong | HistoryErrorWindowExceeded;

function explain(err: HistoryError): string {
    switch (err.error.type) {
        case 'RANGE_TOO_LONG': return 'Ask for a shorter range.';
        case 'HISTORY_WINDOW_EXCEEDED': return `History starts at ${err.error.earliestAllowedDate}.`;
    }
}

describe('the README examples behave as the README says', () => {
    it('reads rows out of either response shape through one function', () => {
        const entity = {
            id: 'a', name: 'Space Mountain', entityType: 'ATTRACTION', parentId: null,
            destinationId: null, timezone: 'America/New_York',
            range: { from: '2026-09-15', to: '2026-09-15' },
            coverage: { firstRecordedAt: '2026-06-01' },
            opening: { time: '2026-09-15T04:00:00Z' },
            history: [row],
            next: null,
        } satisfies HistoryEnvelope;

        const park = {
            id: 'p', name: 'Magic Kingdom', entityType: 'PARK', parentId: null,
            destinationId: null, timezone: 'America/New_York',
            range: { from: '2026-09-15', to: '2026-09-15' },
            entities: [{
                id: 'a', name: 'Space Mountain', entityType: 'ATTRACTION',
                coverage: { firstRecordedAt: '2026-06-01' },
                opening: { time: '2026-09-15T04:00:00Z' },
                history: [row],
            }],
            next: null,
        } satisfies HistoryParkRawEnvelope;

        // The branch the README tells a reader to write, exercised both ways.
        expect(rowsFor(entity)).toHaveLength(1);
        expect(rowsFor(park)).toHaveLength(1);
    });

    it('distinguishes an absent stats block from a zero wait', () => {
        const base = {
            date: '2026-09-15', firstOperatingAt: null, lastClosedAt: null,
            operatingMinutes: 0, downMinutes: 0, changes: 0,
        } satisfies HistoryDailyRow;

        // Nothing recorded: `undefined`, NOT 0. Reporting 0 here would claim
        // the ride had no queue all day, which is a different fact entirely.
        expect(medianWait(base)).toBeUndefined();
        expect(medianWait({ ...base, standby: { min: 0, p50: 0, mean: 0, p90: 0, max: 0 } })).toBe(0);
    });

    it('switches over error types exhaustively', () => {
        expect(explain({ error: { type: 'RANGE_TOO_LONG', message: '' } }))
            .toBe('Ask for a shorter range.');
        expect(explain({
            error: { type: 'HISTORY_WINDOW_EXCEEDED', message: '', earliestAllowedDate: '2026-09-08' },
        })).toBe('History starts at 2026-09-08.');
    });

    it('carries unchanged kinds forward, so a row is a whole live-data object', () => {
        // `changed` names only what moved; `status` is still present and still
        // true at that instant. A reader who treats absent-from-`changed` as
        // absent-from-the-row gets this backwards.
        expect(row.changed).toEqual(['queue.STANDBY.waitTime']);
        expect(row.status).toBe('OPERATING');
        expect(row.queue?.STANDBY?.waitTime).toBe(25);
    });
});
