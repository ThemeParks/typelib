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
import { V1RootResponse, registerTypeSchema, getTypeSchema } from '@themeparks/typelib';

// Use generated types
const response: V1RootResponse = {
    success: true,
    message: "API is running", 
    version: "1.0.0"
};

// Access runtime schemas
const schema = getTypeSchema('V1RootResponse');
console.log(schema); // Returns the JSON schema for validation
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

### Runtime Schema Registry

**`registerTypeSchema(name: string, schema: any)`**
Register a schema for runtime use.

**`getTypeSchema(name: string): any`**
Retrieve a registered schema.

```typescript
import { registerTypeSchema, getTypeSchema } from '@themeparks/typelib';

// Schemas are automatically registered when importing types
import { V1RootResponse } from '@themeparks/typelib';

// Access the schema at runtime
const schema = getTypeSchema('V1RootResponse');
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
- **Type definitions** - TypeScript interfaces and types
- **Enum types** - Native TypeScript enums with conversion functions
- **Runtime registration** - Automatic schema registration
- **Re-export index** - Convenient imports from a single file

Example generated output:
```typescript
// Generated: my-types.types.ts

export interface MyType {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Status of the item */
    status?: 'active' | 'inactive' | 'pending';
}

export enum StatusEnum {
    "active" = 'active',
    "inactive" = 'inactive', 
    "pending" = 'pending'
}

// Runtime schema registration
registerTypeSchema("MyType", { /* schema */ });
```

## Package Exports

- `@themeparks/typelib` - Main package with types and registry functions
- `@themeparks/typelib/generate` - Type generation functionality
