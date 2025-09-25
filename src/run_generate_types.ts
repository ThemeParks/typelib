import { generateTypes } from './generate_types.js';
import { resolve } from 'path';

await generateTypes({
    schemaDirs: [resolve('./typesrc')],
    outputDir: './src/types',
    typeRegistryImport: '../type_register.js',
});
