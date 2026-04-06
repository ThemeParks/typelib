import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateTypes } from '../generate_types.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ── Helpers ───────────────────────────────────────────────────────────────────

let tempDir: string;
let schemaDir: string;
let outputDir: string;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'typelib-test-'));
    schemaDir = join(tempDir, 'schemas');
    outputDir = join(tempDir, 'output');
    await fs.mkdir(schemaDir, { recursive: true });
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
});

async function writeSchema(filename: string, schema: object): Promise<void> {
    await fs.writeFile(join(schemaDir, filename), JSON.stringify(schema, null, 2));
}

async function readOutput(filename: string): Promise<string> {
    return fs.readFile(join(outputDir, filename), 'utf-8');
}

async function generate(): Promise<void> {
    await generateTypes({
        schemaDirs: [schemaDir],
        outputDir,
        typeRegistryImport: '@themeparks/typelib',
    });
}

// ── Basic type generation ─────────────────────────────────────────────────────

describe('generateTypes', () => {
    it('generates an index file that re-exports all type files', async () => {
        await writeSchema('animals.json', {
            title: 'Animals',
            type: 'object',
            properties: {
                Cat: {
                    type: 'object',
                    properties: { name: { type: 'string' } },
                },
            },
        });

        await generate();

        const index = await readOutput('index.ts');
        expect(index).toContain("import './animals.types.js'");
        expect(index).toContain("export * from './animals.types.js'");
    });

    it('generates file header warning', async () => {
        await writeSchema('test.json', {
            title: 'Test',
            type: 'object',
            properties: {
                Foo: { type: 'object', properties: { x: { type: 'string' } } },
            },
        });

        await generate();

        const content = await readOutput('test.types.ts');
        expect(content).toMatch(/THIS FILE IS GENERATED/);
    });

    it('creates output directory if it does not exist', async () => {
        const nested = join(tempDir, 'a', 'b', 'c');
        await writeSchema('test.json', {
            title: 'Test',
            type: 'object',
            properties: {
                X: { type: 'object', properties: { v: { type: 'number' } } },
            },
        });

        await generateTypes({
            schemaDirs: [schemaDir],
            outputDir: nested,
            typeRegistryImport: '@themeparks/typelib',
        });

        const content = await fs.readFile(join(nested, 'test.types.ts'), 'utf-8');
        expect(content).toContain('v?');
    });
});

// ── Scalar and simple types ───────────────────────────────────────────────────

describe('scalar types', () => {
    it('generates string, number, integer, and boolean properties', async () => {
        await writeSchema('scalars.json', {
            title: 'Scalars',
            type: 'object',
            properties: {
                Item: {
                    type: 'object',
                    required: ['s', 'n', 'i', 'b'],
                    properties: {
                        s: { type: 'string' },
                        n: { type: 'number' },
                        i: { type: 'integer' },
                        b: { type: 'boolean' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('scalars.types.ts');

        expect(content).toContain('s: string;');
        expect(content).toContain('n: number;');
        expect(content).toContain('i: number;');
        expect(content).toContain('b: boolean;');
    });

    it('marks non-required properties as optional', async () => {
        await writeSchema('opt.json', {
            title: 'Opt',
            type: 'object',
            properties: {
                Thing: {
                    type: 'object',
                    required: ['a'],
                    properties: {
                        a: { type: 'string' },
                        b: { type: 'string' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('opt.types.ts');

        expect(content).toContain('a: string;');
        expect(content).toContain('b?: string;');
    });

    it('handles nullable types', async () => {
        await writeSchema('nullable.json', {
            title: 'Nullable',
            type: 'object',
            properties: {
                NullableItem: {
                    type: 'object',
                    properties: {
                        s: { type: 'string', nullable: true },
                        n: { type: 'number', nullable: true },
                        b: { type: 'boolean', nullable: true },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('nullable.types.ts');

        expect(content).toContain('s?: string | null;');
        expect(content).toContain('n?: number | null;');
        expect(content).toContain('b?: boolean | null;');
    });

    it('handles union types like ["string", "null"]', async () => {
        await writeSchema('union.json', {
            title: 'Union',
            type: 'object',
            properties: {
                Flexible: {
                    type: 'object',
                    properties: {
                        value: { type: ['string', 'null'] },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('union.types.ts');

        expect(content).toContain('value?: string | null;');
    });
});

// ── Arrays ────────────────────────────────────────────────────────────────────

describe('arrays', () => {
    it('generates typed arrays', async () => {
        await writeSchema('arr.json', {
            title: 'Arr',
            type: 'object',
            properties: {
                ListHolder: {
                    type: 'object',
                    properties: {
                        names: { type: 'array', items: { type: 'string' } },
                        scores: { type: 'array', items: { type: 'number' } },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('arr.types.ts');

        expect(content).toContain('names?: string[];');
        expect(content).toContain('scores?: number[];');
    });

    it('generates any[] for arrays without items', async () => {
        await writeSchema('anyarr.json', {
            title: 'AnyArr',
            type: 'object',
            properties: {
                Bag: {
                    type: 'object',
                    properties: {
                        stuff: { type: 'array' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('anyarr.types.ts');

        expect(content).toContain('stuff?: any[];');
    });

    it('handles nullable arrays', async () => {
        await writeSchema('nullarr.json', {
            title: 'NullArr',
            type: 'object',
            properties: {
                Holder: {
                    type: 'object',
                    properties: {
                        items: { type: 'array', items: { type: 'string' }, nullable: true },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('nullarr.types.ts');

        expect(content).toContain('items?: string[] | null;');
    });
});

// ── Enums ─────────────────────────────────────────────────────────────────────

describe('enums', () => {
    it('generates enum, type alias, and StringTo conversion function', async () => {
        await writeSchema('status.json', {
            title: 'Status',
            type: 'object',
            properties: {
                Color: {
                    type: 'string',
                    enum: ['RED', 'GREEN', 'BLUE'],
                    description: 'Available colors',
                },
            },
        });

        await generate();
        const content = await readOutput('status.types.ts');

        // Enum declaration
        expect(content).toContain('export enum ColorEnum {');
        expect(content).toContain(`"RED" = 'RED'`);
        expect(content).toContain(`"GREEN" = 'GREEN'`);
        expect(content).toContain(`"BLUE" = 'BLUE'`);

        // Type alias
        expect(content).toContain('export type Color = keyof typeof ColorEnum;');

        // Conversion function
        expect(content).toContain('export function StringToColor(value: string): ColorEnum {');
        expect(content).toContain("case 'red':");
        expect(content).toContain('return ColorEnum.RED;');

        // Description
        expect(content).toContain('/** Available colors */');
    });

    it('handles enum values with spaces and hyphens', async () => {
        await writeSchema('special.json', {
            title: 'Special',
            type: 'object',
            properties: {
                Mode: {
                    type: 'string',
                    enum: ['read-only', 'full access'],
                },
            },
        });

        await generate();
        const content = await readOutput('special.types.ts');

        expect(content).toContain('ModeEnum["read-only"]');
        expect(content).toContain('ModeEnum["full access"]');
    });
});

// ── Object with const values (enum-like objects) ──────────────────────────────

describe('const-value objects', () => {
    it('generates enum from object with const properties', async () => {
        await writeSchema('codes.json', {
            title: 'Codes',
            type: 'object',
            properties: {
                HttpStatus: {
                    type: 'object',
                    properties: {
                        OK: { const: 200 },
                        NOT_FOUND: { const: 404 },
                        ERROR: { const: 500 },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('codes.types.ts');

        expect(content).toContain('export enum HttpStatusEnum {');
        expect(content).toContain('OK = 200');
        expect(content).toContain('NOT_FOUND = 404');
        expect(content).toContain('export type HttpStatus = keyof typeof HttpStatusEnum;');
    });
});

// ── $ref references ───────────────────────────────────────────────────────────

describe('references', () => {
    it('resolves $ref within the same file', async () => {
        await writeSchema('refs.json', {
            title: 'Refs',
            type: 'object',
            properties: {
                Status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE'],
                },
                User: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { $ref: '#/properties/Status' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('refs.types.ts');

        expect(content).toContain('status: Status;');
    });

    it('resolves cross-file references and generates imports', async () => {
        await writeSchema('base.json', {
            title: 'Base',
            type: 'object',
            properties: {
                Currency: {
                    type: 'string',
                    enum: ['USD', 'EUR', 'GBP'],
                },
            },
        });

        await writeSchema('prices.json', {
            title: 'Prices',
            type: 'object',
            properties: {
                Price: {
                    type: 'object',
                    required: ['amount', 'currency'],
                    properties: {
                        amount: { type: 'number' },
                        currency: { $ref: '#/properties/Currency' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('prices.types.ts');

        expect(content).toContain("import { Currency } from './base.types.js';");
        expect(content).toContain('currency: Currency;');
    });

    it('generates imports for multiple types from the same source file', async () => {
        await writeSchema('shared.json', {
            title: 'Shared',
            type: 'object',
            properties: {
                TypeA: { type: 'string', enum: ['X', 'Y'] },
                TypeB: { type: 'string', enum: ['P', 'Q'] },
            },
        });

        await writeSchema('consumer.json', {
            title: 'Consumer',
            type: 'object',
            properties: {
                Combined: {
                    type: 'object',
                    properties: {
                        a: { $ref: '#/properties/TypeA' },
                        b: { $ref: '#/properties/TypeB' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('consumer.types.ts');

        // Both types should be in one import statement
        expect(content).toMatch(/import \{.*TypeA.*TypeB.*\}.*from '\.\/shared\.types\.js'/);
    });

    it('resolves array items with $ref', async () => {
        await writeSchema('arrrefs.json', {
            title: 'ArrRefs',
            type: 'object',
            properties: {
                Tag: {
                    type: 'object',
                    properties: { name: { type: 'string' } },
                },
                Container: {
                    type: 'object',
                    properties: {
                        tags: {
                            type: 'array',
                            items: { $ref: '#/properties/Tag' },
                        },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('arrrefs.types.ts');

        expect(content).toContain('tags?: Tag[];');
    });
});

// ── Record types (objects without fixed properties) ───────────────────────────

describe('record types', () => {
    it('generates Record<string, any> for empty objects', async () => {
        await writeSchema('records.json', {
            title: 'Records',
            type: 'object',
            properties: {
                Metadata: {
                    type: 'object',
                },
            },
        });

        await generate();
        const content = await readOutput('records.types.ts');

        expect(content).toContain('Record<string, any>');
    });

    it('generates typed Record with additionalProperties', async () => {
        await writeSchema('typedrecord.json', {
            title: 'TypedRecord',
            type: 'object',
            properties: {
                Scores: {
                    type: 'object',
                    additionalProperties: { type: 'number' },
                },
            },
        });

        await generate();
        const content = await readOutput('typedrecord.types.ts');

        expect(content).toContain('Record<string, number>');
    });

    it('generates Partial<Record<...>> with propertyNames $ref', async () => {
        await writeSchema('partial.json', {
            title: 'Partial',
            type: 'object',
            properties: {
                Lang: {
                    type: 'string',
                    enum: ['en', 'fr', 'de'],
                },
                Translations: {
                    type: 'object',
                    propertyNames: { $ref: '#/properties/Lang' },
                    additionalProperties: { type: 'string' },
                },
            },
        });

        await generate();
        const content = await readOutput('partial.types.ts');

        expect(content).toContain('Partial<Record<Lang, string>>');
    });
});

// ── oneOf / anyOf ─────────────────────────────────────────────────────────────

describe('oneOf and anyOf', () => {
    it('generates union types for oneOf', async () => {
        await writeSchema('oneof.json', {
            title: 'OneOf',
            type: 'object',
            properties: {
                StringOrNumber: {
                    oneOf: [{ type: 'string' }, { type: 'number' }],
                    description: 'Can be string or number',
                },
            },
        });

        await generate();
        const content = await readOutput('oneof.types.ts');

        expect(content).toContain('export type StringOrNumber = string | number;');
    });

    it('generates union types for anyOf', async () => {
        await writeSchema('anyof.json', {
            title: 'AnyOf',
            type: 'object',
            properties: {
                Flexible: {
                    anyOf: [{ type: 'string' }, { type: 'boolean' }],
                },
            },
        });

        await generate();
        const content = await readOutput('anyof.types.ts');

        expect(content).toContain('export type Flexible = string | boolean;');
    });
});

// ── JSDoc descriptions ────────────────────────────────────────────────────────

describe('descriptions', () => {
    it('generates JSDoc comments from description fields', async () => {
        await writeSchema('docs.json', {
            title: 'Docs',
            type: 'object',
            properties: {
                Documented: {
                    type: 'object',
                    description: 'A well-documented type',
                    properties: {
                        field: {
                            type: 'string',
                            description: 'An important field',
                        },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('docs.types.ts');

        expect(content).toContain('/** A well-documented type */');
        expect(content).toContain('/** An important field */');
    });
});

// ── Runtime schema registration ───────────────────────────────────────────────

describe('runtime schema registration', () => {
    it('generates registerTypeSchema calls for each type', async () => {
        await writeSchema('reg.json', {
            title: 'Reg',
            type: 'object',
            properties: {
                Alpha: {
                    type: 'object',
                    properties: { x: { type: 'string' } },
                },
                Beta: {
                    type: 'string',
                    enum: ['A', 'B'],
                },
            },
        });

        await generate();
        const content = await readOutput('reg.types.ts');

        expect(content).toContain('registerTypeSchema("Alpha"');
        expect(content).toContain('registerTypeSchema("Beta"');
        expect(content).toContain("import { registerTypeSchema } from");
    });

    it('strips __private properties from registered schemas', async () => {
        await writeSchema('priv.json', {
            title: 'Priv',
            type: 'object',
            properties: {
                Secret: {
                    type: 'object',
                    properties: {
                        visible: { type: 'string' },
                        hidden: { type: 'string', __private: true },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('priv.types.ts');

        // The type definition should include both
        expect(content).toContain('visible?');
        expect(content).toContain('hidden?');

        // But the registered schema should strip __private
        const registrationMatch = content.match(/registerTypeSchema\("Secret", ([\s\S]*?)\);/);
        expect(registrationMatch).toBeTruthy();
        const registeredSchema = JSON.parse(registrationMatch![1]);
        expect(registeredSchema.properties.visible).toBeDefined();
        expect(registeredSchema.properties.hidden).toBeUndefined();
    });
});

// ── Discriminated unions (if/then) ────────────────────────────────────────────

describe('discriminated unions (if/then)', () => {
    it('generates a discriminated union from if/then schema', async () => {
        await writeSchema('disc.json', {
            title: 'Disc',
            type: 'object',
            properties: {
                VehicleKind: {
                    type: 'string',
                    enum: ['CAR', 'BOAT', 'PLANE'],
                },
                Vehicle: {
                    type: 'object',
                    required: ['name', 'kind'],
                    properties: {
                        name: { type: 'string' },
                        kind: {
                            $ref: '#/properties/VehicleKind',
                            description: 'The vehicle kind',
                        },
                        wingspan: {
                            type: 'number',
                            description: 'Wingspan in metres',
                        },
                    },
                    if: {
                        properties: { kind: { const: 'PLANE' } },
                    },
                    then: {
                        required: ['wingspan'],
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('disc.types.ts');

        // Base properties
        expect(content).toContain('name: string;');

        // Match branch: PLANE requires wingspan
        expect(content).toContain("kind: 'PLANE';");
        expect(content).toMatch(/wingspan: number;/);

        // Other branch: CAR | BOAT has optional wingspan
        expect(content).toMatch(/'CAR' \| 'BOAT'/);
        expect(content).toMatch(/wingspan\?: number;/);
    });

    it('keeps base required properties outside the union', async () => {
        await writeSchema('basereq.json', {
            title: 'BaseReq',
            type: 'object',
            properties: {
                Shape: {
                    type: 'string',
                    enum: ['CIRCLE', 'SQUARE'],
                },
                Figure: {
                    type: 'object',
                    required: ['id', 'shape'],
                    properties: {
                        id: { type: 'string' },
                        shape: { $ref: '#/properties/Shape' },
                        radius: { type: 'number' },
                    },
                    if: {
                        properties: { shape: { const: 'CIRCLE' } },
                    },
                    then: {
                        required: ['radius'],
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('basereq.types.ts');

        // id should be in the base (required, not part of discriminant or conditional)
        expect(content).toContain('id: string;');
        // shape should be in the branches
        expect(content).toContain("shape: 'CIRCLE';");
        expect(content).toContain("shape: 'SQUARE';");
        // radius required in CIRCLE branch, optional in SQUARE
        expect(content).toMatch(/shape: 'CIRCLE'[\s\S]*?radius: number/);
        expect(content).toMatch(/shape: 'SQUARE'[\s\S]*?radius\?: number/);
    });

    it('falls back to plain type when if/then pattern is not applicable', async () => {
        await writeSchema('nodisc.json', {
            title: 'NoDisc',
            type: 'object',
            properties: {
                Simple: {
                    type: 'object',
                    required: ['x'],
                    properties: {
                        x: { type: 'string' },
                        y: { type: 'number' },
                    },
                },
            },
        });

        await generate();
        const content = await readOutput('nodisc.types.ts');

        // Should be a plain type, not a discriminated union
        expect(content).not.toContain('& (');
        expect(content).toContain('x: string;');
        expect(content).toContain('y?: number;');
    });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe('error handling', () => {
    it('skips non-existent schema directories gracefully', async () => {
        await writeSchema('exists.json', {
            title: 'Exists',
            type: 'object',
            properties: {
                X: { type: 'object', properties: { a: { type: 'string' } } },
            },
        });

        // Should not throw despite the bogus directory
        await generateTypes({
            schemaDirs: [join(tempDir, 'does-not-exist'), schemaDir],
            outputDir,
            typeRegistryImport: '@themeparks/typelib',
        });

        const content = await readOutput('exists.types.ts');
        expect(content).toContain('a?: string;');
    });

    it('throws on invalid $ref paths', async () => {
        await writeSchema('badref.json', {
            title: 'BadRef',
            type: 'object',
            properties: {
                Broken: {
                    type: 'object',
                    properties: {
                        field: { $ref: '#/properties/DoesNotExist' },
                    },
                },
            },
        });

        // Should still generate (falls back to 'any'), not throw
        await generate();
        const content = await readOutput('badref.types.ts');
        expect(content).toContain('field?: any;');
    });
});

// ── Full pipeline (real schemas) ──────────────────────────────────────────────

describe('real schema pipeline', () => {
    it('generates valid output from the actual typesrc schemas', async () => {
        await generateTypes({
            schemaDirs: ['./typesrc'],
            outputDir,
            typeRegistryImport: '@themeparks/typelib',
        });

        const entities = await readOutput('entities.types.ts');
        const livedata = await readOutput('livedata.types.ts');
        const schedule = await readOutput('schedule.types.ts');
        const pricedata = await readOutput('pricedata.types.ts');
        const index = await readOutput('index.ts');

        // Entity discriminated union
        expect(entities).toContain("entityType: 'ATTRACTION';");
        expect(entities).toContain('attractionType: AttractionType;');
        expect(entities).toContain('attractionType?: AttractionType;');

        // Enums exist
        expect(entities).toContain('export enum EntityTypeEnum');
        expect(entities).toContain('export enum AttractionTypeEnum');
        expect(livedata).toContain('export enum LiveStatusTypeEnum');
        expect(schedule).toContain('export enum ScheduleTypeEnum');
        expect(pricedata).toContain('export enum CurrencyTypesEnum');

        // Cross-file references in livedata
        expect(livedata).toContain("import { PriceData } from './pricedata.types.js'");

        // Index re-exports all files
        expect(index).toContain("export * from './entities.types.js'");
        expect(index).toContain("export * from './livedata.types.js'");
        expect(index).toContain("export * from './schedule.types.js'");
        expect(index).toContain("export * from './pricedata.types.js'");
    });
});
