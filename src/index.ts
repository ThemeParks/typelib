/**
 * @module
 * TypeScript definition system for ThemeParks.wiki.
 *
 * Provides generated types, enums, and a runtime schema registry
 * for the ThemeParks.wiki API.
 *
 * @example
 * ```ts
 * import { Entity, LiveData, getTypeSchema } from '@themeparks/typelib';
 *
 * const entity: Entity = {
 *     id: 'park-123',
 *     name: 'Example Park',
 *     entityType: 'PARK',
 *     timezone: 'America/New_York',
 * };
 *
 * const schema = getTypeSchema('Entity');
 * ```
 */

export { registerTypeSchema, getTypeSchema } from './type_register.js';
export * from './types/index.js';
