// Store OpenAPI schemas for runtime type information
const typeMetadataRegistry = new Map<string, any>();

/**
 * Register an OpenAPI schema for runtime type checking
 * @param name The type name (e.g. "DestinationsResponse")
 * @param schema The OpenAPI schema definition
 */
export function registerTypeSchema(name: string, schema: any): void {
    typeMetadataRegistry.set(name, schema);
}

/**
 * Retrieve the OpenAPI schema for a registered type
 * @param name The type name
 * @returns The OpenAPI schema or undefined if not found
 */
export function getTypeSchema(name: string): any | undefined {
    return typeMetadataRegistry.get(name);
}
