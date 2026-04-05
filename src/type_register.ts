// Store JSON schemas for runtime type information
const typeMetadataRegistry = new Map<string, any>();

/**
 * Register a JSON schema for runtime type checking
 * @param name The type name (e.g. "Entity")
 * @param schema The JSON schema definition
 */
export function registerTypeSchema(name: string, schema: any): void {
    typeMetadataRegistry.set(name, schema);
}

/**
 * Retrieve the JSON schema for a registered type
 * @param name The type name
 * @returns The JSON schema or undefined if not found
 */
export function getTypeSchema(name: string): any | undefined {
    return typeMetadataRegistry.get(name);
}
