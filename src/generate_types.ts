// Script to generate TypeScript interface files from JSON schemas

import { promises as fs } from 'fs';
import { join } from 'path';

// Default directories - can be overridden in generateTypes()
const DEFAULT_SCHEMA_DIRS = ['./typesrc'];
const DEFAULT_OUTPUT_DIR = './src/types';
const FILE_HEADER = '// THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY\n\n';

// Simple logger implementation to replace missing './logger.js'
const log = (...args: any[]) => console.log('[TypeGenerator 📜]', ...args);
const error = (...args: any[]) => console.error('[TypeGenerator 📜]', ...args);

interface JSONSchema {
    $schema?: string;
    title?: string;
    type?: string | string[];
    properties?: {
        [key: string]: JSONSchema;
    };
    items?: JSONSchema;
    required?: string[];
    description?: string;
    $ref?: string;
    [key: string]: any; // Allow string indexing for reference lookup
}

interface TypeRegistry {
    [typeName: string]: {
        sourceFile: string;
        schema: JSONSchema;
    }
}

interface ImportTracker {
    imports: Map<string, string>; // Map<sourceFile, typeName>
    referencePath: string[];
}

async function buildTypeRegistry(schemaDirs: string[]): Promise<TypeRegistry> {
    const registry: TypeRegistry = {};
    
    // Process all schema directories
    for (const schemaDir of schemaDirs) {
        try {
            const files = await fs.readdir(schemaDir);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            for (const file of jsonFiles) {
                const schemaPath = join(schemaDir, file);
                const schemaContent = await fs.readFile(schemaPath, 'utf-8');
                const schema: JSONSchema = JSON.parse(schemaContent);

                // Register all top-level types from this file
                for (const [name, typeSchema] of Object.entries(schema.properties || {})) {
                    // If type already exists, log a warning but allow override (later directories take precedence)
                    if (registry[name]) {
                        log(`Warning: Type "${name}" already exists, overriding with version from ${schemaPath}`);
                    }
                    registry[name] = {
                        sourceFile: file.replace('.json', ''),
                        schema: typeSchema
                    };
                }
            }
        } catch (err) {
            // Skip directories that don't exist or can't be read
            log(`Skipping schema directory ${schemaDir}: ${(err as Error).message}`);
        }
    }

    return registry;
}

function resolveReference(ref: string, schema: JSONSchema, registry: TypeRegistry, tracker: ImportTracker): { typeName: string; sourceFile?: string } {
    const refPath = ref.split('/').slice(1);

    // Check if we're in a circular reference
    if (tracker.referencePath.includes(ref)) {
        throw new Error(`Circular reference detected: ${tracker.referencePath.join(' -> ')} -> ${ref}`);
    }
    tracker.referencePath.push(ref);

    try {
        // First try to resolve in current schema
        let referenced: JSONSchema = schema;
        for (const segment of refPath) {
            if (segment === 'properties' && referenced.properties) {
                referenced = referenced.properties;
            } else if (!referenced[segment]) {
                // If segment not found, try alternate paths
                if (segment === 'definitions' && ref.startsWith('#/definitions/')) {
                    // Handle #/definitions/* by looking in properties instead
                    const typeName = refPath[refPath.length - 1];
                    if (schema.properties?.[typeName]) {
                        tracker.referencePath.pop();
                        return { typeName };
                    }
                }

                // If still not found, check registry
                const registryType = registry[segment];
                if (registryType) {
                    tracker.imports.set(registryType.sourceFile, segment);
                    tracker.referencePath.pop();
                    return { typeName: segment, sourceFile: registryType.sourceFile };
                }
                throw new Error(`Invalid reference path: ${ref}`);
            } else {
                referenced = referenced[segment];
            }
        }

        // If we're referencing a property definition, get its type
        const typeName = refPath[refPath.length - 1];
        tracker.referencePath.pop();
        return { typeName };

    } catch (err) {
        tracker.referencePath.pop();
        throw err;
    }
}

function getTypeFromSchema(schema: JSONSchema, rootSchema: JSONSchema, registry: TypeRegistry, tracker: ImportTracker, typeName?: string): string {
    if (schema.enum && Array.isArray(schema.enum)) {
        // Handle enums specially - create union type of string literals
        return schema.enum.map(value => `'${value}'`).join(' | ');
    }

    if (schema.$ref) {
        try {
            const resolved = resolveReference(schema.$ref, rootSchema, registry, tracker);
            return resolved.typeName;
        } catch (err) {
            error(`Error resolving reference: ${schema.$ref}`, err);
            return 'any';
        }
    }

    if (Array.isArray(schema.type)) {
        // Handle union types like ["string", "null"]
        return schema.type.map((t: string) => t === 'null' ? 'null' : t).join(' | ');
    }

    switch (schema.type) {
        case 'string':
            return schema.nullable ? 'string | null' : 'string';
        case 'number':
            return schema.nullable ? 'number | null' : 'number';
        case 'integer':
            return schema.nullable ? 'number | null' : 'number';
        case 'boolean':
            return schema.nullable ? 'boolean | null' : 'boolean';
        case 'array': {
            let arrayType = schema.items
                ? `${getTypeFromSchema(schema.items, rootSchema, registry, tracker)}[]`
                : 'any[]';
            // Handle nullable arrays
            if (schema.nullable) {
                arrayType += ' | null';
            }
            return arrayType;
        }
        case 'object': {
            if (!schema.properties) {
                const recordType = `Record<string, any>`;
                if (typeName) {
                    return `extends ${recordType} {}`;
                }
                return schema.nullable ? `${recordType} | null` : recordType;
            }
            const props: string[] = [];
            for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
                const isRequired = schema.required?.includes(propName);
                const propType = getTypeFromSchema(propSchema, rootSchema, registry, tracker);
                const description = propSchema.description
                    ? `\n    /** ${propSchema.description} */\n    `
                    : '';
                props.push(`${description}${propName}${isRequired ? '' : '?'}: ${propType};`);
            }
            const objType = `{\n    ${props.join('\n    ')}\n}`;
            return schema.nullable ? `(${objType}) | null` : objType;
        }
        default:
            return 'any';
    }
}

function generateRuntimeSchemaExport(schema: JSONSchema): string {
    // Generate the runtime schema registration code
    let output = '\n// Runtime Schema Registration\n';
    output += 'import { registerTypeSchema } from "../type_register.js";\n\n';

    // For each top-level type, register its schema
    for (const [name, typeSchema] of Object.entries(schema.properties || {})) {
        // remove any properties that have "__private" set to true. Recusively.
        const cleanSchema = JSON.parse(JSON.stringify(typeSchema, (key, value) => {
            // if any value is an object with "__private" set to true, remove it
            if (value && typeof value === 'object' && value.__private) {
                return undefined; // Remove this property
            }
            return value;
        }));
        output += `registerTypeSchema("${name}", ${JSON.stringify(cleanSchema, null, 2)});\n\n`;
    }

    return output;
}

async function generateTypeFile(schemaPath: string, registry: TypeRegistry, outputDir: string): Promise<void> {
    log(`Generating types for schema: ${schemaPath}`);
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    const schema: JSONSchema = JSON.parse(schemaContent);

    let output = FILE_HEADER;

    // Track imports needed for this file
    const tracker: ImportTracker = {
        imports: new Map<string, string>(),
        referencePath: []
    };

    // Generate interfaces and types for top-level properties
    for (const [name, typeSchema] of Object.entries(schema.properties || {})) {
        const description = typeSchema.description
            ? `/** ${typeSchema.description} */\n`
            : '';

        if (typeSchema.type === 'object' && typeSchema.properties) {
            // Handle objects with const values (like HttpStatusCode)
            const hasConstValues = Object.entries(typeSchema.properties).some(([_, prop]) => prop.const !== undefined);
            if (hasConstValues) {
                output += `export enum ${name}Enum {\n`;
                Object.entries(typeSchema.properties).forEach(([key, prop]) => {
                    output += `    ${key} = ${prop.const},\n`;
                });
                output += `}\n\n`;
                output += `${description}export type ${name} = keyof typeof ${name}Enum;\n\n`;
                continue;
            }
        }

        if (typeSchema.enum && Array.isArray(typeSchema.enum)) {
            // generate a native enum for enum types
            output += `export enum ${name}Enum {\n`;
            typeSchema.enum.forEach((value: string) => {
                output += `    "${value}" = '${value}',\n`;
            });
            output += `}\n\n`;

            // Also generate enum type
            output += `${description}export type ${name} = keyof typeof ${name}Enum;\n\n`;

            // Also generate a StringTo${name} function
            output += `// Function to convert string to ${name}Enum\n`;
            output += `export function StringTo${name}(value: string): ${name}Enum {\n`;
            output += `    const lowerValue = value.toLowerCase();\n`;
            output += `    switch (lowerValue) {\n`;
            typeSchema.enum.forEach((value: string) => {
                if (value) {
                    output += `        case '${value.toLowerCase()}':\n`;
                    if (value.includes(' ')) {
                        // Handle spaces in enum values
                        output += `            return ${name}Enum["${value}"];\n`;
                    } else {
                        output += `            return ${name}Enum.${value};\n`;
                    }
                }
            });
            output += `    }\n`;
            output += `    throw new Error('Unknown ${name} value: ' + value);\n`;
            output += `}\n\n`;
        } else if (typeSchema.type === 'object' || typeSchema.allOf) {
            // Handle inheritance with allOf
            if (typeSchema.allOf) {
                const baseType = typeSchema.allOf.find((t: JSONSchema) => t.$ref)?.$ref?.split('/').pop();
                const interfaceContent = typeSchema.properties?.data
                    ? getTypeFromSchema(typeSchema.properties.data, schema, registry, tracker)
                    : '{}';

                if (baseType === 'AdminResponse') {
                    // For types extending AdminResponse, use the data type as generic parameter
                    output += `${description}export interface ${name} extends ${baseType}<${interfaceContent}> {}\n\n`;
                } else if (baseType) {
                    output += `${description}export interface ${name} extends ${baseType} ${getTypeFromSchema(typeSchema, schema, registry, tracker)}\n\n`;
                } else {
                    output += `${description}export interface ${name} ${getTypeFromSchema(typeSchema, schema, registry, tracker, name)}\n\n`;
                }
            } else {
                // Generate regular interface type
                if (name === 'AdminResponse') {
                    // Make AdminResponse generic with data type as parameter
                    output += `${description}export interface ${name}<T = any> {\n    success: boolean;\n    data: T;\n}\n\n`;
                } else {
                    const typeStr = getTypeFromSchema(typeSchema, schema, registry, tracker, name);
                    if (typeStr.startsWith('extends')) {
                        output += `${description}export interface ${name} ${typeStr}\n\n`;
                    } else {
                        output += `${description}export type ${name} = ${typeStr}\n\n`;
                    }
                }
            }
        }
    }

    // Add imports
    const currentFile = schemaPath.split(/[\/\\]/).pop()!.replace('.json', '');
    const imports = Array.from(tracker.imports.entries())
        .filter(([file]) => file !== currentFile)
        .map(([file, typeName]) => `import { ${typeName} } from './${file}.types.js';`);

    if (imports.length > 0) {
        // Replace header with imports and re-add header once
        output = output.replace(FILE_HEADER, FILE_HEADER + imports.join('\n') + '\n\n');
    }

    output += generateRuntimeSchemaExport(schema);

    // Write to output file
    // Get just the filename without path and convert to .types.ts
    const baseFileName = schemaPath.split(/[\/\\]/).pop()!.replace('.json', '.types.ts');
    const fileName = join(outputDir, baseFileName);
    await fs.writeFile(fileName, output);
    log(`Generated ${fileName}`);
}

async function generateIndexFile(files: string[], outputDir: string): Promise<void> {
    let output = FILE_HEADER;

    // Add imports to trigger schema registration
    output += '// Import all type files to trigger schema registration\n';
    files.forEach(file => {
        const baseFileName = file.replace('.json', '.types.js');
        output += `import './${baseFileName}';\n`;
    });
    output += '\n';

    // Add re-exports
    output += '// Re-export types\n';
    files.forEach(file => {
        const baseFileName = file.replace('.json', '.types.js');
        output += `export * from './${baseFileName}';\n`;
    });

    await fs.writeFile(join(outputDir, 'index.ts'), output);
    log('Generated index.ts');
}

/**
 * Generate TypeScript types from JSON schemas
 * @param schemaDirs Array of directories containing JSON schema files (default: ['./typesrc'])
 * @param outputDir Directory to output generated TypeScript files (default: './src/types')
 */
export async function generateTypes({
    schemaDirs = DEFAULT_SCHEMA_DIRS,
    outputDir = DEFAULT_OUTPUT_DIR
} = {}): Promise<void> {
    try {
        log(`Generating types from schema directories: ${schemaDirs.join(', ')}`);
        log(`Output directory: ${outputDir}`);

        // First build the type registry from all schema directories
        const registry = await buildTypeRegistry(schemaDirs);

        // make sure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Collect all JSON files from all schema directories
        const allJsonFiles: string[] = [];
        const processedFiles = new Set<string>(); // Track processed filenames to avoid duplicates

        for (const schemaDir of schemaDirs) {
            try {
                const files = await fs.readdir(schemaDir);
                const jsonFiles = files.filter(f => f.endsWith('.json'));

                // Generate type files with cross-file reference support
                for (const file of jsonFiles) {
                    const schemaPath = join(schemaDir, file);
                    await generateTypeFile(schemaPath, registry, outputDir);
                    
                    // Track this filename for the index file (avoid duplicates)
                    if (!processedFiles.has(file)) {
                        allJsonFiles.push(file);
                        processedFiles.add(file);
                    }
                }
            } catch (err) {
                log(`Skipping schema directory ${schemaDir}: ${(err as Error).message}`);
            }
        }

        // Generate index.ts with all processed files
        await generateIndexFile(allJsonFiles, outputDir);

        log('Type generation complete!');
    } catch (err) {
        error('Error generating types:', err);
        process.exit(1);
    }
}

async function run() {
    await generateTypes({
        schemaDirs: DEFAULT_SCHEMA_DIRS,
        outputDir: DEFAULT_OUTPUT_DIR
    });
}

run();
