// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY

import { LiveQueue, LiveTimeSlot } from './livedata.types.js';

/** Query parameters for GET /v1/entity/{id}/history. No parameters means today, park-local. */
export type HistoryQuery = {
    
    /** One park-local calendar day, YYYY-MM-DD, in the entity's timezone. Cannot be combined with from/to. */
    date?: string;
    
    /** Start of the range: a park-local calendar day (YYYY-MM-DD, inclusive) or an RFC 3339 instant with an explicit offset (inclusive). from and to must be the same form. */
    from?: string;
    
    /** End of the range: a calendar day (inclusive) or an instant (exclusive). Defaults to today (days) or now (instants). At most 31 park-local days per call. */
    to?: string;
}

export type HistoryRange = {
    
    /** The requested start. A park-local day comes back verbatim (YYYY-MM-DD); an instant comes back NORMALISED to UTC whole seconds (2026-09-13T14:00:00Z), so an offset or sub-second precision you sent is not echoed back. On a day-granular endpoint such as /history/daily this is ALWAYS a park-local day, even when you asked with an instant: that endpoint's rows are whole days and cannot be sliced finer, so echoing your instant back would claim a precision the data does not have. */
    from: string;
    
    /** The requested end, in the same form as from, and normalised the same way. Omitted instants default to now; omitted days default to today, park-local. The same day-granular rule as from applies on /history/daily. */
    to: string;
}

export type HistoryCoverage = {
    
    /** First park-local day with recorded history for this entity, or null when nothing has been archived yet. Per-kind detail and gaps: GET /v1/entity/{id}/history/coverage. */
    firstRecordedAt: string | null;
}

/** The full live-data state effective at the start of the range, in the same shape as a row. A key is present only when the entity has that kind. When the value is unknown at that instant (typically an older range, answered from the archive rather than from recent readings) the kind carries its EMPTY live value rather than a null container — an unknown standby is {"waitTime": null}, an unknown showtimes list is [] — and status, which has no empty value, is null. */
export type HistoryOpening = {
    
    /** Start of the range (UTC, whole seconds). The state below is effective from this instant. */
    time: string;
    
    /** Live status at the start of the range; null when unknown. */
    status?: string | null;
    queue?: LiveQueue;
    showtimes?: LiveTimeSlot[] | null;
}

/** One row per instant at which any kind changed. Every present kind is carried forward, so a row is the complete live-data object at that instant (same keys, nesting and enum values as GET /v1/entity/{id}/live). */
export type HistoryRow = {
    
    /** UTC instant (whole seconds) from which this state is effective, until the next row's time. */
    time: string;
    
    /** Leaf paths that differ from the previous row (or from opening for the first row), e.g. queue.STANDBY.waitTime, status, showtimes. */
    changed: string[];
    status?: string | null;
    queue?: LiveQueue;
    showtimes?: LiveTimeSlot[] | null;
}

/** One entity's history as full-state change rows. GET /v1/entity/{id}/history returns this shape for every entityType EXCEPT PARK; for a PARK the same path returns HistoryParkRawEnvelope, which carries an entities[] array instead of this envelope's coverage/opening/history block. */
export type HistoryEnvelope = {
    id: string;
    name: string;
    entityType: string;
    parentId: string | null;
    destinationId: string | null;
    
    /** IANA timezone the park-local days are resolved in. */
    timezone: string;
    range: HistoryRange;
    coverage: HistoryCoverage;
    opening: HistoryOpening;
    
    /** Ascending by time. */
    history: HistoryRow[];
    
    /** URL of the next page, or null. Always null for a single entity (a call covers up to 31 days). Park calls page; see HistoryParkRawEnvelope. */
    next: string | null;
}

/** Query parameters for GET /v1/entity/{id}/history/daily. No parameters means today, park-local. */
export type HistoryDailyQuery = {
    
    /** One park-local calendar day, YYYY-MM-DD, in the entity's timezone. Cannot be combined with from/to. */
    date?: string;
    
    /** Start of the range: a park-local calendar day (YYYY-MM-DD, inclusive) or an RFC 3339 instant with an explicit offset. Instants are accepted so the same parameters work on /history, but a summary is always whole park-local days and range comes back as days either way. from and to must be the same form. */
    from?: string;
    
    /** End of the range: a calendar day (inclusive) or an instant (exclusive). Defaults to today, park-local. At most 3660 park-local days per call. */
    to?: string;
}

/** Wait statistics for one park-local day. The percentiles and the mean are weighted by the MINUTES the wait was posted rather than by the number of readings, so a wait that stood for three hours counts three hours and a brief flap does not drag the median; they are sampled at minute resolution and the percentiles are nearest-rank, never interpolated. `min` and `max` are TRUE extremes over every value posted, so a spike too short to be sampled still shows there. Only periods where the entity was OPERATING and published a numeric wait count at all. The block is absent when it never did. */
export type HistoryDailyStats = {
    
    /** Lowest wait, in minutes, the entity published while OPERATING that day. A true extreme over every value posted, including one that stood for less than a minute — so unlike the percentiles below it is not minute-weighted. */
    min: number;
    
    /** Median wait, nearest-rank over the minute weights (a value actually posted, never interpolated). */
    p50: number;
    
    /** Minute-weighted average wait, rounded to the nearest whole minute. */
    mean: number;
    
    /** 90th-percentile wait, nearest-rank over the minute weights. */
    p90: number;
    
    /** Highest wait, in minutes, the entity published while OPERATING that day. A true extreme, as min is: a spike that lasted forty seconds counts here and is invisible to the percentiles, which is the intended difference between the two halves of this block — extremes answer "what did it ever reach", percentiles answer "what was it usually like". */
    max: number;
}

/** One park-local day of an entity's history reduced to the numbers a crowd calendar needs. standby, singleRider and showCount are ABSENT rather than null when there is nothing to report: an absent standby means no numeric standby wait was in force while OPERATING for a whole sampled minute that day — the statistics are sampled at minute resolution, so a wait published only inside a sub-minute window produces no block at all, even though /history records it and the day's operatingMinutes count it. The same applies to singleRider. An absent showCount means the entity published no showtimes. showCount counts distinct performance start times in the local day. */
export type HistoryDailyRow = {
    
    /** The park-local calendar day this row summarises, YYYY-MM-DD, in the entity's timezone. */
    date: string;
    
    /** UTC instant (whole seconds) the entity first became OPERATING on this park-local day, or null if it never did. A day that opened already OPERATING reports the start of the local day. */
    firstOperatingAt: string | null;
    
    /** UTC instant (whole seconds) of the last transition out of OPERATING or DOWN into CLOSED or REFURBISHMENT after firstOperatingAt, or null if there was none. For a park closing after local midnight this instant falls on the following UTC day. */
    lastClosedAt: string | null;
    
    /** Minutes of this park-local day the entity was OPERATING. Minutes with no observed state count as neither operating nor down, so the two counters need not add up to the length of the day. For TODAY the count covers only the minutes that have already elapsed, so it grows through the day and is final once the day ends: a caller polling today's row sees it rise, which is the day filling in rather than the answer changing. */
    operatingMinutes: number;
    
    /** Minutes of this park-local day the entity was DOWN. As with operatingMinutes, today's count covers only the elapsed part of the day. */
    downMinutes: number;
    standby?: HistoryDailyStats;
    singleRider?: HistoryDailyStats;
    
    /** Distinct performance start times whose park-local day is this day. Present only for entities that published showtimes on the day. */
    showCount?: number;
    
    /** Number of history rows recorded on this day, i.e. instants at which any kind changed. Short flaps are counted as they happened; this is not a cleaned figure. */
    changes: number;
}

/** A day-by-day summary of one entity's history. GET /v1/entity/{id}/history/daily returns this shape for every entityType EXCEPT PARK; for a PARK the same path returns HistoryParkDailyEnvelope, which carries an entities[] array instead of this envelope's coverage/days block. range.from and range.to ALWAYS echo park-local calendar days (YYYY-MM-DD), even when the call supplied RFC 3339 instants, because this endpoint summarises whole park-local days and an instant echo would claim a precision the rows do not have. TODAY's row is the day so far — its counters cover only elapsed minutes and grow as the day does — and it is cached at the edge for up to an hour for callers without an API key, so a poller can see a value up to an hour behind the live feed. If you need the current state of an entity rather than its day so far, GET /v1/entity/{id}/live is not cached that way. */
export type HistoryDailyEnvelope = {
    id: string;
    name: string;
    entityType: string;
    parentId: string | null;
    destinationId: string | null;
    
    /** IANA timezone the park-local days are resolved in. */
    timezone: string;
    range: HistoryRange;
    coverage: HistoryCoverage;
    
    /** One row per park-local day, ascending by date. A day with no data is ABSENT: there is no row of zeroes, because "we have nothing for this day" is a different claim from "observed, closed all day". */
    days: HistoryDailyRow[];
    
    /** URL of the next page, or null. Always null for a single entity: a daily call is unpaged. Park calls page; see HistoryParkDailyEnvelope. */
    next: string | null;
}

/** One entity of a park in a park DAILY response: its identity, the first day it has any history, and its day rows. The park itself appears as an entry too when it has history of its own (match it by id against the envelope's id). An entity with no history at all is ABSENT from entities[]. */
export type HistoryParkEntityDaily = {
    id: string;
    name: string;
    entityType: string;
    coverage: HistoryCoverage;
    
    /** One row per park-local day, ascending by date, exactly as GET /v1/entity/{id}/history/daily returns for this entity on its own. A day with no data is ABSENT, and an entity with history but nothing in the requested days has an empty array rather than vanishing from entities[] — so the entity list keeps its shape from one page to the next. */
    days: HistoryDailyRow[];
}

/** One entity of a park in a park RAW response: the same coverage, opening and history block GET /v1/entity/{id}/history returns for that entity on its own, so one client type reads both. The park itself appears as an entry too when it has history of its own (match it by id against the envelope's id). */
export type HistoryParkEntityRaw = {
    id: string;
    name: string;
    entityType: string;
    coverage: HistoryCoverage;
    opening: HistoryOpening;
    
    /** Ascending by time. Empty when this entity recorded no change in the requested range, which is a different claim from having no history at all — an entity with no history is absent from entities[]. */
    history: HistoryRow[];
}

/** A day-by-day summary of a whole PARK: every entity of the park that has history, in one call. GET /v1/entity/{id}/history/daily returns THIS shape when the entity is a PARK (entityType: "PARK") and HistoryDailyEnvelope for every other entityType, so a client should branch on the presence of entities[] or on the entity's type. range.from and range.to are always park-local calendar days, and range.to is THIS PAGE's last day rather than the whole range you asked for: a call serves at most 31 park-local days and next carries the rest. */
export type HistoryParkDailyEnvelope = {
    id: string;
    name: string;
    entityType: string;
    parentId: string | null;
    destinationId: string | null;
    
    /** IANA timezone the park-local days are resolved in. The park is the authority on where its day boundaries fall, so every entity below is summarised in THIS zone. */
    timezone: string;
    range: HistoryRange;
    
    /** One entry per entity of the park that has history, ascending by name. An entity with no history is ABSENT — never an entry of nulls or an empty days[] — because "we hold nothing for this entity" is a different claim from "we hold nothing for these days". The park itself is included when it has history of its own. */
    entities: HistoryParkEntityDaily[];
    
    /** Absolute URL of the next page, or null on the last one. A park daily call serves at most 31 park-local days and pages by DAY: the next URL repeats your other parameters with from advanced past this page's last day. Entity order never affects paging. */
    next: string | null;
}

/** Full-state change rows for a whole PARK: every entity of the park that has history, in one call, for exactly 1 park-local day. GET /v1/entity/{id}/history returns THIS shape when the entity is a PARK (entityType: "PARK") and HistoryEnvelope for every other entityType, so a client should branch on the presence of entities[] or on the entity's type. A range spanning more than one day is 400 RANGE_TOO_LONG: a day of a park is up to a few hundred entities of archived history and the one-day limit is what bounds it. Ask day by day. */
export type HistoryParkRawEnvelope = {
    id: string;
    name: string;
    entityType: string;
    parentId: string | null;
    destinationId: string | null;
    
    /** IANA timezone the park-local day is resolved in. The park is the authority on where its day boundaries fall, so every entity below is resolved in THIS zone. */
    timezone: string;
    range: HistoryRange;
    
    /** One entry per entity of the park that has history, ascending by name. An entity with no history is ABSENT — never an entry of nulls — because "we hold nothing for this entity" is a different claim from "this entity recorded no change today". The park itself is included when it has history of its own. */
    entities: HistoryParkEntityRaw[];
    
    /** Always null: a park history call covers one park-local day, so there is never a next page. */
    next: string | null;
}

/** One live-data field's recorded span for an entity, both ends inclusive. */
export type HistoryCoverageKindSpan = {
    
    /** First park-local day this field was reported. */
    first: string;
    
    /** Newest park-local day this field appears in the ARCHIVE. This is not the same as the last day the field was reported, and it does NOT mean the field has stopped: the archive is written a day or two behind live data, so a field being published right now still has a `last` two days in the past. Every active field looks the same as a withdrawn one here. Use this to know how far back the archive goes and how current it is, not to decide whether a field is still live — GET /v1/entity/{id}/live answers that directly. */
    last: string;
}

/** What history is actually held for one entity, broken down per live-data field. Two different questions, answered separately: `firstRecordedAt`/`lastRecordedAt` and the per-field spans describe the ARCHIVE, while `retrievableThrough` is the newest day a history call could return for this entity — which is normally today, and normally a day or two AHEAD of `lastRecordedAt`. An entity with nothing recorded is a 200 with kinds: {} and every day null, never a 404: "we hold nothing for this entity" is a real, actionable answer and a different claim from "this entity does not exist". */
export type HistoryCoverageDocument = {
    id: string;
    name: string;
    entityType: string;
    parentId: string | null;
    destinationId: string | null;
    
    /** IANA timezone the park-local days are resolved in. */
    timezone: string;
    
    /** First park-local day with any recorded history for this entity, or null when nothing has been archived yet. May legitimately be earlier than any individual kind's first, since the two watermarks are written by different passes over different windows. */
    firstRecordedAt: string | null;
    
    /** The newest `last` across `kinds` — the most recent park-local day we hold anything at all for this entity — or null when nothing is recorded. Like the per-field `last`, this tracks the ARCHIVE and lags live data by a day or two, so it sits in the past for an entity reporting normally. */
    lastRecordedAt: string | null;
    
    /** The newest park-local day GET /v1/entity/{id}/history and .../history/daily could return data for this entity — what you can ASK FOR, as opposed to what has been filed. Normally TODAY for an entity still reporting, because those endpoints serve the live shelf as well as the archive, and it therefore sits AHEAD of `lastRecordedAt` by the compaction lag (a day or two) for a healthy entity. That gap is the whole point of this field: `lastRecordedAt` and every per-field `last` describe the ARCHIVE only, and reading them as capability is what makes coverage look as though it has stopped a couple of days short. It is the LATER of `lastRecordedAt` and the newest day the live shelf still SERVES — so an entity that stopped reporting long ago reports its archive day here, NOT today, and the field never promises data that is not there. The live shelf has a bounded depth, so a day is reported here only if one of those endpoints can actually return it: an entity whose last reading predates the shelf falls back to its archive day rather than naming the day that reading was taken. Null only when we hold nothing for this entity in either place. A request for a range up to this day can still be narrowed by your tier's history window, which bounds how far BACK you may ask, never how recent. */
    retrievableThrough: string | null;
    
    /** Keyed by LIVE-DATA PATH (status, queue.STANDBY, showtimes, ...), not by the internal kind name, so a key matches straight against what GET /v1/entity/{id}/live and GET /v1/entity/{id}/history return. A kind the entity never reported is ABSENT here and absent from every /history row — there is no zero-span entry for it. See `last` for why a span ending in the past does NOT mean the field stopped being reported: the archive lags live data by a day or two, so an actively published field ends in the past too. Every span here is archive-only; `retrievableThrough` is the entity-wide answer to how recent a day you can actually ask for. */
    kinds: Record<string, HistoryCoverageKindSpan>;
}

/** The shape every history error shares: a single `error` object carrying a machine-readable `type` and a human-readable `message`. Each concrete error below pins `type` to one value, so a 400 oneOf has three DISTINGUISHABLE branches and a generated client gets three distinct types. Do not validate against this base directly — match on error.type. */
export type HistoryErrorBase = {
    error: {
    type: string;
    message: string;
};
}

/** 400: a date parameter is not a calendar day or an RFC 3339 instant with an explicit offset, or date was combined with from/to, or from and to mix the two forms, or to was given without from. */
export type HistoryErrorInvalidDate = {
    error: {
    type: 'INVALID_DATE';
    
    /** e.g. "from must be a calendar day (YYYY-MM-DD) or an RFC 3339 instant with an offset (e.g. 2026-09-13T14:00:00Z)." */
    message: string;
};
}

/** 400: both ends parsed, but the range runs backwards (days: to before from; instants: to not after from). */
export type HistoryErrorInvalidRange = {
    error: {
    type: 'INVALID_RANGE';
    
    /** e.g. "to must not be before from." */
    message: string;
};
}

/** 400: the range spans more than 31 park-local days. Split it into consecutive calls. */
export type HistoryErrorRangeTooLong = {
    error: {
    type: 'RANGE_TOO_LONG';
    
    /** e.g. "A history call covers at most 31 park-local days (2026-01-01 to 2026-03-01 is 60). Ask for a shorter range." */
    message: string;
};
}

/** 404: no entity with that id. */
export type HistoryErrorNotFound = {
    error: {
    type: 'NOT_FOUND';
    message: string;
};
}

/** 502: the range needs archived history and that backend is temporarily unavailable. The request is retryable. */
export type HistoryErrorBackendUnavailable = {
    error: {
    type: 'HISTORY_BACKEND_UNAVAILABLE';
    message: string;
};
}

/** 429: the caller's hourly history request budget is spent. The budget is separate from the per-minute REST limit and is published per tier in GET /tiers as limits.historyRequestsPerHour (anonymous.historyRequestsPerHour for keyless calls). */
export type HistoryErrorRateLimited = {
    error: {
    type: 'HISTORY_RATE_LIMITED';
    
    /** e.g. "This key can make 600 history requests an hour." */
    message: string;
    
    /** Seconds until the hourly history budget admits another request. Also sent as the Retry-After header. */
    retryAfter: number;
};
}

export type HistoryErrorWindowExceeded = {
    error: {
    type: 'HISTORY_WINDOW_EXCEEDED';
    
    /** A fact and a date, naming no plan and selling nothing. e.g. "This key can see history back to 2026-09-08 (7 days).", or "Requests without an API key can see history back to 2026-09-08 (7 days)." when you sent no key. */
    message: string;
    
    /** First park-local day this credential may query. */
    earliestAllowedDate: string;
};
}


// Runtime Schema Registration
import { registerTypeSchema } from "../type_register.js";

registerTypeSchema("HistoryQuery", {
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "description": "One park-local calendar day, YYYY-MM-DD, in the entity's timezone. Cannot be combined with from/to."
    },
    "from": {
      "type": "string",
      "description": "Start of the range: a park-local calendar day (YYYY-MM-DD, inclusive) or an RFC 3339 instant with an explicit offset (inclusive). from and to must be the same form."
    },
    "to": {
      "type": "string",
      "description": "End of the range: a calendar day (inclusive) or an instant (exclusive). Defaults to today (days) or now (instants). At most 31 park-local days per call."
    }
  },
  "description": "Query parameters for GET /v1/entity/{id}/history. No parameters means today, park-local."
});

registerTypeSchema("HistoryRange", {
  "type": "object",
  "required": [
    "from",
    "to"
  ],
  "properties": {
    "from": {
      "type": "string",
      "description": "The requested start. A park-local day comes back verbatim (YYYY-MM-DD); an instant comes back NORMALISED to UTC whole seconds (2026-09-13T14:00:00Z), so an offset or sub-second precision you sent is not echoed back. On a day-granular endpoint such as /history/daily this is ALWAYS a park-local day, even when you asked with an instant: that endpoint's rows are whole days and cannot be sliced finer, so echoing your instant back would claim a precision the data does not have."
    },
    "to": {
      "type": "string",
      "description": "The requested end, in the same form as from, and normalised the same way. Omitted instants default to now; omitted days default to today, park-local. The same day-granular rule as from applies on /history/daily."
    }
  }
});

registerTypeSchema("HistoryCoverage", {
  "type": "object",
  "required": [
    "firstRecordedAt"
  ],
  "properties": {
    "firstRecordedAt": {
      "type": "string",
      "format": "date",
      "nullable": true,
      "description": "First park-local day with recorded history for this entity, or null when nothing has been archived yet. Per-kind detail and gaps: GET /v1/entity/{id}/history/coverage."
    }
  }
});

registerTypeSchema("HistoryOpening", {
  "type": "object",
  "required": [
    "time"
  ],
  "properties": {
    "time": {
      "type": "string",
      "format": "date-time",
      "description": "Start of the range (UTC, whole seconds). The state below is effective from this instant."
    },
    "status": {
      "type": "string",
      "nullable": true,
      "description": "Live status at the start of the range; null when unknown."
    },
    "queue": {
      "$ref": "#/properties/LiveQueue"
    },
    "showtimes": {
      "type": "array",
      "nullable": true,
      "items": {
        "$ref": "#/properties/LiveTimeSlot"
      }
    }
  },
  "description": "The full live-data state effective at the start of the range, in the same shape as a row. A key is present only when the entity has that kind. When the value is unknown at that instant (typically an older range, answered from the archive rather than from recent readings) the kind carries its EMPTY live value rather than a null container — an unknown standby is {\"waitTime\": null}, an unknown showtimes list is [] — and status, which has no empty value, is null."
});

registerTypeSchema("HistoryRow", {
  "type": "object",
  "required": [
    "time",
    "changed"
  ],
  "properties": {
    "time": {
      "type": "string",
      "format": "date-time",
      "description": "UTC instant (whole seconds) from which this state is effective, until the next row's time."
    },
    "changed": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Leaf paths that differ from the previous row (or from opening for the first row), e.g. queue.STANDBY.waitTime, status, showtimes."
    },
    "status": {
      "type": "string",
      "nullable": true
    },
    "queue": {
      "$ref": "#/properties/LiveQueue"
    },
    "showtimes": {
      "type": "array",
      "nullable": true,
      "items": {
        "$ref": "#/properties/LiveTimeSlot"
      }
    }
  },
  "description": "One row per instant at which any kind changed. Every present kind is carried forward, so a row is the complete live-data object at that instant (same keys, nesting and enum values as GET /v1/entity/{id}/live)."
});

registerTypeSchema("HistoryEnvelope", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "parentId",
    "destinationId",
    "timezone",
    "range",
    "coverage",
    "opening",
    "history",
    "next"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "parentId": {
      "type": "string",
      "nullable": true
    },
    "destinationId": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone the park-local days are resolved in."
    },
    "range": {
      "$ref": "#/properties/HistoryRange"
    },
    "coverage": {
      "$ref": "#/properties/HistoryCoverage"
    },
    "opening": {
      "$ref": "#/properties/HistoryOpening"
    },
    "history": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryRow"
      },
      "description": "Ascending by time."
    },
    "next": {
      "type": "string",
      "nullable": true,
      "description": "URL of the next page, or null. Always null for a single entity (a call covers up to 31 days). Park calls page; see HistoryParkRawEnvelope."
    }
  },
  "description": "One entity's history as full-state change rows. GET /v1/entity/{id}/history returns this shape for every entityType EXCEPT PARK; for a PARK the same path returns HistoryParkRawEnvelope, which carries an entities[] array instead of this envelope's coverage/opening/history block."
});

registerTypeSchema("HistoryDailyQuery", {
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "description": "One park-local calendar day, YYYY-MM-DD, in the entity's timezone. Cannot be combined with from/to."
    },
    "from": {
      "type": "string",
      "description": "Start of the range: a park-local calendar day (YYYY-MM-DD, inclusive) or an RFC 3339 instant with an explicit offset. Instants are accepted so the same parameters work on /history, but a summary is always whole park-local days and range comes back as days either way. from and to must be the same form."
    },
    "to": {
      "type": "string",
      "description": "End of the range: a calendar day (inclusive) or an instant (exclusive). Defaults to today, park-local. At most 3660 park-local days per call."
    }
  },
  "description": "Query parameters for GET /v1/entity/{id}/history/daily. No parameters means today, park-local."
});

registerTypeSchema("HistoryDailyStats", {
  "type": "object",
  "required": [
    "min",
    "p50",
    "mean",
    "p90",
    "max"
  ],
  "properties": {
    "min": {
      "type": "integer",
      "description": "Lowest wait, in minutes, the entity published while OPERATING that day. A true extreme over every value posted, including one that stood for less than a minute — so unlike the percentiles below it is not minute-weighted."
    },
    "p50": {
      "type": "integer",
      "description": "Median wait, nearest-rank over the minute weights (a value actually posted, never interpolated)."
    },
    "mean": {
      "type": "integer",
      "description": "Minute-weighted average wait, rounded to the nearest whole minute."
    },
    "p90": {
      "type": "integer",
      "description": "90th-percentile wait, nearest-rank over the minute weights."
    },
    "max": {
      "type": "integer",
      "description": "Highest wait, in minutes, the entity published while OPERATING that day. A true extreme, as min is: a spike that lasted forty seconds counts here and is invisible to the percentiles, which is the intended difference between the two halves of this block — extremes answer \"what did it ever reach\", percentiles answer \"what was it usually like\"."
    }
  },
  "description": "Wait statistics for one park-local day. The percentiles and the mean are weighted by the MINUTES the wait was posted rather than by the number of readings, so a wait that stood for three hours counts three hours and a brief flap does not drag the median; they are sampled at minute resolution and the percentiles are nearest-rank, never interpolated. `min` and `max` are TRUE extremes over every value posted, so a spike too short to be sampled still shows there. Only periods where the entity was OPERATING and published a numeric wait count at all. The block is absent when it never did."
});

registerTypeSchema("HistoryDailyRow", {
  "type": "object",
  "required": [
    "date",
    "firstOperatingAt",
    "lastClosedAt",
    "operatingMinutes",
    "downMinutes",
    "changes"
  ],
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "description": "The park-local calendar day this row summarises, YYYY-MM-DD, in the entity's timezone."
    },
    "firstOperatingAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "UTC instant (whole seconds) the entity first became OPERATING on this park-local day, or null if it never did. A day that opened already OPERATING reports the start of the local day."
    },
    "lastClosedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "UTC instant (whole seconds) of the last transition out of OPERATING or DOWN into CLOSED or REFURBISHMENT after firstOperatingAt, or null if there was none. For a park closing after local midnight this instant falls on the following UTC day."
    },
    "operatingMinutes": {
      "type": "integer",
      "description": "Minutes of this park-local day the entity was OPERATING. Minutes with no observed state count as neither operating nor down, so the two counters need not add up to the length of the day. For TODAY the count covers only the minutes that have already elapsed, so it grows through the day and is final once the day ends: a caller polling today's row sees it rise, which is the day filling in rather than the answer changing."
    },
    "downMinutes": {
      "type": "integer",
      "description": "Minutes of this park-local day the entity was DOWN. As with operatingMinutes, today's count covers only the elapsed part of the day."
    },
    "standby": {
      "$ref": "#/properties/HistoryDailyStats"
    },
    "singleRider": {
      "$ref": "#/properties/HistoryDailyStats"
    },
    "showCount": {
      "type": "integer",
      "description": "Distinct performance start times whose park-local day is this day. Present only for entities that published showtimes on the day."
    },
    "changes": {
      "type": "integer",
      "description": "Number of history rows recorded on this day, i.e. instants at which any kind changed. Short flaps are counted as they happened; this is not a cleaned figure."
    }
  },
  "description": "One park-local day of an entity's history reduced to the numbers a crowd calendar needs. standby, singleRider and showCount are ABSENT rather than null when there is nothing to report: an absent standby means no numeric standby wait was in force while OPERATING for a whole sampled minute that day — the statistics are sampled at minute resolution, so a wait published only inside a sub-minute window produces no block at all, even though /history records it and the day's operatingMinutes count it. The same applies to singleRider. An absent showCount means the entity published no showtimes. showCount counts distinct performance start times in the local day."
});

registerTypeSchema("HistoryDailyEnvelope", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "parentId",
    "destinationId",
    "timezone",
    "range",
    "coverage",
    "days",
    "next"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "parentId": {
      "type": "string",
      "nullable": true
    },
    "destinationId": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone the park-local days are resolved in."
    },
    "range": {
      "$ref": "#/properties/HistoryRange"
    },
    "coverage": {
      "$ref": "#/properties/HistoryCoverage"
    },
    "days": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryDailyRow"
      },
      "description": "One row per park-local day, ascending by date. A day with no data is ABSENT: there is no row of zeroes, because \"we have nothing for this day\" is a different claim from \"observed, closed all day\"."
    },
    "next": {
      "type": "string",
      "nullable": true,
      "description": "URL of the next page, or null. Always null for a single entity: a daily call is unpaged. Park calls page; see HistoryParkDailyEnvelope."
    }
  },
  "description": "A day-by-day summary of one entity's history. GET /v1/entity/{id}/history/daily returns this shape for every entityType EXCEPT PARK; for a PARK the same path returns HistoryParkDailyEnvelope, which carries an entities[] array instead of this envelope's coverage/days block. range.from and range.to ALWAYS echo park-local calendar days (YYYY-MM-DD), even when the call supplied RFC 3339 instants, because this endpoint summarises whole park-local days and an instant echo would claim a precision the rows do not have. TODAY's row is the day so far — its counters cover only elapsed minutes and grow as the day does — and it is cached at the edge for up to an hour for callers without an API key, so a poller can see a value up to an hour behind the live feed. If you need the current state of an entity rather than its day so far, GET /v1/entity/{id}/live is not cached that way."
});

registerTypeSchema("HistoryParkEntityDaily", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "coverage",
    "days"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "coverage": {
      "$ref": "#/properties/HistoryCoverage"
    },
    "days": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryDailyRow"
      },
      "description": "One row per park-local day, ascending by date, exactly as GET /v1/entity/{id}/history/daily returns for this entity on its own. A day with no data is ABSENT, and an entity with history but nothing in the requested days has an empty array rather than vanishing from entities[] — so the entity list keeps its shape from one page to the next."
    }
  },
  "description": "One entity of a park in a park DAILY response: its identity, the first day it has any history, and its day rows. The park itself appears as an entry too when it has history of its own (match it by id against the envelope's id). An entity with no history at all is ABSENT from entities[]."
});

registerTypeSchema("HistoryParkEntityRaw", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "coverage",
    "opening",
    "history"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "coverage": {
      "$ref": "#/properties/HistoryCoverage"
    },
    "opening": {
      "$ref": "#/properties/HistoryOpening"
    },
    "history": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryRow"
      },
      "description": "Ascending by time. Empty when this entity recorded no change in the requested range, which is a different claim from having no history at all — an entity with no history is absent from entities[]."
    }
  },
  "description": "One entity of a park in a park RAW response: the same coverage, opening and history block GET /v1/entity/{id}/history returns for that entity on its own, so one client type reads both. The park itself appears as an entry too when it has history of its own (match it by id against the envelope's id)."
});

registerTypeSchema("HistoryParkDailyEnvelope", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "parentId",
    "destinationId",
    "timezone",
    "range",
    "entities",
    "next"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "parentId": {
      "type": "string",
      "nullable": true
    },
    "destinationId": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone the park-local days are resolved in. The park is the authority on where its day boundaries fall, so every entity below is summarised in THIS zone."
    },
    "range": {
      "$ref": "#/properties/HistoryRange"
    },
    "entities": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryParkEntityDaily"
      },
      "description": "One entry per entity of the park that has history, ascending by name. An entity with no history is ABSENT — never an entry of nulls or an empty days[] — because \"we hold nothing for this entity\" is a different claim from \"we hold nothing for these days\". The park itself is included when it has history of its own."
    },
    "next": {
      "type": "string",
      "nullable": true,
      "description": "Absolute URL of the next page, or null on the last one. A park daily call serves at most 31 park-local days and pages by DAY: the next URL repeats your other parameters with from advanced past this page's last day. Entity order never affects paging."
    }
  },
  "description": "A day-by-day summary of a whole PARK: every entity of the park that has history, in one call. GET /v1/entity/{id}/history/daily returns THIS shape when the entity is a PARK (entityType: \"PARK\") and HistoryDailyEnvelope for every other entityType, so a client should branch on the presence of entities[] or on the entity's type. range.from and range.to are always park-local calendar days, and range.to is THIS PAGE's last day rather than the whole range you asked for: a call serves at most 31 park-local days and next carries the rest."
});

registerTypeSchema("HistoryParkRawEnvelope", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "parentId",
    "destinationId",
    "timezone",
    "range",
    "entities",
    "next"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "parentId": {
      "type": "string",
      "nullable": true
    },
    "destinationId": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone the park-local day is resolved in. The park is the authority on where its day boundaries fall, so every entity below is resolved in THIS zone."
    },
    "range": {
      "$ref": "#/properties/HistoryRange"
    },
    "entities": {
      "type": "array",
      "items": {
        "$ref": "#/properties/HistoryParkEntityRaw"
      },
      "description": "One entry per entity of the park that has history, ascending by name. An entity with no history is ABSENT — never an entry of nulls — because \"we hold nothing for this entity\" is a different claim from \"this entity recorded no change today\". The park itself is included when it has history of its own."
    },
    "next": {
      "type": "string",
      "nullable": true,
      "description": "Always null: a park history call covers one park-local day, so there is never a next page."
    }
  },
  "description": "Full-state change rows for a whole PARK: every entity of the park that has history, in one call, for exactly 1 park-local day. GET /v1/entity/{id}/history returns THIS shape when the entity is a PARK (entityType: \"PARK\") and HistoryEnvelope for every other entityType, so a client should branch on the presence of entities[] or on the entity's type. A range spanning more than one day is 400 RANGE_TOO_LONG: a day of a park is up to a few hundred entities of archived history and the one-day limit is what bounds it. Ask day by day."
});

registerTypeSchema("HistoryCoverageKindSpan", {
  "type": "object",
  "required": [
    "first",
    "last"
  ],
  "properties": {
    "first": {
      "type": "string",
      "format": "date",
      "description": "First park-local day this field was reported."
    },
    "last": {
      "type": "string",
      "format": "date",
      "description": "Newest park-local day this field appears in the ARCHIVE. This is not the same as the last day the field was reported, and it does NOT mean the field has stopped: the archive is written a day or two behind live data, so a field being published right now still has a `last` two days in the past. Every active field looks the same as a withdrawn one here. Use this to know how far back the archive goes and how current it is, not to decide whether a field is still live — GET /v1/entity/{id}/live answers that directly."
    }
  },
  "description": "One live-data field's recorded span for an entity, both ends inclusive."
});

registerTypeSchema("HistoryCoverageDocument", {
  "type": "object",
  "required": [
    "id",
    "name",
    "entityType",
    "parentId",
    "destinationId",
    "timezone",
    "firstRecordedAt",
    "lastRecordedAt",
    "retrievableThrough",
    "kinds"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "entityType": {
      "type": "string"
    },
    "parentId": {
      "type": "string",
      "nullable": true
    },
    "destinationId": {
      "type": "string",
      "nullable": true
    },
    "timezone": {
      "type": "string",
      "description": "IANA timezone the park-local days are resolved in."
    },
    "firstRecordedAt": {
      "type": "string",
      "format": "date",
      "nullable": true,
      "description": "First park-local day with any recorded history for this entity, or null when nothing has been archived yet. May legitimately be earlier than any individual kind's first, since the two watermarks are written by different passes over different windows."
    },
    "lastRecordedAt": {
      "type": "string",
      "format": "date",
      "nullable": true,
      "description": "The newest `last` across `kinds` — the most recent park-local day we hold anything at all for this entity — or null when nothing is recorded. Like the per-field `last`, this tracks the ARCHIVE and lags live data by a day or two, so it sits in the past for an entity reporting normally."
    },
    "retrievableThrough": {
      "type": "string",
      "format": "date",
      "nullable": true,
      "description": "The newest park-local day GET /v1/entity/{id}/history and .../history/daily could return data for this entity — what you can ASK FOR, as opposed to what has been filed. Normally TODAY for an entity still reporting, because those endpoints serve the live shelf as well as the archive, and it therefore sits AHEAD of `lastRecordedAt` by the compaction lag (a day or two) for a healthy entity. That gap is the whole point of this field: `lastRecordedAt` and every per-field `last` describe the ARCHIVE only, and reading them as capability is what makes coverage look as though it has stopped a couple of days short. It is the LATER of `lastRecordedAt` and the newest day the live shelf still SERVES — so an entity that stopped reporting long ago reports its archive day here, NOT today, and the field never promises data that is not there. The live shelf has a bounded depth, so a day is reported here only if one of those endpoints can actually return it: an entity whose last reading predates the shelf falls back to its archive day rather than naming the day that reading was taken. Null only when we hold nothing for this entity in either place. A request for a range up to this day can still be narrowed by your tier's history window, which bounds how far BACK you may ask, never how recent."
    },
    "kinds": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/properties/HistoryCoverageKindSpan"
      },
      "description": "Keyed by LIVE-DATA PATH (status, queue.STANDBY, showtimes, ...), not by the internal kind name, so a key matches straight against what GET /v1/entity/{id}/live and GET /v1/entity/{id}/history return. A kind the entity never reported is ABSENT here and absent from every /history row — there is no zero-span entry for it. See `last` for why a span ending in the past does NOT mean the field stopped being reported: the archive lags live data by a day or two, so an actively published field ends in the past too. Every span here is archive-only; `retrievableThrough` is the entity-wide answer to how recent a day you can actually ask for."
    }
  },
  "description": "What history is actually held for one entity, broken down per live-data field. Two different questions, answered separately: `firstRecordedAt`/`lastRecordedAt` and the per-field spans describe the ARCHIVE, while `retrievableThrough` is the newest day a history call could return for this entity — which is normally today, and normally a day or two AHEAD of `lastRecordedAt`. An entity with nothing recorded is a 200 with kinds: {} and every day null, never a 404: \"we hold nothing for this entity\" is a real, actionable answer and a different claim from \"this entity does not exist\"."
});

registerTypeSchema("HistoryErrorBase", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      }
    }
  },
  "description": "The shape every history error shares: a single `error` object carrying a machine-readable `type` and a human-readable `message`. Each concrete error below pins `type` to one value, so a 400 oneOf has three DISTINGUISHABLE branches and a generated client gets three distinct types. Do not validate against this base directly — match on error.type."
});

registerTypeSchema("HistoryErrorInvalidDate", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "INVALID_DATE"
          ]
        },
        "message": {
          "type": "string",
          "description": "e.g. \"from must be a calendar day (YYYY-MM-DD) or an RFC 3339 instant with an offset (e.g. 2026-09-13T14:00:00Z).\""
        }
      }
    }
  },
  "description": "400: a date parameter is not a calendar day or an RFC 3339 instant with an explicit offset, or date was combined with from/to, or from and to mix the two forms, or to was given without from."
});

registerTypeSchema("HistoryErrorInvalidRange", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "INVALID_RANGE"
          ]
        },
        "message": {
          "type": "string",
          "description": "e.g. \"to must not be before from.\""
        }
      }
    }
  },
  "description": "400: both ends parsed, but the range runs backwards (days: to before from; instants: to not after from)."
});

registerTypeSchema("HistoryErrorRangeTooLong", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "RANGE_TOO_LONG"
          ]
        },
        "message": {
          "type": "string",
          "description": "e.g. \"A history call covers at most 31 park-local days (2026-01-01 to 2026-03-01 is 60). Ask for a shorter range.\""
        }
      }
    }
  },
  "description": "400: the range spans more than 31 park-local days. Split it into consecutive calls."
});

registerTypeSchema("HistoryErrorNotFound", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "NOT_FOUND"
          ]
        },
        "message": {
          "type": "string"
        }
      }
    }
  },
  "description": "404: no entity with that id."
});

registerTypeSchema("HistoryErrorBackendUnavailable", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "HISTORY_BACKEND_UNAVAILABLE"
          ]
        },
        "message": {
          "type": "string"
        }
      }
    }
  },
  "description": "502: the range needs archived history and that backend is temporarily unavailable. The request is retryable."
});

registerTypeSchema("HistoryErrorRateLimited", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message",
        "retryAfter"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "HISTORY_RATE_LIMITED"
          ]
        },
        "message": {
          "type": "string",
          "description": "e.g. \"This key can make 600 history requests an hour.\""
        },
        "retryAfter": {
          "type": "integer",
          "description": "Seconds until the hourly history budget admits another request. Also sent as the Retry-After header."
        }
      }
    }
  },
  "description": "429: the caller's hourly history request budget is spent. The budget is separate from the per-minute REST limit and is published per tier in GET /tiers as limits.historyRequestsPerHour (anonymous.historyRequestsPerHour for keyless calls)."
});

registerTypeSchema("HistoryErrorWindowExceeded", {
  "type": "object",
  "required": [
    "error"
  ],
  "properties": {
    "error": {
      "type": "object",
      "required": [
        "type",
        "message",
        "earliestAllowedDate"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "HISTORY_WINDOW_EXCEEDED"
          ]
        },
        "message": {
          "type": "string",
          "description": "A fact and a date, naming no plan and selling nothing. e.g. \"This key can see history back to 2026-09-08 (7 days).\", or \"Requests without an API key can see history back to 2026-09-08 (7 days).\" when you sent no key."
        },
        "earliestAllowedDate": {
          "type": "string",
          "format": "date",
          "description": "First park-local day this credential may query."
        }
      }
    }
  }
});

