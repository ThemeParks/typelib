# @themeparks/typelib

TypeScript definition system for ThemeParks.wiki

## Overview

`@themeparks/typelib` is a TypeScript types package that generates types from JSON schemas and provides runtime type validation. It is designed for the internal ThemeParks.wiki systems and generating client libraries. You likely do not want to interact with this library directly.

## Upgrading to 2.0.0

Four queue fields became nullable, because the API has always been able to
return null for them and the types said otherwise:

```ts
LiveQueue.RETURN_TIME.state              ReturnTimeState    -> ReturnTimeState | null
LiveQueue.PAID_RETURN_TIME.state         ReturnTimeState    -> ReturnTimeState | null
LiveQueue.PAID_RETURN_TIME.price         PriceData          -> PriceData | null
LiveQueue.BOARDING_GROUP.allocationStatus BoardingGroupState -> BoardingGroupState | null
```

A park that publishes a return-time queue without a state produces
`state: null`, and that has been true since the field existed. The previous
types told the compiler it could not happen, which made the null check a
caller needs look like dead code.

If your code reads any of these without a null check, it will now fail to
compile — at the exact place it would previously have thrown at runtime. The
fix is the check you were already missing:

```ts
if (queue.RETURN_TIME?.state) { /* ... */ }
```

Nothing else changed shape. The runtime schemas from `getTypeSchema` already
carried `nullable: true` on these fields, so validating consumers were
unaffected either way.

## Requirements

- Node.js >= 18.0.0

## Installation

```bash
npm install @themeparks/typelib
```

## Basic Usage

### Using pre-built types

```typescript
import { Entity, LiveData, EntitySchedule } from '@themeparks/typelib';

// Use generated types
const entity: Entity = {
    id: 'park-123',
    name: 'Example Park',
    entityType: 'PARK',
    timezone: 'America/New_York',
};

const liveData: LiveData = {
    id: 'attraction-456',
    status: 'OPERATING',
};
```

### History types

One thing to know before using these: **two of the history paths return a
different shape for a park than for anything else.** `GET /v1/entity/{id}/history`
answers a single entity with `HistoryEnvelope`, and a `PARK` with
`HistoryParkRawEnvelope` — every entity of that park in one response. The same
split applies to `.../history/daily`. Branch on `entityType`, or on the presence
of `entities`:

```typescript
import type { HistoryEnvelope, HistoryParkRawEnvelope } from '@themeparks/typelib';

type HistoryResponse = HistoryEnvelope | HistoryParkRawEnvelope;

function rowsFor(res: HistoryResponse) {
    return 'entities' in res
        ? res.entities.flatMap((e) => e.history)
        : res.history;
}
```

A history row is the **complete** live-data state at that instant, not just the
part that moved — `changed` lists which leaf paths differ from the row before,
and every other key is carried forward. So a row reads exactly like a
`GET /v1/entity/{id}/live` response:

```typescript
import type { HistoryRow } from '@themeparks/typelib';

const row: HistoryRow = {
    time: '2026-09-15T09:43:15Z',
    changed: ['queue.STANDBY.waitTime'],
    status: 'OPERATING',
    queue: { STANDBY: { waitTime: 25 } },
};
```

Daily summaries leave a block **absent** rather than null when there is nothing
to report, because "no wait was recorded" and "the wait was zero" are different
claims:

```typescript
import type { HistoryDailyRow } from '@themeparks/typelib';

function medianWait(day: HistoryDailyRow): number | undefined {
    return day.standby?.p50;
}
```

Errors are discriminated by `error.type`, each pinned to a literal, so a switch
over them is checked for exhaustiveness:

```typescript
import type { HistoryErrorRangeTooLong, HistoryErrorWindowExceeded } from '@themeparks/typelib';

type HistoryError = HistoryErrorRangeTooLong | HistoryErrorWindowExceeded;

function explain(err: HistoryError): string {
    switch (err.error.type) {
        case 'RANGE_TOO_LONG': return 'Ask for a shorter range.';
        case 'HISTORY_WINDOW_EXCEEDED': return `History starts at ${err.error.earliestAllowedDate}.`;
    }
}
```

### Enums and conversion functions

```typescript
import { EntityTypeEnum, StringToEntityType } from '@themeparks/typelib';

// Native TypeScript enums
const type = EntityTypeEnum.ATTRACTION;

// Convert strings to enum values
const parsed = StringToEntityType('attraction');
```

### Runtime Schema Registry

**`registerTypeSchema(name: string, schema: any)`**
Register a schema for runtime use.

**`getTypeSchema(name: string): any`**
Retrieve a registered schema.

```typescript
import { registerTypeSchema, getTypeSchema } from '@themeparks/typelib';

// Schemas are automatically registered when importing types
import { Entity } from '@themeparks/typelib';

// Access the schema at runtime
const schema = getTypeSchema('Entity');
```

### Deterministic Object Hashing

```typescript
import { hashObject } from '@themeparks/typelib/hash';

// Returns a 64-character hex SHA-256 hash
const hash = hashObject({ name: 'Example', id: 123 });

// Deterministic — key order doesn't matter
hashObject({ b: 2, a: 1 }) === hashObject({ a: 1, b: 2 }); // true
```

### Generating types from schemas

```typescript
import { generateTypes } from '@themeparks/typelib/generate';
import { resolve } from 'path';

await generateTypes({
    schemaDirs: [resolve('./typesrc')],
    outputDir: './src/types'
});
```

## Schema Format

Schemas follow JSON Schema Draft 7 specification. Each file defines top-level types as properties:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Entities",
  "type": "object",
  "properties": {
    "LanguageCode": {
      "type": "string",
      "enum": ["en", "en-gb", "de", "fr", "es", "ja", "ko", "zh"],
      "description": "Supported language codes for ThemeParks.wiki"
    },
    "Entity": {
      "type": "object",
      "required": ["id", "name", "entityType", "timezone"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for this entity"
        },
        "name": {
          "description": "Entity name",
          "$ref": "#/properties/LocalisedString"
        },
        "entityType": {
          "$ref": "#/properties/EntityType"
        },
        "timezone": {
          "type": "string",
          "description": "Timezone of this entity (IANA)"
        }
      }
    }
  }
}
```

Types can reference each other within the same file using `$ref`, and the generator resolves cross-file references automatically.

## Generated Output

The generator creates:
- **Type definitions** — TypeScript interfaces and types
- **Enum types** — Native TypeScript enums with `StringTo*` conversion functions
- **Runtime registration** — Automatic schema registration via `registerTypeSchema`
- **Re-export index** — Convenient imports from a single file

## Package Exports

- `@themeparks/typelib` — Types, enums, and schema registry functions
- `@themeparks/typelib/generate` — Type generation from JSON schemas
- `@themeparks/typelib/hash` — Deterministic SHA-256 object hashing

## Publishing

Builds and publishes to npm automatically via `prepublishOnly`:

```bash
# Bump version in package.json, then:
npm publish --access public
```

This runs `npm run build` (which regenerates types from schemas, then compiles TypeScript) before publishing. The published package includes `dist/`, `typesrc/`, and `src/`.
