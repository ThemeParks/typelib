# @themeparks/typelib

TypeScript definition system for ThemeParks.wiki

## Overview

`@themeparks/typelib` is a TypeScript types package that generates types from JSON schemas and provides runtime type validation. It is designed for the internal ThemeParks.wiki systems and generating client libraries. You likely do not want to interact with this library directly.

## Requirements

- Node.js >= 24.0.0

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
