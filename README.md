# @themeparks/typelib

TypeScript definition system for ThemeParks.wiki

## Overview

`@themeparks/typelib` is a TypeScript types package that generates types from JSON schemas and provides runtime type validation. It is designed for the internal ThemeParks.wiki systems and generating client libraries. You likely do not want to interact with this library directly.

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

### Generating types from custom schemas

```typescript
import { generateTypes } from '@themeparks/typelib/generate';
import { resolve } from 'path';

await generateTypes({
    schemaDirs: [resolve('./typesrc')],
    outputDir: './src/types'
});
```

## Schema Format

Schemas follow JSON Schema Draft 7 specification:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MyTypes",
  "type": "object",
  "properties": {
    "MyType": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier"
        },
        "name": {
          "type": "string", 
          "description": "Display name"
        },
        "status": {
          "type": "string",
          "enum": ["active", "inactive", "pending"],
          "description": "Status of the item"
        }
      }
    }
  }
}
```

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
