// Main stub. Expose type register functions and all generated types.

export { registerTypeSchema, getTypeSchema } from './type_register.js';
export * from './types/index.js';

// export the generate types function, for use in build scripts or other projects
export { generateTypes } from './generate_types.js';
